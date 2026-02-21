'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  ArrowRight,
  FolderOpen,
  ChevronDown,
  ChevronRight as ChevronRightSm,
  Loader2,
  CheckCircle2,
  Circle,
  Minus,
  XCircle,
  Zap,
} from 'lucide-react'
import { ProgressRing } from './visualizations/ProgressRing'

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
  updatedAt: string
  milestones: Array<{ id: string; title: string; completed: boolean }>
  sprints: SerializedSprint[]
}

// ─── Status configs ────────────────────────────────────────────────────────────

const PROJECT_STATUS: Record<string, { dot: string; label: string; color: string; ringColor: string }> = {
  active: { dot: 'bg-green-400', label: 'Active', color: 'text-green-400', ringColor: 'rgb(74, 222, 128)' },
  'in-progress': { dot: 'bg-cyan-400', label: 'In Progress', color: 'text-cyan-400', ringColor: 'rgb(34, 211, 238)' },
  'on-hold': { dot: 'bg-yellow-400', label: 'On Hold', color: 'text-yellow-400', ringColor: 'rgb(250, 204, 21)' },
  completed: { dot: 'bg-blue-400', label: 'Completed', color: 'text-blue-400', ringColor: 'rgb(96, 165, 250)' },
  cancelled: { dot: 'bg-red-400/70', label: 'Cancelled', color: 'text-red-400', ringColor: 'rgb(248, 113, 113)' },
}

const SPRINT_STATUS = {
  pending: { dot: 'bg-gray-500', label: 'Pending', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  'in-progress': { dot: 'bg-intelligence-cyan', label: 'In Progress', color: 'text-intelligence-cyan', bg: 'bg-cyan-400/10 border-cyan-400/20' },
  delayed: { dot: 'bg-yellow-400', label: 'Delayed', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  finished: { dot: 'bg-green-400', label: 'Finished', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
} as const

const TASK_STATUS = {
  pending: { icon: Circle, color: 'text-gray-500', label: 'Pending' },
  'in-progress': { icon: ChevronRightSm, color: 'text-blue-400', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-green-400', label: 'Done' },
  cancelled: { icon: XCircle, color: 'text-red-400/60', label: 'Cancelled' },
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined, style: 'short' | 'medium' = 'short') {
  if (!d) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: style === 'medium' ? 'numeric' : undefined,
    year: style === 'medium' ? 'numeric' : undefined,
  }).format(new Date(d))
}

function fmtDateRange(start: string, end: string) {
  const s = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(start))
  const e = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(end))
  return `${s} → ${e}`
}

function fmtCurrency(n: number | null | undefined) {
  if (!n) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function calcProgress(project: SerializedProject): number {
  if (project.status === 'completed') return 100
  if (project.status === 'cancelled') return 0
  if (!project.startDate) return 0
  const start = new Date(project.startDate).getTime()
  const end = project.endDate ? new Date(project.endDate).getTime() : start + 30 * 24 * 60 * 60 * 1000
  const now = Date.now()
  if (now >= end) return 100
  if (now <= start) return 0
  return Math.min(100, Math.round(((now - start) / (end - start)) * 100))
}

function getActiveSprint(sprints: SerializedSprint[]): SerializedSprint | null {
  const inProgress = sprints.find(s => s.status === 'in-progress')
  if (inProgress) return inProgress
  const pending = sprints.find(s => s.status === 'pending')
  if (pending) return pending
  const delayed = sprints.find(s => s.status === 'delayed')
  if (delayed) return delayed
  return null
}

// ─── Task item ────────────────────────────────────────────────────────────────

type FetchedTask = {
  id: string
  title: string
  status: string
  priority?: string
  dueDate?: string | null
}

function TaskRow({ task }: { task: FetchedTask }) {
  const cfg = TASK_STATUS[task.status as keyof typeof TASK_STATUS] ?? TASK_STATUS.pending
  const Icon = cfg.icon
  const isStrike = task.status === 'completed' || task.status === 'cancelled'

  return (
    <li className="flex items-center gap-2.5 px-4 py-2.5">
      <Icon className={`size-3.5 shrink-0 ${cfg.color}`} />
      <span className={`flex-1 text-sm leading-snug ${isStrike ? 'line-through text-gray-600' : 'text-gray-300'}`}>
        {task.title}
      </span>
      {task.priority && task.priority !== 'medium' && (
        <span className={`text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${
          task.priority === 'urgent' ? 'text-red-400 bg-red-400/10' :
          task.priority === 'high' ? 'text-orange-400 bg-orange-400/10' :
          'text-gray-600 bg-white/[0.04]'
        }`}>
          {task.priority}
        </span>
      )}
      {task.dueDate && (
        <span className="text-[10px] text-gray-600 shrink-0 tabular-nums">
          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(task.dueDate))}
        </span>
      )}
    </li>
  )
}

