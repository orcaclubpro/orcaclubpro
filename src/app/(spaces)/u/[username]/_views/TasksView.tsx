'use client'

import { useState, useEffect, useTransition, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Check, Zap, Maximize2, Minimize2, X, Pencil, Plus, Loader2, ChevronRight, ChevronDown, Target, AlignLeft, Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateTaskStatus, updateTask, createTask } from '@/actions/tasks'
import { updateSprint, addSprintNote, deleteSprintNote, updateSprintStatus } from '@/actions/sprints'
import { cn } from '@/lib/utils'
import { CreateSprintModal } from '@/components/dashboard/CreateSprintModal'

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

const PRIORITY_CFG: Record<string, { label: string; short: string; color: string; bg: string; text: string }> = {
  low:    { label: 'Low',    short: 'L', color: 'text-gray-500',   bg: 'bg-gray-500/10 border-gray-500/20',     text: 'text-gray-500'   },
  medium: { label: 'Medium', short: 'M', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20',     text: 'text-blue-400'   },
  high:   { label: 'High',   short: 'H', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', text: 'text-yellow-400' },
  urgent: { label: 'Urgent', short: 'U', color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20',       text: 'text-red-400'    },
}

const SPRINT_STATUS_CFG: Record<string, { label: string; text: string; dot: string; bar: string }> = {
  pending:       { label: 'Pending',  text: 'text-gray-500',          dot: 'bg-gray-500',          bar: 'bg-gray-500/40'          },
  'in-progress': { label: 'Active',   text: 'text-intelligence-cyan', dot: 'bg-intelligence-cyan', bar: 'bg-intelligence-cyan/60' },
  delayed:       { label: 'Delayed',  text: 'text-yellow-400',        dot: 'bg-yellow-400',        bar: 'bg-yellow-400/60'        },
  finished:      { label: 'Done',     text: 'text-green-400',         dot: 'bg-green-400',         bar: 'bg-green-400/60'         },
}

const ACTIVE_SPRINT_STATUSES = new Set(['in-progress', 'delayed'])
const COLUMN_STATUS_ORDER = ['in-progress', 'pending', 'completed', 'cancelled']
const ACTIVE_TASK_STATUSES = new Set<string>(['in-progress', 'pending'])
const UNASSIGNED = '__unassigned__'

type Priority = 'low' | 'medium' | 'high' | 'urgent'
type MobileTab = 'overview' | 'a' | 'b'

interface EditState {
  taskId: string
  title: string
  description: string
  priority: Priority
  dueDate: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getProjectId(sprint: any): string | null {
  if (!sprint?.project) return null
  return typeof sprint.project === 'object' ? (sprint.project?.id ?? null) : sprint.project
}

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

function fmtMonth(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', ...(d.getMonth() === 0 ? { year: '2-digit' } : {}) })
}

function isOverdue(d: string | null | undefined): boolean {
  return d ? new Date(d) < new Date() : false
}

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
        {pc.short}
      </span>
    </div>
  )
}

// ─── task card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  updating,
  onToggle,
  isLocallyActive,
  onActivate,
  editState,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  isSaving,
  onPriorityChange,
}: {
  task: any
  updating: boolean
  onToggle: (task: any) => void
  isLocallyActive: boolean
  onActivate: () => void
  editState: EditState | null
  onEditStart: (task: any) => void
  onEditChange: (patch: Partial<EditState>) => void
  onEditSave: (task: any) => void
  onEditCancel: () => void
  isSaving: boolean
  onPriorityChange: (task: any, priority: Priority) => void
}) {
  const pc = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.medium
  const over = isOverdue(task.dueDate) && task.status !== 'completed'
  const done = task.status === 'completed' || task.status === 'cancelled'
  const projectName = getProjectName(task)
  const isEditing = editState?.taskId === task.id
  const titleRef = useRef<HTMLInputElement>(null)
  const [priorityPickerOpen, setPriorityPickerOpen] = useState(false)

  useEffect(() => {
    if (isEditing) setTimeout(() => titleRef.current?.focus(), 50)
  }, [isEditing])

  if (isEditing && editState) {
    return (
      <div className="mx-1 mb-1 px-3 py-3 bg-white/[0.025] rounded-lg border border-white/[0.08] space-y-2">
        <div className="flex items-center gap-2">
          <Input
            ref={titleRef}
            value={editState.title}
            onChange={(e) => onEditChange({ title: e.target.value })}
            placeholder="Task title…"
            className="flex-1 bg-white/[0.04] border-white/[0.10] text-white placeholder:text-gray-600 focus:border-intelligence-cyan/40 h-7 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave(task)
              if (e.key === 'Escape') onEditCancel()
            }}
          />
          <button
            type="button"
            onClick={() => onEditSave(task)}
            disabled={isSaving || !editState.title.trim()}
            className="p-1.5 rounded-lg bg-intelligence-cyan/10 text-intelligence-cyan hover:bg-intelligence-cyan/20 transition-colors disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
          </button>
          <button type="button" onClick={onEditCancel} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/[0.04] transition-colors">
            <X className="size-3.5" />
          </button>
        </div>
        <Textarea
          value={editState.description}
          onChange={(e) => onEditChange({ description: e.target.value })}
          placeholder="Description (optional)…"
          rows={2}
          className="w-full bg-white/[0.03] border-white/[0.08] text-gray-300 placeholder:text-gray-700 focus:border-intelligence-cyan/30 resize-none text-xs leading-relaxed"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onEditChange({ priority: p })}
                className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                  editState.priority === p
                    ? cn(PRIORITY_CFG[p].text, 'border-current bg-current/10')
                    : 'text-gray-600 border-white/[0.08] hover:border-white/20',
                )}
              >
                {PRIORITY_CFG[p].label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={editState.dueDate}
            onChange={(e) => onEditChange({ dueDate: e.target.value })}
            className="ml-auto text-[11px] text-gray-500 bg-transparent border border-white/[0.08] rounded px-2 py-0.5 focus:outline-none focus:border-white/20"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-all cursor-pointer select-none border-l-2',
        isLocallyActive
          ? 'bg-intelligence-cyan/[0.04] border-intelligence-cyan/40 hover:bg-intelligence-cyan/[0.07]'
          : 'border-transparent hover:bg-white/[0.04]',
        (updating || isSaving) && 'opacity-50 pointer-events-none',
        done && 'opacity-55',
      )}
      onClick={() => { setPriorityPickerOpen(false); onActivate() }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(task) }}
        title={done ? 'Mark pending' : 'Mark done'}
        className={cn(
          'shrink-0 mt-[3px] size-4 rounded-full border flex items-center justify-center transition-all focus:outline-none',
          done
            ? 'bg-green-400/80 border-green-400/80 hover:bg-green-300/70'
            : task.status === 'in-progress'
            ? 'border-intelligence-cyan/50 hover:border-intelligence-cyan'
            : 'border-white/20 hover:border-intelligence-cyan/50 hover:bg-intelligence-cyan/5',
        )}
      >
        {done ? (
          <Check className="size-2.5 text-black" strokeWidth={3} />
        ) : task.status === 'in-progress' ? (
          <span className="size-1.5 rounded-full bg-intelligence-cyan/70 animate-pulse" />
        ) : null}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', done ? 'line-through text-gray-600' : isLocallyActive ? 'text-white' : 'text-gray-200')}>
          {task.title}
        </p>
        {(() => {
          const desc = extractPlainText(task.description)
          if (!desc) return null
          return isLocallyActive
            ? <p className="text-xs text-gray-400 mt-1 leading-relaxed">{desc}</p>
            : <p className="text-xs text-gray-600 mt-0.5 truncate leading-snug">{desc}</p>
        })()}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {projectName && <span className="text-[10px] text-gray-600">{projectName}</span>}
          {priorityPickerOpen ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => {
                const cfg = PRIORITY_CFG[p]
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onPriorityChange(task, p); setPriorityPickerOpen(false) }}
                    className={cn(
                      'text-[9px] font-bold px-1.5 rounded border leading-4 transition-all',
                      task.priority === p ? cn(cfg.color, cfg.bg) : 'text-gray-500 border-white/[0.10] hover:text-gray-200 hover:border-white/25',
                    )}
                  >
                    {cfg.short}
                  </button>
                )
              })}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPriorityPickerOpen(true) }}
              className={cn('text-[10px] font-semibold px-1.5 rounded border leading-4 transition-opacity hover:opacity-60', pc.color, pc.bg)}
              title="Change priority"
            >
              {pc.short}
            </button>
          )}
          {task.dueDate && (
            <span className={`text-[10px] ${over ? 'text-red-400' : 'text-gray-600'}`}>
              {fmtDate(task.dueDate)}{over ? ' · overdue' : ''}
            </span>
          )}
        </div>
        {isLocallyActive && (
          <div className="mt-2 pt-2 border-t border-white/[0.06] flex flex-wrap gap-x-3 gap-y-1">
            <span className={`text-[10px] font-medium ${STATUS_DOT[task.status] ? '' : ''}`}>
              <span className={`inline-block size-1.5 rounded-full mr-1 ${STATUS_DOT[task.status] ?? 'bg-gray-500'}`} />
              <span className="text-gray-400">{STATUS_LABEL[task.status] ?? 'Pending'}</span>
            </span>
            {task.estimatedHours != null && (
              <span className="text-[10px] text-gray-500">
                Est <span className="text-gray-400">{task.estimatedHours}h</span>
              </span>
            )}
            {task.actualHours != null && (
              <span className="text-[10px] text-gray-500">
                Actual <span className="text-gray-400">{task.actualHours}h</span>
              </span>
            )}
            {(() => {
              const sprint = getSprintObj(task)
              return sprint?.name
                ? <span className="text-[10px] text-gray-500">Sprint <span className="text-gray-400">{sprint.name}</span></span>
                : null
            })()}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEditStart(task) }}
        className="shrink-0 mt-0.5 p-1 rounded-md text-gray-700 hover:text-gray-300 hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100"
        title="Edit task"
      >
        <Pencil className="size-3" />
      </button>
    </div>
  )
}

