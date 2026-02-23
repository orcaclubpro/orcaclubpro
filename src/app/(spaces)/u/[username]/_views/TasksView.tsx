'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Check, Zap, Maximize2, Minimize2, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateTaskStatus } from '@/actions/tasks'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-gray-500',
  'in-progress': 'bg-intelligence-cyan',
  completed: 'bg-green-400',
  cancelled: 'bg-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'L', color: 'text-gray-500', bg: 'bg-gray-500/10 border-gray-500/20' },
  medium: { label: 'M', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  high: { label: 'H', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  urgent: { label: 'U', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
}

const SPRINT_STATUS_CFG: Record<string, { label: string; text: string; bar: string }> = {
  pending: { label: 'Pending', text: 'text-gray-500', bar: 'bg-gray-500/40' },
  'in-progress': { label: 'Active', text: 'text-intelligence-cyan', bar: 'bg-intelligence-cyan/60' },
  delayed: { label: 'Delayed', text: 'text-yellow-400', bar: 'bg-yellow-400/60' },
  finished: { label: 'Done', text: 'text-green-400', bar: 'bg-green-400/60' },
}

const ACTIVE_SPRINT_STATUSES = new Set(['in-progress', 'delayed'])
const COLUMN_STATUS_ORDER = ['in-progress', 'pending', 'completed', 'cancelled']
const UNASSIGNED = '__unassigned__'

// ─── helpers ──────────────────────────────────────────────────────────────────

function getProjectName(task: any): string {
  if (!task.project || typeof task.project !== 'object') return ''
  return task.project.name ?? ''
}

function getSprintId(task: any): string | null {
  if (!task.sprint) return null
  return typeof task.sprint === 'object' ? task.sprint.id : task.sprint
}

function getSprintObj(task: any): any | null {
  if (!task.sprint || typeof task.sprint !== 'object') return null
  return task.sprint
}

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d))
}

function isOverdue(d: string | null | undefined): boolean {
  return d ? new Date(d) < new Date() : false
}

function extractSprintMap(tasks: any[]): Map<string, any> {
  const map = new Map<string, any>()
  for (const task of tasks) {
    const sprint = getSprintObj(task)
    if (sprint?.id) map.set(sprint.id, sprint)
  }
  return map
}

function tasksForSprint(tasks: any[], sprintId: string | null): any[] {
  if (sprintId === null) return tasks.filter((t) => !t.sprint)
  return tasks.filter((t) => getSprintId(t) === sprintId)
}

