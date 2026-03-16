'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Loader2, Zap, ArrowRight,
  MoreHorizontal, Trash2, Calendar,
  ListChecks, Target, TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteSprint } from '@/actions/sprints'
import { cn } from '@/lib/utils'
import type { Sprint, Task } from '@/types/payload-types'
import { CreateSprintModal } from './CreateSprintModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const SPRINT_STATUS = {
  pending:       { dot: 'bg-gray-500',          text: 'text-[#6B6B6B]',          label: 'Planned',  bg: 'bg-[rgba(255,255,255,0.02)]',             border: 'border-[#404040]'             },
  'in-progress': { dot: 'bg-[var(--space-accent)]', text: 'text-[var(--space-accent)]', label: 'Active',   bg: 'bg-[rgba(139,156,182,0.06)]', border: 'border-[rgba(139,156,182,0.15)]' },
  delayed:       { dot: 'bg-orange-400',        text: 'text-orange-400',        label: 'Delayed',  bg: 'bg-orange-400/[0.04]',        border: 'border-orange-400/[0.15]'        },
  finished:      { dot: 'bg-green-400',         text: 'text-green-400',         label: 'Finished', bg: 'bg-green-400/[0.03]',         border: 'border-green-400/[0.12]'         },
} as const


const PRIORITY_CFG = {
  urgent: { bar: 'bg-red-500',    label: 'Urgent' },
  high:   { bar: 'bg-orange-400', label: 'High'   },
  medium: { bar: 'bg-blue-400',   label: 'Med'    },
  low:    { bar: 'bg-gray-600',   label: 'Low'    },
} as const

type PriorityKey = keyof typeof PRIORITY_CFG

// ─── Types ────────────────────────────────────────────────────────────────────

interface SprintsTabProps {
  sprints: Sprint[]
  tasks: Task[]
  projectId: string
  username: string
  readOnly?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) =>
  d ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d)) : null

function getSprintTasks(sprint: Sprint, tasks: Task[]) {
  return tasks.filter((t) => {
    if (!t.sprint) return false
    return typeof t.sprint === 'string' ? t.sprint === sprint.id : (t.sprint as Sprint).id === sprint.id
  })
}

function sortByRecent(sprints: Sprint[]) {
  return [...sprints].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function computeStats(sprints: Sprint[], tasks: Task[]) {
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const tasksThisMonth = tasks.filter((t) => {
    if (t.status !== 'completed') return false
    return new Date(t.completedAt ?? t.updatedAt) >= monthStart
  }).length

  const sprintsThisMonth = sprints.filter(
    (s) => s.status === 'finished' && new Date(s.updatedAt) >= monthStart
  ).length

  const totalTasks = tasks.length
  const doneTasks  = tasks.filter((t) => t.status === 'completed').length
  const rate       = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const finished  = sprints.filter((s) => s.status === 'finished')
  const velocity  = finished.length > 0
    ? Math.round(finished.reduce((acc, s) => acc + (s.completedTasksCount ?? 0), 0) / finished.length)
    : null

  const pCounts: Record<PriorityKey, number> = {
    urgent: tasks.filter((t) => t.priority === 'urgent').length,
    high:   tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low:    tasks.filter((t) => t.priority === 'low').length,
  }
  const pTotal = Object.values(pCounts).reduce((a, b) => a + b, 0)

  const statusCounts = {
    'in-progress': sprints.filter((s) => s.status === 'in-progress').length,
    delayed:       sprints.filter((s) => s.status === 'delayed').length,
    pending:       sprints.filter((s) => s.status === 'pending').length,
    finished:      finished.length,
  }

  return {
    tasksThisMonth, sprintsThisMonth, rate, velocity,
    pCounts, pTotal, totalTasks, doneTasks,
    statusCounts,
    monthLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  }
}

// ─── StatTile ────────────────────────────────────────────────────────────────

function StatTile({ icon: Icon, value, label, sub, accent }: {
  icon: LucideIcon
  value: string | number
  label: string
  sub: string
  accent: string
}) {
  return (
    <div className="rounded-lg border border-[#404040] bg-[rgba(255,255,255,0.02)] p-4 flex flex-col gap-3">
      <Icon className={cn('size-3.5', accent)} />
      <p className={cn('text-2xl font-bold tabular-nums leading-none', accent)}>{value}</p>
      <div>
        <p className="text-sm text-[#F0F0F0] leading-tight">{label}</p>
        <p className="text-xs text-[#A0A0A0] leading-tight mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

// ─── SprintMenu ──────────────────────────────────────────────────────────────

interface SprintMenuProps {
  sprint: Sprint
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  onDelete: (id: string) => void
  deletingId: string | null
}

function SprintMenu({ sprint, openMenuId, setOpenMenuId, onDelete, deletingId }: SprintMenuProps) {
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpenMenuId(openMenuId === sprint.id ? null : sprint.id)
        }}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          openMenuId === sprint.id
            ? 'bg-[#2D2D2D] text-[#A0A0A0]'
            : 'text-[#4A4A4A] hover:text-[#A0A0A0] hover:bg-[#2D2D2D]'
        )}
      >
        <MoreHorizontal className="size-3.5" />
      </button>
      {openMenuId === sprint.id && (
        <div className="absolute top-full right-0 mt-1 bg-[#1C1C1C] border border-[#404040] rounded-xl shadow-2xl z-50 overflow-hidden min-w-[150px]">
          <button
            type="button"
            onClick={() => onDelete(sprint.id)}
            disabled={deletingId === sprint.id}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
          >
            {deletingId === sprint.id
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Trash2 className="size-3.5" />
            }
            Delete sprint
          </button>
        </div>
      )}
    </div>
  )
}

