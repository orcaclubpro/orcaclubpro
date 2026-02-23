import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Package,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  FolderKanban,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { ClientAccount, Project, User as UserType } from '@/types/payload-types'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import { ClientTabNav } from '@/components/dashboard/ClientTabNav'
import { ClientPackagesTab } from '@/components/dashboard/ClientPackagesTab'
import { ClientOrdersTab } from '@/components/dashboard/ClientOrdersTab'
import { SwipeTabRouter } from '@/components/dashboard/SwipeTabRouter'
import { DetailTabSlide } from '@/components/dashboard/DetailTabSlide'
import { ScheduledPaymentsSection } from '@/components/dashboard/ScheduledPaymentsSection'
import { ClientSettingsCard } from '@/components/dashboard/ClientSettingsCard'
import { ClientPortfolioTimeline } from '@/components/dashboard/ClientPortfolioTimeline'
import type { SerializedProject, SerializedSprint } from '@/components/dashboard/ProjectsCarousel'
import { ProjectRowActions } from '@/components/dashboard/ProjectRowActions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; client: string }>
}) {
  const { client: clientId } = await params
  try {
    const payload = await getPayload({ config })
    const clientAccount = await payload.findByID({
      collection: 'client-accounts',
      id: clientId,
      depth: 0,
    })
    return {
      title: `${clientAccount.name} — ORCACLUB`,
      description: `Client account for ${clientAccount.name}`,
    }
  } catch {
    return { title: 'Client — ORCACLUB' }
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
  const validTabs = ['overview', 'projects', 'orders', 'packages'] as const
  type ClientTab = (typeof validTabs)[number]
  const activeTab: ClientTab = (validTabs as readonly string[]).includes(rawTab ?? '')
    ? (rawTab as ClientTab)
    : 'overview'

  const user = await getCurrentUser()
  if (!user || user.username !== username) redirect('/login')

  const payload = await getPayload({ config })

  let clientAccount: ClientAccount
  try {
    clientAccount = await payload.findByID({
      collection: 'client-accounts',
      id: clientId,
      depth: 2,
    })
  } catch {
    notFound()
  }

  const [{ docs: orders }, { docs: projects }, { docs: clientUsers }, packagesResult] =
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
    ])
  const packages = packagesResult.docs

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

  const sprintsByProject = new Map<string, SerializedSprint[]>()
  for (const sprint of allSprints) {
    const projectId =
      typeof sprint.project === 'string' ? sprint.project : (sprint.project as any)?.id
    if (!projectId) continue
    const existing = sprintsByProject.get(projectId) ?? []
    existing.push({
      id: sprint.id,
      name: sprint.name ?? '',
      status: (sprint.status ?? 'pending') as SerializedSprint['status'],
      startDate: sprint.startDate ?? new Date().toISOString(),
      endDate: sprint.endDate ?? new Date().toISOString(),
      description: sprint.description ?? null,
      goalDescription: sprint.goalDescription ?? null,
      completedTasksCount: sprint.completedTasksCount ?? 0,
      totalTasksCount: sprint.totalTasksCount ?? 0,
      projectId,
    })
    sprintsByProject.set(projectId, existing)
  }

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
    sprints: sprintsByProject.get(p.id) ?? [],
  }))

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const paidOrders = orders.filter((o) => o.status === 'paid')
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.amount || 0), 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const fmtDate = (d: string | Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(d))

  const teamMembers = Array.isArray(clientAccount.assignedTo)
    ? clientAccount.assignedTo
        .filter((u): u is UserType => typeof u !== 'string')
        .map((u) => ({
          id: u.id,
          name: (u.name || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email) ?? '',
          title: u.title ?? null,
        }))
    : []

  return (
    <>
      {/* ── Sticky tab nav ──────────────────────────────────────────────────── */}
      <div className="sticky top-[49px] z-10 bg-[#080808] border-b border-white/[0.08] px-6 lg:px-10">
        <ClientTabNav activeTab={activeTab} basePath={`/u/${username}/clients/${clientId}`} />
      </div>

      <SwipeTabRouter
        tabs={validTabs}
        activeTab={activeTab}
        basePath={`/u/${username}/clients/${clientId}`}
      />

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      <DetailTabSlide
        activeTab={activeTab}
        tabOrder={validTabs}
        storageKey={`client-tabs-${clientId}`}
        className="flex-1 px-6 lg:px-10 py-8 space-y-8"
      >

        {/* ─── Overview tab ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            <ClientSettingsCard
              id={clientId}
              name={clientAccount.name}
              firstName={clientAccount.firstName ?? ''}
              lastName={clientAccount.lastName ?? ''}
              email={clientAccount.email}
              company={clientAccount.company}
              phone={(clientAccount as any).phone ?? null}
              address={(clientAccount as any).address ?? null}
              stripeCustomerId={clientAccount.stripeCustomerId}
              teamMembers={teamMembers}
              clientUsers={clientUsers.map((u) => ({
                id: u.id,
                name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
                email: u.email,
              }))}
            />

            {(clientAccount.accountBalance ?? 0) > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-amber-400/[0.18] bg-amber-400/[0.04] px-4 py-3">
                <AlertCircle className="size-3.5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-400 font-medium">
                  {fmt(clientAccount.accountBalance ?? 0)} outstanding
                </p>
                <span className="text-gray-700 text-xs">
                  · {pendingOrders.length} pending{' '}
                  {pendingOrders.length === 1 ? 'order' : 'orders'}
                </span>
                <Link
                  href={`/u/${username}/clients/${clientId}?tab=orders`}
                  className="ml-auto text-xs text-amber-600 hover:text-amber-400 transition-colors"
                >
                  View orders →
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: 'Total Revenue',
                  value: fmt(totalRevenue),
                  sub: `${paidOrders.length} paid`,
                  icon: TrendingUp,
                  color: 'text-emerald-400',
                },
                {
                  label: 'Outstanding',
                  value: fmt(clientAccount.accountBalance ?? 0),
                  sub: `${pendingOrders.length} pending`,
                  icon: DollarSign,
                  color:
                    (clientAccount.accountBalance ?? 0) > 0 ? 'text-amber-400' : 'text-gray-600',
                },
                {
                  label: 'Projects',
                  value: String(projects.length),
                  sub: 'all time',
                  icon: FolderKanban,
                  color: 'text-blue-400',
                },
                {
                  label: 'Orders',
                  value: String(orders.length),
                  sub: 'all time',
                  icon: ShoppingCart,
                  color: 'text-[#67e8f9]',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] px-5 py-4"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <stat.icon className={`size-3 ${stat.color}`} />
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                      {stat.label}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-white tabular-nums font-mono">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {serializedProjects.length > 0 && (
              <ClientPortfolioTimeline
                clientAccounts={[{ id: clientId, name: clientAccount.name }]}
                serializedProjects={serializedProjects}
                allOrders={orders as any[]}
                username={username}
              />
            )}
          </>
        )}

        {/* ─── Projects tab ─────────────────────────────────────────────────── */}
        {activeTab === 'projects' && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-semibold text-white">Projects</h2>
                <span className="text-xs text-gray-600 tabular-nums">{projects.length}</span>
              </div>
              <CreateProjectModal clientId={clientId} clientName={clientAccount.name} />
            </div>

            {projects.length > 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden divide-y divide-white/[0.06]">
                {projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    username={username}
                    fmtDate={fmtDate}
                    fmt={fmt}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No projects yet"
                description="Create your first project to start tracking work."
                action={<CreateProjectModal clientId={clientId} clientName={clientAccount.name} />}
              />
            )}
          </section>
        )}

        {/* ─── Orders tab ───────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <section className="space-y-6">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-semibold text-white">Orders</h2>
                <span className="text-xs text-gray-600 tabular-nums">{orders.length}</span>
              </div>
              {orders.length > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-emerald-400 font-mono">{fmt(totalRevenue)} paid</span>
                  {(clientAccount.accountBalance ?? 0) > 0 && (
                    <span className="text-amber-400 font-mono">
                      {fmt(clientAccount.accountBalance ?? 0)} due
                    </span>
                  )}
                </div>
              )}
            </div>
            <ScheduledPaymentsSection packages={packages as any} username={username} />
            <ClientOrdersTab
              orders={orders as any}
              role={user.role as 'admin' | 'user' | 'client'}
            />
          </section>
        )}

        {/* ─── Packages tab ─────────────────────────────────────────────────── */}
        {activeTab === 'packages' && (
          <ClientPackagesTab
            packages={packages as any}
            clientId={clientId}
            username={username}
            projects={projects.map((p: any) => ({ id: p.id, name: p.name, status: p.status }))}
            packageOrders={packageOrderMap}
          />
        )}

      </DetailTabSlide>
    </>
  )
}

