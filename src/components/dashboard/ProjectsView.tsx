'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { FolderOpen } from 'lucide-react'
import {
  DetailShell,
  Eyebrow,
  FactDot,
  ListDetail,
  PrimaryAction,
  Section,
  StatusChip,
  type ListDetailItem,
} from '@/components/dashboard/list-detail/ListDetail'
import { Spine } from '@/components/dashboard/Spine'
import { projectSpineEvents } from '@/lib/dashboard/spine-events'
import { projectStatus, sprintStatus } from '@/lib/dashboard/status'
import { CreateProjectModal, type ClientOption } from './CreateProjectModal'
import { ProjectCarouselEditModal } from './ProjectCarouselEditModal'
import type { SerializedProject, SerializedSprint } from '@/lib/serialization'

// The Plan tab. Same list-detail shell as Clients, so the two read alike; the
// project's sprints and milestones share one time axis instead of living behind
// an inner tab bar.

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

function isOverdue(p: SerializedProject): boolean {
  if (!p.endDate || ['completed', 'cancelled'].includes(p.status)) return false
  return new Date(p.endDate) < new Date()
}

function currentSprint(sprints: SerializedSprint[]): SerializedSprint | null {
  return (
    sprints.find((s) => s.status === 'in-progress') ??
    sprints.find((s) => s.status === 'delayed') ??
    sprints.find((s) => s.status === 'pending') ??
    null
  )
}

/** Active work first, then pending, held, done — matching how staff triage. */
function sortProjects(projects: SerializedProject[]): SerializedProject[] {
  const rank = (s: string) =>
    s === 'in-progress' || s === 'active' ? 0
    : s === 'pending' ? 1
    : s === 'on-hold' ? 2
    : s === 'completed' ? 3
    : 4
  return [...projects].sort(
    (a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name),
  )
}

interface ProjectItem extends ListDetailItem {
  project: SerializedProject
}

export function ProjectsView({
  projects,
  username,
  canCreate = false,
  clients = [],
}: {
  projects: SerializedProject[]
  username: string
  canCreate?: boolean
  clients?: ClientOption[]
}) {
  const items: ProjectItem[] = useMemo(
    () =>
      sortProjects(projects).map((project) => {
        const overdue = isOverdue(project)
        const sprint = currentSprint(project.sprints)
        return {
          id: project.id,
          title: project.name,
          subtitle:
            [project.client?.name, overdue ? 'Overdue' : sprint?.name]
              .filter(Boolean)
              .join(' · ') || null,
          tone: overdue ? 'warn' : projectStatus(project.status).tone,
          trailing:
            sprint && sprint.totalTasksCount > 0
              ? `${sprint.completedTasksCount}/${sprint.totalTasksCount}`
              : null,
          searchText: project.client?.name ?? '',
          project,
        }
      }),
    [projects],
  )

  const activeCount = projects.filter(
    (p) => p.status === 'active' || p.status === 'in-progress',
  ).length

  return (
    <ListDetail<ProjectItem>
      items={items}
      paramKey="p"
      title="Plan"
      searchPlaceholder="Search projects"
      summary={activeCount > 0 ? `${activeCount} in flight` : 'Nothing in flight'}
      action={canCreate ? <CreateProjectModal clients={clients} /> : undefined}
      empty={<EmptyState canCreate={canCreate} clients={clients} />}
      renderDetail={(item) => (
        <ProjectDetail
          project={item.project}
          username={username}
          canEdit={canCreate}
          showClient={canCreate}
        />
      )}
    />
  )
}

// ─── Detail pane ─────────────────────────────────────────────────────────────