// ─── SprintsTab ──────────────────────────────────────────────────────────────

export function SprintsTab({ sprints: initialSprints, tasks, projectId, username, readOnly }: SprintsTabProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sprints, setSprints]         = useState(initialSprints)
  const [openMenuId, setOpenMenuId]   = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  useEffect(() => {
    if (!openMenuId) return
    const handler = () => setOpenMenuId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenuId])

  const handleDeleteSprint = async (sprintId: string) => {
    setOpenMenuId(null)
    setDeletingId(sprintId)
    setSprints((prev) => prev.filter((s) => s.id !== sprintId))
    const result = await deleteSprint({ sprintId })
    setDeletingId(null)
    if (!result.success) setSprints(initialSprints)
    router.refresh()
  }

  const menuProps = { openMenuId, setOpenMenuId, onDelete: handleDeleteSprint, deletingId }
  const active    = sprints.filter((s) => s.status === 'in-progress' || s.status === 'delayed')
  const latest    = sortByRecent(sprints.filter((s) => s.status !== 'in-progress' && s.status !== 'delayed'))
  const stats     = computeStats(sprints, tasks)

  return (
    <div className="space-y-10">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F0F0F0]">Sprints</h2>
          {tasks.length > 0 && (
            <p className="text-sm text-[#A0A0A0] mt-0.5">
              {stats.doneTasks} of {stats.totalTasks} tasks completed
            </p>
          )}
        </div>
        {!readOnly && (
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--space-accent)] text-black hover:bg-[var(--space-accent)]/90 font-medium"
          >
            <Plus className="size-3.5 mr-1.5" />
            New Sprint
          </Button>
        )}
      </div>

      {sprints.length === 0 ? (

        /* ── Empty state ──────────────────────────────────────────── */
        <div className="rounded-xl border border-[#333333] bg-[#252525] p-12 text-center">
          <div className="inline-flex p-4 rounded-xl bg-[#252525] border border-[#404040] mb-5">
            <Zap className="size-8 text-[#6B6B6B]" />
          </div>
          <h3 className="text-xl font-bold text-[#F0F0F0] mb-2">No sprints yet</h3>
          <p className="text-base text-[#F0F0F0] max-w-xs mx-auto mb-5">
            {readOnly
              ? 'No sprints have been created for this project yet.'
              : 'Organize work into sprints to track progress and keep the team focused.'}
          </p>
          {!readOnly && (
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-[var(--space-accent)] text-black hover:bg-[var(--space-accent)]/90 font-medium"
            >
              <Plus className="size-3.5 mr-1.5" />
              New Sprint
            </Button>
          )}
        </div>

      ) : (
        <>

          {/* ── Section 1: Active Sprints ─────────────────────────── */}
          <section className="space-y-3">
            <p className="text-sm font-bold text-[#F0F0F0] uppercase tracking-widest">Active Sprints</p>

            {active.length > 0 ? (
              <div className={cn(
                'grid gap-4',
                active.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2',
              )}>
                {active.map((sprint) => {
                  const st      = getSprintTasks(sprint, tasks)
                  const inProg  = st.filter((t) => t.status === 'in-progress').length
                  const pending = st.filter((t) => t.status === 'pending').length
                  const done    = st.filter((t) => t.status === 'completed').length
                  const total   = st.length
                  const pct     = total > 0 ? Math.round((done / total) * 100) : 0
                  const cfg     = SPRINT_STATUS[sprint.status as keyof typeof SPRINT_STATUS] ?? SPRINT_STATUS.pending

                  return (
                    <Link
                      key={sprint.id}
                      href={`/u/${username}/projects/${projectId}/sprints/${sprint.id}`}
                      className={cn(
                        'group block rounded-xl border flex flex-col gap-4 p-7',
                        'transition-all duration-200',
                        'hover:-translate-y-px hover:shadow-lg hover:shadow-[#000000]/[0.40] hover:border-[#404040]',
                        cfg.bg, cfg.border,
                      )}
                    >
                      {/* Status + menu */}
                      <div className="flex items-center justify-between">
                        <span className={cn('flex items-center gap-1.5 text-xs font-medium', cfg.text)}>
                          <span className={cn('size-1.5 rounded-full animate-pulse', cfg.dot)} />
                          {cfg.label}
                        </span>
                        {!readOnly && <SprintMenu sprint={sprint} {...menuProps} />}
                      </div>

                      {/* Name + goal */}
                      <div>
                        <h4 className="text-xl font-bold text-[#F0F0F0] leading-snug">{sprint.name}</h4>
                        {(sprint.goalDescription || sprint.description) && (
                          <p className="text-sm text-[#F0F0F0] mt-1.5 leading-relaxed line-clamp-2">
                            {sprint.goalDescription || sprint.description}
                          </p>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#F0F0F0]">{done}/{total} tasks</span>
                          <span className={cn('font-medium tabular-nums', cfg.text)}>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#2D2D2D]">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', cfg.dot)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Task status pills */}
                      {total > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {inProg > 0 && (
                            <span className="text-[11px] bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)] rounded-full px-2 py-0.5" style={{ color: 'var(--space-accent)' }}>
                              {inProg} active
                            </span>
                          )}
                          {pending > 0 && (
                            <span className="text-xs text-[#A0A0A0] bg-[#2D2D2D] border border-[#404040] rounded-full px-2 py-0.5">
                              {pending} pending
                            </span>
                          )}
                          {done > 0 && (
                            <span className="text-[11px] text-green-400/70 bg-green-400/[0.05] border border-green-400/[0.12] rounded-full px-2 py-0.5">
                              {done} done
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer: dates + arrow */}
                      <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-[#404040]">
                        {sprint.startDate || sprint.endDate ? (
                          <span className="flex items-center gap-1 text-sm text-[#F0F0F0]">
                            <Calendar className="size-3 shrink-0" />
                            {fmtDate(sprint.startDate) ?? 'TBD'} → {fmtDate(sprint.endDate) ?? 'TBD'}
                          </span>
                        ) : (
                          <span className="text-sm text-[#A0A0A0]">No timeline</span>
                        )}
                        <ArrowRight className="size-4 text-[#4A4A4A] transition-all duration-200 group-hover:text-[#6B6B6B] group-hover:translate-x-1" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-[#404040] bg-[rgba(255,255,255,0.02)] p-5 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-[#2D2D2D] border border-[#404040] flex items-center justify-center shrink-0">
                  <Zap className="size-4 text-[#6B6B6B]" />
                </div>
                <div>
                  <p className="text-sm text-[#A0A0A0]">No active sprint</p>
                  <p className="text-sm text-[#A0A0A0] mt-0.5">Start a sprint to track live progress</p>
                </div>
              </div>
            )}
          </section>

          {/* ── Section 2: Analytics strip ───────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#F0F0F0] uppercase tracking-widest">Stats</p>
              <span className="text-sm text-[#A0A0A0]">{stats.monthLabel}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatTile icon={ListChecks} value={stats.tasksThisMonth}    label="Tasks done"     sub="this month"     accent="text-[#1E3A6E]" />
              <StatTile icon={Zap}        value={stats.sprintsThisMonth}  label="Sprints done"   sub="this month"     accent="text-green-400"         />
              <StatTile icon={Target}     value={`${stats.rate}%`}        label="Completion"     sub="overall rate"   accent="text-blue-400"          />
              <StatTile icon={TrendingUp} value={stats.velocity ?? '—'}   label="Velocity"       sub="tasks / sprint" accent="text-orange-400"        />
            </div>
          </div>

          {/* ── Section 3: Latest Sprints ────────────────────────── */}
          <section className="space-y-3">
            <p className="text-sm font-bold text-[#F0F0F0] uppercase tracking-widest">
              Latest Sprints{' '}
              <span className="normal-case font-normal text-[#6B6B6B]">· {latest.length}</span>
            </p>

            {latest.length > 0 ? (
              <div className="rounded-xl border border-[#404040] overflow-hidden divide-y divide-[#333333]">
                {latest.map((sprint) => {
                  const st         = getSprintTasks(sprint, tasks)
                  const done       = st.filter((t) => t.status === 'completed').length
                  const total      = st.length
                  const pct        = total > 0 ? Math.round((done / total) * 100) : 0
                  const cfg        = SPRINT_STATUS[sprint.status as keyof typeof SPRINT_STATUS] ?? SPRINT_STATUS.pending
                  const startLabel = fmtDate(sprint.startDate)
                  const endLabel   = fmtDate(sprint.endDate)

                  return (
                    <Link
                      key={sprint.id}
                      href={`/u/${username}/projects/${projectId}/sprints/${sprint.id}`}
                      className="group flex items-center gap-3 px-4 py-3.5 transition-all duration-150 hover:bg-[#2D2D2D] border-l-2 border-l-transparent hover:border-l-[rgba(139,156,182,0.30)]"
                    >
                      {/* Status dot + label */}
                      <span className={cn('flex items-center gap-1.5 text-xs font-medium shrink-0 w-[60px]', cfg.text)}>
                        <span className={cn('size-1.5 rounded-full shrink-0', cfg.dot)} />
                        {cfg.label}
                      </span>

                      {/* Name */}
                      <span className="flex-1 text-base font-semibold text-[#6B6B6B] group-hover:text-[#F0F0F0] truncate min-w-0 transition-colors duration-150">
                        {sprint.name}
                      </span>

                      {/* Dates */}
                      <span className="text-sm text-[#A0A0A0] shrink-0 w-[130px] hidden sm:block tabular-nums">
                        {startLabel ? `${startLabel} → ${endLabel ?? '…'}` : '—'}
                      </span>

                      {/* Mini progress bar */}
                      <div className="w-16 shrink-0 hidden md:block">
                        <div className="h-1 w-full rounded-full bg-[#2D2D2D]">
                          <div
                            className={cn('h-full rounded-full', cfg.dot)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* % */}
                      <span className="text-sm text-[#A0A0A0] shrink-0 w-8 text-right tabular-nums">
                        {pct}%
                      </span>

                      {/* Task count */}
                      <span className="text-sm text-[#A0A0A0] shrink-0 w-10 text-right tabular-nums hidden sm:block">
                        {done}/{total}
                      </span>

                      {/* Arrow */}
                      <ArrowRight className="size-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-150 group-hover:translate-x-0.5" style={{ color: 'var(--space-accent)' }} />

                      {/* Menu */}
                      {!readOnly && (
                        <span onClick={(e) => e.preventDefault()}>
                          <SprintMenu sprint={sprint} {...menuProps} />
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[#A0A0A0] py-2">No other sprints.</p>
            )}
          </section>

        </>
      )}

      {/* ── Modal ───────────────────────────────────────────────────── */}
      {!readOnly && (
        <CreateSprintModal
          projectId={projectId}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={() => { setIsModalOpen(false); router.refresh() }}
        />
      )}
    </div>
  )
}
