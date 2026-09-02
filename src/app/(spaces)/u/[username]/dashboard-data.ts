import { cache } from 'react'
import type { Payload } from 'payload'
import type { getCurrentUser } from '@/actions/auth'
import {
  serializeProject,
  groupSprintsByProject,
  groupTasksByProject,
  type SerializedProject,
} from '@/lib/serialization'
import type { ClientOption } from '@/components/dashboard/CreateProjectModal'
import type { ActivityEvent } from '@/components/dashboard/ActivityFeed'
import { getPreviewClientId } from '@/app/(spaces)/preview'
import { sortByOrderDate } from '@/lib/dashboard/order-date'

// The authenticated user, exactly as the layout resolves it (non-null).
type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

// ── Per-tab loaders ───────────────────────────────────────────────────────────
// Each dashboard route fetches only what its tab renders. Queries are identical
// to the old single-bundle loader — same scoping, depth, sort, and limits —
// just regrouped so a tab never pays for another tab's data.

// ── Shared staff queries ──────────────────────────────────────────────────────
// role is used here for DATA SCOPING, not presentation: admins see everything,
// `user`s see only records assigned to them. This is the one place the
// admin/user distinction still matters — the UI collapses both into 'staff'.

const findStaffClientAccounts = (payload: Payload, user: CurrentUser) =>
  payload.find({
    collection: 'client-accounts',
    where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
    depth: 1,
    limit: 100,
  })

const findStaffProjects = (payload: Payload, user: CurrentUser) =>
  payload.find({
    collection: 'projects',
    where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
    depth: 1,
    sort: '-updatedAt',
    limit: 100,
  })

const findStaffTasks = (payload: Payload, user: CurrentUser) =>
  payload.find({
    collection: 'tasks',
    where: user.role === 'admin' ? {} : { assignedTo: { equals: user.id } },
    depth: 1,
    sort: '-dueDate',
    limit: 100,
  })

// Staff order lists only render summary fields — select trims the heavy
// lineItems/invoices arrays and Stripe columns, populate trims the joined
// account to the three name fields the views read. Non-admins filter by
// account in the query (indexed $in) instead of post-fetch in JS.
const findStaffOrders = (payload: Payload, user: CurrentUser, accountIds: any[]) =>
  user.role !== 'admin' && accountIds.length === 0
    ? Promise.resolve({ docs: [] as any[] })
    : payload.find({
        collection: 'orders',
        where: user.role === 'admin' ? {} : { clientAccount: { in: accountIds } },
        depth: 1,
        sort: '-createdAt',
        limit: 500,
        select: {
          orderNumber: true,
          status: true,
          amount: true,
          createdAt: true,
          updatedAt: true,
          // The staff-set effective date — every order surface dates rows by
          // `issuedAt ?? createdAt`, so the override has to travel with the summary.
          issuedAt: true,
          dueDate: true,
          clientAccount: true,
          // The home view links each invoice straight out to its hosted Stripe
          // invoice, so the URL travels with the summary.
          stripeInvoiceUrl: true,
        },
        populate: {
          'client-accounts': { name: true, firstName: true, company: true },
        },
        // The query sorts by createdAt because Mongo can't fall back to it when
        // issuedAt is unset — it would bunch every un-overridden order at one end.
        // So the fetch stays coarse and the real ordering happens here, once.
      }).then((r) => ({ ...r, docs: sortByOrderDate(r.docs as any[]) }))

// Retainers are ongoing work the same way a project is, so the home view counts
// them alongside projects. Only `active` qualifies — `scoping` has no plan yet
// and `inactive` is off the board.
const findActiveRetainers = (payload: Payload, user: CurrentUser, accountIds: any[]) =>
  user.role !== 'admin' && accountIds.length === 0
    ? Promise.resolve({ docs: [] as any[] })
    : payload.find({
        collection: 'retainers',
        where: user.role === 'admin'
          ? { status: { equals: 'active' } }
          : { and: [{ status: { equals: 'active' } }, { clientAccount: { in: accountIds } }] },
        depth: 1,
        sort: '-activatedAt',
        limit: 100,
        select: {
          status: true,
          tier: true,
          monthlyFee: true,
          hoursPerMonth: true,
          startDate: true,
          activatedAt: true,
          clientAccount: true,
        },
        populate: {
          'client-accounts': { name: true, firstName: true, company: true },
        },
      }).catch(() => ({ docs: [] as any[] }))

