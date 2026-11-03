/**
 * Integration test: structured task fields (board 6aea1fd4). Intake on
 * task_create (refuses an empty task, accepts a 20-item one, accepts the text
 * template and copies it into the fields), ask locked after create,
 * task_add_items appends atomically under concurrency and patches rows by id,
 * legacy tasks stay untouched and readable, and a client never sees the fields.
 * Boots the real Payload config.
 *
 * LOCAL DB ONLY. Runs only when TEST_DATABASE_URI points at a local mongod, e.g.
 *   TEST_DATABASE_URI=mongodb://127.0.0.1:27018/orcaclub_structure_test bun test structure.int
 * Otherwise every test is skipped. It never falls back to DATABASE_URI, because
 * payload.config.ts defaults an unset DATABASE_URI to production. The test
 * database is dropped at the end.
 */
import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'
import type { Payload } from 'payload'

const TEST_DB = process.env.TEST_DATABASE_URI ?? ''
const IS_LOCAL = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/[\w-]+$/.test(TEST_DB)
const d = IS_LOCAL ? describe : describe.skip

let payload: Payload
let mcpCaller: any = null
let staff: any
let client: any
let projectId: string
let actions: typeof import('@/actions/taskTracking')

const asUser = (doc: any) => ({ ...doc, id: String(doc._id ?? doc.id), collection: 'users' })
const BOTS = ['gojo', 'vegapunk', 'edison', 'shaka', 'finn', 'orca', 'mothership', 'sia'] as const

async function newTask(title: string, data: Record<string, unknown> = {}): Promise<string> {
  const task = await payload.create({
    collection: 'tasks',
    data: { title, project: projectId, assignedTo: client.id, ...data } as any,
    user: staff,
    overrideAccess: false,
  })
  return String(task.id)
}

