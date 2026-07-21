import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/app/(spaces)/session'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getProjectDetail, getProjectTasks } from './detail-data'
import { ProjectTabNav } from '@/components/dashboard/ProjectTabNav'
import { HomeTab } from '@/components/dashboard/HomeTab'
import { SprintsTab } from '@/components/dashboard/SprintsTab'
import { CredentialsTab } from '@/components/dashboard/CredentialsTab'
import { DetailTabSlide } from '@/components/dashboard/DetailTabSlide'
import type { Project, Task, Sprint } from '@/types/payload-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; project: string }>
}) {
  const { project: projectId } = await params
  const project = await getProjectDetail(projectId)
  if (!project) return { title: 'Project - ORCACLUB', description: 'Project details' }
  return {
    title: `${project.name} - ORCACLUB`,
    description: project.description || `Project details for ${project.name}`,
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

  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')

  const isClient = user.role === 'client'
  const payload = await getPayload({ config })

  const project: Project | null = await getProjectDetail(projectId)
  if (!project) notFound()

  const [tasks, { docs: sprints }, { docs: credentials }] = await Promise.all([
    getProjectTasks(projectId),
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
      <div className="sticky top-[49px] z-10 bg-[var(--space-bg-card)] border-b border-[var(--space-border-hard)] px-6">
        <ProjectTabNav activeTab={activeTab} basePath={basePath} />
      </div>

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
