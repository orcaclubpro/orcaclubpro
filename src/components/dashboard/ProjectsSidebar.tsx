'use client'

import { useState } from 'react'
import { X, Layers, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { SerializedProject } from './ProjectsCarousel'
import { CreateProjectModal } from './CreateProjectModal'

// ─── Status config (compact) ──────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-400',
  'in-progress': 'bg-[var(--space-accent)]',
  'on-hold': 'bg-yellow-400',
  completed: 'bg-blue-400',
  cancelled: 'bg-red-400/60',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  'in-progress': 'In Progress',
  'on-hold': 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateProgress(project: SerializedProject): number {
  if (project.status === 'completed') return 100
  if (project.status === 'cancelled') return 0
  if (!project.startDate) return 0

  const start = new Date(project.startDate).getTime()
  const end = project.endDate
    ? new Date(project.endDate).getTime()
    : start + 30 * 24 * 60 * 60 * 1000
  const now = Date.now()

  if (now >= end) return 100
  if (now <= start) return 0
  return Math.min(100, Math.round(((now - start) / (end - start)) * 100))
}

// ─── Project row ──────────────────────────────────────────────────────────────

function ProjectRow({
  project,
  username,
  onClose,
}: {
  project: SerializedProject
  username: string
  onClose: () => void
}) {
  const dot = STATUS_DOT[project.status] ?? 'bg-gray-400'
  const label = STATUS_LABEL[project.status] ?? project.status
  const progress = calculateProgress(project)

  return (
    <Link
      href={`/u/${username}/projects/${project.id}`}
      onClick={onClose}
      className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-colors duration-150"
    >
      {/* Status dot */}
      <span className={`size-1.5 rounded-full ${dot} shrink-0`} />

      {/* Name + progress */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--space-text-tertiary)] group-hover:text-[var(--space-text-primary)] transition-colors truncate">
          {project.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[rgba(139,156,182,0.30)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[9px] text-[var(--space-text-secondary)] tabular-nums shrink-0 w-6 text-right">
            {progress}%
          </span>
        </div>
        <p className="text-[9px] text-[var(--space-text-secondary)] mt-0.5 uppercase tracking-wider">{label}</p>
      </div>

      {/* Arrow */}
      <ArrowRight className="size-3 text-[var(--space-text-secondary)] group-hover:text-[var(--space-text-tertiary)] group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
    </Link>
  )
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({
  projects,
  username,
  canCreate,
  onClose,
}: {
  projects: SerializedProject[]
  username: string
  canCreate: boolean
  onClose: () => void
}) {
  // Active first, then by status, then alphabetical within group
  const priority = (s: string) =>
    s === 'active' || s === 'in-progress' ? 0 : s === 'on-hold' ? 1 : s === 'completed' ? 2 : 3

  const sorted = [...projects].sort((a, b) => {
    const pd = priority(a.status) - priority(b.status)
    if (pd !== 0) return pd
    return a.name.localeCompare(b.name)
  })

  const activeCount = sorted.filter(
    (p) => p.status === 'active' || p.status === 'in-progress',
  ).length

  return (
    <div className="space-y-1">
      {/* Summary pills */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[rgba(139,156,182,0.10)] text-[var(--space-accent)] border border-[rgba(139,156,182,0.15)]">
          <span className="size-1 rounded-full bg-[var(--space-accent)]" />
          {activeCount} active
        </span>
        <span className="text-[9px] text-[var(--space-text-secondary)]">{projects.length} total</span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-[var(--space-text-secondary)] px-4 py-6 text-center">No projects yet.</p>
      ) : (
        sorted.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            username={username}
            onClose={onClose}
          />
        ))
      )}

      {canCreate && (
        <div className="pt-4 px-4">
          <CreateProjectModal />
        </div>
      )}
    </div>
  )
}

