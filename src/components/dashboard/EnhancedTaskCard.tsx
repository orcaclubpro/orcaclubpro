'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Target,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateTaskStatus } from '@/actions/tasks'
import { getPriorityConfig, getStatusConfig } from '@/lib/utils/taskUtils'
import { formatDate, isOverdue, getDaysUntil } from '@/lib/utils/dateUtils'
import type { Task, User as UserType } from '@/types/payload-types'

interface EnhancedTaskCardProps {
  task: Task
}

export function EnhancedTaskCard({ task }: EnhancedTaskCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priorityConfig = getPriorityConfig(task.priority)
  const statusConfig = getStatusConfig(task.status)
  const assignedUser = typeof task.assignedTo === 'object' ? task.assignedTo : null

  const isTaskOverdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed'
  const daysUntil = task.dueDate ? getDaysUntil(task.dueDate) : null

  const handleMarkComplete = async () => {
    setError(null)
    setIsUpdating(true)

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const result = await updateTaskStatus({
      taskId: task.id,
      status: newStatus,
    })

    setIsUpdating(false)

    if (!result.success) {
      setError(result.error || 'Failed to update task')
      return
    }

    router.refresh()
  }

  // Extract text from rich text description
  const getDescriptionText = () => {
    if (!task.description) return null
    try {
      const children = task.description.root?.children || []
      return children
        .map((child: any) => {
          if (child.children) {
            return child.children.map((c: any) => c.text || '').join('')
          }
          return ''
        })
        .join('\n')
        .trim()
    } catch {
      return null
    }
  }

  const descriptionText = getDescriptionText()

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${priorityConfig.border} ${priorityConfig.bg} backdrop-blur-md p-5 hover:border-white/[0.12] transition-all duration-300`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 ${priorityConfig.color} opacity-5 rounded-full blur-3xl" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-white">{task.title}</h3>

              {/* Priority Badge */}
              <Badge
                variant="outline"
                className={`${priorityConfig.color} ${priorityConfig.bg} border ${priorityConfig.border} px-2 py-0.5 text-xs font-medium`}
              >
                {task.priority === 'urgent' && <Zap className="size-3 mr-1" />}
                {priorityConfig.label}
              </Badge>

              {/* Status Badge */}
              <Badge
                variant="outline"
                className={`${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border} px-2 py-0.5 text-xs font-medium flex items-center gap-1`}
              >
                {task.status === 'completed' && <CheckCircle className="size-3" />}
                {task.status === 'in-progress' && <Clock className="size-3" />}
                {task.status === 'cancelled' && <XCircle className="size-3" />}
                {statusConfig.label}
              </Badge>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  <span className={isTaskOverdue ? 'text-red-400 font-medium' : ''}>
                    {formatDate(task.dueDate)}
                    {isTaskOverdue && ' (Overdue)'}
                    {!isTaskOverdue && daysUntil !== null && daysUntil >= 0 && (
                      <span className="ml-1 text-gray-600">
                        ({daysUntil === 0 ? 'Today' : `${daysUntil}d left`})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {(task.estimatedHours || task.actualHours) && (
                <div className="flex items-center gap-1">
                  <Target className="size-3" />
                  <span>
                    {task.actualHours || 0}h / {task.estimatedHours || 0}h
                  </span>
                </div>
              )}

              {assignedUser && (
                <div className="text-gray-400">
                  Assigned to: {assignedUser.firstName} {assignedUser.lastName}
                </div>
              )}
            </div>

            {/* Overdue Warning */}
            {isTaskOverdue && (
              <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3">
                <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">
                  This task is overdue and requires attention
                </p>
              </div>
            )}
          </div>

          {/* Quick Action Button */}
          {task.status !== 'cancelled' && (
            <Button
              onClick={handleMarkComplete}
              disabled={isUpdating}
              size="sm"
              variant={task.status === 'completed' ? 'outline' : 'default'}
              className={
                task.status === 'completed'
                  ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]'
                  : 'bg-green-400/20 text-green-400 border border-green-400/30 hover:bg-green-400/30'
              }
            >
              {isUpdating ? (
                'Updating...'
              ) : task.status === 'completed' ? (
                <>
                  <XCircle className="size-4 mr-2" />
                  Reopen
                </>
              ) : (
                <>
                  <CheckCircle className="size-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          )}
        </div>

        {/* Description (Expandable) */}
        {descriptionText && (
          <div>
            <div
              className={`text-sm text-gray-400 leading-relaxed ${
                !isExpanded ? 'line-clamp-2' : ''
              }`}
            >
              {descriptionText}
            </div>
            {descriptionText.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-intelligence-cyan hover:text-intelligence-cyan/80 mt-2 flex items-center gap-1 transition-colors"
              >
                {isExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="size-3" />
                  </>
                ) : (
                  <>
                    Show more
                    <ChevronDown className="size-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
