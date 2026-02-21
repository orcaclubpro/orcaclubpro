'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
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

// --- Config ---

const statusDot: Record<Task['status'], string> = {
  pending: 'bg-gray-500',
  'in-progress': 'bg-intelligence-cyan',
  completed: 'bg-green-400',
  cancelled: 'bg-red-400',
}

const statusLabel: Record<Task['status'], string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const priorityConfig = {
  low: {
    label: 'Low',
    color: 'text-gray-500',
    bg: 'bg-gray-500/10 border-gray-500/20',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
  },
  high: {
    label: 'High',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/20',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
  },
} satisfies Record<NonNullable<Task['priority']>, { label: string; color: string; bg: string }>

const STATUS_CYCLE: Task['status'][] = ['pending', 'in-progress', 'completed']

// --- Helpers ---

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d))

const isOverdue = (d: string | null | undefined): boolean =>
  d ? new Date(d) < new Date() : false

const fmtDateRange = (start: string, end: string) =>
  `${fmtDate(start)} – ${fmtDate(end)}`

// --- Types ---

interface TasksTabProps {
  tasks: Task[]
  sprints: Sprint[]
  projectId: string
}

type ViewMode = 'status' | 'sprint'
type Priority = NonNullable<Task['priority']>

// --- Task Row ---

interface TaskRowProps {
  task: Task
  updating: boolean
  onCycleStatus: (task: Task) => void
}

function TaskRow({ task, updating, onCycleStatus }: TaskRowProps) {
  const priority = (task.priority ?? 'medium') as Priority
  const pCfg = priorityConfig[priority]
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed'

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors ${updating ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Status dot — click to cycle */}
      <button
        type="button"
        onClick={() => onCycleStatus(task)}
        title={`Status: ${statusLabel[task.status]} — click to advance`}
        className="shrink-0 flex items-center justify-center size-5 rounded-full hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-intelligence-cyan/50"
      >
        <span className={`size-1.5 rounded-full ${statusDot[task.status]}`} />
      </button>

      {/* Title */}
      <span className="flex-1 min-w-0 text-sm text-white truncate">{task.title}</span>

      {/* Priority badge */}
      <span
        className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-medium ${pCfg.color} ${pCfg.bg}`}
      >
        {pCfg.label}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span
          className={`shrink-0 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}
        >
          {fmtDate(task.dueDate)}
          {overdue && <span className="ml-1">(overdue)</span>}
        </span>
      )}
    </div>
  )
}

// --- Section Header ---

interface SectionHeaderProps {
  dotColor: string
  label: string
  count: number
}

function SectionHeader({ dotColor, label, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-1 mb-1">
      <span className={`size-1.5 rounded-full ${dotColor}`} />
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs text-gray-600">({count})</span>
    </div>
  )
}

