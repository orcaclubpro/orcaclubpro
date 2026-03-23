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
    low: 'text-[var(--space-text-muted)]',
    medium: 'text-blue-400',
    high: 'text-yellow-400',
    urgent: 'text-red-400',
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] p-4 hover:border-[var(--space-border-hard)] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-[var(--space-text-primary)]">{task.title}</h3>
        <span className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
          {task.priority}
        </span>
      </div>

      <p className="text-xs text-[var(--space-text-secondary)] mb-3">
        {typeof task.project === 'object' && task.project ? task.project.name : 'Unknown Project'}
      </p>

      {task.dueDate && (
        <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-400' : 'text-[var(--space-text-secondary)]'}`}>
          {isOverdue ? <AlertCircle className="size-3" /> : <Clock className="size-3" />}
          <span>Due: {formatDate(task.dueDate)}</span>
        </div>
      )}
    </div>
  )
}
