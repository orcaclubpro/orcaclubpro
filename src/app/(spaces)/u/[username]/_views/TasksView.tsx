import { TaskColumn } from '@/components/dashboard/TaskColumn'
import { CheckSquare } from 'lucide-react'

interface TasksViewProps {
  tasks: any[]
}

export function TasksView({ tasks }: TasksViewProps) {
  const pendingTasks = tasks.filter((t: any) => t.status === 'pending')
  const inProgressTasks = tasks.filter((t: any) => t.status === 'in-progress')
  const completedTasks = tasks.filter((t: any) => t.status === 'completed')

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <CheckSquare className="size-8 text-intelligence-cyan" />
            Task Manager
          </h1>
          <p className="text-gray-400">
            Track and manage your assigned tasks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TaskColumn title="Pending" tasks={pendingTasks} count={pendingTasks.length} />
        <TaskColumn title="In Progress" tasks={inProgressTasks} count={inProgressTasks.length} />
        <TaskColumn title="Completed" tasks={completedTasks} count={completedTasks.length} />
      </div>
    </div>
  )
}