d('structured task fields (local DB)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URI = TEST_DB
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
    actions = await import('@/actions/taskTracking')

    const db = payload.db as any
    const ca = await db.collections['client-accounts'].create({ name: 'Structure Co', email: 'structure@test.local' })
    const staffDoc = await db.collections.users.create({ email: 'staff@test.local', role: 'admin', username: 'staff-c' })
    const clientDoc = await db.collections.users.create({
      email: 'client@test.local',
      role: 'client',
      username: 'client-c',
      clientAccount: ca._id,
    })
    staff = asUser(staffDoc.toObject())
    mcpCaller = { ...staff, _strategy: 'oauth-access-token' }
    client = { ...asUser(clientDoc.toObject()), clientAccount: String(ca._id) }

    const project = await payload.create({
      collection: 'projects',
      data: { name: 'Structure Project', client: String(ca._id), assignedTo: [client.id] } as any,
      user: staff,
      overrideAccess: false,
      context: { skipActivityLog: true },
    })
    projectId = String(project.id)
  }, 120_000)

  afterAll(async () => {
    if (!payload) return
    const conn = (payload.db as any).connection
    if (IS_LOCAL && conn?.db) await conn.db.dropDatabase()
    await payload.db.destroy?.()
  })

  const FULL = {
    ask: 'Chance: show me the checklist',
    deliverables: [{ text: 'a plan' }],
    checklist: [{ text: 'tests green' }],
  }

  test('intake: an empty task is refused, nothing is saved', async () => {
    const before = await payload.count({ collection: 'tasks', overrideAccess: true })
    const r: any = await actions.createTrackedTask({ actor: 'orca', title: 'Empty', projectId })
    expect(r.success).toBe(false)
    expect(r.code).toBe('intake')
    expect(r.missing).toEqual(['Ask', 'Deliverables', 'Checklist'])
    expect((await payload.count({ collection: 'tasks', overrideAccess: true })).totalDocs).toBe(before.totalDocs)
  })

  test('intake: a 20-item checklist is accepted (no cap)', async () => {
    const checklist = Array.from({ length: 20 }, (_, i) => ({ text: `item ${i}` }))
    const r: any = await actions.createTrackedTask({ actor: 'orca', title: 'Big', projectId, ...FULL, checklist })
    expect(r.success).toBe(true)
    expect(r.task.checklist).toHaveLength(20)
    expect(r.task.progress).toMatchObject({ structured: true, checklist: '0/20', deliverables: '0/1' })
    expect(r.task.summary).toBe('v1, dev 0/21, cm 0/0, fin 0/0')
    expect(r.task.checklist[0]).toMatchObject({ status: 'open', owner: 'dev', addedBy: 'orca', line: '- [ ] [dev] item 0 — added by orca' })
    for (const row of r.task.checklist) expect(row.id).toMatch(/^[a-f0-9]{24}$/)
  })

  test('intake: the text template is still accepted and copied into the fields', async () => {
    const description = 'Ask: fix the header\nDeliverables: (1) the fix; (2) a #qa post\nChecklist:\n- [ ] builds\n- [x] smoke. Proof: shot\nnext: orca: go'
    const r: any = await actions.createTrackedTask({ actor: 'orca', title: 'Text', projectId, description })
    expect(r.success).toBe(true)
    expect(r.task.ask).toBe('fix the header')
    expect(r.task.deliverables.map((d: any) => d.text)).toEqual(['the fix', 'a #qa post'])
    expect(r.task.checklist.map((c: any) => [c.text, c.status, c.proof])).toEqual([
      ['builds', 'open', null],
      ['smoke.', 'done', 'shot'],
    ])
    expect(r.task.description).toContain('next: orca: go')
  })

  test('ask is locked after create; setting it on an old task without one is allowed', async () => {
    const r: any = await actions.createTrackedTask({ actor: 'orca', title: 'Locked', projectId, ...FULL })
    const same: any = await actions.updateTrackedTask({ actor: 'orca', id: r.task.id, ask: FULL.ask, title: 'Renamed' })
    expect(same.success).toBe(true)
    const changed: any = await actions.updateTrackedTask({ actor: 'orca', id: r.task.id, ask: 'something else' })
    expect(changed.success).toBe(false)
    expect(changed.error).toContain('locked')
    // the admin/portal path is locked too
    await expect(
      payload.update({ collection: 'tasks', id: r.task.id, data: { ask: 'x' } as any, user: staff, overrideAccess: false }),
    ).rejects.toThrow('locked')
    const legacy = await newTask('Legacy no ask')
    const set: any = await actions.updateTrackedTask({ actor: 'orca', id: legacy, ask: 'backfilled ask' })
    expect(set.success).toBe(true)
    expect(set.task.ask).toBe('backfilled ask')
  })

  test('task_add_items: 8 parallel writers all land, nothing rewritten', async () => {
    const r: any = await actions.createTrackedTask({ actor: 'orca', title: 'Parallel', projectId, ...FULL })
    const id = r.task.id
    const firstId = r.task.checklist[0].id
    const results = await Promise.all(
      BOTS.map((actor, i) =>
        actions.addTaskItems({
          actor,
          id,
          checklist: [{ text: `from ${actor}` }],
          changes: [{ words: `change ${i}`, source: actor }],
        }),
      ),
    )
    expect(results.every((x) => x.success)).toBe(true)
    const t: any = await actions.getTrackedTask(id)
    const task = t.task ?? t
    expect(task.checklist).toHaveLength(1 + BOTS.length)
    expect(task.checklist[0].id).toBe(firstId) // existing rows keep their ids
    // 1 "created" line + per writer: its own change + the auto line
    expect(task.changes).toHaveLength(1 + 2 * BOTS.length)
    expect(new Set(task.changes.slice(1).map((c: any) => c.by))).toEqual(new Set(BOTS))
    expect(task.version).toBe(1 + BOTS.length)
  })

  test('task_add_items: screens dedupe, patches by id, refusals', async () => {
    const r: any = await actions.createTrackedTask({ actor: 'orca', title: 'Screens', projectId, ...FULL })
    const id = r.task.id
    const shot = '/home/chank/dev/orca/qa/ccrecap-shots/abc1234/after-home.png'
    const a: any = await actions.addTaskItems({ actor: 'shaka', id, screens: [{ path: shot, caption: 'home' }] })
    expect(a.success).toBe(true)
    const b: any = await actions.addTaskItems({ actor: 'shaka', id, screens: [{ path: shot }] })
    expect(b.success).toBe(true)
    expect(b.skippedScreens).toEqual([shot])
    expect(b.task.screens).toHaveLength(1)

    const itemId = r.task.checklist[0].id
    const p: any = await actions.addTaskItems({
      actor: 'orca',
      id,
      set: [
        { kind: 'checklist', id: itemId, status: 'done', proof: 'commit abc' },
        { kind: 'screen', id: a.task.screens[0].id, sentToDrive: true },
      ],
    })
    expect(p.success).toBe(true)
    expect(p.task.checklist[0]).toMatchObject({ id: itemId, status: 'done', proof: 'commit abc', text: 'tests green' })
    expect(p.task.screens[0].sentToDrive).toBe(true)
    expect(p.task.progress.checklist).toBe('1/1')

    const bad: any = await actions.addTaskItems({ actor: 'orca', id, set: [{ kind: 'checklist', id: '0'.repeat(24), done: true }] })
    expect(bad.success).toBe(false)
    expect(bad.error).toContain('Not on task')
    const fence: any = await actions.addTaskItems({ actor: 'orca', id, screens: [{ path: '/etc/passwd.png' }] })
    expect(fence.success).toBe(false)
    expect(fence.error).toContain('ccrecap-shots')
  })

  test('legacy text-only tasks are untouched and still readable', async () => {
    const id = await newTask('Old task', { description: undefined })
    const raw = await (payload.db as any).collections.tasks.findOne({ _id: id }).lean()
    for (const f of ['ask', 'lead', 'askUpdates', 'deliverables', 'checklist', 'changes', 'screens', 'version']) {
      const v = raw[f]
      // version defaults to 0 on a fresh Payload create; nothing else is set
      expect(v === undefined || v === null || v === 0 || (Array.isArray(v) && v.length === 0)).toBe(true)
    }
    const t: any = await actions.getTrackedTask(id)
    const task = t.task ?? t
    expect(task.ask).toBeNull()
    expect(task.checklist).toEqual([])
    expect(task.progress.structured).toBe(false)
    // an old task can still be updated without the new fields (no intake on update)
    const u: any = await actions.updateTrackedTask({ actor: 'orca', id, status: 'in-progress' })
    expect(u.success).toBe(true)
  })

  test('a client never sees the structured fields', async () => {
    // newTask assigns the client, so the client can read the task itself.
    const id = await newTask('Client view', FULL)
    const added: any = await actions.addTaskItems({ actor: 'orca', id, changes: [{ words: 'w', source: 's' }] })
    expect(added.success).toBe(true)
    expect(added.task.ask).toBe(FULL.ask)
    const doc: any = await payload.findByID({ collection: 'tasks', id, user: client, overrideAccess: false })
    expect(doc.id).toBe(id)
    for (const f of ['ask', 'lead', 'askUpdates', 'deliverables', 'checklist', 'changes', 'screens', 'version']) {
      expect(doc[f]).toBeUndefined()
    }
  })
  test('askUpdates and changes are append-only on every path', async () => {
    const r: any = await actions.createTrackedTask({ actor: 'gojo', title: 'Append only', projectId, ...FULL })
    const id = r.task.id
    const viaUpdate: any = await actions.updateTrackedTask({ actor: 'gojo', id, askUpdates: [{ words: 'x', source: 's' }] } as any)
    expect(viaUpdate.success).toBe(false)
    expect(viaUpdate.error).toContain('append-only')
    const add: any = await actions.addTaskItems({
      actor: 'gojo',
      id,
      askUpdates: [{ words: 'also cover cm', source: 'Chance, Development 11:52 AM PT' }],
    })
    expect(add.success).toBe(true)
    expect(add.task.askUpdates).toHaveLength(1)
    // admin/portal path: dropping or rewriting existing rows is refused
    await expect(
      payload.update({ collection: 'tasks', id, data: { askUpdates: [] } as any, user: staff, overrideAccess: false }),
    ).rejects.toThrow('append-only')
    await expect(
      payload.update({ collection: 'tasks', id, data: { changes: [] } as any, user: staff, overrideAccess: false }),
    ).rejects.toThrow('append-only')
  })

  test('every edit bumps version and writes a changes line with date and actor', async () => {
    const r: any = await actions.createTrackedTask({ actor: 'gojo', title: 'Versioned', projectId, ...FULL })
    const id = r.task.id
    expect(r.task.version).toBe(1)
    expect(r.task.changes.at(-1)).toMatchObject({ by: 'gojo', source: 'auto', words: 'created by gojo' })
    const u: any = await actions.updateTrackedTask({ actor: 'vegapunk', id, priority: 'high', lead: 'orca' })
    expect(u.task.version).toBe(2)
    expect(u.task.lead).toBe('orca')
    expect(u.task.changes.at(-1)).toMatchObject({ by: 'vegapunk', words: 'updated priority, lead' })
    expect(new Date(u.task.changes.at(-1).at).getTime()).toBeGreaterThan(Date.now() - 60_000)
    const a: any = await actions.addTaskItems({ actor: 'shaka', id, checklist: [{ text: 'qa pass', owner: 'shaka' }] })
    expect(a.task.version).toBe(3)
    expect(a.task.changes.at(-1)).toMatchObject({ by: 'shaka', words: 'shaka: added 1 checklist' })
    expect(a.task.summary).toBe('v3, dev 0/2, cm 0/0, fin 0/0, shaka 0/1')
  })

  test('items: edit, drop (stays visible with reason), reopen, reorder; owner and addedBy kept', async () => {
    const r: any = await actions.createTrackedTask({
      actor: 'gojo',
      title: 'Edit items',
      projectId,
      ask: 'a',
      deliverables: [{ text: 'd1' }, { text: 'd2', owner: 'cm' }],
      checklist: [{ text: 'c1' }, { text: 'c2' }, { text: 'c3', owner: 'cm' }],
    })
    const id = r.task.id
    const [c1, c2, c3] = r.task.checklist.map((c: any) => c.id)
    const e: any = await actions.addTaskItems({
      actor: 'orca',
      id,
      set: [
        { kind: 'checklist', id: c1, text: 'c1 reworded', owner: 'fin' },
        { kind: 'checklist', id: c2, status: 'dropped', dropReason: 'Chance folded it into c1' },
      ],
      order: [{ kind: 'checklist', ids: [c3, c1, c2] }],
    })
    expect(e.success).toBe(true)
    expect(e.reordered).toEqual(['checklist'])
    expect(e.task.checklist.map((c: any) => [c.id, c.text, c.status, c.owner, c.addedBy])).toEqual([
      [c3, 'c3', 'open', 'cm', 'gojo'],
      [c1, 'c1 reworded', 'open', 'fin', 'gojo'],
      [c2, 'c2', 'dropped', 'dev', 'gojo'],
    ])
    expect(e.task.checklist[2].line).toBe('- [~] [dev] c2 — added by gojo — dropped: Chance folded it into c1')
    expect(e.task.summary).toBe('v2, dev 0/1, cm 0/2, fin 0/1')
    const reopened: any = await actions.addTaskItems({ actor: 'orca', id, set: [{ kind: 'checklist', id: c2, status: 'open' }] })
    expect(reopened.task.checklist[2]).toMatchObject({ status: 'open', dropReason: null })
    // an order that does not list every row id once is refused
    const stale: any = await actions.addTaskItems({ actor: 'orca', id, order: [{ kind: 'checklist', ids: [c1, c2] }] })
    expect(stale.success).toBe(false)
    expect(stale.error).toContain('exactly once')
  })

  test('close gate: completes only when every non-dropped dev, cm and fin item is done', async () => {
    const r: any = await actions.createTrackedTask({
      actor: 'gojo',
      title: 'Gate',
      projectId,
      ask: 'a',
      deliverables: [{ text: 'd', owner: 'dev' }],
      checklist: [{ text: 'dev part' }, { text: 'cm part', owner: 'cm' }, { text: 'fin part', owner: 'fin' }],
    })
    const id = r.task.id
    const [d] = r.task.deliverables.map((x: any) => x.id)
    const [dev, cm, fin] = r.task.checklist.map((x: any) => x.id)
    const no: any = await actions.updateTrackedTask({ actor: 'gojo', id, status: 'completed' })
    expect(no.success).toBe(false)
    expect(no.error).toContain('[cm] cm part')
    await actions.addTaskItems({
      actor: 'orca',
      id,
      set: [
        { kind: 'deliverable', id: d, status: 'done', link: 'commit abc' },
        { kind: 'checklist', id: dev, status: 'done', proof: 'test' },
        { kind: 'checklist', id: cm, status: 'done', proof: 'Drive path' },
      ],
    })
    const still: any = await actions.updateTrackedTask({ actor: 'gojo', id, status: 'completed' })
    expect(still.success).toBe(false)
    expect(still.error).toContain('[fin] fin part')
    await actions.addTaskItems({ actor: 'finn', id, set: [{ kind: 'checklist', id: fin, status: 'dropped', dropReason: 'no money' }] })
    const yes: any = await actions.updateTrackedTask({ actor: 'gojo', id, status: 'completed' })
    expect(yes.success).toBe(true)
    // money task without a [fin] item can't close
    const m: any = await actions.createTrackedTask({
      actor: 'gojo',
      title: 'Update menu prices',
      projectId,
      ask: 'new prices',
      deliverables: [{ text: 'd', status: 'done' }],
      checklist: [{ text: 'c', status: 'done' }],
    })
    const mc: any = await actions.updateTrackedTask({ actor: 'gojo', id: m.task.id, status: 'completed' })
    expect(mc.success).toBe(false)
    expect(mc.error).toContain('[fin] money check')
  })

  test('Now block + owner view (dev and cm lanes) + my_work', async () => {
    const description = [
      'Ask: site + client email',
      'Deliverables: x',
      'Checklist:',
      '- [ ] [dev] build',
      '- [ ] [cm] client email',
      'next: orca: old',
      'left off [dev] 12:30 PM PT: schema in | next [dev]: orca: write the tests',
      'next [cm]: gojo: draft the email',
    ].join('\n')
    const r: any = await actions.createTrackedTask({ actor: 'gojo', title: 'Lanes', projectId, description })
    const id = r.task.id
    const full: any = await actions.getTrackedTask(id)
    expect(full.task.now.map((n: any) => n.line)).toEqual([
      'dev · next: orca: write the tests · waiting on: orca · left off 12:30 PM PT: schema in',
      'cm · next: gojo: draft the email · waiting on: gojo',
    ])
    const cm: any = await actions.getTrackedTask(id, 'cm')
    expect(cm.view.ask).toBe('site + client email')
    expect(cm.view.now.map((n: any) => n.lane)).toEqual(['cm'])
    expect(cm.view.openItems.map((i: any) => i.line)).toEqual(['- [ ] [cm] client email — added by gojo'])
    expect(cm.view.lastChanges.length).toBeGreaterThan(0)
    const dev: any = await actions.getTrackedTask(id, 'dev')
    expect(dev.view.openItems.map((i: any) => i.text)).toEqual(['x', 'build']) // untagged deliverable = dev
    expect(dev.view.now[0].next).toBe('write the tests')

    const later: any = await actions.createTrackedTask({
      actor: 'gojo',
      title: 'Second',
      projectId,
      ask: 'b',
      deliverables: [{ text: 'd' }],
      checklist: [{ text: 'cm item', owner: 'cm' }],
    })
    const mine: any = await actions.myWork({ owner: 'cm' })
    expect(mine.success).toBe(true)
    const ids = mine.items.map((t: any) => t.id)
    expect(ids.indexOf(id)).toBeGreaterThanOrEqual(0)
    expect(ids.indexOf(id)).toBeLessThan(ids.indexOf(later.task.id)) // oldest first
    const gojo: any = await actions.myWork({ owner: 'gojo' })
    expect(gojo.items.find((t: any) => t.id === id).now[0].lane).toBe('cm')
  })
})
