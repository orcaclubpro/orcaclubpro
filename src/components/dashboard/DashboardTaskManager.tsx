'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Plus,
  ListTodo,
  X,
  ChevronRight,
  Loader2,
  Calendar,
  Flag,
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
import type { Task, Sprint } from '@/types/payload-types'

interface DashboardTaskManagerProps {
  username: string
}

export function DashboardTaskManager({ username }: DashboardTaskManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
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

  // Check if we're on a project page - context-aware
  const projectPageMatch = pathname?.match(/\/u\/[^/]+\/projects\/([^/]+)/)
  const currentProjectId = projectPageMatch?.[1]

  // Fetch tasks and sprints when on a project page
  useEffect(() => {
    if (!currentProjectId) {
      setTasks([])
      setSprints([])
      return
    }

    async function fetchData() {
      try {
        const [tasksRes, sprintsRes] = await Promise.all([
          fetch(`/api/projects/${currentProjectId}/tasks`),
          fetch(`/api/projects/${currentProjectId}/sprints`),
        ])

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks(tasksData.tasks || [])
        }
        if (sprintsRes.ok) {
          const sprintsData = await sprintsRes.json()
          setSprints(sprintsData.sprints || [])
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }
    fetchData()
  }, [currentProjectId])

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

    if (!currentProjectId) {
      setError('No project selected')
      return
    }

    setIsLoading(true)

    const result = await createTask({
      projectId: currentProjectId,
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

    if (!currentProjectId) {
      setSprintError('No project selected')
      return
    }

    setIsCreatingSprint(true)

    const result = await createSprint({
      projectId: currentProjectId,
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

  // Only show on project pages
  if (!currentProjectId) return null

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-[100] size-16 rounded-full bg-intelligence-cyan text-black shadow-2xl shadow-intelligence-cyan/30 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        {isOpen ? (
          <X className="size-7" />
        ) : (
          <ListTodo className="size-7 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Task Manager Slide Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-black/98 border-l border-white/[0.08] backdrop-blur-xl z-[90] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/[0.08] p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-intelligence-cyan/[0.05] rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-intelligence-cyan/10 border border-intelligence-cyan/20">
                  <ListTodo className="size-5 text-intelligence-cyan" />
                </div>
                <h2 className="text-xl font-bold text-white">Task Manager</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X className="size-5 text-gray-400" />
              </button>
            </div>

            {/* Sprint Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500 uppercase tracking-wider">
                  Filter by Sprint
                </Label>
                <Dialog open={showSprintModal} onOpenChange={setShowSprintModal}>
                  <DialogTrigger asChild>
                    <button className="text-xs text-intelligence-cyan hover:text-intelligence-cyan/80 transition-colors flex items-center gap-1">
                      <Plus className="size-3" />
                      New Sprint
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/95 border-white/[0.08] backdrop-blur-xl max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <Layers className="size-5 text-intelligence-cyan" />
                        Create Sprint
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Create a new sprint to organize tasks
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSprint} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="sprintName" className="text-sm text-gray-300">
                          Sprint Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="sprintName"
                          value={sprintName}
                          onChange={(e) => setSprintName(e.target.value)}
                          placeholder="e.g., Sprint 1, Q1 2026"
                          className="bg-white/[0.03] border-white/[0.08] text-white"
                          disabled={isCreatingSprint}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sprintDescription" className="text-sm text-gray-300">
                          Description
                        </Label>
                        <Textarea
                          id="sprintDescription"
                          value={sprintDescription}
                          onChange={(e) => setSprintDescription(e.target.value)}
                          placeholder="Sprint objectives..."
                          rows={2}
                          className="bg-white/[0.03] border-white/[0.08] text-white resize-none"
                          disabled={isCreatingSprint}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="sprintStartDate" className="text-sm text-gray-300">
                            Start Date <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="sprintStartDate"
                            type="date"
                            value={sprintStartDate}
                            onChange={(e) => setSprintStartDate(e.target.value)}
                            className="bg-white/[0.03] border-white/[0.08] text-white"
                            disabled={isCreatingSprint}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sprintEndDate" className="text-sm text-gray-300">
                            End Date <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="sprintEndDate"
                            type="date"
                            value={sprintEndDate}
                            onChange={(e) => setSprintEndDate(e.target.value)}
                            className="bg-white/[0.03] border-white/[0.08] text-white"
                            disabled={isCreatingSprint}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sprintGoal" className="text-sm text-gray-300">
                          Sprint Goal
                        </Label>
                        <Textarea
                          id="sprintGoal"
                          value={sprintGoal}
                          onChange={(e) => setSprintGoal(e.target.value)}
                          placeholder="What should be accomplished..."
                          rows={2}
                          className="bg-white/[0.03] border-white/[0.08] text-white resize-none"
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
                          className="flex-1 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreatingSprint}
                          className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90"
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
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/[0.08] backdrop-blur-xl z-[150]">
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
                className="w-full mt-4 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90"
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
              className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Create New Task</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setError(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs text-gray-400">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  className="bg-white/[0.03] border-white/[0.08] text-white text-sm"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs text-gray-400">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task details..."
                  rows={3}
                  className="bg-white/[0.03] border-white/[0.08] text-white text-sm resize-none"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="priority" className="text-xs text-gray-400">
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as 'low' | 'medium' | 'high' | 'urgent')
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-white/[0.08] z-[150]">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dueDate" className="text-xs text-gray-400">
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-white/[0.03] border-white/[0.08] text-white text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {!selectedSprint && (
                <div className="space-y-1">
                  <Label htmlFor="taskSprint" className="text-xs text-gray-400">
                    Assign to Sprint (Optional)
                  </Label>
                  <Select
                    value={taskSprint || 'none'}
                    onValueChange={(value) => setTaskSprint(value === 'none' ? null : value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-white/[0.08] z-[150]">
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
                className="w-full bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 text-sm"
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
            <div className="text-center py-12 text-gray-500">
              <ListTodo className="size-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {selectedSprint ? 'No tasks in this sprint' : 'No tasks yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedTasks.urgent.length > 0 && (
                <TaskGroup
                  title="Urgent"
                  tasks={groupedTasks.urgent}
                  onToggleComplete={handleToggleComplete}
                />
              )}

              {groupedTasks.high.length > 0 && (
                <TaskGroup
                  title="High Priority"
                  tasks={groupedTasks.high}
                  onToggleComplete={handleToggleComplete}
                />
              )}

              {groupedTasks.medium.length > 0 && (
                <TaskGroup
                  title="Medium Priority"
                  tasks={groupedTasks.medium}
                  onToggleComplete={handleToggleComplete}
                />
              )}

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

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] animate-in fade-in duration-200"
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
            className={`size-4 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <Badge
            variant="outline"
            className="bg-white/[0.03] border-white/[0.08] text-gray-400 text-xs"
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
      className={`relative overflow-hidden rounded-lg border ${priorityConfig.border} ${priorityConfig.bg} p-3 hover:border-white/[0.12] transition-all duration-200 group`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(task.id, task.status)}
          className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
        >
          {isCompleted ? (
            <CheckCircle className="size-5 text-green-400" />
          ) : (
            <Circle className="size-5 text-gray-500 hover:text-intelligence-cyan" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <h4
            className={`text-sm font-medium ${
              isCompleted ? 'text-gray-500 line-through' : 'text-white'
            }`}
          >
            {task.title}
          </h4>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Flag className={`size-3 ${priorityConfig.color}`} />
              <span className={priorityConfig.color}>{priorityConfig.label}</span>
            </div>

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
