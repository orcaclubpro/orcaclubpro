/**
 * Integration test: botContext never reaches a client, and MCP writes reject
 * price/Stripe fields and a missing actor. Boots the real Payload config.
 *
 * LOCAL DB ONLY. Runs only when TEST_DATABASE_URI points at a local mongod, e.g.
 *   TEST_DATABASE_URI=mongodb://127.0.0.1:27018/orcaclub_botctx_test bun test botContext
 * Otherwise every test is skipped. It never falls back to DATABASE_URI, because
 * payload.config.ts defaults an unset DATABASE_URI to production. The test
 * database is dropped at the end.
 *
 * Users and the client account are inserted through the raw mongoose models, so
 * no Users/ClientAccounts hooks run (no Stripe customer, no welcome email).
 */
import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'
import type { Payload } from 'payload'

const TEST_DB = process.env.TEST_DATABASE_URI ?? ''
const IS_LOCAL = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/[\w-]+$/.test(TEST_DB)
const d = IS_LOCAL ? describe : describe.skip

const CTX = {
  brief: 'Internal brief: margin is thin, push back on scope',
  repo: 'orcaclubpro',
  branch: 'vp/secret-branch',
  liveUrl: 'https://preview.internal',
  decisions: 'Chance: no discount',
  notes: 'internal notes',
  ownerBot: 'vegapunk',
}

let payload: Payload
let staff: any // role admin
let staffUser: any // role user (non-admin staff), assigned to the project
let client: any
let clientAccountId: string
let projectId: string
let packageId: string
let taskId: string

const asUser = (doc: any) => ({ ...doc, id: String(doc._id ?? doc.id), collection: 'users' })