// ─── inline quick-add ─────────────────────────────────────────────────────────

function InlineAdd({ projectId, sprintId, onCreated }: { projectId: string; sprintId: string; onCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const handleClose = () => { setIsOpen(false); setTitle(''); setDescription(''); setPriority('medium') }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      await createTask({ projectId, title: title.trim(), description: description.trim() || undefined, priority, sprintId })
      handleClose()
      onCreated()
    })
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-[11px] text-gray-700 hover:text-gray-400 hover:bg-white/[0.02] transition-colors shrink-0"
      >
        <Plus className="size-3" />
        Add task
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-3 my-2 rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden shrink-0"
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose() }}
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        disabled={isPending}
        className="border-0 border-b border-white/[0.06] rounded-none bg-transparent text-white placeholder:text-gray-700 focus-visible:ring-0 h-8 text-xs px-3"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)…"
        disabled={isPending}
        rows={2}
        className="border-0 border-b border-white/[0.06] rounded-none bg-transparent text-white placeholder:text-gray-700 focus-visible:ring-0 text-xs px-3 py-2 resize-none min-h-0"
      />
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <div className="flex items-center gap-1 flex-1">
          {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => {
            const pc = PRIORITY_CFG[p]
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  'text-[9px] font-bold px-1.5 rounded border leading-4 transition-colors',
                  priority === p ? `${pc.color} ${pc.bg}` : 'text-gray-700 border-white/[0.06] hover:text-gray-400',
                )}
              >
                {pc.short}
              </button>
            )
          })}
        </div>
        <button type="submit" disabled={isPending || !title.trim()} className="p-1.5 rounded-lg bg-intelligence-cyan/10 text-intelligence-cyan hover:bg-intelligence-cyan/20 transition-colors disabled:opacity-40 shrink-0">
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
        </button>
        <button type="button" onClick={handleClose} className="p-1.5 rounded-lg text-gray-700 hover:text-gray-400 transition-colors shrink-0">
          <X className="size-3" />
        </button>
      </div>
    </form>
  )
}

// ─── unassigned inline quick-add ─────────────────────────────────────────────

function UnassignedInlineAdd({
  projects,
  onCreated,
}: {
  projects: { id: string; name: string }[]
  onCreated: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    setTitle('')
    setDescription('')
    setPriority('medium')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedProjectId) return
    startTransition(async () => {
      await createTask({ projectId: selectedProjectId, title: title.trim(), description: description.trim() || undefined, priority })
      handleClose()
      onCreated()
    })
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-[11px] text-gray-700 hover:text-gray-400 hover:bg-white/[0.02] transition-colors shrink-0"
      >
        <Plus className="size-3" />
        Add task
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-3 my-2 rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden shrink-0"
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose() }}
    >
      {projects.length > 1 && (
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="h-7 border-0 border-b border-white/[0.06] rounded-none bg-transparent text-gray-400 focus:ring-0 text-[11px] px-3">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/[0.08] z-[300]">
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-white text-xs">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        disabled={isPending}
        className="border-0 border-b border-white/[0.06] rounded-none bg-transparent text-white placeholder:text-gray-700 focus-visible:ring-0 h-8 text-xs px-3"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)…"
        disabled={isPending}
        rows={2}
        className="border-0 border-b border-white/[0.06] rounded-none bg-transparent text-white placeholder:text-gray-700 focus-visible:ring-0 text-xs px-3 py-2 resize-none min-h-0"
      />
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <div className="flex items-center gap-1 flex-1">
          {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => {
            const pc = PRIORITY_CFG[p]
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  'text-[9px] font-bold px-1.5 rounded border leading-4 transition-colors',
                  priority === p ? `${pc.color} ${pc.bg}` : 'text-gray-700 border-white/[0.06] hover:text-gray-400',
                )}
              >
                {pc.short}
              </button>
            )
          })}
        </div>
        <button
          type="submit"
          disabled={isPending || !title.trim() || !selectedProjectId}
          className="p-1.5 rounded-lg bg-intelligence-cyan/10 text-intelligence-cyan hover:bg-intelligence-cyan/20 transition-colors disabled:opacity-40 shrink-0"
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
        </button>
        <button type="button" onClick={handleClose} className="p-1.5 rounded-lg text-gray-700 hover:text-gray-400 transition-colors shrink-0">
          <X className="size-3" />
        </button>
      </div>
    </form>
  )
}

// ─── sprint column body (reused on mobile + desktop) ─────────────────────────

interface ColumnBodyProps {
  sprint: any | null
  selectedSprintId: string | null
  sprintMap: Map<string, any>
  onSelect: (id: string | null) => void
  columnTasks: any[]
  completedCount: number
  progress: number
  activeTasks: any[]
  statusGroups: { status: string; tasks: any[] }[]
  projectId: string | null
  label: string
  updatingIds: Set<string>
  onToggle: (task: any) => void
  activeTaskIds: Set<string>
  onActivate: (taskId: string) => void
  editState: EditState | null
  onEditStart: (task: any) => void
  onEditChange: (patch: Partial<EditState>) => void
  onEditSave: (task: any) => void
  onEditCancel: () => void
  savingId: string | null
  onTaskCreated: () => void
  onPriorityChange: (task: any, priority: Priority) => void
  isExpanded?: boolean
  onExpand?: () => void
  onCollapse?: () => void
  hiddenDoneCount?: number
  projects?: { id: string; name: string }[]
}

