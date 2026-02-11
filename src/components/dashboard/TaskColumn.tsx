import { TaskCard } from './TaskCard'

interface TaskColumnProps {
  title: string
  tasks: any[]
  count: number
}

export function TaskColumn({ title, tasks, count }: TaskColumnProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <span className="px-3 py-1 rounded-full bg-white/[0.05] text-sm text-gray-300">
          {count}
        </span>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No tasks</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}
