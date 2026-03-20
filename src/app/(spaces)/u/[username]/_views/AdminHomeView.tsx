'use client'

import { useState, useRef, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Zap, ArrowRight,
  ReceiptText, BarChart3, Activity, CalendarDays, Wallet,
} from 'lucide-react'
import Link from 'next/link'
import DynamicGreeting from '@/components/layout/dynamic-greeting'
import { PortfolioTimeline } from '@/components/dashboard/PortfolioTimeline'
import { ClientPortfolioTimeline } from '@/components/dashboard/ClientPortfolioTimeline'
import type { SerializedProject, SerializedSprint } from '@/components/dashboard/ProjectsCarousel'
import type { Range } from '@/components/dashboard/PortfolioTimeline'
import { RANGE_CFG } from '@/components/dashboard/PortfolioTimeline'
import { cn } from '@/lib/utils'

import dynamic from 'next/dynamic'
const AnalyticsSidebar = dynamic(
  () => import('@/components/dashboard/AnalyticsSidebar').then(m => ({ default: m.AnalyticsSidebar })),
  { ssr: false }
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminHomeViewProps {
  user: { firstName?: string | null; role: string }
  username: string
  clientAccounts: any[]
  allOrders: any[]
  allProjects: any[]
  allTasks: any[]
  allPackages: any[]
  completedTasksCount: number
  completedSprintsCount: number
  timeframe: '7d' | '30d' | '90d'
  serializedProjects: SerializedProject[]
}

type ActiveSprint = SerializedSprint & { projectName: string }
type HomeTab = 'overview' | 'sprints' | 'schedule' | 'analytics' | 'payments'

// ─── Sprint status config ─────────────────────────────────────────────────────

const SPRINT_STATUS_CFG: Record<string, { label: string; badge: string; bar: string; daysColor: string }> = {
  'in-progress': {
    label: 'In Progress',
    badge: 'text-[var(--space-accent)] bg-[var(--space-accent)]/[0.08] border-[var(--space-accent)]/20',
    bar:   'bg-[var(--space-accent)]/70',
    daysColor: 'text-[#6B6B6B]',
  },
  delayed: {
    label: 'Delayed',
    badge: 'text-yellow-600 bg-yellow-400/[0.08] border-yellow-400/20',
    bar:   'bg-yellow-400/70',
    daysColor: 'text-yellow-600',
  },
}

const TABS: { id: HomeTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',  icon: Activity },
  { id: 'sprints',   label: 'Sprints',   icon: Zap },
  { id: 'payments',  label: 'Payments',  icon: Wallet },
  { id: 'schedule',  label: 'Schedule',  icon: CalendarDays },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtShort(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) {
    const k = n / 1000
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return `$${n}`
}

// ─── Sprint Carousel ──────────────────────────────────────────────────────────

function SprintCarousel({ sprints, username }: { sprints: ActiveSprint[]; username: string }) {
  const [idx, setIdx] = useState(0)
  const safeIdx     = Math.min(idx, sprints.length - 1)
  const sprint      = sprints[safeIdx]
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const prev = () => setIdx(i => Math.max(0, i - 1))
  const next = () => setIdx(i => Math.min(sprints.length - 1, i + 1))

  if (sprints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center" role="status">
        <div className="size-12 rounded-2xl bg-[#111] border border-[#1C1C1C] flex items-center justify-center mb-4" aria-hidden="true">
          <Zap className="size-5 text-[#2A2A2A]" />
        </div>
        <p className="text-sm text-[#4A4A4A] font-medium">No active sprints</p>
        <p className="text-xs text-[#333] mt-1">Sprints in progress or delayed will appear here</p>
      </div>
    )
  }

  const cfg      = SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG['in-progress']
  const pct      = sprint.totalTasksCount > 0 ? Math.round((sprint.completedTasksCount / sprint.totalTasksCount) * 100) : 0
  const daysLeft = Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86_400_000)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (sprints.length <= 1) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx) * 0.85 || Math.abs(dx) < 40) return
    if (dx < 0) next(); else prev()
  }

  return (
    <div className="space-y-4" aria-label={`Sprint ${safeIdx + 1} of ${sprints.length}`}>
      {sprints.length > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#444]" aria-live="polite">{safeIdx + 1} of {sprints.length} active</span>
          <div className="flex items-center gap-1.5" role="group" aria-label="Sprint navigation">
            <button
              onClick={prev} disabled={safeIdx === 0}
              aria-label="Previous sprint"
              className="flex items-center justify-center size-7 rounded-lg border border-[#1C1C1C] bg-[#0D0D0D] text-[#555] hover:text-[#E0E0E0] hover:border-[#2A2A2A] hover:bg-[#141414] disabled:opacity-20 disabled:pointer-events-none transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]/40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={next} disabled={safeIdx === sprints.length - 1}
              aria-label="Next sprint"
              className="flex items-center justify-center size-7 rounded-lg border border-[#1C1C1C] bg-[#0D0D0D] text-[#555] hover:text-[#E0E0E0] hover:border-[#2A2A2A] hover:bg-[#141414] disabled:opacity-20 disabled:pointer-events-none transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]/40"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Link
          href={`/u/${username}/projects/${sprint.projectId}/sprints/${sprint.id}`}
          className="block rounded-2xl border border-[#1C1C1C] bg-[#0D0D0D] overflow-hidden hover:border-[#262626] hover:bg-[#111] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--space-accent)]/40"
          aria-label={`Sprint: ${sprint.name} — ${sprint.projectName}`}
        >
          <div className="p-5">
            <div className="flex items-center justify-between gap-4 mb-5">
              <span className={`text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {cfg.label}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[11px] font-medium tabular-nums ${daysLeft < 0 ? 'text-red-400' : daysLeft <= 3 ? 'text-amber-500' : cfg.daysColor}`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Due tomorrow' : `${daysLeft}d left`}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-[#3A3A3A] group-hover:text-[#555] transition-colors" aria-hidden="true">
                  Open <ArrowRight className="size-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#F0F0F0] leading-snug mb-1">{sprint.name}</h3>
            <p className="text-[11px] text-[#444] mb-4">
              {sprint.projectName}
              <span className="mx-1.5 text-[#333]">·</span>
              {fmtShort(sprint.startDate)} → {fmtShort(sprint.endDate)}
            </p>

            {sprint.goalDescription && (
              <p className="text-xs text-[#555] leading-relaxed line-clamp-3 mb-5">{sprint.goalDescription}</p>
            )}

            {sprint.totalTasksCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#444] font-semibold">Tasks</span>
                  <span className="text-[11px] text-[#555] tabular-nums">
                    {sprint.completedTasksCount}/{sprint.totalTasksCount}
                    <span className="ml-1.5 text-[#3A3A3A]">· {pct}%</span>
                  </span>
                </div>
                <div
                  className="h-[3px] rounded-full bg-[#1A1A1A] overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${pct}% complete`}
                >
                  <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>

          {sprints.length > 1 && (
            <div
              className="flex items-center justify-center gap-1.5 px-5 py-3 border-t border-[#141414]"
              aria-hidden="true"
              onClick={e => e.preventDefault()}
            >
              {sprints.map((_, i) => (
                <button
                  key={i}
                  tabIndex={-1}
                  onClick={e => { e.preventDefault(); setIdx(i) }}
                  className={`rounded-full transition-all duration-200 ${i === safeIdx ? 'size-1.5 bg-[var(--space-accent)]/70' : 'size-1 bg-[#242424] hover:bg-[#444]'}`}
                />
              ))}
            </div>
          )}
        </Link>
      </div>
    </div>
  )
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { label: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div
      className="flex items-end gap-2 h-20"
      role="img"
      aria-label={`Weekly revenue: ${data.map(d => `${d.label} ${fmtUsd(d.revenue)}`).join(', ')}`}
    >
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group/bar">
          <div className="w-full rounded-t bg-[#141414] relative overflow-hidden" style={{ height: 56 }}>
            <div
              className="absolute bottom-0 w-full rounded-t transition-all duration-700 group-hover/bar:opacity-80"
              style={{
                height: `${Math.max(3, (d.revenue / max) * 56)}px`,
                background: d.revenue === max && d.revenue > 0
                  ? 'rgba(139,156,182,0.6)'
                  : 'rgba(139,156,182,0.18)',
              }}
            />
          </div>
          <span className="text-[9px] text-[#3A3A3A] whitespace-nowrap">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminHomeView({
  user, username, clientAccounts, allOrders, allProjects,
  allPackages, completedTasksCount, completedSprintsCount, timeframe, serializedProjects,
}: AdminHomeViewProps) {
  const [homeTab, setHomeTab] = useState<HomeTab>('overview')
  const [range, setRange]     = useState<Range>('week')
  const tabRefs               = useRef<(HTMLButtonElement | null)[]>([])

  const now            = Date.now()
  const activeProjects = allProjects.filter((p: any) => p.status === 'in-progress' || p.status === 'pending').length
  const thirtyDaysAgo  = now - 30 * 24 * 60 * 60 * 1000
  const orders30d      = allOrders.filter((o: any) => new Date(o.createdAt).getTime() > thirtyDaysAgo)

  const weeklyRevenue = [3, 2, 1, 0].map((weeksAgo) => {
    const weekEnd   = now - weeksAgo * 7 * 24 * 60 * 60 * 1000
    const wkStart   = weekEnd - 7 * 24 * 60 * 60 * 1000
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
    paidAmount:      allOrders.filter((o: any) => o.status === 'paid').reduce((s: number, o: any) => s + (o.amount || 0), 0),
    pendingAmount:   allOrders.filter((o: any) => o.status === 'pending').reduce((s: number, o: any) => s + (o.amount || 0), 0),
    cancelledAmount: allOrders.filter((o: any) => o.status === 'cancelled').reduce((s: number, o: any) => s + (o.amount || 0), 0),
    paidCount:       allOrders.filter((o: any) => o.status === 'paid').length,
    pendingCount:    allOrders.filter((o: any) => o.status === 'pending').length,
    cancelledCount:  allOrders.filter((o: any) => o.status === 'cancelled').length,
  }

  const pipelineTotal = orderPipeline.paidAmount + orderPipeline.pendingAmount + orderPipeline.cancelledAmount || 1
  const paidPct       = Math.round((orderPipeline.paidAmount   / pipelineTotal) * 100)
  const pendingPct    = Math.round((orderPipeline.pendingAmount / pipelineTotal) * 100)

  const projectStatus = {
    active:    allProjects.filter((p: any) => p.status === 'in-progress').length,
    pending:   allProjects.filter((p: any) => p.status === 'pending').length,
    completed: allProjects.filter((p: any) => p.status === 'completed').length,
  }

  const pulseKpis = {
    revenue30d:     orderPipeline.paidAmount,
    orders30d:      orders30d.length,
    activeClients:  clientAccounts.length,
    activeProjects: projectStatus.active,
  }

  const pendingOrders = allOrders.filter((o: any) => o.status === 'pending').slice(0, 6)

  // Uninvoiced schedule entries = planned payments not yet converted to an order
  // Only from proposals that have been sent/accepted (pushed out to a client) — excludes templates and drafts
  const uninvoicedEntries = (allPackages ?? [])
    .filter((pkg: any) => pkg.type === 'proposal' && (pkg.status === 'sent' || pkg.status === 'accepted'))
    .flatMap((pkg: any) =>
      (pkg.paymentSchedule ?? [])
        .filter((e: any) => !e.orderId)
        .map((e: any) => ({ ...e, packageName: pkg.name ?? 'Untitled', packageId: pkg.id }))
    ).sort((a: any, b: any) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
  const uninvoicedAmount = uninvoicedEntries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
  const uninvoicedCount  = uninvoicedEntries.length

  // Full pending orders list (invoiced, awaiting payment) sorted soonest due first
  const allPendingOrders = allOrders
    .filter((o: any) => o.status === 'pending')
    .sort((a: any, b: any) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

  // Consolidated pending = open invoices (pending orders) + uninvoiced schedule entries
  const totalPendingAmount = orderPipeline.pendingAmount + uninvoicedAmount
  const totalPendingCount  = orderPipeline.pendingCount + uninvoicedCount
  const activeSprints: ActiveSprint[] = serializedProjects
    .flatMap(p => p.sprints.map(s => ({ ...s, projectName: p.name })))
    .filter(s => s.status === 'in-progress' || s.status === 'delayed')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())

  // Arrow key navigation for vertical nav (up/down)
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentIdx: number) => {
    let next = currentIdx
    if (e.key === 'ArrowDown') next = (currentIdx + 1) % TABS.length
    else if (e.key === 'ArrowUp') next = (currentIdx - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    setHomeTab(TABS[next].id)
    tabRefs.current[next]?.focus()
  }, [])

  // KPI summary for the right nav column
  const kpiStats = [
    { label: 'Rev',  value: fmtCompact(pulseKpis.revenue30d),        accent: true },
    { label: 'Proj', value: String(projectStatus.active),             accent: false },
    { label: 'CLI',  value: String(pulseKpis.activeClients),          accent: false },
    { label: 'Due',  value: fmtCompact(totalPendingAmount),           accent: false },
  ]

  return (
    <div className="max-w-7xl mx-auto pl-8 pr-4 sm:pl-8 sm:pr-6 lg:pl-16 lg:pr-8 pt-8 sm:pt-10 pb-24">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-[#1E3A6E] uppercase tracking-[0.25em]">
          {user.role === 'admin' ? 'Admin' : 'Workspace'} · ORCACLUB Spaces
        </p>
      </div>

      {/* ── Two-column: content left + vertical nav right ──────────────── */}
      <div className="flex items-start gap-3">

        {/* ── Left: main content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          <div>
            <DynamicGreeting />
            <p className="text-[10px] text-[#3A3A3A] text-center mt-1">
              {user.role === 'admin'
                ? `Overseeing ${clientAccounts.length} client${clientAccounts.length !== 1 ? 's' : ''} · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
                : `${clientAccounts.length} assigned client${clientAccounts.length !== 1 ? 's' : ''} · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Overview — pulse summary */}
          {homeTab === 'overview' && (
            <div className="rounded-2xl border border-[#1C1C1C] bg-[#0D0D0D] overflow-hidden">

              {/* Collected */}
              <div className="px-4 py-4 border-b border-[#141414]">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#333] mb-2">Collected</p>
                <p className="text-2xl font-black tabular-nums text-[var(--space-accent)] leading-none">
                  {fmtUsd(orderPipeline.paidAmount)}
                </p>
                <p className="text-[10px] text-[#3A3A3A] mt-1">
                  {orderPipeline.paidCount} paid order{orderPipeline.paidCount !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Pending orders — open invoices + uninvoiced schedule entries */}
              <div className="px-4 py-4 border-b border-[#141414]">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#333] mb-2">Pending Orders</p>
                <p className="text-2xl font-black tabular-nums text-[#F0F0F0] leading-none">
                  {fmtUsd(totalPendingAmount)}
                </p>
                <p className="text-[10px] text-[#3A3A3A] mt-1">
                  {orderPipeline.pendingCount > 0 && `${orderPipeline.pendingCount} open invoice${orderPipeline.pendingCount !== 1 ? 's' : ''}`}
                  {orderPipeline.pendingCount > 0 && uninvoicedCount > 0 && ' · '}
                  {uninvoicedCount > 0 && `${uninvoicedCount} scheduled`}
                  {totalPendingCount === 0 && 'no pending balance'}
                </p>
              </div>

              {/* Active sprints */}
              <div className="px-4 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#333] mb-2">Active Sprints</p>
                <p className="text-2xl font-black tabular-nums text-[#F0F0F0] leading-none">
                  {activeSprints.length}
                </p>
                {activeSprints.length > 0 ? (
                  <p className="text-[10px] text-[#3A3A3A] mt-1 truncate">
                    {activeSprints.slice(0, 2).map(s => s.name).join(' · ')}
                    {activeSprints.length > 2 ? ` +${activeSprints.length - 2}` : ''}
                  </p>
                ) : (
                  <p className="text-[10px] text-[#3A3A3A] mt-1">no sprints in progress</p>
                )}
              </div>

            </div>
          )}

          {/* Sprints */}
          {homeTab === 'sprints' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="size-3.5 text-[var(--space-accent)]/40" aria-hidden="true" />
                <span className="text-[10px] font-bold text-[#3A3A3A] uppercase tracking-[0.25em]">
                  {activeSprints.length} Active Sprint{activeSprints.length !== 1 ? 's' : ''}
                </span>
              </div>
              <SprintCarousel sprints={activeSprints} username={username} />
            </div>
          )}

          {/* Payments — pending orders + uninvoiced schedule entries */}
          {homeTab === 'payments' && (
            <div className="space-y-4">

              {/* Open invoices */}
              <div className="rounded-2xl border border-[#1C1C1C] bg-[#0D0D0D] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#444]">Open Invoices</p>
                  <span className="text-[9px] font-bold tabular-nums text-amber-400/70">
                    {orderPipeline.pendingCount > 0 ? fmtUsd(orderPipeline.pendingAmount) : 'none'}
                  </span>
                </div>
                {allPendingOrders.length === 0 ? (
                  <p className="px-4 py-5 text-[11px] text-[#333]">No open invoices</p>
                ) : (
                  <ul role="list">
                    {allPendingOrders.map((order: any, i: number) => {
                      const ca       = typeof order.clientAccount === 'object' ? order.clientAccount : null
                      const name     = ca?.companyName || ca?.firstName || 'Client'
                      const daysLeft = order.dueDate
                        ? Math.ceil((new Date(order.dueDate).getTime() - Date.now()) / 86_400_000)
                        : null
                      return (
                        <li
                          key={order.id}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3',
                            i < allPendingOrders.length - 1 && 'border-b border-[#111]',
                          )}
                        >
                          <ReceiptText className="size-3.5 text-[#2A2A2A] shrink-0" aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-[#C0C0C0] truncate leading-none">
                              {order.orderNumber}
                            </div>
                            <div className="text-[9px] text-[#444] mt-0.5 truncate">{name}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[11px] font-bold tabular-nums text-amber-400 leading-none">
                              {fmtUsd(order.amount)}
                            </div>
                            {daysLeft !== null && (
                              <div className={cn(
                                'text-[9px] mt-0.5 tabular-nums',
                                daysLeft < 0 ? 'text-red-400' : daysLeft <= 3 ? 'text-amber-500' : 'text-[#444]',
                              )}>
                                {daysLeft < 0 ? `${Math.abs(daysLeft)}d over` : daysLeft === 0 ? 'today' : `${daysLeft}d`}
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Uninvoiced schedule entries */}
              <div className="rounded-2xl border border-[#1C1C1C] bg-[#0D0D0D] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#444]">Scheduled</p>
                  <span className="text-[9px] font-bold tabular-nums text-[var(--space-accent)]/70">
                    {uninvoicedCount > 0 ? fmtUsd(uninvoicedAmount) : 'none'}
                  </span>
                </div>
                {uninvoicedEntries.length === 0 ? (
                  <p className="px-4 py-5 text-[11px] text-[#333]">No scheduled payments</p>
                ) : (
                  <ul role="list">
                    {uninvoicedEntries.map((entry: any, i: number) => {
                      const daysLeft = entry.dueDate
                        ? Math.ceil((new Date(entry.dueDate).getTime() - Date.now()) / 86_400_000)
                        : null
                      return (
                        <li
                          key={entry.id ?? i}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3',
                            i < uninvoicedEntries.length - 1 && 'border-b border-[#111]',
                          )}
                        >
                          <Wallet className="size-3.5 text-[#2A2A2A] shrink-0" aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-[#C0C0C0] truncate leading-none">
                              {entry.label || 'Payment'}
                            </div>
                            <div className="text-[9px] text-[#444] mt-0.5 truncate">{entry.packageName}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[11px] font-bold tabular-nums text-[var(--space-accent)] leading-none">
                              {fmtUsd(entry.amount || 0)}
                            </div>
                            {daysLeft !== null && (
                              <div className={cn(
                                'text-[9px] mt-0.5 tabular-nums',
                                daysLeft < 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-500' : 'text-[#444]',
                              )}>
                                {daysLeft < 0 ? `${Math.abs(daysLeft)}d over` : daysLeft === 0 ? 'today' : `${daysLeft}d`}
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

            </div>
          )}

          {/* Schedule */}
          {homeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#3A3A3A] uppercase tracking-[0.25em]">Schedule</p>
                <div
                  className="flex items-center p-1 bg-[#0D0D0D] rounded-xl border border-[#1C1C1C]"
                  role="group"
                  aria-label="Time range"
                >
                  {(['week', 'month', 'year'] as Range[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      aria-pressed={range === r}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]/40',
                        range === r
                          ? 'bg-[#1C1C1C] text-[#E0E0E0] shadow-sm'
                          : 'text-[#555] hover:text-[#888]',
                      )}
                    >
                      {RANGE_CFG[r].label}
                    </button>
                  ))}
                </div>
              </div>

              {serializedProjects.length > 0 && (
                <PortfolioTimeline
                  projects={serializedProjects}
                  allOrders={allOrders}
                  username={username}
                  externalRange={range}
                  onRangeChange={setRange}
                />
              )}
              {clientAccounts.length > 0 && (
                <ClientPortfolioTimeline
                  clientAccounts={clientAccounts}
                  serializedProjects={serializedProjects}
                  allOrders={allOrders}
                  username={username}
                  externalRange={range}
                  onRangeChange={setRange}
                />
              )}
              {serializedProjects.length === 0 && clientAccounts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center" role="status">
                  <div className="size-12 rounded-2xl bg-[#111] border border-[#1C1C1C] flex items-center justify-center mb-4" aria-hidden="true">
                    <CalendarDays className="size-5 text-[#2A2A2A]" />
                  </div>
                  <p className="text-sm text-[#4A4A4A] font-medium">No schedule data yet</p>
                  <p className="text-xs text-[#333] mt-1">Projects and clients with active sprints will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {homeTab === 'analytics' && (
            <div className="space-y-5">

              <div className="bg-[#0D0D0D] border border-[#1C1C1C] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em]">Weekly Revenue</p>
                  <span className="text-sm font-bold text-[#E0E0E0] tabular-nums">{fmtUsd(pulseKpis.revenue30d)}</span>
                </div>
                <MiniBarChart data={weeklyRevenue} />
              </div>

              <div className="bg-[#0D0D0D] border border-[#1C1C1C] rounded-2xl p-5 space-y-4">
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em]">Order Pipeline · All Time</p>
                <div
                  className="h-[5px] rounded-full overflow-hidden flex gap-px"
                  role="img"
                  aria-label={`Paid: ${paidPct}%, Pending: ${pendingPct}%`}
                >
                  {paidPct > 0    && <div className="bg-emerald-500/60 rounded-l-full" style={{ width: `${paidPct}%` }} />}
                  {pendingPct > 0 && <div className="bg-amber-500/60"                  style={{ width: `${pendingPct}%` }} />}
                  <div className="bg-[#1C1C1C] flex-1 rounded-r-full" />
                </div>
                <dl className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Collected', amount: orderPipeline.paidAmount,      count: orderPipeline.paidCount,      color: 'text-emerald-400', dot: 'bg-emerald-500/60' },
                    { label: 'Pending',   amount: orderPipeline.pendingAmount,   count: orderPipeline.pendingCount,   color: 'text-amber-400',   dot: 'bg-amber-500/60' },
                    { label: 'Cancelled', amount: orderPipeline.cancelledAmount, count: orderPipeline.cancelledCount, color: 'text-[#444]',      dot: 'bg-[#1C1C1C]' },
                  ].map(s => (
                    <div key={s.label} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`size-[5px] rounded-full ${s.dot}`} aria-hidden="true" />
                        <dt className="text-[9px] text-[#444] uppercase tracking-widest">{s.label}</dt>
                      </div>
                      <dd className={`text-sm font-bold tabular-nums ${s.color}`}>{fmtUsd(s.amount)}</dd>
                      <p className="text-[9px] text-[#333]">{s.count} order{s.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="bg-[#0D0D0D] border border-[#1C1C1C] rounded-2xl p-5 space-y-4">
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em]">Project Health</p>
                <dl className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Active',    value: projectStatus.active,    color: 'text-[var(--space-accent)]', bar: 'bg-[var(--space-accent)]/50' },
                    { label: 'Pending',   value: projectStatus.pending,   color: 'text-amber-400',             bar: 'bg-amber-400/50' },
                    { label: 'Completed', value: projectStatus.completed, color: 'text-emerald-400',           bar: 'bg-emerald-400/50' },
                  ].map(s => (
                    <div key={s.label} className="space-y-2">
                      <dd className="text-2xl font-bold tabular-nums text-[#E0E0E0]">{s.value}</dd>
                      <div
                        className="h-[3px] rounded-full bg-[#1A1A1A] overflow-hidden"
                        role="progressbar"
                        aria-valuenow={s.value}
                        aria-valuemax={Math.max(allProjects.length, 1)}
                      >
                        <div
                          className={`h-full rounded-full ${s.bar}`}
                          style={{ width: `${Math.min(100, (s.value / Math.max(allProjects.length, 1)) * 100)}%` }}
                        />
                      </div>
                      <dt className="text-[9px] text-[#3A3A3A] uppercase tracking-widest">{s.label}</dt>
                    </div>
                  ))}
                </dl>
              </div>

              {pendingOrders.length > 0 && (
                <div className="bg-[#0D0D0D] border border-[#1C1C1C] rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#141414]">
                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em]">Pending Invoices</p>
                    <span className="text-[11px] text-amber-500/80 tabular-nums font-medium">{orderPipeline.pendingCount} open</span>
                  </div>
                  <ul role="list">
                    {pendingOrders.map((order: any, i: number) => {
                      const ca   = typeof order.clientAccount === 'object' ? order.clientAccount : null
                      const name = ca?.companyName || ca?.firstName || 'Client'
                      return (
                        <li
                          key={order.id}
                          className={cn('flex items-center gap-3 px-5 py-3.5', i < pendingOrders.length - 1 && 'border-b border-[#141414]')}
                        >
                          <ReceiptText className="size-3.5 text-[#2A2A2A] shrink-0" aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] text-[#C0C0C0] font-medium truncate">{order.orderNumber}</div>
                            <div className="text-[10px] text-[#444] truncate">{name}</div>
                          </div>
                          <div className="text-[12px] font-semibold text-amber-400 tabular-nums shrink-0">
                            {fmtUsd(order.amount)}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ── Right: vertical nav + KPI stats ────────────────────────── */}
        <nav
          aria-label="Dashboard sections"
          className="shrink-0 w-11 flex flex-col items-center gap-0.5"
        >
          {/* Tab buttons */}
          {TABS.map(({ id, label, icon: Icon }, i) => {
            const isActive = homeTab === id
            return (
              <button
                key={id}
                ref={el => { tabRefs.current[i] = el }}
                onClick={() => setHomeTab(id)}
                onKeyDown={(e) => handleTabKeyDown(e, i)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center justify-center size-10 rounded-xl transition-all duration-150',
                  'active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--space-accent)]/40',
                  isActive
                    ? 'bg-[var(--space-accent)]/[0.10] text-[var(--space-accent)]'
                    : 'text-[#383838] hover:text-[#555] hover:bg-white/[0.03]',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {id === 'sprints' && activeSprints.length > 0 && (
                  <span
                    className={cn(
                      'absolute top-1.5 right-1.5 size-[4px] rounded-full',
                      isActive ? 'bg-[var(--space-accent)]' : 'bg-[#3A3A3A]',
                    )}
                    aria-hidden="true"
                  />
                )}
                {id === 'payments' && totalPendingCount > 0 && (
                  <span
                    className={cn(
                      'absolute top-1.5 right-1.5 size-[4px] rounded-full',
                      isActive ? 'bg-amber-400' : 'bg-amber-400/50',
                    )}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}

          {/* Divider */}
          <div className="w-5 h-px bg-[#1C1C1C] mt-3 mb-1" aria-hidden="true" />

          {/* KPI mini stats */}
          {kpiStats.map(({ label, value, accent }) => (
            <div key={label} className="flex flex-col items-center text-center w-full py-2">
              <span className={cn(
                'text-[11px] font-bold tabular-nums leading-none',
                accent ? 'text-[var(--space-accent)]' : 'text-[#C0C0C0]',
              )}>
                {value}
              </span>
              <span className="text-[7px] uppercase tracking-[0.12em] text-[#333] mt-1 leading-none">
                {label}
              </span>
            </div>
          ))}
        </nav>

      </div>

      {/* ── Analytics sidebar (desktop) ──────────────────────────────── */}
      <AnalyticsSidebar
        weeklyRevenue={weeklyRevenue}
        orderPipeline={orderPipeline}
        projectStatus={projectStatus}
        kpis={pulseKpis}
        allOrders={allOrders}
      />

    </div>
  )
}
