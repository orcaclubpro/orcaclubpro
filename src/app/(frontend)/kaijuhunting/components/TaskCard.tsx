'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, MapPin, Clock, Zap, Skull } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteTask, updateTask, type KaijuHuntingTask } from '../actions/tasks'

interface TaskCardProps {
  task: KaijuHuntingTask
  onEdit: () => void
  onUpdate: () => void
}

export function TaskCard({ task, onEdit, onUpdate }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleDelete = async () => {
    if (!task.id) return
    
    setIsDeleting(true)
    const result = await deleteTask(task.id)
    
    if (result.success) {
      onUpdate()
    } else {
      console.error('Failed to delete task:', result.error)
    }
    setIsDeleting(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!task.id) return
    
    setIsUpdating(true)
    const result = await updateTask(task.id, { status: newStatus as any })
    
    if (result.success) {
      onUpdate()
    } else {
      console.error('Failed to update task:', result.error)
    }
    setIsUpdating(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'legendary':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'hard':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'easy':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reconnaissance':
        return '🔍'
      case 'capture':
        return '🕸️'
      case 'elimination':
        return '💀'
      case 'rescue':
        return '🚑'
      case 'research':
        return '🔬'
      default:
        return '🎯'
    }
  }

  // Get description text - now it's just a simple string
  const getDescriptionText = (description: string | undefined): string => {
    return description || ''
  }

  const nextStatus = {
    pending: 'in_progress',
    in_progress: 'completed',
    completed: 'completed',
    failed: 'pending',
  }

  const statusLabels = {
    pending: 'Start Hunt',
    in_progress: 'Complete',
    completed: 'Completed',
    failed: 'Retry',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-800/70 border-slate-600 hover:border-slate-500 transition-all duration-200 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1 line-clamp-2">{task.title}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-lg">{getCategoryIcon(task.category)}</span>
                <span className="capitalize">{task.category}</span>
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="text-gray-400 hover:text-white hover:bg-slate-700 p-1 h-8 w-8"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 p-1 h-8 w-8"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Kaiju Type */}
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm">
              <Skull className="w-4 h-4 text-red-400" />
              <span className="text-white font-medium">{task.kaijuType}</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <MapPin className="w-4 h-4" />
            <span>{task.location}</span>
          </div>

          {/* Description */}
          {task.description && (
            <div className="text-sm text-gray-300 mb-3 line-clamp-2">
              {getDescriptionText(task.description)}
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={getDifficultyColor(task.difficulty)}>
              {task.difficulty}
            </Badge>
          </div>

          {/* Duration & Rewards */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            {task.estimatedDuration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{task.estimatedDuration}h</span>
              </div>
            )}
            {task.rewards && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400">{task.rewards}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {task.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(nextStatus[task.status as keyof typeof nextStatus])}
              disabled={isUpdating}
              className="w-full text-xs bg-slate-700/50 border-slate-600 hover:bg-slate-600 hover:border-slate-500"
            >
              {statusLabels[task.status as keyof typeof statusLabels]}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}