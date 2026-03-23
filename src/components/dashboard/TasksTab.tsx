'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Check, Zap, Pencil, X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Target, AlignLeft, Calendar } from 'lucide-react'
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
import { createTask, updateTask, updateTaskStatus } from '@/actions/tasks'
import type { Task, Sprint } from '@/types/payload-types'
import { CreateSprintModal } from './CreateSprintModal'
import { cn } from '@/lib/utils'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<Task['status'], string> = {
  pending: 'bg-gray-500',
  'in-progress': 'bg-[var(--space-accent)]',
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
  low:    { label: 'Low',    color: 'text-gray-500',   bg: 'bg-gray-500/10 border-gray-500/20',   text: 'text-gray-500'   },
  medium: { label: 'Medium', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20',   text: 'text-blue-400'   },
  high:   { label: 'High',   color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', text: 'text-yellow-400' },
  urgent: { label: 'Urgent', color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20',     text: 'text-red-400'    },
} satisfies Record<NonNullable<Task['priority']>, { label: string; color: string; bg: string; text: string }>

const SPRINT_STATUS_CFG: Record<string, { label: string; text: string; bar: string }> = {
  pending:       { label: 'Pending', text: 'text-gray-500',          bar: 'bg-gray-500/40'          },
  'in-progress': { label: 'Active',  text: 'text-[var(--space-accent)]', bar: 'bg-[var(--space-accent)]/60' },
  delayed:       { label: 'Delayed', text: 'text-yellow-400',        bar: 'bg-yellow-400/60'        },
  finished:      { label: 'Done',    text: 'text-green-400',         bar: 'bg-green-400/60'         },
}

type Priority = NonNullable<Task['priority']>

const ACTIVE_SPRINT_STATUSES = new Set<string>(['in-progress', 'delayed'])
const COLUMN_STATUS_ORDER: Task['status'][] = ['in-progress', 'pending', 'completed', 'cancelled']
const ACTIVE_TASK_STATUSES = new Set<Task['status']>(['in-progress', 'pending'])
const UNASSIGNED = '__unassigned__'
const PRIORITY_ORDER: Priority[] = ['low', 'medium', 'high', 'urgent']
const nextPriority = (p: Priority): Priority => PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(p) + 1) % PRIORITY_ORDER.length]

function urgencyScore(task: Task): number {
  const priorityScore = PRIORITY_ORDER.indexOf((task.priority ?? 'medium') as Priority) // 0–3
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed' ? 1 : 0
  return overdue * 100 + priorityScore * 10
}

function sortByUrgency(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const scoreDiff = urgencyScore(b) - urgencyScore(a)
    if (scoreDiff !== 0) return scoreDiff
    // Tiebreak: soonest due date first; no due date sinks to bottom
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return 0
  })
}

// ─── interfaces ───────────────────────────────────────────────────────────────

interface TasksTabProps {
  tasks: Task[]
  sprints: Sprint[]
  projectId: string
  readOnly?: boolean
}

interface EditState {
  taskId: string
  title: string
  description: string
  priority: Priority
  dueDate: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d))

const isOverdue = (d: string | null | undefined): boolean =>
  d ? new Date(d) < new Date() : false

function extractPlainText(description: unknown): string {
  if (!description || typeof description !== 'object') return ''
  const desc = description as any
  try {
    return (desc.root?.children ?? [])
      .flatMap((n: any) => n.children ?? [])
      .filter((n: any) => n.type === 'text')
      .map((n: any) => n.text ?? '')
      .join('')
  } catch {
    return ''
  }
}

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
    <div className="flex items-center gap-2 px-2 py-[5px] rounded hover:bg-[rgba(255,255,255,0.02)] transition-colors">
      <span className={`shrink-0 size-1.5 rounded-full ${STATUS_DOT[task.status]}`} />
      <span className="flex-1 min-w-0 text-xs text-[var(--space-text-primary)] truncate leading-tight">{task.title}</span>
      {over && <span className="shrink-0 size-1 rounded-full bg-red-400/70" />}
      <span className={`shrink-0 text-[10px] font-bold px-1 rounded border leading-4 ${pc.color} ${pc.bg}`}>
        {pc.label[0]}
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
  editState: EditState | null
  onEditStart: (task: Task) => void
  onEditChange: (patch: Partial<EditState>) => void
  onEditSave: (task: Task) => void
  onEditCancel: () => void
  isSaving: boolean
  onPriorityChange?: (task: Task, priority: Priority) => void
}

