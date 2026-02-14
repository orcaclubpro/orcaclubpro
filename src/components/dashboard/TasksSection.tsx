'use client'

import { useState } from 'react'
import { ListTodo, Plus, CheckCircle, Clock, XCircle, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnhancedTaskCard } from './EnhancedTaskCard'
import { CreateTaskSheet } from './CreateTaskSheet'
import { groupTasksByPriority } from '@/lib/utils/taskUtils'
import type { Task } from '@/types/payload-types'

interface TasksSectionProps {
  projectId: string
  tasks: Task[]
}

export function TasksSection({ projectId, tasks }: TasksSectionProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const groupedTasks = groupTasksByPriority(tasks)
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-intelligence-cyan/[0.05] rounded-full blur-2xl" />
          <div className="relative z-10">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              Total Tasks
            </p>
            <p className="text-2xl font-bold text-white">{totalTasks}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-400/[0.05] rounded-full blur-2xl" />
          <div className="relative z-10">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              Completed
            </p>
            <p className="text-2xl font-bold text-green-400">{completedTasks}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-400/[0.05] rounded-full blur-2xl" />
          <div className="relative z-10">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              In Progress
            </p>
            <p className="text-2xl font-bold text-blue-400">{inProgressTasks}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/[0.05] rounded-full blur-2xl" />
          <div className="relative z-10">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              Pending
            </p>
            <p className="text-2xl font-bold text-yellow-400">{pendingTasks}</p>
          </div>
        </div>
      </div>

      {/* Create Task Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <ListTodo className="size-5 text-intelligence-cyan" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Tasks</h2>
            <p className="text-sm text-gray-400">Manage project tasks by priority</p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10 hover:shadow-intelligence-cyan/20 transition-all duration-300"
        >
          <Plus className="size-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Task Lists by Priority */}
      {totalTasks === 0 ? (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-12 text-center">
          <div className="relative z-10">
            <div className="inline-flex p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
              <Inbox className="size-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Tasks Yet</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Get started by creating your first task for this project.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              variant="outline"
              className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
            >
              <Plus className="size-4 mr-2" />
              Create First Task
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Urgent Tasks */}
          {groupedTasks.urgent.length > 0 && (
            <PriorityGroup
              title="Urgent"
              tasks={groupedTasks.urgent}
              color="red"
            />
          )}

          {/* High Priority Tasks */}
          {groupedTasks.high.length > 0 && (
            <PriorityGroup
              title="High Priority"
              tasks={groupedTasks.high}
              color="yellow"
            />
          )}

          {/* Medium Priority Tasks */}
          {groupedTasks.medium.length > 0 && (
            <PriorityGroup
              title="Medium Priority"
              tasks={groupedTasks.medium}
              color="blue"
            />
          )}

          {/* Low Priority Tasks */}
          {groupedTasks.low.length > 0 && (
            <PriorityGroup
              title="Low Priority"
              tasks={groupedTasks.low}
              color="gray"
            />
          )}
        </div>
      )}

      {/* Create Task Sheet */}
      <CreateTaskSheet
        projectId={projectId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  )
}

function PriorityGroup({
  title,
  tasks,
  color,
}: {
  title: string
  tasks: Task[]
  color: 'red' | 'yellow' | 'blue' | 'gray'
}) {
  const iconColors = {
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    gray: 'text-gray-400',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`size-2 rounded-full ${iconColors[color]}`} />
        <h3 className="text-lg font-semibold text-white">
          {title} ({tasks.length})
        </h3>
      </div>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <EnhancedTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
