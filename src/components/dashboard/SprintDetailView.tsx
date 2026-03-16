'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  MoreHorizontal,
  X,
  Flag,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createTask, updateTask } from '@/actions/tasks'
import { updateSprintStatus, updateSprint, deleteSprint } from '@/actions/sprints'
import type { Sprint, Task, User } from '@/types/payload-types'

// ── Config ───────────────────────────────────────────────────────────────────

const SPRINT_STATUS = {
  pending:       { label: 'Planned',     dot: 'bg-gray-500',          text: 'text-gray-400',          bg: 'bg-gray-500/10',          border: 'border-gray-500/20'          },
  'in-progress': { label: 'In Progress', dot: 'bg-[var(--space-accent)]', text: 'text-[var(--space-accent)]', bg: 'bg-[rgba(139,156,182,0.10)]', border: 'border-[rgba(139,156,182,0.15)]' },
  delayed:       { label: 'Delayed',     dot: 'bg-orange-400',        text: 'text-orange-400',        bg: 'bg-orange-400/10',        border: 'border-orange-400/20'        },
  finished:      { label: 'Finished',    dot: 'bg-green-400',         text: 'text-green-400',         bg: 'bg-green-400/10',         border: 'border-green-400/20'         },
} as const

const TASK_STATUS = {
  pending:       { dot: 'bg-gray-500',          label: 'Pending',     ring: 'ring-gray-500/30'    },
  'in-progress': { dot: 'bg-[var(--space-accent)]', label: 'In Progress', ring: 'ring-[rgba(139,156,182,0.20)]' },
  completed:     { dot: 'bg-green-400',         label: 'Done',        ring: 'ring-green-400/30'   },
  cancelled:     { dot: 'bg-red-400/60',        label: 'Cancelled',   ring: 'ring-red-400/30'     },
} as const

const PRIORITY = {
  low:    { label: 'Low',    dot: 'bg-gray-500',    text: 'text-gray-500',   badge: 'border-gray-500/30 text-gray-500'  },
  medium: { label: 'Medium', dot: 'bg-blue-400',    text: 'text-blue-400',   badge: 'border-blue-400/30 text-blue-400'  },
  high:   { label: 'High',   dot: 'bg-orange-400',  text: 'text-orange-400', badge: 'border-orange-400/30 text-orange-400' },
  urgent: { label: 'Urgent', dot: 'bg-red-400',     text: 'text-red-400',    badge: 'border-red-400/30 text-red-400'    },
} as const

const STATUS_CYCLE: Record<string, 'pending' | 'in-progress' | 'completed'> = {
  pending:       'in-progress',
  'in-progress': 'completed',
  completed:     'pending',
}

const SPRINT_STATUS_TRANSITIONS: Record<string, Array<{ value: string; label: string }>> = {
  pending:       [{ value: 'in-progress', label: 'Start Sprint' }],
  'in-progress': [{ value: 'finished', label: 'Finish Sprint' }, { value: 'delayed', label: 'Mark Delayed' }],
  delayed:       [{ value: 'in-progress', label: 'Resume Sprint' }, { value: 'finished', label: 'Finish Sprint' }],
  finished:      [{ value: 'in-progress', label: 'Reopen Sprint' }],
}

// ── Types ────────────────────────────────────────────────────────────────────

interface SprintDetailViewProps {
  sprint: Sprint
  tasks: Task[]
  projectBacklog: Task[]
  projectId: string
  username: string
  readOnly?: boolean
}

type Priority = 'low' | 'medium' | 'high' | 'urgent'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

function fmtDateShort(d: string | null | undefined) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d))
}

function getDaysLeft(endDate: string | null | undefined): number | null {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
}

function getDuration(startDate: string | null | undefined, endDate: string | null | undefined): number | null {
  if (!startDate || !endDate) return null
  return Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000)
}

