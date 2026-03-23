import { TaskCard } from './TaskCard'

interface TaskColumnProps {
  title: string
  tasks: any[]
  count: number
}

export function TaskColumn({ title, tasks, count }: TaskColumnProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--space-text-primary)]">{title}</h2>
        <span className="px-3 py-1 rounded-full bg-[var(--space-bg-card)] text-sm text-[var(--space-text-tertiary)]">
          {count}
        </span>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-[var(--space-text-secondary)] py-8">No tasks</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}