const findAllPackages = (payload: Payload) =>
  payload.find({
    collection: 'packages',
    depth: 1,
    sort: '-createdAt',
    limit: 200,
  }).catch(() => ({ docs: [] as any[] }))

const findAllFiles = (payload: Payload) =>
  payload.find({
    collection: 'files',
    depth: 1,
    sort: '-createdAt',
    limit: 200,
  }).catch(() => ({ docs: [] as any[] }))

const findProjectSprints = (payload: Payload, projectIds: any[], limit: number) =>
  projectIds.length > 0
    ? payload.find({
        collection: 'sprints',
        where: { project: { in: projectIds } },
        depth: 0,
        sort: 'startDate',
        limit,
      })
    : Promise.resolve({ docs: [] as any[] })

const buildSerializedProjects = (projects: any[], sprints: any[], tasks: any[]): SerializedProject[] => {
  const sprintsByProject = groupSprintsByProject(sprints)
  const tasksByProject = groupTasksByProject(tasks)
  return projects.map((p: any) => serializeProject(p, sprintsByProject[p.id] ?? [], tasksByProject[p.id] ?? []))
}

// Orders have no assignedTo — staff scoping filters them to the visible accounts.
const filterOrdersToAccounts = (orders: any[], accountIds: any[]) =>
  accountIds.length > 0
    ? orders.filter((o: any) => {
        const caId = typeof o.clientAccount === 'object' ? o.clientAccount?.id : o.clientAccount
        return accountIds.includes(caId)
      })
    : []

// ── Staff: home ───────────────────────────────────────────────────────────────

export interface StaffHomeData {
  firstName?: string | null
  clientAccounts: any[]
  allOrders: any[]
  allProjects: any[]
  allTasks: any[]
  allPackages: any[]
  completedTasksCount: number
  completedSprintsCount: number
  serializedProjects: SerializedProject[]
  activeRetainers: any[]
}

export async function loadStaffHome(payload: Payload, user: CurrentUser): Promise<StaffHomeData> {
  const [{ docs: clientAccounts }, { docs: allProjects }, { docs: allTasks }, { docs: allPackages }, { totalDocs: completedTasksCount }] =
    await Promise.all([
      findStaffClientAccounts(payload, user),
      findStaffProjects(payload, user),
      findStaffTasks(payload, user),
      findAllPackages(payload),
      payload.find({
        collection: 'tasks',
        where: user.role === 'admin'
          ? { status: { equals: 'completed' } }
          : { and: [{ assignedTo: { equals: user.id } }, { status: { equals: 'completed' } }] },
        limit: 1,
      }),
    ])

  const projectIds = allProjects.map((p: any) => p.id)
  const accountIds = clientAccounts.map((ca: any) => ca.id)

  // Orders join the second batch (it exists anyway for sprints) since the
  // non-admin query needs accountIds from batch one.
  const [{ docs: allOrders }, { totalDocs: completedSprintsCount }, sprintsResult, { docs: activeRetainers }] = await Promise.all([
    findStaffOrders(payload, user, accountIds),
    payload.find({
      collection: 'sprints',
      where: projectIds.length > 0
        ? { and: [{ project: { in: projectIds } }, { status: { equals: 'finished' } }] }
        : { id: { equals: 'none' } },
      limit: 1,
    }),
    findProjectSprints(payload, projectIds, 500),
    findActiveRetainers(payload, user, accountIds),
  ])

  return {
    firstName: user.firstName,
    clientAccounts,
    allOrders: filterOrdersToAccounts(allOrders, accountIds),
    allProjects,
    allTasks,
    allPackages,
    completedTasksCount,
    completedSprintsCount,
    serializedProjects: buildSerializedProjects(allProjects, (sprintsResult as any).docs ?? [], allTasks),
    activeRetainers,
  }
}

// ── Staff: projects tab ───────────────────────────────────────────────────────

export interface StaffProjectsData {
  serializedProjects: SerializedProject[]
  clientOptions: ClientOption[]
}