function sortedByUpdated(sprints: any[]): any[] {
  return [...sprints].sort(
    (a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
  )
}

// ─── sidebar task item ────────────────────────────────────────────────────────

function SidebarTask({ task }: { task: any }) {
  const pc = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.medium
  const over = isOverdue(task.dueDate) && task.status !== 'completed'
  const projectName = getProjectName(task)

  return (
    <div className="flex items-center gap-2 px-2 py-[5px] rounded hover:bg-white/[0.03] transition-colors">
      <span className={`shrink-0 size-1.5 rounded-full ${STATUS_DOT[task.status] ?? 'bg-gray-500'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 truncate leading-tight">{task.title}</p>
        {projectName && <p className="text-[9px] text-gray-400 truncate">{projectName}</p>}
      </div>
      {over && <span className="shrink-0 size-1 rounded-full bg-red-400/70" />}
      <span className={`shrink-0 text-[9px] font-bold px-1 rounded border leading-4 ${pc.color} ${pc.bg}`}>
        {pc.label}
      </span>
    </div>
  )
}

// ─── column task card ─────────────────────────────────────────────────────────

function TaskCard({
  task,
  updating,
  onToggle,
}: {
  task: any
  updating: boolean
  onToggle: (task: any) => void
}) {
  const pc = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.medium
  const over = isOverdue(task.dueDate) && task.status !== 'completed'
  const done = task.status === 'completed' || task.status === 'cancelled'
  const projectName = getProjectName(task)

  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors ${
        updating ? 'opacity-50 pointer-events-none' : ''
      } ${done ? 'opacity-55' : ''}`}
    >
      <button
        type="button"
        onClick={() => onToggle(task)}
        title={done ? 'Mark pending' : 'Mark done'}
        className={`shrink-0 mt-[3px] size-4 rounded-full border flex items-center justify-center transition-all focus:outline-none ${
          done
            ? 'bg-green-400/80 border-green-400/80 hover:bg-green-300/70'
            : task.status === 'in-progress'
            ? 'border-intelligence-cyan/50 hover:border-intelligence-cyan'
            : 'border-white/20 hover:border-intelligence-cyan/50 hover:bg-intelligence-cyan/5'
        }`}
      >
        {done ? (
          <Check className="size-2.5 text-black" strokeWidth={3} />
        ) : task.status === 'in-progress' ? (
          <span className="size-1.5 rounded-full bg-intelligence-cyan/70 animate-pulse" />
        ) : null}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${done ? 'line-through text-gray-600' : 'text-gray-200'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {projectName && <span className="text-[10px] text-gray-600">{projectName}</span>}
          <span className={`text-[10px] font-semibold px-1.5 rounded border leading-4 ${pc.color} ${pc.bg}`}>
            {pc.label}
          </span>
          {task.dueDate && (
            <span className={`text-[10px] ${over ? 'text-red-400' : 'text-gray-600'}`}>
              {fmtDate(task.dueDate)}
              {over ? ' · overdue' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── sprint column ────────────────────────────────────────────────────────────

function SprintColumn({
  label,
  sprintMap,
  allTasks,
  selectedSprintId,
  onSelect,
  updatingIds,
  onToggle,
  bg = 'bg-[#0f0f0f]',
}: {
  label: string
  sprintMap: Map<string, any>
  allTasks: any[]
  selectedSprintId: string | null
  onSelect: (id: string | null) => void
  updatingIds: Set<string>
  onToggle: (task: any) => void
  bg?: string
}) {
  const sprint = selectedSprintId ? sprintMap.get(selectedSprintId) : null
  const sCfg = sprint ? (SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG.pending) : null

  const columnTasks = tasksForSprint(allTasks, selectedSprintId)
  const completedCount = columnTasks.filter((t) => t.status === 'completed').length
  const progress =
    columnTasks.length > 0 ? Math.round((completedCount / columnTasks.length) * 100) : 0

  const groups = COLUMN_STATUS_ORDER.map((st) => ({
    status: st,
    tasks: columnTasks.filter((t) => t.status === st),
  })).filter((g) => g.tasks.length > 0)

  const allSprints = Array.from(sprintMap.values())

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${bg}`}>
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[9px] font-bold gradient-text uppercase tracking-[0.15em]">{label}</span>
          {sCfg && <span className={`text-[10px] font-medium ${sCfg.text}`}>{sCfg.label}</span>}
        </div>
        <Select
          value={selectedSprintId ?? UNASSIGNED}
          onValueChange={(v) => onSelect(v === UNASSIGNED ? null : v)}
        >
          <SelectTrigger className="h-8 bg-white/[0.04] border-white/[0.08] text-white text-sm focus:border-intelligence-cyan/40">
            <SelectValue placeholder="Select sprint" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
            <SelectItem value={UNASSIGNED} className="text-gray-400">
              Unassigned tasks
            </SelectItem>
            {allSprints.map((s) => {
              const projName = typeof s.project === 'object' ? (s.project?.name ?? '') : ''
              return (
                <SelectItem key={s.id} value={s.id} className="text-white">
                  {s.name}
                  {projName && (
                    <span className="text-gray-500 ml-1.5 text-xs">· {projName}</span>
                  )}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {columnTasks.length > 0 && (
          <div className="flex items-center gap-2 mt-2.5">
            <div className="flex-1 h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  sCfg?.bar ?? 'bg-intelligence-cyan/60'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-300 shrink-0 tabular-nums">
              {completedCount}/{columnTasks.length}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {columnTasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 px-4">
            <p className="text-xs text-gray-400 text-center">
              {selectedSprintId === null
                ? 'No unassigned tasks'
                : sprint
                ? `No tasks in ${sprint.name}`
                : 'Select a sprint above'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 px-1">
            {groups.map(({ status, tasks }) => (
              <div key={status}>
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <span className={`size-1 rounded-full ${STATUS_DOT[status] ?? 'bg-gray-500'}`} />
                  <span className="text-[9px] font-semibold gradient-text uppercase tracking-[0.12em]">
                    {STATUS_LABEL[status]}
                  </span>
                  <span className="text-[9px] text-gray-400">· {tasks.length}</span>
                </div>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    updating={updatingIds.has(task.id)}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── board (shared between inline and popup) ──────────────────────────────────

function TaskBoard({
  tasks,
  sprintMap,
  activeSprints,
  sorted,
  isPopup,
  onExpandToggle,
}: {
  tasks: any[]
  sprintMap: Map<string, any>
  activeSprints: any[]
  sorted: any[]
  isPopup: boolean
  onExpandToggle: () => void
}) {
  const router = useRouter()
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [colAId, setColAId] = useState<string | null>(sorted[0]?.id ?? null)
  const [colBId, setColBId] = useState<string | null>(sorted[1]?.id ?? null)
  const completedCount = tasks.filter((t) => t.status === 'completed').length

  const handleToggle = async (task: any) => {
    const next = task.status === 'completed' || task.status === 'cancelled' ? 'pending' : 'completed'
    setUpdatingIds((p) => new Set(p).add(task.id))
    await updateTaskStatus({ taskId: task.id, status: next })
    setUpdatingIds((p) => {
      const s = new Set(p)
      s.delete(task.id)
      return s
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold gradient-text uppercase tracking-[0.14em]">
            Tasks
          </span>
          <span className="text-[10px] text-gray-300 tabular-nums">
            {tasks.length} · {completedCount} done
          </span>
        </div>
        <button
          type="button"
          onClick={onExpandToggle}
          title={isPopup ? 'Close' : 'Open in popup'}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-colors text-[10px]"
        >
          {isPopup ? (
            <>
              <X className="size-3" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Maximize2 className="size-3" />
              <span>Expand</span>
            </>
          )}
        </button>
      </div>

      {/* three panels */}
      <div className="flex-1 flex divide-x divide-white/[0.06] min-h-0 overflow-hidden">
        {/* left sidebar */}
        <aside className="w-52 shrink-0 bg-[#0c0c0c] flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] shrink-0">
            <Zap className="size-3 text-intelligence-cyan shrink-0" />
            <span className="text-[9px] font-bold gradient-text uppercase tracking-[0.12em]">
              Active Sprints
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeSprints.length === 0 ? (
              <div className="flex items-center justify-center h-32 px-4">
                <p className="text-xs text-gray-400 text-center">No active sprints</p>
              </div>
            ) : (
              <div className="py-2">
                {activeSprints.map((sprint) => {
                  const sTasks = tasksForSprint(tasks, sprint.id)
                  const done = sTasks.filter((t) => t.status === 'completed').length
                  const pct = sTasks.length > 0 ? Math.round((done / sTasks.length) * 100) : 0
                  const cfg = SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG.pending
                  const projName =
                    typeof sprint.project === 'object' ? (sprint.project?.name ?? '') : ''

                  return (
                    <div key={sprint.id} className="mb-4">
                      <div className="px-3 py-1.5">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-medium text-white truncate leading-tight">
                            {sprint.name}
                          </span>
                          <span className={`shrink-0 text-[9px] font-bold ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {projName && (
                          <p className="text-[9px] text-gray-400 truncate mb-1.5">{projName}</p>
                        )}
                        {sTasks.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="flex-1 h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cfg.bar}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-400 shrink-0 tabular-nums">
                              {pct}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-1">
                        {sTasks.length === 0 ? (
                          <p className="text-[10px] text-gray-400 px-2 py-1">No tasks</p>
                        ) : (
                          <>
                            {sTasks.slice(0, 8).map((t) => (
                              <SidebarTask key={t.id} task={t} />
                            ))}
                            {sTasks.length > 8 && (
                              <p className="text-[10px] text-gray-400 px-2 py-1">
                                +{sTasks.length - 8} more
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Column A */}
        <SprintColumn
          label="Sprint A"
          sprintMap={sprintMap}
          allTasks={tasks}
          selectedSprintId={colAId}
          onSelect={setColAId}
          updatingIds={updatingIds}
          onToggle={handleToggle}
          bg="bg-[#0e0e0e]"
        />

        {/* Column B */}
        <SprintColumn
          label="Sprint B"
          sprintMap={sprintMap}
          allTasks={tasks}
          selectedSprintId={colBId}
          onSelect={setColBId}
          updatingIds={updatingIds}
          onToggle={handleToggle}
          bg="bg-[#0f0f0f]"
        />
      </div>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

interface TasksViewProps {
  tasks: any[]
}

export function TasksView({ tasks }: TasksViewProps) {
  const [popup, setPopup] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close popup on Escape
  useEffect(() => {
    if (!popup) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopup(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [popup])

  const sprintMap = extractSprintMap(tasks)
  const sorted = sortedByUpdated(Array.from(sprintMap.values()))
  const activeSprints = sorted.filter((s) => ACTIVE_SPRINT_STATUSES.has(s.status ?? ''))

  const boardProps = { tasks, sprintMap, activeSprints, sorted }

  return (
    <>
      {/* inline board — fills available height edge-to-edge */}
      <div
        className="rounded-xl border border-white/[0.06] overflow-hidden"
        style={{ height: 'calc(100svh - 64px)' }}
      >
        <TaskBoard {...boardProps} isPopup={false} onExpandToggle={() => setPopup(true)} />
      </div>

      {/* fullscreen popup portal */}
      {mounted && popup &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setPopup(false) }}
          >
            <div
              className="w-full h-full max-w-[100vw] max-h-[100vh] rounded-xl border border-white/[0.08] overflow-hidden shadow-2xl"
              style={{ height: 'calc(100vh - 2rem)', maxWidth: 'calc(100vw - 2rem)' }}
            >
              <TaskBoard {...boardProps} isPopup onExpandToggle={() => setPopup(false)} />
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
