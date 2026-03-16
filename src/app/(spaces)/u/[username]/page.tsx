import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Button } from '@/components/ui/button'
import { HelpCircle, Mail } from 'lucide-react'
import type { SerializedProject, SerializedSprint, SerializedTask } from '@/components/dashboard/ProjectsCarousel'
import { DashboardTabView } from './DashboardTabView'

// ── Serialization helpers ─────────────────────────────────────────────────────

function serializeProject(p: any, sprints: SerializedSprint[] = [], tasks: SerializedTask[] = []): SerializedProject {
  const clientRaw = p.client
  const client =
    clientRaw && typeof clientRaw === 'object'
      ? { id: clientRaw.id ?? '', name: clientRaw.name ?? '' }
      : null

  return {
    id: p.id,
    name: p.name ?? '',
    status: p.status ?? 'active',
    description: p.description ?? null,
    startDate: p.startDate ?? null,
    endDate: p.projectedEndDate ?? null,
    budget: p.budgetAmount ?? null,
    currency: p.currency ?? 'USD',
    updatedAt: p.updatedAt ?? new Date().toISOString(),
    client,
    milestones: (p.milestones ?? []).map((m: any) => ({
      id: m.id ?? '',
      title: m.title ?? '',
      date: m.date ?? null,
      description: m.description ?? null,
      completed: m.completed ?? false,
    })),
    sprints,
    tasks,
  }
}

