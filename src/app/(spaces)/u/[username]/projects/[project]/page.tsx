import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/app/(spaces)/session'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getProjectDetail, getProjectTasks, getProjectPackages, getClientPackages, getPackagesOrders } from './detail-data'
import { ProjectTabNav } from '@/components/dashboard/ProjectTabNav'
import { PROJECT_BASE_TABS, PROJECT_PACKAGES_TAB } from '@/components/dashboard/project-tabs'
import { HomeTab } from '@/components/dashboard/HomeTab'
import { SprintsTab } from '@/components/dashboard/SprintsTab'
import { CredentialsTab } from '@/components/dashboard/CredentialsTab'
import { ProjectPackagesTab } from '@/components/dashboard/ProjectPackagesTab'
import type { ProjectPackage } from '@/components/dashboard/package-detail/utils'
import { DetailTabSlide } from '@/components/dashboard/DetailTabSlide'
import type { Project, Task, Sprint } from '@/types/payload-types'

const relId = (v: unknown): string | null =>
  typeof v === 'string' ? v : (v as any)?.id ? String((v as any).id) : null

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

  // Packages is staff-only — a client landing on `?tab=packages` falls through to
  // the overview rather than hitting a tab that should not exist for them.
  const activeTab =
    tab === 'sprints' ? 'sprints'
    : tab === 'credentials' ? 'credentials'
    : tab === 'packages' && !isClient ? 'packages'
    : 'overview'

  const project: Project | null = await getProjectDetail(projectId)
  if (!project) notFound()

  const [tasks, { docs: sprints }, { docs: credentials }, projectPackages] = await Promise.all([
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
    // Staff only, and only for the tab that renders them.
    isClient || activeTab !== 'packages' ? Promise.resolve([] as any[]) : getProjectPackages(projectId),
  ])

  // The client's other proposals, offered as link candidates — `projectRef` is
  // set by hand and usually is not, so linked-only would leave the tab empty.
  const clientId = relId(project.client)
  const candidatePackages = !isClient && activeTab === 'packages' && clientId
    ? (await getClientPackages(clientId)).filter((p: any) => !p.projectRef)
    : []

  // Orders are only needed to draw the invoiced/paid bars.
  const allPackageDocs = [...projectPackages, ...candidatePackages]
  const packageOrders = allPackageDocs.length > 0
    ? await getPackagesOrders(allPackageDocs.map((p: any) => String(p.id)).join(','))
    : []

  const toProjectPackage = (p: any): ProjectPackage => {
    const orders = packageOrders.filter((o: any) => relId(o.packageRef) === String(p.id))
    const counted = orders.filter((o: any) => o.status !== 'cancelled')
    return {
      id: String(p.id),
      name: p.name ?? '',
      status: p.status ?? 'draft',
      description: p.description ?? null,
      clientId: relId(p.clientAccount),
      lineItems: (p.lineItems ?? []).map((li: any) => ({
        name: li.name ?? '',
        description: li.description ?? null,
        price: li.price ?? 0,
        adjustedPrice: li.adjustedPrice ?? null,
        quantity: li.quantity ?? 1,
        isRecurring: li.isRecurring ?? false,
        recurringInterval: li.recurringInterval ?? undefined,
        isAddOn: li.isAddOn ?? false,
      })),
      invoiced: counted.reduce((s: number, o: any) => s + (o.amount ?? 0), 0),
      paid: counted.filter((o: any) => o.status === 'paid').reduce((s: number, o: any) => s + (o.amount ?? 0), 0),
    }
  }

  const packages = projectPackages.map(toProjectPackage)
  const candidates = candidatePackages.map(toProjectPackage)

  const basePath = `/u/${username}/projects/${projectId}`
  const tabs = isClient ? PROJECT_BASE_TABS : [...PROJECT_BASE_TABS, PROJECT_PACKAGES_TAB]
  const PROJECT_TABS = tabs.map(t => t.key)

  return (
    <>
      <div className="sticky top-[3.0625rem] z-10 bg-[var(--space-bg-card)] border-b border-[var(--space-border-hard)] px-6">
        <ProjectTabNav activeTab={activeTab} basePath={basePath} tabs={tabs} />
      </div>

      <DetailTabSlide
        activeTab={activeTab}
        tabOrder={PROJECT_TABS}
        storageKey={`project-tabs-${projectId}`}
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10"
      >
        {activeTab === 'packages' ? (
          <ProjectPackagesTab
            packages={packages}
            candidates={candidates}
            projectId={projectId}
            clientName={typeof project.client === 'object' ? (project.client as any)?.name ?? null : null}
            username={username}
            readOnly={isClient}
          />
        ) : activeTab === 'overview' ? (
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