// ─── Sprint item ──────────────────────────────────────────────────────────────

function SprintItem({
  sprint,
  projectId,
  defaultOpen = false,
  isActive = false,
}: {
  sprint: SerializedSprint
  projectId: string
  defaultOpen?: boolean
  isActive?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [tasks, setTasks] = useState<FetchedTask[] | null>(null)
  const [loading, setLoading] = useState(false)

  const statusCfg = SPRINT_STATUS[sprint.status] ?? SPRINT_STATUS.pending
  const progressPct = sprint.totalTasksCount > 0
    ? Math.round((sprint.completedTasksCount / sprint.totalTasksCount) * 100)
    : 0

  const loadTasks = useCallback(async () => {
    if (tasks !== null || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`)
      if (res.ok) {
        const data = await res.json()
        const filtered: FetchedTask[] = (data.tasks ?? [])
          .filter((t: any) => {
            const sid = typeof t.sprint === 'string' ? t.sprint : t.sprint?.id
            return sid === sprint.id
          })
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate ?? null,
          }))
        setTasks(filtered)
      } else {
        setTasks([])
      }
    } catch {
      setTasks([])
    }
    setLoading(false)
  }, [tasks, loading, projectId, sprint.id])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && tasks === null) loadTasks()
  }

  return (
    <div
      className={`rounded-xl overflow-hidden border transition-all duration-200 ${
        isActive
          ? 'border-intelligence-cyan/25 bg-gradient-to-b from-cyan-950/20 to-[#0f0f0f]'
          : 'border-white/[0.07] bg-[#111]'
      }`}
    >
      {/* Sprint header button */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="mt-0.5 shrink-0 text-gray-600 transition-transform duration-200" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          <ChevronDown className="size-3.5" />
        </span>

        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Name + status + dates */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white leading-tight">
              {sprint.name}
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
              <span className={`size-1 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className="text-[10px] text-gray-600">
              {fmtDateRange(sprint.startDate, sprint.endDate)}
            </span>
          </div>

          {/* Progress bar */}
          {sprint.totalTasksCount > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-gray-600">
                  {sprint.completedTasksCount}/{sprint.totalTasksCount} tasks
                </span>
                <span className="text-[9px] text-gray-600">{progressPct}%</span>
              </div>
              <div className="h-1 w-full bg-white/[0.07] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-intelligence-cyan/60 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Goal */}
          {sprint.goalDescription && !open && (
            <p className="text-xs text-gray-600 line-clamp-1 leading-relaxed">
              {sprint.goalDescription}
            </p>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-white/[0.06]">
          {/* Goal description */}
          {sprint.goalDescription && (
            <p className="px-4 py-3 text-xs text-gray-500 leading-relaxed border-b border-white/[0.05]">
              {sprint.goalDescription}
            </p>
          )}

          {/* Tasks */}
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-4 text-xs text-gray-600">
              <Loader2 className="size-3.5 animate-spin" />
              Loading tasks…
            </div>
          ) : tasks !== null && tasks.length > 0 ? (
            <ul className="divide-y divide-white/[0.04]">
              {tasks.map(task => <TaskRow key={task.id} task={task} />)}
            </ul>
          ) : tasks !== null && tasks.length === 0 ? (
            <p className="px-4 py-4 text-xs text-gray-600">
              No tasks assigned to this sprint.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, username }: { project: SerializedProject; username: string }) {
  const cfg = PROJECT_STATUS[project.status] ?? PROJECT_STATUS['on-hold']
  const progress = calcProgress(project)
  const budget = fmtCurrency(project.budget)
  const activeSprint = getActiveSprint(project.sprints)
  const historySprints = project.sprints.filter(s => s.id !== activeSprint?.id)

  const completedMilestones = project.milestones.filter(m => m.completed).length
  const totalMilestones = project.milestones.length

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#161616] to-[#0e0e0e] overflow-hidden">
      {/* Status stripe */}
      <div className={`h-px w-full ${cfg.dot}`} />

      <div className="p-5 sm:p-6 space-y-5">

        {/* ── Project header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`size-1.5 rounded-full ${cfg.dot} shrink-0`} />
              <span className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white leading-snug">
              {project.name}
            </h2>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          {project.status !== 'cancelled' && (
            <ProgressRing progress={progress} size={56} strokeWidth={4} color={cfg.ringColor} showLabel />
          )}
        </div>

        {/* ── Meta row ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {project.startDate && project.endDate && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
              <Calendar className="size-3 text-gray-600 shrink-0" />
              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(project.startDate))}
              {' → '}
              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(project.endDate))}
            </div>
          )}
          {budget && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
              <DollarSign className="size-3 text-gray-600 shrink-0" />
              {budget}
            </div>
          )}
          {totalMilestones > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="size-3 text-gray-600 shrink-0" />
              {completedMilestones}/{totalMilestones} milestones
            </div>
          )}
        </div>

        {/* ── Sprint section ─────────────────────────────────────────── */}
        {project.sprints.length > 0 ? (
          <div className="space-y-3">
            {/* Active sprint */}
            {activeSprint && (
              <div className="space-y-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-600 flex items-center gap-1.5">
                  <Zap className="size-2.5 text-intelligence-cyan" />
                  Current Sprint
                </p>
                <SprintItem
                  sprint={activeSprint}
                  projectId={project.id}
                  defaultOpen={true}
                  isActive={true}
                />
              </div>
            )}

            {/* Sprint history */}
            {historySprints.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                  Sprint History · {historySprints.length}
                </p>
                <div className="space-y-2">
                  {historySprints.map(sprint => (
                    <SprintItem
                      key={sprint.id}
                      sprint={sprint}
                      projectId={project.id}
                      defaultOpen={false}
                      isActive={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* No sprints */
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-5 text-center">
            <p className="text-xs text-gray-600">No sprints yet for this project.</p>
          </div>
        )}

        {/* ── Footer link ────────────────────────────────────────────── */}
        <Link
          href={`/u/${username}/projects/${project.id}`}
          className="flex items-center justify-between text-xs font-medium text-gray-600 hover:text-white transition-colors duration-200 pt-3 border-t border-white/[0.05] group"
        >
          <span>Open full project view</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
        </Link>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface ProjectsCarouselProps {
  projects: SerializedProject[]
  username: string
}

export function ProjectsCarousel({ projects, username }: ProjectsCarouselProps) {
  const [index, setIndex] = useState(0)

  const prev = () => setIndex(i => Math.max(0, i - 1))
  const next = () => setIndex(i => Math.min(projects.length - 1, i + 1))

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-16 text-center">
        <FolderOpen className="size-8 text-gray-800 mx-auto mb-3" />
        <p className="text-sm font-semibold text-white mb-1.5">No Projects Yet</p>
        <p className="text-xs text-gray-600">Projects will appear here once created.</p>
      </div>
    )
  }

  const current = projects[index]

  return (
    <div className="space-y-4">
      {/* Navigation header */}
      {projects.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {projects.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-5 h-1.5 bg-intelligence-cyan'
                    : 'w-1.5 h-1.5 bg-white/[0.15] hover:bg-white/30'
                }`}
                aria-label={`Go to project ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-600 tabular-nums">
              {index + 1} / {projects.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prev}
                disabled={index === 0}
                className="flex items-center justify-center size-7 rounded-full border border-white/[0.10] bg-[#1c1c1c] text-gray-500 hover:text-white hover:border-white/[0.20] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
                aria-label="Previous project"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                onClick={next}
                disabled={index === projects.length - 1}
                className="flex items-center justify-center size-7 rounded-full border border-white/[0.10] bg-[#1c1c1c] text-gray-500 hover:text-white hover:border-white/[0.20] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
                aria-label="Next project"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active project card */}
      <ProjectCard project={current} username={username} />
    </div>
  )
}