function getAssigneeInitials(task: Task): string | null {
  const assignedTo = task.assignedTo
  if (!assignedTo || typeof assignedTo === 'string') return null
  const user = assignedTo as User
  if (user.name) {
    const parts = user.name.split(' ')
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  if (user.email) return user.email.slice(0, 2).toUpperCase()
  return null
}

// ── Inline progress ring (SVG) ───────────────────────────────────────────────

function ProgressRing({
  progress,
  size = 88,
  strokeWidth = 5,
  colorClass,
}: {
  progress: number
  size?: number
  strokeWidth?: number
  colorClass?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  const colorMap: Record<string, string> = {
    'bg-[var(--space-accent)]': 'rgb(30, 58, 110)',
    'bg-green-400':         'rgb(74, 222, 128)',
    'bg-orange-400':        'rgb(251, 146, 60)',
    'bg-gray-500':          'rgb(107, 114, 128)',
  }
  const stroke = colorClass ? (colorMap[colorClass] ?? 'rgb(103, 232, 249)') : 'rgb(103, 232, 249)'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" opacity="0.85"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-base font-bold text-[#F0F0F0] tabular-nums">{Math.round(progress)}%</span>
    </div>
  )
}

// ── Task card (redesigned) ────────────────────────────────────────────────────

function TaskCard({
  task,
  onCircleClick,
  onRemoveFromSprint,
  readOnly,
  isPending,
  editingTaskId,
  editTaskTitle,
  editTaskDescription,
  editTaskPriority,
  editTaskDueDate,
  onEditStart,
  onEditTitleChange,
  onEditDescriptionChange,
  onEditPriorityChange,
  onEditDueDateChange,
  onEditSave,
  onEditCancel,
}: {
  task: Task
  onCircleClick: (task: Task) => void
  onRemoveFromSprint: (task: Task) => void
  readOnly: boolean
  isPending: boolean
  editingTaskId: string | null
  editTaskTitle: string
  editTaskDescription: string
  editTaskPriority: Priority
  editTaskDueDate: string
  onEditStart: (task: Task) => void
  onEditTitleChange: (v: string) => void
  onEditDescriptionChange: (v: string) => void
  onEditPriorityChange: (v: Priority) => void
  onEditDueDateChange: (v: string) => void
  onEditSave: (task: Task) => void
  onEditCancel: () => void
}) {
  const isDone = task.status === 'completed' || task.status === 'cancelled'
  const isInProgress = task.status === 'in-progress'
  const priorityCfg = task.priority ? PRIORITY[task.priority as keyof typeof PRIORITY] : null
  const daysLeft = getDaysLeft(task.dueDate)
  const isOverdue = daysLeft !== null && daysLeft < 0 && !isDone
  const initials = getAssigneeInitials(task)
  const isEditing = editingTaskId === task.id
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) setTimeout(() => editInputRef.current?.focus(), 50)
  }, [isEditing])

  // Inline edit mode
  if (isEditing && !readOnly) {
    return (
      <div className="px-4 py-3 bg-[#2D2D2D] border-b border-[#404040] last:border-0 space-y-2.5">
        <div className="flex items-center gap-2">
          <Input
            ref={editInputRef}
            value={editTaskTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            placeholder="Task title…"
            className="flex-1 bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:border-[rgba(139,156,182,0.25)] h-7 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave(task)
              if (e.key === 'Escape') onEditCancel()
            }}
          />
          <button
            type="button"
            onClick={() => onEditSave(task)}
            disabled={isPending || !editTaskTitle.trim()}
            className="p-1.5 rounded-lg bg-[rgba(139,156,182,0.06)] text-[var(--space-accent)] hover:bg-[rgba(139,156,182,0.10)] transition-colors disabled:opacity-40"
            title="Save"
          >
            <Check className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onEditCancel}
            className="p-1.5 rounded-lg text-[#4A4A4A] hover:text-[#6B6B6B] hover:bg-[#2D2D2D] transition-colors"
            title="Cancel"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <Textarea
          value={editTaskDescription}
          onChange={(e) => onEditDescriptionChange(e.target.value)}
          placeholder="Description (optional)…"
          rows={2}
          className="w-full bg-[#252525] border-[#404040] text-[#A0A0A0] placeholder:text-[#4A4A4A] focus:border-[rgba(139,156,182,0.20)] resize-none text-xs leading-relaxed"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onEditPriorityChange(p)}
                className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors capitalize',
                  editTaskPriority === p
                    ? cn(PRIORITY[p].text, 'border-current bg-current/10')
                    : 'text-[#4A4A4A] border-[#404040] hover:border-[#404040]',
                )}
              >
                {PRIORITY[p].label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={editTaskDueDate}
            onChange={(e) => onEditDueDateChange(e.target.value)}
            className="ml-auto text-[11px] text-[#6B6B6B] bg-transparent border border-[#404040] rounded px-2 py-0.5 focus:outline-none focus:border-[#404040]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'group flex items-center gap-3 px-4 py-3 transition-colors border-b border-[#404040] last:border-0',
      isPending && 'opacity-60',
      isDone ? 'hover:bg-[#252525]' : 'hover:bg-[#2D2D2D]',
    )}>
      {/* Circle toggle button */}
      {!readOnly ? (
        <button
          type="button"
          onClick={() => onCircleClick(task)}
          disabled={isPending}
          title={isDone ? 'Restore to pending' : isInProgress ? 'In progress — click to complete' : 'Mark complete'}
          className="shrink-0 flex items-center justify-center"
        >
          {isDone ? (
            // Filled green circle with check
            <div className="size-5 rounded-full bg-green-400/80 flex items-center justify-center hover:opacity-60 transition-opacity cursor-pointer">
              <Check className="size-2.5 text-black stroke-[3]" />
            </div>
          ) : isInProgress ? (
            // Hollow circle with inner pulse dot
            <div className="size-5 rounded-full border-2 border-[rgba(139,156,182,0.30)] hover:border-[rgba(139,156,182,0.70)] hover:bg-[rgba(139,156,182,0.06)] transition-all cursor-pointer flex items-center justify-center">
              <div className="size-2 rounded-full bg-[var(--space-accent)] opacity-70 animate-pulse" />
            </div>
          ) : (
            // Hollow circle (pending)
            <div className="size-5 rounded-full border-2 border-[#404040] hover:border-green-400/70 hover:bg-green-400/[0.06] transition-all cursor-pointer" />
          )}
        </button>
      ) : (
        <div className={cn(
          'size-5 shrink-0 rounded-full border-2',
          isDone ? 'bg-green-400/80 border-green-400/80 flex items-center justify-center' : 'border-[#404040]',
        )}>
          {isDone && <Check className="size-2.5 text-black stroke-[3]" />}
        </div>
      )}

      {/* Title */}
      <span className={cn(
        'flex-1 min-w-0 text-sm truncate',
        isDone ? 'text-[#4A4A4A] line-through decoration-[#555555]/60' : 'text-[#A0A0A0]',
      )}>
        {task.title}
      </span>

      {/* Priority badge (only on active tasks) */}
      {priorityCfg && !isDone && (
        <span className={cn(
          'shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border',
          priorityCfg.badge,
        )}>
          {priorityCfg.label}
        </span>
      )}

      {/* Due date */}
      {task.dueDate && !isDone && (
        <span className={cn(
          'flex items-center gap-1 text-[11px] tabular-nums shrink-0',
          isOverdue ? 'text-red-400' : 'text-[#4A4A4A]',
        )}>
          {isOverdue && <AlertCircle className="size-2.5" />}
          {fmtDateShort(task.dueDate)}
        </span>
      )}

      {/* Assignee initials */}
      {initials && !isDone && (
        <span className="shrink-0 size-5 rounded-full bg-[#2D2D2D] border border-[#404040] flex items-center justify-center text-[9px] font-semibold text-[#6B6B6B]">
          {initials}
        </span>
      )}

      {/* Actions: Remove then Edit */}
      {!readOnly && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => onRemoveFromSprint(task)}
            disabled={isPending}
            title="Remove from sprint"
            className="p-1.5 rounded-lg text-[#4A4A4A] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <X className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => onEditStart(task)}
            disabled={isPending}
            title="Edit task"
            className="p-1.5 rounded-lg text-[#4A4A4A] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors"
          >
            <Pencil className="size-3" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Inline task creation ──────────────────────────────────────────────────────

