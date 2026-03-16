'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { CheckCircle2, Circle, Calendar, ArrowRight, Flag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { SerializedProject, SerializedTask } from './ProjectsCarousel'
import { formatDate } from '@/lib/utils/dateUtils'
import { cn } from '@/lib/utils'

// ── Timeline layout constants ────────────────────────────────────────────────
const LABEL_Y    = 2
const ICON_Y     = 62
const ICON_SIZE  = 20
const STEM_TOP   = ICON_Y + ICON_SIZE   // = 82
const TRACK_Y    = 120
const TRACK_H    = 3
const SPRINT_TOP  = TRACK_Y + TRACK_H + 4  // = 127
const SPRINT_H    = 52
const SPRINT_GAP  = 5   // vertical gap between sprint rows

const PX_PER_DAY = 10

const TASK_STATUS_CFG = {
  'pending':     { dot: 'bg-gray-500',          glow: '',                                          label: 'Pending'     },
  'in-progress': { dot: 'bg-[var(--space-accent)]',  glow: 'shadow-[0_0_6px_rgba(139,156,182,0.50)]',   label: 'In Progress' },
  'completed':   { dot: 'bg-green-400',          glow: 'shadow-[0_0_6px_rgba(74,222,128,0.5)]',    label: 'Completed'   },
  'cancelled':   { dot: 'bg-red-400/40',         glow: '',                                          label: 'Cancelled'   },
} as const

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
}

const PRIORITY_COLOR: Record<string, string> = {
  low: 'text-gray-500', medium: 'text-blue-400', high: 'text-yellow-400', urgent: 'text-red-400',
}

const SPRINT_CFG = {
  pending:       { label: 'Planned',  dot: 'bg-gray-500',          bg: 'bg-[rgba(255,255,255,0.03)]',            border: 'border-[#404040]',                text: 'text-[#6B6B6B]'                 },
  'in-progress': { label: 'Active',   dot: 'bg-[var(--space-accent)]', bg: 'bg-[rgba(139,156,182,0.06)]', border: 'border-[rgba(139,156,182,0.12)]', text: 'text-[var(--space-accent)]' },
  delayed:       { label: 'Delayed',  dot: 'bg-orange-400',        bg: 'bg-orange-400/[0.07]',        border: 'border-orange-400/[0.18]',        text: 'text-orange-400'        },
  finished:      { label: 'Finished', dot: 'bg-green-400',         bg: 'bg-green-400/[0.06]',         border: 'border-green-400/[0.15]',         text: 'text-green-400'         },
} as const

type SprintCfg = typeof SPRINT_CFG[keyof typeof SPRINT_CFG]

type SprintBand = {
  id: string
  projectId: string
  name: string
  status: 'pending' | 'in-progress' | 'delayed' | 'finished'
  startDate: string
  endDate: string
  description: string | null
  goalDescription: string | null
  completedTasksCount: number
  totalTasksCount: number
  leftPx: number
  widthPx: number
  cfg: SprintCfg
  row: number
}

function getSprintCfg(s: string | null | undefined): SprintCfg {
  return SPRINT_CFG[(s as keyof typeof SPRINT_CFG)] ?? SPRINT_CFG.pending
}

function fmtMonth(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', ...(d.getMonth() === 0 ? { year: '2-digit' } : {}) })
}

