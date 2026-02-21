'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronDown, ChevronRight, Loader2, Zap } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createSprint } from '@/actions/sprints'
import type { Sprint, Task } from '@/types/payload-types'

interface SprintsTabProps {
  sprints: Sprint[]
  tasks: Task[]
  projectId: string
}

const sprintStatusConfig = {
  pending: { dot: 'bg-gray-500', label: 'Pending', color: 'text-gray-400' },
  'in-progress': { dot: 'bg-intelligence-cyan', label: 'In Progress', color: 'text-intelligence-cyan' },
  delayed: { dot: 'bg-yellow-400', label: 'Delayed', color: 'text-yellow-400' },
  finished: { dot: 'bg-green-400', label: 'Finished', color: 'text-green-400' },
} as const

const taskStatusDot = {
  pending: 'bg-gray-500',
  'in-progress': 'bg-blue-400',
  completed: 'bg-green-400',
  cancelled: 'bg-red-400',
} as const

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d))

function getSprintTasks(sprint: Sprint, tasks: Task[]): Task[] {
  return tasks.filter((task) => {
    if (!task.sprint) return false
    if (typeof task.sprint === 'string') return task.sprint === sprint.id
    return task.sprint.id === sprint.id
  })
}

export function SprintsTab({ sprints, tasks, projectId }: SprintsTabProps) {
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set())

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length

  const toggleExpand = (sprintId: string) => {
    setExpandedSprints((prev) => {
      const next = new Set(prev)
      if (next.has(sprintId)) {
        next.delete(sprintId)
      } else {
        next.add(sprintId)
      }
      return next
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Sprints</h2>
          {totalTasks > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setIsSheetOpen(true)}
          className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium"
        >
          <Plus className="size-3.5 mr-1.5" />
          New Sprint
        </Button>
      </div>

      {/* Sprint List */}
      {sprints.length > 0 ? (
        <div className="space-y-3">
          {sprints.map((sprint) => {
            const sprintTasks = getSprintTasks(sprint, tasks)
            const completedCount = sprintTasks.filter((t) => t.status === 'completed').length
            const totalCount = sprintTasks.length
            const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
            const statusCfg = sprintStatusConfig[sprint.status] ?? sprintStatusConfig.pending
            const isExpanded = expandedSprints.has(sprint.id)

            return (
              <div
                key={sprint.id}
                className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden"
              >
                {/* Sprint header row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(sprint.id)}
                  className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/[0.04] transition-colors"
                >
                  {/* Expand icon */}
                  <span className="mt-0.5 shrink-0 text-gray-600">
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Top row: name + status + dates */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-white text-sm leading-tight">
                        {sprint.name}
                      </span>

                      {/* Status */}
                      <span className={`flex items-center gap-1.5 text-xs ${statusCfg.color}`}>
                        <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>

                      {/* Date range */}
                      <span className="text-xs text-gray-500">
                        {fmtDate(sprint.startDate)} &rarr; {fmtDate(sprint.endDate)}
                      </span>
                    </div>

                    {/* Task progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {completedCount}/{totalCount} tasks
                        </span>
                        {totalCount > 0 && (
                          <span className="text-xs text-gray-600">
                            {Math.round(progressPct)}%
                          </span>
                        )}
                      </div>
                      <div className="h-1 w-full rounded-full bg-white/[0.08]">
                        <div
                          className="h-full rounded-full bg-intelligence-cyan transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Goal description */}
                    {sprint.goalDescription && (
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {sprint.goalDescription}
                      </p>
                    )}
                  </div>
                </button>

                {/* Expanded task list */}
                {isExpanded && (
                  <div className="border-t border-white/[0.08]">
                    {sprintTasks.length > 0 ? (
                      <ul className="divide-y divide-white/[0.06]">
                        {sprintTasks.map((task) => {
                          const dotClass =
                            taskStatusDot[task.status as keyof typeof taskStatusDot] ??
                            taskStatusDot.pending
                          return (
                            <li
                              key={task.id}
                              className="flex items-center gap-3 px-5 py-3"
                            >
                              <span
                                className={`size-1.5 rounded-full shrink-0 ${dotClass}`}
                              />
                              <span
                                className={`flex-1 text-sm ${
                                  task.status === 'completed'
                                    ? 'text-gray-500 line-through'
                                    : task.status === 'cancelled'
                                      ? 'text-gray-600 line-through'
                                      : 'text-gray-300'
                                }`}
                              >
                                {task.title}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs text-gray-600 shrink-0">
                                  {fmtDate(task.dueDate)}
                                </span>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="px-5 py-4 text-xs text-gray-600">
                        No tasks assigned to this sprint yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] p-12 text-center">
          <div className="inline-flex p-4 rounded-xl bg-[#1c1c1c] border border-white/[0.10] mb-5">
            <Zap className="size-8 text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1.5">No sprints yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-5">
            Organize work into sprints to track progress and keep the team focused.
          </p>
          <Button
            size="sm"
            onClick={() => setIsSheetOpen(true)}
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium"
          >
            <Plus className="size-3.5 mr-1.5" />
            New Sprint
          </Button>
        </div>
      )}

      {/* Create Sprint Sheet */}
      <CreateSprintSheet
        projectId={projectId}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSuccess={() => {
          setIsSheetOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}

interface CreateSprintSheetProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function CreateSprintSheet({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: CreateSprintSheetProps) {
  const [name, setName] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setGoalDescription('')
    setStartDate('')
    setEndDate('')
    setError(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Sprint name is required.')
      return
    }
    if (!startDate) {
      setError('Start date is required.')
      return
    }
    if (!endDate) {
      setError('End date is required.')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date.')
      return
    }

    setIsLoading(true)

    const result = await createSprint({
      projectId,
      name: name.trim(),
      startDate,
      endDate,
      goalDescription: goalDescription.trim() || undefined,
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to create sprint.')
      return
    }

    resetForm()
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="bg-black/95 border-white/[0.08] w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold text-white">New Sprint</SheetTitle>
          <SheetDescription className="text-gray-400 text-sm">
            Define a sprint to group and track a set of tasks over a fixed period.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="sprint-name" className="text-sm font-medium text-gray-300">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sprint 1 — Foundation"
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-intelligence-cyan/50"
              disabled={isLoading}
              required
            />
          </div>

          {/* Goal Description */}
          <div className="space-y-2">
            <Label htmlFor="sprint-goal" className="text-sm font-medium text-gray-300">
              Goal Description
            </Label>
            <Textarea
              id="sprint-goal"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="What should be accomplished by the end of this sprint?"
              rows={3}
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-intelligence-cyan/50 resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sprint-start" className="text-sm font-medium text-gray-300">
                Start Date <span className="text-red-400">*</span>
              </Label>
              <Input
                id="sprint-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/50"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-end" className="text-sm font-medium text-gray-300">
                End Date <span className="text-red-400">*</span>
              </Label>
              <Input
                id="sprint-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/50"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="flex-1 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="size-3.5 mr-1.5" />
                  Create Sprint
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