// ── Project row (clickable) ───────────────────────────────────────────────────

const STATUS_CFG: Record<
  string,
  {
    color: string
    bg: string
    border: string
    icon: React.ComponentType<{ className?: string }>
    label: string
  }
> = {
  pending: {
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    icon: Clock,
    label: 'Pending',
  },
  'in-progress': {
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    icon: Clock,
    label: 'In Progress',
  },
  completed: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    icon: CheckCircle,
    label: 'Completed',
  },
  'on-hold': {
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
    icon: AlertCircle,
    label: 'On Hold',
  },
  cancelled: {
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    icon: XCircle,
    label: 'Cancelled',
  },
}

function ProjectRow({
  project,
  username,
  fmtDate,
  fmt,
}: {
  project: Project
  username: string
  fmtDate: (d: string | Date) => string
  fmt: (n: number) => string
}) {
  const cfg = STATUS_CFG[project.status] ?? {
    color: 'text-gray-400',
    bg: 'bg-gray-400/10',
    border: 'border-gray-400/20',
    icon: Package,
    label: project.status,
  }
  const StatusIcon = cfg.icon
  const completedMilestones = project.milestones?.filter((m) => m.completed).length ?? 0
  const totalMilestones = project.milestones?.length ?? 0

  return (
    <div className="relative flex items-center group hover:bg-white/[0.05] transition-colors">
      <Link
        href={`/u/${username}/projects/${project.id}`}
        className="flex-1 flex items-center gap-4 px-5 py-4 min-w-0"
      >
        <div className="absolute left-0 top-0 h-full w-[2px] bg-[#67e8f9] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div
          className={`size-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}
        >
          <StatusIcon className={`size-4 ${cfg.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-semibold text-white group-hover:text-[#67e8f9] transition-colors duration-150">
              {project.name}
            </span>
            <Badge
              variant="outline"
              className={`${cfg.color} ${cfg.bg} border ${cfg.border} text-[10px] px-1.5 py-0`}
            >
              {cfg.label}
            </Badge>
          </div>
          {project.description && (
            <p className="text-xs text-gray-600 truncate">{project.description}</p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-5 shrink-0 text-xs text-gray-600">
          {project.projectedEndDate && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {fmtDate(project.projectedEndDate)}
            </span>
          )}
          {totalMilestones > 0 && (
            <span className="font-mono tabular-nums">
              {completedMilestones}/{totalMilestones}
            </span>
          )}
          {project.budgetAmount && (
            <span className="font-mono tabular-nums text-gray-500">
              {fmt(project.budgetAmount)}
            </span>
          )}
        </div>

        <ChevronRight className="size-4 text-gray-700 group-hover:text-[#67e8f9] group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
      </Link>
      <div className="pr-3 shrink-0">
        <ProjectRowActions project={project} username={username} />
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#1c1c1c]">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="size-48 rounded-full bg-[#67e8f9]/[0.02] blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center py-12 px-6">
        <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
        <p className="text-gray-600 text-xs max-w-xs mb-5">{description}</p>
        {action}
      </div>
    </div>
  )
}
