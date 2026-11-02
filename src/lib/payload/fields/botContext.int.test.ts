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
import { CUSTOM_LINE_BLOCKED } from './catalogLinePrice'
import { MCP_PROJECT_CLIENT_ID } from '@/lib/mcp/projectScope'

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
/** The user the server actions see as the MCP caller (getAuthenticatedUser is mocked). */
let mcpCaller: any = null
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
    // Server actions resolve their caller from request headers; outside Next there
    // is no request, so hand them the test's MCP caller directly.
    mock.module('@/lib/payload/get-current-user', () => ({ getAuthenticatedUser: async () => mcpCaller }))
    mock.module('next/cache', () => ({
      revalidatePath: () => undefined,
      revalidateTag: () => undefined,
      unstable_cache: (fn: unknown) => fn,
    }))
    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    payload = await getPayload({ config })

    const db = payload.db as any
    const ca = await db.collections['client-accounts'].create({ name: 'Leak Test Co', email: 'leak@test.local' })
    clientAccountId = String(ca._id)
    // The internal client account project_create is pinned to (local test DB only).
    await db.collections['client-accounts'].create({ _id: MCP_PROJECT_CLIENT_ID, name: 'Internal Co', email: 'internal@test.local' })
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
    mcpCaller = { ...staff, _strategy: 'oauth-access-token' } // Chance's admin user on an MCP token
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

  // ── Catalog-only line items for staff/MCP (fields/requireCatalogLines.ts) ────

  /** Run `p` and return the thrown error's status + message (0/'' when it resolves). */
  async function failure(p: Promise<unknown>): Promise<{ status: number; message: string }> {
    try {
      await p
      return { status: 0, message: '' }
    } catch (e: any) {
      return { status: Number(e?.status ?? 0), message: String(e?.message ?? e) }
    }
  }

  test('catalog-only lines: role user adding a line with no service item gets 4xx and the package is unchanged', async () => {
    const pkg = await moneyFixture()
    const { status, message } = await failure(
      payload.update({
        collection: 'packages',
        id: pkg.id,
        data: { lineItems: [pkg.lineItems[0], { name: 'Custom work', quantity: 1 }] } as any,
        user: staffUser,
        overrideAccess: false,
      }),
    )
    expect(status).toBeGreaterThanOrEqual(400)
    expect(status).toBeLessThan(500)
    expect(message).toBe(CUSTOM_LINE_BLOCKED)
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems).toHaveLength(1)
    expect(back.lineItems[0].price).toBe(3000)
  })

  test('catalog-only lines: role user adding an hourly-rate line without hours gets 4xx', async () => {
    const db = payload.db as any
    const si = await db.collections['service-items'].create({ name: 'Dev hours', billingType: 'hourly', defaultRate: 120 })
    const siId = String(si._id)
    const pkg = await moneyFixture()
    const { status, message } = await failure(
      payload.update({
        collection: 'packages',
        id: pkg.id,
        data: { lineItems: [pkg.lineItems[0], { name: 'Dev hours', sourceServiceItem: siId }] } as any,
        user: staffUser,
        overrideAccess: false,
      }),
    )
    expect(status).toBeGreaterThanOrEqual(400)
    expect(status).toBeLessThan(500)
    expect(message).toContain(`Line item 'Dev hours': hourly service item ${siId} needs hours greater than 0`)

    // A service item id that does not exist says so.
    const missing = '0123456789abcdef01234567'
    const gone = await failure(
      payload.update({
        collection: 'packages',
        id: pkg.id,
        data: { lineItems: [pkg.lineItems[0], { name: 'Ghost', sourceServiceItem: missing }] } as any,
        user: staffUser,
        overrideAccess: false,
      }),
    )
    expect(gone.status).toBeGreaterThanOrEqual(400)
    expect(gone.status).toBeLessThan(500)
    expect(gone.message).toContain(`service item ${missing} not found`)
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems).toHaveLength(1)
  })

  test('catalog-only lines: MCP-marked create with a non-catalog line gets 4xx', async () => {
    const { status, message } = await failure(
      payload.create({
        collection: 'packages',
        data: { name: 'bot freeform', type: 'template', status: 'draft', lineItems: [{ name: 'Freeform' }] } as any,
        context: { viaMcp: true },
      }),
    )
    expect(status).toBeGreaterThanOrEqual(400)
    expect(status).toBeLessThan(500)
    expect(message).toBe(CUSTOM_LINE_BLOCKED)
    const { totalDocs } = await payload.find({ collection: 'packages', where: { name: { equals: 'bot freeform' } } })
    expect(totalDocs).toBe(0)
  })

  test('catalog-only lines: MCP create_package with serviceItemId prices the line from defaultPrice', async () => {
    const db = payload.db as any
    const si = await db.collections['service-items'].create({ name: 'Landing page', billingType: 'fixed', defaultPrice: 1800 })
    const c = await mcpClient()
    const res: any = await c.callTool({
      name: 'create_package',
      arguments: {
        actor: 'vegapunk',
        name: 'Bot catalog pkg',
        lineItems: [{ serviceItemId: String(si._id), name: 'Landing page', quantity: 2 }],
      },
    })
    expect(res.isError).toBeFalsy()
    const { docs } = await payload.find({
      collection: 'packages',
      where: { name: { equals: 'Bot catalog pkg' } },
      user: staff,
      overrideAccess: false,
      depth: 0,
    })
    expect(docs).toHaveLength(1)
    const line: any = docs[0]!.lineItems![0]
    expect(line.price).toBe(1800)
    expect(line.quantity).toBe(2)
    expect(String(line.sourceServiceItem)).toBe(String(si._id))
  })

  test('catalog-only lines: MCP create_package with a line missing serviceItemId is rejected', async () => {
    const c = await mcpClient()
    await rejected(c, 'create_package', { actor: 'vegapunk', name: 'Bot no catalog', lineItems: [{ name: 'Site' }] })
    const { totalDocs } = await payload.find({ collection: 'packages', where: { name: { equals: 'Bot no catalog' } } })
    expect(totalDocs).toBe(0)
  })

  test('catalog-only lines: admin on a normal login can still add a custom non-catalog line with a price', async () => {
    const pkg = await moneyFixture()
    await payload.update({
      collection: 'packages',
      id: pkg.id,
      data: { lineItems: [pkg.lineItems[0], { name: 'Custom rush fee', price: 450, quantity: 1 }] } as any,
      user: staff,
      overrideAccess: false,
    })
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems).toHaveLength(2)
    expect(back.lineItems[1].price).toBe(450)
    expect(back.lineItems[1].sourceServiceItem ?? null).toBeNull()
  })

  test('catalog-only lines: MCP list_service_items returns the seeded item', async () => {
    const db = payload.db as any
    const si = await db.collections['service-items'].create({ name: 'Catalog listing probe', billingType: 'fixed', defaultPrice: 777 })
    await db.collections['service-items'].create({ name: 'Archived probe', billingType: 'fixed', defaultPrice: 5, archived: true })
    const c = await mcpClient()
    const res: any = await c.callTool({ name: 'list_service_items', arguments: {} })
    expect(res.isError).toBeFalsy()
    const body = JSON.parse(res.content[0].text)
    const hit = body.items.find((i: any) => i.id === String(si._id))
    expect(hit).toMatchObject({ name: 'Catalog listing probe', billingType: 'fixed', defaultPrice: 777, archived: false })
    expect(body.items.some((i: any) => i.name === 'Archived probe')).toBe(false)
  })

  // ── Hourly catalog lines: price = locked defaultRate × hours (Finn, Nov 2 2026) ──

  async function hourlyItem(rate = 120) {
    const si = await (payload.db as any).collections['service-items'].create({
      name: 'Dev hours',
      billingType: 'hourly',
      defaultRate: rate,
    })
    return String(si._id)
  }

  test('hourly lines: role user adds an hourly line with hours; server prices it rate × hours', async () => {
    const siId = await hourlyItem(120)
    const pkg = await moneyFixture()
    await payload.update({
      collection: 'packages',
      id: pkg.id,
      data: { lineItems: [pkg.lineItems[0], { name: 'Dev hours', sourceServiceItem: siId, hours: 3 }] } as any,
      user: staffUser,
      overrideAccess: false,
    })
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems).toHaveLength(2)
    expect(back.lineItems[1].price).toBe(360)
    expect(back.lineItems[1].hours).toBe(3)
    expect(back.lineItems[1].billingType).toBe('hourly')
    expect(back.lineItems[0].price).toBe(3000) // untouched
  })

  test('hourly lines: role user sending hours 0 or negative gets 4xx and the package is unchanged', async () => {
    const siId = await hourlyItem(120)
    const pkg = await moneyFixture()
    for (const hours of [0, -2]) {
      const { status, message } = await failure(
        payload.update({
          collection: 'packages',
          id: pkg.id,
          data: { lineItems: [pkg.lineItems[0], { name: 'Dev hours', sourceServiceItem: siId, hours }] } as any,
          user: staffUser,
          overrideAccess: false,
        }),
      )
      expect(status).toBeGreaterThanOrEqual(400)
      expect(status).toBeLessThan(500)
      expect(message).toContain('needs hours greater than 0')
    }
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems).toHaveLength(1)
  })

  test('hourly lines: role user cannot price an hourly line themselves (price is still a 403)', async () => {
    const siId = await hourlyItem(120)
    const pkg = await moneyFixture()
    const { status } = await failure(
      payload.update({
        collection: 'packages',
        id: pkg.id,
        data: { lineItems: [pkg.lineItems[0], { name: 'Dev hours', sourceServiceItem: siId, hours: 3, price: 1 }] } as any,
        user: staffUser,
        overrideAccess: false,
      }),
    )
    expect(status).toBe(403)
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems).toHaveLength(1)
  })

  test('hourly lines: changing hours on a stored hourly line re-prices it; hours 0 is rejected', async () => {
    const siId = await hourlyItem(100)
    const pkg = await moneyFixture()
    await payload.update({
      collection: 'packages',
      id: pkg.id,
      data: { lineItems: [pkg.lineItems[0], { name: 'Dev hours', sourceServiceItem: siId, hours: 2 }] } as any,
      user: staffUser,
      overrideAccess: false,
    })
    let back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems[1].price).toBe(200)

    const line = back.lineItems[1]
    await payload.update({
      collection: 'packages',
      id: pkg.id,
      data: { lineItems: [back.lineItems[0], { id: line.id, name: line.name, sourceServiceItem: siId, hours: 5 }] } as any,
      user: staffUser,
      overrideAccess: false,
    })
    back = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems[1].price).toBe(500)
    expect(back.lineItems[1].hours).toBe(5)

    const { status } = await failure(
      payload.update({
        collection: 'packages',
        id: pkg.id,
        data: { lineItems: [back.lineItems[0], { id: line.id, name: line.name, sourceServiceItem: siId, hours: 0 }] } as any,
        user: staffUser,
        overrideAccess: false,
      }),
    )
    expect(status).toBe(400)
    back = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems[1].price).toBe(500)
  })

  test('hourly lines: MCP create_package with an hourly serviceItemId and hours is priced rate × hours', async () => {
    const siId = await hourlyItem(120)
    const c = await mcpClient()
    const res: any = await c.callTool({
      name: 'create_package',
      arguments: {
        actor: 'vegapunk',
        name: 'Bot hourly pkg',
        lineItems: [{ serviceItemId: siId, name: 'Dev hours', hours: 2.5 }],
      },
    })
    expect(res.isError).toBeFalsy()
    const { docs } = await payload.find({
      collection: 'packages',
      where: { name: { equals: 'Bot hourly pkg' } },
      user: staff,
      overrideAccess: false,
      depth: 0,
    })
    expect(docs).toHaveLength(1)
    const line: any = docs[0]!.lineItems![0]
    expect(line.price).toBe(300)
    expect(line.hours).toBe(2.5)
    expect(line.billingType).toBe('hourly')
  })

  test('hourly lines: MCP create_package with an hourly item but no hours is rejected and creates nothing', async () => {
    const siId = await hourlyItem(120)
    const c = await mcpClient()
    const res: any = await c.callTool({
      name: 'create_package',
      arguments: { actor: 'vegapunk', name: 'Bot hourly no hours', lineItems: [{ serviceItemId: siId, name: 'Dev hours' }] },
    })
    expect(res.isError).toBe(true)
    expect(res.content[0].text).toContain('needs hours greater than 0')
    const { totalDocs } = await payload.find({ collection: 'packages', where: { name: { equals: 'Bot hourly no hours' } } })
    expect(totalDocs).toBe(0)
  })

  test('hourly lines: MCP create_package with hours 0 or a price on an hourly line is rejected', async () => {
    const siId = await hourlyItem(120)
    const c = await mcpClient()
    await rejected(c, 'create_package', {
      actor: 'vegapunk',
      name: 'Bot hourly zero',
      lineItems: [{ serviceItemId: siId, name: 'Dev hours', hours: 0 }],
    })
    await rejected(c, 'create_package', {
      actor: 'vegapunk',
      name: 'Bot hourly priced',
      lineItems: [{ serviceItemId: siId, name: 'Dev hours', hours: 2, price: 1 }],
    })
    const { totalDocs } = await payload.find({
      collection: 'packages',
      where: { name: { in: ['Bot hourly zero', 'Bot hourly priced'] } },
    })
    expect(totalDocs).toBe(0)
  })

  test('freeform lines: MCP-marked create with no service item gets the exact custom-line message', async () => {
    const { status, message } = await failure(
      payload.create({
        collection: 'packages',
        data: { name: 'bot custom', type: 'template', status: 'draft', lineItems: [{ name: 'Custom', hours: 3 }] } as any,
        context: { viaMcp: true },
      }),
    )
    expect(status).toBe(400)
    expect(message).toBe('Price comes from the service item. Pick one, or ask Chance for a custom line.')
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

  test('MCP-flagged create with a price or Stripe id is rejected; an unpriced catalog-line draft is allowed', async () => {
    await expect(
      payload.create({
        collection: 'packages',
        data: { name: 'bot priced', lineItems: [{ name: 'x', price: 500 }] } as any,
        context: { viaMcp: true },
      }),
    ).rejects.toThrow(MCP_REJECT)
    // Lines must now come from the catalog (requireCatalogLines); the server fills the price.
    const si = await (payload.db as any).collections['service-items'].create({ name: 'x', billingType: 'fixed', defaultPrice: 300 })
    const ok: any = await payload.create({
      collection: 'packages',
      data: { name: 'bot zero', type: 'template', status: 'draft', lineItems: [{ name: 'x', sourceServiceItem: String(si._id) }] } as any,
      context: { viaMcp: true },
    })
    expect(ok.id).toBeTruthy()
    expect(ok.lineItems[0].price).toBe(300)
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

  test('admin on an OAuth (MCP) token is treated as MCP: 403 naming the fields in both access modes', async () => {
    const pkg = await moneyFixture()
    const oauthAdmin = { ...staff, _strategy: 'oauth-access-token' }
    await expect(
      payload.update({ collection: 'packages', id: pkg.id, data: { hourlyRate: 1 } as any, user: oauthAdmin, overrideAccess: false }),
    ).rejects.toThrow(/packages: money fields are read-only for MCP requests \(hourlyRate\)/)
    await expect(
      payload.update({ collection: 'packages', id: pkg.id, data: { hourlyRate: 2 } as any, user: oauthAdmin }),
    ).rejects.toThrow(MCP_REJECT)
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.hourlyRate).toBe(150)
  })

  test('staff (role user) update including money fields gets 403 naming them, not a silent drop', async () => {
    const pkg = await moneyFixture()
    const row = { ...pkg.lineItems[0], price: 1 }
    let message = ''
    let status = 0
    await payload
      .update({
        collection: 'packages',
        id: pkg.id,
        data: { hourlyRate: 99, name: 'renamed', lineItems: [row] } as any,
        user: staffUser,
        overrideAccess: false,
      })
      .catch((e: any) => {
        message = e.message
        status = e.status
      })
    expect(status).toBe(403)
    expect(message).toContain('read-only for non-admin users')
    expect(message).toContain('hourlyRate')
    expect(message).toContain('.price')
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.hourlyRate).toBe(150)
    expect(back.name).toBe('Money Proposal')
  })

  test('staff (role user) round-trip with unchanged money fields still saves', async () => {
    const pkg = await moneyFixture()
    const asStaffUser: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staffUser, overrideAccess: false })
    await payload.update({
      collection: 'packages',
      id: pkg.id,
      data: { ...asStaffUser, notes: 'staff note' },
      user: staffUser,
      overrideAccess: false,
    })
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.notes).toBe('staff note')
    expect(back.lineItems[0].stripePriceId).toBe('price_secret_1')
  })

  test('MCP update that includes a money field returns 403 naming it before field access runs', async () => {
    const { runAsMcp } = await import('@/lib/payload/access/mcpMoney')
    const pkg = await moneyFixture()
    let status = 0
    let message = ''
    await runAsMcp(() =>
      payload.update({ collection: 'packages', id: pkg.id, data: { status: 'accepted' } as any, user: staff, overrideAccess: false }),
    ).catch((e: any) => {
      status = e.status
      message = e.message
    })
    expect(status).toBe(403)
    expect(message).toContain('read-only for MCP requests (status)')
  })

  test('only an admin with a normal login can update money fields', async () => {
    const pkg = await moneyFixture()
    await payload.update({ collection: 'packages', id: pkg.id, data: { hourlyRate: 175 } as any, user: staff, overrideAccess: false })
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.hourlyRate).toBe(175)
  })

  test('MCP-flagged Payload write of service-item defaultPrice/defaultRate is rejected', async () => {
    const db = payload.db as any
    const si = await db.collections['service-items'].create({ name: 'Audit', billingType: 'fixed', defaultPrice: 500, defaultRate: 120 })
    for (const data of [{ defaultPrice: 1 }, { defaultRate: 1 }]) {
      await expect(
        payload.update({ collection: 'service-items', id: String(si._id), data: data as any, context: { viaMcp: true } }),
      ).rejects.toThrow(/service-items: money fields are read-only for MCP requests \((defaultPrice|defaultRate)\)/)
    }
  })

  test('MCP time entry: snapshot of stored retainer terms is allowed, a tampered overageRateAtLog is rejected', async () => {
    const db = payload.db as any
    const r = await db.collections.retainers.create({
      clientAccount: clientAccountId,
      tier: 'basic',
      status: 'active',
      monthlyFee: 1000,
      overageRate: 120,
      hoursPerMonth: 10,
    })
    const base = {
      retainer: String(r._id),
      clientAccount: clientAccountId,
      date: '2026-11-02T00:00:00.000Z',
      hours: 1,
      status: 'logged',
      category: 'work',
      priority: 'medium',
    }
    const ok: any = await payload.create({
      collection: 'retainer-time-entries',
      data: { ...base, overageRateAtLog: 120, feeAtLog: 1000 } as any,
      context: { viaMcp: true, skipActivityLog: true },
    })
    expect(ok.overageRateAtLog).toBe(120)
    await expect(
      payload.create({
        collection: 'retainer-time-entries',
        data: { ...base, overageRateAtLog: 1, feeAtLog: 1000 } as any,
        context: { viaMcp: true, skipActivityLog: true },
      }),
    ).rejects.toThrow(/overageRateAtLog/)
    await expect(
      payload.update({
        collection: 'retainer-time-entries',
        id: ok.id,
        data: { overageRateAtLog: 5 } as any,
        context: { viaMcp: true, skipActivityLog: true },
      }),
    ).rejects.toThrow(/retainer-time-entries: money fields are read-only for MCP requests \(overageRateAtLog\)/)
  })

  test('line item added from a service item gets its price server-side from the locked defaultPrice', async () => {
    const db = payload.db as any
    const si = await db.collections['service-items'].create({ name: 'SEO audit', billingType: 'fixed', defaultPrice: 1250 })
    const siId = String(si._id)
    const pkg = await moneyFixture()
    const existing = pkg.lineItems[0]

    // Staff (role user) can add a catalog line without a price; the server fills it.
    await payload.update({
      collection: 'packages',
      id: pkg.id,
      data: { lineItems: [existing, { name: 'SEO audit', quantity: 1, sourceServiceItem: siId }] } as any,
      user: staffUser,
      overrideAccess: false,
    })
    let back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems).toHaveLength(2)
    expect(back.lineItems[1].price).toBe(1250)
    expect(back.lineItems[0].price).toBe(3000) // untouched

    // Staff still cannot choose the price, even on a catalog line.
    await expect(
      payload.update({
        collection: 'packages',
        id: pkg.id,
        data: { lineItems: [...back.lineItems, { name: 'SEO audit', sourceServiceItem: siId, price: 1 }] } as any,
        user: staffUser,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/read-only for non-admin users/)

    // A stored catalog line keeps its price when the catalog price changes later.
    await db.collections['service-items'].updateOne({ _id: si._id }, { $set: { defaultPrice: 9999 } })
    await payload.update({
      collection: 'packages',
      id: pkg.id,
      data: { notes: 'later edit', lineItems: back.lineItems } as any,
      user: staffUser,
      overrideAccess: false,
    })
    back = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems[1].price).toBe(1250)

    // On create too: an admin creating a package from the catalog gets the catalog price.
    const created: any = await payload.create({
      collection: 'packages',
      data: { name: 'From catalog', type: 'template', status: 'draft', lineItems: [{ name: 'SEO audit', sourceServiceItem: siId }] } as any,
      user: staff,
      overrideAccess: false,
    })
    expect(created.lineItems[0].price).toBe(9999)
  })

  // ── Catalog line items never end at $0 (fields/linePriceFromServiceItem.ts) ──

  async function expectCatalogReject(pkgId: string, line: Record<string, unknown>, msg: RegExp) {
    const before: any = await payload.findByID({ collection: 'packages', id: pkgId, user: staff, overrideAccess: false })
    let status: number | undefined
    let message = ''
    try {
      await payload.update({
        collection: 'packages',
        id: pkgId,
        data: { lineItems: [...before.lineItems, line] } as any,
        // Admin on a normal login: staff/MCP callers are stopped earlier by the
        // catalog-only rule (requireCatalogLines), so this exercises the
        // never-$0 fill check that guards admins and trusted code.
        user: staff,
        overrideAccess: false,
      })
    } catch (e: any) {
      status = e.status
      message = String(e.message)
    }
    expect(status).toBe(400)
    expect(message).toMatch(msg)
    const after: any = await payload.findByID({ collection: 'packages', id: pkgId, user: staff, overrideAccess: false })
    expect(after.lineItems).toEqual(before.lineItems)
    expect(after.updatedAt).toBe(before.updatedAt)
  }

  test('catalog line never $0: service item with no defaultPrice is rejected with 400, package unchanged', async () => {
    const db = payload.db as any
    const si = await db.collections['service-items'].create({ name: 'Unpriced', billingType: 'fixed' })
    const siId = String(si._id)
    const pkg = await moneyFixture()
    await expectCatalogReject(
      pkg.id,
      { name: 'Unpriced line', quantity: 1, sourceServiceItem: siId },
      new RegExp(`'Unpriced line'.*${siId}.*no locked price`),
    )
  })

  test('catalog line never $0: service item with defaultPrice 0 is rejected with 400', async () => {
    const db = payload.db as any
    const si = await db.collections['service-items'].create({ name: 'Free', billingType: 'fixed', defaultPrice: 0 })
    const siId = String(si._id)
    const pkg = await moneyFixture()
    await expectCatalogReject(pkg.id, { name: 'Zero line', quantity: 1, sourceServiceItem: siId }, /'Zero line'.*no locked price/)
  })

  test('catalog line never $0: missing service item id is rejected with 400', async () => {
    const pkg = await moneyFixture()
    const missingId = '0123456789abcdef01234567'
    await expectCatalogReject(
      pkg.id,
      { name: 'Ghost line', quantity: 1, sourceServiceItem: missingId },
      new RegExp(`'Ghost line'.*${missingId}.*does not exist`),
    )
  })

  test('catalog line never $0: non-catalog line at $0 still saves (no regression)', async () => {
    // Mirrors MCP create_package: non-catalog lines are written at price 0 for staff to price later.
    const pkg = await moneyFixture()
    await payload.update({
      collection: 'packages',
      id: pkg.id,
      data: { lineItems: [pkg.lineItems[0], { name: 'Custom work', quantity: 1, price: 0 }] } as any,
      user: staff,
      overrideAccess: false,
    })
    const back: any = await payload.findByID({ collection: 'packages', id: pkg.id, user: staff, overrideAccess: false })
    expect(back.lineItems).toHaveLength(2)
    expect(back.lineItems[1].name).toBe('Custom work')
    expect(back.lineItems[1].price).toBe(0)
    expect(back.lineItems[0].price).toBe(3000)

    // And on create, like createPackage does.
    const created: any = await payload.create({
      collection: 'packages',
      data: { name: 'Unpriced draft', type: 'template', status: 'draft', lineItems: [{ name: 'Custom work', price: 0 }] } as any,
      user: staff,
      overrideAccess: false,
    })
    expect(created.lineItems[0].price).toBe(0)
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

  test('MCP get_retainer_summary still works when a scheduled fee change is due (settle runs outside the money lock)', async () => {
    const db = payload.db as any
    const ca = await db.collections['client-accounts'].create({ name: 'Settle Co', email: 'settle@test.local' })
    const past = '2026-01-01T00:00:00.000Z'
    const r = await db.collections.retainers.create({
      clientAccount: ca._id,
      tier: 'basic',
      status: 'active',
      startDate: past,
      activatedAt: past,
      monthlyFee: 1000,
      hoursPerMonth: 10,
      overageRate: 120,
      pendingMonthlyFee: 2000,
      pendingOverageRate: 150,
      pendingEffectiveFrom: '2026-06-01T00:00:00.000Z',
    })
    const c = await mcpClient()
    const res: any = await c.callTool({ name: 'get_retainer_summary', arguments: { clientAccountId: String(ca._id) } })
    expect(res.isError).toBeFalsy()
    const settled: any = await payload.findByID({ collection: 'retainers', id: String(r._id) })
    expect(settled.monthlyFee).toBe(2000)
    expect(settled.overageRate).toBe(150)
  })

  test('MCP log_work still creates an entry with the retainer rate snapshot', async () => {
    const db = payload.db as any
    const ca = await db.collections['client-accounts'].create({ name: 'Log Co', email: 'log@test.local' })
    const r = await db.collections.retainers.create({
      clientAccount: ca._id,
      tier: 'basic',
      status: 'active',
      startDate: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      monthlyFee: 1000,
      hoursPerMonth: 10,
      overageRate: 120,
    })
    const c = await mcpClient()
    const res: any = await c.callTool({
      name: 'log_work',
      arguments: {
        actor: 'vegapunk',
        retainerId: String(r._id),
        clientAccountId: String(ca._id),
        date: '2026-11-01',
        hours: 1.5,
        description: 'Fixed the nav',
      },
    })
    expect(res.isError).toBeFalsy()
    const { docs } = await payload.find({ collection: 'retainer-time-entries', where: { retainer: { equals: String(r._id) } } })
    expect(docs.length).toBe(1)
    expect(docs[0]?.overageRateAtLog).toBe(120)
  })

  test('MCP log_work requires an existing retainer of that client: no entry at default rates', async () => {
    const db = payload.db as any
    const ca = await db.collections['client-accounts'].create({ name: 'NoRetainer Co', email: 'noret@test.local' })
    const other = await db.collections['client-accounts'].create({ name: 'Other Co', email: 'other@test.local' })
    const r = await db.collections.retainers.create({
      clientAccount: other._id,
      tier: 'basic',
      status: 'active',
      startDate: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      monthlyFee: 1000,
      hoursPerMonth: 10,
      overageRate: 120,
    })
    const c = await mcpClient()
    const base = { actor: 'vegapunk', clientAccountId: String(ca._id), date: '2026-11-01', hours: 2, description: 'x' }

    const missing: any = await c.callTool({ name: 'log_work', arguments: { ...base, retainerId: '6ae000000000000000000000' } })
    expect(missing.isError).toBe(true)
    expect(JSON.stringify(missing.content)).toContain('not found. Hours must be logged against an existing retainer')

    const wrongClient: any = await c.callTool({ name: 'log_work', arguments: { ...base, retainerId: String(r._id) } })
    expect(wrongClient.isError).toBe(true)
    expect(JSON.stringify(wrongClient.content)).toContain('does not belong to client account')

    const { totalDocs } = await payload.find({
      collection: 'retainer-time-entries',
      where: { clientAccount: { equals: String(ca._id) } },
    })
    expect(totalDocs).toBe(0)
    await rejected(c, 'log_work', { actor: 'vegapunk', clientAccountId: String(ca._id), date: '2026-11-01', hours: 2 })
  })

  // ── Plan step 2: task tracking tools ─────────────────────────────────────────

  async function trackingFixture() {
    const project: any = await payload.create({
      collection: 'projects',
      data: {
        name: 'Tracking Project',
        client: clientAccountId,
        assignedTo: [staffUser.id],
        milestones: [
          { title: 'Design', date: '2026-11-05T00:00:00.000Z', completed: true },
          { title: 'Launch', date: '2026-11-20T00:00:00.000Z', completed: false },
        ],
      } as any,
      user: staff,
      overrideAccess: false,
      context: { skipActivityLog: true },
    })
    const pkg: any = await payload.create({
      collection: 'packages',
      data: { name: 'Tracking Package', type: 'proposal', status: 'draft', clientAccount: clientAccountId, projectRef: project.id } as any,
      user: staff,
      overrideAccess: false,
    })
    return { projectId: String(project.id), packageId: String(pkg.id) }
  }

  const ok = (res: any) => {
    expect(res.isError).toBeFalsy()
    return JSON.parse(res.content[0].text)
  }

  test('MCP task_create files a task under a package (project taken from the package) and records the actor', async () => {
    const { projectId, packageId } = await trackingFixture()
    const c = await mcpClient()
    const out = ok(
      await c.callTool({
        name: 'task_create',
        arguments: {
          actor: 'vegapunk',
          title: 'Build hero section',
          description: 'Line one\nLine two',
          packageId,
          ownerBot: 'orca',
          ccqTaskId: 'T261102-001500',
          priority: 'high',
        },
      }),
    )
    expect(out.task.projectId).toBe(projectId)
    expect(out.task.packageId).toBe(packageId)
    expect(out.task.ownerBot).toBe('orca')
    expect(out.task.ccqTaskId).toBe('T261102-001500')
    expect(out.task.lastActor).toBe('vegapunk')
    expect(out.task.description).toBe('Line one\nLine two')
    expect(out.task.qa.status).toBe('pending')
    await rejected(c, 'task_create', { title: 'no actor', packageId })
  })

  test('task_create rejects a projectId that does not exist and creates nothing', async () => {
    const c = await mcpClient()
    const db = payload.db as any
    const missing = '0123456789abcdef01234567'
    const res: any = await c.callTool({
      name: 'task_create',
      arguments: { actor: 'orca', title: 'Ghost project task', projectId: missing },
    })
    expect(res.isError).toBe(true)
    expect(JSON.stringify(res.content)).toContain(`Project ${missing} not found`)
    expect(await db.collections.tasks.countDocuments({ title: 'Ghost project task' })).toBe(0)
  })

  test("task_create rejects a package whose client differs from the project's client", async () => {
    const db = payload.db as any
    const otherCa = await db.collections['client-accounts'].create({ name: 'Other Client Co', email: 'fix3-other@test.local' })
    const otherProject = await db.collections.projects.create({ name: 'Other Client Project', client: otherCa._id })
    // A package of the first client with no project link, so only the client check can catch it.
    const pkg: any = await payload.create({
      collection: 'packages',
      data: { name: 'Unlinked Package', type: 'proposal', status: 'draft', clientAccount: clientAccountId } as any,
      user: staff,
      overrideAccess: false,
    })
    const c = await mcpClient()
    const res: any = await c.callTool({
      name: 'task_create',
      arguments: { actor: 'orca', title: 'Cross-client task', packageId: String(pkg.id), projectId: String(otherProject._id) },
    })
    expect(res.isError).toBe(true)
    const msg = JSON.stringify(res.content)
    expect(msg).toContain(clientAccountId)
    expect(msg).toContain(String(otherCa._id))
    expect(await db.collections.tasks.countDocuments({ title: 'Cross-client task' })).toBe(0)
  })

  test('task_create rejects nothing on the happy path: matching project + package still creates the task', async () => {
    const { projectId, packageId } = await trackingFixture()
    const c = await mcpClient()
    const byBoth = ok(
      await c.callTool({ name: 'task_create', arguments: { actor: 'orca', title: 'Happy both', projectId, packageId } }),
    )
    expect(byBoth.task.projectId).toBe(projectId)
    expect(byBoth.task.packageId).toBe(packageId)
    const byProject = ok(await c.callTool({ name: 'task_create', arguments: { actor: 'orca', title: 'Happy project', projectId } }))
    expect(byProject.task.projectId).toBe(projectId)
  })

  test('MCP task_update merges qa, and a tracked task needs qa pass + commit to complete', async () => {
    const { packageId } = await trackingFixture()
    const c = await mcpClient()
    const created = ok(
      await c.callTool({
        name: 'task_create',
        arguments: { actor: 'orca', title: 'Tracked work', packageId, ccqTaskId: 'T261102-001600' },
      }),
    )
    const id = created.task.id
    const blocked: any = await c.callTool({ name: 'task_update', arguments: { actor: 'orca', id, status: 'completed' } })
    expect(blocked.isError).toBe(true)
    expect(JSON.stringify(blocked.content)).toContain('qa.status must be')
    ok(await c.callTool({ name: 'task_update', arguments: { actor: 'shaka', id, qa: { status: 'pass', reportLink: 'drive://qa' } } }))
    const stillBlocked: any = await c.callTool({ name: 'task_update', arguments: { actor: 'orca', id, status: 'completed' } })
    expect(stillBlocked.isError).toBe(true)
    const done = ok(
      await c.callTool({
        name: 'task_update',
        arguments: { actor: 'shaka', id, status: 'completed', qa: { commit: 'e358cb92d68562e0d7fbf61ad1bceb12c8470d79' } },
      }),
    )
    expect(done.task.status).toBe('completed')
    expect(done.task.qa).toMatchObject({ status: 'pass', reportLink: 'drive://qa', commit: 'e358cb92d68562e0d7fbf61ad1bceb12c8470d79' })
    expect(done.task.lastActor).toBe('shaka')
    expect(done.task.completedAt).toBeTruthy()
  })

  /** Another client account with its own project, plus a package with no projectRef. Raw inserts, no hooks. */
  async function otherClientFixture() {
    const db = payload.db as any
    const ca = await db.collections['client-accounts'].create({ name: 'Other Co', email: `other-${Date.now()}@test.local` })
    const project = await db.collections.projects.create({ name: 'Other Project', client: ca._id })
    const pkg = await db.collections.packages.create({
      name: 'Other Package',
      type: 'proposal',
      status: 'draft',
      clientAccount: ca._id,
    })
    return { clientAccountId: String(ca._id), projectId: String(project._id), packageId: String(pkg._id) }
  }

  async function trackedTask(c: any, packageId: string) {
    return ok(await c.callTool({ name: 'task_create', arguments: { actor: 'orca', title: 'Move me', packageId } })).task
  }

  async function reread(id: string) {
    return (await payload.findByID({ collection: 'tasks', id, depth: 0, user: staff, overrideAccess: false })) as any
  }

  test('task_update rejects moving a task to another client\'s project, and leaves it unchanged', async () => {
    const a = await trackingFixture()
    const other = await otherClientFixture()
    const c = await mcpClient()
    const task = await trackedTask(c, a.packageId)
    const msg = await rejected(c, 'task_update', { actor: 'orca', id: task.id, projectId: other.projectId, title: 'moved' })
    expect(msg).toContain(a.packageId)
    const back = await reread(task.id)
    expect(String(back.project)).toBe(a.projectId)
    expect(String(back.package)).toBe(a.packageId)
    expect(back.title).toBe('Move me')
  })

  test('task_update rejects linking a task to another client\'s package', async () => {
    const a = await trackingFixture()
    const other = await otherClientFixture()
    const c = await mcpClient()
    const task = await trackedTask(c, a.packageId)
    const msg = await rejected(c, 'task_update', { actor: 'orca', id: task.id, packageId: other.packageId })
    expect(msg).toContain(other.clientAccountId)
    const back = await reread(task.id)
    expect(String(back.package)).toBe(a.packageId)
  })

  test('task_update rejects a non-existent projectId', async () => {
    const a = await trackingFixture()
    const c = await mcpClient()
    const task = await trackedTask(c, a.packageId)
    const missing = '64b000000000000000000000'
    const msg = await rejected(c, 'task_update', { actor: 'orca', id: task.id, projectId: missing, packageId: null })
    expect(msg).toContain(`Project ${missing} not found`)
    const back = await reread(task.id)
    expect(String(back.project)).toBe(a.projectId)
    expect(String(back.package)).toBe(a.packageId)
  })

  test('task_update rejects a package whose projectRef is a different project of the same client', async () => {
    const a = await trackingFixture()
    const b = await trackingFixture()
    const c = await mcpClient()
    const task = await trackedTask(c, a.packageId)
    const msg = await rejected(c, 'task_update', { actor: 'orca', id: task.id, packageId: b.packageId })
    expect(msg).toContain(`belongs to project ${b.projectId}`)
    const back = await reread(task.id)
    expect(String(back.package)).toBe(a.packageId)
  })

  test('task_update rejects nothing on a valid move to another project of the same client with packageId null', async () => {
    const a = await trackingFixture()
    const b = await trackingFixture()
    const c = await mcpClient()
    const task = await trackedTask(c, a.packageId)
    const out = ok(
      await c.callTool({ name: 'task_update', arguments: { actor: 'orca', id: task.id, projectId: b.projectId, packageId: null } }),
    )
    expect(out.task.projectId).toBe(b.projectId)
    expect(out.task.packageId).toBeNull()
    const back = await reread(task.id)
    expect(String(back.project)).toBe(b.projectId)
    expect(back.package ?? null).toBeNull()
  })

  test("task_create with clientAccountId rejects another client's real project and creates nothing", async () => {
    const a = await trackingFixture()
    const other = await otherClientFixture()
    const c = await mcpClient()
    const db = payload.db as any
    // The other client's real project, the first client's package and client id.
    const msg = await rejected(c, 'task_create', {
      actor: 'orca',
      title: 'Pinned cross-client',
      projectId: other.projectId,
      packageId: a.packageId,
      clientAccountId,
    })
    expect(msg).toContain(other.projectId)
    // Project alone, pinned to the first client: still rejected.
    const msg2 = await rejected(c, 'task_create', {
      actor: 'orca',
      title: 'Pinned cross-client',
      projectId: other.projectId,
      clientAccountId,
    })
    expect(msg2).toContain(`not ${clientAccountId}`)
    expect(await db.collections.tasks.countDocuments({ title: 'Pinned cross-client' })).toBe(0)
    // The right client pin passes.
    const out = ok(
      await c.callTool({
        name: 'task_create',
        arguments: { actor: 'orca', title: 'Pinned ok', projectId: a.projectId, clientAccountId },
      }),
    )
    expect(out.task.projectId).toBe(a.projectId)
  })

  test("task_update with clientAccountId rejects moving onto another client's real project", async () => {
    const a = await trackingFixture()
    const other = await otherClientFixture()
    const c = await mcpClient()
    const task = await trackedTask(c, a.packageId)
    const msg = await rejected(c, 'task_update', {
      actor: 'orca',
      id: task.id,
      projectId: other.projectId,
      packageId: null,
      clientAccountId,
    })
    expect(msg).toContain(`not ${clientAccountId}`)
    const back = await reread(task.id)
    expect(String(back.project)).toBe(a.projectId)
    expect(String(back.package)).toBe(a.packageId)
  })

  test('task_create rejects a client package on a project with no client', async () => {
    const db = payload.db as any
    const bare = await db.collections.projects.create({ name: 'Clientless Project' })
    const pkg = await db.collections.packages.create({
      name: 'Client Pkg No Ref',
      type: 'proposal',
      status: 'draft',
      clientAccount: clientAccountId,
    })
    const c = await mcpClient()
    const msg = await rejected(c, 'task_create', {
      actor: 'orca',
      title: 'Clientless mix',
      projectId: String(bare._id),
      packageId: String(pkg._id),
    })
    expect(msg).toContain('(none)')
    expect(await db.collections.tasks.countDocuments({ title: 'Clientless mix' })).toBe(0)
  })

  test('actor is case-insensitive and stored lowercase', async () => {
    const a = await trackingFixture()
    const c = await mcpClient()
    const out = ok(
      await c.callTool({
        name: 'task_create',
        arguments: { actor: 'Vegapunk', title: 'Case actor', packageId: a.packageId, ownerBot: 'ORCA' },
      }),
    )
    expect(out.task.lastActor).toBe('vegapunk')
    expect(out.task.ownerBot).toBe('orca')
    await rejected(c, 'task_create', { actor: 'Nobody', title: 'Bad actor', packageId: a.packageId })
  })

  test('list_projects filters by client and returns progress', async () => {
    const a = await trackingFixture()
    const other = await otherClientFixture()
    const c = await mcpClient()
    ok(await c.callTool({ name: 'task_create', arguments: { actor: 'orca', title: 'LP task', projectId: a.projectId } }))
    const out = ok(await c.callTool({ name: 'list_projects', arguments: { clientId: clientAccountId, limit: 100 } }))
    const ids = out.items.map((p: any) => p.id)
    expect(ids).toContain(a.projectId)
    expect(ids).not.toContain(other.projectId)
    for (const p of out.items) expect(p.clientAccountId).toBe(clientAccountId)
    const row = out.items.find((p: any) => p.id === a.projectId)
    expect(row.name).toBe('Tracking Project')
    expect(row.progress.milestones).toEqual({ total: 2, done: 1 })
    expect(row.progress.tasks.total).toBeGreaterThanOrEqual(1)
    expect(typeof row.progress.percent).toBe('number')
    expect(JSON.stringify(out)).not.toContain(CTX.brief)
  })

  test('list_packages with clientId returns only that client\'s packages', async () => {
    const a = await trackingFixture()
    const other = await otherClientFixture()
    const c = await mcpClient()
    const out = ok(await c.callTool({ name: 'list_packages', arguments: { clientId: other.clientAccountId } }))
    const ids = out.packages.map((p: any) => String(p.id))
    expect(ids).toContain(other.packageId)
    expect(ids).not.toContain(a.packageId)
    const mine = ok(await c.callTool({ name: 'list_packages', arguments: { clientId: clientAccountId } }))
    expect(mine.packages.map((p: any) => String(p.id))).toContain(a.packageId)
  })

  test('get_project_progress names the project on open tasks', async () => {
    const a = await trackingFixture()
    const c = await mcpClient()
    ok(await c.callTool({ name: 'task_create', arguments: { actor: 'orca', title: 'Named open task', projectId: a.projectId } }))
    const out = ok(await c.callTool({ name: 'get_project_progress', arguments: { projectId: a.projectId } }))
    expect(out.openTasks.length).toBeGreaterThan(0)
    for (const t of out.openTasks) expect(t.projectName).toBe('Tracking Project')
  })

  test('MCP task_list filters by package, project, client and status', async () => {
    const a = await trackingFixture()
    const b = await trackingFixture()
    const c = await mcpClient()
    for (const [title, pkg, status] of [
      ['a1', a.packageId, 'pending'],
      ['a2', a.packageId, 'in-progress'],
      ['b1', b.packageId, 'pending'],
    ] as const) {
      ok(await c.callTool({ name: 'task_create', arguments: { actor: 'gojo', title, packageId: pkg, status } }))
    }
    const byPkg = ok(await c.callTool({ name: 'task_list', arguments: { packageId: a.packageId } }))
    expect(byPkg.items.map((t: any) => t.title).sort()).toEqual(['a1', 'a2'])
    const byProject = ok(await c.callTool({ name: 'task_list', arguments: { projectId: b.projectId } }))
    expect(byProject.items.map((t: any) => t.title)).toEqual(['b1'])
    const byStatus = ok(
      await c.callTool({ name: 'task_list', arguments: { packageId: a.packageId, status: ['in-progress'] } }),
    )
    expect(byStatus.items.map((t: any) => t.title)).toEqual(['a2'])
    const byClient = ok(await c.callTool({ name: 'task_list', arguments: { clientAccountId, status: 'pending', limit: 100 } }))
    expect(byClient.items.map((t: any) => t.title)).toEqual(expect.arrayContaining(['a1', 'b1']))
    expect(byClient.items.every((t: any) => t.status === 'pending')).toBe(true)
  })

  test('MCP get_package returns tasks, milestones and progress percent, without prices', async () => {
    const { packageId } = await trackingFixture()
    const c = await mcpClient()
    ok(await c.callTool({ name: 'task_create', arguments: { actor: 'gojo', title: 'done one', packageId, status: 'completed' } }))
    ok(await c.callTool({ name: 'task_create', arguments: { actor: 'gojo', title: 'open one', packageId } }))
    ok(await c.callTool({ name: 'task_create', arguments: { actor: 'gojo', title: 'dropped', packageId, status: 'cancelled' } }))
    const out = ok(await c.callTool({ name: 'get_package', arguments: { packageId } }))
    expect(out.package.id).toBe(packageId)
    expect(out.tasks).toHaveLength(3)
    expect(out.milestones.map((m: any) => m.title)).toEqual(['Design', 'Launch'])
    // (1 done task + 1 done milestone) / (2 live tasks + 2 milestones) = 50%
    expect(out.progress.percent).toBe(50)
    expect(out.progress.tasks.byStatus.cancelled).toBe(1)
    expect(JSON.stringify(out)).not.toMatch(/"price"|"adjustedPrice"|stripe/i)
  })

  test('MCP get_project_progress returns milestones, open tasks and progress', async () => {
    const { projectId, packageId } = await trackingFixture()
    const c = await mcpClient()
    ok(await c.callTool({ name: 'task_create', arguments: { actor: 'gojo', title: 'p-open', packageId } }))
    ok(await c.callTool({ name: 'task_create', arguments: { actor: 'gojo', title: 'p-done', projectId, status: 'completed' } }))
    const out = ok(await c.callTool({ name: 'get_project_progress', arguments: { projectId } }))
    expect(out.project.id).toBe(projectId)
    expect(out.milestones).toHaveLength(2)
    expect(out.openTasks.map((t: any) => t.title)).toEqual(['p-open'])
    expect(out.progress).toMatchObject({ tasks: { total: 2, done: 1 }, milestones: { total: 2, done: 1 }, percent: 50 })
  })

  test('task tracking fields never reach a client, and non-staff updates do not wipe them', async () => {
    const { packageId } = await trackingFixture()
    const c = await mcpClient()
    const created = ok(
      await c.callTool({
        name: 'task_create',
        arguments: { actor: 'vegapunk', title: 'secret tracking', packageId, ownerBot: 'finn', ccqTaskId: 'T261102-001700', qa: { status: 'fail', commit: 'abc' } },
      }),
    )
    const id = created.task.id
    const anon: any = await payload.findByID({ collection: 'tasks', id })
    const asClient: any = await payload.findByID({ collection: 'tasks', id, user: client })
    for (const doc of [anon, asClient]) {
      for (const f of ['ownerBot', 'ccqTaskId', 'qa', 'lastActor']) expect(doc[f]).toBeUndefined()
    }
    await payload.update({ collection: 'tasks', id, data: { title: 'renamed by portal' } as any })
    const back: any = await payload.findByID({ collection: 'tasks', id, user: staff, overrideAccess: false })
    expect(back.title).toBe('renamed by portal')
    expect(back).toMatchObject({ ownerBot: 'finn', ccqTaskId: 'T261102-001700', lastActor: 'vegapunk' })
    expect(back.qa).toMatchObject({ status: 'fail', commit: 'abc' })
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

  // ── MCP output never leaks user secrets ─────────────────────────────────────
  // log_work used to return loggedBy and retainer.clientAccount.assignedTo as
  // full user docs (API key, sessions, passkeys). Every tool is called here with
  // a staff user that carries those fields, and no output may contain them.

  const LEAK = /apiKey|apiKeyIndex|enableAPIKey|"sessions"|passkey|PASSKEY-FAKE|loginTwoFactor|twoFactorCode|"hash"|"salt"|SESSION-FAKE|resetPassword/

  test('MCP: no tool output contains apiKey, sessions or passkey data (all tools)', async () => {
    const db = payload.db as any
    await db.collections.users.updateOne(
      { _id: staff.id },
      {
        $set: {
          name: 'Staff Admin',
          sessions: [{ id: 'SESSION-FAKE', createdAt: new Date(), expiresAt: new Date(Date.now() + 3600_000) }],
          passkeyCredentials: [{ credentialId: 'PASSKEY-FAKE', publicKey: 'PASSKEY-FAKE', counter: 0 }],
          loginTwoFactorCode: '000000',
        },
      },
    )
    const ca = await db.collections['client-accounts'].create({
      name: 'Leak Retainer Co',
      email: 'leakret@test.local',
      assignedTo: [staff.id],
    })
    const caId = String(ca._id)
    const r = await db.collections.retainers.create({
      clientAccount: ca._id,
      tier: 'basic',
      status: 'active',
      startDate: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      monthlyFee: 1000,
      hoursPerMonth: 10,
      overageRate: 120,
    })
    const retainerId = String(r._id)
    const si = await db.collections['service-items'].create({ name: 'Leak SI', billingType: 'fixed', defaultPrice: 100 })

    const c = await mcpClient()
    const { tools } = await c.listTools()
    const call = async (name: string, args: Record<string, unknown>) => {
      const res: any = await c.callTool({ name, arguments: args })
      return JSON.stringify(res.content)
    }

    const logged = await call('log_work', {
      actor: 'vegapunk',
      retainerId,
      clientAccountId: caId,
      date: '2026-11-01',
      hours: 1,
      description: 'Leak check',
    })
    const loggedEntry = JSON.parse(JSON.parse(logged)[0].text)
    expect(loggedEntry.success).toBe(true)
    const entryId = String(loggedEntry.id)

    const ARGS: Record<string, Record<string, unknown>> = {
      list_clients: {},
      get_retainer_portfolio: {},
      get_retainer_summary: { clientAccountId: caId },
      get_recap_draft: { clientAccountId: caId },
      save_recap_draft: { actor: 'vegapunk', clientAccountId: caId, recap: { headline: 'Leak check' } },
      get_scope_recap: { retainerId },
      log_work: { actor: 'vegapunk', retainerId, clientAccountId: caId, date: '2026-11-02', hours: 1 },
      create_draft_entry: { actor: 'vegapunk', retainerId, clientAccountId: caId, date: '2026-11-03', description: 'Plan' },
      update_time_entry: { actor: 'vegapunk', id: entryId, description: 'Leak check, edited' },
      list_packages: {},
      list_service_items: {},
      create_package: { actor: 'vegapunk', name: 'Leak pkg', lineItems: [{ serviceItemId: String(si._id), name: 'Line' }] },
      get_sow_draft: { packageId },
      save_sow: { actor: 'vegapunk', packageId, sowData: {} },
      create_milestone: { actor: 'vegapunk', projectId, title: 'Leak MS', date: '2026-12-01' },
      update_milestone: { actor: 'vegapunk', projectId, milestoneIndex: 0, title: 'Leak MS', date: '2026-12-02' },
      toggle_milestone: { actor: 'vegapunk', projectId, milestoneIndex: 0 },
      project_create: { actor: 'vegapunk', name: 'Leak internal project', clientAccountId: MCP_PROJECT_CLIENT_ID },
      task_create: { actor: 'vegapunk', title: 'Leak task', projectId },
      task_update: { actor: 'vegapunk', id: taskId, title: 'Leak Task' },
      task_list: {},
      get_package: { packageId },
      get_project_progress: { projectId },
      client_status: { clientAccountId: caId },
    }
    const covered: string[] = []
    for (const t of tools) {
      // A new tool without args here still gets called with {} (an error result
      // is still checked), so nothing slips past this test unexamined.
      const out = await call(t.name, ARGS[t.name] ?? {})
      expect({ tool: t.name, leak: LEAK.test(out) }).toEqual({ tool: t.name, leak: false })
      covered.push(t.name)
    }
    expect(covered.length).toBeGreaterThanOrEqual(23)

    // log_work: loggedBy is an id, and the self-reported actor is stored.
    expect(typeof loggedEntry.entry.loggedBy === 'string' || loggedEntry.entry.loggedBy?.name !== undefined).toBe(true)
    const stored: any = await payload.findByID({ collection: 'retainer-time-entries', id: entryId, depth: 0 })
    expect(stored.actor).toBe('vegapunk')
  })

  test('MCP create_package line without serviceItemId returns the friendly catalog error', async () => {
    const c = await mcpClient()
    const res: any = await c.callTool({
      name: 'create_package',
      arguments: { actor: 'vegapunk', name: 'Bot no SI', lineItems: [{ name: 'Site' }] },
    })
    expect(res.isError).toBe(true)
    expect(JSON.parse(res.content[0].text).error).toBe(CUSTOM_LINE_BLOCKED)
  })

  // ── project_create: internal client only, no budget ──────────────────────────

  const projectsNamed = async (name: string) =>
    (await payload.find({ collection: 'projects', where: { name: { equals: name } }, depth: 0 })).docs as any[]

  test('MCP project_create creates a pending project under the pinned internal client', async () => {
    const c = await mcpClient()
    const res: any = await c.callTool({
      name: 'project_create',
      arguments: {
        actor: 'orca',
        name: 'Bot internal project',
        description: 'made by a bot',
        clientAccountId: MCP_PROJECT_CLIENT_ID,
        startDate: '2026-11-02',
        projectedEndDate: '2026-12-01',
      },
    })
    expect(res.isError).toBeFalsy()
    const out = JSON.parse(res.content[0].text)
    expect(out.project).toEqual({
      id: expect.any(String),
      name: 'Bot internal project',
      status: 'pending',
      clientAccountId: MCP_PROJECT_CLIENT_ID,
    })
    const [doc] = await projectsNamed('Bot internal project')
    expect(String(doc.id)).toBe(out.project.id)
    expect(String(doc.client)).toBe(MCP_PROJECT_CLIENT_ID)
    expect(doc.status).toBe('pending')
    expect(doc.budgetAmount ?? null).toBeNull()
    expect((doc.assignedTo ?? []).map(String)).toContain(String(mcpCaller.id))
  })

  test('MCP project_create refuses a real client account with needs-chance and writes nothing', async () => {
    const c = await mcpClient()
    const res: any = await c.callTool({
      name: 'project_create',
      arguments: { actor: 'orca', name: 'Bot client project', clientAccountId },
    })
    expect(res.isError).toBe(true)
    const out = JSON.parse(res.content[0].text)
    expect(out.code).toBe('needs-chance')
    expect(out.error.startsWith('needs-chance:')).toBe(true)
    expect(await projectsNamed('Bot client project')).toHaveLength(0)
  })

  test('MCP project_create with no client account returns needs-chance and writes nothing', async () => {
    const c = await mcpClient()
    const res: any = await c.callTool({ name: 'project_create', arguments: { actor: 'orca', name: 'Bot orphan project' } })
    expect(res.isError).toBe(true)
    expect(JSON.parse(res.content[0].text).code).toBe('needs-chance')
    expect(await projectsNamed('Bot orphan project')).toHaveLength(0)
  })

  test('MCP project_create rejects budget/currency and a missing actor', async () => {
    const c = await mcpClient()
    for (const extra of [{ budget: 5000 }, { currency: 'USD' }, { budgetAmount: 5000 }]) {
      await rejected(c, 'project_create', {
        actor: 'orca',
        name: 'Bot budget project',
        clientAccountId: MCP_PROJECT_CLIENT_ID,
        ...extra,
      })
    }
    await rejected(c, 'project_create', { name: 'Bot budget project', clientAccountId: MCP_PROJECT_CLIENT_ID })
    expect(await projectsNamed('Bot budget project')).toHaveLength(0)
  })
  // ── task_list by owner + status, and client_status (plan step 3) ─────────────

  /** A fresh client with one project and four open tasks (one per status) plus a closed one. */
  async function digestFixture(tag: string) {
    const db = payload.db as any
    const ca = await db.collections['client-accounts'].create({ name: `Digest ${tag}`, email: `digest-${tag}@test.local` })
    const caId = String(ca._id)
    const project = await payload.create({
      collection: 'projects',
      data: {
        name: `Digest project ${tag}`,
        client: caId,
        assignedTo: [staffUser.id],
        botContext: CTX,
        milestones: [
          { title: 'Kickoff', date: '2026-10-01', completed: true },
          { title: 'Launch', date: '2026-12-01', completed: false },
        ],
      } as any,
      user: staff,
      overrideAccess: false,
      context: { skipActivityLog: true },
    })
    const pid = String(project.id)
    const c = await mcpClient()
    const make = async (title: string, ownerBot: string, status: 'pending' | 'in-progress' | 'completed') =>
      ok(
        await c.callTool({
          name: 'task_create',
          arguments: {
            actor: 'orca',
            title,
            projectId: pid,
            ownerBot,
            status,
            ...(status === 'completed' ? {} : { dueDate: title.includes('late') ? '2026-01-01' : '2099-01-01' }),
          },
        }),
      ).task.id as string
    const pending = await make(`${tag} pending late`, 'orca', 'pending')
    const working = await make(`${tag} working`, 'vegapunk', 'in-progress')
    const blocked = await make(`${tag} blocked`, 'sia', 'pending')
    const waiting = await make(`${tag} waiting`, 'orca', 'pending')
    const done = await make(`${tag} done`, 'orca', 'completed')
    // blocked / waiting-chance arrive with plan step 2; set them on the raw rows so the
    // digest proves it counts them already (updateOne skips mongoose validators).
    const { Types } = await import('mongoose')
    const tasks = db.collections.tasks
    await tasks.updateOne({ _id: new Types.ObjectId(blocked) }, { $set: { status: 'blocked' } })
    await tasks.updateOne({ _id: new Types.ObjectId(waiting) }, { $set: { status: 'waiting-chance' } })
    // A draft SOW for the client, and one already sent (must not show).
    await db.collections.files.create({ name: `Draft SOW ${tag}`, documentTemplate: 'sow', documentStatus: 'draft', clientAccount: ca._id, project: project.id })
    await db.collections.files.create({ name: `Sent SOW ${tag}`, documentTemplate: 'sow', documentStatus: 'sent', clientAccount: ca._id, project: project.id })
    return { c, caId, pid, ids: { pending, working, blocked, waiting, done } }
  }

  test('MCP task_list takes ownerBot as a list, combined with a status list (one call)', async () => {
    const { c, pid, ids } = await digestFixture('own')
    const out = ok(
      await c.callTool({
        name: 'task_list',
        arguments: { projectId: pid, ownerBot: ['ORCA', 'vegapunk'], status: ['pending', 'in-progress'], limit: 100 },
      }),
    )
    expect(out.items.map((t: any) => t.id).sort()).toEqual([ids.pending, ids.working].sort())
    // A single owner still works, case-insensitively.
    const one = ok(await c.callTool({ name: 'task_list', arguments: { projectId: pid, ownerBot: 'Sia', limit: 100 } }))
    expect(one.items.map((t: any) => t.id)).toEqual([ids.blocked])
    // An empty list is rejected by the schema, not treated as "everyone".
    await rejected(c, 'task_list', { projectId: pid, ownerBot: [] })
  })

  test('MCP client_status rolls up one client: counts, waiting-on-Chance, blocked, projects, drafts, no money', async () => {
    const { c, caId, pid, ids } = await digestFixture('one')
    const out = ok(await c.callTool({ name: 'client_status', arguments: { clientAccountId: caId } }))
    expect(out.clients).toHaveLength(1)
    const row = out.clients[0]
    expect(row.clientAccountId).toBe(caId)
    expect(row.name).toBe('Digest one')
    expect(row.counts).toEqual({ open: 4, pending: 1, inProgress: 1, blocked: 1, waitingChance: 1, other: 0, overdue: 1 })
    expect(row.waitingOnChance.map((t: any) => t.id)).toEqual([ids.waiting])
    expect(row.blocked.map((t: any) => t.id)).toEqual([ids.blocked])
    // Oldest first, closed task left out.
    expect(row.tasks.map((t: any) => t.id)).toEqual([ids.pending, ids.working, ids.blocked, ids.waiting])
    expect(row.tasks.some((t: any) => t.id === ids.done)).toBe(false)
    expect(row.projects).toHaveLength(1)
    expect(row.projects[0]).toMatchObject({ id: pid, tasksDone: 1, tasksTotal: 5, milestonesDone: 1, milestonesTotal: 2 })
    expect(row.projects[0].nextMilestone).toMatchObject({ title: 'Launch' })
    expect(row.drafts.map((d: any) => d.name)).toEqual(['Draft SOW one'])
    expect(row.hours).toBeNull()
    expect(out.totals.waitingChance).toBe(1)
    const raw = JSON.stringify(out)
    expect(raw).not.toContain(CTX.brief)
    expect(/price|amount|stripe|overage|rate"/i.test(raw)).toBe(false)
  })

  test('MCP client_status for every client omits empty ones and puts waiting-on-Chance first', async () => {
    const { c, caId } = await digestFixture('all')
    const db = payload.db as any
    const quiet = await db.collections['client-accounts'].create({ name: 'Digest quiet', email: 'quiet@test.local' })
    const out = ok(await c.callTool({ name: 'client_status', arguments: { includeRetainer: false } }))
    const names = out.clients.map((r: any) => r.name)
    expect(names).toContain('Digest all')
    expect(names).not.toContain('Digest quiet')
    expect(out.omittedEmptyClients).toBeGreaterThanOrEqual(1)
    // Every client with a waiting task sorts ahead of every client without one.
    const flags = out.clients.map((r: any) => r.counts.waitingChance > 0)
    expect(flags.indexOf(false) === -1 || flags.lastIndexOf(true) < flags.indexOf(false)).toBe(true)
    expect(out.clients.find((r: any) => r.clientAccountId === caId).counts.waitingChance).toBe(1)
    const withEmpty = ok(await c.callTool({ name: 'client_status', arguments: { includeEmpty: true, includeRetainer: false } }))
    expect(withEmpty.clients.map((r: any) => r.clientAccountId)).toContain(String(quiet._id))
  })

  test('MCP client_status rejects a client-role caller and a bad id', async () => {
    const c = await mcpClient()
    expect((await rejected(c, 'client_status', { clientAccountId: 'not-an-id' })).toLowerCase()).toContain('valid id')
    const prev = mcpCaller
    mcpCaller = client
    try {
      expect(await rejected(c, 'client_status', {})).toContain('Unauthorized')
    } finally {
      mcpCaller = prev
    }
  })
})
