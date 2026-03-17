'use client'

import { useState, useRef, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Zap, ArrowRight, TrendingUp,
  FolderKanban, Building2, Clock,
  ReceiptText, BarChart3, Activity, CalendarDays,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { PortfolioTimeline } from '@/components/dashboard/PortfolioTimeline'
import { ClientPortfolioTimeline } from '@/components/dashboard/ClientPortfolioTimeline'
import type { SerializedProject, SerializedSprint } from '@/components/dashboard/ProjectsCarousel'
import type { Range } from '@/components/dashboard/PortfolioTimeline'
import { RANGE_CFG } from '@/components/dashboard/PortfolioTimeline'
import { cn } from '@/lib/utils'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { ThemeSwitcher } from '@/components/dashboard/ThemeSwitcher'
import { AnalyticsSidebar } from '@/components/dashboard/AnalyticsSidebar'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  serializedProjects: SerializedProject[]
}

type ActiveSprint = SerializedSprint & { projectName: string }
type HomeTab = 'overview' | 'sprints' | 'schedule' | 'analytics'

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
          <div className="p-5 sm:p-6">
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

            <h3 className="text-xl sm:text-2xl font-bold text-[#F0F0F0] leading-snug mb-1">{sprint.name}</h3>
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

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-150',
        'focus-within:ring-1 focus-within:ring-[var(--space-accent)]/30',
        accent
          ? 'bg-[rgba(139,156,182,0.04)] border-[rgba(139,156,182,0.14)] hover:bg-[rgba(139,156,182,0.07)] hover:border-[rgba(139,156,182,0.22)] hover:scale-[1.01]'
          : 'bg-[#0D0D0D] border-[#1C1C1C] hover:border-[#262626] hover:bg-[#111] hover:scale-[1.01]',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A4A4A]">{label}</span>
        <Icon
          className={`size-3.5 transition-colors ${accent ? 'text-[var(--space-accent)]/50' : 'text-[#282828]'}`}
          aria-hidden="true"
        />
      </div>
      <div>
        <div className={`text-2xl font-bold tabular-nums ${accent ? 'text-[var(--space-accent)]' : 'text-[#F0F0F0]'}`}>
          {value}
        </div>
        {sub && <div className="text-[11px] text-[#444] mt-0.5">{sub}</div>}
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
  completedTasksCount, completedSprintsCount, timeframe, serializedProjects,
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

  const pendingOrders  = allOrders.filter((o: any) => o.status === 'pending').slice(0, 6)
  const activeSprints: ActiveSprint[] = serializedProjects
    .flatMap(p => p.sprints.map(s => ({ ...s, projectName: p.name })))
    .filter(s => s.status === 'in-progress' || s.status === 'delayed')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())

  // Arrow key navigation for tabs
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentIdx: number) => {
    let next = currentIdx
    if (e.key === 'ArrowRight') next = (currentIdx + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (currentIdx - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    setHomeTab(TABS[next].id)
    tabRefs.current[next]?.focus()
  }, [])

  return (
    <div className="max-w-7xl mx-auto pl-4 pr-14 sm:pl-6 sm:pr-14 lg:pl-8 lg:pr-16 pt-8 sm:pt-10 pb-24">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[11px] font-semibold text-[#1E3A6E] uppercase tracking-[0.25em]">
          {user.role === 'admin' ? 'Admin' : 'Workspace'} · ORCACLUB Spaces
        </p>
        <ThemeSwitcher />
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="flex gap-0 mb-8 border-b border-[#141414] overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map(({ id, label, icon: Icon }, i) => {
          const isActive = homeTab === id
          return (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${id}`}
              tabIndex={isActive ? 0 : -1}
              ref={el => { tabRefs.current[i] = el }}
              onClick={() => setHomeTab(id)}
              onKeyDown={(e) => handleTabKeyDown(e, i)}
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap',
                'border-b-[3px] -mb-px transition-all duration-150 shrink-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]/30',
                isActive
                  ? 'text-[var(--space-accent)] border-[var(--space-accent)]'
                  : 'text-[#3A3A3A] border-transparent hover:text-[#666] hover:border-[#262626]',
              )}
            >
              <Icon className="size-3 shrink-0" aria-hidden="true" />
              {label}
              {id === 'sprints' && activeSprints.length > 0 && (
                <span
                  aria-label={`${activeSprints.length} active`}
                  className={cn(
                    'ml-0.5 text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full',
                    isActive
                      ? 'bg-[var(--space-accent)]/10 text-[var(--space-accent)]'
                      : 'bg-[#141414] text-[#444]',
                  )}
                >
                  {activeSprints.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      <div
        id="panel-overview"
        role="tabpanel"
        aria-labelledby="tab-overview"
        hidden={homeTab !== 'overview'}
        tabIndex={0}
        className="focus-visible:outline-none"
      >
        {homeTab === 'overview' && (
          <div className="space-y-8">

            {/* Greeting + revenue */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
              <div className="flex-1 min-w-0">
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
              <div className="lg:shrink-0" style={{ maxWidth: 400 }}>
                <RevenueChart allOrders={allOrders} range="month" onInfo={() => setHomeTab('analytics')} />
              </div>
            </div>

            {/* KPI grid */}
            <section aria-label="Key metrics">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard
                  label="Revenue 30d"
                  value={fmtUsd(pulseKpis.revenue30d)}
                  sub={`${pulseKpis.orders30d} order${pulseKpis.orders30d !== 1 ? 's' : ''}`}
                  icon={TrendingUp}
                  accent
                />
                <KpiCard
                  label="Active Projects"
                  value={String(projectStatus.active)}
                  sub={`${projectStatus.pending} pending · ${projectStatus.completed} done`}
                  icon={FolderKanban}
                />
                <KpiCard
                  label="Clients"
                  value={String(pulseKpis.activeClients)}
                  sub="total accounts"
                  icon={Building2}
                />
                <KpiCard
                  label="Pending"
                  value={fmtUsd(orderPipeline.pendingAmount)}
                  sub={`${orderPipeline.pendingCount} invoice${orderPipeline.pendingCount !== 1 ? 's' : ''}`}
                  icon={Clock}
                />
              </div>
            </section>

            {/* Sprint quick list */}
            {activeSprints.length > 0 && (
              <section aria-label="Active sprints" className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#3A3A3A] uppercase tracking-[0.25em]">Active Sprints</p>
                  <button
                    onClick={() => setHomeTab('sprints')}
                    className="text-[11px] text-[var(--space-accent)]/70 hover:text-[var(--space-accent)] transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-2" role="list">
                  {activeSprints.slice(0, 3).map(sprint => {
                    const cfg      = SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG['in-progress']
                    const pct      = sprint.totalTasksCount > 0 ? Math.round((sprint.completedTasksCount / sprint.totalTasksCount) * 100) : 0
                    const daysLeft = Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86_400_000)
                    return (
                      <div key={sprint.id} role="listitem">
                        <Link
                          href={`/u/${username}/projects/${sprint.projectId}/sprints/${sprint.id}`}
                          className="flex items-center gap-4 px-4 py-3.5 bg-[#0D0D0D] border border-[#1C1C1C] rounded-xl hover:border-[#262626] hover:bg-[#111] transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--space-accent)]/30"
                          aria-label={`${sprint.name} — ${sprint.projectName}, ${pct}% complete`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[9px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                                {cfg.label}
                              </span>
                              <span className="text-[10px] text-[#444] truncate">{sprint.projectName}</span>
                            </div>
                            <div className="text-sm font-semibold text-[#D8D8D8] truncate mb-2">{sprint.name}</div>
                            {sprint.totalTasksCount > 0 && (
                              <div
                                className="h-[2px] rounded-full bg-[#1A1A1A] overflow-hidden w-full"
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 text-right flex flex-col gap-0.5">
                            <div className={`text-xs font-semibold tabular-nums ${daysLeft < 0 ? 'text-red-400' : daysLeft <= 3 ? 'text-amber-500' : 'text-[#555]'}`}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d over` : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                            </div>
                            <div className="text-[9px] text-[#333]">{sprint.completedTasksCount}/{sprint.totalTasksCount} tasks</div>
                          </div>
                          <ArrowRight className="size-3.5 text-[#2A2A2A] group-hover:text-[#555] group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

          </div>
        )}
      </div>

      {/* ── SPRINTS ──────────────────────────────────────────────────────────── */}
      <div
        id="panel-sprints"
        role="tabpanel"
        aria-labelledby="tab-sprints"
        hidden={homeTab !== 'sprints'}
        tabIndex={0}
        className="focus-visible:outline-none"
      >
        {homeTab === 'sprints' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="size-3.5 text-[var(--space-accent)]/40" aria-hidden="true" />
              <span className="text-[10px] font-bold text-[#3A3A3A] uppercase tracking-[0.25em]">
                {activeSprints.length} Active Sprint{activeSprints.length !== 1 ? 's' : ''}
              </span>
            </div>
            <SprintCarousel sprints={activeSprints} username={username} />
          </div>
        )}
      </div>

      {/* ── SCHEDULE ─────────────────────────────────────────────────────────── */}
      <div
        id="panel-schedule"
        role="tabpanel"
        aria-labelledby="tab-schedule"
        hidden={homeTab !== 'schedule'}
        tabIndex={0}
        className="focus-visible:outline-none"
      >
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
                      'px-3 sm:px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150',
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
      </div>

      {/* ── ANALYTICS ────────────────────────────────────────────────────────── */}
      <div
        id="panel-analytics"
        role="tabpanel"
        aria-labelledby="tab-analytics"
        hidden={homeTab !== 'analytics'}
        tabIndex={0}
        className="focus-visible:outline-none"
      >
        {homeTab === 'analytics' && (
          <div className="space-y-5">

            {/* Weekly revenue */}
            <div className="bg-[#0D0D0D] border border-[#1C1C1C] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-[0.2em]">Weekly Revenue</p>
                <span className="text-sm font-bold text-[#E0E0E0] tabular-nums">{fmtUsd(pulseKpis.revenue30d)}</span>
              </div>
              <MiniBarChart data={weeklyRevenue} />
            </div>

            {/* Order pipeline */}
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

            {/* Project health */}
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

            {/* Pending invoices */}
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

      {/* ── Analytics sidebar ────────────────────────────────────────────────── */}
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
