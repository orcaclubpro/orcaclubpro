'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, Circle, FolderKanban, Zap } from 'lucide-react'
import { ProgressRing } from './visualizations/ProgressRing'
import { PROJECT_STATUS_CFG, SPRINT_STATUS_CFG } from '@/lib/dashboard/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientProjectSummary = {
  id: string
  name: string
  status: string
  description: string | null
  startDate: string | null
  endDate: string | null
  milestones: Array<{ id: string; title: string; completed: boolean }>
  currentSprint: {
    name: string
    status: string
    completedTasksCount: number
    totalTasksCount: number
    endDate: string
  } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTimelineProgress(startDate: string | null, endDate: string | null, status: string): number {
  if (status === 'completed') return 100
  if (status === 'cancelled') return 0
  if (!startDate) return 0
  const start = new Date(startDate).getTime()
  const end = endDate ? new Date(endDate).getTime() : start + 30 * 24 * 60 * 60 * 1000
  const now = Date.now()
  if (now >= end) return 100
  if (now <= start) return 0
  return Math.min(100, Math.round(((now - start) / (end - start)) * 100))
}

function fmtDate(d: string | null | undefined) {
  if (!d) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, username }: { project: ClientProjectSummary; username: string }) {
  const cfg = PROJECT_STATUS_CFG[project.status as keyof typeof PROJECT_STATUS_CFG] ?? PROJECT_STATUS_CFG['on-hold']
  const timelineProgress = calcTimelineProgress(project.startDate, project.endDate, project.status)

  const completedMilestones = project.milestones.filter(m => m.completed).length
  const totalMilestones = project.milestones.length
  const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
  const nextMilestone = project.milestones.find(m => !m.completed)

  const sprintCfg = project.currentSprint
    ? (SPRINT_STATUS_CFG[project.currentSprint.status as keyof typeof SPRINT_STATUS_CFG] ?? SPRINT_STATUS_CFG.pending)
    : null
  const sprintProgress = project.currentSprint && project.currentSprint.totalTasksCount > 0
    ? Math.round((project.currentSprint.completedTasksCount / project.currentSprint.totalTasksCount) * 100)
    : 0

  return (
    <Link
      href={`/u/${username}/projects/${project.id}`}
      className="group relative flex flex-col sm:flex-row gap-5 rounded-2xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] overflow-hidden hover:border-[var(--space-border-hard)] transition-all duration-300 p-5 sm:p-6"
    >
      {/* Left accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-px ${cfg.stripe}`} />

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4 pl-3">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`size-1.5 rounded-full ${cfg.dot} shrink-0`} />
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[var(--space-text-primary)] group-hover:text-[var(--space-accent)] transition-colors duration-200 leading-snug">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-[var(--space-text-secondary)] mt-1 line-clamp-1 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Current sprint */}
        {project.currentSprint && sprintCfg && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="size-2.5 text-[var(--space-accent)] shrink-0" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--space-text-secondary)]">
                Current Sprint
              </span>
            </div>
            <div className="rounded-lg border border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.06)] px-3 py-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--space-text-tertiary)] truncate">
                  {project.currentSprint.name}
                </span>
                <span className={`flex items-center gap-1 text-[9px] font-medium shrink-0 ${sprintCfg.color}`}>
                  <span className={`size-1 rounded-full ${sprintCfg.dot}`} />
                  {sprintCfg.label}
                </span>
              </div>
              {project.currentSprint.totalTasksCount > 0 && (
                <div className="space-y-1">
                  <div className="h-1 w-full bg-[var(--space-divider)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[rgba(139,156,182,0.50)] rounded-full transition-all duration-500"
                      style={{ width: `${sprintProgress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-[var(--space-text-secondary)]">
                    {project.currentSprint.completedTasksCount}/{project.currentSprint.totalTasksCount} tasks · {sprintProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next milestone */}
        {nextMilestone && (
          <div className="flex items-start gap-2">
            <Circle className="size-3 text-[var(--space-text-secondary)] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-[var(--space-text-secondary)] font-medium mb-0.5">
                Next Milestone
              </p>
              <p className="text-xs text-[var(--space-text-secondary)] truncate">{nextMilestone.title}</p>
            </div>
          </div>
        )}

        {/* Timeline dates */}
        {(project.startDate || project.endDate) && (
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--space-text-secondary)]">
            <Calendar className="size-3 shrink-0" />
            {project.startDate && project.endDate
              ? `${fmtDate(project.startDate)} → ${fmtDate(project.endDate)}`
              : project.startDate
                ? `Started ${fmtDate(project.startDate)}`
                : `Due ${fmtDate(project.endDate)}`}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs font-medium text-[var(--space-text-secondary)] group-hover:text-[var(--space-text-tertiary)] transition-colors pt-2 border-t border-[var(--space-border-hard)]">
          <span>View project</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
        </div>
      </div>

      {/* Right: progress rings */}
      <div className="flex sm:flex-col items-center justify-center gap-4 sm:gap-5 shrink-0">
        {/* Timeline progress ring */}
        {project.status !== 'cancelled' && (
          <div className="flex flex-col items-center gap-1">
            <ProgressRing
              progress={timelineProgress}
              size={48}
              strokeWidth={3.5}
              color={cfg.ringColor}
              showLabel
            />
            <p className="text-[8px] text-[var(--space-text-secondary)] uppercase tracking-wider text-center">Timeline</p>
          </div>
        )}

        {/* Milestone progress ring */}
        {totalMilestones > 0 && (
          <div className="flex flex-col items-center gap-1">
            <ProgressRing
              progress={milestoneProgress}
              size={48}
              strokeWidth={3.5}
              color="rgb(30, 58, 110)"
              showLabel
            />
            <p className="text-[8px] text-[var(--space-text-secondary)] uppercase tracking-wider text-center">
              {completedMilestones}/{totalMilestones}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface ClientActiveProjectsProps {
  projects: ClientProjectSummary[]
  username: string
  totalCount: number
}

export function ClientActiveProjects({ projects, username, totalCount }: ClientActiveProjectsProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--space-border-hard)] bg-[var(--space-bg-card)] p-12 text-center">
        <div className="inline-flex p-4 rounded-full bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)] mb-5">
          <FolderKanban className="size-7 text-[rgba(139,156,182,0.30)]" />
        </div>
        <p className="text-base font-semibold text-[var(--space-text-primary)] mb-2">No active projects yet</p>
        <p className="text-sm text-[var(--space-text-secondary)] mb-6 leading-relaxed max-w-xs mx-auto">
          Your project work will appear here once your engagement begins.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--space-accent)] text-white text-xs font-semibold hover:bg-[var(--space-accent)]/90 transition-colors"
        >
          Start a conversation
          <ArrowRight className="size-3.5" />
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} username={username} />
      ))}

      {totalCount > projects.length && (
        <Link
          href={`/u/${username}/projects`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-[var(--space-border-hard)] text-xs text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] hover:border-[var(--space-border-hard)] transition-all duration-200"
        >
          View all {totalCount} projects
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  )
}
