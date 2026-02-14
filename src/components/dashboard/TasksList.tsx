'use client'

import { CheckCircle, Clock, Circle, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getPriorityConfig } from '@/lib/utils/taskUtils'
import { formatDate, isOverdue } from '@/lib/utils/dateUtils'
import type { Task } from '@/types/payload-types'

interface TasksListProps {
  tasks: Task[]
  projectId: string
}

export function TasksList({ tasks, projectId }: TasksListProps) {
  // Group tasks by priority
  const groupedTasks = {
    urgent: tasks.filter((t) => t.priority === 'urgent'),
    high: tasks.filter((t) => t.priority === 'high'),
    medium: tasks.filter((t) => t.priority === 'medium'),
    low: tasks.filter((t) => t.priority === 'low'),
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20', label: 'Pending' },
      'in-progress': { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'In Progress' },
      completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', label: 'Completed' },
      cancelled: { icon: Circle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', label: 'Cancelled' },
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  if (tasks.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md p-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-intelligence-cyan/[0.02] to-transparent" />
        <div className="relative z-10">
          <Circle className="size-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Tasks Yet</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Use the task manager to create and organize tasks for this project.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Tasks ({tasks.length})</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CheckCircle className="size-4 text-green-400" />
          <span>
            {tasks.filter((t) => t.status === 'completed').length} completed
          </span>
        </div>
      </div>

      {Object.entries(groupedTasks).map(([priorityKey, priorityTasks]) => {
        if (priorityTasks.length === 0) return null
        const priorityConfig = getPriorityConfig(priorityKey)

        return (
          <div key={priorityKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${priorityConfig.bg}`} />
              <h3 className={`text-lg font-semibold ${priorityConfig.color}`}>
                {priorityConfig.label} ({priorityTasks.length})
              </h3>
            </div>

            <div className="grid gap-3">
              {priorityTasks.map((task) => {
                const statusConfig = getStatusConfig(task.status || 'pending')
                const StatusIcon = statusConfig.icon
                const overdueTask = isOverdue(task.dueDate)

                return (
                  <div
                    key={task.id}
                    className={`relative overflow-hidden rounded-xl border ${priorityConfig.border} ${priorityConfig.bg} p-4 hover:bg-white/[0.02] transition-all duration-200`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <StatusIcon className={`size-5 ${statusConfig.color} shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium leading-tight mb-1">
                              {task.title}
                            </h4>
                            {task.description && typeof task.description === 'object' && (
                              <p className="text-sm text-gray-400 line-clamp-2">
                                {/* Extract text from Lexical rich text structure */}
                                {JSON.stringify(task.description).substring(0, 150)}...
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <Badge
                            variant="outline"
                            className={`${statusConfig.border} ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </Badge>

                          {task.dueDate && (
                            <div
                              className={`flex items-center gap-1.5 ${
                                overdueTask && task.status !== 'completed'
                                  ? 'text-red-400'
                                  : 'text-gray-400'
                              }`}
                            >
                              <Calendar className="size-3" />
                              <span>Due: {formatDate(task.dueDate)}</span>
                              {overdueTask && task.status !== 'completed' && (
                                <span className="text-xs font-medium">(Overdue)</span>
                              )}
                            </div>
                          )}

                          {task.estimatedHours && (
                            <span className="text-gray-400">
                              Est: {task.estimatedHours}h
                            </span>
                          )}

                          {task.actualHours && (
                            <span className="text-gray-400">
                              Actual: {task.actualHours}h
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
