import { Clock, AlertCircle } from 'lucide-react'

interface TaskCardProps {
  task: any
}

export function TaskCard({ task }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-blue-400',
    high: 'text-yellow-400',
    urgent: 'text-red-400',
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-white">{task.title}</h3>
        <span className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
          {task.priority}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {typeof task.project === 'object' && task.project ? task.project.name : 'Unknown Project'}
      </p>

      {task.dueDate && (
        <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
          {isOverdue ? <AlertCircle className="size-3" /> : <Clock className="size-3" />}
          <span>Due: {formatDate(task.dueDate)}</span>
        </div>
      )}
    </div>
  )
}