export async function loadStaffProjectsTab(payload: Payload, user: CurrentUser): Promise<StaffProjectsData> {
  const [{ docs: clientAccounts }, { docs: allProjects }, { docs: allTasks }] = await Promise.all([
    findStaffClientAccounts(payload, user),
    findStaffProjects(payload, user),
    findStaffTasks(payload, user),
  ])
  const sprintsResult = await findProjectSprints(payload, allProjects.map((p: any) => p.id), 500)

  return {
    serializedProjects: buildSerializedProjects(allProjects, (sprintsResult as any).docs ?? [], allTasks),
    clientOptions: clientAccounts.map((c: any) => ({ id: c.id, name: c.name })),
  }
}

// ── Staff: clients tab ────────────────────────────────────────────────────────

export interface StaffClientsData {
  clientAccounts: any[]
  serializedProjects: SerializedProject[]
  allOrders: any[]
}

export async function loadStaffClientsTab(payload: Payload, user: CurrentUser): Promise<StaffClientsData> {
  const [{ docs: clientAccounts }, { docs: allProjects }, { docs: allTasks }] = await Promise.all([
    findStaffClientAccounts(payload, user),
    findStaffProjects(payload, user),
    findStaffTasks(payload, user),
  ])
  const accountIds = clientAccounts.map((ca: any) => ca.id)

  const [{ docs: allOrders }, sprintsResult] = await Promise.all([
    findStaffOrders(payload, user, accountIds),
    findProjectSprints(payload, allProjects.map((p: any) => p.id), 500),
  ])

  return {
    clientAccounts,
    serializedProjects: buildSerializedProjects(allProjects, (sprintsResult as any).docs ?? [], allTasks),
    allOrders: filterOrdersToAccounts(allOrders, accountIds),
  }
}

// ── Staff: tasks tab ──────────────────────────────────────────────────────────

export interface StaffTasksData {
  tasks: any[]
  sprints: any[]
  projects: { id: string; name: string }[]
}

export async function loadStaffTasksTab(payload: Payload, user: CurrentUser): Promise<StaffTasksData> {
  const [{ docs: allProjects }, { docs: allTasks }] = await Promise.all([
    findStaffProjects(payload, user),
    findStaffTasks(payload, user),
  ])
  const sprintsResult = await findProjectSprints(payload, allProjects.map((p: any) => p.id), 500)

  return {
    tasks: allTasks,
    sprints: (sprintsResult as any).docs ?? [],
    projects: allProjects.map((p: any) => ({ id: p.id, name: p.name ?? '' })),
  }
}

// ── Staff: packages tab ───────────────────────────────────────────────────────

export async function loadStaffPackagesTab(payload: Payload): Promise<{ allPackages: any[] }> {
  const { docs: allPackages } = await findAllPackages(payload)
  return { allPackages }
}

// ── Staff: files tab ──────────────────────────────────────────────────────────

export interface StaffFilesData {
  allFiles: any[]
  allProjects: { id: string; name: string }[]
  allSprints: { id: string; name: string; project: any }[]
  clientAccounts: { id: string; name: string; email: string }[]
}

export async function loadStaffFilesTab(payload: Payload, user: CurrentUser): Promise<StaffFilesData> {
  const [{ docs: allFiles }, { docs: allProjects }, { docs: clientAccounts }] = await Promise.all([
    findAllFiles(payload),
    findStaffProjects(payload, user),
    findStaffClientAccounts(payload, user),
  ])
  const sprintsResult = await findProjectSprints(payload, allProjects.map((p: any) => p.id), 500)

  return {
    allFiles,
    allProjects: allProjects.map((p: any) => ({ id: p.id, name: p.name ?? '' })),
    allSprints: ((sprintsResult as any).docs ?? []).map((s: any) => ({
      id: s.id,
      name: s.name ?? '',
      project: s.project,
    })),
    clientAccounts: clientAccounts.map((c: any) => ({
      id: c.id,
      name: c.name ?? '',
      email: c.email ?? '',
    })),
  }
}

// ── Staff: recent activity ────────────────────────────────────────────────────
// The `activity` collection is an append-only feed written by hooks (see
// src/lib/payload/hooks/recordActivity.ts): orders created, projects created
// and meaningfully changed, retainer hours logged, emails sent.
//
// Scoping follows the other staff loaders — role is DATA SCOPING here, not
// presentation. Admins see every event; a `user` sees only events attached to a
// client account or project they are assigned to, which is resolved from the
// same two queries the rest of the staff tabs already run. Events with neither
// (an email to an address that matched no account) are admin-only by
// construction, since a non-admin's filter can only match on those two fields.
//
// select trims the row to exactly what <ActivityFeed> renders; depth 0 keeps
// the relationships as ids, since every label the feed shows was denormalized
// onto the row at write time.

