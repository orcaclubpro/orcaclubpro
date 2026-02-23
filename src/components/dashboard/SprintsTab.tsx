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
  pending:       { dot: 'bg-gray-500',          text: 'text-gray-400',          label: 'Planned',  bg: 'bg-white/[0.02]',             border: 'border-white/[0.07]'             },
  'in-progress': { dot: 'bg-intelligence-cyan', text: 'text-intelligence-cyan', label: 'Active',   bg: 'bg-intelligence-cyan/[0.04]', border: 'border-intelligence-cyan/[0.15]' },
  delayed:       { dot: 'bg-orange-400',        text: 'text-orange-400',        label: 'Delayed',  bg: 'bg-orange-400/[0.04]',        border: 'border-orange-400/[0.15]'        },
  finished:      { dot: 'bg-green-400',         text: 'text-green-400',         label: 'Finished', bg: 'bg-green-400/[0.03]',         border: 'border-green-400/[0.12]'         },
} as const

const STATUS_SORT: Record<string, number> = { 'in-progress': 0, delayed: 1, pending: 2, finished: 3 }

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

function sortSprints(sprints: Sprint[]) {
  return [...sprints].sort((a, b) => {
    const diff = (STATUS_SORT[a.status] ?? 4) - (STATUS_SORT[b.status] ?? 4)
    return diff !== 0 ? diff : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
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
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col gap-2">
      <Icon className={cn('size-3.5', accent)} />
      <p className={cn('text-2xl font-bold tabular-nums leading-none', accent)}>{value}</p>
      <div>
        <p className="text-[11px] text-gray-400 leading-tight">{label}</p>
        <p className="text-[10px] text-gray-700 leading-tight mt-0.5">{sub}</p>
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
            ? 'bg-white/[0.08] text-gray-300'
            : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.06]'
        )}
      >
        <MoreHorizontal className="size-3.5" />
      </button>
      {openMenuId === sprint.id && (
        <div className="absolute top-full right-0 mt-1 bg-[#111] border border-white/[0.10] rounded-xl shadow-2xl z-50 overflow-hidden min-w-[150px]">
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
  const sorted    = sortSprints(sprints)
  const active    = sorted.filter((s) => s.status === 'in-progress' || s.status === 'delayed')
  const stats     = computeStats(sprints, tasks)

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Sprints</h2>
          {tasks.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {stats.doneTasks} of {stats.totalTasks} tasks completed
            </p>
          )}
        </div>
        {!readOnly && (
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium"
          >
            <Plus className="size-3.5 mr-1.5" />
            New Sprint
          </Button>
        )}
      </div>

      {sprints.length === 0 ? (

        /* ── Empty state ──────────────────────────────────────────── */
        <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] p-12 text-center">
          <div className="inline-flex p-4 rounded-xl bg-[#1c1c1c] border border-white/[0.10] mb-5">
            <Zap className="size-8 text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1.5">No sprints yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-5">
            {readOnly
              ? 'No sprints have been created for this project yet.'
              : 'Organize work into sprints to track progress and keep the team focused.'}
          </p>
          {!readOnly && (
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium"
            >
              <Plus className="size-3.5 mr-1.5" />
              New Sprint
            </Button>
          )}
        </div>

      ) : (
        <>

          {/* ── Section 1: Current sprints + Analytics ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_296px] gap-5 items-start">

            {/* ── Current sprints ── */}
            <div>
              <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Current</p>

              {active.length > 0 ? (
                <div
                  className={cn('flex gap-4', active.length > 1 && 'overflow-x-auto pb-2')}
                  style={active.length > 1 ? { scrollbarWidth: 'none' } as React.CSSProperties : undefined}
                >
                  {active.map((sprint) => {
                    const st      = getSprintTasks(sprint, tasks)
                    const inProg  = st.filter((t) => t.status === 'in-progress').length
                    const pending = st.filter((t) => t.status === 'pending').length
                    const done    = st.filter((t) => t.status === 'completed').length
                    const total   = st.length
                    const pct     = total > 0 ? Math.round((done / total) * 100) : 0
                    const cfg     = SPRINT_STATUS[sprint.status as keyof typeof SPRINT_STATUS] ?? SPRINT_STATUS.pending

                    return (
                      <div
                        key={sprint.id}
                        className={cn(
                          'rounded-xl border flex flex-col gap-4 p-5',
                          active.length === 1 ? 'w-full' : 'shrink-0 w-[320px] sm:w-[360px]',
                          cfg.bg, cfg.border,
                        )}
                      >
                        {/* Status + menu */}
                        <div className="flex items-center justify-between">
                          <span className={cn('flex items-center gap-1.5 text-xs', cfg.text)}>
                            <span className={cn('size-1.5 rounded-full', cfg.dot)} />
                            {cfg.label}
                          </span>
                          {!readOnly && <SprintMenu sprint={sprint} {...menuProps} />}
                        </div>

                        {/* Name + goal */}
                        <div>
                          <h4 className="text-[15px] font-semibold text-white leading-snug">{sprint.name}</h4>
                          {sprint.goalDescription && (
                            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                              {sprint.goalDescription}
                            </p>
                          )}
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">{done}/{total} tasks</span>
                            <span className={cfg.text}>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/[0.08]">
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
                              <span className="text-[11px] text-intelligence-cyan/80 bg-intelligence-cyan/[0.06] border border-intelligence-cyan/[0.12] rounded-full px-2 py-0.5">
                                {inProg} active
                              </span>
                            )}
                            {pending > 0 && (
                              <span className="text-[11px] text-gray-500 bg-white/[0.04] border border-white/[0.07] rounded-full px-2 py-0.5">
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

                        {/* Footer: dates + open */}
                        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-white/[0.06]">
                          {sprint.startDate || sprint.endDate ? (
                            <span className="flex items-center gap-1 text-xs text-gray-600">
                              <Calendar className="size-3 shrink-0" />
                              {fmtDate(sprint.startDate) ?? 'TBD'} → {fmtDate(sprint.endDate) ?? 'TBD'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-700">No timeline</span>
                          )}
                          <Link
                            href={`/u/${username}/projects/${projectId}/sprints/${sprint.id}`}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            Open <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Zap className="size-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">No active sprint</p>
                    <p className="text-xs text-gray-600 mt-0.5">Start a sprint to track live progress</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Analytics panel ── */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.01] p-5 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Portfolio</p>
                <span className="text-[10px] text-gray-700">{stats.monthLabel}</span>
              </div>

              {/* 2×2 stat tiles */}
              <div className="grid grid-cols-2 gap-2">
                <StatTile icon={ListChecks} value={stats.tasksThisMonth}    label="Tasks done"    sub="this month"    accent="text-intelligence-cyan" />
                <StatTile icon={Zap}        value={stats.sprintsThisMonth}  label="Sprints done"  sub="this month"    accent="text-green-400"         />
                <StatTile icon={Target}     value={`${stats.rate}%`}        label="Completion"    sub="overall rate"  accent="text-blue-400"          />
                <StatTile icon={TrendingUp} value={stats.velocity ?? '—'}   label="Velocity"      sub="tasks / sprint" accent="text-orange-400"       />
              </div>

              {/* Sprint status breakdown */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest">Sprint status</p>
                <div className="space-y-1.5">
                  {(['in-progress', 'delayed', 'pending', 'finished'] as const).map((s) => {
                    const count = stats.statusCounts[s]
                    if (count === 0) return null
                    const cfg = SPRINT_STATUS[s]
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <span className={cn('size-1.5 rounded-full shrink-0', cfg.dot)} />
                        <span className="text-[11px] text-gray-500 flex-1">{cfg.label}</span>
                        <span className="text-[11px] text-gray-400 font-medium tabular-nums">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Priority breakdown */}
              {stats.pTotal > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest">Task priority</p>
                  {/* Stacked bar */}
                  <div className="flex h-1.5 rounded-full overflow-hidden gap-[1px]">
                    {(Object.keys(PRIORITY_CFG) as PriorityKey[]).map((key) => {
                      const w = (stats.pCounts[key] / stats.pTotal) * 100
                      if (w === 0) return null
                      return <div key={key} className={PRIORITY_CFG[key].bar} style={{ width: `${w}%` }} />
                    })}
                  </div>
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {(Object.keys(PRIORITY_CFG) as PriorityKey[]).map((key) => {
                      if (stats.pCounts[key] === 0) return null
                      return (
                        <div key={key} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                          <span className={cn('size-1.5 rounded-full shrink-0', PRIORITY_CFG[key].bar)} />
                          {PRIORITY_CFG[key].label}: {stats.pCounts[key]}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 2: All sprints ────────────────────────────── */}
          <section>
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
              All Sprints{' '}
              <span className="normal-case font-normal text-gray-700">· {sprints.length}</span>
            </p>
            <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.05]">
              {sorted.map((sprint) => {
                const st         = getSprintTasks(sprint, tasks)
                const done       = st.filter((t) => t.status === 'completed').length
                const total      = st.length
                const pct        = total > 0 ? Math.round((done / total) * 100) : 0
                const cfg        = SPRINT_STATUS[sprint.status as keyof typeof SPRINT_STATUS] ?? SPRINT_STATUS.pending
                const startLabel = fmtDate(sprint.startDate)
                const endLabel   = fmtDate(sprint.endDate)

                return (
                  <div
                    key={sprint.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Status */}
                    <span className={cn('flex items-center gap-1.5 text-[11px] font-medium shrink-0 w-[60px]', cfg.text)}>
                      <span className={cn('size-1.5 rounded-full shrink-0', cfg.dot)} />
                      {cfg.label}
                    </span>

                    {/* Name */}
                    <span className="flex-1 text-sm font-medium text-white truncate min-w-0">
                      {sprint.name}
                    </span>

                    {/* Dates */}
                    <span className="text-[11px] text-gray-600 shrink-0 w-[130px] hidden sm:block">
                      {startLabel ? `${startLabel} → ${endLabel ?? '…'}` : '—'}
                    </span>

                    {/* Mini progress bar */}
                    <div className="w-16 shrink-0 hidden md:block">
                      <div className="h-1 w-full rounded-full bg-white/[0.08]">
                        <div
                          className={cn('h-full rounded-full', cfg.dot)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* % */}
                    <span className="text-[11px] text-gray-500 shrink-0 w-8 text-right tabular-nums">
                      {pct}%
                    </span>

                    {/* Task count */}
                    <span className="text-[11px] text-gray-600 shrink-0 w-10 text-right tabular-nums hidden sm:block">
                      {done}/{total}
                    </span>

                    {/* Open */}
                    <Link
                      href={`/u/${username}/projects/${projectId}/sprints/${sprint.id}`}
                      className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      Open <ArrowRight className="size-3" />
                    </Link>

                    {/* Menu */}
                    {!readOnly && <SprintMenu sprint={sprint} {...menuProps} />}
                  </div>
                )
              })}
            </div>
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
