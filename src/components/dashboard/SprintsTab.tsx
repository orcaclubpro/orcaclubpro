'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Loader2, Zap, ArrowRight, CheckCircle2,
  MoreHorizontal, Trash2, Calendar, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteSprint } from '@/actions/sprints'
import { cn } from '@/lib/utils'
import type { Sprint, Task } from '@/types/payload-types'
import { CreateSprintModal } from './CreateSprintModal'

// ─── Types & constants ────────────────────────────────────────────────────────

interface SprintsTabProps {
  sprints: Sprint[]
  tasks: Task[]
  projectId: string
  username: string
  readOnly?: boolean
}

const SPRINT_STATUS = {
  pending:       { dot: 'bg-gray-500',          text: 'text-gray-400',          label: 'Planned',  bg: 'bg-white/[0.02]',             border: 'border-white/[0.07]'             },
  'in-progress': { dot: 'bg-intelligence-cyan', text: 'text-intelligence-cyan', label: 'Active',   bg: 'bg-intelligence-cyan/[0.04]', border: 'border-intelligence-cyan/[0.15]' },
  delayed:       { dot: 'bg-orange-400',        text: 'text-orange-400',        label: 'Delayed',  bg: 'bg-orange-400/[0.04]',        border: 'border-orange-400/[0.15]'        },
  finished:      { dot: 'bg-green-400',         text: 'text-green-400',         label: 'Finished', bg: 'bg-green-400/[0.03]',         border: 'border-green-400/[0.12]'         },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) =>
  d ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d)) : null

function getSprintTasks(sprint: Sprint, tasks: Task[]) {
  return tasks.filter((t) => {
    if (!t.sprint) return false
    return typeof t.sprint === 'string' ? t.sprint === sprint.id : t.sprint.id === sprint.id
  })
}

