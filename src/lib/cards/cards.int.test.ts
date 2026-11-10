/**
 * Cards DB (CARDS_DATABASE_URI): parsers always run; the rest drives the real MCP
 * tools with the real Payload config against a disposable local mongod.
 *
 * LOCAL DB ONLY. Runs only when TEST_DATABASE_URI points at a local mongod, e.g.
 *   TEST_DATABASE_URI=mongodb://127.0.0.1:27099/orcaclub_cards_test bun test cards.int
 * Cards go to <that db>_cards. Both databases are dropped at the end.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Collection, MongoClient, type Db } from 'mongodb'
import type { Payload } from 'payload'

import { eventsAdded, parseCard, parseEventLine } from '@/lib/cards/parse'
import { plainTextToLexical } from '@/lib/tasks/richText'

const TEST_DB = process.env.TEST_DATABASE_URI ?? ''
const IS_LOCAL = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/[\w-]+$/.test(TEST_DB)
const d = IS_LOCAL ? describe : describe.skip
const CARDS_URI = `${TEST_DB}_cards`
const REFUSED_URI = 'mongodb://127.0.0.1:1/refused_cards'

const SHA = 'a'.repeat(64)
const cardDescription = (slug: string, version = 1) =>
  [
    `Request: ${slug} v${version} (approved by Chance in tasks channel 111, request message 222, prompt message 333)`,
    `Title: ${slug}`,
    'Ask: build it',
    'Deliverables: the build',
    'Checklist:',
    '- [ ] works',
    '',
    `Request message: 222 | Prompt message: 333 | Prompt sha256: ${SHA}`,
    '',
    `<<<BUILD-PROMPT sha256=${SHA}`,
    'line one',
    'next: not an event, it is inside the prompt',
    'BUILD-PROMPT>>>',
  ].join('\n')
const PLAIN_DESCRIPTION = 'Ask: plain task\nDeliverables: a thing\nChecklist:\n- [ ] done'

describe('cards parsers', () => {
  test('parseCard reads the requestintake description', () => {
    expect(parseCard(cardDescription('my-card', 3))).toEqual({
      slug: 'my-card',
      version: 3,
      discordMessageId: '222',
      threadId: '222',
      promptSha: SHA,
      promptText: 'line one\nnext: not an event, it is inside the prompt',
      status: 'approved',
      approvals: [{ by: 'Chance', channelId: '111', messageId: '222' }],
    })
  })

  test('parseCard ignores a task that is not a request card', () => {
    expect(parseCard(PLAIN_DESCRIPTION)).toBeNull()
    expect(parseCard(undefined)).toBeNull()
  })

  test('parseEventLine maps each kind and keeps the whole line', () => {
    expect(parseEventLine('next [dev]: shaka: QA it')).toEqual({ kind: 'next', text: 'next [dev]: shaka: QA it' })
    expect(parseEventLine('left off 7:40 PT: built | next: test')).toEqual({
      kind: 'left-off',
      text: 'left off 7:40 PT: built | next: test',
    })
    expect(parseEventLine('result: shipped')?.kind).toBe('result')
    expect(parseEventLine('decision: use plan B')?.kind).toBe('decision')
    expect(parseEventLine('Title: not one')).toBeNull()
    expect(parseEventLine('next:')).toBeNull()
  })

  test('eventsAdded records only new lines, counting repeats', () => {
    const before = plainTextToLexical('Ask: x\nnext: a\nresult: old')
    expect(eventsAdded(before, 'Ask: x\nnext: a\nresult: old')).toEqual([])
    expect(eventsAdded(before, 'Ask: x\nnext: a\nresult: old\nnext: a').map((e) => e.text)).toEqual(['next: a'])
    expect(eventsAdded(before, 'next: a\nchatter\ndecision: b').map((e) => e.kind)).toEqual(['decision'])
  })
})

d('cards DB through the MCP tools (local DB)', () => {
  let payload: Payload
  let mcpCaller: any = null
  let staff: any
  let projectId: string
  let clientId: string
  let cardsDb: Db
  let inspector: MongoClient
  let cards: typeof import('@/lib/cards/db')
  const tools: Record<string, (input: any) => Promise<any>> = {}
  let errors: ReturnType<typeof spyOn>

  const call = async (name: string, input: Record<string, unknown>) => {
    const res = await tools[name]!(input)
    return { isError: Boolean(res.isError), body: JSON.parse(res.content[0].text) }
  }
  const create = async (description: string, title = 'Cards task') => {
    const res = await call('task_create', { actor: 'orca', title, description, projectId })
    expect(res.isError).toBe(false)
    return { id: String(res.body.task.id), description: String(res.body.task.description) }
  }
  const setUri = async (uri: string | undefined) => {
    await cards.closeCardsDb()
    if (uri === undefined) delete process.env.CARDS_DATABASE_URI
    else process.env.CARDS_DATABASE_URI = uri
  }
  const cardLogs = () => errors.mock.calls.map((c: unknown[]) => String(c[0])).filter((m: string) => m.startsWith('[cards-db]'))

  beforeAll(async () => {
    process.env.DATABASE_URI = TEST_DB
    delete process.env.CARDS_DATABASE_URI
    // Same Bun/Payload shims as botContext.int.test.ts (see there for why).
    mock.module('undici', () => ({
      Agent: class {
        compose() {
          return this
        }
      },
      fetch: globalThis.fetch,
    }))
    const supported = Intl.supportedValuesOf.bind(Intl)
    ;(Intl as any).supportedValuesOf = (key: Parameters<typeof Intl.supportedValuesOf>[0]) =>
      key === 'timeZone' ? Object.assign(supported(key), { includes: () => true }) : supported(key)
    const stubEditor = () => async () => ({ CellComponent: '', FieldComponent: '', validate: () => true as const })
    mock.module('@payloadcms/richtext-lexical', () => ({
      lexicalEditor: stubEditor,
      FixedToolbarFeature: () => ({}),
      InlineToolbarFeature: () => ({}),
      HeadingFeature: () => ({}),
    }))
    process.env.PAYLOAD_SECRET ||= 'local-test-secret-not-real'
    mock.module('@/lib/payload/get-current-user', () => ({ getAuthenticatedUser: async () => mcpCaller }))
    mock.module('next/cache', () => ({
      revalidatePath: () => undefined,
      revalidateTag: () => undefined,
      unstable_cache: (fn: unknown) => fn,
    }))
    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    payload = await getPayload({ config })
    cards = await import('@/lib/cards/db')
    const { registerOrcaclubTools } = await import('@/lib/mcp/tools')
    registerOrcaclubTools({ registerTool: (name: string, _meta: unknown, handler: any) => (tools[name] = handler) } as any)

    const db = payload.db as any
    const ca = await db.collections['client-accounts'].create({ name: 'Cards Co', email: 'cards@test.local' })
    clientId = String(ca._id)
    const staffDoc = await db.collections.users.create({ email: 'cards-staff@test.local', role: 'admin', username: 'cards-s' })
    staff = { ...staffDoc.toObject(), id: String(staffDoc._id), collection: 'users' }
    mcpCaller = { ...staff, _strategy: 'oauth-access-token' }
    const project = await payload.create({
      collection: 'projects',
      data: { name: 'Cards Project', client: clientId } as any,
      user: staff,
      overrideAccess: false,
      context: { skipActivityLog: true },
    })
    projectId = String(project.id)

    inspector = new MongoClient(CARDS_URI)
    await inspector.connect()
    cardsDb = inspector.db()
  }, 120_000)

  beforeEach(() => {
    errors = spyOn(console, 'error')
  })

  afterEach(async () => {
    errors.mockRestore()
    await setUri(undefined)
    await cardsDb.collection('cards').deleteMany({})
    await cardsDb.collection('task_events').deleteMany({})
  })

  afterAll(async () => {
    delete process.env.CARDS_DATABASE_URI
    await cards?.closeCardsDb()
    if (inspector) {
      await cardsDb.dropDatabase()
      await inspector.close()
    }
    if (!payload) return
    const conn = (payload.db as any).connection
    if (IS_LOCAL && conn?.db) await conn.db.dropDatabase()
    await payload.db.destroy?.()
  })

  test('unset: writes behave as before, nothing connects or logs, reads say disabled', async () => {
    const connect = spyOn(MongoClient.prototype, 'connect')
    const task = await create(cardDescription('unset-card'))
    const updated = await call('task_update', {
      actor: 'orca',
      id: task.id,
      description: `${task.description}\n\nnext: shaka: QA it`,
    })
    const added = await call('task_add_items', { actor: 'orca', id: task.id, changes: [{ words: 'result: x', source: 'test' }] })
    expect(updated.isError).toBe(false)
    expect(updated.body.task.description).toContain('next: shaka: QA it')
    expect(added.isError).toBe(false)
    expect(connect).not.toHaveBeenCalled()
    connect.mockRestore()
    expect(cardLogs()).toEqual([])
    expect(await cardsDb.collection('cards').countDocuments()).toBe(0)

    expect((await call('card_get', { slug: 'unset-card' })).body).toMatchObject({ success: true, enabled: false, card: null })
    expect((await call('card_list', { taskId: task.id })).body).toMatchObject({ success: true, enabled: false, cards: [] })
    expect((await call('task_events', { taskId: task.id })).body).toMatchObject({ success: true, enabled: false, events: [] })
  }, 20_000)

  test('set: task_create writes a card with plain string ids; a plain task writes none', async () => {
    await setUri(CARDS_URI)
    const task = await create(cardDescription('set-card', 2))
    const card = await cardsDb.collection('cards').findOne({ slug: 'set-card', version: 2 })
    expect(card).toMatchObject({
      taskId: task.id,
      projectId,
      clientAccountId: clientId,
      discordMessageId: '222',
      threadId: '222',
      promptSha: SHA,
      status: 'approved',
    })
    expect(card!.promptText).toContain('line one')
    await create(PLAIN_DESCRIPTION, 'Plain')
    expect(await cardsDb.collection('cards').countDocuments()).toBe(1)
    expect(cardLogs()).toEqual([])
  }, 20_000)

  test('set: appended lines write one event each; repeats and create-time lines write none', async () => {
    await setUri(CARDS_URI)
    const task = await create(cardDescription('event-card'))
    expect(await cardsDb.collection('task_events').countDocuments()).toBe(0)

    const description = [
      task.description,
      'next [dev]: shaka: QA it',
      'left off 7:40 PT: built | next: test | commit: abc',
      'result: shipped',
      'decision: use plan B',
    ].join('\n\n')
    await call('task_update', { actor: 'edison', id: task.id, description })
    await call('task_update', { actor: 'edison', id: task.id, description })
    await call('task_update', { actor: 'edison', id: task.id, status: 'in-progress' })

    const rows = await cardsDb.collection('task_events').find({ taskId: task.id }).toArray()
    expect(rows.map((r) => r.kind).sort()).toEqual(['decision', 'left-off', 'next', 'result'])
    expect(rows.find((r) => r.kind === 'left-off')!.text).toBe('left off 7:40 PT: built | next: test | commit: abc')
    for (const r of rows) {
      expect(r).toMatchObject({ taskId: task.id, projectId, clientAccountId: clientId, actor: 'edison' })
      expect(r.at).toBeInstanceOf(Date)
    }
  }, 20_000)

  test('set: task_add_items records note lines, not its automatic change line', async () => {
    await setUri(CARDS_URI)
    const task = await create(PLAIN_DESCRIPTION)
    await call('task_add_items', {
      actor: 'orca',
      id: task.id,
      askUpdates: [{ words: 'decision: scope down', source: 'chance' }],
      changes: [
        { words: 'next: shaka: QA', source: 'test' },
        { words: 'just chatter', source: 'test' },
      ],
    })
    const rows = await cardsDb.collection('task_events').find({ taskId: task.id }).toArray()
    expect(rows.map((r) => r.kind).sort()).toEqual(['decision', 'next'])
  }, 20_000)

  test.each([
    ['refused connect', REFUSED_URI],
    ['bad URI', 'not-a-mongo-uri'],
    ['URI with no database name', 'mongodb://127.0.0.1:27099'],
  ])('failure (%s): the task write still lands, logged without the URI', async (_label, uri) => {
    await setUri(uri)
    const task = await create(cardDescription('fail-card'))
    const description = `${task.description}\n\nnext: shaka: still lands`
    const updated = await call('task_update', { actor: 'orca', id: task.id, description })
    const added = await call('task_add_items', { actor: 'orca', id: task.id, changes: [{ words: 'result: x', source: 'test' }] })
    expect(updated.isError).toBe(false)
    expect(added.isError).toBe(false)
    const stored: any = await payload.findByID({ collection: 'tasks', id: task.id, user: staff, overrideAccess: false })
    expect(JSON.stringify(stored.description)).toContain('still lands')
    expect(cardLogs().length).toBeGreaterThanOrEqual(3)
    for (const line of cardLogs()) expect(line).not.toContain(uri)
    expect(await cardsDb.collection('cards').countDocuments()).toBe(0)
  }, 30_000)

  test('failure mid-write: a rejected insert does not break the task write', async () => {
    await setUri(CARDS_URI)
    const task = await create(PLAIN_DESCRIPTION)
    const insert = spyOn(Collection.prototype, 'insertMany').mockImplementation(async () => {
      throw new Error('boom mongodb://u:p@host/db')
    })
    const res = await call('task_update', { actor: 'orca', id: task.id, description: `${task.description}\n\nnext: a: b` })
    insert.mockRestore()
    expect(res.isError).toBe(false)
    expect(cardLogs()).toEqual(['[cards-db] event write failed: boom [uri]'])
  }, 20_000)

  test('reads: card_get, card_list and task_events when set', async () => {
    await setUri(CARDS_URI)
    const v1 = await create(cardDescription('read-card', 1))
    const v2 = await create(cardDescription('read-card', 2))
    await call('task_update', { actor: 'orca', id: v2.id, description: `${v2.description}\n\nnext: one: first` })
    const after = (await call('task_get', { id: v2.id })).body.task.description
    await call('task_update', { actor: 'orca', id: v2.id, description: `${after}\n\nresult: second` })

    const newest = (await call('card_get', { slug: 'read-card' })).body
    expect(newest).toMatchObject({ enabled: true, card: { version: 2, taskId: v2.id } })
    expect(newest.card._id).toBeUndefined()
    expect((await call('card_get', { slug: 'read-card', version: 1 })).body.card.taskId).toBe(v1.id)
    expect((await call('card_get', { slug: 'no-such-card' })).body).toMatchObject({ enabled: true, card: null })

    const listed = (await call('card_list', { taskId: v2.id })).body
    expect(listed.cards.map((c: any) => c.version)).toEqual([2])

    const events = (await call('task_events', { taskId: v2.id })).body
    expect(events.events.map((e: any) => e.kind)).toEqual(['result', 'next'])
    expect((await call('task_events', { taskId: v2.id, limit: 1 })).body.events).toHaveLength(1)
    expect((await call('task_events', { taskId: v1.id })).body.events).toEqual([])
  }, 20_000)

  test('reads: a client is refused, and a down cards DB is a plain error without the URI', async () => {
    await setUri(CARDS_URI)
    const task = await create(cardDescription('gate-card'))
    const saved = mcpCaller
    mcpCaller = { ...staff, role: 'client', _strategy: 'oauth-access-token' }
    const refused = await call('card_get', { slug: 'gate-card' })
    mcpCaller = saved
    expect(refused).toMatchObject({ isError: true, body: { error: 'Unauthorized' } })

    await setUri(REFUSED_URI)
    const down = await call('task_events', { taskId: task.id })
    expect(down.isError).toBe(true)
    expect(down.body.error).toContain('Cards database is unavailable')
    expect(JSON.stringify(down.body)).not.toContain('127.0.0.1')
  }, 20_000)
})
