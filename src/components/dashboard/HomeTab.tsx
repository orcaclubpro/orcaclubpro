'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, Circle, Calendar, Flag, Zap } from 'lucide-react'
import type { Project, Sprint, Task } from '@/types/payload-types'
import { formatDate, getDaysUntil } from '@/lib/utils/dateUtils'
import { cn } from '@/lib/utils'
import { CreateMilestoneSheet } from './CreateMilestoneSheet'
import { CreateSprintSheet } from './CreateSprintSheet'

interface HomeTabProps {
  project: Project
  sprints: Sprint[]
  tasks: Task[]
  readOnly?: boolean
}

const PROJECT_STATUS = {
  pending:       { label: 'Planned',   dot: 'bg-gray-500',          text: 'text-gray-400'          },
  'in-progress': { label: 'Active',    dot: 'bg-intelligence-cyan', text: 'text-intelligence-cyan' },
  'on-hold':     { label: 'On Hold',   dot: 'bg-orange-400',        text: 'text-orange-400'        },
  completed:     { label: 'Completed', dot: 'bg-green-400',         text: 'text-green-400'         },
  cancelled:     { label: 'Cancelled', dot: 'bg-red-400',           text: 'text-red-400'           },
} as const

const SPRINT_CFG = {
  pending:       { label: 'Planned',   dot: 'bg-gray-500',          band: 'bg-white/[0.04] border-white/[0.06]',                    text: 'text-gray-400'          },
  'in-progress': { label: 'Active',    dot: 'bg-intelligence-cyan', band: 'bg-intelligence-cyan/[0.1] border-intelligence-cyan/20',  text: 'text-intelligence-cyan' },
  delayed:       { label: 'Delayed',   dot: 'bg-orange-400',        band: 'bg-orange-400/[0.1] border-orange-400/20',               text: 'text-orange-400'        },
  finished:      { label: 'Finished',  dot: 'bg-green-400',         band: 'bg-green-400/[0.08] border-green-400/[0.15]',            text: 'text-green-400'         },
} as const

function getSprintCfg(status: string | null | undefined) {
  return SPRINT_CFG[(status as keyof typeof SPRINT_CFG)] ?? SPRINT_CFG.pending
}

