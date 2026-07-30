'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  FolderOpen,
  DollarSign,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Building2,
  Flag,
  Clock,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateProjectModal } from './CreateProjectModal'
import type { ClientOption } from './CreateProjectModal'
import { ProjectCarouselEditModal } from './ProjectCarouselEditModal'
import { ProfileTimeline } from './ProfileTimeline'

// ─── Exported types (canonical source is src/lib/serialization.ts) ────────────

import type { SerializedSprint, SerializedTask, SerializedProject } from '@/lib/serialization'
export type { SerializedSprint, SerializedTask, SerializedProject }

// ─── Status config ─────────────────────────────────────────────────────────────

type StatusCfg = { dot: string; label: string; color: string; bg: string }

const STATUS: Record<string, StatusCfg> = {
  active:        { dot: 'bg-green-400',  label: 'Active',      color: 'text-green-400',  bg: 'bg-green-400/10'  },
  pending:       { dot: 'bg-yellow-400', label: 'Pending',     color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  'in-progress': { dot: 'bg-[var(--space-accent)]',  label: 'In Progress', color: 'text-[var(--space-accent)]', bg: 'bg-[rgba(139,156,182,0.10)]' },
  'on-hold':     { dot: 'bg-orange-400', label: 'On Hold',     color: 'text-orange-400', bg: 'bg-orange-400/10' },
  completed:     { dot: 'bg-blue-400',   label: 'Completed',   color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  cancelled:     { dot: 'bg-red-400/70', label: 'Cancelled',   color: 'text-red-400',    bg: 'bg-red-400/10'    },
}

function getStatus(s: string): StatusCfg {
  return STATUS[s] ?? STATUS['on-hold']
}

const SPRINT_STATUS = {
  pending:       { dot: 'bg-gray-500',   label: 'Pending',     color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20'     },
  'in-progress': { dot: 'bg-[var(--space-accent)]',  label: 'In Progress', color: 'text-[var(--space-accent)]', bg: 'bg-[rgba(139,156,182,0.10)] border-[rgba(139,156,182,0.15)]' },
  delayed:       { dot: 'bg-yellow-400', label: 'Delayed',     color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  finished:      { dot: 'bg-green-400',  label: 'Finished',    color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20'   },
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtShort(d: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d))
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  return (parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || name[0]?.toUpperCase() || '?')
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

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl px-5 py-4 border',
        accent
          ? 'bg-[rgba(139,156,182,0.06)] border-[rgba(139,156,182,0.15)]'
          : 'bg-[rgba(255,255,255,0.02)] border-[var(--space-border-hard)]',
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--space-text-muted)] flex items-center gap-1.5 mb-2.5">
        <Icon className="size-3" />
        {label}
      </p>
      <p className={cn('text-base font-semibold', accent ? 'text-[var(--space-text-tertiary)]' : 'text-[var(--space-text-tertiary)]')}>
        {value}
      </p>
    </div>
  )
}

// ─── Left panel nav row ────────────────────────────────────────────────────────

function ProjectNavRow({
  project,
  isSelected,
  onSelect,
  username,
}: {
  project: SerializedProject
  isSelected: boolean
  onSelect: () => void
  username: string
}) {
  const router = useRouter()
  const cfg = getStatus(project.status)
  const activeSprint = getActiveSprint(project.sprints)
  const overdue = isOverdue(project)

  // One calm secondary line: client · context — muted, never louder than the name.
  const parts: string[] = []
  if (project.client) parts.push(project.client.name)
  if (overdue) parts.push('Overdue')
  else if (activeSprint) parts.push(activeSprint.name)
  const secondary = parts.join('  ·  ')

  return (
    <div
      role="button"
      tabIndex={0}
      data-project-id={project.id}
      onClick={onSelect}
      onDoubleClick={() => router.push(`/u/${username}/projects/${project.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() }
      }}
      className={cn(
        'group w-full flex items-center gap-3 px-3 py-2.5 text-left border-l-2 cursor-pointer select-none transition-colors duration-150',
        isSelected
          ? 'border-l-[var(--space-accent)] bg-[var(--space-bg-card-hover)]'
          : 'border-l-transparent hover:bg-[var(--space-bg-card-hover)]/60',
      )}
    >
      {/* Monogram — status-tinted entity identity */}
      <div
        className={cn(
          'relative size-9 shrink-0 rounded-lg flex items-center justify-center border transition-colors duration-150',
          overdue ? 'bg-amber-400/10 border-amber-400/25' : cn(cfg.bg, 'border-[var(--space-border-hard)]'),
        )}
      >
        <span className={cn('text-[11px] font-bold tracking-tight', overdue ? 'text-amber-400' : cfg.color)}>
          {initialsOf(project.name)}
        </span>
        {/* Status pip */}
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--space-bg-card)]',
            overdue ? 'bg-amber-400' : cfg.dot,
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate leading-tight transition-colors duration-150 font-semibold',
            isSelected
              ? 'text-[var(--space-text-primary)]'
              : 'text-[var(--space-text-tertiary)] group-hover:text-[var(--space-text-primary)]',
          )}
        >
          {project.name}
        </p>
        {secondary && (
          <p className={cn('text-[10px] truncate leading-tight mt-0.5', overdue ? 'text-amber-400/80' : 'text-[var(--space-text-muted)]')}>
            {secondary}
          </p>
        )}
      </div>

      <ArrowRight className="size-3.5 shrink-0 text-transparent group-hover:text-[var(--space-text-muted)] transition-colors duration-150" />
    </div>
  )
}

// ─── Right panel: empty state ──────────────────────────────────────────────────

function EmptyState({ canCreate, clients }: { canCreate: boolean; clients: ClientOption[] }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-12 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-[rgba(255,255,255,0.03)] rounded-full blur-3xl scale-150" />
        <FolderOpen className="size-12 text-[var(--space-text-muted)] relative z-10" />
      </div>
      <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--space-text-muted)] font-light mb-3">No Projects</p>
      <p className="text-sm text-[var(--space-text-secondary)] mb-8 leading-relaxed">Projects will appear here once created.</p>
      {canCreate && (
        <div className="[&>button]:px-5 [&>button]:py-2.5">
          <CreateProjectModal clients={clients} />
        </div>
      )}
    </div>
  )
}

// ─── Right panel: sprints tab content ─────────────────────────────────────────

function SprintsDetailPanel({
  project,
  username,
}: {
  project: SerializedProject
  username: string
}) {
  const activeSprints = project.sprints.filter(
    (s) => s.status === 'in-progress' || s.status === 'delayed',
  )
  const latestSprints = [...project.sprints]
    .filter((s) => s.status !== 'in-progress' && s.status !== 'delayed')
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  if (project.sprints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-12">
        <Zap className="size-10 text-[var(--space-text-muted)] mb-4" />
        <p className="text-sm text-[var(--space-text-secondary)]">No sprints yet</p>
        <p className="text-xs text-[var(--space-text-muted)] mt-2 max-w-xs">
          Open the workspace to create sprints and track progress.
        </p>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 space-y-8 animate-in fade-in duration-200">

      {/* ── Active sprints ── */}
      <div className="space-y-4">
        <p className="text-[11px] tracking-[0.4em] uppercase text-[var(--space-text-muted)] font-light flex items-center gap-2">
          <Zap className="size-3 text-cyan-500/50" />
          Active
        </p>

        {activeSprints.length > 0 ? (
          <div className="space-y-3">
            {activeSprints.map((sprint) => {
              const cfg = SPRINT_STATUS[sprint.status]
              const progress =
                sprint.totalTasksCount > 0
                  ? Math.round((sprint.completedTasksCount / sprint.totalTasksCount) * 100)
                  : 0
              return (
                <Link
                  key={sprint.id}
                  href={`/u/${username}/projects/${project.id}/sprints/${sprint.id}`}
                  className="block rounded-xl border border-[rgba(139,156,182,0.10)] bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent p-5 space-y-4 hover:border-[rgba(139,156,182,0.18)] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-[var(--space-text-primary)] group-hover:text-[var(--space-text-tertiary)] transition-colors leading-snug">
                        {sprint.name}
                      </p>
                      <p className="text-xs text-[var(--space-text-secondary)] mt-0.5">
                        {fmtShort(sprint.startDate)} → {fmtShort(sprint.endDate)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0',
                        cfg.bg, cfg.color,
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full animate-pulse', cfg.dot)} />
                      {cfg.label}
                    </span>
                  </div>

                  {(sprint.goalDescription || sprint.description) && (
                    <p className="text-xs text-[var(--space-text-secondary)] leading-relaxed">
                      {sprint.goalDescription || sprint.description}
                    </p>
                  )}

                  {sprint.totalTasksCount > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[var(--space-text-muted)]">
                        <span className="tabular-nums">
                          {sprint.completedTasksCount}/{sprint.totalTasksCount} tasks
                        </span>
                        <span className="tabular-nums font-medium">{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--space-divider)]">
                        <div
                          className="h-full bg-[rgba(139,156,182,0.45)] rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.02)] px-5 py-4 flex items-center gap-3">
            <Zap className="size-4 text-[var(--space-text-muted)] shrink-0" />
            <p className="text-sm text-[var(--space-text-secondary)]">No active sprint</p>
          </div>
        )}
      </div>

      {/* ── Latest sprints ── */}
      {latestSprints.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] tracking-[0.4em] uppercase text-[var(--space-text-muted)] font-light">
            Latest · {latestSprints.length}
          </p>
          <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden divide-y divide-[var(--space-divider)]">
            {latestSprints.map((sprint) => {
              const cfg = SPRINT_STATUS[sprint.status]
              const progress =
                sprint.totalTasksCount > 0
                  ? Math.round((sprint.completedTasksCount / sprint.totalTasksCount) * 100)
                  : 0
              return (
                <Link
                  key={sprint.id}
                  href={`/u/${username}/projects/${project.id}/sprints/${sprint.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                >
                  <span className={cn('flex items-center gap-1.5 text-[10px] font-medium shrink-0 w-[58px]', cfg.color)}>
                    <span className={cn('size-1.5 rounded-full shrink-0', cfg.dot)} />
                    {cfg.label}
                  </span>
                  <span className="flex-1 text-sm text-[var(--space-text-secondary)] group-hover:text-[var(--space-text-tertiary)] transition-colors truncate min-w-0">
                    {sprint.name}
                  </span>
                  <span className="text-xs text-[var(--space-text-muted)] shrink-0 tabular-nums hidden sm:block">
                    {fmtShort(sprint.startDate)} → {fmtShort(sprint.endDate)}
                  </span>
                  <div className="w-12 shrink-0 hidden md:flex items-center">
                    <div className="h-px w-full bg-[var(--space-divider)] relative">
                      <div
                        className={cn('absolute inset-y-0 left-0 h-full', cfg.dot)}
                        style={{ width: `${progress}%`, height: '1px' }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[var(--space-text-muted)] shrink-0 tabular-nums w-7 text-right">{progress}%</span>
                  <ArrowRight className="size-3.5 text-[var(--space-text-muted)] group-hover:text-[var(--space-text-secondary)] shrink-0 transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Right panel: project detail ───────────────────────────────────────────────

function ProjectDetail({
  project,
  username,
  showClientLink,
  canEdit,
}: {
  project: SerializedProject
  username: string
  showClientLink: boolean
  canEdit: boolean
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sprints'>('overview')

  const cfg = getStatus(project.status)
  const activeSprint = getActiveSprint(project.sprints)
  const otherSprints = project.sprints.filter((s) => s.id !== activeSprint?.id)
  const upcomingSprints = otherSprints.filter((s) => s.status === 'pending')
  const finishedSprints = otherSprints.filter((s) => s.status === 'finished')
  const overdue = isOverdue(project)
  const completedMilestones = project.milestones.filter((m) => m.completed).length
  const budget = fmtCurrency(project.budget, project.currency)

  const sprintProgress =
    activeSprint && activeSprint.totalTasksCount > 0
      ? Math.round((activeSprint.completedTasksCount / activeSprint.totalTasksCount) * 100)
      : 0

  // Build stat cards
  const stats: Array<{ icon: LucideIcon; label: string; value: string; accent?: boolean }> = []
  if (budget) stats.push({ icon: DollarSign, label: 'Budget', value: budget, accent: true })
  if (project.sprints.length > 0)
    stats.push({ icon: Zap, label: 'Sprints', value: `${project.sprints.length} sprint${project.sprints.length !== 1 ? 's' : ''}` })
  if (project.milestones.length > 0)
    stats.push({ icon: Flag, label: 'Milestones', value: `${completedMilestones} / ${project.milestones.length} done` })

  return (
    <div className="flex flex-col h-full relative">

      {/* ── Floating action buttons ──────────────────────────────────── */}
      <div className="absolute top-3 right-6 z-30 flex items-center gap-3">
        {canEdit && <ProjectCarouselEditModal project={project} large />}
        <Link
          href={`/u/${username}/projects/${project.id}`}
          className="flex items-center gap-2.5 bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 active:scale-[0.98] text-white font-bold rounded-full px-5 py-2 text-sm transition-all duration-200 group shadow-[0_0_28px_rgba(139,156,182,0.15)] hover:shadow-[0_0_42px_rgba(139,156,182,0.20)]"
        >
          Open Workspace
          <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>

      {/* ── Tab nav ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1 px-8 pt-3 border-b border-[var(--space-border-hard)]">
        {(['overview', 'sprints'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 h-10 text-sm font-medium border-b-2 transition-colors duration-150 capitalize',
              activeTab === tab
                ? 'border-[var(--space-accent)]/70 text-[var(--space-text-primary)]'
                : 'border-transparent text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)]',
            )}
          >
            {tab}
            {tab === 'sprints' && project.sprints.length > 0 && (
              <span className="ml-1.5 text-[10px] text-[var(--space-text-muted)] tabular-nums">
                {project.sprints.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">

        {activeTab === 'sprints' ? (
          <SprintsDetailPanel project={project} username={username} />
        ) : (
          <>
            {/* Orbital geometry */}
            <div
              className="sticky top-0 pointer-events-none select-none"
              aria-hidden="true"
              style={{ height: 0, overflow: 'visible' }}
            >
              <div className="absolute top-6 right-6 opacity-[0.03]">
                <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
                  <circle cx="120" cy="120" r="119" stroke="var(--space-divider)" strokeWidth="1" />
                  <circle cx="120" cy="120" r="89" stroke="var(--space-divider)" strokeWidth="0.5" />
                  <circle cx="120" cy="120" r="52" stroke="var(--space-divider)" strokeWidth="0.5" />
                  <line x1="120" y1="0" x2="120" y2="240" stroke="var(--space-divider)" strokeWidth="0.5" />
                  <line x1="0" y1="120" x2="240" y2="120" stroke="var(--space-divider)" strokeWidth="0.5" />
                  <circle cx="120" cy="120" r="2.5" stroke="var(--space-divider)" strokeWidth="0.5" fill="none" />
                </svg>
              </div>
            </div>

            <div className="px-12 py-10 space-y-10 relative z-10">

              {/* ── Header ── */}
              <div
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: '0ms' }}
              >
                {/* Top bar: status · client chip */}
                <div className="flex items-center justify-between gap-4 mb-7">
                  <div className="flex items-center gap-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {overdue ? (
                        <>
                          <AlertTriangle className="size-3.5 text-amber-400/80 shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400/90">
                            Overdue
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={cn('size-2 rounded-full', cfg.dot)} />
                          <span className={cn('text-xs font-semibold uppercase tracking-[0.35em]', cfg.color)}>
                            {cfg.label}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Client chip */}
                    {showClientLink && project.client && (
                      <Link
                        href={`/u/${username}/clients/${project.client.id}`}
                        className="flex items-center gap-2 text-xs bg-[var(--space-bg-card-hover)] hover:bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] hover:border-[var(--space-border-hard)] rounded-full px-3.5 py-1.5 transition-all duration-150 group shrink-0"
                      >
                        <Building2 className="size-3.5 text-cyan-500/50 group-hover:text-cyan-600 transition-colors shrink-0" />
                        <span className="text-[var(--space-text-secondary)] group-hover:text-[var(--space-text-tertiary)] font-medium transition-colors">
                          {project.client.name}
                        </span>
                      </Link>
                    )}
                  </div>
                  <div />
                </div>

                {/* Project name — huge */}
                <h2 className="text-6xl xl:text-7xl font-bold text-[var(--space-accent)] leading-none mb-4">
                  {project.name}
                </h2>
                <div className="w-10 h-px bg-[var(--space-accent)]/40 mb-5" />

                {/* Description */}
                {project.description && (
                  <p className="text-base text-[var(--space-text-secondary)] leading-relaxed max-w-2xl">
                    {project.description}
                  </p>
                )}
              </div>

              {/* ── Active sprint ── */}
              <div
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: '60ms' }}
              >
                {activeSprint ? (
                  <div className="space-y-3">
                    <p className="text-[11px] tracking-[0.4em] uppercase text-[var(--space-text-muted)] font-light flex items-center gap-2">
                      <Zap className="size-3.5 text-cyan-500/40" />
                      Current Sprint
                    </p>
                    <div className="rounded-2xl border border-[rgba(139,156,182,0.10)] bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent p-6 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-[var(--space-text-primary)] mb-1.5">{activeSprint.name}</p>
                          <p className="text-xs text-[var(--space-text-secondary)]">
                            {fmtShort(activeSprint.startDate)} → {fmtShort(activeSprint.endDate)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border shrink-0',
                            SPRINT_STATUS[activeSprint.status].bg,
                            SPRINT_STATUS[activeSprint.status].color,
                          )}
                        >
                          <span className={cn('size-1.5 rounded-full', SPRINT_STATUS[activeSprint.status].dot)} />
                          {SPRINT_STATUS[activeSprint.status].label}
                        </span>
                      </div>

                      {activeSprint.totalTasksCount > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--space-text-muted)] tabular-nums">
                              {activeSprint.completedTasksCount} of {activeSprint.totalTasksCount} tasks done
                            </span>
                            <span className="text-xs text-[var(--space-text-muted)] tabular-nums font-medium">
                              {sprintProgress}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-[var(--space-divider)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[rgba(139,156,182,0.45)] rounded-full transition-all duration-700"
                              style={{ width: `${sprintProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--space-text-muted)]">No tasks assigned yet</p>
                      )}

                      {activeSprint.goalDescription && (
                        <p className="text-sm text-[var(--space-text-secondary)] leading-relaxed border-t border-[var(--space-border-hard)] pt-4">
                          {activeSprint.goalDescription}
                        </p>
                      )}
                    </div>

                    {otherSprints.length > 0 && (
                      <div className="flex items-center gap-3 pl-1 text-xs text-[var(--space-text-muted)]">
                        {upcomingSprints.length > 0 && <span>{upcomingSprints.length} upcoming</span>}
                        {upcomingSprints.length > 0 && finishedSprints.length > 0 && (
                          <span className="text-[var(--space-text-muted)]">·</span>
                        )}
                        {finishedSprints.length > 0 && <span>{finishedSprints.length} finished</span>}
                      </div>
                    )}
                  </div>
                ) : project.sprints.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--space-border-hard)] px-6 py-8 text-center">
                    <p className="text-sm text-[var(--space-text-muted)]">No sprints yet — all work is on the project page.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-green-400/12 bg-green-400/5 px-6 py-5 flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-green-400/50 shrink-0" />
                    <p className="text-sm text-green-400/60">
                      All {project.sprints.length} sprint{project.sprints.length !== 1 ? 's' : ''} complete
                    </p>
                  </div>
                )}
              </div>

              {/* ── Timeline ── */}
              <div
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: '120ms' }}
              >
                <p className="text-[11px] tracking-[0.4em] uppercase text-[var(--space-text-muted)] font-light mb-5">
                  Timeline
                </p>
                <ProfileTimeline project={project} username={username} />
              </div>

              {/* ── Stats grid ── */}
              {stats.length > 0 && (
                <div
                  className={cn(
                    'grid gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                    stats.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 xl:grid-cols-4',
                  )}
                  style={{ animationDelay: '150ms' }}
                >
                  {stats.map((s) => (
                    <StatCard key={s.label} {...s} />
                  ))}
                </div>
              )}

              {/* Last updated */}
              <div className="border-t border-[var(--space-border-hard)] pt-4">
                <p className="text-xs text-[var(--space-text-muted)] tabular-nums tracking-wide uppercase font-light flex items-center gap-1.5">
                  <Clock className="size-3" />
                  Updated {relTime(project.updatedAt)}
                </p>
              </div>
            </div>
          </>
        )}
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

  const dotColor = overdue ? '#fbbf24' : cfg.dot.replace('bg-', '')

  return (
    <Link
      href={`/u/${username}/projects/${project.id}`}
      className="group block"
      style={{
        opacity: 0,
        animation: `cardFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${animationDelay}ms forwards`,
      }}
    >
      <style>{`
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <div
        className="relative flex items-stretch rounded-xl overflow-hidden
          border border-[var(--space-border-hard)] bg-[var(--space-bg-card)]
          transition-all duration-200
          group-hover:-translate-y-px group-hover:border-[rgba(103,232,249,0.18)] group-hover:bg-[var(--space-bg-base)]
          group-hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
          active:scale-[0.99] active:transition-none"
      >
        {/* Cyan top glow on hover */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(90deg, transparent 10%, var(--space-accent) 50%, transparent 90%)' }}
        />

        {/* Left accent bar — status color */}
        <div
          className="w-[3px] shrink-0 transition-opacity duration-200 opacity-30 group-hover:opacity-80"
          style={{ background: overdue ? '#fbbf24' : 'var(--space-accent)' }}
        />

        <div className="flex-1 min-w-0 px-4 py-3.5 space-y-2.5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--space-text-primary)] group-hover:text-[var(--space-text-primary)] truncate transition-colors duration-200 leading-snug">
                {project.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    'text-[9px] font-semibold uppercase tracking-widest',
                    overdue ? 'text-amber-400/80' : cfg.color,
                  )}
                >
                  {overdue ? 'Overdue' : cfg.label}
                </span>
                {project.client && (
                  <>
                    <span className="text-[#444444] text-[9px]">·</span>
                    <span className="text-[10px] text-[#777777] truncate">{project.client.name}</span>
                  </>
                )}
              </div>
            </div>
            <ArrowRight
              className="size-3.5 shrink-0 mt-0.5 transition-all duration-200 group-hover:translate-x-0.5"
              style={{ color: 'rgba(103,232,249,0.25)' }}
            />
          </div>

          {/* Active sprint progress */}
          {activeSprint && activeSprint.totalTasksCount > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#666666] truncate max-w-[70%]">{activeSprint.name}</span>
                <span className="text-[10px] text-[#555555] tabular-nums shrink-0 ml-2">
                  {activeSprint.completedTasksCount}/{activeSprint.totalTasksCount}
                </span>
              </div>
              <div className="h-px bg-[var(--space-divider)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sprintProgress}%`,
                    background: sprintProgress === 100
                      ? 'rgba(52,211,153,0.6)'
                      : 'rgba(103,232,249,0.45)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 text-[10px] text-[var(--space-text-muted)] group-hover:text-[var(--space-text-secondary)] transition-colors duration-200">
            {project.sprints.length > 0 && (
              <span>{project.sprints.length}sp</span>
            )}
            {project.milestones.length > 0 && (
              <span>{completedMilestones}/{project.milestones.length} milestones</span>
            )}
            <span className="ml-auto tabular-nums">{relTime(project.updatedAt)}</span>
          </div>
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
  const [query, setQuery] = useState('')
  const selected = sorted.find((p) => p.id === selectedId) ?? sorted[0] ?? null
  const listRef = useRef<HTMLDivElement>(null)

  const activeCount = sorted.filter(
    (p) => p.status === 'active' || p.status === 'in-progress',
  ).length

  const q = query.trim().toLowerCase()
  const filtered = q
    ? sorted.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.client?.name?.toLowerCase().includes(q) ?? false),
      )
    : sorted

  // Arrow-key navigation — walks the currently filtered list
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [role="dialog"]')) return
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      setSelectedId((curr) => {
        const idx = filtered.findIndex((p) => p.id === curr)
        const next =
          e.key === 'ArrowDown'
            ? Math.min(filtered.length - 1, idx + 1)
            : Math.max(0, idx - 1)
        return filtered[next]?.id ?? curr
      })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [filtered])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-project-id="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <>
      {/* ── DESKTOP: split panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex h-[calc((100vh-64px)/1.3)] overflow-hidden border-t border-[var(--space-border-hard)]">

        {/* Left panel — navigator */}
        <div className="relative w-[272px] xl:w-[296px] bg-[var(--space-bg-card)] flex flex-col overflow-hidden border-r border-[var(--space-border-hard)] shrink-0">

          {/* Header — compact */}
          <div className="px-4 pt-5 pb-3 shrink-0">
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--space-accent)]/70 font-medium mb-1">Workspace</p>
                <h1 className="text-lg font-bold text-[var(--space-text-primary)] tracking-tight leading-none">Projects</h1>
              </div>
              <span className="text-[11px] text-[var(--space-text-muted)] tabular-nums shrink-0">{sorted.length}</span>
            </div>
            {activeCount > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[var(--space-text-muted)]">
                <span className="size-1 rounded-full bg-[var(--space-accent)]" />
                {activeCount} active
              </div>
            )}
          </div>

          {/* Search */}
          <div className="px-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--space-text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects"
                className="w-full h-8 rounded-lg bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] pl-8 pr-3 text-xs text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[var(--space-accent)]/40 transition-colors"
              />
            </div>
          </div>

          {/* Project list */}
          <div ref={listRef} className="flex-1 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--space-text-muted)] px-5 py-6 text-center">
                {sorted.length === 0 ? 'No projects yet.' : 'No matches.'}
              </p>
            ) : (
              filtered.map((p) => (
                <ProjectNavRow
                  key={p.id}
                  project={p}
                  isSelected={p.id === selectedId}
                  onSelect={() => setSelectedId(p.id)}
                  username={username}
                />
              ))
            )}
          </div>

          {canCreate && (
            <div className="shrink-0 px-5 py-5 border-t border-[var(--space-border-hard)] [&>button]:w-full">
              <CreateProjectModal clients={clients} />
            </div>
          )}

          <div className="absolute bottom-0 right-0 pointer-events-none select-none" aria-hidden="true">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="opacity-[0.05]">
              <path d="M52 0 L52 52 L0 52" stroke="var(--space-divider)" strokeWidth="1" />
              <path d="M52 16 L52 52 L16 52" stroke="var(--space-divider)" strokeWidth="0.5" />
            </svg>
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 bg-[var(--space-bg-base)] flex flex-col min-h-0 overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1E3A6E]/10 to-transparent shrink-0" />

          {selected ? (
            <div
              key={selected.id}
              className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-150"
            >
              <ProjectDetail project={selected} username={username} showClientLink={canCreate} canEdit={canCreate} />
            </div>
          ) : (
            <EmptyState canCreate={canCreate} clients={clients} />
          )}
        </div>
      </div>

      {/* ── MOBILE: stacked list ───────────────────────────────────────────── */}
      <div className="lg:hidden px-4 pt-6 pb-28 space-y-4">
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--space-accent)] font-medium mb-2">
            {canCreate ? 'Workspace' : 'Client Dashboard'}
          </p>
          <h1 className="text-2xl font-bold text-[var(--space-text-primary)] uppercase tracking-wide">Projects</h1>
          <div className="mt-3 w-5 h-px bg-[var(--space-accent)]/35" />
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.02)] p-10 text-center">
            <FolderOpen className="size-8 text-[var(--space-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--space-text-muted)]">No projects yet.</p>
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

        {canCreate && sorted.length > 0 && (
          <div className="pt-2 [&>button]:w-full">
            <CreateProjectModal clients={clients} />
          </div>
        )}
      </div>
    </>
  )
}