// --- Create Task Sheet ---

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

  const resetForm = () => {
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

    if (!title.trim()) {
      setError('Task title is required')
      return
    }

    setIsLoading(true)

    const result = await createTask({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      sprintId: sprintId || undefined,
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to create task')
      return
    }

    resetForm()
    onOpenChange(false)
    router.refresh()
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-black/95 border-white/[0.08] w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-0">
          <SheetTitle className="text-lg font-semibold text-white">New Task</SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Add a task to this project. It will be assigned to you.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6 px-4 pb-6">
          {/* Title */}
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

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="task-priority" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Priority
            </Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
              disabled={isLoading}
            >
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

          {/* Due Date */}
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

          {/* Sprint */}
          {sprints.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="task-sprint" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Sprint
              </Label>
              <Select
                value={sprintId}
                onValueChange={setSprintId}
                disabled={isLoading}
              >
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

          {/* Description */}
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

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
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
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="size-3.5 mr-1.5" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// --- Main Component ---

const STATUS_SECTIONS: { status: Task['status']; dotColor: string }[] = [
  { status: 'pending', dotColor: 'bg-gray-500' },
  { status: 'in-progress', dotColor: 'bg-intelligence-cyan' },
  { status: 'completed', dotColor: 'bg-green-400' },
  { status: 'cancelled', dotColor: 'bg-red-400' },
]

export function TasksTab({ tasks, sprints, projectId }: TasksTabProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('status')
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const completedCount = tasks.filter((t) => t.status === 'completed').length

  const handleCycleStatus = async (task: Task) => {
    const currentIndex = STATUS_CYCLE.indexOf(task.status)
    // If not in cycle (e.g. cancelled), start from beginning
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]

    setUpdatingIds((prev) => new Set(prev).add(task.id))

    await updateTaskStatus({ taskId: task.id, status: nextStatus })

    setUpdatingIds((prev) => {
      const next = new Set(prev)
      next.delete(task.id)
      return next
    })

    router.refresh()
  }

  // --- By Status view ---

  const renderByStatus = () => (
    <div className="space-y-6">
      {STATUS_SECTIONS.map(({ status, dotColor }) => {
        const group = tasks.filter((t) => t.status === status)
        if (group.length === 0) return null
        return (
          <div key={status}>
            <SectionHeader dotColor={dotColor} label={statusLabel[status]} count={group.length} />
            <div className="space-y-0.5">
              {group.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  updating={updatingIds.has(task.id)}
                  onCycleStatus={handleCycleStatus}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  // --- By Sprint view ---

  const renderBySprint = () => {
    // Build a map: sprintId -> { sprint, tasks[] }
    const sprintMap = new Map<string, { sprint: Sprint | null; tasks: Task[] }>()
    const unassigned: Task[] = []

    for (const task of tasks) {
      if (!task.sprint) {
        unassigned.push(task)
        continue
      }
      const sprintObj = typeof task.sprint === 'object' ? task.sprint : null
      const sprintId = typeof task.sprint === 'string' ? task.sprint : task.sprint.id

      if (!sprintMap.has(sprintId)) {
        // Try to find full sprint data from the sprints prop
        const fullSprint = sprints.find((s) => s.id === sprintId) ?? sprintObj
        sprintMap.set(sprintId, { sprint: fullSprint, tasks: [] })
      }
      sprintMap.get(sprintId)!.tasks.push(task)
    }

    return (
      <div className="space-y-6">
        {Array.from(sprintMap.values()).map(({ sprint, tasks: sprintTasks }) => (
          <div key={sprint?.id ?? 'unknown'}>
            <div className="flex items-center gap-2 px-1 mb-1">
              <span className="size-1.5 rounded-full bg-intelligence-cyan/60" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {sprint?.name ?? 'Unknown Sprint'}
              </span>
              {sprint?.startDate && sprint?.endDate && (
                <span className="text-xs text-gray-600">
                  {fmtDateRange(sprint.startDate, sprint.endDate)}
                </span>
              )}
              <span className="text-xs text-gray-600">({sprintTasks.length})</span>
            </div>
            <div className="space-y-0.5">
              {sprintTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  updating={updatingIds.has(task.id)}
                  onCycleStatus={handleCycleStatus}
                />
              ))}
            </div>
          </div>
        ))}

        {unassigned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-1 mb-1">
              <span className="size-1.5 rounded-full bg-gray-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unassigned
              </span>
              <span className="text-xs text-gray-600">({unassigned.length})</span>
            </div>
            <div className="space-y-0.5">
              {unassigned.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  updating={updatingIds.has(task.id)}
                  onCycleStatus={handleCycleStatus}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- Empty state ---

  if (tasks.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-gray-400 mb-1">No tasks yet</p>
          <p className="text-xs text-gray-600 mb-5">
            Create your first task to start tracking work.
          </p>
          <Button
            onClick={() => setSheetOpen(true)}
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-sm h-8 px-4"
          >
            <Plus className="size-3.5 mr-1.5" />
            New Task
          </Button>
        </div>

        <CreateTaskSheet
          projectId={projectId}
          sprints={sprints}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-white">Tasks</h2>
          <span className="text-xs text-gray-500">
            {tasks.length} total · {completedCount} completed
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-[#1c1c1c] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('status')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                viewMode === 'status'
                  ? 'bg-white/[0.10] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              By Status
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sprint')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                viewMode === 'sprint'
                  ? 'bg-white/[0.10] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              By Sprint
            </button>
          </div>

          {/* New Task button */}
          <Button
            onClick={() => setSheetOpen(true)}
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-xs h-7 px-3"
          >
            <Plus className="size-3 mr-1" />
            New Task
          </Button>
        </div>
      </div>

      {/* Task list */}
      <div className="rounded-lg border border-white/[0.08] bg-[#1c1c1c] p-3">
        {viewMode === 'status' ? renderByStatus() : renderBySprint()}
      </div>

      <CreateTaskSheet
        projectId={projectId}
        sprints={sprints}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}
