import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, DollarSign, Users } from 'lucide-react'
import { ProjectSettingsModal } from './ProjectSettingsModal'
import type { Project, Task } from '@/types/payload-types'

interface ProjectSidebarProps {
  project: Project
  tasks: Task[]
  username: string
}

const statusMap: Record<string, { dot: string; label: string; color: string }> = {
  pending: { dot: 'bg-yellow-400', label: 'Pending', color: 'text-yellow-400' },
  'in-progress': { dot: 'bg-intelligence-cyan', label: 'In Progress', color: 'text-intelligence-cyan' },
  'on-hold': { dot: 'bg-orange-400', label: 'On Hold', color: 'text-orange-400' },
  completed: { dot: 'bg-green-400', label: 'Completed', color: 'text-green-400' },
  cancelled: { dot: 'bg-red-400', label: 'Cancelled', color: 'text-red-400' },
}

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

function fmtCurrency(amount: number | null | undefined, currency = 'USD') {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function ProjectSidebar({ project, tasks, username }: ProjectSidebarProps) {
  const status = statusMap[project.status] ?? statusMap.pending
  const clientAccount = typeof project.client === 'object' ? project.client : null

  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const assignedUsers = Array.isArray(project.assignedTo)
    ? project.assignedTo.map((u: any) =>
        typeof u === 'object' ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u
      )
    : []

  return (
    <div className="p-5 space-y-5 h-full">
      {/* Back nav */}
      <Link
        href={`/u/${username}/projects`}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors group"
      >
        <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" />
        All Projects
      </Link>

      {/* Project title + status */}
      <div className="space-y-2 pt-1">
        <h1 className="text-base font-semibold text-white leading-snug">{project.name}</h1>
        <div className="flex items-center gap-1.5">
          <div className={`size-1.5 rounded-full ${status.dot}`} />
          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-gray-500 leading-relaxed">{project.description}</p>
      )}

      {/* Task progress */}
      {totalTasks > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Progress</span>
            <span className="text-gray-400 tabular-nums">{completedTasks}/{totalTasks} tasks</span>
          </div>
          <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-intelligence-cyan rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">{progress}% complete</p>
        </div>
      )}

      <div className="border-t border-white/[0.06]" />

      {/* Metadata */}
      <div className="space-y-3.5">
        {clientAccount && (
          <div className="flex items-start gap-2.5">
            <Building2 className="size-3.5 text-gray-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Client</p>
              <p className="text-xs text-gray-300 font-medium">{(clientAccount as any).name}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2.5">
          <Calendar className="size-3.5 text-gray-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Start date</p>
            <p className="text-xs text-gray-300">{fmt(project.startDate)}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Calendar className="size-3.5 text-gray-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Target completion</p>
            <p className="text-xs text-gray-300">{fmt(project.projectedEndDate)}</p>
          </div>
        </div>

        {project.budgetAmount && (
          <div className="flex items-start gap-2.5">
            <DollarSign className="size-3.5 text-gray-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Budget</p>
              <p className="text-xs text-gray-300">
                {fmtCurrency(project.budgetAmount, project.currency || 'USD')}
              </p>
            </div>
          </div>
        )}

        {assignedUsers.length > 0 && (
          <div className="flex items-start gap-2.5">
            <Users className="size-3.5 text-gray-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Assigned to</p>
              <p className="text-xs text-gray-300 leading-relaxed">{assignedUsers.join(', ')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* Edit */}
      <div>
        <ProjectSettingsModal project={project} tasks={tasks} />
      </div>
    </div>
  )
}
