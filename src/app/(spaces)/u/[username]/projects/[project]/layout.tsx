import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AlertCircle } from 'lucide-react'
import { ProjectSidebar } from '@/components/dashboard/ProjectSidebar'
import { CollapsibleSidebar } from '@/components/dashboard/CollapsibleSidebar'
import { ProjectSideActions } from '@/components/dashboard/ProjectSideActions'
import { SetHeaderTitle } from '@/components/layout/SetHeaderTitle'
import { PageEnterAnimation } from '@/components/dashboard/PageEnterAnimation'
import type { Project, Task } from '@/types/payload-types'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string; project: string }>
}) {
  const { username, project: projectId } = await params

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

  if (user.role !== 'admin' && !isClient) {
    const assignedUserIds = Array.isArray(project.assignedTo)
      ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
      : []
    if (!assignedUserIds.includes(user.id)) {
      return (
        <div className="lg:flex" style={{ minHeight: 'calc((100vh - 64px) / 1.3)' }}>
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
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
        </div>
      )
    }
  }

  const [{ docs: tasks }, clientProjectsResult, staffProjectsResult] = await Promise.all([
    payload.find({
      collection: 'tasks',
      where: { project: { equals: projectId } },
      depth: 0,
      sort: '-createdAt',
      limit: 200,
    }),
    isClient && user.clientAccount
      ? payload.find({
          collection: 'projects',
          where: {
            client: {
              equals:
                typeof user.clientAccount === 'string'
                  ? user.clientAccount
                  : (user.clientAccount as any)?.id,
            },
          },
          depth: 0,
          sort: '-createdAt',
          limit: 50,
        })
      : Promise.resolve(null),
    !isClient
      ? payload.find({
          collection: 'projects',
          user,
          overrideAccess: false,
          depth: 0,
          sort: '-updatedAt',
          limit: 40,
        })
      : Promise.resolve(null),
  ])

  const clientProjects = clientProjectsResult ? (clientProjectsResult.docs as Project[]) : []
  const staffProjects = staffProjectsResult ? (staffProjectsResult.docs as Project[]) : []

  return (
    <div className="lg:flex" style={{ minHeight: 'calc((100vh - 64px) / 1.3)' }}>
      <SetHeaderTitle title={project.name} />

      {!isClient && (
        <ProjectSideActions project={project} tasks={tasks as Task[]} username={username} />
      )}

      <CollapsibleSidebar>
        <ProjectSidebar
          project={project}
          tasks={tasks as Task[]}
          username={username}
          readOnly={isClient}
          clientProjects={isClient ? clientProjects : undefined}
          staffProjects={!isClient ? staffProjects : undefined}
        />
      </CollapsibleSidebar>

      <div className="flex-1 min-w-0 flex flex-col">
        <PageEnterAnimation>
          {children}
        </PageEnterAnimation>
      </div>
    </div>
  )
}
