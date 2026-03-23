import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProjectTabNav } from '@/components/dashboard/ProjectTabNav'
import { HomeTab } from '@/components/dashboard/HomeTab'
import { SprintsTab } from '@/components/dashboard/SprintsTab'
import { CredentialsTab } from '@/components/dashboard/CredentialsTab'
import { SwipeTabRouter } from '@/components/dashboard/SwipeTabRouter'
import { DetailTabSlide } from '@/components/dashboard/DetailTabSlide'
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

  const isClient = user.role === 'client'
  const payload = await getPayload({ config })

  let project: Project
  try {
    project = await payload.findByID({ collection: 'projects', id: projectId, depth: 2 })
  } catch {
    notFound()
  }

  const [{ docs: tasks }, { docs: sprints }, { docs: credentials }] = await Promise.all([
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
    payload.find({
      collection: 'credentials',
      where: { project: { equals: projectId } },
      depth: 0,
      sort: 'title',
      limit: 200,
    }),
  ])

  const activeTab =
    tab === 'sprints' ? 'sprints' : tab === 'credentials' ? 'credentials' : 'overview'
  const basePath = `/u/${username}/projects/${projectId}`
  const PROJECT_TABS = ['overview', 'sprints', 'credentials'] as const

  return (
    <>
      <div className="sticky top-[49px] z-10 bg-[#252525] border-b border-[#404040] px-6">
        <ProjectTabNav activeTab={activeTab} basePath={basePath} />
      </div>

      <SwipeTabRouter tabs={PROJECT_TABS} activeTab={activeTab} basePath={basePath} />

      <DetailTabSlide
        activeTab={activeTab}
        tabOrder={PROJECT_TABS}
        storageKey={`project-tabs-${projectId}`}
        className="flex-1 p-6 lg:p-8"
      >
        {activeTab === 'overview' ? (
          <HomeTab
            project={project}
            sprints={sprints as Sprint[]}
            tasks={tasks as Task[]}
            readOnly={isClient}
            username={username}
          />
        ) : activeTab === 'credentials' ? (
          <CredentialsTab
            credentials={credentials as any[]}
            projectId={projectId}
            username={username}
            readOnly={isClient}
          />
        ) : (
          <SprintsTab
            sprints={sprints as Sprint[]}
            tasks={tasks as Task[]}
            projectId={projectId}
            username={username}
            readOnly={isClient}
          />
        )}
      </DetailTabSlide>
    </>
  )
}
