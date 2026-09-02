import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/app/(spaces)/session'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getClientAccountDetail } from './detail-data'
import type { ClientAccount, Project, User as UserType } from '@/types/payload-types'
import {
  serializeSprint,
  groupSprintsByProject,
  type SerializedProject,
  type SerializedSprint,
  type SerializedTask,
} from '@/lib/serialization'
import { ClientDetailTabView } from './ClientDetailTabView'
import { sortByOrderDate } from '@/lib/dashboard/order-date'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; client: string }>
}) {
  const { client: clientId } = await params
  const clientAccount = await getClientAccountDetail(clientId)
  if (!clientAccount) return { title: 'Client — ORCACLUB' }
  return {
    title: `${clientAccount.name} — ORCACLUB`,
    description: `Client account for ${clientAccount.name}`,
  }
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; client: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { username, client: clientId } = await params
  const { tab: rawTab } = await searchParams
  const validTabs = ['overview', 'projects', 'orders', 'packages', 'accounts'] as const
  type ClientTab = (typeof validTabs)[number]
  const initialTab: ClientTab = (validTabs as readonly string[]).includes(rawTab ?? '')
    ? (rawTab as ClientTab)
    : 'overview'

  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')

  const payload = await getPayload({ config })

  const clientAccount: ClientAccount | null = await getClientAccountDetail(clientId)
  if (!clientAccount) notFound()

  const [{ docs: orderDocs }, { docs: projects }, { docs: clientUsers }, packagesResult, credentialsResult] =
    await Promise.all([
      payload.find({
        collection: 'orders',
        where: { clientAccount: { equals: clientId } },
        depth: 1,
        sort: '-createdAt',
        limit: 100,
      }),
      payload.find({
        collection: 'projects',
        where: { client: { equals: clientId } },
        depth: 1,
        sort: '-createdAt',
        limit: 100,
      }),
      payload.find({
        collection: 'users',
        where: { clientAccount: { equals: clientId }, role: { equals: 'client' } },
        depth: 0,
        sort: 'firstName',
        limit: 50,
      }),
      payload.find({
        collection: 'packages',
        where: {
          and: [
            { clientAccount: { equals: clientId } } as any,
            { type: { equals: 'proposal' } } as any,
          ],
        },
        depth: 0,
        sort: '-createdAt',
        limit: 100,
      }).catch(() => ({ docs: [] })),
      payload.find({
        collection: 'credentials',
        where: { 'project.client': { equals: clientId } },
        depth: 1,
        sort: 'title',
        limit: 500,
      }).catch(() => ({ docs: [] })),
    ])
  // Ordered on the effective date (issuedAt ?? createdAt), not the fetch order —
  // a backdated invoice belongs where its date puts it, not where it was written.
  const orders = sortByOrderDate(orderDocs as any[])
  const packages = packagesResult.docs
  const credentials = credentialsResult.docs

  // Work-log counts per package — drives the "N logged · M planned open" chip on
  // each scheduled-payment row. One query for all of this client's packages.
  const workCounts: Record<string, { pending: number; plannedOpen: number }> = {}
  if (packages.length > 0) {
    const { docs: workEntries } = await payload
      .find({
        collection: 'package-work-entries',
        where: { package: { in: packages.map((p: any) => p.id) } },
        depth: 0,
        limit: 5000,
      })
      .catch(() => ({ docs: [] as any[] }))
    for (const e of workEntries as any[]) {
      const pid = typeof e.package === 'object' ? e.package?.id : e.package
      if (!pid) continue
      const b = (workCounts[pid] ??= { pending: 0, plannedOpen: 0 })
      if (e.status === 'logged' && !e.billedOrderId) b.pending += 1
      if (e.status === 'planned' && e.completion !== 'complete') b.plannedOpen += 1
    }
  }

  const packageOrderMap: Record<string, any[]> = {}
  for (const o of orders) {
    const pkgId =
      typeof (o as any).packageRef === 'string'
        ? (o as any).packageRef
        : ((o as any).packageRef as any)?.id
    if (pkgId) {
      if (!packageOrderMap[pkgId]) packageOrderMap[pkgId] = []
      packageOrderMap[pkgId].push(o)
    }
  }

  const projectIds = projects.map((p) => p.id)
  const { docs: allSprints } =
    projectIds.length > 0
      ? await payload.find({
          collection: 'sprints',
          where: { project: { in: projectIds } },
          depth: 0,
          sort: 'startDate',
          limit: 500,
        })
      : { docs: [] }

  const sprintsByProject = groupSprintsByProject(allSprints)

  const serializedProjects: SerializedProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name ?? '',
    status: p.status ?? 'pending',
    description: p.description ?? null,
    startDate: p.startDate ?? null,
    endDate: p.projectedEndDate ?? null,
    budget: p.budgetAmount ?? null,
    currency: p.currency ?? 'USD',
    updatedAt: p.updatedAt ?? new Date().toISOString(),
    client: { id: clientId, name: clientAccount.name },
    milestones: (p.milestones ?? []).map((m: any) => ({
      id: m.id ?? '',
      title: m.title ?? '',
      date: m.date ?? null,
      description: m.description ?? null,
      completed: m.completed ?? false,
    })),
    sprints: sprintsByProject[p.id] ?? [],
    tasks: [] as SerializedTask[],
  }))

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const paidOrders = orders.filter((o) => o.status === 'paid')
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.amount || 0), 0)

  const teamMembers = Array.isArray(clientAccount.assignedTo)
    ? clientAccount.assignedTo
        .filter((u): u is UserType => typeof u !== 'string')
        .map((u) => ({
          id: u.id,
          name: (u.name || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email) ?? '',
          title: u.title ?? null,
        }))
    : []

  const clientUsersList = clientUsers.map((u) => ({
    id: u.id,
    name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
    email: u.email,
  }))

  return (
    <ClientDetailTabView
      initialTab={initialTab}
      username={username}
      clientId={clientId}
      clientAccount={clientAccount}
      orders={orders as any[]}
      projects={projects as Project[]}
      clientUsers={clientUsersList}
      packages={packages}
      workCounts={workCounts}
      credentials={credentials}
      packageOrderMap={packageOrderMap}
      serializedProjects={serializedProjects}
      pendingOrders={pendingOrders}
      paidOrders={paidOrders}
      totalRevenue={totalRevenue}
      teamMembers={teamMembers}
      userRole={user.role ?? 'user'}
    />
  )
}
