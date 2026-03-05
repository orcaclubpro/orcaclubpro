'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { AnalyticsSidebar } from '@/components/dashboard/AnalyticsSidebar'
import { PortfolioTimeline } from '@/components/dashboard/PortfolioTimeline'
import { ClientPortfolioTimeline } from '@/components/dashboard/ClientPortfolioTimeline'
import type { SerializedProject, SerializedSprint } from '@/components/dashboard/ProjectsCarousel'
import type { Range } from '@/components/dashboard/PortfolioTimeline'
import { RANGE_CFG } from '@/components/dashboard/PortfolioTimeline'
import { cn } from '@/lib/utils'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { ThemeSwitcher } from '@/components/dashboard/ThemeSwitcher'

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

// ─── Sprint status config ─────────────────────────────────────────────────────

const SPRINT_STATUS_CFG: Record<string, { label: string; badge: string; bar: string; daysColor: string }> = {
  'in-progress': {
    label: 'In Progress',
    badge: 'text-[#67e8f9] bg-[#67e8f9]/[0.08] border-[#67e8f9]/20',
    bar: 'bg-[#67e8f9]/70',
    daysColor: 'text-white/30',
  },
  delayed: {
    label: 'Delayed',
    badge: 'text-yellow-400 bg-yellow-400/[0.08] border-yellow-400/20',
    bar: 'bg-yellow-400/70',
    daysColor: 'text-yellow-400',
  },
}

// ─── Sprint Carousel ──────────────────────────────────────────────────────────