d('botContext lockdown + MCP write guard (local DB)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URI = TEST_DB
    // Bun's built-in undici lacks Agent#compose, which Payload's upload safeFetch
    // calls at module load. Uploads are not exercised here, so stub just that.
    mock.module('undici', () => ({
      Agent: class {
        compose() {
          return this
        }
      },
      fetch: globalThis.fetch,
    }))
    // Bun's ICU data lacks some legacy zone names (America/Buenos_Aires) that
    // Payload's default timezone list validates against at init.
    const supported = Intl.supportedValuesOf.bind(Intl)
    ;(Intl as any).supportedValuesOf = (key: Parameters<typeof Intl.supportedValuesOf>[0]) =>
      key === 'timeZone' ? Object.assign(supported(key), { includes: () => true }) : supported(key)
    // Lexical's ESM entry uses top-level await inside an import cycle that Bun's
    // loader cannot initialise (TDZ on DecoratorNode). No rich-text field is
    // exercised here, so swap in a minimal editor adapter for this test only.
    const stubEditor = () => async () => ({
      CellComponent: '',
      FieldComponent: '',
      validate: () => true as const,
    })
    mock.module('@payloadcms/richtext-lexical', () => ({
      lexicalEditor: stubEditor,
      FixedToolbarFeature: () => ({}),
      InlineToolbarFeature: () => ({}),
      HeadingFeature: () => ({}),
    }))
    process.env.PAYLOAD_SECRET ||= 'local-test-secret-not-real'
    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    payload = await getPayload({ config })

    const db = payload.db as any
    const ca = await db.collections['client-accounts'].create({ name: 'Leak Test Co', email: 'leak@test.local' })
    clientAccountId = String(ca._id)
    const staffDoc = await db.collections.users.create({ email: 'staff@test.local', role: 'admin', username: 'staff-t' })
    const staffUserDoc = await db.collections.users.create({
      email: 'staff-user@test.local',
      role: 'user',
      username: 'staff-u',
    })
    const clientDoc = await db.collections.users.create({
      email: 'client@test.local',
      role: 'client',
      username: 'client-t',
      clientAccount: ca._id,
    })
    staff = asUser(staffDoc.toObject())
    staffUser = asUser(staffUserDoc.toObject())
    client = { ...asUser(clientDoc.toObject()), clientAccount: clientAccountId }

    // Staff create the records with botContext, as the portal/admin would.
    const project = await payload.create({
      collection: 'projects',
      data: {
        name: 'Leak Project',
        client: clientAccountId,
        assignedTo: [staffUser.id, client.id],
        botContext: CTX,
      } as any,
      user: staff,
      overrideAccess: false,
      context: { skipActivityLog: true },
    })
    projectId = String(project.id)

    const pkg = await payload.create({
      collection: 'packages',
      data: {
        name: 'Leak Proposal',
        type: 'proposal',
        status: 'draft',
        clientAccount: clientAccountId,
        projectRef: projectId,
        botContext: CTX,
      } as any,
      user: staff,
      overrideAccess: false,
    })
    packageId = String(pkg.id)

    const task = await payload.create({
      collection: 'tasks',
      data: {
        title: 'Leak Task',
        project: projectId,
        assignedTo: client.id,
        botContext: CTX,
      } as any,
      user: staff,
      overrideAccess: false,
    })
    taskId = String(task.id)
  }, 120_000)

  afterAll(async () => {
    if (!payload) return
    const conn = (payload.db as any).connection
    // Guard again before dropping: only ever a local test database.
    if (IS_LOCAL && conn?.db) await conn.db.dropDatabase()
    await payload.db.destroy?.()
  })

  const ids = () => ({ packages: packageId, projects: projectId, tasks: taskId }) as const

  test('staff can read botContext and updatedAt is stamped', async () => {
    for (const [collection, id] of Object.entries(ids())) {
      const doc: any = await payload.findByID({ collection: collection as any, id, user: staff, overrideAccess: false })
      expect(doc.botContext?.brief).toBe(CTX.brief)
      expect(doc.botContext?.ownerBot).toBe('vegapunk')
      expect(typeof doc.botContext?.updatedAt).toBe('string')
    }
  })

  test('non-admin staff (role user) can read botContext on an assigned project', async () => {
    const doc: any = await payload.findByID({ collection: 'projects', id: projectId, user: staffUser, overrideAccess: false })
    expect(doc.botContext?.brief).toBe(CTX.brief)
  })

  test('client cannot read botContext: overrideAccess:false + client user', async () => {
    for (const [collection, id] of Object.entries(ids())) {
      const doc: any = await payload.findByID({ collection: collection as any, id, user: client, overrideAccess: false })
      expect(doc.id).toBe(id)
      expect(doc.botContext).toBeUndefined()
      expect(JSON.stringify(doc)).not.toContain(CTX.brief)
    }
  })

  test('client cannot read botContext: overrideAccess:true with client user (portal loader path)', async () => {
    for (const [collection, id] of Object.entries(ids())) {
      const doc: any = await payload.findByID({ collection: collection as any, id, user: client })
      expect(doc.botContext).toBeUndefined()
    }
  })

  test('no-user read strips botContext (timelines, PDFs, recaps path)', async () => {
    for (const [collection, id] of Object.entries(ids())) {
      const doc: any = await payload.findByID({ collection: collection as any, id })
      expect(doc.botContext).toBeUndefined()
      const list = await payload.find({ collection: collection as any, where: { id: { equals: id } } })
      expect(JSON.stringify(list.docs)).not.toContain(CTX.brief)
    }
  })

  test('populated relationships strip botContext (package → project, task → project)', async () => {
    const pkg: any = await payload.findByID({ collection: 'packages', id: packageId, depth: 2, user: client })
    expect(typeof pkg.projectRef).toBe('object')
    expect(pkg.projectRef.botContext).toBeUndefined()
    const task: any = await payload.findByID({ collection: 'tasks', id: taskId, depth: 2 })
    expect(typeof task.project).toBe('object')
    expect(task.project.botContext).toBeUndefined()
    expect(JSON.stringify([pkg, task])).not.toContain(CTX.brief)
  })

  test('client cannot write botContext: overrideAccess:false update is ignored', async () => {
    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { botContext: { brief: 'client was here' } } as any,
      user: client,
      overrideAccess: false,
      context: { skipActivityLog: true },
    })
    const doc: any = await payload.findByID({ collection: 'projects', id: projectId, user: staff, overrideAccess: false })
    expect(doc.botContext.brief).toBe(CTX.brief)
  })

  test('client cannot write botContext: overrideAccess:true with client user is stripped', async () => {
    await payload.update({
      collection: 'packages',
      id: packageId,
      data: { botContext: { brief: 'client was here' } } as any,
      user: client,
    })
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: { botContext: { brief: 'anon was here' } } as any,
    })
    const pkg: any = await payload.findByID({ collection: 'packages', id: packageId, user: staff, overrideAccess: false })
    const task: any = await payload.findByID({ collection: 'tasks', id: taskId, user: staff, overrideAccess: false })
    expect(pkg.botContext.brief).toBe(CTX.brief)
    expect(task.botContext.brief).toBe(CTX.brief)
  })

  test('client cannot create a record carrying botContext', async () => {
    const created: any = await payload.create({
      collection: 'tasks',
      data: { title: 'client-made', project: projectId, assignedTo: client.id, botContext: { brief: 'client ctx' } } as any,
      user: client,
    })
    const back: any = await payload.findByID({ collection: 'tasks', id: created.id, user: staff, overrideAccess: false })
    expect(back.botContext?.brief ?? null).toBeNull()
  })

  test('staff update re-stamps botContext.updatedAt', async () => {
    const before: any = await payload.findByID({ collection: 'tasks', id: taskId, user: staff, overrideAccess: false })
    await new Promise((r) => setTimeout(r, 10))
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: { botContext: { ...before.botContext, notes: 'staff edit' } } as any,
      user: staff,
      overrideAccess: false,
    })
    const after: any = await payload.findByID({ collection: 'tasks', id: taskId, user: staff, overrideAccess: false })
    expect(after.botContext.notes).toBe('staff edit')
    expect(after.botContext.updatedAt > before.botContext.updatedAt).toBe(true)
  })

  // ── MCP write tools (real McpServer, in-memory transport) ────────────────────

  async function mcpClient() {
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js')
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js')
    const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js')
    const { registerOrcaclubTools } = await import('@/lib/mcp/tools')
    const server = new McpServer({ name: 'test', version: '0.0.0' })
    registerOrcaclubTools(server)
    const [a, b] = InMemoryTransport.createLinkedPair()
    const c = new Client({ name: 't', version: '0' })
    await Promise.all([server.connect(a), c.connect(b)])
    return c
  }

  /** A call is rejected if the SDK throws (invalid params) or returns isError. */
  async function rejected(c: any, name: string, args: Record<string, unknown>): Promise<string> {
    try {
      const res = await c.callTool({ name, arguments: args })
      expect(res.isError).toBe(true)
      return JSON.stringify(res.content)
    } catch (e) {
      return e instanceof Error ? e.message : String(e)
    }
  }

  test('MCP create_package rejects a line-item price', async () => {
    const c = await mcpClient()
    const msg = await rejected(c, 'create_package', {
      actor: 'vegapunk',
      name: 'Bot pkg',
      lineItems: [{ name: 'Site', price: 5000 }],
    })
    expect(msg.toLowerCase()).toContain('price')
    const { totalDocs } = await payload.find({ collection: 'packages', where: { name: { equals: 'Bot pkg' } } })
    expect(totalDocs).toBe(0)
  })

  test('MCP create_package rejects a Stripe price id', async () => {
    const c = await mcpClient()
    await rejected(c, 'create_package', {
      actor: 'vegapunk',
      name: 'Bot pkg 2',
      lineItems: [{ name: 'Site', stripePriceId: 'price_123' }],
    })
    const { totalDocs } = await payload.find({ collection: 'packages', where: { name: { equals: 'Bot pkg 2' } } })
    expect(totalDocs).toBe(0)
  })

  test('MCP write tools require a valid actor', async () => {
    const c = await mcpClient()
    await rejected(c, 'toggle_milestone', { projectId, milestoneIndex: 0 })
    await rejected(c, 'toggle_milestone', { projectId, milestoneIndex: 0, actor: 'chance' })
  })

  test('MCP write rejects fields outside the allowlist', async () => {
    const c = await mcpClient()
    const msg = await rejected(c, 'create_milestone', {
      actor: 'shaka',
      projectId,
      title: 'x',
      date: '2026-11-02',
      budget: 100,
    })
    expect(msg).toContain('budget')
  })

  test('rejected MCP write leaves an agent-write activity row with the actor', async () => {
    const c = await mcpClient()
    await rejected(c, 'save_sow', { actor: 'T261101-232341', packageId, sowData: { stripePriceId: 'x' } })
    const { docs } = await payload.find({
      collection: 'activity',
      where: { and: [{ kind: { equals: 'agent-write' } }, { agentActor: { equals: 'T261101-232341' } }] },
    })
    expect(docs.length).toBeGreaterThan(0)
    expect(docs[0]?.tool).toBe('save_sow')
  })
})