export async function loadStaffActivity(
  payload: Payload,
  user: CurrentUser,
  limit = 40,
): Promise<{ activity: ActivityEvent[] }> {
  let where: Record<string, any> = {}

  if (user.role !== 'admin') {
    const [{ docs: clientAccounts }, { docs: projects }] = await Promise.all([
      findStaffClientAccounts(payload, user),
      findStaffProjects(payload, user),
    ])
    const accountIds = clientAccounts.map((ca: any) => ca.id)
    const projectIds = projects.map((p: any) => p.id)
    if (accountIds.length === 0 && projectIds.length === 0) return { activity: [] }

    where = {
      or: [
        ...(accountIds.length > 0 ? [{ clientAccount: { in: accountIds } }] : []),
        ...(projectIds.length > 0 ? [{ project: { in: projectIds } }] : []),
      ],
    }
  }

  const { docs } = await payload
    .find({
      collection: 'activity',
      where,
      depth: 0,
      sort: '-occurredAt',
      limit,
      select: {
        kind: true,
        occurredAt: true,
        title: true,
        summary: true,
        status: true,
        amount: true,
        href: true,
        actorName: true,
        changes: true,
      },
    })
    // A feed is advisory — a query failure must not take the whole tab down.
    .catch(() => ({ docs: [] as any[] }))

  return {
    activity: docs.map((d: any) => ({
      id: String(d.id),
      kind: d.kind,
      occurredAt: d.occurredAt,
      title: d.title ?? '',
      meta: d.summary ?? null,
      status: d.status ?? null,
      amount: typeof d.amount === 'number' ? d.amount : null,
      href: d.href ?? null,
      actorName: d.actorName ?? null,
      changes: Array.isArray(d.changes)
        ? d.changes.map((c: any) => ({ field: c.field, from: c.from ?? null, to: c.to ?? null }))
        : undefined,
    })),
  }
}

// ── Client: shared account resolution ─────────────────────────────────────────
// Returns null when the user has no (or a stale) client account — the caller
// renders the AccountNotFound state.

// cache(): the spaces layout (badge count) and the page resolve the same
// account in one request — memoizing collapses them to a single findByID.
export const resolveClientAccount = cache(
  async (payload: Payload, user: CurrentUser): Promise<any | null> => {
    if (!user.clientAccount) return null
    try {
      return await payload.findByID({
        collection: 'client-accounts',
        id: typeof user.clientAccount === 'string'
          ? user.clientAccount
          : (user.clientAccount as any).id,
        depth: 1,
      })
    } catch {
      // Stale reference — treat as no account
      return null
    }
  },
)

// The client account whose portal to render: the previewed account when staff
// is in "view as client" mode, otherwise the user's own account. Every client
// experience route resolves through this so preview and real-client paths share
// one code path. cache()d — layout badge + page collapse to a single findByID.
export const resolveActiveClientAccount = cache(
  async (payload: Payload, user: CurrentUser): Promise<any | null> => {
    const previewId = await getPreviewClientId(user)
    if (previewId) {
      try {
        return await payload.findByID({ collection: 'client-accounts', id: previewId, depth: 1 })
      } catch {
        return null
      }
    }
    return resolveClientAccount(payload, user)
  },
)

// ── Shared client queries ─────────────────────────────────────────────────────

const findClientProjects = (payload: Payload, clientAccountId: any) =>
  payload.find({
    collection: 'projects',
    where: { client: { equals: clientAccountId } },
    depth: 1,
    sort: '-updatedAt',
    limit: 50,
  })

const findClientOrders = (payload: Payload, clientAccountId: any) =>
  payload.find({
    collection: 'orders',
    where: { clientAccount: { equals: clientAccountId } },
    depth: 1,
    sort: '-createdAt',
    limit: 100,
  }).then((r) => ({ ...r, docs: sortByOrderDate(r.docs as any[]) }))