function fmtShort(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

function SprintCarousel({ sprints, username }: { sprints: ActiveSprint[]; username: string }) {
  const [idx, setIdx] = useState(0)
  const safeIdx = Math.min(idx, sprints.length - 1)
  const sprint = sprints[safeIdx]

  const prev = () => setIdx(i => Math.max(0, i - 1))
  const next = () => setIdx(i => Math.min(sprints.length - 1, i + 1))

  const cfg = SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG['in-progress']

  const pct = sprint.totalTasksCount > 0
    ? Math.round((sprint.completedTasksCount / sprint.totalTasksCount) * 100)
    : 0

  const daysLeft = Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86_400_000)

  // Touch swipe to cycle through sprints
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (sprints.length <= 1) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx) * 0.85) return // vertical gesture — ignore
    if (Math.abs(dx) < 40) return // too short
    if (dx < 0) next()
    else prev()
  }

  return (
    <div className="space-y-3">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-3 text-[#67e8f9]/40 shrink-0" />
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.3em]">
            Active Sprints
          </p>
          <span className="text-[9px] text-white/20">· {sprints.length} running</span>
        </div>

        {sprints.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.preventDefault(); prev() }}
              disabled={safeIdx === 0}
              className="flex items-center justify-center size-6 rounded-md border border-white/[0.08] text-white/30 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-[10px] text-white/25 tabular-nums w-9 text-center">
              {safeIdx + 1} / {sprints.length}
            </span>
            <button
              onClick={e => { e.preventDefault(); next() }}
              disabled={safeIdx === sprints.length - 1}
              className="flex items-center justify-center size-6 rounded-md border border-white/[0.08] text-white/30 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Sprint card with swipe gesture */}
      <div
        data-h-scroll
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Link
          href={`/u/${username}/projects/${sprint.projectId}/sprints/${sprint.id}`}
          className="block rounded-xl border border-white/[0.10] bg-[#0a0a0a] overflow-hidden hover:border-white/[0.18] hover:bg-[#0d0d0d] transition-all duration-150 group"
        >
          <div className="p-5 sm:p-6">

            {/* Status + days remaining + open link */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className={`text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {cfg.label}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] font-medium ${
                  daysLeft < 0 ? 'text-red-400' : daysLeft <= 3 ? 'text-amber-400' : cfg.daysColor
                }`}>
                  {daysLeft < 0
                    ? `${Math.abs(daysLeft)}d overdue`
                    : daysLeft === 0 ? 'Due today'
                    : daysLeft === 1 ? 'Due tomorrow'
                    : `${daysLeft}d left`}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-white/20 group-hover:text-white/50 transition-colors">
                  Open <ArrowRight className="size-2.5" />
                </span>
              </div>
            </div>

            {/* Sprint name */}
            <h3 className="text-lg sm:text-xl font-bold text-white leading-snug mb-1">
              {sprint.name}
            </h3>

            {/* Project name + date range */}
            <p className="text-[11px] text-white/25 mb-4">
              {sprint.projectName}
              <span className="mx-1.5 text-white/10">·</span>
              {fmtShort(sprint.startDate)} → {fmtShort(sprint.endDate)}
            </p>

            {/* Goal description */}
            {sprint.goalDescription && (
              <p className="text-xs text-white/35 leading-relaxed line-clamp-2 mb-4">
                {sprint.goalDescription}
              </p>
            )}

            {/* Task progress */}
            {sprint.totalTasksCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.15em] text-white/20 font-semibold">
                    Tasks
                  </span>
                  <span className="text-[10px] text-white/35 tabular-nums">
                    {sprint.completedTasksCount} / {sprint.totalTasksCount}
                    <span className="ml-1.5 text-white/20">· {pct}%</span>
                  </span>
                </div>
                <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Dot navigation strip */}
          {sprints.length > 1 && (
            <div
              className="flex items-center justify-center gap-1.5 px-5 py-3 border-t border-white/[0.04]"
              onClick={e => e.preventDefault()}
            >
              {sprints.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.preventDefault(); setIdx(i) }}
                  className={`rounded-full transition-all duration-200 ${
                    i === safeIdx
                      ? 'size-1.5 bg-[#67e8f9]/70'
                      : 'size-1 bg-white/15 hover:bg-white/35'
                  }`}
                />
              ))}
            </div>
          )}
        </Link>
      </div>

    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  serializedProjects,
}: AdminHomeViewProps) {
  const [range, setRange] = useState<Range>('week')
  const [analyticsOpen, setAnalyticsOpen] = useState(false)

  const now = Date.now()

  const activeProjects = allProjects.filter(
    (p: any) => p.status === 'in-progress' || p.status === 'pending'
  ).length

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
    paidAmount:      orders30d.filter((o: any) => o.status === 'paid').reduce((s: number, o: any) => s + (o.amount || 0), 0),
    pendingAmount:   orders30d.filter((o: any) => o.status === 'pending').reduce((s: number, o: any) => s + (o.amount || 0), 0),
    cancelledAmount: orders30d.filter((o: any) => o.status === 'cancelled').reduce((s: number, o: any) => s + (o.amount || 0), 0),
    paidCount:       orders30d.filter((o: any) => o.status === 'paid').length,
    pendingCount:    orders30d.filter((o: any) => o.status === 'pending').length,
    cancelledCount:  orders30d.filter((o: any) => o.status === 'cancelled').length,
  }

  const projectStatus = {
    active:    allProjects.filter((p: any) => p.status === 'in-progress').length,
    pending:   allProjects.filter((p: any) => p.status === 'pending').length,
    completed: allProjects.filter((p: any) => p.status === 'completed').length,
  }

  const pulseKpis = {
    revenue30d:    orderPipeline.paidAmount,
    orders30d:     orders30d.length,
    activeClients: clientAccounts.filter((ca: any) => ca.accountBalance > 0 || (ca.projects?.length ?? 0) > 0).length,
    activeProjects: projectStatus.active,
  }

  // Derive active sprints (in-progress + delayed) from serialized projects
  const activeSprints: ActiveSprint[] = serializedProjects
    .flatMap(p => p.sprints.map(s => ({ ...s, projectName: p.name })))
    .filter(s => s.status === 'in-progress' || s.status === 'delayed')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20 space-y-6 sm:space-y-10">

        {/* ── GREETING + REVENUE CHART ─────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 sm:gap-8 py-4 sm:py-8">

          {/* Left: greeting */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold gradient-text uppercase tracking-[0.25em]">
                {user.role === 'admin' ? 'Admin' : 'Workspace'} · ORCACLUB Spaces
              </p>
              <ThemeSwitcher />
            </div>
            <DashboardGreeting
              firstName={user.firstName}
              size="large"
              subtitle={
                user.role === 'admin'
                  ? `Overseeing ${clientAccounts.length} client${clientAccounts.length !== 1 ? 's' : ''} · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
                  : `${clientAccounts.length} assigned client${clientAccounts.length !== 1 ? 's' : ''} · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
              }
            />

            {/* Mobile KPI chips — hidden on lg where the analytics sidebar provides this */}
            <div className="flex flex-wrap gap-2 mt-5 lg:hidden">
              {pulseKpis.revenue30d > 0 && (
                <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1.5">
                  <span className="size-1.5 rounded-full bg-green-400 shrink-0" />
                  <span className="text-xs text-white/60 tabular-nums">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(pulseKpis.revenue30d)}
                    <span className="text-white/30 ml-1">30d</span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1.5">
                <span className="size-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="text-xs text-white/60 tabular-nums">
                  {pulseKpis.activeProjects} active project{pulseKpis.activeProjects !== 1 ? 's' : ''}
                </span>
              </div>
              {pulseKpis.activeClients > 0 && (
                <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1.5">
                  <span className="size-1.5 rounded-full bg-violet-400 shrink-0" />
                  <span className="text-xs text-white/60 tabular-nums">
                    {pulseKpis.activeClients} client{pulseKpis.activeClients !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <button
                onClick={() => setAnalyticsOpen(true)}
                className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.18] rounded-full px-3 py-1.5 transition-colors"
              >
                <span className="text-xs text-white/40 hover:text-white/60">Analytics →</span>
              </button>
            </div>
          </div>

          {/* Right: revenue chart — hidden on mobile, shown on lg */}
          <div className="hidden lg:block lg:w-auto lg:shrink-0" style={{ maxWidth: 420 }}>
            <RevenueChart
              allOrders={allOrders}
              range={range}
              onInfo={() => setAnalyticsOpen(true)}
            />
          </div>

        </div>

        {/* ── ACTIVE SPRINTS CAROUSEL ──────────────────────────────────────── */}
        {activeSprints.length > 0 && (
          <SprintCarousel sprints={activeSprints} username={username} />
        )}

        {/* ── TIMELINES ─────────────────────────────────────────────────────── */}
        {(serializedProjects.length > 0 || clientAccounts.length > 0) && (
          <div className="space-y-8">

            {/* Shared header: title + range picker */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.3em]">
                  Schedule
                </p>
                <p className="text-[9px] text-white/20 mt-0.5 hidden sm:block">Swipe to browse</p>
              </div>
              <div className="flex items-center p-1 bg-white/[0.04] rounded-lg border border-white/[0.08]">
                {(['week', 'month', 'year'] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      'px-3 sm:px-4 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150',
                      range === r ? 'bg-white/[0.12] text-white shadow-sm' : 'text-white/40 hover:text-white/65',
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

          </div>
        )}

      </div>

      {/* ── ANALYTICS SIDEBAR (floating) ────────────────────────────────────── */}
      <AnalyticsSidebar
        weeklyRevenue={weeklyRevenue}
        orderPipeline={orderPipeline}
        projectStatus={projectStatus}
        kpis={pulseKpis}
        allOrders={allOrders}
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
      />
    </>
  )
}
