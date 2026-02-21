import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { AnalyticsSidebar } from '@/components/dashboard/AnalyticsSidebar'
import { HeroTabCard } from '@/components/dashboard/HeroTabCard'
import type { HeroRevenueData, HeroProjectData } from '@/components/dashboard/HeroTabCard'
import { ClientActiveProjects } from '@/components/dashboard/ClientActiveProjects'
import { ClientInvoiceTimeline } from '@/components/dashboard/ClientInvoiceTimeline'
import { ActivityTimeline } from '@/components/dashboard/visualizations/ActivityTimeline'
import { Button } from '@/components/ui/button'
import type { ClientProjectSummary } from '@/components/dashboard/ClientActiveProjects'
import type { ClientOrderSummary } from '@/components/dashboard/ClientInvoiceTimeline'
import type { ActivityEvent } from '@/components/dashboard/visualizations/ActivityTimeline'
import {
  Mail,
  HelpCircle,
  FileText,
  ExternalLink,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  FolderOpen,
  CheckSquare,
  DollarSign,
} from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Home - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ timeframe?: string }>
}) {
  const { username } = await params
  const { timeframe: rawTimeframe } = await searchParams
  const timeframe = rawTimeframe === '30d' ? '30d' : rawTimeframe === '90d' ? '90d' : '7d'
  const windowDays = timeframe === '90d' ? 90 : timeframe === '30d' ? 30 : 7
  const user = await getCurrentUser()

  if (!user || user.username !== username) {
    redirect('/login')
  }

  if (!user.username) {
    redirect('/login')
  }

  const payload = await getPayload({ config })

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  // ─── ADMIN / USER VIEW ────────────────────────────────────────────────────

  if (user.role === 'admin' || user.role === 'user') {
    const { docs: clientAccounts } = await payload.find({
      collection: 'client-accounts',
      where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
      depth: 1,
      limit: 100,
    })

    const clientAccountIds = clientAccounts.map((ca: any) => ca.id)

    const [{ docs: allOrders }, { docs: allProjects }, { docs: allTasks }] =
      await Promise.all([
        payload.find({
          collection: 'orders',
          where: clientAccountIds.length > 0 ? { clientAccount: { in: clientAccountIds } } : { id: { equals: 'none' } },
          depth: 1,
          sort: '-createdAt',
          limit: 500,
        }),
        payload.find({
          collection: 'projects',
          where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
          limit: 50,
        }),
        payload.find({
          collection: 'tasks',
          where: user.role === 'admin' ? {} : { assignedTo: { equals: user.id } },
          limit: 50,
        }),
      ])

    // Completed tasks + sprints counts (use totalDocs for accurate counts beyond limit)
    const projectIds = allProjects.map((p: any) => p.id)
    const [{ totalDocs: completedTasksCount }, { totalDocs: completedSprintsCount }] =
      await Promise.all([
        payload.find({
          collection: 'tasks',
          where: user.role === 'admin'
            ? { status: { equals: 'completed' } }
            : { and: [{ assignedTo: { equals: user.id } }, { status: { equals: 'completed' } }] },
          limit: 1,
        }),
        payload.find({
          collection: 'sprints',
          where: projectIds.length > 0
            ? { and: [{ project: { in: projectIds } }, { status: { equals: 'finished' } }] }
            : { id: { equals: 'none' } },
          limit: 1,
        }),
      ])

    // ── Revenue window (timeframe-aware) ──────────────────────────────────
    const now = Date.now()
    const windowMs = windowDays * 24 * 60 * 60 * 1000
    const windowStart = now - windowMs
    const prevWindowStart = windowStart - windowMs

    const windowOrders = allOrders.filter(
      (o: any) => new Date(o.createdAt).getTime() > windowStart
    )
    const prevWindowOrders = allOrders.filter((o: any) => {
      const t = new Date(o.createdAt).getTime()
      return t > prevWindowStart && t <= windowStart
    })

    const windowRevenue = windowOrders
      .filter((o: any) => o.status === 'paid')
      .reduce((sum: number, o: any) => sum + (o.amount || 0), 0)

    const prevWindowRevenue = prevWindowOrders
      .filter((o: any) => o.status === 'paid')
      .reduce((sum: number, o: any) => sum + (o.amount || 0), 0)

    const windowChange =
      prevWindowRevenue > 0
        ? ((windowRevenue - prevWindowRevenue) / prevWindowRevenue) * 100
        : windowRevenue > 0
          ? 100
          : 0

    const windowOrderCount = windowOrders.length
    const windowPendingCount = windowOrders.filter((o: any) => o.status === 'pending').length

    // ── Summary metrics ────────────────────────────────────────────────────
    const pendingBalance = allOrders
      .filter((o: any) => o.status === 'pending')
      .reduce((sum, o: any) => sum + (o.amount || 0), 0)

    const activeProjects = allProjects.filter(
      (p: any) => p.status === 'in-progress' || p.status === 'pending'
    ).length

    const pendingTasks = allTasks.filter((t: any) => t.status === 'pending').length

    // ── 30-day pulse data ──────────────────────────────────────────────────
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const orders30d = allOrders.filter(
      (o: any) => new Date(o.createdAt).getTime() > thirtyDaysAgo
    )

    const weeklyRevenue = [3, 2, 1, 0].map((weeksAgo) => {
      const weekEnd = now - weeksAgo * 7 * 24 * 60 * 60 * 1000
      const wkStart = weekEnd - 7 * 24 * 60 * 60 * 1000
      const weekOrders = orders30d.filter((o: any) => {
        const t = new Date(o.createdAt).getTime()
        return t > wkStart && t <= weekEnd
      })
      const revenue = weekOrders
        .filter((o: any) => o.status === 'paid')
        .reduce((sum: number, o: any) => sum + (o.amount || 0), 0)
      const label = new Date(wkStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return { label, revenue, orders: weekOrders.length }
    })

    const orderPipeline = {
      paidAmount: orders30d.filter((o: any) => o.status === 'paid').reduce((s: number, o: any) => s + (o.amount || 0), 0),
      pendingAmount: orders30d.filter((o: any) => o.status === 'pending').reduce((s: number, o: any) => s + (o.amount || 0), 0),
      cancelledAmount: orders30d.filter((o: any) => o.status === 'cancelled').reduce((s: number, o: any) => s + (o.amount || 0), 0),
      paidCount: orders30d.filter((o: any) => o.status === 'paid').length,
      pendingCount: orders30d.filter((o: any) => o.status === 'pending').length,
      cancelledCount: orders30d.filter((o: any) => o.status === 'cancelled').length,
    }

    const projectStatus = {
      active: allProjects.filter((p: any) => p.status === 'in-progress').length,
      pending: allProjects.filter((p: any) => p.status === 'pending').length,
      completed: allProjects.filter((p: any) => p.status === 'completed').length,
    }

    const pulseKpis = {
      revenue30d: orderPipeline.paidAmount,
      orders30d: orders30d.length,
      activeClients: clientAccounts.filter((ca: any) => ca.accountBalance > 0 || (ca.projects?.length ?? 0) > 0).length,
      activeProjects: projectStatus.active,
    }

    const windowStartLabel = new Date(windowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeframeLabel = timeframe === '90d' ? '90 Days' : timeframe === '30d' ? '30 Days' : '7 Days'
    const compLabel = timeframe === '7d' ? 'vs last week' : `vs prior ${timeframeLabel.toLowerCase()}`

    // Projected revenue: pending orders sorted by due date (overdue first, then soonest)
    const projectedOrders = allOrders
      .filter((o: any) => o.status === 'pending')
      .sort((a: any, b: any) => {
        const aMs = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
        const bMs = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
        return aMs - bMs
      })
    const projectedTotal = projectedOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0)

    // Project health snapshot for hero card
    const projectHealth: HeroProjectData = {
      total: allProjects.length,
      active: allProjects.filter((p: any) => p.status === 'in-progress').length,
      pending: allProjects.filter((p: any) => p.status === 'pending').length,
      completed: allProjects.filter((p: any) => p.status === 'completed').length,
      onHold: allProjects.filter((p: any) => p.status === 'on-hold').length,
      cancelled: allProjects.filter((p: any) => p.status === 'cancelled').length,
      totalMilestones: allProjects.reduce((s: number, p: any) => s + (p.milestones?.length || 0), 0),
      completedMilestones: allProjects.reduce(
        (s: number, p: any) => s + ((p.milestones ?? []).filter((m: any) => m.completed).length),
        0
      ),
      tasksCompleted: completedTasksCount,
      sprintsCompleted: completedSprintsCount,
    }

    const heroRevenue: HeroRevenueData = {
      windowRevenue,
      windowChange,
      windowOrderCount,
      windowPendingCount,
      windowStartLabel,
      timeframe,
      timeframeLabel,
      compLabel,
      username,
      activeProjects,
    }

    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20 space-y-6 sm:space-y-10">

          {/* ── HERO: Greeting + This Week Revenue ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">

            {/* Left: Greeting */}
            <div className="flex flex-col justify-center py-6 sm:py-8 lg:py-14">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.25em] mb-5 sm:mb-7">
                {user.role === 'admin' ? 'Admin' : 'Workspace'} · ORCACLUB Spaces
              </p>
              <DashboardGreeting
                firstName={user.firstName}
                size="large"
                subtitle={
                  user.role === 'admin'
                    ? `Overseeing ${clientAccounts.length} client${clientAccounts.length !== 1 ? 's' : ''} · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
                    : `${clientAccounts.length} assigned client${clientAccounts.length !== 1 ? 's' : ''} · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
                }
              />
            </div>

            {/* Right: Hero Tab Card (Revenue / Projects) */}
            <HeroTabCard revenue={heroRevenue} projects={projectHealth} />
          </div>

          {/* ── QUICK STATS ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">

            <Link
              href={`/u/${username}/projects`}
              className="group relative overflow-hidden rounded-xl border border-white/[0.07]
                         bg-gradient-to-b from-[#141414] to-[#0e0e0e]
                         p-4 sm:p-6
                         hover:border-white/[0.14] hover:bg-[#161616]
                         transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/[0.07] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="flex items-start justify-between mb-3 sm:mb-5">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-400/10 border border-blue-400/20">
                  <FolderOpen className="size-3.5 sm:size-4 text-blue-400" />
                </div>
                <ArrowRight className="size-3 sm:size-3.5 text-gray-700 group-hover:text-gray-400 transition-colors duration-200 mt-0.5" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider leading-tight">Active Projects</p>
              <p className="text-2xl sm:text-4xl font-bold text-white mt-1 sm:mt-1.5 tracking-tight tabular-nums">{activeProjects}</p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-1 hidden sm:block">In progress or pending</p>
            </Link>

            <Link
              href={`/u/${username}/tasks`}
              className="group relative overflow-hidden rounded-xl border border-white/[0.07]
                         bg-gradient-to-b from-[#141414] to-[#0e0e0e]
                         p-4 sm:p-6
                         hover:border-white/[0.14] hover:bg-[#161616]
                         transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/[0.07] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="flex items-start justify-between mb-3 sm:mb-5">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-400/10 border border-purple-400/20">
                  <CheckSquare className="size-3.5 sm:size-4 text-purple-400" />
                </div>
                <ArrowRight className="size-3 sm:size-3.5 text-gray-700 group-hover:text-gray-400 transition-colors duration-200 mt-0.5" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider leading-tight">Open Tasks</p>
              <p className="text-2xl sm:text-4xl font-bold text-white mt-1 sm:mt-1.5 tracking-tight tabular-nums">{pendingTasks}</p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-1 hidden sm:block">Pending</p>
            </Link>

            <div className="relative overflow-hidden rounded-xl border border-white/[0.07]
                            bg-gradient-to-b from-[#141414] to-[#0e0e0e]
                            p-4 sm:p-6">
              {pendingBalance > 0 && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/[0.06] blur-2xl pointer-events-none" />
              )}
              <div className="flex items-start justify-between mb-3 sm:mb-5">
                <div className={`p-1.5 sm:p-2 rounded-lg border ${pendingBalance > 0 ? 'bg-amber-400/10 border-amber-400/20' : 'bg-emerald-400/10 border-emerald-400/20'}`}>
                  <DollarSign className={`size-3.5 sm:size-4 ${pendingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
                </div>
                {pendingBalance > 0 && (
                  <span className="inline-block size-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] mt-0.5" />
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider leading-tight">Pending</p>
              <p className={`text-xl sm:text-4xl font-bold mt-1 sm:mt-1.5 tracking-tight tabular-nums ${pendingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {pendingBalance > 0 ? formatCurrency(pendingBalance) : '—'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-1 hidden sm:block">{pendingBalance > 0 ? 'Outstanding' : 'All clear'}</p>
            </div>
          </div>

          {/* ── PROJECTED REVENUE ───────────────────────────────────────────── */}
          {projectedTotal > 0 && (
            <div className="rounded-2xl border border-amber-400/[0.12] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-amber-400/[0.05] to-transparent border-b border-amber-400/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 shrink-0">
                    <Receipt className="size-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/80">
                      Projected Revenue
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {projectedOrders.length} pending invoice{projectedOrders.length !== 1 ? 's' : ''} awaiting payment
                    </p>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
                  {formatCurrency(projectedTotal)}
                </p>
              </div>

              {/* Order rows */}
              <div className="bg-[#0c0900]/60 divide-y divide-white/[0.04]">
                {projectedOrders.slice(0, 8).map((order: any) => {
                  const clientName = typeof order.clientAccount === 'object'
                    ? ((order.clientAccount as any)?.name ?? '—')
                    : '—'
                  const projectName = typeof order.projectRef === 'object' && order.projectRef
                    ? ((order.projectRef as any)?.name ?? null)
                    : null
                  const dueDate = order.dueDate ? new Date(order.dueDate) : null
                  const daysUntil = dueDate
                    ? Math.ceil((dueDate.getTime() - now) / (1000 * 60 * 60 * 24))
                    : null
                  const isOverdue = daysUntil !== null && daysUntil < 0
                  const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7

                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-0 pr-4 sm:pr-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Left accent stripe */}
                      <div className={`w-0.5 self-stretch shrink-0 mr-4 ${
                        isOverdue
                          ? 'bg-red-400'
                          : isDueSoon
                            ? 'bg-amber-400'
                            : dueDate
                              ? 'bg-yellow-400/30'
                              : 'bg-white/[0.06]'
                      }`} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {order.orderNumber ?? `INV-${order.id.slice(-6).toUpperCase()}`}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {clientName}{projectName ? ` · ${projectName}` : ''}
                        </p>
                      </div>

                      {/* Amount + due date */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-amber-400 tabular-nums">
                          {formatCurrency(order.amount ?? 0)}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${
                          isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-gray-600'
                        }`}>
                          {dueDate
                            ? isOverdue
                              ? `${Math.abs(daysUntil!)}d overdue`
                              : daysUntil === 0
                                ? 'Due today'
                                : daysUntil === 1
                                  ? 'Due tomorrow'
                                  : `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : 'No due date'
                          }
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {projectedOrders.length > 8 && (
                <div className="px-5 py-3 border-t border-amber-400/[0.06] text-center">
                  <p className="text-[10px] text-gray-600">
                    Showing 8 of {projectedOrders.length} pending invoices
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── ANALYTICS SIDEBAR (floating) ────────────────────────────────────── */}
        <AnalyticsSidebar
          weeklyRevenue={weeklyRevenue}
          orderPipeline={orderPipeline}
          projectStatus={projectStatus}
          kpis={pulseKpis}
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
        id: typeof user.clientAccount === 'string' ? user.clientAccount : (user.clientAccount as any).id,
        depth: 1,
      })
    } catch {
      // ClientAccount was deleted but User still has a stale reference — treat as no account
    }
  }

  if (!clientAccount) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-5">
            <HelpCircle className="size-7 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Account Not Found</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your client account could not be found. Please contact support for assistance.
          </p>
          <Button asChild size="sm" className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium">
            <a href="/contact" className="gap-2">
              <Mail className="size-3.5" />
              Contact Support
            </a>
          </Button>
        </div>
      </div>
    )
  }

  // Fetch projects and orders in parallel
  const [{ docs: clientProjects }, { docs: orders }] = await Promise.all([
    payload.find({
      collection: 'projects',
      where: { client: { equals: clientAccount.id } },
      depth: 1,
      sort: '-updatedAt',
      limit: 50,
    }),
    payload.find({
      collection: 'orders',
      where: { clientAccount: { equals: clientAccount.id } },
      sort: '-createdAt',
      limit: 20,
    }),
  ])

  // Fetch sprints for client projects (safe: projectIds are scoped to this client's account above)
  const clientProjectIds = clientProjects.map((p: any) => p.id)
  let clientSprints: any[] = []
  if (clientProjectIds.length > 0) {
    const { docs: sprints } = await payload.find({
      collection: 'sprints',
      where: { project: { in: clientProjectIds } },
      depth: 0,
      sort: '-startDate',
      limit: 200,
    })
    clientSprints = sprints
  }

  // Find best current sprint per project (in-progress > pending > delayed > finished)
  const sprintPriority = (s: string) =>
    s === 'in-progress' ? 0 : s === 'pending' ? 1 : s === 'delayed' ? 2 : 3
  const bestSprintByProject: Record<string, any> = {}
  for (const sprint of clientSprints) {
    const pid = typeof sprint.project === 'string' ? sprint.project : (sprint.project as any)?.id ?? ''
    if (!bestSprintByProject[pid] || sprintPriority(sprint.status) < sprintPriority(bestSprintByProject[pid].status)) {
      bestSprintByProject[pid] = sprint
    }
  }

  // Sort projects: active first
  const sortedClientProjects = [...clientProjects].sort((a: any, b: any) => {
    const priority = (s: string) => s === 'in-progress' ? 0 : s === 'active' || s === 'pending' ? 1 : 2
    return priority(a.status) - priority(b.status)
  })

  const activeProjectCount = clientProjects.filter(
    (p: any) => p.status === 'in-progress' || p.status === 'active' || p.status === 'pending'
  ).length

  const displayProjects: ClientProjectSummary[] = sortedClientProjects.slice(0, 3).map((p: any) => {
    const sprint = bestSprintByProject[p.id]
    return {
      id: p.id,
      name: p.name ?? '',
      status: p.status ?? 'pending',
      description: p.description ?? null,
      startDate: p.startDate ?? null,
      endDate: p.endDate ?? null,
      milestones: (p.milestones ?? []).map((m: any) => ({
        id: m.id ?? '',
        title: m.title ?? '',
        completed: m.completed ?? false,
      })),
      currentSprint: sprint
        ? {
            name: sprint.name ?? '',
            status: sprint.status ?? 'pending',
            completedTasksCount: sprint.completedTasksCount ?? 0,
            totalTasksCount: sprint.totalTasksCount ?? 0,
            endDate: sprint.endDate ?? '',
          }
        : null,
    }
  })

  const serializedOrders: ClientOrderSummary[] = orders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber ?? null,
    amount: o.amount ?? 0,
    status: o.status ?? 'pending',
    createdAt: o.createdAt,
  }))

  // Build activity feed from orders + project updates
  const activityEvents: ActivityEvent[] = [
    ...orders.slice(0, 4).map((o: any) => ({
      id: `order-${o.id}`,
      title: o.status === 'paid' ? 'Invoice paid' : o.status === 'pending' ? 'Invoice awaiting payment' : 'Invoice cancelled',
      description: `${o.orderNumber ?? 'INV-' + o.id.slice(-6).toUpperCase()} · ${formatCurrency(o.amount ?? 0)}`,
      timestamp: new Date(o.createdAt),
      icon: (o.status === 'paid' ? 'CheckCircle' : o.status === 'pending' ? 'Clock' : 'XCircle') as ActivityEvent['icon'],
      variant: (o.status === 'paid' ? 'success' : o.status === 'pending' ? 'warning' : 'danger') as ActivityEvent['variant'],
    })),
    ...sortedClientProjects.slice(0, 2).map((p: any) => ({
      id: `project-${p.id}`,
      title: p.name,
      description: p.status === 'in-progress' ? 'In progress' : p.status === 'completed' ? 'Completed' : p.status,
      timestamp: new Date(p.updatedAt),
      icon: 'FolderPlus' as ActivityEvent['icon'],
      variant: (p.status === 'completed' ? 'success' : 'default') as ActivityEvent['variant'],
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  const pendingOrdersTotal = orders
    .filter((o: any) => o.status === 'pending')
    .reduce((s: number, o: any) => s + (o.amount ?? 0), 0)
  const mostRecentOrder = orders[0] as any ?? null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20 space-y-10 sm:space-y-12">

      {/* ── HERO: Greeting + Account snapshot ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        {/* Left: Greeting + quick actions */}
        <div className="flex flex-col justify-center py-4 sm:py-8 lg:py-14">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.25em] mb-5">
            Client Portal · ORCACLUB Spaces
          </p>
          <DashboardGreeting
            firstName={user.firstName}
            size="large"
            subtitle={
              activeProjectCount > 0
                ? `${activeProjectCount} active project${activeProjectCount !== 1 ? 's' : ''} · ${clientProjects.length} total`
                : 'Welcome to your ORCACLUB workspace.'
            }
          />
          <div className="flex items-center gap-2.5 mt-6">
            <Button asChild size="sm" className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-xs">
              <a href="/contact" className="gap-1.5">
                <Mail className="size-3.5" />
                Contact Us
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-white/[0.12] bg-[#1c1c1c] hover:bg-white/[0.08] text-xs">
              <a href="https://docs.orcaclub.dev" target="_blank" rel="noopener noreferrer" className="gap-1.5">
                <FileText className="size-3.5" />
                Resources
                <ExternalLink className="size-3 opacity-50" />
              </a>
            </Button>
          </div>
        </div>

        {/* Right: Account snapshot */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#141414] to-[#0e0e0e] p-6 sm:p-7">
          {pendingOrdersTotal > 0 && (
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/[0.06] blur-3xl pointer-events-none" />
          )}
          <div className="relative z-10 space-y-5">
            {/* Outstanding balance */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600 mb-1.5">
                {pendingOrdersTotal > 0 ? 'Outstanding Balance' : 'Payment Status'}
              </p>
              <p className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${
                pendingOrdersTotal > 0 ? 'text-amber-400' : 'text-intelligence-cyan'
              }`}>
                {pendingOrdersTotal > 0 ? formatCurrency(pendingOrdersTotal) : 'All clear'}
              </p>
              <p className="text-xs mt-1 text-gray-600">
                {pendingOrdersTotal > 0 ? 'Pending payment' : 'No outstanding invoices'}
              </p>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Stat row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-1">Projects</p>
                <p className="text-2xl font-bold text-white tabular-nums">{activeProjectCount}</p>
                <p className="text-[10px] text-gray-600">Active</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-1">Invoices</p>
                <p className="text-2xl font-bold text-white tabular-nums">{orders.length}</p>
                <p className="text-[10px] text-gray-600">Total</p>
              </div>
              {mostRecentOrder && (
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-1">Latest</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${
                    mostRecentOrder.status === 'paid'
                      ? 'text-green-400 bg-green-400/10 border-green-400/20'
                      : mostRecentOrder.status === 'pending'
                        ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                        : 'text-red-400 bg-red-400/10 border-red-400/20'
                  }`}>
                    <span className={`size-1 rounded-full ${
                      mostRecentOrder.status === 'paid' ? 'bg-green-400' :
                      mostRecentOrder.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    {mostRecentOrder.status === 'paid' ? 'Paid' : mostRecentOrder.status === 'pending' ? 'Pending' : 'Cancelled'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVE PROJECTS ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Active Projects</h2>
            {clientProjects.length > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                {activeProjectCount} active · {clientProjects.length} total
              </p>
            )}
          </div>
          {clientProjects.length > 3 && (
            <Link href={`/u/${username}/projects`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              View all <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
        <ClientActiveProjects projects={displayProjects} username={username} totalCount={clientProjects.length} />
      </div>

      {/* ── BOTTOM: Invoices + Activity ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        {/* Invoices */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-white">Invoices</h2>
          </div>
          <ClientInvoiceTimeline orders={serializedOrders} />
        </div>

        {/* Activity feed */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          </div>
          {activityEvents.length > 0 ? (
            <ActivityTimeline events={activityEvents} maxEvents={6} />
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-10 text-center">
              <p className="text-xs text-gray-600">No recent activity yet.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