function InlineTaskCreate({
  projectId,
  sprintId,
  onCreated,
}: {
  projectId: string
  sprintId: string
  onCreated: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createTask({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        sprintId,
      })
      if (!result.success) {
        setError(result.error ?? 'Failed to create task')
        return
      }
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('medium')
      onCreated()
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setTitle('')
      setDescription('')
      setError(null)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm text-[#4A4A4A] hover:text-[#6B6B6B] hover:bg-[#252525] transition-colors border-t border-[#404040]"
      >
        <Plus className="size-3.5 text-[#4A4A4A]" />
        <span>Add task</span>
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="border-t border-[#404040] px-4 py-4 space-y-2.5 bg-[#252525]"
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:border-[rgba(139,156,182,0.25)] h-8 text-sm"
        disabled={isPending}
      />

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)…"
        rows={2}
        disabled={isPending}
        className="bg-[#252525] border-[#404040] text-[#A0A0A0] placeholder:text-[#4A4A4A] focus:border-[rgba(139,156,182,0.20)] resize-none text-xs leading-relaxed"
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors capitalize',
                priority === p
                  ? cn(PRIORITY[p].text, 'border-current bg-current/10')
                  : 'text-[#4A4A4A] border-[#404040] hover:border-[#404040]',
              )}
            >
              {PRIORITY[p].label}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={isPending}
          className="ml-auto text-[11px] text-[#6B6B6B] bg-transparent border border-[#404040] rounded px-2 py-0.5 focus:outline-none focus:border-[#404040]"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !title.trim()}
          className="h-7 text-xs bg-[var(--space-accent)] text-black hover:bg-[var(--space-accent)]/90 font-medium px-3"
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : 'Add'}
        </Button>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setTitle(''); setDescription(''); setError(null) }}
          className="h-7 text-xs text-[#4A4A4A] hover:text-[#6B6B6B] px-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Backlog picker ────────────────────────────────────────────────────────────

