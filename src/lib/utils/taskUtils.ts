import type { Task } from '@/types/payload-types'

export const getPriorityConfig = (priority: string | null | undefined) => {
  const configs = {
    urgent: {
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20',
      sortOrder: 1,
      label: 'Urgent',
    },
    high: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
      sortOrder: 2,
      label: 'High',
    },
    medium: {
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      sortOrder: 3,
      label: 'Medium',
    },
    low: {
      color: 'text-gray-400',
      bg: 'bg-gray-400/10',
      border: 'border-gray-400/20',
      sortOrder: 4,
      label: 'Low',
    },
  }

  return configs[priority as keyof typeof configs] || configs.medium
}

export const sortTasksByPriority = (tasks: Task[]) => {
  return [...tasks].sort((a, b) => {
    const aOrder = getPriorityConfig(a.priority).sortOrder
    const bOrder = getPriorityConfig(b.priority).sortOrder
    return aOrder - bOrder
  })
}

export const groupTasksByPriority = (tasks: Task[]) => {
  return {
    urgent: tasks.filter((t) => t.priority === 'urgent'),
    high: tasks.filter((t) => t.priority === 'high'),
    medium: tasks.filter((t) => t.priority === 'medium'),
    low: tasks.filter((t) => t.priority === 'low'),
  }
}

export const getStatusConfig = (status: string) => {
  const configs = {
    pending: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
      label: 'Pending',
    },
    'in-progress': {
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      label: 'In Progress',
    },
    completed: {
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
      label: 'Completed',
    },
    cancelled: {
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20',
      label: 'Cancelled',
    },
  }

  return configs[status as keyof typeof configs] || configs.pending
}
