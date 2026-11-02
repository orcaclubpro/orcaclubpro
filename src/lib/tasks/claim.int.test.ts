/**
 * Integration test: task_claim is atomic. N concurrent claims → exactly one
 * winner; the holder can renew; an expired lease can be reclaimed; a lease-less
 * in-progress task can't be taken; sending a task back to pending clears the
 * claim; a client never sees the claim fields. Boots the real Payload config.
 *
 * LOCAL DB ONLY. Runs only when TEST_DATABASE_URI points at a local mongod, e.g.
 *   TEST_DATABASE_URI=mongodb://127.0.0.1:27018/orcaclub_claim_test bun test claim.int
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

d('task_claim atomic claim + lease (local DB)', () => {
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
    const ca = await db.collections['client-accounts'].create({ name: 'Claim Co', email: 'claim@test.local' })
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
      data: { name: 'Claim Project', client: String(ca._id), assignedTo: [client.id] } as any,
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

  test('8 concurrent claims on one pending task: exactly one wins', async () => {
    const id = await newTask('Race task')
    const results = await Promise.all(BOTS.map((actor) => actions.claimTrackedTask({ actor, id })))
    const winners = results.filter((r) => r.success)
    const losers = results.filter((r) => !r.success)
    expect(winners).toHaveLength(1)
    expect(losers).toHaveLength(BOTS.length - 1)
    const win = winners[0] as Extract<(typeof results)[number], { success: true }>
    expect(win.outcome).toBe('claimed')
    expect(win.task.status).toBe('in-progress')
    expect(BOTS as readonly string[]).toContain(win.task.claimedBy)
    expect(win.task.lastActor).toBe(win.task.claimedBy)
    for (const l of losers) expect((l as { error: string }).error).toContain(`already claimed by ${win.task.claimedBy}`)

    const stored: any = await payload.findByID({ collection: 'tasks', id, user: staff, overrideAccess: false })
    expect(stored.claimedBy).toBe(win.task.claimedBy)
    const leaseMs = new Date(stored.leaseExpiresAt).getTime() - new Date(stored.claimedAt).getTime()
    expect(leaseMs).toBe(30 * 60_000)
  })

  test('repeated race: 20 rounds, never two winners', async () => {
    for (let round = 0; round < 20; round++) {
      const id = await newTask(`Race ${round}`)
      const results = await Promise.all(BOTS.map((actor) => actions.claimTrackedTask({ actor, id, leaseMinutes: 5 })))
      expect(results.filter((r) => r.success)).toHaveLength(1)
    }
  }, 60_000)

  test('holder renews; another bot is refused while the lease is live', async () => {
    const id = await newTask('Renew task')
    const first = await actions.claimTrackedTask({ actor: 'gojo', id, leaseMinutes: 5 })
    expect(first.success).toBe(true)
    const other = await actions.claimTrackedTask({ actor: 'sia', id })
    expect(other.success).toBe(false)
    const renew = await actions.claimTrackedTask({ actor: 'gojo', id, leaseMinutes: 60 })
    expect(renew.success && renew.outcome).toBe('renewed')
    expect(renew.success && renew.previousClaimedBy).toBe('gojo')
  })

  test('expired lease can be reclaimed by another bot', async () => {
    const id = await newTask('Stale task')
    expect((await actions.claimTrackedTask({ actor: 'gojo', id })).success).toBe(true)
    // Age the lease directly in the local test DB.
    await (payload.db as any).collections.tasks.updateOne(
      { _id: id },
      { $set: { leaseExpiresAt: new Date(Date.now() - 1000) } },
    )
    const results = await Promise.all(
      ['sia', 'finn', 'shaka'].map((actor) => actions.claimTrackedTask({ actor, id })),
    )
    const winners = results.filter((r) => r.success)
    expect(winners).toHaveLength(1)
    const win = winners[0] as Extract<(typeof results)[number], { success: true }>
    expect(win.outcome).toBe('reclaimed')
    expect(win.previousClaimedBy).toBe('gojo')
  })

  test('in-progress without a lease, and completed tasks, cannot be claimed', async () => {
    const started = await newTask('Started by hand', { status: 'in-progress' })
    const r1 = await actions.claimTrackedTask({ actor: 'gojo', id: started })
    expect(r1.success).toBe(false)
    expect((r1 as { error: string }).error).toContain('without a lease')

    const done = await newTask('Done', { status: 'completed' })
    const r2 = await actions.claimTrackedTask({ actor: 'gojo', id: done })
    expect((r2 as { error: string }).error).toContain('not pending')

    const r3 = await actions.claimTrackedTask({ actor: 'gojo', id: '0'.repeat(24) })
    expect((r3 as { error: string }).error).toContain('not found')
    const r4 = await actions.claimTrackedTask({ actor: 'gojo', id: 'not-an-id' })
    expect((r4 as { error: string }).error).toContain('not found')
  })

  test('back to pending clears the claim, and the task can be claimed again', async () => {
    const id = await newTask('Release task')
    expect((await actions.claimTrackedTask({ actor: 'gojo', id })).success).toBe(true)
    const released = await actions.updateTrackedTask({ actor: 'gojo', id, status: 'pending' })
    expect(released.success).toBe(true)
    if (released.success) {
      expect(released.task.claimedBy).toBeNull()
      expect(released.task.leaseExpiresAt).toBeNull()
    }
    const again = await actions.claimTrackedTask({ actor: 'sia', id })
    expect(again.success && again.outcome).toBe('claimed')
  })

  test('a client never sees claim fields', async () => {
    const id = await newTask('Client view')
    expect((await actions.claimTrackedTask({ actor: 'gojo', id })).success).toBe(true)
    const doc: any = await payload.findByID({ collection: 'tasks', id, user: client, overrideAccess: false })
    expect(doc.id).toBe(id)
    expect(doc.claimedBy).toBeUndefined()
    expect(doc.leaseExpiresAt).toBeUndefined()
    expect(doc.claimedAt).toBeUndefined()
  })

  test('non-staff caller is refused', async () => {
    const id = await newTask('Unauthorized')
    const saved = mcpCaller
    mcpCaller = client
    try {
      const r = await actions.claimTrackedTask({ actor: 'gojo', id })
      expect((r as { error: string }).error).toBe('Unauthorized')
    } finally {
      mcpCaller = saved
    }
  })
})
