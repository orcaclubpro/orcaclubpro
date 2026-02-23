'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Check, Zap, Maximize2, X, Pencil, Plus, Loader2 } from 'lucide-react'
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
import { cn } from '@/lib/utils'

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
}) {
  const pc = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.medium
  const over = isOverdue(task.dueDate) && task.status !== 'completed'
  const done = task.status === 'completed' || task.status === 'cancelled'
  const projectName = getProjectName(task)
  const isEditing = editState?.taskId === task.id
  const titleRef = useRef<HTMLInputElement>(null)

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
      onClick={onActivate}
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
          return desc ? <p className="text-xs text-gray-600 mt-0.5 truncate leading-snug">{desc}</p> : null
        })()}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {projectName && <span className="text-[10px] text-gray-600">{projectName}</span>}
          <span className={`text-[10px] font-semibold px-1.5 rounded border leading-4 ${pc.color} ${pc.bg}`}>
            {pc.short}
          </span>
          {task.dueDate && (
            <span className={`text-[10px] ${over ? 'text-red-400' : 'text-gray-600'}`}>
              {fmtDate(task.dueDate)}{over ? ' · overdue' : ''}
            </span>
          )}
        </div>
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
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      await createTask({ projectId, title: title.trim(), priority: 'medium', sprintId })
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
      className="flex items-center gap-1.5 px-3 py-2 shrink-0 bg-white/[0.01]"
      onKeyDown={(e) => { if (e.key === 'Escape') { setIsOpen(false); setTitle('') } }}
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        disabled={isPending}
        className="flex-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus:border-intelligence-cyan/40 h-7 text-xs"
      />
      <button type="submit" disabled={isPending || !title.trim()} className="p-1.5 rounded-lg bg-intelligence-cyan/10 text-intelligence-cyan hover:bg-intelligence-cyan/20 transition-colors disabled:opacity-40 shrink-0">
        {isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
      </button>
      <button type="button" onClick={() => { setIsOpen(false); setTitle('') }} className="p-1.5 rounded-lg text-gray-700 hover:text-gray-400 transition-colors shrink-0">
        <X className="size-3" />
      </button>
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
}