function ColumnBody({
  sprint, selectedSprintId, sprintMap, onSelect,
  columnTasks, completedCount, progress,
  activeTasks, statusGroups, projectId, label,
  updatingIds, onToggle, activeTaskIds, onActivate,
  editState, onEditStart, onEditChange, onEditSave, onEditCancel,
  savingId, onTaskCreated, onPriorityChange,
  isExpanded = false, onExpand = () => {}, onCollapse = () => {}, hiddenDoneCount = 0,
  projects = [],
}: ColumnBodyProps) {
  const sCfg = sprint ? (SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG.pending) : null
  const allSprints = Array.from(sprintMap.values())

  return (
    <>
      {/* Sticky header group: sprint selector + timeline (when expanded) */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]">
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] font-bold gradient-text uppercase tracking-[0.15em]">{label}</span>
            <div className="flex items-center gap-2">
              {sCfg && <span className={`text-[10px] font-medium ${sCfg.text}`}>{sCfg.label}</span>}
              <button
                type="button"
                onClick={isExpanded ? onCollapse : onExpand}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors',
                  isExpanded
                    ? 'text-gray-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.10]'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.06]'
                )}
              >
                {isExpanded
                  ? <><Minimize2 className="size-3" />Collapse</>
                  : <><Maximize2 className="size-3" />Expand</>
                }
              </button>
            </div>
          </div>
          <Select value={selectedSprintId ?? UNASSIGNED} onValueChange={(v) => onSelect(v === UNASSIGNED ? null : v)}>
            <SelectTrigger className="h-8 bg-white/[0.04] border-white/[0.08] text-white text-sm focus:border-intelligence-cyan/40">
              <SelectValue placeholder="Select sprint" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/[0.08] z-[300]">
              <SelectItem value={UNASSIGNED} className="text-gray-400">Unassigned tasks</SelectItem>
              {allSprints.map((s) => {
                const projName = typeof s.project === 'object' ? (s.project?.name ?? '') : ''
                return (
                  <SelectItem key={s.id} value={s.id} className="text-white">
                    {s.name}
                    {projName && <span className="text-gray-500 ml-1.5 text-xs">· {projName}</span>}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {columnTasks.length > 0 && (
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex-1 h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${sCfg?.bar ?? 'bg-intelligence-cyan/60'}`} style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] text-gray-300 shrink-0 tabular-nums">{completedCount}/{columnTasks.length}</span>
            </div>
          )}
        </div>
        {/* Full project timeline — shown when expanded */}
        {isExpanded && sprint && (
          <TaskTimeline
            sprintMap={sprintMap}
            projectId={sprint ? getProjectId(sprint) : null}
            selectedSprintId={selectedSprintId}
            onSelect={onSelect}
          />
        )}
      </div>

      {/* Task list */}
      <div className="py-2 space-y-1 px-1">
        {selectedSprintId === null && columnTasks.length === 0 && projects.length === 0 ? (
          <div className="flex items-center justify-center py-10 px-4">
            <p className="text-xs text-gray-400 text-center">Select a sprint above</p>
          </div>
        ) : (
          <>
            {/* Active section */}
            <div>
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                <span className="size-1.5 rounded-full bg-intelligence-cyan shrink-0" style={{ boxShadow: '0 0 6px rgba(103,232,249,0.6)' }} />
                <span className="text-[9px] font-semibold text-intelligence-cyan uppercase tracking-[0.12em]">Active</span>
                {activeTasks.length > 0 && <span className="text-[9px] text-gray-400">· {activeTasks.length}</span>}
              </div>
              {activeTasks.length === 0 ? (
                <p className="text-[10px] text-gray-700 px-3 pb-1">Click a task to focus it here</p>
              ) : (
                activeTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    updating={updatingIds.has(task.id)}
                    onToggle={onToggle}
                    isLocallyActive
                    onActivate={() => onActivate(task.id)}
                    editState={editState}
                    onEditStart={onEditStart}
                    onEditChange={onEditChange}
                    onEditSave={onEditSave}
                    onEditCancel={onEditCancel}
                    isSaving={savingId === task.id}
                    onPriorityChange={onPriorityChange}
                  />
                ))
              )}
              {/* Add task — right under Active */}
              {selectedSprintId && projectId
                ? <InlineAdd projectId={projectId} sprintId={selectedSprintId} onCreated={onTaskCreated} />
                : selectedSprintId === null && projects.length > 0
                  ? <UnassignedInlineAdd projects={projects} onCreated={onTaskCreated} />
                  : null
              }
              {statusGroups.length > 0 && <div className="mx-3 my-1.5 h-px bg-white/[0.05]" />}
            </div>

            {/* Status groups */}
            {statusGroups.map(({ status, tasks }) => (
              <div key={status}>
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <span className={`size-1 rounded-full ${STATUS_DOT[status] ?? 'bg-gray-500'}`} />
                  <span className="text-[9px] font-semibold gradient-text uppercase tracking-[0.12em]">{STATUS_LABEL[status]}</span>
                  <span className="text-[9px] text-gray-400">· {tasks.length}</span>
                </div>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    updating={updatingIds.has(task.id)}
                    onToggle={onToggle}
                    isLocallyActive={false}
                    onActivate={() => onActivate(task.id)}
                    editState={editState}
                    onEditStart={onEditStart}
                    onEditChange={onEditChange}
                    onEditSave={onEditSave}
                    onEditCancel={onEditCancel}
                    isSaving={savingId === task.id}
                    onPriorityChange={onPriorityChange}
                  />
                ))}
              </div>
            ))}

            {!isExpanded && hiddenDoneCount > 0 && (
              <button
                type="button"
                onClick={onExpand}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
              >
                <span className="size-1 rounded-full bg-green-400/40 shrink-0" />
                {hiddenDoneCount} completed · expand to view
              </button>
            )}

            {columnTasks.length === 0 && selectedSprintId && (
              <p className="text-xs text-gray-400 text-center py-8 px-4">
                {sprint ? `No tasks in ${sprint.name}` : 'No tasks'}
              </p>
            )}
            {columnTasks.length === 0 && selectedSprintId === null && projects.length > 0 && (
              <p className="text-xs text-gray-500 text-center py-4 px-4">No unassigned tasks</p>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── task timeline ────────────────────────────────────────────────────────────

const TL_TRACK_Y    = 16
const TL_TRACK_H    = 3
const TL_SPRINT_TOP = TL_TRACK_Y + TL_TRACK_H + 6
const TL_SPRINT_H   = 26
const TL_SPRINT_GAP = 4
const TL_PX_PER_DAY = 10

function TaskTimeline({
  sprintMap, projectId, selectedSprintId, onSelect,
}: {
  sprintMap: Map<string, any>
  projectId: string | null
  selectedSprintId: string | null
  onSelect: (id: string | null) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Filter to project's sprints only
  const projectSprints = useMemo(
    () => Array.from(sprintMap.values()).filter((s) => !projectId || getProjectId(s) === projectId),
    [sprintMap, projectId],
  )
  const withDates = projectSprints.filter((s) => s.startDate && s.endDate)

  const tlStart = withDates.length > 0
    ? Math.min(...withDates.map((s) => new Date(s.startDate!).getTime()))
    : Date.now()
  const tlEnd = withDates.length > 0
    ? Math.max(...withDates.map((s) => new Date(s.endDate!).getTime())) + 14 * 86_400_000
    : Date.now() + 30 * 86_400_000
  const tlDur = tlEnd - tlStart || 1
  const totalDays = Math.round(tlDur / 86_400_000)
  const timelineWidth = Math.max(1200, totalDays * TL_PX_PER_DAY)

  const toPx = (d: string | null | undefined) => {
    if (!d) return 0
    return Math.max(0, Math.min(timelineWidth, ((new Date(d).getTime() - tlStart) / tlDur) * timelineWidth))
  }

  const todayPx = Math.max(0, Math.min(timelineWidth, ((Date.now() - tlStart) / tlDur) * timelineWidth))

  // Scroll to today on open
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !isOpen || todayPx <= 0) return
    el.scrollLeft = Math.max(0, todayPx - el.clientWidth * 0.35)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Sprint bands with multi-row layout to prevent overlap
  const sprintBands = useMemo(() => {
    if (withDates.length === 0) return []
    const raw = withDates.map((s) => {
      const leftPx  = toPx(s.startDate)
      const rightPx = toPx(s.endDate)
      return { ...s, leftPx, widthPx: Math.max(4, rightPx - leftPx), cfg: SPRINT_STATUS_CFG[s.status] ?? SPRINT_STATUS_CFG.pending, row: 0 }
    }).sort((a, b) => a.leftPx - b.leftPx)
    const rowEnds: number[] = []
    raw.forEach((band) => {
      let row = rowEnds.findIndex((end) => end <= band.leftPx - 2)
      if (row === -1) row = rowEnds.length
      rowEnds[row] = band.leftPx + band.widthPx
      band.row = row
    })
    return raw
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSprints, tlStart, tlEnd])

  const rowCount  = sprintBands.length === 0 ? 1 : Math.max(...sprintBands.map((b) => b.row + 1))
  const tickY     = TL_SPRINT_TOP + rowCount * (TL_SPRINT_H + TL_SPRINT_GAP) + 8
  const innerH    = tickY + 24

  const monthTicks = useMemo(() => {
    const ticks: { label: string; px: number }[] = []
    const cursor = new Date(new Date(tlStart).getFullYear(), new Date(tlStart).getMonth() + 1, 1)
    const end    = new Date(tlEnd)
    while (cursor < end) {
      ticks.push({ label: fmtMonth(cursor), px: toPx(cursor.toISOString()) })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return ticks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tlStart, tlEnd])

  return (
    <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.16em]">Project Track</span>
          {sprintBands.length > 0 && (
            <span className="text-[8px] text-gray-700">{sprintBands.length} sprint{sprintBands.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOpen && todayPx > 0 && todayPx < timelineWidth && (
            <button type="button"
              onClick={() => { const el = scrollRef.current; if (el) el.scrollTo({ left: Math.max(0, todayPx - el.clientWidth * 0.35), behavior: 'smooth' }) }}
              className="text-[8px] text-intelligence-cyan/50 hover:text-intelligence-cyan transition-colors"
            >→ today</button>
          )}
          <button type="button" onClick={() => setIsOpen((p) => !p)}
            title={isOpen ? 'Minimize timeline' : 'Expand timeline'}
            className="p-0.5 rounded text-gray-700 hover:text-gray-300 hover:bg-white/[0.06] transition-colors">
            {isOpen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </button>
        </div>
      </div>

      {/* Timeline body */}
      {isOpen && (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
          <div
            ref={scrollRef}
            className="overflow-x-auto [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-thumb]:bg-white/[0.12] [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent' }}
          >
            <div className="relative select-none" style={{ width: timelineWidth, height: innerH }}>

              {/* Sprint bands */}
              {sprintBands.map((sprint) => {
                const top = TL_SPRINT_TOP + sprint.row * (TL_SPRINT_H + TL_SPRINT_GAP)
                const isSelected = sprint.id === selectedSprintId
                return (
                  <button key={sprint.id} type="button" onClick={() => onSelect(sprint.id)} title={sprint.name}
                    className={cn(
                      'absolute rounded-sm flex items-center px-1.5 overflow-hidden transition-all duration-150',
                      isSelected ? 'ring-1 ring-intelligence-cyan/50 z-10 opacity-100' : 'opacity-55 hover:opacity-85 z-0',
                      sprint.cfg.bar,
                    )}
                    style={{ left: sprint.leftPx, top, width: sprint.widthPx, height: TL_SPRINT_H }}
                  >
                    {sprint.widthPx > 36 && (
                      <span className={cn('text-[8px] font-semibold truncate leading-none', sprint.cfg.text)}>
                        {sprint.name}
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Track bar */}
              <div className="absolute left-0 right-0 bg-white/[0.06] rounded-full" style={{ top: TL_TRACK_Y, height: TL_TRACK_H }} />
              {todayPx > 0 && (
                <div className="absolute left-0 rounded-full" style={{ top: TL_TRACK_Y, height: TL_TRACK_H, width: todayPx, background: 'linear-gradient(to right, #67e8f9, #3b82f6)' }} />
              )}

              {/* Today marker */}
              {todayPx > 0 && todayPx < timelineWidth && (
                <div className="absolute pointer-events-none z-20" style={{ left: todayPx, top: 0, height: innerH, transform: 'translateX(-50%)' }}>
                  <div className="absolute left-1/2 -translate-x-1/2 w-px h-full" style={{ background: 'linear-gradient(to bottom, rgba(103,232,249,0.35), rgba(103,232,249,0.05))' }} />
                  <p className="absolute left-1/2 -translate-x-1/2 text-[7px] tracking-[0.15em] uppercase text-intelligence-cyan/60 font-medium whitespace-nowrap" style={{ top: 2 }}>
                    today
                  </p>
                  <div className="absolute left-1/2 z-30" style={{ top: TL_TRACK_Y - 3, transform: 'translateX(-50%)' }}>
                    <div className="size-2 rounded-full bg-intelligence-cyan shadow-[0_0_6px_rgba(103,232,249,0.85)]" />
                  </div>
                </div>
              )}

              {/* Month tick marks */}
              {monthTicks.map((tick) => (
                <div key={tick.px} className="absolute pointer-events-none" style={{ left: tick.px, top: tickY }}>
                  <div className="w-px h-2 bg-white/[0.10] mx-auto" />
                  <p className="text-[7px] text-gray-700 text-center mt-0.5 whitespace-nowrap -translate-x-1/2">{tick.label}</p>
                </div>
              ))}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── sprint donut chart ───────────────────────────────────────────────────────

function SprintDonutChart({
  total, completed, inProg,
}: {
  total: number
  completed: number
  inProg: number
}) {
  const r = 38
  const C = 2 * Math.PI * r
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const completedLen = total > 0 ? C * (completed / total) : 0
  const inProgLen = total > 0 ? C * (inProg / total) : 0
  const completedStartAngle = -90
  const inProgStartAngle = -90 + 360 * (completed / (total || 1))

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="donut-done" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        {/* Background ring */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        {/* Completed arc — gradient cyan → blue */}
        {completed > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="url(#donut-done)"
            strokeWidth="10"
            strokeDasharray={`${completedLen} ${C - completedLen}`}
            transform={`rotate(${completedStartAngle}, 50, 50)`}
            strokeLinecap="round"
          />
        )}
        {/* In-progress arc — soft blue */}
        {inProg > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="rgba(147,197,253,0.4)"
            strokeWidth="10"
            strokeDasharray={`${inProgLen} ${C - inProgLen}`}
            transform={`rotate(${inProgStartAngle}, 50, 50)`}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center pointer-events-none select-none">
        {total === 0 ? (
          <span className="text-xs text-gray-600">No tasks</span>
        ) : (
          <>
            <span className="text-3xl font-bold text-white tabular-nums leading-none">{pct}%</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-[0.1em] mt-1">complete</span>
            <span className="text-[10px] text-gray-400 tabular-nums mt-0.5">{completed}/{total}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── sprint column (desktop panel) ───────────────────────────────────────────

function SprintColumn({
  label, sprintMap, allTasks, selectedSprintId, onSelect,
  updatingIds, onToggle, bg = 'bg-[#0f0f0f]',
  activeTaskIds, onActivate,
  editState, onEditStart, onEditChange, onEditSave, onEditCancel,
  savingId, onTaskCreated, onPriorityChange,
  isExpanded = false, onExpand, onCollapse,
  projects = [],
}: {
  label: string
  sprintMap: Map<string, any>
  allTasks: any[]
  selectedSprintId: string | null
  onSelect: (id: string | null) => void
  updatingIds: Set<string>
  onToggle: (task: any) => void
  bg?: string
  activeTaskIds: Set<string>
  onActivate: (taskId: string) => void
  editState: EditState | null
  onEditStart: (task: any) => void
  onEditChange: (patch: Partial<EditState>) => void
  onEditSave: (task: any) => void
  onEditCancel: () => void
  savingId: string | null
  onTaskCreated: () => void
  onPriorityChange: (task: any, priority: Priority) => void
  isExpanded?: boolean
  onExpand?: () => void
  onCollapse?: () => void
  projects?: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [editDraft, setEditDraft] = useState({ name: '', goalDescription: '', description: '', startDate: '', endDate: '' })
  const [isSavingSprint, startSprintSave] = useTransition()
  const [localNotes, setLocalNotes] = useState<{ text: string; createdAt?: string | null }[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [isAddingNote, startAddNote] = useTransition()
  const [, startDeleteNote] = useTransition()
  const [isFinishingSprint, startFinishSprint] = useTransition()
  const noteInputRef = useRef<HTMLTextAreaElement>(null)
  const [sessionGoal, setSessionGoal] = useState('')
  const [sessionNotes, setSessionNotes] = useState<{ text: string; createdAt: string }[]>([])
  const [newSessionNoteText, setNewSessionNoteText] = useState('')
  const sessionNoteInputRef = useRef<HTMLTextAreaElement>(null)

  // Sync notes when sprint changes
  const sprintId = selectedSprintId
  useEffect(() => {
    const s = sprintId ? sprintMap.get(sprintId) : null
    setLocalNotes(Array.isArray(s?.notes) ? s.notes : [])
  }, [sprintId, sprintMap])

  useEffect(() => { if (!isExpanded) setEditMode(false) }, [isExpanded])

  const enterEditMode = (s: any) => {
    setEditDraft({
      name: s.name ?? '',
      goalDescription: s.goalDescription ?? '',
      description: s.description ?? '',
      startDate: s.startDate?.slice(0, 10) ?? '',
      endDate: s.endDate?.slice(0, 10) ?? '',
    })
    setEditMode(true)
  }

  const handleSaveSprint = (s: any) => {
    startSprintSave(async () => {
      await updateSprint({
        sprintId: s.id,
        name: editDraft.name.trim() || s.name,
        goalDescription: editDraft.goalDescription.trim() || undefined,
        description: editDraft.description.trim() || undefined,
        startDate: editDraft.startDate || undefined,
        endDate: editDraft.endDate || undefined,
      })
      setEditMode(false)
      router.refresh()
    })
  }

  const handleFinishSprint = (s: any, status: 'finished' | 'in-progress' = 'finished') => {
    startFinishSprint(async () => {
      await updateSprintStatus({ sprintId: s.id, status })
      router.refresh()
    })
  }

  const handleAddNote = (s: any) => {
    const text = newNoteText.trim()
    if (!text) return
    const optimistic = { text, createdAt: new Date().toISOString() }
    setLocalNotes((prev) => [...prev, optimistic])
    setNewNoteText('')
    startAddNote(async () => {
      await addSprintNote({ sprintId: s.id, text })
      router.refresh()
    })
  }

  const handleDeleteNote = (s: any, noteIndex: number) => {
    setLocalNotes((prev) => prev.filter((_, i) => i !== noteIndex))
    startDeleteNote(async () => {
      await deleteSprintNote({ sprintId: s.id, noteIndex })
      router.refresh()
    })
  }

  const sprint = selectedSprintId ? sprintMap.get(selectedSprintId) : null
  const projectId = sprint ? getProjectId(sprint) : null
  const columnTasks = tasksForSprint(allTasks, selectedSprintId)
  const completedCount = columnTasks.filter((t) => t.status === 'completed').length
  const progress = columnTasks.length > 0 ? Math.round((completedCount / columnTasks.length) * 100) : 0
  const activeTasks = columnTasks.filter((t) => activeTaskIds.has(t.id))
  const nonActiveTasks = columnTasks.filter((t) => !activeTaskIds.has(t.id))
  const allStatusGroups = COLUMN_STATUS_ORDER
    .map((st) => ({ status: st, tasks: nonActiveTasks.filter((t) => t.status === st) }))
    .filter((g) => g.tasks.length > 0)
  const statusGroups = isExpanded
    ? allStatusGroups
    : allStatusGroups.filter((g) => ACTIVE_TASK_STATUSES.has(g.status))
  const hiddenDoneCount = isExpanded
    ? 0
    : allStatusGroups
        .filter((g) => !ACTIVE_TASK_STATUSES.has(g.status))
        .reduce((acc, g) => acc + g.tasks.length, 0)

  const sCfg = sprint ? (SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG.pending) : null
  const inProg = columnTasks.filter((t) => t.status === 'in-progress').length
  const pendingC = columnTasks.filter((t) => t.status === 'pending').length

  return (
    <div className={`flex-1 flex min-w-0 min-h-0 overflow-hidden relative ${bg}`}>

      {/* Sprint detail sidebar — LEFT side, expanded only, independent scroll */}
      {isExpanded && sprint && (
        <div className="w-80 shrink-0 border-r border-white/[0.06] flex flex-col min-h-0 overflow-hidden bg-[#0b0b0b]">
          {/* ── Scrollable sprint details + notes list ── */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">

          {/* Header: status + name + edit toggle */}
          <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={cn('size-1.5 rounded-full', sCfg?.dot ?? 'bg-gray-500')} />
                <span className={cn('text-[9px] font-bold uppercase tracking-[0.14em]', sCfg?.text ?? 'text-gray-500')}>{sCfg?.label}</span>
              </div>
              {!editMode ? (
                <button type="button" onClick={() => enterEditMode(sprint)} title="Edit sprint"
                  className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-colors">
                  <Pencil className="size-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => handleSaveSprint(sprint)} disabled={isSavingSprint}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-intelligence-cyan/10 text-intelligence-cyan hover:bg-intelligence-cyan/20 transition-colors disabled:opacity-50">
                    {isSavingSprint ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    Save
                  </button>
                  <button type="button" onClick={() => setEditMode(false)}
                    className="px-2 py-1 rounded-lg text-[10px] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {editMode ? (
              <Input value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                disabled={isSavingSprint}
                className="bg-white/[0.04] border-white/[0.08] text-white font-bold focus:border-intelligence-cyan/40 h-8 text-sm" />
            ) : (
              <h3 className="text-lg font-bold text-white leading-snug">{sprint.name}</h3>
            )}
            {typeof sprint.project === 'object' && sprint.project?.name && (
              <p className="text-xs text-gray-500 mt-1">{sprint.project.name}</p>
            )}
          </div>

          {/* Goal */}
          {(sprint.goalDescription || editMode) && (
            <div className="px-6 py-5 border-b border-white/[0.04]">
              <div className="flex items-start gap-3">
                <div className="w-0.5 self-stretch bg-intelligence-cyan/50 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-intelligence-cyan uppercase tracking-[0.14em] mb-2">Goal</p>
                  {editMode ? (
                    <Textarea value={editDraft.goalDescription}
                      onChange={(e) => setEditDraft((p) => ({ ...p, goalDescription: e.target.value }))}
                      placeholder="Describe the goal…"
                      rows={3} disabled={isSavingSprint}
                      className="bg-white/[0.04] border-white/[0.08] text-white text-sm font-semibold placeholder:text-gray-700 focus:border-intelligence-cyan/40 resize-none" />
                  ) : (
                    <p className="text-base font-semibold text-white leading-relaxed">{sprint.goalDescription}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Donut chart + task pills */}
          <div className="px-6 py-5 border-b border-white/[0.04] flex flex-col items-center gap-4">
            <SprintDonutChart total={columnTasks.length} completed={completedCount} inProg={inProg} />
            {columnTasks.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {inProg > 0 && (
                  <span className="text-[10px] text-intelligence-cyan/80 bg-intelligence-cyan/[0.06] border border-intelligence-cyan/[0.12] rounded-full px-2.5 py-0.5">
                    {inProg} active
                  </span>
                )}
                {pendingC > 0 && (
                  <span className="text-[10px] text-gray-300 bg-white/[0.04] border border-white/[0.07] rounded-full px-2.5 py-0.5">
                    {pendingC} pending
                  </span>
                )}
                {completedCount > 0 && (
                  <span className="text-[10px] text-blue-400/70 bg-blue-400/[0.05] border border-blue-400/[0.12] rounded-full px-2.5 py-0.5">
                    {completedCount} done
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 text-[9px] text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full shrink-0" style={{ background: 'linear-gradient(to right, #67e8f9, #3b82f6)' }} />
                Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-300/40 shrink-0" />
                In progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-white/[0.05] shrink-0" />
                Pending
              </span>
            </div>
          </div>

          {/* Notes list — inside scroll area, under project progression */}
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.14em]">Notes</span>
              {localNotes.length > 0 && (
                <span className="text-[9px] text-gray-600 tabular-nums">{localNotes.length}</span>
              )}
            </div>
            {localNotes.length === 0 && (
              <p className="text-xs text-gray-700 py-1">No notes yet</p>
            )}
            <div className="space-y-3">
              {localNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-relaxed break-words">{note.text}</p>
                    {note.createdAt && (
                      <p className="text-[9px] text-gray-600 mt-0.5">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(note.createdAt))}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(sprint, i)}
                    className="shrink-0 p-0.5 rounded text-gray-700 hover:text-red-400 hover:bg-red-400/[0.08] opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete note"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {(sprint.description || editMode) && (
            <div className="px-6 py-5 border-b border-white/[0.04]">
              <div className="flex items-start gap-2">
                <AlignLeft className="size-3.5 text-gray-600 shrink-0 mt-0.5" />
                {editMode ? (
                  <Textarea value={editDraft.description}
                    onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Add a description…"
                    rows={3} disabled={isSavingSprint}
                    className="flex-1 bg-white/[0.04] border-white/[0.08] text-white text-xs placeholder:text-gray-700 focus:border-intelligence-cyan/40 resize-none" />
                ) : (
                  <p className="text-xs text-gray-300 leading-relaxed">{sprint.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          {(sprint.startDate || sprint.endDate || editMode) && (
            <div className="px-6 py-5 border-b border-white/[0.04]">
              {editMode ? (
                <div className="space-y-2">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Timeline</p>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={editDraft.startDate} disabled={isSavingSprint}
                      onChange={(e) => setEditDraft((p) => ({ ...p, startDate: e.target.value }))}
                      className="flex-1 bg-white/[0.04] border-white/[0.08] text-white text-xs focus:border-intelligence-cyan/40 h-7" />
                    <span className="text-gray-600 text-xs shrink-0">→</span>
                    <Input type="date" value={editDraft.endDate} disabled={isSavingSprint}
                      onChange={(e) => setEditDraft((p) => ({ ...p, endDate: e.target.value }))}
                      className="flex-1 bg-white/[0.04] border-white/[0.08] text-white text-xs focus:border-intelligence-cyan/40 h-7" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>{fmtDate(sprint.startDate) ?? 'TBD'} → {fmtDate(sprint.endDate) ?? 'TBD'}</span>
                </div>
              )}
            </div>
          )}

          {/* Finish / Reopen Sprint button */}
          {!editMode && (
            <div className="px-6 py-5">
              {sprint.status === 'finished' ? (
                <button
                  type="button"
                  onClick={() => handleFinishSprint(sprint, 'in-progress')}
                  disabled={isFinishingSprint}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white text-sm font-semibold hover:bg-white/[0.10] transition-colors disabled:opacity-50"
                >
                  {isFinishingSprint ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                  Reopen Sprint
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFinishSprint(sprint, 'finished')}
                  disabled={isFinishingSprint}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isFinishingSprint ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Finish Sprint
                </button>
              )}
            </div>
          )}

          </div>{/* end scrollable area */}

          {/* ── Pinned add-note input ── */}
          <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] bg-[#0b0b0b]">
            <div className="flex items-start gap-2">
              <Textarea
                ref={noteInputRef}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(sprint) }
                  if (e.key === 'Escape') setNewNoteText('')
                }}
                placeholder="Add a note… (Enter to save)"
                rows={2}
                disabled={isAddingNote}
                className="flex-1 bg-white/[0.03] border-white/[0.06] text-white text-sm placeholder:text-gray-700 focus:border-white/[0.15] resize-none min-h-0"
              />
              {newNoteText.trim() && (
                <button type="button" onClick={() => handleAddNote(sprint)} disabled={isAddingNote}
                  className="p-1.5 rounded-lg bg-intelligence-cyan/10 text-intelligence-cyan hover:bg-intelligence-cyan/20 transition-colors disabled:opacity-40 shrink-0 mt-0.5">
                  {isAddingNote ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Unassigned session panel — shown when expanded and no sprint is selected */}
      {isExpanded && selectedSprintId === null && (
        <div className="w-80 shrink-0 border-r border-white/[0.06] flex flex-col min-h-0 overflow-hidden bg-[#0b0b0b]">
          {/* Scrollable area */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="size-1.5 rounded-full bg-gray-500 shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-500">Unassigned</span>
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">Session</h3>
              <p className="text-xs text-gray-600 mt-0.5">In-memory only · resets on refresh</p>
            </div>

            {/* Session Goal */}
            <div className="px-6 py-5 border-b border-white/[0.04]">
              <div className="flex items-start gap-3">
                <div className="w-0.5 self-stretch bg-intelligence-cyan/50 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-intelligence-cyan uppercase tracking-[0.14em] mb-2">
                    <Target className="size-2.5 inline-block mr-1 -mt-px" />
                    Session Goal
                  </p>
                  <Textarea
                    value={sessionGoal}
                    onChange={(e) => setSessionGoal(e.target.value)}
                    placeholder="What do you want to accomplish this session?"
                    rows={3}
                    className="bg-white/[0.04] border-white/[0.08] text-white text-sm font-semibold placeholder:text-gray-700 focus:border-intelligence-cyan/40 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="px-6 py-5 border-b border-white/[0.04] flex flex-col items-center gap-4">
              <SprintDonutChart total={columnTasks.length} completed={completedCount} inProg={inProg} />
              {columnTasks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {inProg > 0 && (
                    <span className="text-[10px] text-intelligence-cyan/80 bg-intelligence-cyan/[0.06] border border-intelligence-cyan/[0.12] rounded-full px-2.5 py-0.5">
                      {inProg} active
                    </span>
                  )}
                  {pendingC > 0 && (
                    <span className="text-[10px] text-gray-300 bg-white/[0.04] border border-white/[0.07] rounded-full px-2.5 py-0.5">
                      {pendingC} pending
                    </span>
                  )}
                  {completedCount > 0 && (
                    <span className="text-[10px] text-blue-400/70 bg-blue-400/[0.05] border border-blue-400/[0.12] rounded-full px-2.5 py-0.5">
                      {completedCount} done
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Session Notes list */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.14em]">Session Notes</span>
                {sessionNotes.length > 0 && (
                  <span className="text-[9px] text-gray-600 tabular-nums">{sessionNotes.length}</span>
                )}
              </div>
              {sessionNotes.length === 0 && (
                <p className="text-xs text-gray-700 py-1">No notes yet</p>
              )}
              <div className="space-y-3">
                {sessionNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 leading-relaxed break-words">{note.text}</p>
                      <p className="text-[9px] text-gray-600 mt-0.5">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(note.createdAt))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSessionNotes((prev) => prev.filter((_, idx) => idx !== i))}
                      className="shrink-0 p-0.5 rounded text-gray-700 hover:text-red-400 hover:bg-red-400/[0.08] opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete note"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pinned note input */}
          <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] bg-[#0b0b0b]">
            <div className="flex items-start gap-2">
              <Textarea
                ref={sessionNoteInputRef}
                value={newSessionNoteText}
                onChange={(e) => setNewSessionNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const text = newSessionNoteText.trim()
                    if (!text) return
                    setSessionNotes((prev) => [...prev, { text, createdAt: new Date().toISOString() }])
                    setNewSessionNoteText('')
                  }
                  if (e.key === 'Escape') setNewSessionNoteText('')
                }}
                placeholder="Add a note… (Enter to save)"
                rows={2}
                className="flex-1 bg-white/[0.03] border-white/[0.06] text-white text-sm placeholder:text-gray-700 focus:border-white/[0.15] resize-none min-h-0"
              />
              {newSessionNoteText.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    const text = newSessionNoteText.trim()
                    if (!text) return
                    setSessionNotes((prev) => [...prev, { text, createdAt: new Date().toISOString() }])
                    setNewSessionNoteText('')
                  }}
                  className="p-1.5 rounded-lg bg-intelligence-cyan/10 text-intelligence-cyan hover:bg-intelligence-cyan/20 transition-colors shrink-0 mt-0.5"
                >
                  <Check className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task list panel */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <ColumnBody
            sprint={sprint} selectedSprintId={selectedSprintId} sprintMap={sprintMap} onSelect={onSelect}
            columnTasks={columnTasks} completedCount={completedCount} progress={progress}
            activeTasks={activeTasks} statusGroups={statusGroups} projectId={projectId} label={label}
            updatingIds={updatingIds} onToggle={onToggle} activeTaskIds={activeTaskIds} onActivate={onActivate}
            editState={editState} onEditStart={onEditStart} onEditChange={onEditChange}
            onEditSave={onEditSave} onEditCancel={onEditCancel} savingId={savingId} onTaskCreated={onTaskCreated}
            onPriorityChange={onPriorityChange}
            isExpanded={isExpanded} onExpand={onExpand} onCollapse={onCollapse} hiddenDoneCount={hiddenDoneCount}
            projects={projects}
          />
        </div>
      </div>


    </div>
  )
}

// ─── mobile overview tab ──────────────────────────────────────────────────────

function MobileOverview({
  tasks, sprintMap, activeSprints, activeTaskIds,
}: {
  tasks: any[]
  sprintMap: Map<string, any>
  activeSprints: any[]
  activeTaskIds: Set<string>
}) {
  const allSprints = Array.from(sprintMap.values())
  const focusedTasks = tasks.filter((t) => activeTaskIds.has(t.id))
  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const pendingCount = tasks.filter((t) => t.status === 'pending').length

  return (
    <div className="px-4 py-4 space-y-5 pb-28">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', value: tasks.length, color: 'text-white' },
          { label: 'Done', value: completedCount, color: 'text-green-400' },
          { label: 'Pending', value: pendingCount, color: 'text-gray-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 text-center">
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Focused tasks */}
      {focusedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="size-1.5 rounded-full bg-intelligence-cyan shrink-0" style={{ boxShadow: '0 0 6px rgba(103,232,249,0.6)' }} />
            <p className="text-[10px] font-semibold text-intelligence-cyan uppercase tracking-[0.15em]">
              Active Focus · {focusedTasks.length}
            </p>
          </div>
          <div className="rounded-xl border border-intelligence-cyan/15 bg-intelligence-cyan/[0.02] divide-y divide-white/[0.04] overflow-hidden">
            {focusedTasks.map((t) => {
              const pc = PRIORITY_CFG[t.priority] ?? PRIORITY_CFG.medium
              const projName = getProjectName(t)
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`shrink-0 size-1.5 rounded-full ${STATUS_DOT[t.status] ?? 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{t.title}</p>
                    {projName && <p className="text-[10px] text-gray-600 mt-0.5 truncate">{projName}</p>}
                  </div>
                  <span className={`shrink-0 text-[9px] font-bold px-1.5 rounded border leading-4 ${pc.color} ${pc.bg}`}>{pc.short}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sprint cards */}
      {allSprints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Zap className="size-6 text-gray-700 mb-3" />
          <p className="text-sm text-gray-500">No sprints yet</p>
        </div>
      ) : (
        <div>
          <p className="text-[9px] font-bold gradient-text uppercase tracking-[0.2em] mb-3">
            All Sprints · {allSprints.length}
          </p>
          <div className="space-y-2.5">
            {allSprints.map((sprint) => {
              const sTasks = tasksForSprint(tasks, sprint.id)
              const done = sTasks.filter((t) => t.status === 'completed').length
              const pct = sTasks.length > 0 ? Math.round((done / sTasks.length) * 100) : 0
              const cfg = SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG.pending
              const projName = typeof sprint.project === 'object' ? (sprint.project?.name ?? '') : ''
              const isActive = ACTIVE_SPRINT_STATUSES.has(sprint.status)
              return (
                <div
                  key={sprint.id}
                  className={cn(
                    'rounded-xl border px-4 py-3.5 space-y-2',
                    isActive ? 'border-intelligence-cyan/15 bg-intelligence-cyan/[0.02]' : 'border-white/[0.07] bg-white/[0.02]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug truncate">{sprint.name}</p>
                      {projName && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{projName}</p>}
                    </div>
                    <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  {sTasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 tabular-nums">{done}/{sTasks.length}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── board ────────────────────────────────────────────────────────────────────

function TaskBoard({
  tasks, sprintMap, activeSprints, sorted, isPopup, onExpandToggle, projects,
}: {
  tasks: any[]
  sprintMap: Map<string, any>
  activeSprints: any[]
  sorted: any[]
  isPopup: boolean
  onExpandToggle: () => void
  projects: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [activeTaskIdsA, setActiveTaskIdsA] = useState<Set<string>>(new Set())
  const [activeTaskIdsB, setActiveTaskIdsB] = useState<Set<string>>(new Set())
  const [optimisticStatus, setOptimisticStatus] = useState<Map<string, string>>(new Map())
  const [optimisticPriority, setOptimisticPriority] = useState<Map<string, string>>(new Map())
  const [colAId, setColAId] = useState<string | null>(sorted[0]?.id ?? null)
  const [colBId, setColBId] = useState<string | null>(sorted[1]?.id ?? null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('a')
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [expandedSprintIds, setExpandedSprintIds] = useState<Set<string>>(new Set())
  const [expandedCol, setExpandedCol] = useState<'A' | 'B' | null>(null)
  const [sprintModalOpen, setSprintModalOpen] = useState(false)
  const [sprintProjectId, setSprintProjectId] = useState('')
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const completedCount = tasks.filter((t) => t.status === 'completed').length

  const sidebarExpanded = sidebarHovered || showProjectPicker

  const localTasks = tasks.map((t) => {
    const os = optimisticStatus.get(t.id)
    const op = optimisticPriority.get(t.id)
    return os || op ? { ...t, ...(os && { status: os }), ...(op && { priority: op }) } : t
  })

  // ── Priority keyboard shortcuts (L/M/H/U) ─────────────────────────────────
  // Use a ref so the single registered handler always reads the latest activeTaskIds (union of both columns)
  const activeTaskIdsARef = useRef(activeTaskIdsA)
  activeTaskIdsARef.current = activeTaskIdsA
  const activeTaskIdsBRef = useRef(activeTaskIdsB)
  activeTaskIdsBRef.current = activeTaskIdsB
  const editStateRef = useRef(editState)
  editStateRef.current = editState
  const optimisticPrioritySetRef = useRef(setOptimisticPriority)
  optimisticPrioritySetRef.current = setOptimisticPriority

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      // Block if a Radix Select popover is open (listbox visible in DOM)
      if (document.querySelector('[role="listbox"]')) return
      const allActiveIds = new Set([...activeTaskIdsARef.current, ...activeTaskIdsBRef.current])
      if (allActiveIds.size === 0) return
      if (editStateRef.current) return
      const priority =
        e.key === 'l' || e.key === 'L' ? 'low'
        : e.key === 'm' || e.key === 'M' ? 'medium'
        : e.key === 'h' || e.key === 'H' ? 'high'
        : e.key === 'u' || e.key === 'U' ? 'urgent'
        : null
      if (!priority) return
      e.preventDefault()
      const ids = Array.from(allActiveIds)
      optimisticPrioritySetRef.current((prev) => {
        const m = new Map(prev)
        for (const id of ids) m.set(id, priority)
        return m
      })
      Promise.all(ids.map((taskId) => updateTask({ taskId, data: { priority: priority as Priority } }))).then(() => {
        optimisticPrioritySetRef.current((prev) => {
          const m = new Map(prev)
          for (const id of ids) m.delete(id)
          return m
        })
        router.refresh()
      })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = (task: any) => {
    const current = optimisticStatus.get(task.id) ?? task.status
    const next: 'pending' | 'completed' =
      current === 'completed' || current === 'cancelled' ? 'pending' : 'completed'
    setOptimisticStatus((prev) => new Map(prev).set(task.id, next))
    setUpdatingIds((p) => new Set(p).add(task.id))
    // Auto-remove from active when completing
    if (next === 'completed') {
      setActiveTaskIdsA((prev) => { const s = new Set(prev); s.delete(task.id); return s })
      setActiveTaskIdsB((prev) => { const s = new Set(prev); s.delete(task.id); return s })
    }
    updateTaskStatus({ taskId: task.id, status: next }).then(() => {
      setUpdatingIds((p) => { const s = new Set(p); s.delete(task.id); return s })
      setOptimisticStatus((prev) => { const m = new Map(prev); m.delete(task.id); return m })
      router.refresh()
    })
  }

  const handleActivate = (taskId: string, col: 'a' | 'b') => {
    const setter = col === 'a' ? setActiveTaskIdsA : setActiveTaskIdsB
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const handleEditStart = (task: any) => {
    setEditState({
      taskId: task.id,
      title: task.title,
      description: extractPlainText(task.description),
      priority: (task.priority as Priority) ?? 'medium',
      dueDate: task.dueDate?.slice(0, 10) ?? '',
    })
  }

  const handleEditChange = (patch: Partial<EditState>) => {
    setEditState((prev) => prev ? { ...prev, ...patch } : prev)
  }

  const handleEditSave = async (task: any) => {
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
    router.refresh()
  }

  const handleEditCancel = () => setEditState(null)
  const handleTaskCreated = () => router.refresh()

  const handlePriorityChange = (task: any, priority: Priority) => {
    setOptimisticPriority((prev) => new Map(prev).set(task.id, priority))
    updateTask({ taskId: task.id, data: { priority } }).then(() => {
      setOptimisticPriority((prev) => { const m = new Map(prev); m.delete(task.id); return m })
      router.refresh()
    })
  }

  const columnProps = {
    sprintMap, allTasks: localTasks, updatingIds, onToggle: handleToggle,
    editState, onEditStart: handleEditStart, onEditChange: handleEditChange,
    onEditSave: handleEditSave, onEditCancel: handleEditCancel,
    savingId, onTaskCreated: handleTaskCreated, onPriorityChange: handlePriorityChange,
    projects,
  }

  // Derived data for mobile column views
  const mobileColData = (sprintId: string | null, label: string, col: 'a' | 'b') => {
    const colActiveIds = col === 'a' ? activeTaskIdsA : activeTaskIdsB
    const sprint = sprintId ? sprintMap.get(sprintId) : null
    const projectId = sprint ? getProjectId(sprint) : null
    const columnTasks = tasksForSprint(localTasks, sprintId)
    const completedC = columnTasks.filter((t) => t.status === 'completed').length
    const prog = columnTasks.length > 0 ? Math.round((completedC / columnTasks.length) * 100) : 0
    const activeTasks = columnTasks.filter((t) => colActiveIds.has(t.id))
    const nonActiveTasks = columnTasks.filter((t) => !colActiveIds.has(t.id))
    const statusGroups = COLUMN_STATUS_ORDER
      .map((st) => ({ status: st, tasks: nonActiveTasks.filter((t) => t.status === st) }))
      .filter((g) => g.tasks.length > 0)
    return { sprint, projectId, columnTasks, completedC, prog, activeTasks, statusGroups, label, colActiveIds }
  }

  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: 'overview', label: 'Sprints' },
    { id: 'a', label: 'Sprint A' },
    { id: 'b', label: 'Sprint B' },
  ]

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold gradient-text uppercase tracking-[0.14em]">Tasks</span>
          <span className="text-[10px] text-gray-300 tabular-nums">{tasks.length} · {completedCount} done</span>
          {(activeTaskIdsA.size + activeTaskIdsB.size) > 0 && (
            <span className="text-[10px] text-intelligence-cyan tabular-nums">· {activeTaskIdsA.size + activeTaskIdsB.size} active</span>
          )}
        </div>
        {/* Expand only on desktop */}
        <button
          type="button"
          onClick={onExpandToggle}
          title={isPopup ? 'Close' : 'Open in popup'}
          className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-colors text-[10px]"
        >
          {isPopup ? <><X className="size-3" /><span>Close</span></> : <><Maximize2 className="size-3" /><span>Expand</span></>}
        </button>
      </div>

      {/* ── MOBILE TAB STRIP ────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] shrink-0 bg-[#0c0c0c]">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150',
              mobileTab === tab.id
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-600 hover:text-gray-400',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MOBILE CONTENT ──────────────────────────────────────────────── */}
      <div className="lg:hidden flex-1 overflow-y-auto bg-[#0a0a0a]">
        {mobileTab === 'overview' && (
          <MobileOverview
            tasks={localTasks}
            sprintMap={sprintMap}
            activeSprints={activeSprints}
            activeTaskIds={new Set([...activeTaskIdsA, ...activeTaskIdsB])}
          />
        )}
        {(mobileTab === 'a' || mobileTab === 'b') && (() => {
          const col = mobileTab as 'a' | 'b'
          const sprintId = col === 'a' ? colAId : colBId
          const setSprintId = col === 'a' ? setColAId : setColBId
          const { sprint, projectId, columnTasks, completedC, prog, activeTasks, statusGroups, label, colActiveIds } =
            mobileColData(sprintId, col === 'a' ? 'Sprint A' : 'Sprint B', col)
          return (
            <div className="pb-28">
              <ColumnBody
                sprint={sprint} selectedSprintId={sprintId} sprintMap={sprintMap} onSelect={setSprintId}
                columnTasks={columnTasks} completedCount={completedC} progress={prog}
                activeTasks={activeTasks} statusGroups={statusGroups} projectId={projectId} label={label}
                updatingIds={updatingIds} onToggle={handleToggle} activeTaskIds={colActiveIds} onActivate={(id) => handleActivate(id, col)}
                editState={editState} onEditStart={handleEditStart} onEditChange={handleEditChange}
                onEditSave={handleEditSave} onEditCancel={handleEditCancel} savingId={savingId} onTaskCreated={handleTaskCreated}
                onPriorityChange={handlePriorityChange}
                projects={projects}
              />
            </div>
          )
        })()}
      </div>

      {/* ── DESKTOP 3-PANEL LAYOUT ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 divide-x divide-white/[0.06] min-h-0 overflow-hidden">

        {/* Sidebar — hover to expand */}
        <aside
          className={cn(
            'shrink-0 bg-[#0c0c0c] flex flex-col transition-[width] duration-200 overflow-hidden',
            sidebarExpanded ? 'w-52' : 'w-8',
          )}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          {sidebarExpanded ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] shrink-0">
                <Zap className="size-3 text-intelligence-cyan shrink-0" />
                <span className="text-[9px] font-bold gradient-text uppercase tracking-[0.12em]">Active Sprints</span>
              </div>

              {/* New Sprint — top of sidebar */}
              {projects.length > 0 && (
                <div className="shrink-0 border-b border-white/[0.06]">
                  {showProjectPicker ? (
                    <div className="p-2 space-y-1">
                      <p className="text-[9px] text-gray-600 px-1 pb-0.5 uppercase tracking-wider">Select project</p>
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setSprintProjectId(p.id); setSprintModalOpen(true); setShowProjectPicker(false) }}
                          className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors truncate"
                        >
                          {p.name}
                        </button>
                      ))}
                      <button type="button" onClick={() => setShowProjectPicker(false)} className="text-[10px] text-gray-600 hover:text-gray-400 px-2 py-1 transition-colors">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (projects.length === 1 && projects[0]) {
                          setSprintProjectId(projects[0].id)
                          setSprintModalOpen(true)
                        } else {
                          setShowProjectPicker(true)
                        }
                      }}
                      className="flex items-center gap-1.5 w-full px-3 py-2.5 text-[10px] text-white/70 hover:text-white hover:bg-white/[0.03] transition-colors"
                    >
                      <Plus className="size-3" />
                      New Sprint
                    </button>
                  )}
                </div>
              )}

              {/* Sprint list */}
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
                      const inProg = sTasks.filter((t) => t.status === 'in-progress').length
                      const pendingC = sTasks.filter((t) => t.status === 'pending').length
                      const pct = sTasks.length > 0 ? Math.round((done / sTasks.length) * 100) : 0
                      const cfg = SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG.pending
                      const projName = typeof sprint.project === 'object' ? (sprint.project?.name ?? '') : ''
                      const isExpanded = expandedSprintIds.has(sprint.id)
                      const toggleExpanded = () => setExpandedSprintIds((prev) => {
                        const next = new Set(prev)
                        if (next.has(sprint.id)) next.delete(sprint.id)
                        else next.add(sprint.id)
                        return next
                      })
                      return (
                        <div key={sprint.id} className="mb-1">
                          {/* Header row — always visible, click to expand/collapse */}
                          <button
                            type="button"
                            onClick={toggleExpanded}
                            className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/[0.03] transition-colors text-left group"
                          >
                            {isExpanded
                              ? <ChevronDown className="size-3 text-gray-600 shrink-0 group-hover:text-gray-400 transition-colors" />
                              : <ChevronRight className="size-3 text-gray-600 shrink-0 group-hover:text-gray-400 transition-colors" />
                            }
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-medium text-white truncate leading-tight">{sprint.name}</span>
                                <span className={`shrink-0 text-[9px] font-bold ${cfg.text}`}>{cfg.label}</span>
                              </div>
                              {projName && <p className="text-[9px] text-gray-400 truncate">{projName}</p>}
                            </div>
                          </button>

                          {/* Expandable body — SprintsTab card style */}
                          {isExpanded && (
                            <div className="pb-2 space-y-2">
                              {/* Goal / description */}
                              {(sprint.goalDescription || sprint.description) && (
                                <p className="text-[10px] text-gray-300 px-3 leading-relaxed line-clamp-3">
                                  {sprint.goalDescription || sprint.description}
                                </p>
                              )}

                              {/* Progress bar */}
                              {sTasks.length > 0 && (
                                <div className="flex items-center gap-1.5 px-3">
                                  <div className="flex-1 h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-[9px] text-gray-400 shrink-0 tabular-nums">{done}/{sTasks.length} · {pct}%</span>
                                </div>
                              )}

                              {/* Task status pills */}
                              {sTasks.length > 0 && (
                                <div className="flex flex-wrap gap-1 px-3">
                                  {inProg > 0 && (
                                    <span className="text-[9px] text-intelligence-cyan/80 bg-intelligence-cyan/[0.06] border border-intelligence-cyan/[0.12] rounded-full px-1.5 py-0.5">
                                      {inProg} active
                                    </span>
                                  )}
                                  {pendingC > 0 && (
                                    <span className="text-[9px] text-gray-300 bg-white/[0.04] border border-white/[0.07] rounded-full px-1.5 py-0.5">
                                      {pendingC} pending
                                    </span>
                                  )}
                                  {done > 0 && (
                                    <span className="text-[9px] text-green-400/70 bg-green-400/[0.05] border border-green-400/[0.12] rounded-full px-1.5 py-0.5">
                                      {done} done
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Date footer */}
                              {(sprint.startDate || sprint.endDate) && (
                                <div className="flex items-center gap-1 px-3 text-[9px] text-gray-500">
                                  <Calendar className="size-2.5 shrink-0" />
                                  <span>{fmtDate(sprint.startDate) ?? 'TBD'} → {fmtDate(sprint.endDate) ?? 'TBD'}</span>
                                </div>
                              )}

                              {/* Task list */}
                              {sTasks.length > 0 && (
                                <div className="px-1 pt-1 border-t border-white/[0.04]">
                                  {sTasks.slice(0, 8).map((t) => <SidebarTask key={t.id} task={t} />)}
                                  {sTasks.length > 8 && <p className="text-[10px] text-gray-400 px-2 py-1">+{sTasks.length - 8} more</p>}
                                </div>
                              )}
                              {sTasks.length === 0 && (
                                <p className="text-[10px] text-gray-600 px-3 pb-1">No tasks yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Collapsed hint */
            <div className="flex flex-col items-center pt-2.5">
              <Zap className="size-3 text-intelligence-cyan/40" />
            </div>
          )}
        </aside>

        {/* Column A */}
        {expandedCol !== 'B' && (
          <SprintColumn label="Sprint A" selectedSprintId={colAId} onSelect={setColAId} bg="bg-[#0e0e0e]" {...columnProps}
            activeTaskIds={activeTaskIdsA} onActivate={(id) => handleActivate(id, 'a')}
            isExpanded={expandedCol === 'A'} onExpand={() => setExpandedCol('A')} onCollapse={() => setExpandedCol(null)} />
        )}

        {/* Column B */}
        {expandedCol !== 'A' && (
          <SprintColumn label="Sprint B" selectedSprintId={colBId} onSelect={setColBId} bg="bg-[#0f0f0f]" {...columnProps}
            activeTaskIds={activeTaskIdsB} onActivate={(id) => handleActivate(id, 'b')}
            isExpanded={expandedCol === 'B'} onExpand={() => setExpandedCol('B')} onCollapse={() => setExpandedCol(null)} />
        )}
      </div>

      {sprintProjectId && (
        <CreateSprintModal
          projectId={sprintProjectId}
          open={sprintModalOpen}
          onOpenChange={(v) => { setSprintModalOpen(v); if (!v) setSprintProjectId('') }}
          onSuccess={() => { setSprintModalOpen(false); setSprintProjectId(''); router.refresh() }}
        />
      )}
    </div>
  )
}

// ─── main export ──────────────────────────────────────────────────────────────

interface TasksViewProps {
  tasks: any[]
  sprints?: any[]
  projects?: { id: string; name: string }[]
}

export function TasksView({ tasks, sprints = [], projects = [] }: TasksViewProps) {
  const [popup, setPopup] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!popup) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPopup(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [popup])

  const sprintMap = extractSprintMap(tasks)
  // Merge in sprints that have no tasks yet (they won't appear in extractSprintMap)
  for (const s of sprints) {
    if (!sprintMap.has(s.id)) sprintMap.set(s.id, s)
  }
  const sorted = sortedByUpdated(Array.from(sprintMap.values()))
  const activeSprints = sorted.filter((s) => ACTIVE_SPRINT_STATUSES.has(s.status ?? ''))
  const boardProps = { tasks, sprintMap, activeSprints, sorted, projects }

  return (
    <>
      {/* main has zoom:1.3 — divide by zoom factor so visual height = viewport minus header */}
      <div
        className="rounded-xl border border-white/[0.06] overflow-hidden"
        style={{ height: 'calc(100svh / 1.3 - 49px)' }}
      >
        <TaskBoard {...boardProps} isPopup={false} onExpandToggle={() => setPopup(true)} />
      </div>

      {mounted && popup &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setPopup(false) }}
          >
            <div
              className="w-full h-full rounded-xl border border-white/[0.08] overflow-hidden shadow-2xl"
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
