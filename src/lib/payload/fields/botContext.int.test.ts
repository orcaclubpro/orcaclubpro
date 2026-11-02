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

  // ── Payload-level money lock for MCP requests (access/mcpMoney.ts) ───────────
  // These call the Local API directly — no MCP tool in the way — to prove Payload
  // itself refuses the write once the request is marked as MCP.

  const MCP_REJECT = /read-only for MCP requests/

  async function moneyFixture() {
    const pkg: any = await payload.create({
      collection: 'packages',
      data: {
        name: 'Money Proposal',
        type: 'proposal',
        status: 'draft',
        clientAccount: clientAccountId,
        hourlyRate: 150,
        lineItems: [{ name: 'Build', price: 3000, adjustedPrice: 2800, quantity: 1, stripePriceId: 'price_secret_1' }],
      } as any,
      user: staff, // admin, normal login
      overrideAccess: false,
    })
    return pkg
  }

  test('MCP-flagged Payload update of package line-item price is rejected (context.viaMcp)', async () => {
    const pkg = await moneyFixture()
    const row = { ...pkg.lineItems[0], price: 1 }
    await expect(
      payload.update({ collection: 'packages', id: pkg.id, data: { lineItems: [row] } as any, context: { viaMcp: true } }),
    ).rejects.toThrow(MCP_REJECT)
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems[0].price).toBe(3000)
  })

  test('MCP-flagged Payload update is rejected inside runAsMcp (the path the MCP tools use)', async () => {
    const { runAsMcp } = await import('@/lib/payload/access/mcpMoney')
    const pkg = await moneyFixture()
    for (const data of [
      { hourlyRate: 1 },
      { status: 'accepted' },
      { lineItems: [{ ...pkg.lineItems[0], adjustedPrice: 1 }] },
      { lineItems: [{ ...pkg.lineItems[0], stripePriceId: 'price_evil' }] },
    ]) {
      await expect(
        runAsMcp(() => payload.update({ collection: 'packages', id: pkg.id, data: data as any })),
      ).rejects.toThrow(MCP_REJECT)
    }
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.hourlyRate).toBe(150)
    expect(back.status).toBe('draft')
    expect(back.lineItems[0].adjustedPrice).toBe(2800)
    expect(back.lineItems[0].stripePriceId).toBe('price_secret_1')
  })

  test('MCP-flagged non-money update still succeeds (no false positive)', async () => {
    const { runAsMcp } = await import('@/lib/payload/access/mcpMoney')
    const pkg = await moneyFixture()
    await runAsMcp(() => payload.update({ collection: 'packages', id: pkg.id, data: { notes: 'bot note' } as any }))
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.notes).toBe('bot note')
    expect(back.lineItems[0].stripePriceId).toBe('price_secret_1')
  })

  test('MCP-flagged create with a price or Stripe id is rejected; $0 draft is allowed', async () => {
    await expect(
      payload.create({
        collection: 'packages',
        data: { name: 'bot priced', lineItems: [{ name: 'x', price: 500 }] } as any,
        context: { viaMcp: true },
      }),
    ).rejects.toThrow(MCP_REJECT)
    const ok: any = await payload.create({
      collection: 'packages',
      data: { name: 'bot zero', type: 'template', status: 'draft', lineItems: [{ name: 'x', price: 0 }] } as any,
      context: { viaMcp: true },
    })
    expect(ok.id).toBeTruthy()
  })

  test('MCP-flagged Payload write of retainer fees is rejected', async () => {
    const db = payload.db as any
    const r = await db.collections.retainers.create({ clientAccount: clientAccountId, tier: 'basic', status: 'active', monthlyFee: 1000, overageRate: 120 })
    for (const data of [{ monthlyFee: 1 }, { overageRate: 1 }, { proposedMonthlyFee: 1 }, { pendingOverageRate: 1 }]) {
      await expect(
        payload.update({ collection: 'retainers', id: String(r._id), data: data as any, context: { viaMcp: true } }),
      ).rejects.toThrow(MCP_REJECT)
    }
  })

  test('MCP-flagged Payload write of order Stripe/price fields is rejected', async () => {
    const db = payload.db as any
    const lineItems = [{ name: 'Build', price: 100, quantity: 1 }]
    const o = await db.collections.orders.create({ clientAccount: clientAccountId, amount: 100, status: 'pending', lineItems })
    const id = String(o._id)
    const current: any = await payload.findByID({ collection: 'orders', id })
    for (const data of [
      { stripeInvoiceId: 'in_evil', lineItems: current.lineItems },
      { status: 'paid', lineItems: current.lineItems },
      { lineItems: [{ ...current.lineItems[0], price: 1 }] },
    ]) {
      await expect(payload.update({ collection: 'orders', id, data: data as any, context: { viaMcp: true } })).rejects.toThrow(
        MCP_REJECT,
      )
    }
  })

  test('MCP-flagged Payload write of client stripeCustomerId is rejected', async () => {
    await expect(
      payload.update({
        collection: 'client-accounts',
        id: clientAccountId,
        data: { stripeCustomerId: 'cus_evil' } as any,
        context: { viaMcp: true },
      }),
    ).rejects.toThrow(MCP_REJECT)
  })

  test('admin on an OAuth (MCP) token is treated as MCP: money field access denied and hook rejects', async () => {
    const pkg = await moneyFixture()
    const oauthAdmin = { ...staff, _strategy: 'oauth-access-token' }
    // overrideAccess:false → field access drops the price silently.
    await payload.update({
      collection: 'packages',
      id: pkg.id,
      data: { hourlyRate: 1 } as any,
      user: oauthAdmin,
      overrideAccess: false,
    }).catch(() => undefined)
    // overrideAccess:true (server-action style) → the hook rejects.
    await expect(
      payload.update({ collection: 'packages', id: pkg.id, data: { hourlyRate: 2 } as any, user: oauthAdmin }),
    ).rejects.toThrow(MCP_REJECT)
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.hourlyRate).toBe(150)
  })

  test('only admin with a normal login can update money fields (role user is denied by field access)', async () => {
    const pkg = await moneyFixture()
    await payload.update({ collection: 'packages', id: pkg.id, data: { hourlyRate: 99 } as any, user: staffUser, overrideAccess: false })
    let back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.hourlyRate).toBe(150)
    await payload.update({ collection: 'packages', id: pkg.id, data: { hourlyRate: 175 } as any, user: staff, overrideAccess: false })
    back = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.hourlyRate).toBe(175)
  })

  // ── Package line-item Stripe ids are staff-only (fields/packageStripeIds.ts) ──

  test('client cannot read lineItems.stripePriceId (API path, overrideAccess:false)', async () => {
    const pkg = await moneyFixture()
    const doc: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: client, overrideAccess: false })
    expect(doc.lineItems[0].price).toBe(3000)
    expect(doc.lineItems[0].stripePriceId).toBeUndefined()
    expect(JSON.stringify(doc)).not.toContain('price_secret_1')
  })

  test('portal/page reads (no user or client user) never include lineItems.stripePriceId', async () => {
    const pkg = await moneyFixture()
    const anon: any = await payload.findByID({ collection: 'packages', id: pkg.id })
    const asClient: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: client })
    const list = await payload.find({ collection: 'packages', where: { id: { equals: pkg.id } } })
    expect(JSON.stringify([anon, asClient, list.docs])).not.toContain('price_secret_1')
    const staffDoc: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staffUser, overrideAccess: false })
    expect(staffDoc.lineItems[0].stripePriceId).toBe('price_secret_1')
  })

  test('non-staff update does not wipe lineItems.stripePriceId', async () => {
    const pkg = await moneyFixture()
    await payload.update({ collection: 'packages', id: pkg.id, data: { name: 'renamed by server' } as any })
    const stripped: any = await payload.findByID({ collection: 'packages', id: pkg.id })
    await payload.update({ collection: 'packages', id: pkg.id, data: { lineItems: stripped.lineItems } as any })
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.name).toBe('renamed by server')
    expect(back.lineItems[0].stripePriceId).toBe('price_secret_1')
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