function BacklogPicker({
  tasks,
  sprintId,
  onAdded,
}: {
  tasks: Task[]
  sprintId: string
  onAdded: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  )

  const handleAdd = (task: Task) => {
    startTransition(async () => {
      await updateTask({ taskId: task.id, data: { sprint: sprintId } })
      onAdded()
      setIsOpen(false)
      setSearch('')
    })
  }

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  if (tasks.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all',
          isOpen
            ? 'text-[#A0A0A0] bg-[#2D2D2D] border-[#404040]'
            : 'text-[#6B6B6B] hover:text-[#A0A0A0] border-[#404040] hover:border-[#404040] hover:bg-[#2D2D2D]',
        )}
      >
        <Inbox className="size-3.5" />
        Pull from backlog
        <ChevronDown className={cn('size-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#1C1C1C] border border-[#404040] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-[#404040]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="h-7 text-xs bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A]"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-[#4A4A4A] text-center">No matching tasks</p>
            ) : (
              filtered.slice(0, 20).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleAdd(task)}
                  disabled={isPending}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#2D2D2D] transition-colors border-b border-[#404040] last:border-0"
                >
                  <div className="size-1.5 rounded-full bg-[#555555] shrink-0" />
                  <span className="text-sm text-[#A0A0A0] truncate flex-1">{task.title}</span>
                  {task.priority && (
                    <span className={cn('text-[10px] shrink-0', PRIORITY[task.priority as keyof typeof PRIORITY]?.text)}>
                      {PRIORITY[task.priority as keyof typeof PRIORITY]?.label}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sidebar stat card ─────────────────────────────────────────────────────────

function SidebarStat({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-[#2D2D2D] border border-[#404040]">
      <div className="flex items-center gap-1 text-[#4A4A4A]">
        <Icon className="size-2.5" />
        <span className="text-[9px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <span className={cn('text-base font-bold text-[#F0F0F0] tabular-nums leading-none', valueClass)}>
        {value}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SprintDetailView({
  sprint: initialSprint,
  tasks: initialTasks,
  projectBacklog,
  projectId,
  username,
  readOnly = false,
}: SprintDetailViewProps) {
  const router = useRouter()
  const [sprint, setSprint] = useState(initialSprint)
  const [tasks, setTasks] = useState(initialTasks)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editName, setEditName] = useState(initialSprint.name)
  const [editDescription, setEditDescription] = useState(initialSprint.description ?? '')
  const [editStartDate, setEditStartDate] = useState(initialSprint.startDate?.slice(0, 10) ?? '')
  const [editEndDate, setEditEndDate] = useState(initialSprint.endDate?.slice(0, 10) ?? '')
  const [editGoal, setEditGoal] = useState(initialSprint.goalDescription ?? '')
  const [editError, setEditError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Task inline edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editTaskPriority, setEditTaskPriority] = useState<Priority>('medium')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')

  const statusCfg = SPRINT_STATUS[sprint.status as keyof typeof SPRINT_STATUS] ?? SPRINT_STATUS.pending

  // Task grouping
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress')
  const todoTasks = tasks.filter((t) => t.status === 'pending')
  const doneTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'cancelled')
  const ongoingTasks = [...inProgressTasks, ...todoTasks]

  // Metrics
  const totalCount = tasks.length
  const completedCount = doneTasks.length
  const inProgressCount = inProgressTasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Time
  const daysLeft = getDaysLeft(sprint.endDate)
  const duration = getDuration(sprint.startDate, sprint.endDate)
  const isOverdue = daysLeft !== null && daysLeft < 0 && sprint.status !== 'finished'

  // Overdue task count
  const overdueTaskCount = ongoingTasks.filter((t) => {
    const dl = getDaysLeft(t.dueDate)
    return dl !== null && dl < 0
  }).length

  const transitions = SPRINT_STATUS_TRANSITIONS[sprint.status] ?? []

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCircleClick = (task: Task) => {
    const isDone = task.status === 'completed' || task.status === 'cancelled'
    const nextStatus = isDone ? 'pending' : 'completed'
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t))
    startTransition(async () => {
      const result = await updateTask({ taskId: task.id, data: { status: nextStatus } })
      if (!result.success) {
        setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t))
      }
    })
  }

  const handleRemoveFromSprint = (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    startTransition(async () => {
      const result = await updateTask({ taskId: task.id, data: { sprint: null } })
      if (!result.success) {
        setTasks((prev) => [...prev, task])
      }
    })
  }

  const handleEditStart = (task: Task) => {
    setEditingTaskId(task.id)
    setEditTaskTitle(task.title)
    setEditTaskDescription(extractPlainText(task.description))
    setEditTaskPriority((task.priority as Priority) ?? 'medium')
    setEditTaskDueDate(task.dueDate?.slice(0, 10) ?? '')
  }

  const handleEditSave = (task: Task) => {
    if (!editTaskTitle.trim()) return
    const snapshot = { title: task.title, priority: task.priority, dueDate: task.dueDate }
    setTasks((prev) => prev.map((t) =>
      t.id === task.id
        ? { ...t, title: editTaskTitle.trim(), priority: editTaskPriority, dueDate: editTaskDueDate || null }
        : t,
    ))
    setEditingTaskId(null)
    startTransition(async () => {
      const result = await updateTask({
        taskId: task.id,
        data: {
          title: editTaskTitle.trim(),
          description: editTaskDescription.trim() || undefined,
          priority: editTaskPriority,
          dueDate: editTaskDueDate || undefined,
        },
      })
      if (!result.success) {
        setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, ...snapshot } : t))
      }
    })
  }

  const handleEditCancel = () => {
    setEditingTaskId(null)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatusMenuOpen(false)
    const prevStatus = sprint.status
    const prevStartDate = sprint.startDate
    const todayISO = new Date().toISOString()
    setSprint((s) => ({
      ...s,
      status: newStatus as Sprint['status'],
      ...(newStatus === 'in-progress' ? { startDate: todayISO } : {}),
    }))
    startTransition(async () => {
      const result = await updateSprintStatus({ sprintId: sprint.id, status: newStatus as Sprint['status'] })
      if (!result.success) {
        setSprint((s) => ({ ...s, status: prevStatus, startDate: prevStartDate }))
      }
    })
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    if (!editName.trim()) { setEditError('Name is required.'); return }
    if (editStartDate && editEndDate && new Date(editEndDate) < new Date(editStartDate)) {
      setEditError('End date must be after start date.')
      return
    }
    const snapshot = { name: sprint.name, description: sprint.description, startDate: sprint.startDate, endDate: sprint.endDate, goalDescription: sprint.goalDescription }
    setSprint((s) => ({ ...s, name: editName.trim(), description: editDescription.trim() || null, startDate: editStartDate, endDate: editEndDate, goalDescription: editGoal || null }))
    setEditOpen(false)
    startTransition(async () => {
      const result = await updateSprint({
        sprintId: sprint.id,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        startDate: editStartDate,
        endDate: editEndDate,
        goalDescription: editGoal.trim() || undefined,
      })
      if (!result.success) {
        setSprint((s) => ({ ...s, ...snapshot }))
        setEditOpen(true)
        setEditError(result.error ?? 'Failed to save.')
      }
    })
  }

  const handleTaskCreated = () => router.refresh()
  const handleBacklogAdded = () => router.refresh()

  const handleDelete = async () => {
    setDeleteMenuOpen(false)
    setIsDeleting(true)
    const result = await deleteSprint({ sprintId: sprint.id })
    if (result.success) {
      router.push(`/u/${username}/projects/${projectId}?tab=sprints`)
    } else {
      setIsDeleting(false)
    }
  }

  // Close menus on outside click
  useEffect(() => {
    if (!statusMenuOpen) return
    const handler = () => setStatusMenuOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [statusMenuOpen])

  useEffect(() => {
    if (!deleteMenuOpen) return
    const handler = () => setDeleteMenuOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [deleteMenuOpen])

  // Common task card props
  const taskCardCommonProps = {
    readOnly,
    isPending,
    editingTaskId,
    editTaskTitle,
    editTaskDescription,
    editTaskPriority,
    editTaskDueDate,
    onCircleClick: handleCircleClick,
    onRemoveFromSprint: handleRemoveFromSprint,
    onEditStart: handleEditStart,
    onEditTitleChange: setEditTaskTitle,
    onEditDescriptionChange: setEditTaskDescription,
    onEditPriorityChange: setEditTaskPriority,
    onEditDueDateChange: setEditTaskDueDate,
    onEditSave: handleEditSave,
    onEditCancel: handleEditCancel,
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="lg:flex fluid-enter" style={{ minHeight: 'calc((100vh - 64px) / 1.3)' }}>

      {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
      <aside className={cn(
        'hidden lg:flex flex-col shrink-0 border-r border-[#404040] bg-[#2D2D2D] sticky top-[49px] self-start h-[calc((100vh-64px)/1.3)] overflow-hidden transition-[width] duration-300 ease-in-out',
        sidebarCollapsed ? 'w-12' : 'w-72 xl:w-80',
      )}>
        {/* Top bar: back nav + collapse toggle */}
        <div className={cn(
          'flex items-center shrink-0 pt-3 pb-2 border-b border-[#404040]',
          sidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4',
        )}>
          {!sidebarCollapsed && (
            <Link
              href={`/u/${username}/projects/${projectId}?tab=sprints`}
              className="inline-flex items-center gap-1.5 text-xs text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="p-1.5 rounded-md text-[#4A4A4A] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed
              ? <ChevronRight className="size-4" />
              : <ChevronLeft className="size-4" />
            }
          </button>
        </div>

        {/* Sidebar content - fades out when collapsed */}
        <div className={cn('flex-1 overflow-y-auto transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
          <div className="px-5 py-5 space-y-5">

                {/* Sprint name */}
                <div>
                  <h2 className="text-xl font-bold text-[#1E3A6E] leading-tight break-words">{sprint.name}</h2>

                  {/* Status badge */}
                  <div className="mt-2">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border',
                      statusCfg.text, statusCfg.bg, statusCfg.border,
                    )}>
                      <span className={cn('size-1.5 rounded-full', statusCfg.dot)} />
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Progress ring */}
                <div className="flex flex-col items-center gap-2 py-1">
                  <ProgressRing
                    progress={progress}
                    size={80}
                    strokeWidth={5}
                    colorClass={statusCfg.dot}
                  />
                  <p className="text-xs text-[#6B6B6B] tabular-nums">
                    {completedCount} of {totalCount} tasks
                  </p>
                  {/* Progress bar */}
                  {totalCount > 0 && (
                    <div className="w-full h-0.5 bg-[#333333] rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all duration-700', statusCfg.dot)}
                        style={{ width: `${progress}%`, opacity: 0.7 }}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                {sprint.description && !editOpen && (
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">{sprint.description}</p>
                )}

                {/* Goal */}
                {sprint.goalDescription && !editOpen && (
                  <div className="flex items-start gap-2 py-0.5">
                    <Target className="size-3.5 text-[#4A4A4A] mt-0.5 shrink-0" />
                    <p className="text-xs text-[#6B6B6B] leading-relaxed">{sprint.goalDescription}</p>
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <SidebarStat
                    icon={TrendingUp}
                    label="Active"
                    value={inProgressCount}
                    valueClass={inProgressCount > 0 ? 'text-[var(--space-accent)]' : 'text-[#4A4A4A]'}
                  />
                  <SidebarStat
                    icon={AlertCircle}
                    label="Overdue"
                    value={overdueTaskCount}
                    valueClass={overdueTaskCount > 0 ? 'text-red-400' : 'text-[#4A4A4A]'}
                  />
                  {duration !== null && (
                    <SidebarStat
                      icon={Calendar}
                      label="Duration"
                      value={`${duration}d`}
                    />
                  )}
                  {daysLeft !== null && sprint.status !== 'finished' && (
                    <SidebarStat
                      icon={Clock}
                      label={isOverdue ? 'Overdue' : 'Days left'}
                      value={isOverdue ? `${Math.abs(daysLeft)}d` : `${daysLeft}d`}
                      valueClass={isOverdue ? 'text-red-400' : daysLeft < 7 ? 'text-orange-400' : 'text-[#F0F0F0]'}
                    />
                  )}
                </div>

                {/* Date range */}
                {(sprint.startDate || sprint.endDate) && (
                  <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A]">
                    <Calendar className="size-3.5 shrink-0" />
                    <span className="tabular-nums">{fmtDate(sprint.startDate)}</span>
                    <span className="text-[#4A4A4A]">→</span>
                    <span className="tabular-nums">{fmtDate(sprint.endDate)}</span>
                  </div>
                )}

                {/* Sprint complete message */}
                {sprint.status === 'finished' && totalCount > 0 && completedCount === totalCount && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-green-400" />
                    <span className="text-xs text-green-400/80">All tasks completed</span>
                  </div>
                )}

                {/* Edit form */}
                {!readOnly && (
                  <>
                    {/* Edit toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(sprint.name)
                        setEditDescription(sprint.description ?? '')
                        setEditStartDate(sprint.startDate?.slice(0, 10) ?? '')
                        setEditEndDate(sprint.endDate?.slice(0, 10) ?? '')
                        setEditGoal(sprint.goalDescription ?? '')
                        setEditError(null)
                        setEditOpen((v) => !v)
                      }}
                      className={cn(
                        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border w-full justify-center transition-all',
                        editOpen
                          ? 'text-[#A0A0A0] bg-[#2D2D2D] border-[#404040]'
                          : 'text-[#6B6B6B] hover:text-[#A0A0A0] border-[#404040] hover:border-[#404040] hover:bg-[#2D2D2D]',
                      )}
                    >
                      <Pencil className="size-3" />
                      Edit sprint
                    </button>

                    {/* Inline edit form */}
                    {editOpen && (
                      <form
                        onSubmit={handleSaveEdit}
                        className="rounded-xl border border-[#404040] bg-[#252525] p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150"
                      >
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">Sprint Name</Label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Sprint name"
                            autoFocus
                            className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:border-[rgba(139,156,182,0.25)] h-8 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">Description</Label>
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Sprint description…"
                            rows={2}
                            className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:border-[rgba(139,156,182,0.25)] resize-none text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">Start Date</Label>
                          <Input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] focus:border-[rgba(139,156,182,0.25)] h-8 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">End Date</Label>
                          <Input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] focus:border-[rgba(139,156,182,0.25)] h-8 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">Goal</Label>
                          <Textarea
                            value={editGoal}
                            onChange={(e) => setEditGoal(e.target.value)}
                            placeholder="Sprint goal…"
                            rows={2}
                            className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:border-[rgba(139,156,182,0.25)] resize-none text-sm"
                          />
                        </div>

                        {editError && <p className="text-xs text-red-400">{editError}</p>}

                        <div className="flex gap-2 pt-1">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isPending || !editName.trim()}
                            className="flex-1 bg-[var(--space-accent)] text-black hover:bg-[var(--space-accent)]/90 font-medium h-7 text-xs"
                          >
                            {isPending ? <Loader2 className="size-3 animate-spin" /> : 'Save'}
                          </Button>
                          <button
                            type="button"
                            onClick={() => { setEditOpen(false); setEditError(null) }}
                            className="h-7 text-xs text-[#4A4A4A] hover:text-[#6B6B6B] px-2 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Status transition button(s) */}
                    {transitions.length === 1 && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(transitions[0].value)}
                        disabled={isPending}
                        className="w-full h-10 text-sm font-semibold rounded-lg bg-[#333333] text-[#FFFFFF] hover:bg-[#404040] transition-all disabled:opacity-50"
                      >
                        {transitions[0].label}
                      </button>
                    )}

                    {transitions.length > 1 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setStatusMenuOpen((v) => !v) }}
                          className="flex items-center gap-1.5 w-full h-10 px-3 rounded-lg bg-[#333333] text-[#FFFFFF] text-sm font-semibold justify-center hover:bg-[#404040] transition-all"
                        >
                          {transitions[0].label}
                          <ChevronDown className={cn('size-3.5 transition-transform ml-auto', statusMenuOpen && 'rotate-180')} />
                        </button>

                        {statusMenuOpen && (
                          <div className="absolute bottom-full left-0 mb-1.5 bg-[#1C1C1C] border border-[#404040] rounded-xl shadow-2xl z-50 overflow-hidden min-w-full">
                            {transitions.map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => handleStatusChange(t.value)}
                                disabled={isPending}
                                className="w-full px-4 py-2.5 text-left text-sm text-[#A0A0A0] hover:bg-[#2D2D2D] hover:text-[#F0F0F0] transition-colors flex items-center gap-2"
                              >
                                <div className={cn('size-1.5 rounded-full', SPRINT_STATUS[t.value as keyof typeof SPRINT_STATUS]?.dot)} />
                                {t.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delete */}
                    <div className="relative pt-1 border-t border-[#404040]">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleteMenuOpen((v) => !v) }}
                          disabled={isDeleting}
                          className="flex items-center gap-1.5 text-xs text-[#4A4A4A] hover:text-red-400/70 transition-colors py-1"
                        >
                          {isDeleting
                            ? <Loader2 className="size-3 animate-spin" />
                            : <MoreHorizontal className="size-3.5" />
                          }
                          Delete sprint
                        </button>

                        {deleteMenuOpen && (
                          <div className="absolute bottom-full left-0 mb-1.5 bg-[#1C1C1C] border border-[#404040] rounded-xl shadow-2xl z-50 overflow-hidden min-w-[150px]">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDelete() }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                              Confirm delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
          </div>
        </div>
      </aside>

      {/* ── Main: Task board ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile back nav */}
        <div className="lg:hidden px-5 pt-5 pb-3 shrink-0">
          <Link
            href={`/u/${username}/projects/${projectId}?tab=sprints`}
            className="inline-flex items-center gap-1.5 text-sm text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to Sprints
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ── Column: Ongoing ───────────────────────────────────── */}
            <div className="rounded-xl border border-[#404040] bg-[#252525] overflow-hidden flex flex-col">
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#404040] bg-[#2D2D2D] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#A0A0A0] tracking-wide">Ongoing</span>
                  <span className={cn(
                    'text-[10px] tabular-nums px-1.5 py-0.5 rounded-full font-medium',
                    ongoingTasks.length > 0
                      ? 'bg-[rgba(139,156,182,0.06)] text-[var(--space-accent)] border border-[rgba(139,156,182,0.15)]'
                      : 'bg-[#2D2D2D] text-[#4A4A4A] border border-[#404040]',
                  )}>
                    {ongoingTasks.length}
                  </span>
                </div>
                {!readOnly && (
                  <BacklogPicker
                    tasks={projectBacklog}
                    sprintId={sprint.id}
                    onAdded={handleBacklogAdded}
                  />
                )}
              </div>

              {/* Task list */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#333333]">
                {ongoingTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="inline-flex p-3 rounded-xl bg-[#2D2D2D] border border-[#404040] mb-3">
                      <Flag className="size-4 text-[#4A4A4A]" />
                    </div>
                    <p className="text-sm text-[#4A4A4A] font-medium">No ongoing tasks</p>
                    {!readOnly && (
                      <p className="text-xs text-[#4A4A4A] mt-1">Add a task below or pull from the backlog</p>
                    )}
                  </div>
                ) : (
                  ongoingTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      {...taskCardCommonProps}
                    />
                  ))
                )}
              </div>

              {/* Footer: Inline task create */}
              {!readOnly && (
                <div className="shrink-0">
                  <InlineTaskCreate
                    projectId={projectId}
                    sprintId={sprint.id}
                    onCreated={handleTaskCreated}
                  />
                </div>
              )}
            </div>

            {/* ── Column: Finished ──────────────────────────────────── */}
            <div className="rounded-xl border border-[#404040] bg-[#252525] overflow-hidden flex flex-col">
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#404040] bg-[#252525] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B6B6B] tracking-wide">Finished</span>
                  <span className={cn(
                    'text-[10px] tabular-nums px-1.5 py-0.5 rounded-full font-medium',
                    doneTasks.length > 0
                      ? 'bg-green-400/10 text-green-400/70 border border-green-400/20'
                      : 'bg-[#2D2D2D] text-[#4A4A4A] border border-[#404040]',
                  )}>
                    {doneTasks.length}
                  </span>
                </div>
                {doneTasks.length === totalCount && totalCount > 0 && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-green-400/60" />
                    <span className="text-[10px] text-green-400/60">Complete</span>
                  </div>
                )}
              </div>

              {/* Task list */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#333333]">
                {doneTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="inline-flex p-3 rounded-xl bg-[#2D2D2D] border border-[#404040] mb-3">
                      <CheckCircle2 className="size-4 text-[#4A4A4A]" />
                    </div>
                    <p className="text-sm text-[#4A4A4A] font-medium">No finished tasks</p>
                    <p className="text-xs text-[#4A4A4A] mt-1">Completed tasks appear here</p>
                  </div>
                ) : (
                  doneTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      {...taskCardCommonProps}
                    />
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
