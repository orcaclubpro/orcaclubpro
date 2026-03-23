'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Calendar, Flag, Zap, Pencil, ArrowRight, Building2, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Project, Sprint, Task } from '@/types/payload-types'
import { formatDate, getDaysUntil } from '@/lib/utils/dateUtils'
import { cn } from '@/lib/utils'
import { CreateMilestoneModal } from './CreateMilestoneModal'
import { CreateSprintSheet } from './CreateSprintSheet'
import { MilestoneEditSheet } from './MilestoneEditSheet'
import dynamic from 'next/dynamic'
const ProjectSettingsModal = dynamic(
  () => import('./ProjectSettingsModal').then(m => ({ default: m.ProjectSettingsModal })),
  { ssr: false }
)

// ── Timeline layout constants (px from top of inner track div) ──────────────
const LABEL_Y    = 2    // milestone title label top
const ICON_Y     = 62   // milestone icon top
const ICON_SIZE  = 20   // icon w/h
const STEM_TOP   = ICON_Y + ICON_SIZE   // = 82
const TRACK_Y    = 120  // progress bar top
const TRACK_H    = 3
const SPRINT_TOP = TRACK_Y + TRACK_H + 4  // = 127
const SPRINT_H   = 68
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
  'in-progress': { label: 'Active',    dot: 'bg-[var(--space-accent)]', text: 'text-[var(--space-accent)]' },
  'on-hold':     { label: 'On Hold',   dot: 'bg-orange-400',        text: 'text-orange-400'        },
  completed:     { label: 'Completed', dot: 'bg-green-400',         text: 'text-green-400'         },
  cancelled:     { label: 'Cancelled', dot: 'bg-red-400',           text: 'text-red-400'           },
} as const

const SPRINT_CFG = {
  pending:       { label: 'Planned',  dot: 'bg-gray-500',          bg: 'bg-[#2D2D2D]',                       border: 'border-[#404040]',                  text: 'text-gray-500'          },
  'in-progress': { label: 'Active',   dot: 'bg-[var(--space-accent)]', bg: 'bg-[rgba(139,156,182,0.06)]',         border: 'border-[rgba(139,156,182,0.12)]',  text: 'text-[var(--space-accent)]' },
  delayed:       { label: 'Delayed',  dot: 'bg-orange-400',        bg: 'bg-orange-400/[0.07]',                border: 'border-orange-400/[0.18]',         text: 'text-orange-400'        },
  finished:      { label: 'Finished', dot: 'bg-green-400',         bg: 'bg-green-400/[0.06]',                 border: 'border-green-400/[0.15]',          text: 'text-green-400'         },
} as const

function getSprintCfg(s: string | null | undefined) {
  return SPRINT_CFG[(s as keyof typeof SPRINT_CFG)] ?? SPRINT_CFG.pending
}

function fmtMonth(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', ...(d.getMonth() === 0 ? { year: '2-digit' } : {}) })
}

