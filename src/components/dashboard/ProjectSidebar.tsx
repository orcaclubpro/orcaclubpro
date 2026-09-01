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

// Shared micro-label — matches the client sidebar's section headers.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.625rem] uppercase tracking-widest text-[var(--space-text-muted)] font-semibold">{children}</p>
  )
}

// Compact project navigator list, reused for client + staff project lists.
function ProjectNav({
  label,
  projects,
  currentId,
  username,
}: {
  label: string
  projects: Project[]
  currentId: string
  username: string
}) {
  return (
    <div className="space-y-1">
      <SectionLabel>{label}</SectionLabel>
      <div className="space-y-0.5">
        {projects.map((p) => {
          const pStatus = statusMap[p.status] ?? statusMap.pending
          const isCurrent = p.id === currentId
          return (
            <Link
              key={p.id}
              href={`/u/${username}/projects/${p.id}`}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                isCurrent
                  ? 'bg-[var(--space-bg-card-hover)] text-[var(--space-text-primary)]'
                  : 'text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)]'
              }`}
            >
              <span className={`size-2 rounded-full shrink-0 ${pStatus.dot}`} />
              <span className="truncate flex-1 leading-tight">{p.name}</span>
              {isCurrent && <span className="size-1.5 rounded-full bg-[var(--space-accent)] shrink-0" />}
            </Link>
          )
        })}
      </div>
    </div>
  )
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

  const metadata: Array<{ Icon: typeof Calendar; label: string; value: string }> = [
    // Client name — only shown to admins/staff, not to clients themselves
    ...(!readOnly && clientAccount ? [{ Icon: Building2, label: 'Client', value: (clientAccount as any).name }] : []),
    { Icon: Calendar, label: 'Start date', value: fmt(project.startDate) },
    { Icon: Calendar, label: 'Target completion', value: fmt(project.projectedEndDate) },
    ...(project.budgetAmount
      ? [{ Icon: DollarSign, label: 'Budget', value: fmtCurrency(project.budgetAmount, project.currency || 'USD') }]
      : []),
    ...(!readOnly && assignedUsers.length > 0
      ? [{ Icon: Users, label: 'Assigned to', value: assignedUsers.join(', ') }]
      : []),
  ]

  return (
    <div className="flex flex-col h-full">
      {/* ── Nav ── */}
      <div className="px-5 pt-4 pb-3 border-b border-[var(--space-border-hard)] shrink-0">
        <Link
          href={`/u/${username}/projects`}
          className="group flex items-center gap-1.5 text-[0.6875rem] text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] transition-colors"
        >
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" />
          All projects
        </Link>
      </div>

      {/* ── Project navigators ── */}
      {(clientProjects?.length || (!readOnly && staffProjects?.length)) ? (
        <div className="px-4 py-4 space-y-4 border-b border-[var(--space-border-hard)] shrink-0">
          {clientProjects && clientProjects.length > 0 && (
            <ProjectNav label="Your projects" projects={clientProjects} currentId={project.id} username={username} />
          )}
          {!readOnly && staffProjects && staffProjects.length > 0 && (
            <ProjectNav label="Assigned" projects={staffProjects} currentId={project.id} username={username} />
          )}
        </div>
      ) : null}

      {/* ── Single scroll area ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Title + status */}
        <div className="px-5 py-4 border-b border-[var(--space-border-hard)] space-y-2">
          <h1 className="text-base font-bold text-[var(--space-text-primary)] leading-snug">{project.name}</h1>
          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${status.dot}`} />
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
          {project.description && (
            <p className="text-xs text-[var(--space-text-tertiary)] leading-relaxed pt-1">{project.description}</p>
          )}
        </div>

        {/* Overview */}
        <div className="px-5 py-4 space-y-5">
          {/* Task progress */}
          {totalTasks > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <SectionLabel>Progress</SectionLabel>
                <span className="text-[0.6875rem] text-[var(--space-text-secondary)] font-semibold tabular-nums">
                  {completedTasks}/{totalTasks} tasks · {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--space-divider)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--space-accent)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Details */}
          <div className="space-y-2.5">
            <SectionLabel>Details</SectionLabel>
            <div className="space-y-3">
              {metadata.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="size-3.5 text-[var(--space-text-muted)] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[0.6875rem] text-[var(--space-text-muted)] leading-tight">{label}</p>
                    <p className="text-xs text-[var(--space-text-primary)] font-medium leading-snug break-words">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
