import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ProjectSidebar } from '@/components/dashboard/ProjectSidebar'
import { ProjectTabNav } from '@/components/dashboard/ProjectTabNav'
import { SprintsTab } from '@/components/dashboard/SprintsTab'
import { TasksTab } from '@/components/dashboard/TasksTab'
import type { Project, Task, Sprint } from '@/types/payload-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; project: string }>
}) {
  const { project: projectId } = await params
  try {
    const payload = await getPayload({ config })
    const project = await payload.findByID({ collection: 'projects', id: projectId, depth: 0 })
    return {
      title: `${project.name} - ORCACLUB`,
      description: project.description || `Project details for ${project.name}`,
    }
  } catch {
    return { title: 'Project - ORCACLUB', description: 'Project details' }
  }
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; project: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { username, project: projectId } = await params
  const { tab } = await searchParams

  const user = await getCurrentUser()

  if (!user || user.username !== username) redirect('/login')

  const payload = await getPayload({ config })

  let project: Project
  try {
    project = await payload.findByID({ collection: 'projects', id: projectId, depth: 2 })
  } catch {
    notFound()
  }

  const isClient = user.role === 'client'

  // ── Client access check ─────────────────────────────────────────────────
  // Clients can only view projects belonging to their client account
  if (isClient) {
    const clientAccountId =
      typeof user.clientAccount === 'string'
        ? user.clientAccount
        : (user.clientAccount as any)?.id

    const projectClientId =
      typeof project.client === 'string'
        ? project.client
        : (project.client as any)?.id

    if (!clientAccountId || projectClientId !== clientAccountId) {
      redirect(`/u/${username}`)
    }
  }

  // ── Staff access check ──────────────────────────────────────────────────
  if (user.role !== 'admin' && !isClient) {
    const assignedUserIds = Array.isArray(project.assignedTo)
      ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
      : []
    if (!assignedUserIds.includes(user.id)) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm">
            <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-5">
              <AlertCircle className="size-7 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500">
              You do not have permission to view this project.
            </p>
          </div>
        </div>
      )
    }
  }

  // Fetch tasks and sprints in parallel
  const [{ docs: tasks }, { docs: sprints }] = await Promise.all([
    payload.find({
      collection: 'tasks',
      where: { project: { equals: projectId } },
      depth: 1,
      sort: '-createdAt',
      limit: 200,
    }),
    payload.find({
      collection: 'sprints',
      where: { project: { equals: projectId } },
      depth: 1,
      sort: 'startDate',
      limit: 50,
    }),
  ])

  // For clients: fetch all their projects for sidebar navigation
  let clientProjects: Project[] = []
  if (isClient && user.clientAccount) {
    const clientAccountId =
      typeof user.clientAccount === 'string'
        ? user.clientAccount
        : (user.clientAccount as any)?.id

    if (clientAccountId) {
      const { docs } = await payload.find({
        collection: 'projects',
        where: { client: { equals: clientAccountId } },
        depth: 0,
        sort: '-createdAt',
        limit: 50,
      })
      clientProjects = docs as Project[]
    }
  }

  const activeTab = tab === 'sprints' ? 'sprints' : 'tasks'
  const basePath = `/u/${username}/projects/${projectId}`

  return (
    <div className="lg:flex" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* ── Left Sidebar (desktop only) ─────────────────────────────────── */}
      <aside className="hidden lg:block w-72 xl:w-80 shrink-0 border-r border-white/[0.08] bg-[#1c1c1c]/40 sticky top-16 self-start h-[calc(100vh-64px)] overflow-y-auto">
        <ProjectSidebar
          project={project}
          tasks={tasks as Task[]}
          username={username}
          readOnly={isClient}
          clientProjects={isClient ? clientProjects : undefined}
        />
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile: project name + back nav */}
        <div className="lg:hidden px-6 py-4 border-b border-white/[0.08]">
          <Link
            href={`/u/${username}/projects`}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← All Projects
          </Link>
          <h1 className="text-lg font-semibold text-white mt-2">{project.name}</h1>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-16 z-10 bg-[#080808] border-b border-white/[0.08] px-6">
          <ProjectTabNav activeTab={activeTab} basePath={basePath} />
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 lg:p-8">
          {activeTab === 'sprints' ? (
            <SprintsTab
              sprints={sprints as Sprint[]}
              tasks={tasks as Task[]}
              projectId={projectId}
              readOnly={isClient}
            />
          ) : (
            <TasksTab
              tasks={tasks as Task[]}
              sprints={sprints as Sprint[]}
              projectId={projectId}
              readOnly={isClient}
            />
          )}
        </div>
      </div>
    </div>
  )
}
