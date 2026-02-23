'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { CheckCircle2, Circle, Calendar, Flag, Zap, Pencil, ArrowRight, Building2, Settings } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Project, Sprint, Task } from '@/types/payload-types'
import { formatDate, getDaysUntil } from '@/lib/utils/dateUtils'
import { cn } from '@/lib/utils'
import { CreateMilestoneSheet } from './CreateMilestoneSheet'
import { CreateSprintSheet } from './CreateSprintSheet'
import { MilestoneEditSheet } from './MilestoneEditSheet'
import { ProjectSettingsModal } from './ProjectSettingsModal'

// ── Timeline layout constants (px from top of inner track div) ──────────────
const LABEL_Y    = 2    // milestone title label top
const ICON_Y     = 62   // milestone icon top
const ICON_SIZE  = 20   // icon w/h
const STEM_TOP   = ICON_Y + ICON_SIZE   // = 82
const TRACK_Y    = 120  // progress bar top
const TRACK_H    = 3
const SPRINT_TOP = TRACK_Y + TRACK_H + 4  // = 127
const SPRINT_H   = 52
const TICK_Y     = SPRINT_TOP + SPRINT_H + 10  // = 189
const INNER_H    = TICK_Y + 28                  // = 217

// px per day (governs how wide the timeline is)
const PX_PER_DAY = 10

interface HomeTabProps {
  project: Project
  sprints: Sprint[]
  tasks: Task[]
  readOnly?: boolean
  username?: string
}

interface EditState {
  index: number
  milestone: { title: string; date: string; description?: string | null; completed?: boolean | null }
}

const PROJECT_STATUS = {
  pending:       { label: 'Planned',   dot: 'bg-gray-500',          text: 'text-gray-400'          },
  'in-progress': { label: 'Active',    dot: 'bg-intelligence-cyan', text: 'text-intelligence-cyan' },
  'on-hold':     { label: 'On Hold',   dot: 'bg-orange-400',        text: 'text-orange-400'        },
  completed:     { label: 'Completed', dot: 'bg-green-400',         text: 'text-green-400'         },
  cancelled:     { label: 'Cancelled', dot: 'bg-red-400',           text: 'text-red-400'           },
} as const

const SPRINT_CFG = {
  pending:       { label: 'Planned',  dot: 'bg-gray-500',          bg: 'bg-white/[0.03]',            border: 'border-white/[0.08]',              text: 'text-gray-500'          },
  'in-progress': { label: 'Active',   dot: 'bg-intelligence-cyan', bg: 'bg-intelligence-cyan/[0.07]', border: 'border-intelligence-cyan/[0.18]',  text: 'text-intelligence-cyan' },
  delayed:       { label: 'Delayed',  dot: 'bg-orange-400',        bg: 'bg-orange-400/[0.07]',        border: 'border-orange-400/[0.18]',         text: 'text-orange-400'        },
  finished:      { label: 'Finished', dot: 'bg-green-400',         bg: 'bg-green-400/[0.06]',         border: 'border-green-400/[0.15]',          text: 'text-green-400'         },
} as const

function getSprintCfg(s: string | null | undefined) {
  return SPRINT_CFG[(s as keyof typeof SPRINT_CFG)] ?? SPRINT_CFG.pending
}

function fmtMonth(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', ...(d.getMonth() === 0 ? { year: '2-digit' } : {}) })
}