export function HomeTab({ project, sprints, tasks, readOnly }: HomeTabProps) {
  const [hoveredMilestone, setHoveredMilestone]     = useState<number | null>(null)
  const [pinnedMilestone, setPinnedMilestone]       = useState<number | null>(null)
  const [hoveredSprint, setHoveredSprint]           = useState<string | null>(null)
  const [milestoneSheetOpen, setMilestoneSheetOpen] = useState(false)
  const [sprintSheetOpen, setSprintSheetOpen]       = useState(false)

  // Active milestone: pinned takes priority over hovered
  const activeMilestoneIdx = pinnedMilestone ?? hoveredMilestone

  const statusCfg  = PROJECT_STATUS[(project.status as keyof typeof PROJECT_STATUS)] ?? PROJECT_STATUS.pending
  const daysLeft   = getDaysUntil(project.projectedEndDate)

  const milestones = useMemo(
    () => [...(project.milestones || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [project.milestones],
  )

  // ── Timeline math ─────────────────────────────────────────────────────────
  const hasTimeline = !!project.startDate && !!project.projectedEndDate
  const tlStart = hasTimeline ? new Date(project.startDate!).getTime() : 0
  const tlEnd   = hasTimeline ? new Date(project.projectedEndDate!).getTime() : 0
  const tlDur   = tlEnd - tlStart

  const toPct = (date: string | null | undefined) => {
    if (!hasTimeline || !date || tlDur <= 0) return 0
    return Math.max(0, Math.min(100, ((new Date(date).getTime() - tlStart) / tlDur) * 100))
  }

  const todayPct = useMemo(() => {
    if (!hasTimeline || tlDur <= 0) return 0
    const now = Date.now()
    if (now <= tlStart) return 0
    if (now >= tlEnd)   return 100
    return ((now - tlStart) / tlDur) * 100
  }, [hasTimeline, tlStart, tlEnd, tlDur])

  const sprintBands = useMemo(() => {
    if (!hasTimeline || tlDur <= 0) return []
    return sprints.filter(s => s.startDate && s.endDate).map(s => {
      const left  = Math.max(0, Math.min(100, ((new Date(s.startDate).getTime() - tlStart) / tlDur) * 100))
      const right = Math.max(0, Math.min(100, ((new Date(s.endDate).getTime()   - tlStart) / tlDur) * 100))
      return { ...s, left, width: Math.max(0.5, right - left), cfg: getSprintCfg(s.status) }
    })
  }, [sprints, hasTimeline, tlStart, tlDur])

  const activeM = activeMilestoneIdx !== null ? milestones[activeMilestoneIdx] : null

  return (
    <div className="space-y-8 fluid-enter">

      {/* ── Project header ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className={cn('size-2 rounded-full', statusCfg.dot)} />
          <span className={cn('text-sm font-medium', statusCfg.text)}>{statusCfg.label}</span>
          {daysLeft !== null && (
            <>
              <span className="text-gray-700">·</span>
              <span className={cn('text-sm', daysLeft < 0 ? 'text-red-400' : daysLeft < 14 ? 'text-orange-400' : 'text-gray-400')}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`}
              </span>
            </>
          )}
        </div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-gray-400 max-w-2xl leading-relaxed">{project.description}</p>
        )}
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* ── Timeline label + quick-create actions ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-[0.3em] uppercase text-gray-600 font-medium">Timeline</p>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMilestoneSheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.04] transition-all duration-150"
            >
              <Flag className="size-3" />
              Milestone
            </button>
            <button
              onClick={() => setSprintSheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.04] transition-all duration-150"
            >
              <Zap className="size-3" />
              Sprint
            </button>
          </div>
        )}
      </div>

      {/* ── No dates state ────────────────────────────────────────────────── */}
      {!hasTimeline ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
          <Calendar className="size-10 text-gray-700 mb-4" />
          <p className="text-white font-semibold">No timeline configured</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            Set a start and projected end date on this project to view the timeline.
          </p>
        </div>
      ) : (

        /* ── Timeline card ──────────────────────────────────────────────── */
        <div className="relative rounded-xl border border-white/[0.08] bg-[#080808] p-8 lg:p-12">

          {/* Ambient bottom glow */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-intelligence-cyan/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-28 bg-intelligence-cyan/[0.03] blur-3xl pointer-events-none" />

          {/* Corner geometry */}
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none"
            className="absolute top-0 right-0 opacity-[0.04] pointer-events-none select-none"
            aria-hidden="true">
            <path d="M72 0 L72 72 L0 72" stroke="white" strokeWidth="1" />
            <path d="M72 22 L72 72 L22 72" stroke="white" strokeWidth="0.5" />
          </svg>

          <div className="relative z-10 space-y-8">

            {/* ── Milestone detail panel ───────────────────────────────────── */}
            <div className={cn(
              'overflow-hidden transition-all duration-300 ease-out',
              activeM ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0',
            )}>
              {activeM && (
                <div className="flex items-start gap-4 bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="mt-0.5 shrink-0">
                    {activeM.completed
                      ? <CheckCircle2 className="size-5 text-green-400" />
                      : <Circle className="size-5 text-gray-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <p className="font-semibold text-white">{activeM.title}</p>
                      <div className="flex items-center gap-1.5 text-sm text-gray-400 shrink-0">
                        <Calendar className="size-3.5" />
                        <span>{formatDate(activeM.date)}</span>
                      </div>
                    </div>
                    {activeM.description && (
                      <p className="text-sm text-gray-400 mt-1 leading-relaxed">{activeM.description}</p>
                    )}
                    {activeM.completed && (
                      <p className="text-sm text-green-400 font-medium mt-1.5">Completed</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Visualization ────────────────────────────────────────────── */}
            {/* pt-8 reserves space for the floating "Today" label above the bar */}
            <div className="relative pt-8">

              {/* Today — vertical rule spanning bar + sprint bands */}
              {todayPct > 0 && todayPct < 100 && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-20"
                  style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }}
                >
                  <p className="text-[9px] tracking-[0.2em] uppercase text-intelligence-cyan/70 font-medium text-center whitespace-nowrap">
                    Today
                  </p>
                  <div className="w-px mx-auto bg-gradient-to-b from-intelligence-cyan/60 via-intelligence-cyan/25 to-transparent" style={{ height: 'calc(100% - 14px)', marginTop: 4 }} />
                </div>
              )}

              {/* ── Main bar ─────────────────────────────────────────────── */}
              <div className="relative h-2.5">
                {/* Track */}
                <div className="absolute inset-0 bg-white/[0.06] rounded-full" />

                {/* Elapsed fill — timeline-progress class triggers the draw animation from globals.css */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-intelligence-cyan to-blue-500 rounded-full timeline-progress"
                  style={{ width: `${todayPct}%` }}
                />

                {/* ── Milestone dots ──────────────────────────────────────── */}
                {milestones.map((m, i) => {
                  const pos = toPct(m.date)
                  const isActive = activeMilestoneIdx === i

                  return (
                    <button
                      key={m.id || i}
                      onMouseEnter={() => setHoveredMilestone(i)}
                      onMouseLeave={() => setHoveredMilestone(null)}
                      onClick={() => setPinnedMilestone(pinnedMilestone === i ? null : i)}
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10',
                        'transition-transform duration-200 ease-out',
                        isActive ? 'scale-[1.7]' : 'scale-100 hover:scale-[1.4]',
                      )}
                      style={{ left: `${pos}%` }}
                    >
                      <div className={cn(
                        'size-4 rounded-full border-2 transition-all duration-200',
                        m.completed
                          ? 'bg-green-400 border-green-200 shadow-[0_0_14px_rgba(74,222,128,0.65)]'
                          : isActive
                            ? 'bg-intelligence-cyan border-intelligence-cyan shadow-[0_0_14px_rgba(103,232,249,0.7)]'
                            : 'bg-[#080808] border-gray-500 hover:border-intelligence-cyan hover:shadow-[0_0_8px_rgba(103,232,249,0.35)]',
                      )} />
                    </button>
                  )
                })}

                {/* Today — glowing dot on bar */}
                {todayPct > 0 && todayPct < 100 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none"
                    style={{ left: `${todayPct}%` }}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="absolute size-6 rounded-full bg-intelligence-cyan/20 animate-pulse" />
                      <div className="size-3.5 rounded-full bg-intelligence-cyan shadow-[0_0_14px_rgba(103,232,249,0.85)]" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Sprint bands ──────────────────────────────────────────── */}
              {sprintBands.length > 0 && (
                <div className="relative h-8 mt-5">
                  {sprintBands.map((sprint) => {
                    const isHov = hoveredSprint === sprint.id
                    return (
                      <div
                        key={sprint.id}
                        className={cn(
                          'absolute top-0 h-full rounded-lg border flex items-center transition-opacity duration-200 overflow-visible',
                          sprint.cfg.band,
                          isHov ? 'opacity-100' : 'opacity-55 hover:opacity-80',
                        )}
                        style={{ left: `${sprint.left}%`, width: `${sprint.width}%`, minWidth: 4 }}
                        onMouseEnter={() => setHoveredSprint(sprint.id)}
                        onMouseLeave={() => setHoveredSprint(null)}
                      >
                        {sprint.width > 7 && (
                          <span className="text-[10px] font-medium text-gray-300 truncate px-2.5">
                            {sprint.name}
                          </span>
                        )}

                        {/* Sprint tooltip */}
                        {isHov && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none">
                            <div className="animate-in fade-in slide-in-from-bottom-1 duration-150 bg-black/95 border border-white/[0.1] rounded-xl px-4 py-3 min-w-[180px] shadow-2xl text-left">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className={cn('size-2 rounded-full shrink-0', sprint.cfg.dot)} />
                                <span className="text-sm font-semibold text-white">{sprint.name}</span>
                              </div>
                              <p className="text-xs text-gray-400">
                                {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                              </p>
                              <p className={cn('text-xs font-medium mt-1', sprint.cfg.text)}>
                                {sprint.cfg.label}
                              </p>
                              {(sprint.totalTasksCount ?? 0) > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {sprint.completedTasksCount ?? 0} / {sprint.totalTasksCount} tasks
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Date labels ──────────────────────────────────────────── */}
              <div className="flex justify-between mt-5 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span>{formatDate(project.startDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span>{formatDate(project.projectedEndDate)}</span>
                </div>
              </div>
            </div>

            {/* ── Legend ───────────────────────────────────────────────────── */}
            <div className="flex items-center flex-wrap gap-x-5 gap-y-2 pt-6 border-t border-white/[0.05]">
              <div className="flex items-center gap-2">
                <div className="h-1 w-7 rounded-full bg-gradient-to-r from-intelligence-cyan to-blue-500" />
                <span className="text-xs text-gray-500">Elapsed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-intelligence-cyan shadow-[0_0_5px_rgba(103,232,249,0.6)]" />
                <span className="text-xs text-gray-500">Today</span>
              </div>
              {milestones.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-500">Completed milestone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-[#080808] border border-gray-500" />
                    <span className="text-xs text-gray-500">Upcoming milestone</span>
                  </div>
                </>
              )}
              {sprintBands.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-white/[0.06] border border-white/10" />
                  <span className="text-xs text-gray-500">Sprint</span>
                </div>
              )}
              {milestones.length > 0 && (
                <span className="text-xs text-gray-600 ml-auto hidden sm:block">
                  Hover to preview · click to pin
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Creation sheets ───────────────────────────────────────────────── */}
      {!readOnly && (
        <>
          <CreateMilestoneSheet
            projectId={project.id}
            open={milestoneSheetOpen}
            onOpenChange={setMilestoneSheetOpen}
          />
          <CreateSprintSheet
            projectId={project.id}
            open={sprintSheetOpen}
            onOpenChange={setSprintSheetOpen}
          />
        </>
      )}
    </div>
  )
}
