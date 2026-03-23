'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  ListTodo,
  X,
  ChevronRight,
  Loader2,
  Calendar,
  Flag,
  Zap,
  CheckCircle,
  Circle,
  Layers,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createTask, updateTaskStatus } from '@/actions/tasks'
import { createSprint } from '@/actions/sprints'
import { getPriorityConfig, groupTasksByPriority } from '@/lib/utils/taskUtils'
import { formatDate, isOverdue } from '@/lib/utils/dateUtils'
import type { Project, Task, Sprint } from '@/types/payload-types'

interface FloatingTaskManagerProps {
  project: Project
  tasks: Task[]
  sprints: Sprint[]
}

export function FloatingTaskManager({ project, tasks, sprints }: FloatingTaskManagerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showSprintModal, setShowSprintModal] = useState(false)

  // Task form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [taskSprint, setTaskSprint] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sprint form state
  const [sprintName, setSprintName] = useState('')
  const [sprintDescription, setSprintDescription] = useState('')
  const [sprintStartDate, setSprintStartDate] = useState('')
  const [sprintEndDate, setSprintEndDate] = useState('')
  const [sprintGoal, setSprintGoal] = useState('')
  const [isCreatingSprint, setIsCreatingSprint] = useState(false)
  const [sprintError, setSprintError] = useState<string | null>(null)

  // Filter tasks based on selected sprint
  const filteredTasks = selectedSprint
    ? tasks.filter((task) => {
        const sprintId = typeof task.sprint === 'object' ? task.sprint?.id : task.sprint
        return sprintId === selectedSprint
      })
    : tasks

  const groupedTasks = groupTasksByPriority(filteredTasks)

  // When sprint is selected, default new tasks to that sprint
  useEffect(() => {
    if (selectedSprint) {
      setTaskSprint(selectedSprint)
    } else {
      setTaskSprint(null)
    }
  }, [selectedSprint])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Task title is required')
      return
    }

    setIsLoading(true)

    const result = await createTask({
      projectId: project.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      sprintId: taskSprint || undefined,
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to create task')
      return
    }

    // Reset form
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    if (!selectedSprint) {
      setTaskSprint(null)
    }
    setError(null)
    setShowCreateForm(false)

    router.refresh()
  }

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    setSprintError(null)

    if (!sprintName.trim()) {
      setSprintError('Sprint name is required')
      return
    }

    if (!sprintStartDate || !sprintEndDate) {
      setSprintError('Start and end dates are required')
      return
    }

    if (new Date(sprintEndDate) <= new Date(sprintStartDate)) {
      setSprintError('End date must be after start date')
      return
    }

    setIsCreatingSprint(true)

    const result = await createSprint({
      projectId: project.id,
      name: sprintName.trim(),
      description: sprintDescription.trim() || undefined,
      startDate: sprintStartDate,
      endDate: sprintEndDate,
      goalDescription: sprintGoal.trim() || undefined,
    })

    setIsCreatingSprint(false)

    if (!result.success) {
      setSprintError(result.error || 'Failed to create sprint')
      return
    }

    // Reset form
    setSprintName('')
    setSprintDescription('')
    setSprintStartDate('')
    setSprintEndDate('')
    setSprintGoal('')
    setSprintError(null)
    setShowSprintModal(false)

    router.refresh()
  }

  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await updateTaskStatus({ taskId, status: newStatus })
    router.refresh()
  }

  return (
    <>
      {/* Floating Action Button - Higher z-index */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-28 right-4 md:bottom-8 md:right-8 z-[100] size-16 rounded-full bg-[var(--space-accent)] text-black shadow-2xl shadow-[rgba(139,156,182,0.20)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        {isOpen ? (
          <X className="size-7" />
        ) : (
          <ListTodo className="size-7 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Task Manager Slide Panel - Higher z-index */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-[var(--space-bg-base)] border-l border-[var(--space-border-hard)] z-[90] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-[var(--space-border-hard)] p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[rgba(255,255,255,0.02)] rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)]">
                  <ListTodo className="size-5" style={{ color: 'var(--space-accent)' }} />
                </div>
                <h2 className="text-xl font-bold text-[var(--space-text-primary)]">Task Manager</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--space-bg-card-hover)] transition-colors"
              >
                <X className="size-5 text-[var(--space-text-secondary)]" />
              </button>
            </div>

            {/* Sprint Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[var(--space-text-secondary)] uppercase tracking-wider">
                  Filter by Sprint
                </Label>
                <Dialog open={showSprintModal} onOpenChange={setShowSprintModal}>
                  <DialogTrigger asChild>
                    <button className="text-xs hover:opacity-80 transition-colors flex items-center gap-1" style={{ color: 'var(--space-accent)' }}>
                      <Plus className="size-3" />
                      New Sprint
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-[var(--space-text-primary)] flex items-center gap-2">
                        <Layers className="size-5" style={{ color: 'var(--space-accent)' }} />
                        Create Sprint
                      </DialogTitle>
                      <DialogDescription className="text-[var(--space-text-secondary)]">
                        Create a new sprint to organize tasks
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSprint} className="space-y-4 pt-4">
                      {/* Sprint Name */}
                      <div className="space-y-2">
                        <Label htmlFor="sprintName" className="text-sm text-[var(--space-text-tertiary)]">
                          Sprint Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="sprintName"
                          value={sprintName}
                          onChange={(e) => setSprintName(e.target.value)}
                          placeholder="e.g., Sprint 1, Q1 2026"
                          className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)]"
                          disabled={isCreatingSprint}
                          required
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="sprintDescription" className="text-sm text-[var(--space-text-tertiary)]">
                          Description
                        </Label>
                        <Textarea
                          id="sprintDescription"
                          value={sprintDescription}
                          onChange={(e) => setSprintDescription(e.target.value)}
                          placeholder="Sprint objectives..."
                          rows={2}
                          className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] resize-none"
                          disabled={isCreatingSprint}
                        />
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="sprintStartDate" className="text-sm text-[var(--space-text-tertiary)]">
                            Start Date <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="sprintStartDate"
                            type="date"
                            value={sprintStartDate}
                            onChange={(e) => setSprintStartDate(e.target.value)}
                            className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)]"
                            disabled={isCreatingSprint}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sprintEndDate" className="text-sm text-[var(--space-text-tertiary)]">
                            End Date <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="sprintEndDate"
                            type="date"
                            value={sprintEndDate}
                            onChange={(e) => setSprintEndDate(e.target.value)}
                            className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)]"
                            disabled={isCreatingSprint}
                            required
                          />
                        </div>
                      </div>

                      {/* Goal */}
                      <div className="space-y-2">
                        <Label htmlFor="sprintGoal" className="text-sm text-[var(--space-text-tertiary)]">
                          Sprint Goal
                        </Label>
                        <Textarea
                          id="sprintGoal"
                          value={sprintGoal}
                          onChange={(e) => setSprintGoal(e.target.value)}
                          placeholder="What should be accomplished..."
                          rows={2}
                          className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] resize-none"
                          disabled={isCreatingSprint}
                        />
                      </div>

                      {sprintError && (
                        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3">
                          {sprintError}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowSprintModal(false)}
                          disabled={isCreatingSprint}
                          className="flex-1 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)] text-[var(--space-text-tertiary)]"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreatingSprint}
                          className="flex-1 bg-[var(--space-accent)] text-white hover:bg-[var(--space-accent)]/90"
                        >
                          {isCreatingSprint ? (
                            <>
                              <Loader2 className="size-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="size-4 mr-2" />
                              Create Sprint
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Select
                value={selectedSprint || 'all'}
                onValueChange={(value) => setSelectedSprint(value === 'all' ? null : value)}
              >
                <SelectTrigger className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)]">
                  <SelectItem value="all">All Tasks</SelectItem>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name} ({sprint.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Create Task Button */}
            {!showCreateForm && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full mt-4 bg-[var(--space-accent)] text-white hover:bg-[var(--space-accent)]/90"
              >
                <Plus className="size-4 mr-2" />
                New Task
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreateTask}
              className="relative overflow-hidden rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] p-4 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[var(--space-text-primary)]">Create New Task</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setError(null)
                  }}
                  className="text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)]"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs text-[var(--space-text-secondary)]">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] text-sm placeholder:text-[var(--space-text-muted)]"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs text-[var(--space-text-secondary)]">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task details..."
                  rows={3}
                  className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] text-sm resize-none placeholder:text-[var(--space-text-muted)]"
                  disabled={isLoading}
                />
              </div>

              {/* Priority & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="priority" className="text-xs text-[var(--space-text-secondary)]">
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as 'low' | 'medium' | 'high' | 'urgent')
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)]">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dueDate" className="text-xs text-[var(--space-text-secondary)]">
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Sprint Assignment */}
              {!selectedSprint && (
                <div className="space-y-1">
                  <Label htmlFor="taskSprint" className="text-xs text-[var(--space-text-secondary)]">
                    Assign to Sprint (Optional)
                  </Label>
                  <Select
                    value={taskSprint || 'none'}
                    onValueChange={(value) => setTaskSprint(value === 'none' ? null : value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)]">
                      <SelectItem value="none">No Sprint</SelectItem>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {error && (
                <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded p-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--space-accent)] text-white hover:bg-[var(--space-accent)]/90 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-[var(--space-text-muted)]">
              <ListTodo className="size-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {selectedSprint ? 'No tasks in this sprint' : 'No tasks yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Urgent Tasks */}
              {groupedTasks.urgent.length > 0 && (
                <TaskGroup
                  title="Urgent"
                  tasks={groupedTasks.urgent}
                  onToggleComplete={handleToggleComplete}
                />
              )}

              {/* High Priority */}
              {groupedTasks.high.length > 0 && (
                <TaskGroup
                  title="High Priority"
                  tasks={groupedTasks.high}
                  onToggleComplete={handleToggleComplete}
                />
              )}

              {/* Medium Priority */}
              {groupedTasks.medium.length > 0 && (
                <TaskGroup
                  title="Medium Priority"
                  tasks={groupedTasks.medium}
                  onToggleComplete={handleToggleComplete}
                />
              )}

              {/* Low Priority */}
              {groupedTasks.low.length > 0 && (
                <TaskGroup
                  title="Low Priority"
                  tasks={groupedTasks.low}
                  onToggleComplete={handleToggleComplete}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop - Below panel but above content */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-[var(--space-divider)]/20 z-[80] animate-in fade-in duration-200"
        />
      )}
    </>
  )
}