function TaskCard({
  task,
  updating,
  onToggle,
  readOnly,
  editState,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  isSaving,
  onPriorityChange,
}: TaskCardProps) {
  const p = (task.priority ?? 'medium') as Priority
  const pc = PRIORITY_CFG[p]
  const over = isOverdue(task.dueDate) && task.status !== 'completed'
  const done = task.status === 'completed' || task.status === 'cancelled'
  const isEditing = editState?.taskId === task.id
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) setTimeout(() => titleInputRef.current?.focus(), 50)
  }, [isEditing])

  if (isEditing && !readOnly) {
    return (
      <div className="px-3 py-3 bg-[var(--space-bg-card-hover)] rounded-lg space-y-2 border border-[var(--space-border-hard)] mx-1 mb-1">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <Input
            ref={titleInputRef}
            value={editState.title}
            onChange={(e) => onEditChange({ title: e.target.value })}
            placeholder="Task title…"
            className="flex-1 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:border-[rgba(139,156,182,0.25)] h-7 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave(task)
              if (e.key === 'Escape') onEditCancel()
            }}
          />
          <button
            type="button"
            onClick={() => onEditSave(task)}
            disabled={isSaving || !editState.title.trim()}
            className="p-1.5 rounded-lg bg-[rgba(139,156,182,0.06)] text-[var(--space-accent)] hover:bg-[rgba(139,156,182,0.10)] transition-colors disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={onEditCancel}
            className="p-1.5 rounded-lg text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] hover:bg-[var(--space-bg-card-hover)] transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Description */}
        <Textarea
          value={editState.description}
          onChange={(e) => onEditChange({ description: e.target.value })}
          placeholder="Description (optional)…"
          rows={2}
          className="w-full bg-[var(--space-bg-card)] border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] placeholder:text-[var(--space-text-muted)] focus:border-[rgba(139,156,182,0.20)] resize-none text-xs leading-relaxed"
        />

        {/* Priority + due date */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {(['low', 'medium', 'high', 'urgent'] as const).map((pri) => (
              <button
                key={pri}
                type="button"
                onClick={() => onEditChange({ priority: pri })}
                className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                  editState.priority === pri
                    ? cn(PRIORITY_CFG[pri].text, 'border-current bg-current/10')
                    : 'text-[var(--space-text-muted)] border-[var(--space-border-hard)] hover:border-[var(--space-border-hard)]',
                )}
              >
                {PRIORITY_CFG[pri].label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={editState.dueDate}
            onChange={(e) => onEditChange({ dueDate: e.target.value })}
            className="ml-auto text-[11px] text-[var(--space-text-secondary)] bg-transparent border border-[var(--space-border-hard)] rounded px-2 py-0.5 focus:outline-none focus:border-[var(--space-border-hard)]"
          />
        </div>
      </div>
    )
  }

  const isActive = task.status === 'in-progress' && !done

  return (
    <div
      className={cn(
        'group flex items-start gap-2.5 rounded-lg transition-colors',
        isActive
          ? 'px-3 py-3 bg-[var(--space-accent)]/[0.04] hover:bg-[var(--space-accent)]/[0.06] border-l-2 border-[var(--space-accent)]/25'
          : 'px-3 py-2.5 hover:bg-[var(--space-bg-card-hover)]',
        (updating || isSaving) && 'opacity-50 pointer-events-none',
        done && 'opacity-55',
      )}
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
          className={cn(
            'shrink-0 mt-[3px] size-4 rounded-full border flex items-center justify-center transition-all focus:outline-none',
            done
              ? 'bg-green-400/80 border-green-400/80 hover:bg-green-300/70'
              : task.status === 'in-progress'
              ? 'border-[rgba(139,156,182,0.30)] hover:border-[var(--space-accent)]'
              : 'border-[var(--space-border-hard)] hover:border-[rgba(139,156,182,0.30)] hover:bg-[rgba(139,156,182,0.06)]',
          )}
        >
          {done ? (
            <Check className="size-2.5 text-black" strokeWidth={3} />
          ) : task.status === 'in-progress' ? (
            <span className="size-1.5 rounded-full bg-[var(--space-accent)] opacity-70 animate-pulse" />
          ) : null}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', done ? 'line-through text-[var(--space-text-secondary)]' : isActive ? 'text-white' : 'text-[var(--space-text-primary)]')}>
          {task.title}
        </p>
        {/* Description preview */}
        {(() => {
          const desc = extractPlainText(task.description)
          return desc ? (
            isActive ? (
              <p className="text-xs text-[var(--space-text-secondary)] mt-1.5 leading-relaxed">{desc}</p>
            ) : (
              <p className="text-xs text-[var(--space-text-muted)] mt-0.5 truncate leading-snug">{desc}</p>
            )
          ) : null
        })()}
        <div className="flex items-center gap-2 mt-1">
          {!readOnly && onPriorityChange ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPriorityChange(task, nextPriority(p)) }}
              title={`Priority: ${pc.label} — click to cycle`}
              disabled={isSaving || updating}
              className={cn(
                'text-[10px] font-semibold px-1.5 rounded border leading-4 transition-opacity',
                pc.color, pc.bg,
                'hover:opacity-70 active:scale-95 disabled:cursor-not-allowed',
              )}
            >
              {pc.label[0]}
            </button>
          ) : (
            <span className={`text-[10px] font-semibold px-1.5 rounded border leading-4 ${pc.color} ${pc.bg}`}>
              {pc.label[0]}
            </span>
          )}
          {task.dueDate && (
            <span className={`text-xs ${over ? 'text-red-400' : 'text-[var(--space-text-secondary)]'}`}>
              {fmtDate(task.dueDate)}
              {over ? ' · overdue' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Edit button */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => onEditStart(task)}
          className="shrink-0 mt-0.5 p-1 rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card-hover)] transition-colors opacity-0 group-hover:opacity-100"
          title="Edit task"
        >
          <Pencil className="size-3" />
        </button>
      )}
    </div>
  )
}

