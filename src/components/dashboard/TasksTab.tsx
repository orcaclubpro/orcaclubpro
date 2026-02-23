'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Check, Zap } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTask, updateTaskStatus } from '@/actions/tasks'
import type { Task, Sprint } from '@/types/payload-types'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<Task['status'], string> = {
  pending: 'bg-gray-500',
  'in-progress': 'bg-intelligence-cyan',
  completed: 'bg-green-400',
  cancelled: 'bg-red-400',
}

const STATUS_LABEL: Record<Task['status'], string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const PRIORITY_CFG = {
  low: { label: 'L', color: 'text-gray-500', bg: 'bg-gray-500/10 border-gray-500/20' },
  medium: { label: 'M', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  high: { label: 'H', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  urgent: { label: 'U', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
} satisfies Record<NonNullable<Task['priority']>, { label: string; color: string; bg: string }>

const SPRINT_STATUS_CFG: Record<string, { label: string; text: string; bar: string }> = {
  pending: { label: 'Pending', text: 'text-gray-500', bar: 'bg-gray-500/40' },
  'in-progress': { label: 'Active', text: 'text-intelligence-cyan', bar: 'bg-intelligence-cyan/60' },
  delayed: { label: 'Delayed', text: 'text-yellow-400', bar: 'bg-yellow-400/60' },
  finished: { label: 'Done', text: 'text-green-400', bar: 'bg-green-400/60' },
}

const ACTIVE_SPRINT_STATUSES = new Set<string>(['in-progress', 'delayed'])
const COLUMN_STATUS_ORDER: Task['status'][] = ['in-progress', 'pending', 'completed', 'cancelled']
const UNASSIGNED = '__unassigned__'

type Priority = NonNullable<Task['priority']>

// ─── interfaces ───────────────────────────────────────────────────────────────

interface TasksTabProps {
  tasks: Task[]
  sprints: Sprint[]
  projectId: string
  readOnly?: boolean
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d))

const isOverdue = (d: string | null | undefined): boolean =>
  d ? new Date(d) < new Date() : false

function sprintIdOf(task: Task): string | null {
  if (!task.sprint) return null
  return typeof task.sprint === 'string' ? task.sprint : task.sprint.id
}

function tasksForSprint(tasks: Task[], sprintId: string | null): Task[] {
  if (sprintId === null) return tasks.filter((t) => !t.sprint)
  return tasks.filter((t) => sprintIdOf(t) === sprintId)
}

function sortedByUpdated(sprints: Sprint[]): Sprint[] {
  return [...sprints].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

// ─── sidebar task item ────────────────────────────────────────────────────────

function SidebarTask({ task }: { task: Task }) {
  const p = (task.priority ?? 'medium') as Priority
  const pc = PRIORITY_CFG[p]
  const over = isOverdue(task.dueDate) && task.status !== 'completed'
  return (
    <div className="flex items-center gap-2 px-2 py-[5px] rounded hover:bg-white/[0.03] transition-colors">
      <span className={`shrink-0 size-1.5 rounded-full ${STATUS_DOT[task.status]}`} />
      <span className="flex-1 min-w-0 text-xs text-white truncate leading-tight">
        {task.title}
      </span>
      {over && <span className="shrink-0 size-1 rounded-full bg-red-400/70" />}
      <span className={`shrink-0 text-[10px] font-bold px-1 rounded border leading-4 ${pc.color} ${pc.bg}`}>
        {pc.label}
      </span>
    </div>
  )
}

// ─── column task card ─────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task
  updating: boolean
  onToggle: (task: Task) => void
  readOnly?: boolean
}

function TaskCard({ task, updating, onToggle, readOnly }: TaskCardProps) {
  const p = (task.priority ?? 'medium') as Priority
  const pc = PRIORITY_CFG[p]
  const over = isOverdue(task.dueDate) && task.status !== 'completed'
  const done = task.status === 'completed' || task.status === 'cancelled'

  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors ${
        updating ? 'opacity-50 pointer-events-none' : ''
      } ${done ? 'opacity-55' : ''}`}
    >
      {readOnly ? (
        <span className="shrink-0 mt-[3px] size-5 flex items-center justify-center">
          <span className={`size-1.5 rounded-full ${STATUS_DOT[task.status]}`} />
        </span>
      ) : (
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
      )}

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            done ? 'line-through text-gray-500' : 'text-white'
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] font-semibold px-1.5 rounded border leading-4 ${pc.color} ${pc.bg}`}
          >
            {pc.label}
          </span>
          {task.dueDate && (
            <span className={`text-xs ${over ? 'text-red-400' : 'text-gray-400'}`}>
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

interface SprintColumnProps {
  label: string
  sprints: Sprint[]
  allTasks: Task[]
  selectedSprintId: string | null
  onSelect: (id: string | null) => void
  updatingIds: Set<string>
  onToggle: (task: Task) => void
  readOnly?: boolean
  bg?: string
}

function SprintColumn({
  label,
  sprints,
  allTasks,
  selectedSprintId,
  onSelect,
  updatingIds,
  onToggle,
  readOnly,
  bg = 'bg-[#0f0f0f]',
}: SprintColumnProps) {
  const sprint = selectedSprintId ? sprints.find((s) => s.id === selectedSprintId) : null
  const sCfg = sprint
    ? (SPRINT_STATUS_CFG[sprint.status ?? 'pending'] ?? SPRINT_STATUS_CFG.pending)
    : null

  const columnTasks = tasksForSprint(allTasks, selectedSprintId)
  const completedCount = columnTasks.filter((t) => t.status === 'completed').length
  const progress =
    columnTasks.length > 0 ? Math.round((completedCount / columnTasks.length) * 100) : 0

  const groups = COLUMN_STATUS_ORDER.map((st) => ({
    status: st,
    tasks: columnTasks.filter((t) => t.status === st),
  })).filter((g) => g.tasks.length > 0)

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${bg}`}>
      {/* column header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-white uppercase tracking-[0.12em]">
            {label}
          </span>
          {sCfg && (
            <span className={`text-xs font-medium ${sCfg.text}`}>{sCfg.label}</span>
          )}
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
            {sprints.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-white">
                {s.name}
              </SelectItem>
            ))}
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
            <span className="text-sm text-white font-semibold shrink-0 tabular-nums">
              {completedCount}/{columnTasks.length}
            </span>
          </div>
        )}
      </div>

      {/* tasks */}
      <div className="flex-1 overflow-y-auto py-2">
        {columnTasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 px-4">
            <p className="text-sm text-gray-300 text-center">
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
                  <span className={`size-1 rounded-full ${STATUS_DOT[status]}`} />
                  <span className="text-xs font-bold text-white uppercase tracking-[0.08em]">
                    {STATUS_LABEL[status]}
                  </span>
                  <span className="text-xs text-gray-300">· {tasks.length}</span>
                </div>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    updating={updatingIds.has(task.id)}
                    onToggle={onToggle}
                    readOnly={readOnly}
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

// ─── create task sheet ────────────────────────────────────────────────────────

interface CreateTaskSheetProps {
  projectId: string
  sprints: Sprint[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreateTaskSheet({ projectId, sprints, open, onOpenChange }: CreateTaskSheetProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [sprintId, setSprintId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    setSprintId('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) { setError('Task title is required'); return }
    setIsLoading(true)
    const result = await createTask({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      sprintId: sprintId && sprintId !== 'none' ? sprintId : undefined,
    })
    setIsLoading(false)
    if (!result.success) { setError(result.error ?? 'Failed to create task'); return }
    reset()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-black/95 border-white/[0.08] w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-0">
          <SheetTitle className="text-lg font-semibold text-white">New Task</SheetTitle>
          <SheetDescription className="text-sm text-gray-200">
            Add a task to this project.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6 px-4 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fix login redirect issue"
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-intelligence-cyan/40 h-9 text-sm"
              disabled={isLoading}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-priority" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Priority
            </Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)} disabled={isLoading}>
              <SelectTrigger
                id="task-priority"
                className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/40 h-9 text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-white/[0.08]">
                <SelectItem value="low" className="text-gray-500">Low</SelectItem>
                <SelectItem value="medium" className="text-blue-400">Medium</SelectItem>
                <SelectItem value="high" className="text-yellow-400">High</SelectItem>
                <SelectItem value="urgent" className="text-red-400">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Due Date
            </Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/40 h-9 text-sm"
              disabled={isLoading}
            />
          </div>

          {sprints.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="task-sprint" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Sprint
              </Label>
              <Select value={sprintId} onValueChange={setSprintId} disabled={isLoading}>
                <SelectTrigger
                  id="task-sprint"
                  className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/40 h-9 text-sm"
                >
                  <SelectValue placeholder="No sprint" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/[0.08]">
                  <SelectItem value="none" className="text-gray-500">No sprint</SelectItem>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id} className="text-white">
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Description
            </Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or context..."
              rows={3}
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-intelligence-cyan/40 text-sm resize-none"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onOpenChange(false) }}
              disabled={isLoading}
              className="flex-1 bg-white/[0.02] border-white/[0.08] text-gray-300 hover:bg-white/[0.05] hover:text-white text-sm h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-sm h-9"
            >
              {isLoading ? (
                <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Creating...</>
              ) : (
                <><Plus className="size-3.5 mr-1.5" />Create Task</>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

export function TasksTab({ tasks, sprints, projectId, readOnly }: TasksTabProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const sorted = sortedByUpdated(sprints)
  const [colAId, setColAId] = useState<string | null>(sorted[0]?.id ?? null)
  const [colBId, setColBId] = useState<string | null>(sorted[1]?.id ?? null)

  const activeSprints = sprints.filter((s) => ACTIVE_SPRINT_STATUSES.has(s.status ?? ''))
  const completedCount = tasks.filter((t) => t.status === 'completed').length

  const handleToggle = async (task: Task) => {
    const next: Task['status'] =
      task.status === 'completed' || task.status === 'cancelled' ? 'pending' : 'completed'
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
    <div
      className="flex flex-col rounded-xl border border-white/[0.06] overflow-hidden"
      style={{ height: 'calc(100vh - 12rem)' }}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#0d0d0d] shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-white">Tasks</h2>
          <span className="text-sm text-gray-200">
            {tasks.length} total · {completedCount} done
          </span>
        </div>
        {!readOnly && (
          <Button
            onClick={() => setSheetOpen(true)}
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-xs h-7 px-3"
          >
            <Plus className="size-3 mr-1" />
            New Task
          </Button>
        )}
      </div>

      {/* three-panel layout */}
      <div className="flex-1 flex divide-x divide-white/[0.06] min-h-0 overflow-hidden">
        {/* left sidebar — active sprints overview */}
        <aside className="w-60 shrink-0 bg-[#0c0c0c] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/[0.06] shrink-0">
            <Zap className="size-3 text-intelligence-cyan shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-[0.08em]">
              Active Sprints
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeSprints.length === 0 ? (
              <div className="flex items-center justify-center h-32 px-4">
                <p className="text-sm text-gray-200 text-center">No active sprints</p>
              </div>
            ) : (
              <div className="py-2">
                {activeSprints.map((sprint) => {
                  const sTasks = tasksForSprint(tasks, sprint.id)
                  const done = sTasks.filter((t) => t.status === 'completed').length
                  const pct = sTasks.length > 0 ? Math.round((done / sTasks.length) * 100) : 0
                  const cfg = SPRINT_STATUS_CFG[sprint.status ?? 'pending']
                  return (
                    <div key={sprint.id} className="mb-4">
                      <div className="px-3 py-1.5">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-sm font-semibold text-white truncate leading-tight">
                            {sprint.name}
                          </span>
                          <span className={`shrink-0 text-[9px] font-bold ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {sTasks.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="flex-1 h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cfg.bar}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-300 shrink-0 tabular-nums">
                              {pct}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-1">
                        {sTasks.length === 0 ? (
                          <p className="text-xs text-gray-300 px-2 py-1">No tasks</p>
                        ) : (
                          <>
                            {sTasks.slice(0, 10).map((t) => (
                              <SidebarTask key={t.id} task={t} />
                            ))}
                            {sTasks.length > 10 && (
                              <p className="text-xs text-gray-300 px-2 py-1">
                                +{sTasks.length - 10} more
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

        {/* Sprint Column A */}
        <SprintColumn
          label="Sprint A"
          sprints={sprints}
          allTasks={tasks}
          selectedSprintId={colAId}
          onSelect={setColAId}
          updatingIds={updatingIds}
          onToggle={handleToggle}
          readOnly={readOnly}
          bg="bg-[#0e0e0e]"
        />

        {/* Sprint Column B */}
        <SprintColumn
          label="Sprint B"
          sprints={sprints}
          allTasks={tasks}
          selectedSprintId={colBId}
          onSelect={setColBId}
          updatingIds={updatingIds}
          onToggle={handleToggle}
          readOnly={readOnly}
          bg="bg-[#0f0f0f]"
        />
      </div>

      {!readOnly && (
        <CreateTaskSheet
          projectId={projectId}
          sprints={sprints}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </div>
  )
}