function TaskGroup({
  title,
  tasks,
  onToggleComplete,
}: {
  title: string
  tasks: Task[]
  onToggleComplete: (taskId: string, currentStatus: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`size-4 text-[var(--space-text-secondary)] transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <h3 className="text-sm font-semibold text-[var(--space-text-primary)]">{title}</h3>
          <Badge
            variant="outline"
            className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-secondary)] text-xs"
          >
            {tasks.length}
          </Badge>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-2 ml-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggleComplete={onToggleComplete} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskCard({
  task,
  onToggleComplete,
}: {
  task: Task
  onToggleComplete: (taskId: string, currentStatus: string) => void
}) {
  const priorityConfig = getPriorityConfig(task.priority)
  const isTaskOverdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed'
  const isCompleted = task.status === 'completed'

  return (
    <div
      className={`relative overflow-hidden rounded-lg border ${priorityConfig.border} ${priorityConfig.bg} p-3 hover:border-[var(--space-border-hard)] transition-all duration-200 group`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(task.id, task.status)}
          className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
        >
          {isCompleted ? (
            <CheckCircle className="size-5 text-green-400" />
          ) : (
            <Circle className="size-5 text-[var(--space-text-muted)] hover:text-[var(--space-accent)]" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4
            className={`text-sm font-medium ${
              isCompleted ? 'text-[var(--space-text-muted)] line-through' : 'text-[var(--space-text-primary)]'
            }`}
          >
            {task.title}
          </h4>

          <div className="flex items-center gap-3 text-xs text-[var(--space-text-secondary)]">
            {/* Priority */}
            <div className="flex items-center gap-1">
              <Flag className={`size-3 ${priorityConfig.color}`} />
              <span className={priorityConfig.color}>{priorityConfig.label}</span>
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${isTaskOverdue ? 'text-red-400' : ''}`}>
                <Calendar className="size-3" />
                {formatDate(task.dueDate)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
