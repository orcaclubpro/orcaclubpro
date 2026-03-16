import { TaskCard } from './TaskCard'

interface TaskColumnProps {
  title: string
  tasks: any[]
  count: number
}

export function TaskColumn({ title, tasks, count }: TaskColumnProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#404040] bg-[#2D2D2D] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#F0F0F0]">{title}</h2>
        <span className="px-3 py-1 rounded-full bg-[#252525] text-sm text-[#A0A0A0]">
          {count}
        </span>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-[#6B6B6B] py-8">No tasks</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}