function serializeSprint(s: any): SerializedSprint {
  const projectId = typeof s.project === 'string' ? s.project : s.project?.id ?? ''
  return {
    id: s.id,
    name: s.name ?? '',
    status: s.status ?? 'pending',
    startDate: s.startDate ?? new Date().toISOString(),
    endDate: s.endDate ?? new Date().toISOString(),
    description: s.description ?? null,
    goalDescription: s.goalDescription ?? null,
    completedTasksCount: s.completedTasksCount ?? 0,
    totalTasksCount: s.totalTasksCount ?? 0,
    projectId,
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { username } = await params
  const { tab } = await searchParams
  const label = tab ? tab.charAt(0).toUpperCase() + tab.slice(1) : 'Home'
  return {
    title: `${label} - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string; timeframe?: string }>
}) {
  const { username } = await params
  const { timeframe: rawTimeframe } = await searchParams
  const timeframe = rawTimeframe === '30d' ? '30d' : rawTimeframe === '90d' ? '90d' : '7d'

  const user = await getCurrentUser()
  if (!user || user.username !== username) redirect('/login')
  if (!user.username) redirect('/login')

  const payload = await getPayload({ config })

  // ── Admin / user ─────────────────────────────────────────────────────────────

  if (user.role === 'admin' || user.role === 'user') {
    const [{ docs: clientAccounts }, { docs: allOrders }, { docs: allProjects }, { docs: allTasks }, { docs: allPackages }, { docs: allFiles }] =
      await Promise.all([
        payload.find({
          collection: 'client-accounts',
          where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
          depth: 1,
          limit: 100,
        }),
        payload.find({
          collection: 'orders',
          depth: 1,
          sort: '-createdAt',
          limit: 500,
        }),
        payload.find({
          collection: 'projects',
          where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
          depth: 2,
          sort: '-updatedAt',
          limit: 100,
        }),
        payload.find({
          collection: 'tasks',
          where: user.role === 'admin' ? {} : { assignedTo: { equals: user.id } },
          depth: 2,
          sort: '-dueDate',
          limit: 100,
        }),
        payload.find({
          collection: 'packages',
          depth: 1,
          sort: '-createdAt',
          limit: 200,
        }).catch(() => ({ docs: [] })),
        payload.find({
          collection: 'files',
          depth: 1,
          sort: '-createdAt',
          limit: 200,
        }).catch(() => ({ docs: [] })),
      ])

    const projectIds = allProjects.map((p: any) => p.id)
    const clientAccountIds = clientAccounts.map((ca: any) => ca.id)

    const [{ totalDocs: completedTasksCount }, { totalDocs: completedSprintsCount }, sprintsResult] =
      await Promise.all([
        payload.find({
          collection: 'tasks',
          where: user.role === 'admin'
            ? { status: { equals: 'completed' } }
            : { and: [{ assignedTo: { equals: user.id } }, { status: { equals: 'completed' } }] },
          limit: 1,
        }),
        payload.find({
          collection: 'sprints',
          where: projectIds.length > 0
            ? { and: [{ project: { in: projectIds } }, { status: { equals: 'finished' } }] }
            : { id: { equals: 'none' } },
          limit: 1,
        }),
        projectIds.length > 0
          ? payload.find({
              collection: 'sprints',
              where: { project: { in: projectIds } },
              depth: 0,
              sort: 'startDate',
              limit: 500,
            })
          : Promise.resolve({ docs: [] }),
      ])

    const allSprints = (sprintsResult as any).docs ?? []
    const sprintsByProject: Record<string, SerializedSprint[]> = {}
    for (const s of allSprints) {
      const pid = typeof s.project === 'string' ? s.project : (s.project as any)?.id ?? ''
      if (!sprintsByProject[pid]) sprintsByProject[pid] = []
      sprintsByProject[pid].push(serializeSprint(s))
    }

    const tasksByProject: Record<string, SerializedTask[]> = {}
    for (const t of allTasks) {
      if (!t.dueDate) continue
      const pid = typeof t.project === 'string' ? t.project : (t.project as any)?.id ?? ''
      if (!pid) continue
      if (!tasksByProject[pid]) tasksByProject[pid] = []
      tasksByProject[pid].push({
        id: t.id,
        title: t.title ?? '',
        status: (t.status ?? 'pending') as SerializedTask['status'],
        priority: (t.priority ?? null) as SerializedTask['priority'],
        dueDate: t.dueDate,
      })
    }

    const filteredOrders = clientAccountIds.length > 0
      ? allOrders.filter((o: any) => {
          const caId = typeof o.clientAccount === 'object' ? o.clientAccount?.id : o.clientAccount
          return clientAccountIds.includes(caId)
        })
      : []

    return (
      <DashboardTabView
        username={username}
        role={user.role}
        timeframe={timeframe}
        adminData={{
          firstName: user.firstName,
          clientAccounts,
          allOrders: filteredOrders,
          allProjects,
          allTasks,
          allSprints,
          completedTasksCount,
          completedSprintsCount,
          serializedProjects: allProjects.map((p: any) =>
            serializeProject(p, sprintsByProject[p.id] ?? [], tasksByProject[p.id] ?? [])
          ),
          allPackages,
          allFiles,
          clientOptions: clientAccounts.map((c: any) => ({ id: c.id, name: c.name })),
        }}
      />
    )
  }

  // ── Client ────────────────────────────────────────────────────────────────────

  let clientAccount = null
  if (user.clientAccount) {
    try {
      clientAccount = await payload.findByID({
        collection: 'client-accounts',
        id: typeof user.clientAccount === 'string'
          ? user.clientAccount
          : (user.clientAccount as any).id,
        depth: 1,
      })
    } catch {
      // Stale reference — treat as no account
    }
  }

  if (!clientAccount) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-5">
            <HelpCircle className="size-7 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-[#F0F0F0] mb-2">Account Not Found</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your client account could not be found. Please contact support for assistance.
          </p>
          <Button asChild size="sm" className="bg-[var(--space-accent)] text-white hover:bg-[var(--space-accent)]/90 font-medium">
            <a href="/contact" className="gap-2">
              <Mail className="size-3.5" />
              Contact Support
            </a>
          </Button>
        </div>
      </div>
    )
  }

  const [{ docs: clientProjects }, { docs: orders }, clientPackagesResult, { docs: clientCredentials }] = await Promise.all([
    payload.find({
      collection: 'projects',
      where: { client: { equals: clientAccount.id } },
      depth: 1,
      sort: '-updatedAt',
      limit: 50,
    }),
    payload.find({
      collection: 'orders',
      where: { clientAccount: { equals: clientAccount.id } },
      depth: 1,
      sort: '-createdAt',
      limit: 100,
    }),
    payload.find({
      collection: 'packages',
      where: {
        and: [
          { clientAccount: { equals: clientAccount.id } } as any,
          { type: { equals: 'proposal' } } as any,
        ],
      },
      depth: 0,
      sort: '-createdAt',
      limit: 20,
    }).catch(() => ({ docs: [] })),
    payload.find({
      collection: 'credentials',
      where: { 'project.client': { equals: clientAccount.id } },
      depth: 1,
      sort: 'title',
      limit: 200,
    }).catch(() => ({ docs: [] })),
  ])
  const clientPackages = clientPackagesResult.docs

  const clientProjectIds = clientProjects.map((p: any) => p.id)
  let clientSprints: any[] = []
  let clientTasksByProject: Record<string, SerializedTask[]> = {}
  if (clientProjectIds.length > 0) {
    const [{ docs: sprints }, { docs: clientTasks }] = await Promise.all([
      payload.find({
        collection: 'sprints',
        where: { project: { in: clientProjectIds } },
        depth: 0,
        sort: 'startDate',
        limit: 200,
      }),
      payload.find({
        collection: 'tasks',
        where: { and: [{ project: { in: clientProjectIds } }, { dueDate: { exists: true } }] },
        depth: 0,
        sort: 'dueDate',
        limit: 500,
      }),
    ])
    clientSprints = sprints
    for (const t of clientTasks) {
      if (!t.dueDate) continue
      const pid = typeof t.project === 'string' ? t.project : (t.project as any)?.id ?? ''
      if (!pid) continue
      if (!clientTasksByProject[pid]) clientTasksByProject[pid] = []
      clientTasksByProject[pid].push({
        id: t.id,
        title: t.title ?? '',
        status: (t.status ?? 'pending') as SerializedTask['status'],
        priority: (t.priority ?? null) as SerializedTask['priority'],
        dueDate: t.dueDate,
      })
    }
  }

  const clientSprintsByProject: Record<string, SerializedSprint[]> = {}
  for (const s of clientSprints) {
    const pid = typeof s.project === 'string' ? s.project : (s.project as any)?.id ?? ''
    if (!clientSprintsByProject[pid]) clientSprintsByProject[pid] = []
    clientSprintsByProject[pid].push(serializeSprint(s))
  }

  return (
    <DashboardTabView
      username={username}
      role={user.role}
      clientData={{
        firstName: user.firstName,
        showTips: (user as any).showTips !== false,
        clientAccount,
        clientProjects,
        orders,
        clientSprints,
        clientPackages,
        clientCredentials,
        serializedClientProjects: clientProjects
          .map((p: any) => serializeProject(p, clientSprintsByProject[p.id] ?? [], clientTasksByProject[p.id] ?? []))
          .sort((a: SerializedProject, b: SerializedProject) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ),
      }}
    />
  )
}