// ─── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({
  count,
  onClose,
}: {
  count: number
  onClose: () => void
}) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--space-border-hard)] shrink-0">
      <div>
        <h2 className="text-sm font-semibold text-[var(--space-text-primary)]">All Projects</h2>
        <p className="text-[10px] text-[var(--space-text-secondary)] mt-0.5 uppercase tracking-wider">
          {count} project{count !== 1 ? 's' : ''}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] transition-all"
        aria-label="Close projects panel"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface ProjectsSidebarProps {
  projects: SerializedProject[]
  username: string
  canCreate?: boolean
}

export function ProjectsSidebar({
  projects,
  username,
  canCreate = false,
}: ProjectsSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── Desktop: right-edge vertical tab ─────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40
                   flex-col items-center gap-2.5
                   pl-3 pr-2.5 py-5
                   bg-[var(--space-bg-card)] border border-r-0 border-[var(--space-border-hard)]
                   rounded-l-xl
                   hover:border-[rgba(139,156,182,0.20)] hover:bg-[var(--space-bg-card-hover)]
                   transition-all duration-300 group"
        aria-label="Toggle projects sidebar"
      >
        <Layers className="size-3.5 text-[var(--space-accent)]" />
        <span
          className="text-[9px] font-semibold text-[var(--space-text-secondary)] uppercase tracking-[0.18em]
                     group-hover:text-[var(--space-text-tertiary)] transition-colors
                     [writing-mode:vertical-rl] rotate-180"
        >
          Projects
        </span>
      </button>

      {/* ── Mobile: right-edge vertical tab (matches desktop pattern) ────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40
                   flex flex-col items-center gap-2
                   pl-2.5 pr-2 py-4
                   bg-[var(--space-bg-card)] border border-r-0 border-[var(--space-border-hard)]
                   rounded-l-xl
                   hover:border-[rgba(139,156,182,0.20)] hover:bg-[var(--space-bg-card-hover)]
                   transition-all duration-300 active:scale-95"
        aria-label="Toggle projects list"
      >
        <Layers className="size-3.5 text-[var(--space-accent)]" />
        <span
          className="text-[8px] font-semibold text-[var(--space-text-secondary)] uppercase tracking-[0.15em]
                     [writing-mode:vertical-rl] rotate-180"
        >
          Projects
        </span>
      </button>

      {/* ── Backdrop — z-[45] ensures it covers the mobile bottom nav (z-40) ── */}
      <div
        className={`fixed inset-0 z-[45] bg-[rgba(255,255,255,0.06)]
                    transition-opacity duration-300
                    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* ── Desktop: slide-in panel from right ──────────────────────────── */}
      <aside
        className={`hidden md:flex fixed top-[88px] right-0 bottom-0 z-40
                    w-[320px] xl:w-[360px] flex-col
                    bg-[var(--space-bg-card)] border-l border-[var(--space-border-hard)]
                    transition-transform duration-300 ease-in-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Projects sidebar"
      >
        <PanelHeader count={projects.length} onClose={() => setOpen(false)} />
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarContent
            projects={projects}
            username={username}
            canCreate={canCreate}
            onClose={() => setOpen(false)}
          />
        </div>
      </aside>

      {/* ── Mobile: slide-up bottom sheet ────────────────────────────────── */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-[55]
                    flex flex-col
                    bg-[var(--space-bg-card)] border-t border-[var(--space-border-hard)] rounded-t-2xl
                    transition-transform duration-300 ease-in-out
                    ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '82vh' }}
        aria-label="Projects panel"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[var(--space-divider)]" />
        </div>
        <PanelHeader count={projects.length} onClose={() => setOpen(false)} />
        <div
          className="overflow-y-auto py-3 pb-10"
          style={{ overscrollBehavior: 'contain' }}
        >
          <SidebarContent
            projects={projects}
            username={username}
            canCreate={canCreate}
            onClose={() => setOpen(false)}
          />
        </div>
      </div>
    </>
  )
}