// ─── inline quick-add ─────────────────────────────────────────────────────────

function InlineAdd({
  projectId,
  sprintId,
  onCreated,
}: {
  projectId: string
  sprintId: string | null
  onCreated: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      await createTask({
        projectId,
        title: title.trim(),
        priority: 'medium',
        sprintId: sprintId ?? undefined,
      })
      setTitle('')
      setIsOpen(false)
      onCreated()
    })
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] hover:bg-[rgba(255,255,255,0.02)] transition-colors border-t border-[var(--space-border-hard)] shrink-0"
      >
        <Plus className="size-3" />
        Add task
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-3 py-2 border-t border-[var(--space-border-hard)] shrink-0 bg-[var(--space-bg-card)]"
      onKeyDown={(e) => { if (e.key === 'Escape') { setIsOpen(false); setTitle('') } }}
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        disabled={isPending}
        className="flex-1 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:border-[rgba(139,156,182,0.25)] h-7 text-xs"
      />
      <button
        type="submit"
        disabled={isPending || !title.trim()}
        className="p-1.5 rounded-lg bg-[rgba(139,156,182,0.06)] text-[var(--space-accent)] hover:bg-[rgba(139,156,182,0.10)] transition-colors disabled:opacity-40 shrink-0"
      >
        {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
      </button>
      <button
        type="button"
        onClick={() => { setIsOpen(false); setTitle('') }}
        className="p-1.5 rounded-lg text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] transition-colors shrink-0"
      >
        <X className="size-3" />
      </button>
    </form>
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
  projectId: string
  onTaskCreated: () => void
  onTaskSaved: () => void
  isExpanded?: boolean
  onExpand: () => void
  onCollapse: () => void
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
  bg = 'bg-[var(--space-bg-card)]',
  projectId,
  onTaskCreated,
  onTaskSaved,
  isExpanded = false,
  onExpand,
  onCollapse,
}: SprintColumnProps) {
  const [editState, setEditState] = useState<EditState | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const onEditStart = (task: Task) => {
    setEditState({
      taskId: task.id,
      title: task.title,
      description: extractPlainText(task.description),
      priority: (task.priority as Priority) ?? 'medium',
      dueDate: task.dueDate?.slice(0, 10) ?? '',
    })
  }
  const onEditChange = (patch: Partial<EditState>) => {
    setEditState((prev) => (prev ? { ...prev, ...patch } : prev))
  }
  const onEditSave = async (task: Task) => {
    if (!editState || !editState.title.trim()) return
    setSavingId(task.id)
    setEditState(null)
    await updateTask({
      taskId: task.id,
      data: {
        title: editState.title.trim(),
        description: editState.description.trim() || undefined,
        priority: editState.priority,
        dueDate: editState.dueDate || null,
      },
    })
    setSavingId(null)
    onTaskSaved()
  }
  const onEditCancel = () => setEditState(null)

  const handlePriorityChange = async (task: Task, priority: Priority) => {
    if (savingId) return
    setSavingId(task.id)
    await updateTask({ taskId: task.id, data: { priority } })
    setSavingId(null)
    onTaskSaved()
  }

  const sprint = selectedSprintId ? sprints.find((s) => s.id === selectedSprintId) : null
  const sCfg = sprint
    ? (SPRINT_STATUS_CFG[sprint.status ?? 'pending'] ?? SPRINT_STATUS_CFG.pending)
    : null

  const columnTasks = tasksForSprint(allTasks, selectedSprintId)
  const completedCount = columnTasks.filter((t) => t.status === 'completed').length
  const progress = columnTasks.length > 0 ? Math.round((completedCount / columnTasks.length) * 100) : 0

  const hiddenDoneCount = isExpanded
    ? 0
    : columnTasks.filter((t) => !ACTIVE_TASK_STATUSES.has(t.status)).length

  const groups = COLUMN_STATUS_ORDER.map((st) => ({
    status: st,
    tasks: sortByUrgency(columnTasks.filter((t) => t.status === st)),
  })).filter((g) => g.tasks.length > 0 && (isExpanded || ACTIVE_TASK_STATUSES.has(g.status)))

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${bg}`}>
      {/* column header */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--space-border-hard)] shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-[var(--space-text-primary)] uppercase tracking-[0.12em]">{label}</span>
          <div className="flex items-center gap-2">
            {sCfg && <span className={`text-xs font-medium ${sCfg.text}`}>{sCfg.label}</span>}
            <button
              type="button"
              onClick={isExpanded ? onCollapse : onExpand}
              title={isExpanded ? 'Collapse column' : 'Expand column'}
              className="p-1 rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card-hover)] transition-colors"
            >
              {isExpanded
                ? <Minimize2 className="size-3.5" />
                : <Maximize2 className="size-3.5" />
              }
            </button>
          </div>
        </div>
        <Select
          value={selectedSprintId ?? UNASSIGNED}
          onValueChange={(v) => onSelect(v === UNASSIGNED ? null : v)}
        >
          <SelectTrigger className="h-8 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] text-sm focus:border-[rgba(139,156,182,0.25)]">
            <SelectValue placeholder="Select sprint" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)]">
            <SelectItem value={UNASSIGNED} className="text-[var(--space-text-secondary)]">Unassigned tasks</SelectItem>
            {sprints.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-[var(--space-text-primary)]">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {columnTasks.length > 0 && (
          <div className="flex items-center gap-2 mt-2.5">
            <div className="flex-1 h-[3px] bg-[var(--space-divider)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${sCfg?.bar ?? 'bg-[var(--space-accent)]/60'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-[var(--space-text-primary)] font-semibold shrink-0 tabular-nums">
              {completedCount}/{columnTasks.length}
            </span>
          </div>
        )}
      </div>

      {/* sprint info block — expanded only */}
      {isExpanded && sprint && (sprint.goalDescription || sprint.description || sprint.startDate || sprint.endDate) && (
        <div className="mx-4 mt-4 mb-1 rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] overflow-hidden shrink-0">
          {/* header strip */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]">
            <span className="size-1 rounded-full bg-[var(--space-accent)] opacity-60" />
            <span className="text-[10px] font-bold text-[var(--space-text-secondary)] uppercase tracking-[0.12em]">Sprint Overview</span>
          </div>
          <div className="px-4 py-3 space-y-3">
            {/* dates */}
            {(sprint.startDate || sprint.endDate) && (
              <div className="flex items-center gap-4">
                <Calendar className="size-3 text-[var(--space-text-muted)] shrink-0" />
                <div className="flex items-center gap-3 text-xs">
                  {sprint.startDate && (
                    <span className="text-[var(--space-text-secondary)]">
                      Start <span className="text-[var(--space-text-tertiary)] ml-1">{fmtDate(sprint.startDate)}</span>
                    </span>
                  )}
                  {sprint.startDate && sprint.endDate && (
                    <span className="text-[var(--space-text-muted)]">·</span>
                  )}
                  {sprint.endDate && (
                    <span className="text-[var(--space-text-secondary)]">
                      End{' '}
                      <span className={cn('ml-1', isOverdue(sprint.endDate) && sprint.status !== 'finished' ? 'text-red-400' : 'text-[var(--space-text-tertiary)]')}>
                        {fmtDate(sprint.endDate)}
                        {isOverdue(sprint.endDate) && sprint.status !== 'finished' && ' · overdue'}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}
            {/* goal */}
            {sprint.goalDescription && (
              <div className="flex items-start gap-2.5">
                <Target className="size-3 text-[var(--space-accent)] opacity-50 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-[var(--space-text-muted)] uppercase tracking-wider mb-1">Goal</p>
                  <p className="text-sm text-[var(--space-text-tertiary)] leading-relaxed">{sprint.goalDescription}</p>
                </div>
              </div>
            )}
            {/* description */}
            {sprint.description && (
              <div className="flex items-start gap-2.5">
                <AlignLeft className="size-3 text-[var(--space-text-muted)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-[var(--space-text-muted)] uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-[var(--space-text-secondary)] leading-relaxed">{sprint.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* tasks */}
      <div className="flex-1 overflow-y-auto py-2">
        {columnTasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 px-4">
            <p className="text-sm text-[var(--space-text-tertiary)] text-center">
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
                  <span className="text-xs font-bold text-[var(--space-text-primary)] uppercase tracking-[0.08em]">
                    {STATUS_LABEL[status]}
                  </span>
                  <span className="text-xs text-[var(--space-text-tertiary)]">· {tasks.length}</span>
                </div>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    updating={updatingIds.has(task.id)}
                    onToggle={onToggle}
                    readOnly={readOnly}
                    editState={editState}
                    onEditStart={onEditStart}
                    onEditChange={onEditChange}
                    onEditSave={onEditSave}
                    onEditCancel={onEditCancel}
                    isSaving={savingId === task.id}
                    onPriorityChange={handlePriorityChange}
                  />
                ))}
              </div>
            ))}
            {/* hidden done count hint when collapsed */}
            {!isExpanded && hiddenDoneCount > 0 && (
              <button
                type="button"
                onClick={onExpand}
                className="flex items-center gap-1.5 w-full px-4 py-2 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              >
                <span className="size-1 rounded-full bg-green-400/40" />
                {hiddenDoneCount} completed — expand to view
                <Maximize2 className="size-3 ml-auto opacity-50" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* inline add */}
      {!readOnly && (
        <InlineAdd
          projectId={projectId}
          sprintId={selectedSprintId}
          onCreated={onTaskCreated}
        />
      )}
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
      <SheetContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-0">
          <SheetTitle className="text-lg font-semibold text-[var(--space-text-primary)]">New Task</SheetTitle>
          <SheetDescription className="text-sm text-[var(--space-text-tertiary)]">Add a task to this project.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6 px-4 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-medium text-[var(--space-text-secondary)] uppercase tracking-wider">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fix login redirect issue"
              className="bg-[var(--space-bg-card)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:border-[rgba(139,156,182,0.25)] h-9 text-sm"
              disabled={isLoading}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-medium text-[var(--space-text-secondary)] uppercase tracking-wider">
              Description
            </Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or context..."
              rows={3}
              className="bg-[var(--space-bg-card)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:border-[rgba(139,156,182,0.25)] text-sm resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-priority" className="text-xs font-medium text-[var(--space-text-secondary)] uppercase tracking-wider">
              Priority
            </Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)} disabled={isLoading}>
              <SelectTrigger id="task-priority" className="bg-[var(--space-bg-card)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus:border-[rgba(139,156,182,0.25)] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)]">
                <SelectItem value="low" className="text-gray-500">Low</SelectItem>
                <SelectItem value="medium" className="text-blue-400">Medium</SelectItem>
                <SelectItem value="high" className="text-yellow-400">High</SelectItem>
                <SelectItem value="urgent" className="text-red-400">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due" className="text-xs font-medium text-[var(--space-text-secondary)] uppercase tracking-wider">
              Due Date
            </Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-[var(--space-bg-card)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus:border-[rgba(139,156,182,0.25)] h-9 text-sm"
              disabled={isLoading}
            />
          </div>

          {sprints.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="task-sprint" className="text-xs font-medium text-[var(--space-text-secondary)] uppercase tracking-wider">
                Sprint
              </Label>
              <Select value={sprintId} onValueChange={setSprintId} disabled={isLoading}>
                <SelectTrigger id="task-sprint" className="bg-[var(--space-bg-card)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus:border-[rgba(139,156,182,0.25)] h-9 text-sm">
                  <SelectValue placeholder="No sprint" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)]">
                  <SelectItem value="none" className="text-[var(--space-text-secondary)]">No sprint</SelectItem>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id} className="text-[var(--space-text-primary)]">{sprint.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              className="flex-1 bg-[var(--space-bg-card)] border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card-hover)] hover:text-[var(--space-text-primary)] text-sm h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[var(--space-accent)] text-black hover:bg-[var(--space-accent)]/90 font-medium text-sm h-9"
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
  const [sprintModalOpen, setSprintModalOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [expandedCol, setExpandedCol] = useState<'A' | 'B' | null>(null)

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
    setUpdatingIds((p) => { const s = new Set(p); s.delete(task.id); return s })
    router.refresh()
  }

  const handleTaskCreated = () => router.refresh()

  const columnProps = {
    sprints,
    allTasks: tasks,
    updatingIds,
    onToggle: handleToggle,
    readOnly,
    projectId,
    onTaskCreated: handleTaskCreated,
    onTaskSaved: () => router.refresh(),
  }

  return (
    <div
      className="flex flex-col rounded-xl border border-[var(--space-border-hard)] overflow-hidden"
      style={{ height: 'calc(100vh - 12rem)' }}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--space-border-hard)] bg-[var(--space-bg-card)] shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-[var(--space-text-primary)]">Tasks</h2>
          <span className="text-sm text-[var(--space-text-tertiary)]">
            {tasks.length} total · {completedCount} done
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSprintModalOpen(true)}
              variant="outline"
              className="bg-[var(--space-bg-card)] border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card-hover)] hover:text-[var(--space-text-primary)] font-medium text-xs h-7 px-3"
            >
              <Zap className="size-3 mr-1" />
              New Sprint
            </Button>
            <Button
              onClick={() => setSheetOpen(true)}
              className="bg-[var(--space-accent)] text-black hover:bg-[var(--space-accent)]/90 font-medium text-xs h-7 px-3"
            >
              <Plus className="size-3 mr-1" />
              New Task
            </Button>
          </div>
        )}
      </div>

      {/* three-panel layout */}
      <div className="flex-1 flex divide-x divide-[var(--space-divider)] min-h-0 overflow-hidden">
        {/* left sidebar — active sprints overview */}
        <aside
          className={cn(
            'shrink-0 bg-[var(--space-bg-card-hover)] flex flex-col transition-all duration-200',
            sidebarCollapsed ? 'w-10' : 'w-60',
          )}
        >
          <div className="flex items-center px-2.5 py-3.5 border-b border-[var(--space-border-hard)] shrink-0">
            {!sidebarCollapsed && (
              <>
                <Zap className="size-3 text-[var(--space-accent)] shrink-0 mr-2" />
                <span className="text-xs font-bold text-[var(--space-text-primary)] uppercase tracking-[0.08em] flex-1 truncate">Active Sprints</span>
              </>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'p-1 rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card-hover)] transition-colors shrink-0',
                sidebarCollapsed && 'mx-auto',
              )}
            >
              {sidebarCollapsed
                ? <ChevronRight className="size-3.5" />
                : <ChevronLeft className="size-3.5" />
              }
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-y-auto">
              {activeSprints.length === 0 ? (
                <div className="flex items-center justify-center h-32 px-4">
                  <p className="text-sm text-[var(--space-text-tertiary)] text-center">No active sprints</p>
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
                            <span className="text-sm font-semibold text-[var(--space-text-primary)] truncate leading-tight">{sprint.name}</span>
                            <span className={`shrink-0 text-[9px] font-bold ${cfg.text}`}>{cfg.label}</span>
                          </div>
                          {sTasks.length > 0 && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="flex-1 h-[2px] bg-[var(--space-divider)] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-[var(--space-text-tertiary)] shrink-0 tabular-nums">{pct}%</span>
                            </div>
                          )}
                        </div>
                        <div className="px-1">
                          {sTasks.length === 0 ? (
                            <p className="text-xs text-[var(--space-text-tertiary)] px-2 py-1">No tasks</p>
                          ) : (
                            <>
                              {sortByUrgency(sTasks).slice(0, 10).map((t) => <SidebarTask key={t.id} task={t} />)}
                              {sTasks.length > 10 && (
                                <p className="text-xs text-[var(--space-text-tertiary)] px-2 py-1">+{sTasks.length - 10} more</p>
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
          )}
        </aside>

        {/* Sprint Column A */}
        {expandedCol !== 'B' && (
          <SprintColumn
            label="Sprint A"
            selectedSprintId={colAId}
            onSelect={setColAId}
            bg="bg-[var(--space-bg-card)]"
            isExpanded={expandedCol === 'A'}
            onExpand={() => setExpandedCol('A')}
            onCollapse={() => setExpandedCol(null)}
            {...columnProps}
          />
        )}

        {/* Sprint Column B */}
        {expandedCol !== 'A' && (
          <SprintColumn
            label="Sprint B"
            selectedSprintId={colBId}
            onSelect={setColBId}
            bg="bg-[var(--space-bg-card)]"
            isExpanded={expandedCol === 'B'}
            onExpand={() => setExpandedCol('B')}
            onCollapse={() => setExpandedCol(null)}
            {...columnProps}
          />
        )}
      </div>

      {!readOnly && (
        <>
          <CreateTaskSheet
            projectId={projectId}
            sprints={sprints}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          />
          <CreateSprintModal
            projectId={projectId}
            open={sprintModalOpen}
            onOpenChange={setSprintModalOpen}
            onSuccess={() => { setSprintModalOpen(false); router.refresh() }}
          />
        </>
      )}
    </div>
  )
}
