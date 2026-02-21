'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  FolderOpen,
  Calendar,
  DollarSign,
  CheckCircle2,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateProjectModal } from './CreateProjectModal'
import type { ClientOption } from './CreateProjectModal'

// ─── Exported types ────────────────────────────────────────────────────────────

export type SerializedSprint = {
  id: string
  name: string
  status: 'pending' | 'in-progress' | 'delayed' | 'finished'
  startDate: string
  endDate: string
  description: string | null
  goalDescription: string | null
  completedTasksCount: number
  totalTasksCount: number
  projectId: string
}

export type SerializedProject = {
  id: string
  name: string
  status: string
  description: string | null
  startDate: string | null
  endDate: string | null
  budget: number | null
  currency: string
  updatedAt: string
  milestones: Array<{ id: string; title: string; completed: boolean }>
  sprints: SerializedSprint[]
}

// ─── Status config ─────────────────────────────────────────────────────────────

type StatusCfg = { dot: string; label: string; color: string; bg: string }

const STATUS: Record<string, StatusCfg> = {
  active:        { dot: 'bg-green-400',  label: 'Active',      color: 'text-green-400',  bg: 'bg-green-400/10'  },
  pending:       { dot: 'bg-yellow-400', label: 'Pending',     color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  'in-progress': { dot: 'bg-cyan-400',   label: 'In Progress', color: 'text-cyan-400',   bg: 'bg-cyan-400/10'   },
  'on-hold':     { dot: 'bg-orange-400', label: 'On Hold',     color: 'text-orange-400', bg: 'bg-orange-400/10' },
  completed:     { dot: 'bg-blue-400',   label: 'Completed',   color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  cancelled:     { dot: 'bg-red-400/70', label: 'Cancelled',   color: 'text-red-400',    bg: 'bg-red-400/10'    },
}

function getStatus(s: string): StatusCfg {
  return STATUS[s] ?? STATUS['on-hold']
}

const SPRINT_STATUS = {
  pending:       { dot: 'bg-gray-500',   label: 'Pending',     color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20'     },
  'in-progress': { dot: 'bg-cyan-400',   label: 'In Progress', color: 'text-cyan-400',   bg: 'bg-cyan-400/10 border-cyan-400/20'     },
  delayed:       { dot: 'bg-yellow-400', label: 'Delayed',     color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  finished:      { dot: 'bg-green-400',  label: 'Finished',    color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20'   },
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtShort(d: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d))
}

function fmtCurrency(n: number | null, currency = 'USD') {
  if (!n) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

function isOverdue(project: SerializedProject): boolean {
  if (!project.endDate) return false
  if (['completed', 'cancelled'].includes(project.status)) return false
  return new Date(project.endDate) < new Date()
}

function getActiveSprint(sprints: SerializedSprint[]): SerializedSprint | null {
  return (
    sprints.find((s) => s.status === 'in-progress') ??
    sprints.find((s) => s.status === 'delayed') ??
    sprints.find((s) => s.status === 'pending') ??
    null
  )
}

function sortProjects(projects: SerializedProject[]): SerializedProject[] {
  const rank = (s: string) =>
    s === 'in-progress' || s === 'active' ? 0
    : s === 'pending' ? 1
    : s === 'on-hold' ? 2
    : s === 'completed' ? 3
    : 4
  return [...projects].sort((a, b) => {
    const d = rank(a.status) - rank(b.status)
    return d !== 0 ? d : a.name.localeCompare(b.name)
  })
}

// ─── Pending milestone ring SVG ────────────────────────────────────────────────

function MilestoneRing({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

// ─── Left panel nav row ────────────────────────────────────────────────────────

function ProjectNavRow({
  project,
  isSelected,
  onSelect,
  animationDelay,
}: {
  project: SerializedProject
  isSelected: boolean
  onSelect: () => void
  animationDelay: number
}) {
  const cfg = getStatus(project.status)
  const activeSprint = getActiveSprint(project.sprints)
  const overdue = isOverdue(project)

  // Determine sub-label content
  const subLabel = activeSprint ? (
    <span className="text-cyan-400/70">↳ {activeSprint.name}</span>
  ) : overdue ? (
    <span className="text-amber-400/75">overdue</span>
  ) : (
    <span>{relTime(project.updatedAt)}</span>
  )

  return (
    <button
      type="button"
      data-project-id={project.id}
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-150 border-l-2 group',
        'animate-in fade-in slide-in-from-left-1 duration-300',
        isSelected
          ? 'border-l-cyan-400/60 bg-white/[0.035]'
          : 'border-l-transparent hover:bg-white/[0.02] hover:border-l-white/[0.08]',
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Status dot — amber pulsing if overdue */}
      {overdue ? (
        <span className="size-1.5 rounded-full bg-amber-400 shrink-0 mt-px animate-pulse" />
      ) : (
        <span className={cn('size-1.5 rounded-full shrink-0 mt-px', cfg.dot)} />
      )}

      {/* Name + sprint */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate transition-all duration-150 gradient-text',
            isSelected ? 'opacity-100' : 'opacity-40 group-hover:opacity-70',
          )}
        >
          {project.name}
        </p>
        <p className="text-[10px] text-white/45 mt-0.5 truncate tabular-nums">
          {subLabel}
        </p>
      </div>

      {/* Sprint count */}
      {project.sprints.length > 0 && (
        <span className="text-[9px] text-white/15 shrink-0 tabular-nums">
          {project.sprints.length}sp
        </span>
      )}
    </button>
  )
}

// ─── Right panel: empty state ──────────────────────────────────────────────────

function EmptyState({
  canCreate,
  clients,
}: {
  canCreate: boolean
  clients: ClientOption[]
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-12 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-cyan-400/5 rounded-full blur-3xl scale-150" />
        <FolderOpen className="size-12 text-white/10 relative z-10" />
      </div>
      <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light mb-3">
        No Projects
      </p>
      <p className="text-sm text-white/25 mb-8 leading-relaxed">
        Projects will appear here once created.
      </p>
      {canCreate && (
        <div className="[&>button]:px-5 [&>button]:py-2.5">
          <CreateProjectModal clients={clients} />
        </div>
      )}
    </div>
  )
}

// ─── Right panel: project detail ───────────────────────────────────────────────

function ProjectDetail({
  project,
  username,
}: {
  project: SerializedProject
  username: string
}) {
  const cfg = getStatus(project.status)
  const activeSprint = getActiveSprint(project.sprints)
  const otherSprints = project.sprints.filter((s) => s.id !== activeSprint?.id)
  const upcomingSprints = otherSprints.filter((s) => s.status === 'pending')
  const finishedSprints = otherSprints.filter((s) => s.status === 'finished')
  const overdue = isOverdue(project)

  const budget = fmtCurrency(project.budget, project.currency)
  const dateRange =
    project.startDate && project.endDate
      ? `${fmtShort(project.startDate)} → ${fmtShort(project.endDate)}`
      : project.startDate
        ? `From ${fmtShort(project.startDate)}`
        : null

  const sprintProgress =
    activeSprint && activeSprint.totalTasksCount > 0
      ? Math.round((activeSprint.completedTasksCount / activeSprint.totalTasksCount) * 100)
      : 0

  const visibleMilestones = project.milestones.slice(0, 5)
  const hiddenMilestoneCount = project.milestones.length - visibleMilestones.length

  return (
    <div className="flex flex-col h-full">

      {/* Scrollable content — orbital geometry is a fixed background of this container */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">

        {/* Orbital geometry — background of the scroll container, not overlapping content */}
        <div
          className="sticky top-0 pointer-events-none select-none"
          aria-hidden="true"
          style={{ height: 0, overflow: 'visible' }}
        >
          <div className="absolute top-6 right-6 opacity-[0.03]">
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
              <circle cx="120" cy="120" r="119" stroke="white" strokeWidth="1" />
              <circle cx="120" cy="120" r="89" stroke="white" strokeWidth="0.5" />
              <circle cx="120" cy="120" r="52" stroke="white" strokeWidth="0.5" />
              <line x1="120" y1="0" x2="120" y2="240" stroke="white" strokeWidth="0.5" />
              <line x1="0" y1="120" x2="240" y2="120" stroke="white" strokeWidth="0.5" />
              <circle cx="120" cy="120" r="2.5" stroke="white" strokeWidth="0.5" fill="none" />
            </svg>
          </div>
        </div>

        <div className="px-9 py-8 space-y-7 relative z-10">

          {/* Status + name */}
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex items-center gap-2 mb-4">
              {overdue ? (
                <>
                  <AlertTriangle className="size-3 text-amber-400/70 shrink-0" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-400/80">
                    Overdue
                  </span>
                </>
              ) : (
                <>
                  <span className={cn('size-1.5 rounded-full', cfg.dot)} />
                  <span className={cn('text-[10px] font-semibold uppercase tracking-[0.35em]', cfg.color)}>
                    {cfg.label}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-3xl font-bold gradient-text leading-tight mb-2">
              {project.name}
            </h2>
            <div className="w-6 h-px bg-cyan-400/40 mb-3" />
            {project.description && (
              <p className="text-sm text-white/40 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Meta: dates + budget only — compact */}
          {(dateRange || budget) && (
            <div
              className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '75ms' }}
            >
              {dateRange && (
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-[11px] bg-white/[0.03] border rounded-lg px-2.5 py-1.5',
                    overdue
                      ? 'text-amber-400/60 border-amber-400/20'
                      : 'text-white/35 border-white/[0.06]',
                  )}
                >
                  <Calendar className="size-3 shrink-0 opacity-60" />
                  {dateRange}
                </div>
              )}
              {budget && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/35 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
                  <DollarSign className="size-3 shrink-0 text-white/20" />
                  {budget}
                </div>
              )}
            </div>
          )}

          {/* ── Active sprint ── */}
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '150ms' }}
          >
            {activeSprint ? (
              <div className="space-y-2.5">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light flex items-center gap-2">
                  <Zap className="size-3 text-cyan-400/40" />
                  Current Sprint
                </p>
                <div className="rounded-xl border border-cyan-400/12 bg-gradient-to-b from-cyan-950/15 to-transparent p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white mb-1">{activeSprint.name}</p>
                      <p className="text-[10px] text-white/30">
                        {fmtShort(activeSprint.startDate)} → {fmtShort(activeSprint.endDate)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border shrink-0',
                        SPRINT_STATUS[activeSprint.status].bg,
                        SPRINT_STATUS[activeSprint.status].color,
                      )}
                    >
                      <span className={cn('size-1 rounded-full', SPRINT_STATUS[activeSprint.status].dot)} />
                      {SPRINT_STATUS[activeSprint.status].label}
                    </span>
                  </div>

                  {activeSprint.totalTasksCount > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/25 tabular-nums">
                          {activeSprint.completedTasksCount} of {activeSprint.totalTasksCount} tasks done
                        </span>
                        <span className="text-[10px] text-white/25 tabular-nums font-medium">
                          {sprintProgress}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400/55 rounded-full transition-all duration-700"
                          style={{ width: `${sprintProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/20">No tasks assigned yet</p>
                  )}

                  {activeSprint.goalDescription && (
                    <p className="text-xs text-white/30 leading-relaxed border-t border-white/[0.05] pt-3">
                      {activeSprint.goalDescription}
                    </p>
                  )}
                </div>

                {/* Other sprints context */}
                {otherSprints.length > 0 && (
                  <div className="flex items-center gap-3 pl-1 text-[10px] text-white/20">
                    {upcomingSprints.length > 0 && (
                      <span>{upcomingSprints.length} upcoming</span>
                    )}
                    {upcomingSprints.length > 0 && finishedSprints.length > 0 && (
                      <span className="text-white/25">·</span>
                    )}
                    {finishedSprints.length > 0 && (
                      <span>{finishedSprints.length} finished</span>
                    )}
                  </div>
                )}
              </div>
            ) : project.sprints.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.07] px-5 py-6 text-center">
                <p className="text-xs text-white/20">No sprints yet — all work is on the project page.</p>
              </div>
            ) : (
              /* All sprints finished */
              <div className="rounded-xl border border-green-400/12 bg-green-400/5 px-5 py-4 flex items-center gap-3">
                <CheckCircle2 className="size-4 text-green-400/50 shrink-0" />
                <p className="text-xs text-green-400/60">
                  All {project.sprints.length} sprint{project.sprints.length !== 1 ? 's' : ''} complete
                </p>
              </div>
            )}
          </div>

          {/* ── Milestones ── */}
          {project.milestones.length > 0 && (
            <div
              className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '225ms' }}
            >
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">
                Milestones
              </p>
              <div className="space-y-1">
                {visibleMilestones.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 py-1">
                    {m.completed ? (
                      <CheckCircle2 className="size-3.5 text-green-400/50 shrink-0" />
                    ) : (
                      <MilestoneRing className="size-3.5 text-white/15 shrink-0" />
                    )}
                    <span
                      className={cn(
                        'text-xs leading-relaxed truncate',
                        m.completed ? 'text-white/25 line-through' : 'text-white/55',
                      )}
                    >
                      {m.title}
                    </span>
                  </div>
                ))}
                {hiddenMilestoneCount > 0 && (
                  <p className="text-[10px] text-white/20 pl-6">
                    + {hiddenMilestoneCount} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Last updated — with separator */}
          <div className="border-t border-white/[0.05] pt-3">
            <p className="text-[9px] text-white/20 tabular-nums tracking-wide uppercase font-light">
              <span className="text-white/15 mr-1.5">Updated</span>
              {relTime(project.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Pinned footer */}
      <div className="shrink-0 px-9 pb-7 pt-4 border-t border-white/[0.05]">
        <Link
          href={`/u/${username}/projects/${project.id}`}
          className="flex items-center justify-between w-full px-5 py-3 rounded-xl border border-white/[0.08] hover:border-intelligence-cyan/30 bg-white/[0.03] hover:bg-intelligence-cyan/5 text-white/55 hover:text-white text-sm font-medium transition-all duration-200 group"
        >
          <span>Open project workspace</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
        </Link>
      </div>
    </div>
  )
}

// ─── Mobile card ───────────────────────────────────────────────────────────────

function MobileProjectCard({
  project,
  username,
  animationDelay,
}: {
  project: SerializedProject
  username: string
  animationDelay: number
}) {
  const cfg = getStatus(project.status)
  const activeSprint = getActiveSprint(project.sprints)
  const overdue = isOverdue(project)
  const completedMilestones = project.milestones.filter((m) => m.completed).length

  const sprintProgress =
    activeSprint && activeSprint.totalTasksCount > 0
      ? Math.round((activeSprint.completedTasksCount / activeSprint.totalTasksCount) * 100)
      : 0

  return (
    <Link
      href={`/u/${username}/projects/${project.id}`}
      className={cn(
        'block rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-200 overflow-hidden',
        'animate-in fade-in slide-in-from-bottom-2 duration-300',
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={cn('h-px w-full', overdue ? 'bg-amber-400/70' : cfg.dot)} />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('size-1.5 rounded-full', overdue ? 'bg-amber-400 animate-pulse' : cfg.dot)} />
              <span className={cn('text-[9px] font-semibold uppercase tracking-widest', overdue ? 'text-amber-400/80' : cfg.color)}>
                {overdue ? 'Overdue' : cfg.label}
              </span>
            </div>
            <p className="text-base font-semibold text-white">{project.name}</p>
            {project.description && (
              <p className="text-xs text-white/35 mt-1 line-clamp-2">{project.description}</p>
            )}
          </div>
          <ArrowRight className="size-4 text-white/20 shrink-0 mt-1" />
        </div>

        {activeSprint && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/40 font-medium truncate">{activeSprint.name}</span>
              <span className={cn('text-[9px] shrink-0 ml-2', SPRINT_STATUS[activeSprint.status].color)}>
                {SPRINT_STATUS[activeSprint.status].label}
              </span>
            </div>
            {activeSprint.totalTasksCount > 0 && (
              <>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400/50 rounded-full" style={{ width: `${sprintProgress}%` }} />
                </div>
                <p className="text-[9px] text-white/20 tabular-nums">
                  {activeSprint.completedTasksCount}/{activeSprint.totalTasksCount} tasks · {sprintProgress}%
                </p>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-white/20">
          <div className="flex items-center gap-3">
            {project.sprints.length > 0 && (
              <span>{project.sprints.length} sprint{project.sprints.length !== 1 ? 's' : ''}</span>
            )}
            {project.milestones.length > 0 && (
              <span>{completedMilestones}/{project.milestones.length} milestones</span>
            )}
          </div>
          <span className="tabular-nums">{relTime(project.updatedAt)}</span>
        </div>
      </div>
    </Link>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface ProjectsCarouselProps {
  projects: SerializedProject[]
  username: string
  canCreate?: boolean
  clients?: ClientOption[]
}

export function ProjectsCarousel({
  projects,
  username,
  canCreate = false,
  clients = [],
}: ProjectsCarouselProps) {
  const sorted = sortProjects(projects)
  const [selectedId, setSelectedId] = useState<string>(sorted[0]?.id ?? '')
  const selected = sorted.find((p) => p.id === selectedId) ?? sorted[0] ?? null
  const listRef = useRef<HTMLDivElement>(null)

  const activeCount = sorted.filter(
    (p) => p.status === 'active' || p.status === 'in-progress',
  ).length

  // Arrow-key navigation — only when not focused inside an input/dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [role="dialog"]')) return
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      setSelectedId((curr) => {
        const idx = sorted.findIndex((p) => p.id === curr)
        const next =
          e.key === 'ArrowDown'
            ? Math.min(sorted.length - 1, idx + 1)
            : Math.max(0, idx - 1)
        return sorted[next]?.id ?? curr
      })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [sorted])

  // Scroll selected nav item into view (keyboard nav + initial render)
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-project-id="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <>
      {/* ── DESKTOP: split panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex h-[calc(100vh-4rem)] overflow-hidden border-t border-white/[0.04]">

        {/* Left panel — navigator */}
        <div className="relative w-[272px] xl:w-[296px] bg-black flex flex-col overflow-hidden border-r border-white/[0.05] shrink-0">

          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent shrink-0" />

          {/* Header */}
          <div className="px-6 pt-8 pb-5 shrink-0">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light mb-3">
              Workspace
            </p>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wide">Projects</h1>
            <div className="mt-3 w-5 h-px bg-cyan-400/35" />
          </div>

          {/* Summary counts */}
          <div className="px-5 pb-3 shrink-0 flex items-center gap-3 text-[10px] text-white/20">
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-cyan-400/60" />
                {activeCount} active
              </span>
            )}
            <span>{sorted.length} total</span>
          </div>

          <div className="mx-5 mb-1 h-px bg-white/[0.04] shrink-0" />

          {/* Project list */}
          <div ref={listRef} className="flex-1 overflow-y-auto py-1">
            {sorted.length === 0 ? (
              <p className="text-xs text-white/20 px-5 py-6 text-center">No projects yet.</p>
            ) : (
              sorted.map((p, i) => (
                <ProjectNavRow
                  key={p.id}
                  project={p}
                  isSelected={p.id === selectedId}
                  onSelect={() => setSelectedId(p.id)}
                  animationDelay={Math.min(i * 50, 400)}
                />
              ))
            )}
          </div>

          {canCreate && (
            <div className="shrink-0 px-5 py-5 border-t border-white/[0.05] [&>button]:w-full">
              <CreateProjectModal clients={clients} />
            </div>
          )}

          <div className="absolute bottom-0 right-0 pointer-events-none select-none" aria-hidden="true">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="opacity-[0.05]">
              <path d="M52 0 L52 52 L0 52" stroke="white" strokeWidth="1" />
              <path d="M52 16 L52 52 L16 52" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 bg-[#080808] flex flex-col min-h-0 overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/12 to-transparent shrink-0" />

          {selected ? (
            // key causes remount on project change: resets scroll + triggers fade-in
            <div
              key={selected.id}
              className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-150"
            >
              <ProjectDetail project={selected} username={username} />
            </div>
          ) : (
            <EmptyState canCreate={canCreate} clients={clients} />
          )}
        </div>
      </div>

      {/* ── MOBILE: stacked list ───────────────────────────────────────────── */}
      <div className="lg:hidden px-4 pt-6 pb-28 space-y-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light mb-2">
              {canCreate ? 'Workspace' : 'Client Dashboard'}
            </p>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wide">Projects</h1>
            <div className="mt-3 w-5 h-px bg-cyan-400/35" />
          </div>
          {canCreate && (
            <div className="shrink-0">
              <CreateProjectModal clients={clients} />
            </div>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
            <FolderOpen className="size-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/25">No projects yet.</p>
            {canCreate && (
              <div className="mt-5">
                <CreateProjectModal clients={clients} />
              </div>
            )}
          </div>
        ) : (
          sorted.map((p, i) => (
            <MobileProjectCard
              key={p.id}
              project={p}
              username={username}
              animationDelay={Math.min(i * 60, 360)}
            />
          ))
        )}
      </div>
    </>
  )
}