const findClientProposalPackages = (payload: Payload, clientAccountId: any) =>
  payload.find({
    collection: 'packages',
    where: {
      and: [
        { clientAccount: { equals: clientAccountId } } as any,
        { type: { equals: 'proposal' } } as any,
      ],
    },
    depth: 0,
    sort: '-createdAt',
    limit: 20,
  }).catch(() => ({ docs: [] as any[] }))

// ── Client: home ──────────────────────────────────────────────────────────────

export interface ClientHomeData {
  firstName?: string | null
  showTips: boolean
  clientProjects: any[]
  orders: any[]
  clientSprints: any[]
  clientPackages: any[]
}

export async function loadClientHome(payload: Payload, user: CurrentUser, clientAccount: any): Promise<ClientHomeData> {
  const [{ docs: clientProjects }, { docs: orders }, packagesResult] = await Promise.all([
    findClientProjects(payload, clientAccount.id),
    findClientOrders(payload, clientAccount.id),
    findClientProposalPackages(payload, clientAccount.id),
  ])

  const clientProjectIds = clientProjects.map((p: any) => p.id)
  const sprintsResult = await findProjectSprints(payload, clientProjectIds, 200)

  return {
    firstName: user.firstName,
    showTips: (user as any).showTips !== false,
    clientProjects,
    orders,
    clientSprints: (sprintsResult as any).docs ?? [],
    clientPackages: packagesResult.docs,
  }
}

// ── Client: projects tab ──────────────────────────────────────────────────────

export async function loadClientProjectsTab(payload: Payload, clientAccount: any): Promise<{ serializedClientProjects: SerializedProject[] }> {
  const { docs: clientProjects } = await findClientProjects(payload, clientAccount.id)
  const clientProjectIds = clientProjects.map((p: any) => p.id)

  const [sprintsResult, { docs: clientTasks }] = await Promise.all([
    findProjectSprints(payload, clientProjectIds, 200),
    clientProjectIds.length > 0
      ? payload.find({
          collection: 'tasks',
          where: { and: [{ project: { in: clientProjectIds } }, { dueDate: { exists: true } }] },
          depth: 0,
          sort: 'dueDate',
          limit: 500,
        })
      : Promise.resolve({ docs: [] as any[] }),
  ])

  return {
    serializedClientProjects: buildSerializedProjects(clientProjects, (sprintsResult as any).docs ?? [], clientTasks)
      .sort((a: SerializedProject, b: SerializedProject) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
  }
}

// ── Client: invoices tab ──────────────────────────────────────────────────────

export async function loadClientInvoices(payload: Payload, clientAccount: any): Promise<{ orders: any[]; clientPackages: any[] }> {
  const [{ docs: orders }, packagesResult] = await Promise.all([
    findClientOrders(payload, clientAccount.id),
    findClientProposalPackages(payload, clientAccount.id),
  ])
  return { orders, clientPackages: packagesResult.docs }
}

// ── Client: packages tab ──────────────────────────────────────────────────────

export async function loadClientPackagesTab(payload: Payload, clientAccount: any): Promise<{ clientPackages: any[] }> {
  const packagesResult = await findClientProposalPackages(payload, clientAccount.id)
  return { clientPackages: packagesResult.docs }
}

// ── Client: accounts (credentials) tab ────────────────────────────────────────

export async function loadClientCredentials(payload: Payload, clientAccount: any): Promise<{ clientCredentials: any[] }> {
  const { docs: clientCredentials } = await payload.find({
    collection: 'credentials',
    where: { 'project.client': { equals: clientAccount.id } },
    depth: 1,
    sort: 'title',
    limit: 200,
  }).catch(() => ({ docs: [] as any[] }))
  return { clientCredentials }
}

// ── Client: proposal-package count (mobile nav badge) ─────────────────────────

export async function countClientProposalPackages(payload: Payload, user: CurrentUser): Promise<number> {
  const clientAccount = await resolveActiveClientAccount(payload, user)
  if (!clientAccount) return 0
  const { totalDocs } = await payload.find({
    collection: 'packages',
    where: {
      and: [
        { clientAccount: { equals: clientAccount.id } } as any,
        { type: { equals: 'proposal' } } as any,
      ],
    },
    limit: 1,
  }).catch(() => ({ totalDocs: 0 }))
  return totalDocs
}