function ColumnBody({
  sprint, selectedSprintId, sprintMap, onSelect,
  columnTasks, completedCount, progress,
  activeTasks, statusGroups, projectId, label,
  updatingIds, onToggle, activeTaskIds, onActivate,
  editState, onEditStart, onEditChange, onEditSave, onEditCancel,
  savingId, onTaskCreated,
}: ColumnBodyProps) {
  const sCfg = sprint ? (SPRINT_STATUS_CFG[sprint.status] ?? SPRINT_STATUS_CFG.pending) : null
  const allSprints = Array.from(sprintMap.values())

  return (
    <>
      {/* Sprint selector header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[9px] font-bold gradient-text uppercase tracking-[0.15em]">{label}</span>
          {sCfg && <span className={`text-[10px] font-medium ${sCfg.text}`}>{sCfg.label}</span>}
        </div>
        <Select value={selectedSprintId ?? UNASSIGNED} onValueChange={(v) => onSelect(v === UNASSIGNED ? null : v)}>
          <SelectTrigger className="h-8 bg-white/[0.04] border-white/[0.08] text-white text-sm focus:border-intelligence-cyan/40">
            <SelectValue placeholder="Select sprint" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
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

      {/* Task list */}
      <div className="py-2 space-y-1 px-1">
        {selectedSprintId === null && columnTasks.length === 0 ? (
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
                  />
                ))
              )}
              {/* Add task — right under Active */}
              {selectedSprintId && projectId && (
                <InlineAdd projectId={projectId} sprintId={selectedSprintId} onCreated={onTaskCreated} />
              )}
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
                  />
                ))}
              </div>
            ))}

            {columnTasks.length === 0 && selectedSprintId && (
              <p className="text-xs text-gray-400 text-center py-8 px-4">
                {sprint ? `No tasks in ${sprint.name}` : 'No tasks'}
              </p>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── sprint column (desktop panel) ───────────────────────────────────────────

function SprintColumn({
  label, sprintMap, allTasks, selectedSprintId, onSelect,
  updatingIds, onToggle, bg = 'bg-[#0f0f0f]',
  activeTaskIds, onActivate,
  editState, onEditStart, onEditChange, onEditSave, onEditCancel,
  savingId, onTaskCreated,
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
}) {
  const sprint = selectedSprintId ? sprintMap.get(selectedSprintId) : null
  const projectId = sprint ? getProjectId(sprint) : null
  const columnTasks = tasksForSprint(allTasks, selectedSprintId)
  const completedCount = columnTasks.filter((t) => t.status === 'completed').length
  const progress = columnTasks.length > 0 ? Math.round((completedCount / columnTasks.length) * 100) : 0
  const activeTasks = columnTasks.filter((t) => activeTaskIds.has(t.id))
  const nonActiveTasks = columnTasks.filter((t) => !activeTaskIds.has(t.id))
  const statusGroups = COLUMN_STATUS_ORDER
    .map((st) => ({ status: st, tasks: nonActiveTasks.filter((t) => t.status === st) }))
    .filter((g) => g.tasks.length > 0)

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${bg}`}>
      <div className="flex-1 overflow-y-auto">
        <ColumnBody
          sprint={sprint} selectedSprintId={selectedSprintId} sprintMap={sprintMap} onSelect={onSelect}
          columnTasks={columnTasks} completedCount={completedCount} progress={progress}
          activeTasks={activeTasks} statusGroups={statusGroups} projectId={projectId} label={label}
          updatingIds={updatingIds} onToggle={onToggle} activeTaskIds={activeTaskIds} onActivate={onActivate}
          editState={editState} onEditStart={onEditStart} onEditChange={onEditChange}
          onEditSave={onEditSave} onEditCancel={onEditCancel} savingId={savingId} onTaskCreated={onTaskCreated}
        />
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
  tasks, sprintMap, activeSprints, sorted, isPopup, onExpandToggle,
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
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [activeTaskIds, setActiveTaskIds] = useState<Set<string>>(new Set())
  const [optimisticStatus, setOptimisticStatus] = useState<Map<string, string>>(new Map())
  const [colAId, setColAId] = useState<string | null>(sorted[0]?.id ?? null)
  const [colBId, setColBId] = useState<string | null>(sorted[1]?.id ?? null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('a')
  const completedCount = tasks.filter((t) => t.status === 'completed').length

  const localTasks = tasks.map((t) => {
    const os = optimisticStatus.get(t.id)
    return os ? { ...t, status: os } : t
  })

  const handleToggle = (task: any) => {
    const current = optimisticStatus.get(task.id) ?? task.status
    const next: 'pending' | 'completed' =
      current === 'completed' || current === 'cancelled' ? 'pending' : 'completed'
    setOptimisticStatus((prev) => new Map(prev).set(task.id, next))
    setUpdatingIds((p) => new Set(p).add(task.id))
    // Auto-remove from active when completing
    if (next === 'completed') {
      setActiveTaskIds((prev) => { const s = new Set(prev); s.delete(task.id); return s })
    }
    updateTaskStatus({ taskId: task.id, status: next }).then(() => {
      setUpdatingIds((p) => { const s = new Set(p); s.delete(task.id); return s })
      setOptimisticStatus((prev) => { const m = new Map(prev); m.delete(task.id); return m })
      router.refresh()
    })
  }

  const handleActivate = (taskId: string) => {
    setActiveTaskIds((prev) => {
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

  const columnProps = {
    sprintMap, allTasks: localTasks, updatingIds, onToggle: handleToggle,
    activeTaskIds, onActivate: handleActivate,
    editState, onEditStart: handleEditStart, onEditChange: handleEditChange,
    onEditSave: handleEditSave, onEditCancel: handleEditCancel,
    savingId, onTaskCreated: handleTaskCreated,
  }

  // Derived data for mobile column views
  const mobileColData = (sprintId: string | null, label: string) => {
    const sprint = sprintId ? sprintMap.get(sprintId) : null
    const projectId = sprint ? getProjectId(sprint) : null
    const columnTasks = tasksForSprint(localTasks, sprintId)
    const completedC = columnTasks.filter((t) => t.status === 'completed').length
    const prog = columnTasks.length > 0 ? Math.round((completedC / columnTasks.length) * 100) : 0
    const activeTasks = columnTasks.filter((t) => activeTaskIds.has(t.id))
    const nonActiveTasks = columnTasks.filter((t) => !activeTaskIds.has(t.id))
    const statusGroups = COLUMN_STATUS_ORDER
      .map((st) => ({ status: st, tasks: nonActiveTasks.filter((t) => t.status === st) }))
      .filter((g) => g.tasks.length > 0)
    return { sprint, projectId, columnTasks, completedC, prog, activeTasks, statusGroups, label }
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
          {activeTaskIds.size > 0 && (
            <span className="text-[10px] text-intelligence-cyan tabular-nums">· {activeTaskIds.size} active</span>
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
            activeTaskIds={activeTaskIds}
          />
        )}
        {(mobileTab === 'a' || mobileTab === 'b') && (() => {
          const sprintId = mobileTab === 'a' ? colAId : colBId
          const setSprintId = mobileTab === 'a' ? setColAId : setColBId
          const { sprint, projectId, columnTasks, completedC, prog, activeTasks, statusGroups, label } =
            mobileColData(sprintId, mobileTab === 'a' ? 'Sprint A' : 'Sprint B')
          return (
            <div className="pb-28">
              <ColumnBody
                sprint={sprint} selectedSprintId={sprintId} sprintMap={sprintMap} onSelect={setSprintId}
                columnTasks={columnTasks} completedCount={completedC} progress={prog}
                activeTasks={activeTasks} statusGroups={statusGroups} projectId={projectId} label={label}
                updatingIds={updatingIds} onToggle={handleToggle} activeTaskIds={activeTaskIds} onActivate={handleActivate}
                editState={editState} onEditStart={handleEditStart} onEditChange={handleEditChange}
                onEditSave={handleEditSave} onEditCancel={handleEditCancel} savingId={savingId} onTaskCreated={handleTaskCreated}
              />
            </div>
          )
        })()}
      </div>

      {/* ── DESKTOP 3-PANEL LAYOUT ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 divide-x divide-white/[0.06] min-h-0 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-[#0c0c0c] flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] shrink-0">
            <Zap className="size-3 text-intelligence-cyan shrink-0" />
            <span className="text-[9px] font-bold gradient-text uppercase tracking-[0.12em]">Active Sprints</span>
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
                  const projName = typeof sprint.project === 'object' ? (sprint.project?.name ?? '') : ''
                  return (
                    <div key={sprint.id} className="mb-4">
                      <div className="px-3 py-1.5">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-medium text-white truncate leading-tight">{sprint.name}</span>
                          <span className={`shrink-0 text-[9px] font-bold ${cfg.text}`}>{cfg.label}</span>
                        </div>
                        {projName && <p className="text-[9px] text-gray-400 truncate mb-1.5">{projName}</p>}
                        {sTasks.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="flex-1 h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[9px] text-gray-400 shrink-0 tabular-nums">{pct}%</span>
                          </div>
                        )}
                      </div>
                      <div className="px-1">
                        {sTasks.length === 0 ? (
                          <p className="text-[10px] text-gray-400 px-2 py-1">No tasks</p>
                        ) : (
                          <>
                            {sTasks.slice(0, 8).map((t) => <SidebarTask key={t.id} task={t} />)}
                            {sTasks.length > 8 && <p className="text-[10px] text-gray-400 px-2 py-1">+{sTasks.length - 8} more</p>}
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
        <SprintColumn label="Sprint A" selectedSprintId={colAId} onSelect={setColAId} bg="bg-[#0e0e0e]" {...columnProps} />

        {/* Column B */}
        <SprintColumn label="Sprint B" selectedSprintId={colBId} onSelect={setColBId} bg="bg-[#0f0f0f]" {...columnProps} />
      </div>
    </div>
  )
}

// ─── main export ──────────────────────────────────────────────────────────────

interface TasksViewProps {
  tasks: any[]
}

export function TasksView({ tasks }: TasksViewProps) {
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
  const sorted = sortedByUpdated(Array.from(sprintMap.values()))
  const activeSprints = sorted.filter((s) => ACTIVE_SPRINT_STATUSES.has(s.status ?? ''))
  const boardProps = { tasks, sprintMap, activeSprints, sorted }

  return (
    <>
      <div
        className="rounded-xl border border-white/[0.06] overflow-hidden"
        style={{ height: 'calc(100svh - 64px)' }}
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
