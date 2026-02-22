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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { ClientAccount, Order, Project, User as UserType } from '@/types/payload-types'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import { ClientSidebar, ClientSidebarContent } from '@/components/dashboard/ClientSidebar'
import { ClientTabNav } from '@/components/dashboard/ClientTabNav'
import { ClientPackagesTab } from '@/components/dashboard/ClientPackagesTab'

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
  const activeTab: ClientTab = (validTabs as readonly string[]).includes(rawTab ?? '') ? (rawTab as ClientTab) : 'overview'
  const user = await getCurrentUser()

  if (!user || user.username !== username) redirect('/login')
  if (user.role === 'client') redirect(`/u/${username}`)

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

  // Access validation
  if (user.role !== 'admin') {
    const assignedIds = Array.isArray(clientAccount.assignedTo)
      ? clientAccount.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
      : []
    if (!assignedIds.includes(user.id)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl border border-red-400/20 bg-[#1c1c1c] p-8 text-center">
            <div className="inline-flex p-5 rounded-xl bg-red-400/10 border border-red-400/20 mb-6">
              <AlertCircle className="size-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 text-sm">
              You do not have permission to view this client account.
            </p>
          </div>
        </div>
      )
    }
  }

  // Fetch data
  const [{ docs: orders }, { docs: projects }, { docs: clientUsers }, packagesResult] = await Promise.all([
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

  const pendingOrders   = orders.filter((o) => o.status === 'pending')
  const paidOrders      = orders.filter((o) => o.status === 'paid')
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled')
  const totalRevenue    = paidOrders.reduce((s, o) => s + (o.amount || 0), 0)

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
          name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
        }))
    : []

  const sidebarProps = {
    id: clientId,
    name: clientAccount.name,
    firstName: clientAccount.firstName ?? '',
    lastName: clientAccount.lastName ?? '',
    email: clientAccount.email,
    company: clientAccount.company,
    accountBalance: clientAccount.accountBalance ?? 0,
    totalRevenue,
    ordersCount: orders.length,
    projectsCount: projects.length,
    stripeCustomerId: clientAccount.stripeCustomerId,
    teamMembers,
    clientUsers: clientUsers.map((u) => ({
      id: u.id,
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
      email: u.email,
    })),
    username,
  }

  return (
    // Full-width flex row — no max-w constraint so it fills the viewport
    <div className="flex min-h-[calc(100vh-64px)]">

      {/* ── Desktop sidebar — sticky, scrolls independently ── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-r border-white/[0.08] bg-[#1c1c1c]/40">
        <div className="sticky top-16 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
          <ClientSidebarContent {...sidebarProps} />
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between gap-3 px-4 pt-6 pb-4 border-b border-white/[0.08]">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{clientAccount.name}</h1>
            {clientAccount.company && (
              <p className="text-xs text-gray-500 mt-0.5">{clientAccount.company}</p>
            )}
          </div>
          <ClientSidebar {...sidebarProps} />
        </div>

        {/* ── Sticky tab nav ── */}
        <div className="sticky top-16 z-10 bg-[#080808] border-b border-white/[0.08] px-6 lg:px-10">
          <ClientTabNav
            activeTab={activeTab}
            basePath={`/u/${username}/clients/${clientId}`}
          />
        </div>

        {/* ── Scrollable content area ── */}
        <div className="flex-1 px-6 lg:px-10 py-8 space-y-10">

          {/* Desktop page heading — shown on all tabs */}
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {clientAccount.name}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {clientAccount.company && (
                <span className="text-sm text-gray-500">{clientAccount.company}</span>
              )}
              <span className="text-sm text-gray-700">{clientAccount.email}</span>
            </div>
          </div>

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <>
              {/* Outstanding balance banner */}
              {(clientAccount.accountBalance ?? 0) > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-400/[0.18] bg-amber-400/[0.04] px-4 py-3">
                  <AlertCircle className="size-3.5 text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-400 font-medium">
                    {fmt(clientAccount.accountBalance ?? 0)} outstanding
                  </p>
                  <span className="text-gray-700 text-xs">
                    · {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'}
                  </span>
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Revenue', value: fmt(totalRevenue), sub: `${paidOrders.length} paid orders` },
                  { label: 'Outstanding', value: fmt(clientAccount.accountBalance ?? 0), sub: `${pendingOrders.length} pending` },
                  { label: 'Projects', value: String(projects.length), sub: 'total projects' },
                  { label: 'Orders', value: String(orders.length), sub: 'all time' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] px-5 py-4">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-white tabular-nums font-mono">{stat.value}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Projects tab ── */}
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

          {/* ── Orders tab ── */}
          {activeTab === 'orders' && (
            <section className="space-y-4">
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-semibold text-white">Orders</h2>
                <span className="text-xs text-gray-600 tabular-nums">{orders.length}</span>
              </div>

              {orders.length > 0 ? (
                <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden divide-y divide-white/[0.06]">
                  {[
                    { label: 'Pending',   items: pendingOrders,          icon: Clock,        color: 'text-amber-400'  },
                    { label: 'Paid',      items: paidOrders.slice(0, 5), icon: CheckCircle,  color: 'text-emerald-400' },
                    { label: 'Cancelled', items: cancelledOrders,        icon: XCircle,      color: 'text-red-400'    },
                  ]
                    .filter((g) => g.items.length > 0)
                    .map((group) => (
                      <div key={group.label}>
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04]">
                          <group.icon className={`size-3 ${group.color}`} />
                          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                            {group.label} · {group.items.length}
                          </span>
                        </div>
                        {group.items.map((order) => (
                          <OrderRow key={order.id} order={order} fmt={fmt} fmtDate={fmtDate} />
                        ))}
                      </div>
                    ))}
                  {paidOrders.length > 5 && (
                    <div className="px-5 py-3 text-center text-xs text-gray-700">
                      Showing 5 of {paidOrders.length} paid orders
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState title="No orders yet" description="This client has no orders on record." />
              )}
            </section>
          )}

          {/* ── Packages tab ── */}
          {activeTab === 'packages' && (
            <ClientPackagesTab
              packages={packages as any}
              clientId={clientId}
              username={username}
            />
          )}

        </div>
      </div>
    </div>
  )
}

// ── Order row ──────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  fmt,
  fmtDate,
}: {
  order: Order
  fmt: (n: number) => string
  fmtDate: (d: string | Date) => string
}) {
  const cfg = {
    paid:      { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Paid'      },
    pending:   { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   label: 'Pending'   },
    cancelled: { color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/20',     label: 'Cancelled' },
  }[order.status] ?? {
    color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20', label: order.status,
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-sm font-semibold text-white font-mono">{order.orderNumber}</span>
          <Badge
            variant="outline"
            className={`${cfg.color} ${cfg.bg} border ${cfg.border} text-[10px] px-1.5 py-0`}
          >
            {cfg.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-700">
          <Calendar className="size-3" />
          {fmtDate(order.createdAt)}
        </div>
      </div>
      <span className="font-mono font-bold text-white text-sm tabular-nums shrink-0">
        {fmt(order.amount || 0)}
      </span>
    </div>
  )
}

// ── Project row (clickable) ───────────────────────────────────────────────────

const STATUS_CFG: Record<
  string,
  { color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  pending:       { color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  icon: Clock,        label: 'Pending'     },
  'in-progress': { color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   icon: Clock,        label: 'In Progress' },
  completed:     { color: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/20',icon: CheckCircle,  label: 'Completed'   },
  'on-hold':     { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', icon: AlertCircle,  label: 'On Hold'     },
  cancelled:     { color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    icon: XCircle,      label: 'Cancelled'   },
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
    color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20',
    icon: Package, label: project.status,
  }
  const StatusIcon = cfg.icon
  const completedMilestones = project.milestones?.filter((m) => m.completed).length ?? 0
  const totalMilestones     = project.milestones?.length ?? 0

  return (
    <Link
      href={`/u/${username}/projects/${project.id}`}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.05] transition-colors relative"
    >
      <div className="absolute left-0 top-0 h-full w-[2px] bg-[#67e8f9] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className={`size-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
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
          <span className="font-mono tabular-nums text-gray-500">{fmt(project.budgetAmount)}</span>
        )}
      </div>

      <ChevronRight className="size-4 text-gray-700 group-hover:text-[#67e8f9] group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
    </Link>
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