export function HomeTab({ project, sprints, tasks, readOnly, username }: HomeTabProps) {
  // Extract client — populated at depth:2, may be string (id only) or full object
  const clientRaw = project.client
  const client = clientRaw && typeof clientRaw !== 'string'
    ? { id: (clientRaw as any).id as string, name: (clientRaw as any).name as string }
    : null
  const scrollRef = useRef<HTMLDivElement>(null)

  const [settingsOpen, setSettingsOpen]             = useState(false)
  const [milestoneSheetOpen, setMilestoneSheetOpen] = useState(false)
  const [sprintSheetOpen, setSprintSheetOpen]       = useState(false)
  const [editState, setEditState]                   = useState<EditState | null>(null)
  const [hoveredMilestone, setHoveredMilestone]     = useState<number | null>(null)
  const [hoveredSprint, setHoveredSprint]           = useState<string | null>(null)
  const [clickedSprint, setClickedSprint]           = useState<string | null>(null)

  const statusCfg = PROJECT_STATUS[(project.status as keyof typeof PROJECT_STATUS)] ?? PROJECT_STATUS.pending
  const daysLeft  = getDaysUntil(project.projectedEndDate)

  const milestones = useMemo(
    () => [...(project.milestones || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [project.milestones],
  )
  const nextMilestoneIdx = milestones.findIndex((m) => !m.completed)

  // ── Timeline math ──────────────────────────────────────────────────────────
  // No projected end date = ongoing project
  const isOngoing = !project.projectedEndDate
  const hasTimeline = !!project.startDate || isOngoing

  const tlStart = hasTimeline
    ? (project.startDate ? new Date(project.startDate).getTime() : Date.now())
    : 0

  // For ongoing: extend only to cover future sprints/milestones + a small 14d buffer.
  // This keeps today near the right edge so the filled history is prominent.
  const tlEnd = (() => {
    if (!hasTimeline) return 0
    if (!isOngoing)   return new Date(project.projectedEndDate!).getTime()
    let end = Date.now() // today is the minimum
    sprints.forEach((s) => { if (s.endDate) end = Math.max(end, new Date(s.endDate).getTime()) })
    ;(project.milestones || []).forEach((m) => { if (m.date) end = Math.max(end, new Date(m.date).getTime()) })
    return end + 14 * 86_400_000 // 14d breathing room beyond the furthest item
  })()

  const tlDur   = tlEnd - tlStart
  const totalDays = Math.round(tlDur / 86_400_000)
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

  // Scroll to today on mount
  useEffect(() => {
    const el = scrollRef.current
    if (!el || todayPx <= 0) return
    el.scrollLeft = Math.max(0, todayPx - el.clientWidth * 0.35)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close clicked sprint tooltip when clicking outside
  useEffect(() => {
    if (!clickedSprint) return
    const handler = () => setClickedSprint(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [clickedSprint])

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

  // Sprint bands
  const sprintBands = useMemo(() => {
    if (!hasTimeline || tlDur <= 0) return []
    return sprints.filter((s) => s.startDate && s.endDate).map((s) => {
      const leftPx  = toPx(s.startDate)
      const rightPx = toPx(s.endDate)
      return { ...s, leftPx, widthPx: Math.max(4, rightPx - leftPx), cfg: getSprintCfg(s.status) }
    })
  }, [sprints, hasTimeline]) // eslint-disable-line react-hooks/exhaustive-deps

  // Current sprints: in-progress / delayed, or date range contains today
  const currentSprints = useMemo(() => {
    const now = Date.now()
    return sprints.filter((s) => {
      if (s.status === 'in-progress' || s.status === 'delayed') return true
      if (s.startDate && s.endDate) {
        return new Date(s.startDate).getTime() <= now && now <= new Date(s.endDate).getTime()
      }
      return false
    })
  }, [sprints])

  return (
    <div className="space-y-8 fluid-enter">

      {/* ── Project header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={cn('size-2 rounded-full', statusCfg.dot)} />
            <span className={cn('text-sm font-medium', statusCfg.text)}>{statusCfg.label}</span>
            {isOngoing && (
              <>
                <span className="text-gray-700">·</span>
                <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-intelligence-cyan/60 border border-intelligence-cyan/20 px-2 py-0.5 rounded-full">
                  Ongoing
                </span>
              </>
            )}
            {daysLeft !== null && !isOngoing && (
              <>
                <span className="text-gray-700">·</span>
                <span className={cn('text-sm', daysLeft < 0 ? 'text-red-400' : daysLeft < 14 ? 'text-orange-400' : 'text-gray-400')}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft} days remaining`}
                </span>
              </>
            )}

            {/* Client chip — staff only */}
            {!readOnly && client && username && (
              <>
                <span className="text-gray-700">·</span>
                <Link
                  href={`/u/${username}/clients/${client.id}`}
                  className="flex items-center gap-1.5 text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.18] rounded-full px-3 py-1 transition-all duration-150 group"
                >
                  <Building2 className="size-3 text-cyan-400/50 group-hover:text-cyan-400 transition-colors shrink-0" />
                  <span className="text-white/55 group-hover:text-white/85 font-medium transition-colors">
                    {client.name}
                  </span>
                </Link>
              </>
            )}
          </div>
          <h1 className="text-6xl font-bold tracking-tight gradient-text leading-none">{project.name}</h1>
          {project.description && (
            <p className="text-gray-400 max-w-2xl leading-relaxed">{project.description}</p>
          )}
        </div>

        {/* Edit button — staff only */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 flex items-center gap-1.5 text-xs text-white/45 hover:text-white/75 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.18] rounded-lg px-3.5 py-2.5 transition-all duration-150 mt-1"
          >
            <Settings className="size-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Project settings modal — staff only */}
      {!readOnly && (
        <ProjectSettingsModal
          project={project}
          tasks={tasks}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          username={username}
        />
      )}

      <div className="h-px bg-white/[0.06]" />

      {/* ── Timeline label ────────────────────────────────────────────────── */}
      <p className="text-xs tracking-[0.3em] uppercase text-gray-600 font-medium">Timeline</p>

      {/* ── No dates state ────────────────────────────────────────────────── */}
      {!hasTimeline ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
          <Calendar className="size-10 text-gray-700 mb-4" />
          <p className="text-white font-semibold">No timeline configured</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">Set a start and projected end date, or mark the project as ongoing.</p>
        </div>
      ) : (

        /* ── Scrollable timeline card ─────────────────────────────────────── */
        <div className="relative rounded-xl border border-white/[0.08] bg-[#080808] overflow-hidden">

          {/* Ambient glow */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-intelligence-cyan/15 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-40 bg-intelligence-cyan/[0.02] blur-3xl pointer-events-none" />

          {/* Corner geometry */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none"
            className="absolute top-0 right-0 opacity-[0.04] pointer-events-none select-none" aria-hidden="true">
            <path d="M80 0 L80 80 L0 80" stroke="white" strokeWidth="1" />
            <path d="M80 24 L80 80 L24 80" stroke="white" strokeWidth="0.5" />
          </svg>

          {/* Card header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 font-medium">Project Track</p>
              {sprintBands.length > 0 && (
                <span className="text-[10px] text-gray-700">{sprintBands.length} sprint{sprintBands.length > 1 ? 's' : ''}</span>
              )}
              {milestones.length > 0 && (
                <span className="text-[10px] text-gray-700">{milestones.length} milestone{milestones.length > 1 ? 's' : ''}</span>
              )}
            </div>
            {todayPx > 0 && todayPx < timelineWidth && (
              <button
                onClick={() => {
                  const el = scrollRef.current
                  if (!el) return
                  el.scrollTo({ left: Math.max(0, todayPx - el.clientWidth * 0.35), behavior: 'smooth' })
                }}
                className="text-[10px] tracking-wide text-intelligence-cyan/50 hover:text-intelligence-cyan transition-colors flex items-center gap-1"
              >
                <ArrowRight className="size-3" />Jump to today
              </button>
            )}
          </div>

          {/* Scroll wrapper with edge fade */}
          <div className="relative">
            {/* Left fade */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#080808] to-transparent z-30 pointer-events-none" />
            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#080808] to-transparent z-30 pointer-events-none" />

            <div
              ref={scrollRef}
              className="overflow-x-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
            >
              {/* Inner track canvas */}
              <div
                className="relative select-none"
                style={{ width: timelineWidth, height: INNER_H, minWidth: '100%' }}
              >

                {/* ── Sprint bands ─────────────────────────────────────────── */}
                {sprintBands.map((sprint) => {
                  const isHov     = hoveredSprint === sprint.id
                  const isClicked = clickedSprint === sprint.id
                  const showInfo  = isHov || isClicked
                  return (
                    <div
                      key={sprint.id}
                      className="absolute transition-all duration-200 cursor-pointer"
                      style={{ left: sprint.leftPx, top: SPRINT_TOP, width: sprint.widthPx, height: SPRINT_H }}
                      onMouseEnter={() => setHoveredSprint(sprint.id)}
                      onMouseLeave={() => setHoveredSprint(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setClickedSprint(clickedSprint === sprint.id ? null : sprint.id)
                      }}
                    >
                      {/* ORCACLUB logo */}
                      <Image
                        src="/orcaclubpro.png"
                        alt=""
                        width={SPRINT_H - 8}
                        height={SPRINT_H - 8}
                        className="absolute inset-0 m-auto object-contain pointer-events-none"
                        aria-hidden="true"
                      />
                      {/* Sprint name + status dot */}
                      {sprint.widthPx > 54 && (
                        <div className="absolute top-2 left-2.5 right-2 flex items-center gap-1.5">
                          <div className={cn('size-1.5 rounded-full shrink-0', sprint.cfg.dot)} />
                          <span className={cn('text-[10px] font-medium truncate', sprint.cfg.text)}
                            style={{ maxWidth: sprint.widthPx - 28 }}>
                            {sprint.name}
                          </span>
                        </div>
                      )}

                      {/* Tooltip — outside overflow-hidden so it can float above */}
                      {showInfo && (
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none"
                          style={{ minWidth: 210, maxWidth: 280 }}
                        >
                          <div className="animate-in fade-in slide-in-from-bottom-1 duration-150 bg-[#0c0c0c] border border-white/[0.12] rounded-xl overflow-hidden shadow-2xl text-left">
                            {/* Colored top accent */}
                            <div className={cn('h-0.5 w-full', sprint.cfg.dot)} />
                            <div className="px-4 py-3 space-y-1.5">
                              {/* Name + status badge */}
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-white leading-snug truncate">{sprint.name}</p>
                                <span className={cn(
                                  'shrink-0 text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border',
                                  sprint.cfg.text, sprint.cfg.bg, sprint.cfg.border,
                                )}>
                                  {sprint.cfg.label}
                                </span>
                              </div>
                              {/* Date range */}
                              <p className="text-xs text-gray-500">
                                {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                              </p>
                              {/* Goal / description */}
                              {(sprint.goalDescription || sprint.description) && (
                                <p className="text-xs text-gray-400 leading-relaxed border-t border-white/[0.06] pt-2 mt-1">
                                  {sprint.goalDescription || sprint.description}
                                </p>
                              )}
                              {/* Task progress */}
                              {(sprint.totalTasksCount ?? 0) > 0 && (
                                <div className="flex items-center gap-2 border-t border-white/[0.06] pt-2 mt-1">
                                  <div className="flex-1 h-1 rounded-full bg-white/[0.08]">
                                    <div
                                      className={cn('h-full rounded-full transition-all', sprint.cfg.dot)}
                                      style={{ width: `${((sprint.completedTasksCount ?? 0) / (sprint.totalTasksCount ?? 1)) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-gray-600 whitespace-nowrap">
                                    {sprint.completedTasksCount ?? 0}/{sprint.totalTasksCount} tasks
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* ── Track bar ─────────────────────────────────────────────── */}
                <div className="absolute left-0 right-0" style={{ top: TRACK_Y, height: TRACK_H }}>
                  {/* Background: solid for fixed projects, dashed "open future" for ongoing */}
                  {isOngoing ? (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 5px, transparent 5px, transparent 10px)',
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-white/[0.07] rounded-full" />
                  )}
                  {/* History fill: start → today */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-intelligence-cyan to-blue-500 rounded-full timeline-progress"
                    style={{ width: `${(todayPx / timelineWidth) * 100}%` }}
                  />
                </div>

                {/* ── Today indicator ───────────────────────────────────────── */}
                {todayPx > 0 && todayPx < timelineWidth && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{ left: todayPx, top: 0, height: INNER_H, transform: 'translateX(-50%)' }}
                  >
                    {/* Vertical line */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-px"
                      style={{ top: LABEL_Y, height: INNER_H - LABEL_Y, background: 'linear-gradient(to bottom, rgba(103,232,249,0.4), rgba(103,232,249,0.1), transparent)' }}
                    />
                    {/* "TODAY" label */}
                    <p className="absolute left-1/2 -translate-x-1/2 text-[8px] tracking-[0.2em] uppercase text-intelligence-cyan/50 font-medium whitespace-nowrap"
                      style={{ top: LABEL_Y }}>
                      Today
                    </p>
                    {/* Glowing dot on track */}
                    <div className="absolute left-1/2 z-30" style={{ top: TRACK_Y - 4, transform: 'translateX(-50%)' }}>
                      <div className="relative flex items-center justify-center">
                        <div className="absolute size-5 rounded-full bg-intelligence-cyan/20 animate-pulse" />
                        <div className="size-2.5 rounded-full bg-intelligence-cyan shadow-[0_0_10px_rgba(103,232,249,0.85)]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Milestone markers ─────────────────────────────────────── */}
                {milestones.map((m, i) => {
                  const px     = toPx(m.date)
                  const isNext = i === nextMilestoneIdx
                  const isHov  = hoveredMilestone === i

                  return (
                    <div
                      key={m.id || i}
                      className="absolute z-20"
                      style={{ left: px, top: 0, height: INNER_H, transform: 'translateX(-50%)' }}
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
                          m.completed ? 'text-gray-600' : isNext ? 'text-intelligence-cyan' : 'text-gray-500',
                        )}>
                          {m.title}
                        </p>
                        <p className="text-[8px] text-gray-700 mt-0.5">{formatDate(m.date)}</p>
                      </div>

                      {/* Upper whisker (label → icon) */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-px opacity-30"
                        style={{ top: LABEL_Y + 24, height: ICON_Y - (LABEL_Y + 24), background: 'rgba(255,255,255,0.08)' }}
                      />

                      {/* Icon — click to edit */}
                      <button
                        onClick={() => !readOnly && setEditState({ index: i, milestone: m })}
                        className={cn(
                          'absolute left-1/2 -translate-x-1/2 transition-all duration-200',
                          !readOnly && 'hover:scale-110 active:scale-95 cursor-pointer',
                          readOnly && 'cursor-default',
                        )}
                        style={{ top: ICON_Y }}
                        title={readOnly ? m.title : `${m.title} — click to edit`}
                      >
                        {m.completed ? (
                          <CheckCircle2
                            className="text-green-400"
                            style={{ width: ICON_SIZE, height: ICON_SIZE, filter: 'drop-shadow(0 0 5px rgba(74,222,128,0.55))' }}
                          />
                        ) : isNext ? (
                          <div
                            className="rounded-full border-2 border-intelligence-cyan bg-[#080808] flex items-center justify-center"
                            style={{ width: ICON_SIZE, height: ICON_SIZE }}
                          >
                            <div className="size-1.5 rounded-full bg-intelligence-cyan animate-pulse" />
                          </div>
                        ) : (
                          <Circle
                            className="text-gray-700 group-hover:text-gray-500 transition-colors"
                            style={{ width: ICON_SIZE, height: ICON_SIZE }}
                          />
                        )}
                      </button>

                      {/* Stem (icon → track) */}
                      <div
                        className={cn('absolute left-1/2 -translate-x-1/2 w-px')}
                        style={{
                          top: STEM_TOP,
                          height: TRACK_Y - STEM_TOP,
                          background: m.completed
                            ? 'linear-gradient(to bottom, rgba(74,222,128,0.3), rgba(74,222,128,0.05))'
                            : isNext
                              ? 'linear-gradient(to bottom, rgba(103,232,249,0.3), rgba(103,232,249,0.05))'
                              : 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                        }}
                      />

                      {/* Edit hover overlay (staff only) */}
                      {isHov && !readOnly && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 animate-in fade-in duration-150 z-50"
                          style={{ top: ICON_Y - 34 }}
                        >
                          <div className="bg-black/95 border border-white/[0.12] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-xl whitespace-nowrap">
                            <Pencil className="size-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400">Edit</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* ── Month tick marks ──────────────────────────────────────── */}
                {monthTicks.map((tick) => (
                  <div
                    key={tick.px}
                    className="absolute pointer-events-none"
                    style={{ left: tick.px, top: TICK_Y }}
                  >
                    <div className="w-px h-3 bg-white/[0.08] mx-auto" />
                    <p className="text-[8px] text-gray-700 text-center mt-1 whitespace-nowrap -translate-x-1/2">
                      {tick.label}
                    </p>
                  </div>
                ))}

                {/* Start / End date labels */}
                <div className="absolute text-[9px] text-gray-700 pointer-events-none" style={{ left: 6, top: TICK_Y + 16 }}>
                  {project.startDate ? formatDate(project.startDate) : 'Today'}
                </div>
                <div className="absolute text-[9px] text-gray-700 pointer-events-none text-right" style={{ right: 0, top: TICK_Y + 16 }}>
                  {isOngoing ? '∞ Rolling' : formatDate(project.projectedEndDate)}
                </div>

              </div>
            </div>
          </div>

          {/* Legend strip */}
          <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5 px-6 py-4 border-t border-white/[0.05]">
            <div className="flex items-center gap-2">
              <div className="h-[3px] w-6 rounded-full bg-gradient-to-r from-intelligence-cyan to-blue-500" />
              <span className="text-[10px] text-gray-600">Elapsed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-intelligence-cyan shadow-[0_0_4px_rgba(103,232,249,0.6)]" />
              <span className="text-[10px] text-gray-600">Today</span>
            </div>
            {milestones.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3 text-green-400" />
                  <span className="text-[10px] text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="size-3 text-gray-600" />
                  <span className="text-[10px] text-gray-600">Milestone</span>
                </div>
              </>
            )}
            {sprintBands.length > 0 && (
              <div className="flex items-center gap-2">
                <Image src="/orcaclubpro.png" alt="" width={12} height={12} className="opacity-40" />
                <span className="text-[10px] text-gray-600">Sprint</span>
              </div>
            )}
            {milestones.length > 0 && !readOnly && (
              <span className="text-[10px] text-gray-700 ml-auto hidden sm:block">Click milestone to edit</span>
            )}
          </div>

        </div>
      )}

      {/* ── Active Sprints ────────────────────────────────────────────────── */}
      {currentSprints.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 font-medium">Active Sprints</p>
          <div className="space-y-3">
            {currentSprints.map((sprint) => {
              const cfg = getSprintCfg(sprint.status)
              const sprintTasks = tasks.filter((t) => {
                if (!t.sprint) return false
                const sid = typeof t.sprint === 'string' ? t.sprint : (t.sprint as any).id
                return sid === sprint.id
              })
              const completedCount = sprint.completedTasksCount ?? 0
              const totalCount = sprint.totalTasksCount ?? sprintTasks.length
              const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
              const daysLeft = getDaysUntil(sprint.endDate)

              return (
                <div key={sprint.id} className={cn('rounded-xl border p-5 space-y-4', cfg.bg, cfg.border)}>
                  {/* Sprint header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={cn('size-1.5 rounded-full shrink-0', cfg.dot)} />
                        <span className={cn('text-[10px] font-semibold tracking-wider uppercase', cfg.text)}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-white leading-snug">{sprint.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">
                        {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                      </p>
                      {daysLeft !== null && (
                        <p className={cn(
                          'text-xs mt-0.5 tabular-nums',
                          daysLeft < 0 ? 'text-red-400' : daysLeft < 7 ? 'text-orange-400' : 'text-gray-600',
                        )}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Goal description */}
                  {(sprint.goalDescription || sprint.description) && (
                    <p className="text-sm text-gray-400 leading-relaxed -mt-1">
                      {sprint.goalDescription || sprint.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  {totalCount > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-600 tracking-wide">Progress</span>
                        <span className="text-[10px] text-gray-500">{completedCount}/{totalCount} tasks</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', cfg.dot)}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Task list */}
                  {sprintTasks.length > 0 && (
                    <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
                      {sprintTasks.slice(0, 6).map((task) => {
                        const ts = task.status as string
                        const dot =
                          ts === 'completed' ? 'bg-green-400' :
                          ts === 'in-progress' ? 'bg-blue-400' :
                          ts === 'cancelled' ? 'bg-red-400/60' : 'bg-gray-600'
                        return (
                          <div key={task.id} className="flex items-center gap-2.5">
                            <div className={cn('size-1.5 rounded-full shrink-0', dot)} />
                            <span className={cn(
                              'text-xs flex-1 min-w-0 truncate',
                              ts === 'completed' ? 'text-gray-600 line-through decoration-gray-700' : 'text-gray-400',
                            )}>
                              {task.title}
                            </span>
                            {task.dueDate && (
                              <span className="text-[10px] text-gray-700 shrink-0 tabular-nums">
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                      {sprintTasks.length > 6 && (
                        <p className="text-[10px] text-gray-600 pl-4">+{sprintTasks.length - 6} more</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Milestone list ────────────────────────────────────────────────── */}
      {milestones.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 font-medium mb-5">Milestones</p>
          <div className="space-y-0">
            {milestones.map((m, i) => {
              const isNext = i === nextMilestoneIdx
              const isLast = i === milestones.length - 1

              return (
                <div key={m.id || i} className="flex gap-4">
                  {/* Left: icon + connector */}
                  <div className="flex flex-col items-center shrink-0 w-5">
                    <div className="relative z-10 mt-0.5">
                      {m.completed ? (
                        <CheckCircle2
                          className="size-5 text-green-400"
                          style={{ filter: 'drop-shadow(0 0 4px rgba(74,222,128,0.4))' }}
                        />
                      ) : isNext ? (
                        <div className="size-5 rounded-full border-2 border-intelligence-cyan/60 bg-[#080808] flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-intelligence-cyan animate-pulse" />
                        </div>
                      ) : (
                        <Circle className="size-5 text-white/[0.12]" />
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 mt-2 bg-gradient-to-b from-white/[0.07] to-white/[0.03]" style={{ minHeight: 24 }} />
                    )}
                  </div>

                  {/* Right: content */}
                  <div className={cn('flex-1 min-w-0', !isLast ? 'pb-6' : 'pb-0')}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'text-sm font-medium leading-snug',
                          m.completed ? 'text-gray-500 line-through decoration-gray-700' : isNext ? 'text-white' : 'text-gray-400',
                        )}>
                          {m.title}
                        </p>
                        {m.description && (
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{m.description}</p>
                        )}
                        {isNext && (
                          <p className="text-[10px] tracking-[0.2em] uppercase text-intelligence-cyan/50 mt-1.5">Next up</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn('text-xs tabular-nums', m.completed ? 'text-gray-700' : isNext ? 'text-intelligence-cyan/70' : 'text-gray-600')}>
                          {formatDate(m.date)}
                        </span>
                        {!readOnly && (
                          <button
                            onClick={() => setEditState({ index: i, milestone: m })}
                            className="p-1 rounded-md text-gray-700 hover:text-gray-300 hover:bg-white/[0.05] transition-colors"
                            title="Edit milestone"
                          >
                            <Pencil className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty milestone prompt */}
      {milestones.length === 0 && !readOnly && hasTimeline && (
        <button
          onClick={() => setMilestoneSheetOpen(true)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-400 transition-colors group"
        >
          <div className="size-5 rounded-full border border-dashed border-white/[0.12] group-hover:border-white/20 transition-colors flex items-center justify-center">
            <Flag className="size-2.5 text-gray-700 group-hover:text-gray-500" />
          </div>
          Add a milestone to track project progress
        </button>
      )}

      {/* ── Sheets ───────────────────────────────────────────────────────── */}
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
          <MilestoneEditSheet
            projectId={project.id}
            milestoneIndex={editState?.index ?? null}
            milestone={editState?.milestone ?? null}
            open={editState !== null}
            onOpenChange={(open) => { if (!open) setEditState(null) }}
          />
        </>
      )}
    </div>
  )
}
