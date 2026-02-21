'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, CheckCircle2, Zap } from 'lucide-react'
import { TimeframePicker } from './TimeframePicker'

// ─── Types ────────────────────────────────────────────────────────────────────

export type HeroRevenueData = {
  windowRevenue: number
  windowChange: number
  windowOrderCount: number
  windowPendingCount: number
  windowStartLabel: string
  timeframe: string
  timeframeLabel: string
  compLabel: string
  username: string
  activeProjects: number
}

export type HeroProjectData = {
  total: number
  active: number      // in-progress
  pending: number
  completed: number
  onHold: number
  cancelled: number
  totalMilestones: number
  completedMilestones: number
  tasksCompleted: number
  sprintsCompleted: number
}

interface HeroTabCardProps {
  revenue: HeroRevenueData
  projects: HeroProjectData
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const DELAY = ['', 'delay-75', 'delay-150', 'delay-200'] as const

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroTabCard({ revenue, projects }: HeroTabCardProps) {
  const [tab, setTab] = useState<'revenue' | 'projects'>('projects')

  const milestonePercent =
    projects.totalMilestones > 0
      ? Math.round((projects.completedMilestones / projects.totalMilestones) * 100)
      : 0

  const statuses = [
    { label: 'In Progress', count: projects.active,    color: 'bg-intelligence-cyan', text: 'text-intelligence-cyan' },
    { label: 'Pending',     count: projects.pending,   color: 'bg-gray-500',           text: 'text-gray-400' },
    { label: 'Completed',   count: projects.completed, color: 'bg-blue-400',           text: 'text-blue-400' },
    { label: 'On Hold',     count: projects.onHold,    color: 'bg-yellow-400',         text: 'text-yellow-400' },
  ].filter(s => s.count > 0)

  const maxCount = Math.max(...statuses.map(s => s.count), 1)

  const healthLabel =
    projects.active > 0 && projects.onHold === 0
      ? 'All on track'
      : projects.onHold > 0
        ? `${projects.onHold} on hold`
        : projects.pending > 0
          ? `${projects.pending} queued`
          : 'No active projects'

  const healthColor =
    projects.active > 0 && projects.onHold === 0
      ? 'text-green-400'
      : projects.onHold > 0
        ? 'text-yellow-400'
        : 'text-gray-500'

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-cyan-400/20
                 bg-gradient-to-br from-[#06181d] via-[#091c22] to-[#060c0e]
                 p-6 sm:p-8 flex flex-col min-h-[230px] sm:min-h-[260px]"
    >
      {/* Glows */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-intelligence-cyan/[0.15] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-cyan-900/25 blur-2xl pointer-events-none" />
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(103,232,249,1) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 gap-4">

        {/* ── Tab switcher ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 bg-black/30 border border-white/[0.1] rounded-lg p-0.5">
            {(['projects', 'revenue'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  tab === t
                    ? 'bg-intelligence-cyan text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                {t === 'projects' ? 'Projects' : 'Revenue'}
              </button>
            ))}
          </div>

          {tab === 'revenue' && (
            <div className="animate-in fade-in duration-200">
              <TimeframePicker active={revenue.timeframe} basePath={`/u/${revenue.username}`} />
            </div>
          )}
        </div>

        {/* ── Projects tab ── */}
        {tab === 'projects' && (
          <div key="projects" className="flex-1 flex flex-col gap-4 animate-in fade-in duration-200">

            {/* Big active count */}
            <div className="flex items-end gap-3 animate-in fade-in zoom-in-95 duration-300">
              <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-intelligence-cyan tracking-tight tabular-nums
                            [text-shadow:0_0_40px_rgba(103,232,249,0.25)]">
                {projects.active}
              </p>
              <div className="pb-1.5">
                <p className="text-xs text-gray-400 font-medium leading-none mb-1">active</p>
                <p className={`text-[10px] font-semibold ${healthColor}`}>{healthLabel}</p>
              </div>
            </div>

            {/* Status breakdown with staggered entry */}
            {statuses.length > 0 && (
              <div className="space-y-2.5 flex-1">
                {statuses.map((s, i) => (
                  <div
                    key={s.label}
                    className={`flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-300 ${DELAY[Math.min(i, 3)]}`}
                    style={{ animationFillMode: 'both' }}
                  >
                    <span className="text-[9px] text-gray-600 uppercase tracking-wider w-[76px] shrink-0">
                      {s.label}
                    </span>
                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.max((s.count / maxCount) * 100, 6)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums w-5 text-right shrink-0 ${s.text}`}>
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer: total · tasks done · sprints · milestone % */}
            <div
              className="flex items-center gap-4 sm:gap-6 pt-4 border-t border-white/[0.07] animate-in fade-in duration-500 delay-200"
              style={{ animationFillMode: 'both' }}
            >
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Total</p>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums mt-0.5">{projects.total}</p>
              </div>

              {projects.tasksCompleted > 0 && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-green-400 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Tasks</p>
                    <p className="text-lg sm:text-xl font-bold text-white tabular-nums mt-0.5">{projects.tasksCompleted}</p>
                  </div>
                </div>
              )}

              {projects.sprintsCompleted > 0 && (
                <div className="flex items-center gap-1.5">
                  <Zap className="size-3 text-intelligence-cyan shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Sprints</p>
                    <p className="text-lg sm:text-xl font-bold text-white tabular-nums mt-0.5">{projects.sprintsCompleted}</p>
                  </div>
                </div>
              )}

              {projects.totalMilestones > 0 && (
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Progress</p>
                  <p className="text-lg sm:text-xl font-bold text-intelligence-cyan tabular-nums mt-0.5">
                    {milestonePercent}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Revenue tab ── */}
        {tab === 'revenue' && (
          <div key="revenue" className="flex-1 flex flex-col gap-4 animate-in fade-in duration-200">

            <div className="flex-1">
              <p className="text-[9px] text-gray-600 tracking-wider animate-in fade-in duration-300">
                {revenue.windowStartLabel} – Today · {revenue.timeframeLabel}
              </p>

              <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-intelligence-cyan tracking-tight tabular-nums mt-2
                            [text-shadow:0_0_40px_rgba(103,232,249,0.25)]
                            animate-in fade-in zoom-in-95 duration-300">
                {fmt(revenue.windowRevenue)}
              </p>

              <div className="flex items-center gap-2 mt-3 animate-in fade-in duration-400 delay-75" style={{ animationFillMode: 'both' }}>
                {revenue.windowChange > 0 ? (
                  <>
                    <div className="flex items-center gap-1 bg-green-400/10 border border-green-400/20 rounded-full px-2.5 py-0.5">
                      <TrendingUp className="size-3 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">+{revenue.windowChange.toFixed(0)}%</span>
                    </div>
                    <span className="text-xs text-gray-600">{revenue.compLabel}</span>
                  </>
                ) : revenue.windowChange < 0 ? (
                  <>
                    <div className="flex items-center gap-1 bg-red-400/10 border border-red-400/20 rounded-full px-2.5 py-0.5">
                      <TrendingDown className="size-3 text-red-400" />
                      <span className="text-xs text-red-400 font-medium">{revenue.windowChange.toFixed(0)}%</span>
                    </div>
                    <span className="text-xs text-gray-600">{revenue.compLabel}</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 bg-white/[0.05] border border-white/[0.08] rounded-full px-2.5 py-0.5">
                      <Minus className="size-3 text-gray-500" />
                      <span className="text-xs text-gray-500 font-medium">—</span>
                    </div>
                    <span className="text-xs text-gray-600">no prior data</span>
                  </>
                )}
              </div>
            </div>

            {/* Revenue footer */}
            <div
              className="flex items-center gap-5 sm:gap-8 pt-4 border-t border-white/[0.07] animate-in fade-in duration-500 delay-150"
              style={{ animationFillMode: 'both' }}
            >
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Orders</p>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums mt-0.5">{revenue.windowOrderCount}</p>
              </div>
              {revenue.windowPendingCount > 0 && (
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Pending</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-400 tabular-nums mt-0.5">{revenue.windowPendingCount}</p>
                </div>
              )}
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Active Projects</p>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums mt-0.5">{revenue.activeProjects}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