export function HomeTab({ project, sprints, tasks, readOnly, username }: HomeTabProps) {
  const router = useRouter()
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
  const [activeSprintIdx, setActiveSprintIdx]       = useState(0)

  type SprintBandRow = {
    id: string
    name: string
    status: string
    startDate: string | null | undefined
    endDate: string | null | undefined
    goalDescription: string | null | undefined
    description: string | null | undefined
    completedTasksCount: number | null | undefined
    totalTasksCount: number | null | undefined
    leftPx: number
    widthPx: number
    cfg: ReturnType<typeof getSprintCfg>
    row: number
  }
  const [fixedTooltip, setFixedTooltip] = useState<{ sprint: SprintBandRow; x: number; y: number } | null>(null)

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

  // Sprint bands with multi-row layout to prevent horizontal overlap
  const sprintBands = useMemo((): SprintBandRow[] => {
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
        } as SprintBandRow
      })
      .sort((a, b) => a.leftPx - b.leftPx)
    const rowEnds: number[] = []
    raw.forEach((band) => {
      let row = rowEnds.findIndex((end) => end <= band.leftPx)
      if (row === -1) row = rowEnds.length
      rowEnds[row] = band.leftPx + band.widthPx
      band.row = row
    })
    return raw
  }, [sprints, hasTimeline]) // eslint-disable-line react-hooks/exhaustive-deps

  const SPRINT_GAP = 5
  const sprintRowCount = useMemo(
    () => (sprintBands.length === 0 ? 1 : Math.max(...sprintBands.map((b) => b.row + 1))),
    [sprintBands],
  )
  const dynamicTickY  = SPRINT_TOP + sprintRowCount * (SPRINT_H + SPRINT_GAP) + 10
  const dynamicInnerH = dynamicTickY + 28

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
    <div className="space-y-12 fluid-enter">

      {/* ── Project header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={cn('size-2 rounded-full', statusCfg.dot)} />
            <span className={cn('text-base font-semibold', statusCfg.text)}>{statusCfg.label}</span>
            {isOngoing && (
              <>
                <span className="text-[#6B6B6B]">·</span>
                <span className="text-xs tracking-[0.2em] uppercase font-semibold border px-2 py-0.5 rounded-full border-[rgba(139,156,182,0.15)]" style={{ color: 'var(--space-accent)' }}>
                  Ongoing
                </span>
              </>
            )}
            {daysLeft !== null && !isOngoing && (
              <>
                <span className="text-[#6B6B6B]">·</span>
                <span className={cn('text-base font-medium', daysLeft < 0 ? 'text-red-400' : daysLeft < 14 ? 'text-orange-400' : 'text-[#F0F0F0]')}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft} days remaining`}
                </span>
              </>
            )}

            {/* Client chip — staff only */}
            {!readOnly && client && username && (
              <>
                <span className="text-[#6B6B6B]">·</span>
                <Link
                  href={`/u/${username}/clients/${client.id}`}
                  className="flex items-center gap-1.5 text-xs bg-[#2D2D2D] hover:bg-[#E5E1D9] border border-[#404040] hover:border-[#404040] rounded-full px-3 py-1 transition-all duration-150 group"
                >
                  <Building2 className="size-3 text-cyan-500/50 group-hover:text-cyan-600 transition-colors shrink-0" />
                  <span className="text-[#6B6B6B] group-hover:text-[#A0A0A0] font-medium transition-colors">
                    {client.name}
                  </span>
                </Link>
              </>
            )}
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-[#1E3A6E] leading-none">{project.name}</h1>
          {project.description && (
            <p className="text-[#A0A0A0] max-w-2xl leading-relaxed text-base">{project.description}</p>
          )}
        </div>

        {/* Edit button — staff only */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#A0A0A0] bg-[rgba(255,255,255,0.02)] hover:bg-[#2D2D2D] border border-[#404040] hover:border-[#404040] rounded-lg px-3.5 py-2.5 transition-all duration-150 mt-1"
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

      <div className="h-px bg-[#333333]" />

      {/* ── Active Sprints carousel ───────────────────────────────────────── */}
      {currentSprints.length > 0 && (() => {
        const idx = Math.min(activeSprintIdx, currentSprints.length - 1)
        const sprint = currentSprints[idx]
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
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <p className="text-sm tracking-[0.2em] uppercase text-[#F0F0F0] font-bold">Active Sprints</p>
              {currentSprints.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B6B6B] tabular-nums">{idx + 1} / {currentSprints.length}</span>
                  <button
                    type="button"
                    onClick={() => setActiveSprintIdx((i) => Math.max(0, i - 1))}
                    disabled={idx === 0}
                    className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSprintIdx((i) => Math.min(currentSprints.length - 1, i + 1))}
                    disabled={idx === currentSprints.length - 1}
                    className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Sprint card */}
            <Link
              href={username ? `/u/${username}/projects/${project.id}/sprints/${sprint.id}` : '#'}
              className={cn(
                'group block rounded-xl border p-7 space-y-5',
                'transition-all duration-200',
                'hover:-translate-y-px hover:shadow-lg hover:shadow-[#000000]/[0.30] hover:border-[#404040]',
                cfg.bg, cfg.border,
              )}
            >
              {/* Sprint header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn('size-1.5 rounded-full shrink-0', cfg.dot)} />
                    <span className={cn('text-sm font-semibold tracking-wider uppercase', cfg.text)}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-[#F0F0F0] leading-snug">{sprint.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-[#A0A0A0]">
                    {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                  </p>
                  {daysLeft !== null && (
                    <p className={cn(
                      'text-xs mt-0.5 tabular-nums',
                      daysLeft < 0 ? 'text-red-400' : daysLeft < 7 ? 'text-orange-400' : 'text-[#A0A0A0]',
                    )}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </p>
                  )}
                </div>
              </div>

              {/* Goal / description */}
              {(sprint.goalDescription || sprint.description) && (
                <p className="text-sm text-[#A0A0A0] leading-relaxed -mt-1">
                  {sprint.goalDescription || sprint.description}
                </p>
              )}

              {/* Progress bar */}
              {totalCount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A0A0A0] tracking-wide">Progress</span>
                    <span className="text-sm text-[#F0F0F0] font-medium">{completedCount}/{totalCount} tasks</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#333333]">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', cfg.dot)}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Task list */}
              {sprintTasks.length > 0 && (
                <div className="space-y-1.5 border-t border-[#404040] pt-3">
                  {sprintTasks.slice(0, 6).map((task) => {
                    const ts = task.status as string
                    const dot =
                      ts === 'completed' ? 'bg-green-400' :
                      ts === 'in-progress' ? 'bg-blue-400' :
                      ts === 'cancelled' ? 'bg-red-400/60' : 'bg-gray-400'
                    return (
                      <div key={task.id} className="flex items-center gap-2.5">
                        <div className={cn('size-1.5 rounded-full shrink-0', dot)} />
                        <span className={cn(
                          'text-sm flex-1 min-w-0 truncate',
                          ts === 'completed' ? 'text-[#4A4A4A] line-through decoration-[#555555]' : 'text-[#F0F0F0]',
                        )}>
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span className="text-sm text-[#6B6B6B] shrink-0 tabular-nums">
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {sprintTasks.length > 6 && (
                    <p className="text-sm text-[#6B6B6B] pl-4">+{sprintTasks.length - 6} more</p>
                  )}
                </div>
              )}

              {/* Clickable hint */}
              <div className="flex justify-end pt-1 border-t border-[#404040] -mb-1">
                <span className="flex items-center gap-1 text-xs text-[#4A4A4A] group-hover:text-[#6B6B6B] transition-colors duration-200">
                  View sprint <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>

            {/* Dot indicators */}
            {currentSprints.length > 1 && (
              <div className="flex justify-center gap-2 pt-1">
                {currentSprints.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSprintIdx(i)}
                    className={cn(
                      'rounded-full transition-all duration-200',
                      i === idx
                        ? 'size-2 bg-[var(--space-accent)]'
                        : 'size-1.5 bg-[#555555] hover:bg-[#555555]',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Timeline label ────────────────────────────────────────────────── */}
      <p className="text-sm tracking-[0.2em] uppercase text-[#F0F0F0] font-bold">Timeline</p>

      {/* ── No dates state ────────────────────────────────────────────────── */}
      {!hasTimeline ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-[#404040] bg-[rgba(255,255,255,0.02)] text-center">
          <Calendar className="size-10 text-[#4A4A4A] mb-4" />
          <p className="text-[#F0F0F0] font-semibold">No timeline configured</p>
          <p className="text-sm text-[#A0A0A0] mt-1 max-w-xs">Set a start and projected end date, or mark the project as ongoing.</p>
        </div>
      ) : (

        /* ── Scrollable timeline card ─────────────────────────────────────── */
        <div className="relative rounded-xl border border-[#404040] bg-[#1C1C1C]">

          {/* Ambient glow */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1E3A6E]/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-40 bg-[rgba(255,255,255,0.01)] blur-3xl pointer-events-none" />

          {/* Corner geometry */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none"
            className="absolute top-0 right-0 opacity-[0.04] pointer-events-none select-none" aria-hidden="true">
            <path d="M80 0 L80 80 L0 80" stroke="#333333" strokeWidth="1" />
            <path d="M80 24 L80 80 L24 80" stroke="#333333" strokeWidth="0.5" />
          </svg>

          {/* Card header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#404040]">
            <div className="flex items-center gap-3">
              <p className="text-sm tracking-[0.2em] uppercase text-[#F0F0F0] font-bold">Project Track</p>
              {sprintBands.length > 0 && (
                <span className="text-sm text-[#A0A0A0]">{sprintBands.length} sprint{sprintBands.length > 1 ? 's' : ''}</span>
              )}
              {milestones.length > 0 && (
                <span className="text-sm text-[#A0A0A0]">{milestones.length} milestone{milestones.length > 1 ? 's' : ''}</span>
              )}
            </div>
            {todayPx > 0 && todayPx < timelineWidth && (
              <button
                onClick={() => {
                  const el = scrollRef.current
                  if (!el) return
                  el.scrollTo({ left: Math.max(0, todayPx - el.clientWidth * 0.35), behavior: 'smooth' })
                }}
                className="text-xs tracking-wide hover:text-[#A0A0A0] transition-colors flex items-center gap-1"
                style={{ color: 'var(--space-accent)' }}
              >
                <ArrowRight className="size-3" />Jump to today
              </button>
            )}
          </div>

          {/* Scroll wrapper */}
          <div className="relative">

            <div
              ref={scrollRef}
              data-h-scroll
              className="overflow-x-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}
            >
              {/* Inner track canvas */}
              <div
                className="relative select-none"
                style={{ width: timelineWidth, height: dynamicInnerH, minWidth: '100%' }}
              >

                {/* ── Sprint bands ─────────────────────────────────────────── */}
                {sprintBands.map((sprint) => {
                  const sprintTop = SPRINT_TOP + sprint.row * (SPRINT_H + SPRINT_GAP)
                  return (
                    <Link
                      key={sprint.id}
                      href={username ? `/u/${username}/projects/${project.id}/sprints/${sprint.id}` : '#'}
                      className="absolute transition-all duration-200 cursor-pointer group"
                      style={{ left: sprint.leftPx, top: sprintTop, width: sprint.widthPx, height: SPRINT_H }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setFixedTooltip({ sprint, x: rect.left + rect.width / 2, y: rect.top })
                        setHoveredSprint(sprint.id)
                      }}
                      onMouseLeave={() => {
                        setFixedTooltip(null)
                        setHoveredSprint(null)
                      }}
                    >
                      {/* Background tint matching status */}
                      <div className={cn('absolute inset-0 rounded-sm opacity-30', sprint.cfg.bg)} />
                      {/* ORCACLUB logo — bottom-right, decorative */}
                      <Image
                        src="/orcaclubpro.png"
                        alt=""
                        width={SPRINT_H - 28}
                        height={SPRINT_H - 28}
                        className="absolute right-2 bottom-1.5 object-contain pointer-events-none opacity-15 group-hover:opacity-35 transition-opacity"
                        aria-hidden="true"
                      />
                      {/* Sprint name + description */}
                      {sprint.widthPx > 54 && (
                        <div className="absolute top-2 left-2.5 right-2 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <div className={cn('size-1.5 rounded-full shrink-0', sprint.cfg.dot)} />
                            <span className={cn('text-[10px] font-medium truncate', sprint.cfg.text)}
                              style={{ maxWidth: sprint.widthPx - 28 }}>
                              {sprint.name}
                            </span>
                          </div>
                          {(sprint.goalDescription || sprint.description) && sprint.widthPx > 100 && (
                            <p className="text-[9px] text-[#6B6B6B] truncate leading-tight pl-3"
                              style={{ maxWidth: sprint.widthPx - 36 }}>
                              {sprint.goalDescription || sprint.description}
                            </p>
                          )}
                          {sprint.widthPx > 120 && (
                            <p className="text-[9px] text-[#4A4A4A] truncate leading-tight pl-3"
                              style={{ maxWidth: sprint.widthPx - 36 }}>
                              {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                            </p>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}

                {/* ── Track bar ─────────────────────────────────────────────── */}
                <div className="absolute left-0 right-0" style={{ top: TRACK_Y, height: TRACK_H }}>
                  {/* Background: solid for fixed projects, dashed "open future" for ongoing */}
                  {isOngoing ? (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 5px, transparent 5px, transparent 10px)',
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#555555] rounded-full" />
                  )}
                  {/* History fill: start → today */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1E3A6E] to-blue-500 rounded-full timeline-progress"
                    style={{ width: `${(todayPx / timelineWidth) * 100}%` }}
                  />
                </div>

                {/* ── Today indicator ───────────────────────────────────────── */}
                {todayPx > 0 && todayPx < timelineWidth && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{ left: todayPx, top: 0, height: dynamicInnerH, transform: 'translateX(-50%)' }}
                  >
                    {/* Vertical line */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-px"
                      style={{ top: LABEL_Y, height: INNER_H - LABEL_Y, background: 'linear-gradient(to bottom, rgba(139,156,182,0.22), rgba(139,156,182,0.10), transparent)' }}
                    />
                    {/* "TODAY" label */}
                    <p className="absolute left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] uppercase font-medium whitespace-nowrap"
                      style={{ top: LABEL_Y, color: 'var(--space-accent)' }}>
                      Today
                    </p>
                    {/* Glowing dot on track */}
                    <div className="absolute left-1/2 z-30" style={{ top: TRACK_Y - 4, transform: 'translateX(-50%)' }}>
                      <div className="relative flex items-center justify-center">
                        <div className="absolute size-5 rounded-full bg-[rgba(139,156,182,0.10)] animate-pulse" />
                        <div className="size-2.5 rounded-full bg-[#1E3A6E] shadow-[0_0_10px_rgba(139,156,182,0.30)]" />
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
                          'text-xs font-medium truncate leading-tight',
                          m.completed ? 'text-[#4A4A4A]' : isNext ? 'text-[#F0F0F0]' : 'text-[#A0A0A0]',
                        )}
                          style={isNext ? { color: 'var(--space-accent)' } : undefined}
                        >
                          {m.title}
                        </p>
                        <p className="text-xs text-[#6B6B6B] mt-0.5">{formatDate(m.date)}</p>
                      </div>

                      {/* Upper whisker (label → icon) */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-px opacity-30"
                        style={{ top: LABEL_Y + 24, height: ICON_Y - (LABEL_Y + 24), background: 'rgba(255,255,255,0.06)' }}
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
                            className="rounded-full border-2 bg-[#1C1C1C] flex items-center justify-center"
                            style={{ width: ICON_SIZE, height: ICON_SIZE, borderColor: 'var(--space-accent)' }}
                          >
                            <div className="size-1.5 rounded-full animate-pulse" style={{ background: 'var(--space-accent)' }} />
                          </div>
                        ) : (
                          <Circle
                            className="text-[#4A4A4A] group-hover:text-[#4A4A4A] transition-colors"
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
                              ? 'linear-gradient(to bottom, rgba(139,156,182,0.20), rgba(139,156,182,0.04))'
                              : 'linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        }}
                      />

                      {/* Edit hover overlay (staff only) */}
                      {isHov && !readOnly && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 animate-in fade-in duration-150 z-50"
                          style={{ top: ICON_Y - 34 }}
                        >
                          <div className="bg-[#1C1C1C] border border-[#404040] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-xl whitespace-nowrap">
                            <Pencil className="size-3 text-[#6B6B6B]" />
                            <span className="text-[10px] text-[#6B6B6B]">Edit</span>
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
                    style={{ left: tick.px, top: dynamicTickY }}
                  >
                    <div className="w-px h-3 bg-[#555555] mx-auto" />
                    <p className="text-xs text-[#6B6B6B] text-center mt-1 whitespace-nowrap -translate-x-1/2">
                      {tick.label}
                    </p>
                  </div>
                ))}

                {/* Start / End date labels */}
                <div className="absolute text-xs text-[#6B6B6B] pointer-events-none" style={{ left: 6, top: dynamicTickY + 16 }}>
                  {project.startDate ? formatDate(project.startDate) : 'Today'}
                </div>
                <div className="absolute text-xs text-[#6B6B6B] pointer-events-none text-right" style={{ right: 0, top: dynamicTickY + 16 }}>
                  {isOngoing ? '∞ Rolling' : formatDate(project.projectedEndDate)}
                </div>

              </div>
            </div>
          </div>

          {/* Legend strip */}
          <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5 px-6 py-4 border-t border-[#404040]">
            <div className="flex items-center gap-2">
              <div className="h-[3px] w-6 rounded-full bg-gradient-to-r from-[#1E3A6E] to-blue-500" />
              <span className="text-sm text-[#A0A0A0]">Elapsed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#1E3A6E] shadow-[0_0_4px_rgba(139,156,182,0.25)]" />
              <span className="text-sm text-[#A0A0A0]">Today</span>
            </div>
            {milestones.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3 text-green-400" />
                  <span className="text-sm text-[#A0A0A0]">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="size-3 text-[#4A4A4A]" />
                  <span className="text-sm text-[#A0A0A0]">Milestone</span>
                </div>
              </>
            )}
            {sprintBands.length > 0 && (
              <div className="flex items-center gap-2">
                <Image src="/orcaclubpro.png" alt="" width={12} height={12} className="opacity-50" />
                <span className="text-sm text-[#A0A0A0]">Sprint</span>
              </div>
            )}
            {milestones.length > 0 && !readOnly && (
              <span className="text-sm text-[#6B6B6B] ml-auto hidden sm:block">Click milestone to edit</span>
            )}
          </div>

        </div>
      )}

      {/* ── Milestone list ────────────────────────────────────────────────── */}
      {milestones.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm tracking-[0.2em] uppercase text-[#F0F0F0] font-bold mb-6">Milestones</p>
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
                        <div className="size-5 rounded-full border-2 bg-[#1C1C1C] flex items-center justify-center" style={{ borderColor: 'var(--space-accent)' }}>
                          <div className="size-1.5 rounded-full animate-pulse" style={{ background: 'var(--space-accent)' }} />
                        </div>
                      ) : (
                        <Circle className="size-5 text-[#4A4A4A]" />
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 mt-2 bg-gradient-to-b from-[#333333] to-[#222222]" style={{ minHeight: 24 }} />
                    )}
                  </div>

                  {/* Right: content */}
                  <div className={cn('flex-1 min-w-0', !isLast ? 'pb-6' : 'pb-0')}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'text-base font-semibold leading-snug',
                          m.completed ? 'text-[#4A4A4A] line-through decoration-[#555555]' : isNext ? 'text-[#F0F0F0]' : 'text-[#A0A0A0]',
                        )}>
                          {m.title}
                        </p>
                        {m.description && (
                          <p className="text-sm text-[#A0A0A0] mt-0.5 leading-relaxed">{m.description}</p>
                        )}
                        {isNext && (
                          <p className="text-xs tracking-[0.2em] uppercase mt-1.5" style={{ color: 'var(--space-accent)' }}>Next up</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn('text-xs tabular-nums', m.completed ? 'text-[#4A4A4A]' : isNext ? 'text-[#A0A0A0]' : 'text-[#6B6B6B]')}
                          style={isNext ? { color: 'var(--space-accent)' } : undefined}
                        >
                          {formatDate(m.date)}
                        </span>
                        {!readOnly && (
                          <button
                            onClick={() => setEditState({ index: i, milestone: m })}
                            className="p-1 rounded-md text-[#4A4A4A] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors"
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
          className="flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#A0A0A0] transition-colors group"
        >
          <div className="size-5 rounded-full border border-dashed border-[#404040] group-hover:border-[#404040] transition-colors flex items-center justify-center">
            <Flag className="size-2.5 text-[#4A4A4A] group-hover:text-[#6B6B6B]" />
          </div>
          Add a milestone to track project progress
        </button>
      )}

      {/* ── Fixed-position sprint tooltip ─────────────────────────────── */}
      {fixedTooltip && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: fixedTooltip.x,
            top: fixedTooltip.y,
            transform: 'translate(-50%, calc(-100% - 10px))',
          }}
        >
          <div
            className="animate-in fade-in slide-in-from-bottom-1 duration-150 bg-[#1C1C1C] border border-[#404040] rounded-xl overflow-hidden shadow-2xl text-left"
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
                <p className="text-sm text-[#A0A0A0] leading-relaxed border-t border-[#404040] pt-2 mt-1">
                  {fixedTooltip.sprint.goalDescription || fixedTooltip.sprint.description}
                </p>
              )}
              {(fixedTooltip.sprint.totalTasksCount ?? 0) > 0 && (
                <div className="flex items-center gap-2 border-t border-[#404040] pt-2 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-[#333333]">
                    <div
                      className={cn('h-full rounded-full transition-all', fixedTooltip.sprint.cfg.dot)}
                      style={{ width: `${((fixedTooltip.sprint.completedTasksCount ?? 0) / (fixedTooltip.sprint.totalTasksCount ?? 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-[#A0A0A0] whitespace-nowrap">
                    {fixedTooltip.sprint.completedTasksCount ?? 0}/{fixedTooltip.sprint.totalTasksCount} tasks
                  </span>
                </div>
              )}
              {username && (
                <p className="text-[10px] pt-1" style={{ color: 'var(--space-accent)' }}>Click to open sprint →</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sheets ───────────────────────────────────────────────────────── */}
      {!readOnly && (
        <>
          <CreateMilestoneModal
            projectId={project.id}
            open={milestoneSheetOpen}
            onOpenChange={setMilestoneSheetOpen}
            onSuccess={() => { setMilestoneSheetOpen(false); router.refresh() }}
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