function ProjectDetail({
  project,
  username,
  canEdit,
  showClient,
}: {
  project: SerializedProject
  username: string
  canEdit: boolean
  showClient: boolean
}) {
  const overdue = isOverdue(project)
  const status = projectStatus(project.status)
  const sprint = currentSprint(project.sprints)
  const doneMilestones = project.milestones.filter((m) => m.completed).length

  const events = useMemo(
    () => projectSpineEvents(project, username),
    [project, username],
  )

  return (
    <DetailShell
      eyebrow={
        showClient && project.client ? (
          <Link
            href={`/u/${username}/clients?c=${project.client.id}`}
            className="transition-opacity hover:opacity-70"
          >
            <Eyebrow>{project.client.name}</Eyebrow>
          </Link>
        ) : undefined
      }
      name={project.name}
      facts={
        <>
          <StatusChip
            tone={overdue ? 'warn' : status.tone}
            label={overdue ? 'Overdue' : status.label}
          />
          {project.budget && (
            <>
              <FactDot />
              <span>{money.format(project.budget)}</span>
            </>
          )}
          {project.endDate && (
            <>
              <FactDot />
              <span>Due {shortDate.format(new Date(project.endDate))}</span>
            </>
          )}
          {project.milestones.length > 0 && (
            <>
              <FactDot />
              <span>
                {doneMilestones}/{project.milestones.length} milestones
              </span>
            </>
          )}
        </>
      }
      actions={
        <>
          {canEdit && <ProjectCarouselEditModal project={project} />}
          <PrimaryAction href={`/u/${username}/projects/${project.id}`}>
            Open workspace
          </PrimaryAction>
        </>
      }
    >
      {project.description && (
        <p className="mb-8 max-w-prose text-[16px] leading-relaxed text-[var(--space-text-secondary)]">
          {project.description}
        </p>
      )}

      {sprint && <CurrentSprint sprint={sprint} projectId={project.id} username={username} />}

      <Section
        heading="Timeline"
        aside={
          <span className="text-[14px] text-[var(--space-text-muted)]">
            Sprints and milestones, newest first
          </span>
        }
      >
        <Spine
          events={events}
          emptyMessage="No dated sprints or milestones on this project yet."
        />
      </Section>
    </DetailShell>
  )
}

// ─── Current sprint ──────────────────────────────────────────────────────────
// The one thing worth pulling off the timeline: what the team is doing now.

function CurrentSprint({
  sprint,
  projectId,
  username,
}: {
  sprint: SerializedSprint
  projectId: string
  username: string
}) {
  const status = sprintStatus(sprint.status)
  const progress =
    sprint.totalTasksCount > 0
      ? Math.round((sprint.completedTasksCount / sprint.totalTasksCount) * 100)
      : 0

  return (
    <Section heading="Current sprint">
      <Link
        href={`/u/${username}/projects/${projectId}/sprints/${sprint.id}`}
        className="block rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] p-5 transition-colors hover:border-[var(--space-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--space-accent)]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold text-[var(--space-text-primary)]">
              {sprint.name}
            </p>
            <p className="mt-0.5 text-[14px] text-[var(--space-text-muted)]">
              {shortDate.format(new Date(sprint.startDate))} –{' '}
              {shortDate.format(new Date(sprint.endDate))}
            </p>
          </div>
          <StatusChip tone={status.tone} label={status.label} />
        </div>

        {sprint.totalTasksCount > 0 ? (
          <>
            <div className="mb-1.5 flex items-baseline justify-between text-[14px] text-[var(--space-text-secondary)]">
              <span className="tabular-nums">
                {sprint.completedTasksCount} of {sprint.totalTasksCount} tasks done
              </span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-[var(--space-divider)]"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${sprint.name} progress`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${progress}%`,
                  background: `var(--space-status-${progress === 100 ? 'ok' : 'active'})`,
                }}
              />
            </div>
          </>
        ) : (
          <p className="text-[14px] text-[var(--space-text-muted)]">No tasks assigned yet.</p>
        )}

        {sprint.goalDescription && (
          <p className="mt-4 border-t border-[var(--space-border-hard)] pt-3 text-[15px] leading-relaxed text-[var(--space-text-secondary)]">
            {sprint.goalDescription}
          </p>
        )}
      </Link>
    </Section>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  canCreate,
  clients,
}: {
  canCreate: boolean
  clients: ClientOption[]
}) {
  return (
    <div className="mx-auto max-w-sm text-center">
      <FolderOpen className="mx-auto mb-4 size-8 text-[var(--space-text-muted)]" />
      <p className="mb-1 text-[17px] font-semibold text-[var(--space-text-primary)]">
        No projects yet
      </p>
      <p className="mb-6 text-[15px] text-[var(--space-text-secondary)]">
        {canCreate
          ? 'Create a project to plan sprints and track milestones.'
          : 'Projects appear here once work is scheduled.'}
      </p>
      {canCreate && (
        <div className="[&>button]:mx-auto">
          <CreateProjectModal clients={clients} />
        </div>
      )}
    </div>
  )
}
