import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
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

  const isClient = user.role === 'client'
  const payload = await getPayload({ config })

  let project: Project
  try {
    project = await payload.findByID({ collection: 'projects', id: projectId, depth: 0 })
  } catch {
    notFound()
  }

  let sprint: Sprint
  try {
    sprint = await payload.findByID({ collection: 'sprints', id: sprintId, depth: 0 })
    const sprintProjectId =
      typeof sprint.project === 'string' ? sprint.project : (sprint.project as any)?.id
    if (sprintProjectId !== projectId) notFound()
  } catch {
    notFound()
  }

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