function sortByUpdated(sprints: Sprint[]): Sprint[] {
  return [...sprints].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

// ─── Sprint 3-dot menu ────────────────────────────────────────────────────────

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

// ─── SprintsTab ───────────────────────────────────────────────────────────────

export function SprintsTab({ sprints: initialSprints, tasks, projectId, username, readOnly }: SprintsTabProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sprints, setSprints] = useState(initialSprints)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedHistory, setExpandedHistory] = useState<string[]>([])

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

  const sorted = sortByUpdated(sprints)
  const carouselSprints = sorted.slice(0, 3)   // top 3 most recently updated
  const historySprints  = sorted.slice(3, 8)   // next 5

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Sprints</h2>
          {totalTasks > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">{completedTasks} of {totalTasks} tasks completed</p>
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
          {/* ── Recent carousel ─────────────────────────────────────── */}
          <section>
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Recent</p>

            <div
              className="flex gap-4 overflow-x-auto pb-3"
              style={{ scrollbarWidth: 'none' } as React.CSSProperties}
            >
              {carouselSprints.map((sprint, i) => {
                const sprintTasks = getSprintTasks(sprint, tasks)
                const done  = sprintTasks.filter((t) => t.status === 'completed').length
                const total = sprintTasks.length
                const pct   = total > 0 ? (done / total) * 100 : 0
                const cfg   = SPRINT_STATUS[sprint.status as keyof typeof SPRINT_STATUS] ?? SPRINT_STATUS.pending
                const startLabel = fmtDate(sprint.startDate)
                const endLabel   = fmtDate(sprint.endDate)
                const isFeatured = i === 0

                return (
                  <div
                    key={sprint.id}
                    className={cn(
                      'shrink-0 rounded-xl border transition-all duration-200',
                      isFeatured ? 'w-[340px] sm:w-[390px]' : 'w-[260px] sm:w-[295px]',
                      isFeatured ? cn(cfg.bg, cfg.border) : 'bg-white/[0.01] border-white/[0.07]',
                    )}
                  >
                    <div className={cn('flex flex-col h-full p-5', isFeatured ? 'gap-4' : 'gap-3')}>

                      {/* Top: badges + menu */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isFeatured && (
                            <span className="text-[10px] font-semibold text-intelligence-cyan bg-intelligence-cyan/[0.08] border border-intelligence-cyan/[0.18] rounded-full px-2 py-0.5 leading-none shrink-0">
                              Latest
                            </span>
                          )}
                          <span className={cn('flex items-center gap-1.5 text-xs shrink-0', cfg.text)}>
                            <span className={cn('size-1.5 rounded-full shrink-0', cfg.dot)} />
                            {cfg.label}
                          </span>
                        </div>
                        {!readOnly && <SprintMenu sprint={sprint} {...menuProps} />}
                      </div>

                      {/* Name + goal */}
                      <div className="min-w-0">
                        <h4 className={cn('font-semibold text-white leading-snug truncate', isFeatured ? 'text-[15px]' : 'text-sm')}>
                          {sprint.name}
                        </h4>
                        {isFeatured && sprint.goalDescription && (
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                            {sprint.goalDescription}
                          </p>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="space-y-1.5 mt-auto">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{done}/{total} tasks</span>
                          {total > 0 && <span className="text-gray-600">{Math.round(pct)}%</span>}
                        </div>
                        <div className="h-1 w-full rounded-full bg-white/[0.08]">
                          <div
                            className={cn('h-full rounded-full transition-all', cfg.dot)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: dates + open */}
                      <div className="flex items-center justify-between pt-0.5">
                        {(startLabel || endLabel) ? (
                          <span className="text-xs text-gray-600 flex items-center gap-1 min-w-0">
                            <Calendar className="size-3 shrink-0" />
                            <span className="truncate">{startLabel ?? 'TBD'} → {endLabel ?? 'TBD'}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-700">No timeline</span>
                        )}
                        <Link
                          href={`/u/${username}/projects/${projectId}/sprints/${sprint.id}`}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors shrink-0 ml-2"
                        >
                          Open <ArrowRight className="size-3" />
                        </Link>
                      </div>

                      {/* All-done badge (featured only) */}
                      {isFeatured && sprint.status === 'finished' && total > 0 && done === total && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                          <CheckCircle2 className="size-3.5 text-green-400" />
                          <span className="text-xs text-green-400/70">All tasks completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Sprint history ───────────────────────────────────────── */}
          {historySprints.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-3">History</p>
              <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.05]">
                {historySprints.map((sprint) => {
                  const sprintTasks = getSprintTasks(sprint, tasks)
                  const done  = sprintTasks.filter((t) => t.status === 'completed').length
                  const total = sprintTasks.length
                  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
                  const cfg   = SPRINT_STATUS[sprint.status as keyof typeof SPRINT_STATUS] ?? SPRINT_STATUS.pending
                  const isExpanded  = expandedHistory.includes(sprint.id)
                  const startLabel  = fmtDate(sprint.startDate)
                  const endLabel    = fmtDate(sprint.endDate)

                  return (
                    <div key={sprint.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistory((prev) =>
                            prev.includes(sprint.id)
                              ? prev.filter((id) => id !== sprint.id)
                              : [...prev, sprint.id]
                          )
                        }
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            'size-3.5 text-gray-600 shrink-0 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                        <span className="flex-1 truncate text-sm font-medium text-gray-300">{sprint.name}</span>
                        <span className={cn('flex items-center gap-1.5 text-xs shrink-0', cfg.text)}>
                          <span className={cn('size-1.5 rounded-full', cfg.dot)} />
                          {cfg.label}
                        </span>
                        {(startLabel || endLabel) && (
                          <span className="text-xs text-gray-600 hidden sm:block shrink-0">
                            {startLabel ?? 'TBD'} → {endLabel ?? 'TBD'}
                          </span>
                        )}
                        <span className="text-xs text-gray-600 shrink-0 w-8 text-right">{pct}%</span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pl-10 pb-4 pt-3 space-y-3 border-t border-white/[0.04] bg-white/[0.01]">
                          {sprint.goalDescription && (
                            <p className="text-xs text-gray-500 leading-relaxed">{sprint.goalDescription}</p>
                          )}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>{done}/{total} tasks completed</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-white/[0.08]">
                              <div className={cn('h-full rounded-full', cfg.dot)} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <Link
                            href={`/u/${username}/projects/${projectId}/sprints/${sprint.id}`}
                            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                          >
                            View sprint <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Create Sprint Modal ──────────────────────────────────────── */}
      {!readOnly && (
        <CreateSprintModal
          projectId={projectId}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={() => {
            setIsModalOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}