export function ProfileTimeline({ project, username }: { project: SerializedProject; username: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null)
  const [fixedTooltip, setFixedTooltip] = useState<{ sprint: SprintBand; x: number; y: number } | null>(null)
  const [taskTooltip, setTaskTooltip] = useState<{ task: SerializedTask; x: number; y: number } | null>(null)

  const sprints = project.sprints
  const datedTasks = useMemo(
    () =>
      (project.tasks ?? [])
        .filter((t) => !!t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()),
    [project.tasks],
  )

  const datedMilestones = useMemo(
    () =>
      [...(project.milestones || [])]
        .filter((m) => m.date)
        .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()),
    [project.milestones],
  )

  const allMilestones = useMemo(
    () =>
      [...(project.milestones || [])].sort((a, b) => {
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }),
    [project.milestones],
  )

  const nextMilestoneIdx = allMilestones.findIndex((m) => !m.completed)

  // ── Timeline math ─────────────────────────────────────────────────────────
  const isOngoing   = !project.endDate
  const hasTimeline = !!project.startDate || isOngoing

  const tlStart = hasTimeline
    ? (project.startDate ? new Date(project.startDate).getTime() : Date.now())
    : 0

  const tlEnd = (() => {
    if (!hasTimeline) return 0
    if (!isOngoing)   return new Date(project.endDate!).getTime()
    let end = Date.now()
    sprints.forEach((s) => { if (s.endDate) end = Math.max(end, new Date(s.endDate).getTime()) })
    project.milestones.forEach((m) => { if (m.date) end = Math.max(end, new Date(m.date).getTime()) })
    return end + 14 * 86_400_000
  })()

  const tlDur        = tlEnd - tlStart
  const totalDays    = Math.round(tlDur / 86_400_000)
  const timelineWidth = Math.max(960, totalDays * PX_PER_DAY)

  const toPx = (date: string | null | undefined) => {
    if (!date || !hasTimeline || tlDur <= 0) return 0
    return Math.max(0, Math.min(timelineWidth, ((new Date(date).getTime() - tlStart) / tlDur) * timelineWidth))
  }

  const todayPx = useMemo(() => {
    if (!hasTimeline || tlDur <= 0) return 0
    const now = Date.now()
    if (now <= tlStart) return 0
    if (now >= tlEnd)   return timelineWidth
    return ((now - tlStart) / tlDur) * timelineWidth
  }, [hasTimeline, tlStart, tlEnd, tlDur, timelineWidth])

  // ── Sprint bands with multi-row layout ────────────────────────────────────
  const sprintBands = useMemo((): SprintBand[] => {
    if (!hasTimeline || tlDur <= 0) return []
    const raw = sprints
      .filter((s) => s.startDate && s.endDate)
      .map((s) => {
        const leftPx  = toPx(s.startDate)
        const rightPx = toPx(s.endDate)
        return {
          ...s,
          leftPx,
          widthPx: Math.max(4, rightPx - leftPx),
          cfg: getSprintCfg(s.status),
          row: 0,
        } as SprintBand
      })
      .sort((a, b) => a.leftPx - b.leftPx)

    // Greedy row assignment — prevents horizontal overlap
    const rowEnds: number[] = []
    raw.forEach((band) => {
      let row = rowEnds.findIndex((end) => end <= band.leftPx)
      if (row === -1) row = rowEnds.length
      rowEnds[row] = band.leftPx + band.widthPx
      band.row = row
    })
    return raw
  }, [sprints, hasTimeline, tlDur, timelineWidth]) // eslint-disable-line react-hooks/exhaustive-deps

  const sprintRowCount = useMemo(
    () => (sprintBands.length === 0 ? 1 : Math.max(...sprintBands.map((b) => b.row + 1))),
    [sprintBands],
  )

  // Dynamic heights based on actual number of sprint rows
  const dynamicTickY  = SPRINT_TOP + sprintRowCount * (SPRINT_H + SPRINT_GAP) + 6
  const dynamicInnerH = dynamicTickY + 28

  // Scroll to today on mount
  useEffect(() => {
    const el = scrollRef.current
    if (!el || todayPx <= 0) return
    el.scrollLeft = Math.max(0, todayPx - el.clientWidth * 0.35)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Month tick marks
  const monthTicks = useMemo(() => {
    if (!hasTimeline) return []
    const ticks: { label: string; px: number }[] = []
    const cursor = new Date(new Date(tlStart).getFullYear(), new Date(tlStart).getMonth() + 1, 1)
    const end    = new Date(tlEnd)
    while (cursor < end) {
      ticks.push({ label: fmtMonth(new Date(cursor)), px: toPx(cursor.toISOString()) })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return ticks
  }, [hasTimeline, tlStart, tlEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">

      {/* ── No timeline state ──────────────────────────────────────────────── */}
      {!hasTimeline ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-[#404040] bg-[rgba(255,255,255,0.03)] text-center">
          <Calendar className="size-8 text-[#6B6B6B] mb-4" />
          <p className="text-sm text-[#A0A0A0] font-semibold">No timeline configured</p>
          <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs">
            Set a start and projected end date on this project to see the full timeline.
          </p>
        </div>
      ) : (

        /* ── Scrollable timeline card ────────────────────────────────────── */
        <div className="relative rounded-xl border border-[#404040] bg-[#252525]">

          {/* Ambient glow */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(139,156,182,0.10)] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-40 bg-[var(--space-accent)]/[0.02] blur-3xl pointer-events-none" />

          {/* Corner geometry */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none"
            className="absolute top-0 right-0 opacity-[0.04] pointer-events-none select-none" aria-hidden="true">
            <path d="M80 0 L80 80 L0 80" stroke="#333333" strokeWidth="1" />
            <path d="M80 24 L80 80 L24 80" stroke="#333333" strokeWidth="0.5" />
          </svg>

          {/* Card header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#404040]">
            <div className="flex items-center gap-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B6B6B] font-medium">Project Track</p>
              {sprintBands.length > 0 && (
                <span className="text-[10px] text-[#6B6B6B]">
                  {sprintBands.length} sprint{sprintBands.length > 1 ? 's' : ''}
                </span>
              )}
              {datedMilestones.length > 0 && (
                <span className="text-[10px] text-[#6B6B6B]">
                  {datedMilestones.length} milestone{datedMilestones.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {todayPx > 0 && todayPx < timelineWidth && (
              <button
                onClick={() => {
                  const el = scrollRef.current
                  if (!el) return
                  el.scrollTo({ left: Math.max(0, todayPx - el.clientWidth * 0.35), behavior: 'smooth' })
                }}
                className="text-[10px] tracking-wide text-[var(--space-accent)]/50 hover:text-[var(--space-accent)] transition-colors flex items-center gap-1"
              >
                <ArrowRight className="size-3" />Jump to today
              </button>
            )}
          </div>

          {/* Scroll wrapper — overflow-x clips canvas; no overflow-hidden on card so tooltips escape */}
          <div className="relative overflow-x-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FFFFFF] to-transparent z-30 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FFFFFF] to-transparent z-30 pointer-events-none" />

            <div
              ref={scrollRef}
              className="overflow-x-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
            >
              {/* Inner track canvas */}
              <div
                className="relative select-none overflow-visible"
                style={{ width: timelineWidth, height: dynamicInnerH, minWidth: '100%' }}
              >

                {/* ── Sprint bands ─────────────────────────────────────────── */}
                {sprintBands.map((sprint) => {
                  const sprintTop = SPRINT_TOP + sprint.row * (SPRINT_H + SPRINT_GAP)
                  return (
                    <Link
                      key={sprint.id}
                      href={`/u/${username}/projects/${sprint.projectId}/sprints/${sprint.id}`}
                      className="absolute transition-all duration-200 cursor-pointer group"
                      style={{ left: sprint.leftPx, top: sprintTop, width: sprint.widthPx, height: SPRINT_H }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setFixedTooltip({ sprint, x: rect.left + rect.width / 2, y: rect.top })
                      }}
                      onMouseLeave={() => setFixedTooltip(null)}
                    >
                      {/* Background tint matching status */}
                      <div className={cn('absolute inset-0 rounded-sm opacity-30', sprint.cfg.bg)} />

                      {/* ORCACLUB logo */}
                      <Image
                        src="/orcaclubpro.png"
                        alt=""
                        width={SPRINT_H - 8}
                        height={SPRINT_H - 8}
                        className="absolute inset-0 m-auto object-contain pointer-events-none group-hover:opacity-80 transition-opacity"
                        aria-hidden="true"
                      />

                      {/* Sprint name + status dot */}
                      {sprint.widthPx > 54 && (
                        <div className="absolute top-2 left-2.5 right-2 flex items-center gap-1.5">
                          <div className={cn('size-1.5 rounded-full shrink-0', sprint.cfg.dot)} />
                          <span
                            className={cn('text-[10px] font-medium truncate', sprint.cfg.text)}
                            style={{ maxWidth: sprint.widthPx - 28 }}
                          >
                            {sprint.name}
                          </span>
                        </div>
                      )}
                    </Link>
                  )
                })}

                {/* ── Track bar ─────────────────────────────────────────────── */}
                <div className="absolute left-0 right-0" style={{ top: TRACK_Y, height: TRACK_H }}>
                  {isOngoing ? (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 5px, transparent 5px, transparent 10px)',
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[rgba(255,255,255,0.06)] rounded-full" />
                  )}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1E3A6E] to-[#2B4A8A] rounded-full timeline-progress"
                    style={{ width: `${(todayPx / timelineWidth) * 100}%` }}
                  />
                </div>

                {/* ── Task due-date markers ─────────────────────────────────── */}
                {datedTasks.map((task) => {
                  const px = toPx(task.dueDate)
                  const cfg = TASK_STATUS_CFG[task.status] ?? TASK_STATUS_CFG.pending
                  return (
                    <div
                      key={task.id}
                      className="absolute z-10"
                      style={{ left: px, top: TRACK_Y - 3, transform: 'translateX(-50%)' }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTaskTooltip({ task, x: rect.left + rect.width / 2, y: rect.top })
                      }}
                      onMouseLeave={() => setTaskTooltip(null)}
                    >
                      <div
                        className={cn(
                          'size-2 rounded-full cursor-pointer transition-transform duration-150 hover:scale-150',
                          cfg.dot, cfg.glow,
                          task.status === 'in-progress' && 'animate-pulse',
                        )}
                      />
                    </div>
                  )
                })}

                {/* ── Today indicator ───────────────────────────────────────── */}
                {todayPx > 0 && todayPx < timelineWidth && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{ left: todayPx, top: 0, height: dynamicInnerH, transform: 'translateX(-50%)' }}
                  >
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-px"
                      style={{ top: LABEL_Y, height: dynamicInnerH - LABEL_Y, background: 'linear-gradient(to bottom, rgba(139,156,182,0.25), rgba(139,156,182,0.08), transparent)' }}
                    />
                    <p className="absolute left-1/2 -translate-x-1/2 text-[8px] tracking-[0.2em] uppercase text-[var(--space-accent)]/50 font-medium whitespace-nowrap"
                      style={{ top: LABEL_Y }}>
                      Today
                    </p>
                    <div className="absolute left-1/2 z-30" style={{ top: TRACK_Y - 4, transform: 'translateX(-50%)' }}>
                      <div className="relative flex items-center justify-center">
                        <div className="absolute size-5 rounded-full bg-[var(--space-accent)]/20 animate-pulse" />
                        <div className="size-2.5 rounded-full bg-[var(--space-accent)] shadow-[0_0_10px_rgba(139,156,182,0.45)]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Milestone markers ─────────────────────────────────────── */}
                {datedMilestones.map((m, i) => {
                  const px     = toPx(m.date)
                  const allIdx = allMilestones.findIndex((am) => am.id === m.id)
                  const isNext = allIdx === nextMilestoneIdx
                  const isHov  = hoveredMilestone === i

                  return (
                    <div
                      key={m.id || i}
                      className="absolute z-20"
                      style={{ left: px, top: 0, height: dynamicInnerH, transform: 'translateX(-50%)' }}
                      onMouseEnter={() => setHoveredMilestone(i)}
                      onMouseLeave={() => setHoveredMilestone(null)}
                    >
                      {/* Title label */}
                      <div
                        className="absolute w-[84px] text-center pointer-events-none transition-opacity duration-200"
                        style={{ top: LABEL_Y, left: '50%', transform: 'translateX(-50%)', opacity: isHov ? 1 : 0.55 }}
                      >
                        <p className={cn(
                          'text-[9px] font-medium truncate leading-tight',
                          m.completed ? 'text-[#6B6B6B]' : isNext ? 'text-[var(--space-accent)]' : 'text-[#6B6B6B]',
                        )}>
                          {m.title}
                        </p>
                        <p className="text-[8px] text-[#6B6B6B] mt-0.5">{formatDate(m.date)}</p>
                      </div>

                      {/* Upper whisker */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-px opacity-30"
                        style={{ top: LABEL_Y + 24, height: ICON_Y - (LABEL_Y + 24), background: 'rgba(255,255,255,0.06)' }}
                      />

                      {/* Icon */}
                      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: ICON_Y }}>
                        {m.completed ? (
                          <CheckCircle2
                            className="text-green-400"
                            style={{ width: ICON_SIZE, height: ICON_SIZE, filter: 'drop-shadow(0 0 5px rgba(74,222,128,0.55))' }}
                          />
                        ) : isNext ? (
                          <div
                            className="rounded-full border-2 border-[var(--space-accent)] bg-[#252525] flex items-center justify-center"
                            style={{ width: ICON_SIZE, height: ICON_SIZE }}
                          >
                            <div className="size-1.5 rounded-full bg-[var(--space-accent)] animate-pulse" />
                          </div>
                        ) : (
                          <Circle
                            className="text-[#6B6B6B]"
                            style={{ width: ICON_SIZE, height: ICON_SIZE }}
                          />
                        )}
                      </div>

                      {/* Stem (icon → track) */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-px"
                        style={{
                          top: STEM_TOP,
                          height: TRACK_Y - STEM_TOP,
                          background: m.completed
                            ? 'linear-gradient(to bottom, rgba(74,222,128,0.3), rgba(74,222,128,0.05))'
                            : isNext
                              ? 'linear-gradient(to bottom, rgba(139,156,182,0.20), rgba(139,156,182,0.04))'
                              : 'linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        }}
                      />
                    </div>
                  )
                })}

                {/* ── Month tick marks ──────────────────────────────────────── */}
                {monthTicks.map((tick) => (
                  <div
                    key={tick.px}
                    className="absolute pointer-events-none"
                    style={{ left: tick.px, top: dynamicTickY }}
                  >
                    <div className="w-px h-3 bg-[#333333] mx-auto" />
                    <p className="text-[8px] text-[#6B6B6B] text-center mt-1 whitespace-nowrap -translate-x-1/2">
                      {tick.label}
                    </p>
                  </div>
                ))}

                {/* Start / End date labels */}
                <div className="absolute text-[9px] text-[#6B6B6B] pointer-events-none" style={{ left: 6, top: dynamicTickY + 16 }}>
                  {project.startDate ? formatDate(project.startDate) : 'Today'}
                </div>
                <div className="absolute text-[9px] text-[#6B6B6B] pointer-events-none text-right" style={{ right: 0, top: dynamicTickY + 16 }}>
                  {isOngoing ? '∞ Rolling' : formatDate(project.endDate)}
                </div>

              </div>
            </div>
          </div>

          {/* Legend strip */}
          <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5 px-6 py-4 border-t border-[#404040]">
            <div className="flex items-center gap-2">
              <div className="h-[3px] w-6 rounded-full bg-gradient-to-r from-[#1E3A6E] to-[#2B4A8A]" />
              <span className="text-[10px] text-[#6B6B6B]">Elapsed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[var(--space-accent)] shadow-[0_0_4px_rgba(139,156,182,0.25)]" />
              <span className="text-[10px] text-[#6B6B6B]">Today</span>
            </div>
            {datedMilestones.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3 text-green-400" />
                  <span className="text-[10px] text-[#6B6B6B]">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="size-3 text-[#6B6B6B]" />
                  <span className="text-[10px] text-[#6B6B6B]">Milestone</span>
                </div>
              </>
            )}
            {datedTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
                <span className="text-[10px] text-[#6B6B6B]">Task (hover for details)</span>
              </div>
            )}
            {sprintBands.length > 0 && (
              <div className="flex items-center gap-2">
                <Image src="/orcaclubpro.png" alt="" width={12} height={12} className="opacity-40" />
                <span className="text-[10px] text-[#6B6B6B]">Sprint (click to open)</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Milestone list ────────────────────────────────────────────────── */}
      {allMilestones.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B6B6B] font-medium mb-5">Milestones</p>
          <div className="space-y-0">
            {allMilestones.map((m, i) => {
              const isNext = i === nextMilestoneIdx
              const isLast = i === allMilestones.length - 1

              return (
                <div key={m.id || i} className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0 w-5">
                    <div className="relative z-10 mt-0.5">
                      {m.completed ? (
                        <CheckCircle2
                          className="size-5 text-green-400"
                          style={{ filter: 'drop-shadow(0 0 4px rgba(74,222,128,0.4))' }}
                        />
                      ) : isNext ? (
                        <div className="size-5 rounded-full border-2 border-[var(--space-accent)]/60 bg-[#252525] flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-[var(--space-accent)] animate-pulse" />
                        </div>
                      ) : (
                        <Circle className="size-5 text-[#555555]" />
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 mt-2 bg-gradient-to-b from-[#333333] to-[#222222]" style={{ minHeight: 24 }} />
                    )}
                  </div>

                  <div className={cn('flex-1 min-w-0', !isLast ? 'pb-6' : 'pb-0')}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'text-sm font-medium leading-snug',
                          m.completed ? 'text-[#6B6B6B] line-through decoration-[#555555]' : isNext ? 'text-[#F0F0F0]' : 'text-[#A0A0A0]',
                        )}>
                          {m.title}
                        </p>
                        {m.description && (
                          <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">{m.description}</p>
                        )}
                        {isNext && (
                          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--space-accent)]/50 mt-1.5">Next up</p>
                        )}
                      </div>
                      {m.date && (
                        <span className={cn('text-xs tabular-nums shrink-0', m.completed ? 'text-[#6B6B6B]' : isNext ? 'text-[var(--space-accent)]/70' : 'text-[#6B6B6B]')}>
                          {formatDate(m.date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {allMilestones.length === 0 && hasTimeline && (
        <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
          <div className="size-5 rounded-full border border-dashed border-[#404040] flex items-center justify-center shrink-0">
            <Flag className="size-2.5" />
          </div>
          No milestones added yet
        </div>
      )}

      {/* ── Fixed-position task tooltip ─────────────────────────────────────── */}
      {taskTooltip && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: taskTooltip.x,
            top: taskTooltip.y,
            transform: 'translate(-50%, calc(-100% - 10px))',
          }}
        >
          <div className="animate-in fade-in slide-in-from-bottom-1 duration-150 bg-[#252525] border border-[#404040] rounded-xl overflow-hidden shadow-2xl text-left"
            style={{ minWidth: 190, maxWidth: 260 }}
          >
            <div className={cn('h-0.5 w-full', TASK_STATUS_CFG[taskTooltip.task.status]?.dot ?? 'bg-gray-500')} />
            <div className="px-4 py-3 space-y-1.5">
              <p className="text-sm font-semibold text-[#F0F0F0] leading-snug">{taskTooltip.task.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border border-[#404040] bg-[rgba(255,255,255,0.03)]',
                  TASK_STATUS_CFG[taskTooltip.task.status]?.dot.replace('bg-', 'text-').replace('/40', '') ?? 'text-[#6B6B6B]',
                )}>
                  {TASK_STATUS_CFG[taskTooltip.task.status]?.label}
                </span>
                {taskTooltip.task.priority && (
                  <span className={cn('text-[9px] font-semibold', PRIORITY_COLOR[taskTooltip.task.priority])}>
                    {PRIORITY_LABEL[taskTooltip.task.priority]}
                  </span>
                )}
              </div>
              {taskTooltip.task.dueDate && (
                <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
                  <Calendar className="size-3 shrink-0" />
                  Due {formatDate(taskTooltip.task.dueDate)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed-position sprint tooltip (escapes scroll container clipping) ── */}
      {fixedTooltip && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: fixedTooltip.x,
            top: fixedTooltip.y,
            transform: 'translate(-50%, calc(-100% - 10px))',
          }}
        >
          <div className="animate-in fade-in slide-in-from-bottom-1 duration-150 bg-[#252525] border border-[#404040] rounded-xl overflow-hidden shadow-2xl text-left"
            style={{ minWidth: 210, maxWidth: 280 }}
          >
            <div className={cn('h-0.5 w-full', fixedTooltip.sprint.cfg.dot)} />
            <div className="px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#F0F0F0] leading-snug truncate">{fixedTooltip.sprint.name}</p>
                <span className={cn(
                  'shrink-0 text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border',
                  fixedTooltip.sprint.cfg.text, fixedTooltip.sprint.cfg.bg, fixedTooltip.sprint.cfg.border,
                )}>
                  {fixedTooltip.sprint.cfg.label}
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B]">
                {formatDate(fixedTooltip.sprint.startDate)} → {formatDate(fixedTooltip.sprint.endDate)}
              </p>
              {(fixedTooltip.sprint.goalDescription || fixedTooltip.sprint.description) && (
                <p className="text-xs text-[#A0A0A0] leading-relaxed border-t border-[#404040] pt-2 mt-1">
                  {fixedTooltip.sprint.goalDescription || fixedTooltip.sprint.description}
                </p>
              )}
              {(fixedTooltip.sprint.totalTasksCount ?? 0) > 0 && (
                <div className="flex items-center gap-2 border-t border-[#404040] pt-2 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div
                      className={cn('h-full rounded-full transition-all', fixedTooltip.sprint.cfg.dot)}
                      style={{ width: `${((fixedTooltip.sprint.completedTasksCount ?? 0) / (fixedTooltip.sprint.totalTasksCount ?? 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#6B6B6B] whitespace-nowrap">
                    {fixedTooltip.sprint.completedTasksCount ?? 0}/{fixedTooltip.sprint.totalTasksCount} tasks
                  </span>
                </div>
              )}
              <p className="text-[10px] text-[var(--space-accent)]/50 pt-1">Click to open sprint →</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
