import Link from 'next/link'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { AnalyticsSidebar } from '@/components/dashboard/AnalyticsSidebar'
import { HeroTabCard } from '@/components/dashboard/HeroTabCard'
import type { HeroRevenueData, HeroProjectData } from '@/components/dashboard/HeroTabCard'
import {
  Receipt,
  FolderOpen,
  CheckSquare,
  DollarSign,
  ArrowRight,
} from 'lucide-react'

interface AdminHomeViewProps {
  user: { firstName?: string | null; role: string }
  username: string
  clientAccounts: any[]
  allOrders: any[]
  allProjects: any[]
  allTasks: any[]
  completedTasksCount: number
  completedSprintsCount: number
  timeframe: '7d' | '30d' | '90d'
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export function AdminHomeView({
  user,
  username,
  clientAccounts,
  allOrders,
  allProjects,
  allTasks,
  completedTasksCount,
  completedSprintsCount,
  timeframe,
}: AdminHomeViewProps) {
  const windowDays = timeframe === '90d' ? 90 : timeframe === '30d' ? 30 : 7
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

  const pendingBalance = allOrders
    .filter((o: any) => o.status === 'pending')
    .reduce((sum: number, o: any) => sum + (o.amount || 0), 0)

  const activeProjects = allProjects.filter(
    (p: any) => p.status === 'in-progress' || p.status === 'pending'
  ).length

  const pendingTasks = allTasks.filter((t: any) => t.status === 'pending').length

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

  const projectedOrders = allOrders
    .filter((o: any) => o.status === 'pending')
    .sort((a: any, b: any) => {
      const aMs = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const bMs = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      return aMs - bMs
    })
  const projectedTotal = projectedOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0)

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
            href={`/u/${username}?tab=projects`}
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
            href={`/u/${username}?tab=tasks`}
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
                    <div className={`w-0.5 self-stretch shrink-0 mr-4 ${
                      isOverdue
                        ? 'bg-red-400'
                        : isDueSoon
                          ? 'bg-amber-400'
                          : dueDate
                            ? 'bg-yellow-400/30'
                            : 'bg-white/[0.06]'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {order.orderNumber ?? `INV-${order.id.slice(-6).toUpperCase()}`}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                        {clientName}{projectName ? ` · ${projectName}` : ''}
                      </p>
                    </div>

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
