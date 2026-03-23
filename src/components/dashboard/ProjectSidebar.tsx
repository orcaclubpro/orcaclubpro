import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, DollarSign, Users } from 'lucide-react'
import type { Project, Task } from '@/types/payload-types'

interface ProjectSidebarProps {
  project: Project
  tasks: Task[]
  username: string
  readOnly?: boolean
  clientProjects?: Project[]
  staffProjects?: Project[]
}

const statusMap: Record<string, { dot: string; label: string; color: string }> = {
  pending: { dot: 'bg-yellow-400', label: 'Pending', color: 'text-yellow-400' },
  'in-progress': { dot: 'bg-[var(--space-accent)]', label: 'In Progress', color: 'text-[var(--space-accent)]' },
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

export function ProjectSidebar({ project, tasks, username, readOnly, clientProjects, staffProjects }: ProjectSidebarProps) {
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
    <div className="p-6 space-y-7 h-full">
      {/* Back nav */}
      <Link
        href={`/u/${username}/projects`}
        className="flex items-center gap-1.5 text-sm text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] transition-colors group"
      >
        <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" />
        All Projects
      </Link>

      {/* ── Client project navigator ────────────────────────────────────── */}
      {clientProjects && clientProjects.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-[var(--space-text-primary)] uppercase tracking-widest px-1 mb-3">
            Your Projects
          </p>
          {clientProjects.map((p) => {
            const pStatus = statusMap[p.status] ?? statusMap.pending
            const isCurrent = p.id === project.id
            return (
              <Link
                key={p.id}
                href={`/u/${username}/projects/${p.id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-colors ${
                  isCurrent
                    ? 'bg-[var(--space-bg-card-hover)] text-[var(--space-text-primary)]'
                    : 'text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)]'
                }`}
              >
                <span className={`size-2 rounded-full shrink-0 ${pStatus.dot}`} />
                <span className="truncate flex-1">{p.name}</span>
                {isCurrent && (
                  <span className="size-1.5 rounded-full bg-[var(--space-accent)] shrink-0" />
                )}
              </Link>
            )
          })}
          <div className="border-t border-[var(--space-border-hard)] pt-2 mt-2" />
        </div>
      )}

      {/* ── Staff / admin assigned projects navigator ────────────────────── */}
      {!readOnly && staffProjects && staffProjects.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-[var(--space-text-primary)] uppercase tracking-widest px-1 mb-3">
            Assigned
          </p>
          {staffProjects.map((p) => {
            const pStatus = statusMap[p.status] ?? statusMap.pending
            const isCurrent = p.id === project.id
            return (
              <Link
                key={p.id}
                href={`/u/${username}/projects/${p.id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-colors ${
                  isCurrent
                    ? 'bg-[var(--space-bg-card-hover)] text-[var(--space-text-primary)]'
                    : 'text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)]'
                }`}
              >
                <span className={`size-2 rounded-full shrink-0 ${pStatus.dot}`} />
                <span className="truncate flex-1">{p.name}</span>
                {isCurrent && (
                  <span className="size-1.5 rounded-full bg-[var(--space-accent)] shrink-0" />
                )}
              </Link>
            )
          })}
          <div className="border-t border-[var(--space-border-hard)] pt-2 mt-2" />
        </div>
      )}

      {/* Project title + status */}
      <div className="space-y-2 pt-1">
        <h1 className="text-base font-semibold text-[var(--space-text-primary)] leading-snug">{project.name}</h1>
        <div className="flex items-center gap-1.5">
          <div className={`size-1.5 rounded-full ${status.dot}`} />
          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-[var(--space-text-tertiary)] leading-relaxed">{project.description}</p>
      )}

      {/* Task progress */}
      {totalTasks > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--space-text-primary)] font-semibold">Progress</span>
            <span className="text-[var(--space-text-primary)] font-bold tabular-nums">{completedTasks}/{totalTasks} tasks</span>
          </div>
          <div className="h-2 bg-[var(--space-divider)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--space-accent)] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--space-text-secondary)]">{progress}% complete</p>
        </div>
      )}

      <div className="border-t border-[var(--space-border-hard)]" />

      {/* Metadata */}
      <div className="space-y-3.5">
        {/* Client name — only shown to admins/staff, not to clients themselves */}
        {!readOnly && clientAccount && (
          <div className="flex items-start gap-3">
            <Building2 className="size-4 text-[var(--space-text-tertiary)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-[var(--space-text-secondary)] mb-1">Client</p>
              <p className="text-sm text-[var(--space-text-primary)] font-bold">{(clientAccount as any).name}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Calendar className="size-4 text-[var(--space-text-tertiary)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-[var(--space-text-secondary)] mb-1">Start date</p>
            <p className="text-sm text-[var(--space-text-primary)] font-medium">{fmt(project.startDate)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="size-4 text-[var(--space-text-tertiary)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-[var(--space-text-secondary)] mb-1">Target completion</p>
            <p className="text-sm text-[var(--space-text-primary)] font-medium">{fmt(project.projectedEndDate)}</p>
          </div>
        </div>

        {project.budgetAmount && (
          <div className="flex items-start gap-3">
            <DollarSign className="size-4 text-[var(--space-text-tertiary)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-[var(--space-text-secondary)] mb-1">Budget</p>
              <p className="text-sm text-[var(--space-text-primary)] font-medium">
                {fmtCurrency(project.budgetAmount, project.currency || 'USD')}
              </p>
            </div>
          </div>
        )}

        {/* Assigned users — only shown to admins/staff */}
        {!readOnly && assignedUsers.length > 0 && (
          <div className="flex items-start gap-3">
            <Users className="size-4 text-[var(--space-text-tertiary)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-[var(--space-text-secondary)] mb-1">Assigned to</p>
              <p className="text-sm text-[var(--space-text-primary)] leading-relaxed">{assignedUsers.join(', ')}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
