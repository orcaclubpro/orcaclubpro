import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AlertCircle } from 'lucide-react'
import { SprintDetailView } from '@/components/dashboard/SprintDetailView'
import { SetHeaderTitle } from '@/components/layout/SetHeaderTitle'
import type { Sprint, Task, Project } from '@/types/payload-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; project: string; sprint: string }>
}) {
  const { sprint: sprintId } = await params
  try {
    const payload = await getPayload({ config })
    const sprint = await payload.findByID({ collection: 'sprints', id: sprintId, depth: 0 })
    return { title: `${sprint.name} — ORCACLUB`, description: sprint.goalDescription || sprint.name }
  } catch {
    return { title: 'Sprint — ORCACLUB' }
  }
}

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ username: string; project: string; sprint: string }>
}) {
  const { username, project: projectId, sprint: sprintId } = await params

  const user = await getCurrentUser()
  if (!user || user.username !== username) redirect('/login')

  const payload = await getPayload({ config })

  let project: Project
  try {
    project = await payload.findByID({ collection: 'projects', id: projectId, depth: 1 })
  } catch {
    notFound()
  }

  const isClient = user.role === 'client'

  // Client access check
  if (isClient) {
    const clientAccountId =
      typeof user.clientAccount === 'string'
        ? user.clientAccount
        : (user.clientAccount as any)?.id
    const projectClientId =
      typeof project.client === 'string' ? project.client : (project.client as any)?.id
    if (!clientAccountId || projectClientId !== clientAccountId) {
      redirect(`/u/${username}`)
    }
  }

  // Staff access check
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
            <p className="text-sm text-gray-500">You do not have permission to view this project.</p>
          </div>
        </div>
      )
    }
  }

  // Fetch sprint
  let sprint: Sprint
  try {
    sprint = await payload.findByID({ collection: 'sprints', id: sprintId, depth: 0 })
    const sprintProjectId =
      typeof sprint.project === 'string' ? sprint.project : (sprint.project as any)?.id
    if (sprintProjectId !== projectId) notFound()
  } catch {
    notFound()
  }

  // Fetch all sprint tasks + unassigned project tasks (backlog candidates)
  const [{ docs: sprintTasks }, { docs: projectBacklog }] = await Promise.all([
    payload.find({
      collection: 'tasks',
      where: { sprint: { equals: sprintId } },
      depth: 1,
      sort: 'createdAt',
      limit: 200,
    }),
    payload.find({
      collection: 'tasks',
      where: {
        and: [
          { project: { equals: projectId } },
          { sprint: { exists: false } },
        ],
      },
      depth: 0,
      sort: '-createdAt',
      limit: 100,
    }),
  ])

  return (
    <>
      <SetHeaderTitle title={project.name} subtitle={sprint.name} />
      <SprintDetailView
        sprint={sprint}
        tasks={sprintTasks as Task[]}
        projectBacklog={projectBacklog as Task[]}
        projectId={projectId}
        username={username}
        readOnly={isClient}
      />
    </>
  )
}
