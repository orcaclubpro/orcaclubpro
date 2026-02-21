import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProjectsCarousel } from '@/components/dashboard/ProjectsCarousel'
import { ProjectsSidebar } from '@/components/dashboard/ProjectsSidebar'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import type { SerializedProject, SerializedSprint } from '@/components/dashboard/ProjectsCarousel'
import type { ClientOption } from '@/components/dashboard/CreateProjectModal'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Projects - ${username} - ORCACLUB Spaces`,
    description: 'View and manage your projects',
  }
}

function serializeProject(p: any, sprints: SerializedSprint[] = []): SerializedProject {
  return {
    id: p.id,
    name: p.name ?? '',
    status: p.status ?? 'active',
    description: p.description ?? null,
    startDate: p.startDate ?? null,
    endDate: p.endDate ?? null,
    budget: p.budget ?? null,
    updatedAt: p.updatedAt ?? new Date().toISOString(),
    milestones: (p.milestones ?? []).map((m: any) => ({
      id: m.id ?? '',
      title: m.title ?? '',
      completed: m.completed ?? false,
    })),
    sprints,
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

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getCurrentUser()

  if (!user || user.username !== username) redirect('/login')
  if (!user.username) redirect('/login')

  const payload = await getPayload({ config })

  // ─── ADMIN / USER ─────────────────────────────────────────────────────────

  if (user.role === 'admin' || user.role === 'user') {
    const { docs: projects } = await payload.find({
      collection: 'projects',
      where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
      depth: 2,
      sort: '-updatedAt',
      limit: 100,
    })

    // Fetch all sprints for these projects in one query
    const projectIds = projects.map(p => p.id)
    const sprintsByProject: Record<string, SerializedSprint[]> = {}

    if (projectIds.length > 0) {
      const { docs: sprints } = await payload.find({
        collection: 'sprints',
        where: { project: { in: projectIds } },
        depth: 0,
        sort: 'startDate',
        limit: 500,
      })
      for (const s of sprints) {
        const pid = typeof s.project === 'string' ? s.project : (s.project as any)?.id ?? ''
        if (!sprintsByProject[pid]) sprintsByProject[pid] = []
        sprintsByProject[pid].push(serializeSprint(s))
      }
    }

    const serialized = projects.map(p => serializeProject(p, sprintsByProject[p.id] ?? []))

    // Fetch client accounts for the project create selector
    const { docs: clientAccounts } = await payload.find({
      collection: 'client-accounts',
      depth: 0,
      sort: 'name',
      limit: 200,
    })
    const clientOptions: ClientOption[] = clientAccounts.map(c => ({ id: c.id, name: c.name }))

    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-20 space-y-8">
          {/* Page header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">
                {user.role === 'admin' ? 'Admin' : 'Dashboard'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Projects
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {serialized.length} project{serialized.length !== 1 ? 's' : ''}
                {' '}· sorted by latest activity
              </p>
            </div>
            <CreateProjectModal clients={clientOptions} />
          </div>

          {/* Carousel */}
          <ProjectsCarousel projects={serialized} username={username} />
        </div>

        {/* Floating sidebar — all projects list */}
        <ProjectsSidebar
          projects={serialized}
          username={username}
          canCreate={true}
        />
      </>
    )
  }

  // ─── CLIENT VIEW ──────────────────────────────────────────────────────────

  let clientAccount = null
  if (user.clientAccount) {
    try {
      clientAccount = await payload.findByID({
        collection: 'client-accounts',
        id: typeof user.clientAccount === 'string'
          ? user.clientAccount
          : (user.clientAccount as any).id,
        depth: 2,
      })
    } catch {
      // ClientAccount was deleted but User still has a stale reference — treat as no account
    }
  }

  if (!clientAccount) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <p className="text-sm font-semibold text-white mb-2">Account Not Found</p>
          <p className="text-xs text-gray-500 mb-6">
            Your client account could not be found. Please contact support.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-intelligence-cyan text-black text-xs font-medium hover:bg-intelligence-cyan/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  const rawProjects = clientAccount.projects || []
  const serialized = rawProjects
    .filter((p: any) => p && typeof p === 'object' && p.id)
    .map((p: any) => serializeProject(p, []))
    .sort((a: SerializedProject, b: SerializedProject) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-20 space-y-8">
        {/* Page header */}
        <div>
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">
            Client Dashboard
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Your Projects
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {serialized.length} project{serialized.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Carousel */}
        <ProjectsCarousel projects={serialized} username={username} />
      </div>

      {/* Floating sidebar — browse all projects */}
      <ProjectsSidebar
        projects={serialized}
        username={username}
        canCreate={false}
      />
    </>
  )
}
