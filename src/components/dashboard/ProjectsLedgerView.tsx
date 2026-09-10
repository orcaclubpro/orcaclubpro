'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Layers, Zap, Clock3, PauseCircle, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import {
  Figure, figureEdges, SectionNav, SectionTitle, SearchField, Empty, ToneRule, Meter,
  useSectionCycle, type FigureSpec, type LedgerSection,
} from '@/components/dashboard/ledger'
import { CreateProjectModal, type ClientOption } from './CreateProjectModal'
import { projectStatus, toneColor, type StatusTone } from '@/lib/dashboard/status'
import type { SerializedProject } from '@/lib/serialization'
import { tabVariants } from '@/lib/animations'

// ─── The project list ────────────────────────────────────────────────────────
// Browsing projects, in the same language as the staff home and the project
// record it opens onto. It used to be a 264px list beside a detail pane that
// re-rendered, worse, what `projects/[project]` already shows — so the pane is
// gone and a row is a link.
//
// It follows the ledger's two rules:
//   1. Every colour is a --space-* token or a status-ramp tone. No raw hex, no
//      Tailwind palette classes — `sonar` (warm paper) is the default theme.
//   2. Type is authored in real px inside .space-true-scale, not in rem against
//      the portal's 1.5 root scale.

const LANES = ['all', 'overdue', 'running', 'pending', 'held', 'done', 'cancelled'] as const
type Lane = typeof LANES[number]

/** The lanes that are a project's status. `overdue` and `all` cut across these
 *  rather than being one of them, so they are excluded here. */
type StatusLane = Exclude<Lane, 'all' | 'overdue'>

const SECTIONS: LedgerSection<Lane>[] = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
  { id: 'running', label: 'In progress', icon: Zap },
  { id: 'pending', label: 'Pending', icon: Clock3 },
  { id: 'held', label: 'On hold', icon: PauseCircle },
  { id: 'done', label: 'Completed', icon: CheckCircle2 },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle },
]

const LANE_TITLE: Record<Lane, string> = {
  all: 'All projects',
  overdue: 'Overdue',
  running: 'In progress',
  pending: 'Pending',
  held: 'On hold',
  done: 'Completed',
  cancelled: 'Cancelled',
}

const LANE_EMPTY: Record<Lane, string> = {
  all: 'No projects yet.',
  overdue: 'Nothing is past its end date.',
  running: 'Nothing is in progress.',
  pending: 'Nothing is waiting to start.',
  held: 'Nothing is on hold.',
  done: 'Nothing has been completed yet.',
  cancelled: 'Nothing has been cancelled.',
}

/** Which lane a raw Payload status falls in. `active` is the legacy spelling of
 *  `in-progress` and has to keep landing in the same place.
 *
 *  Cancelled is deliberately NOT folded in with completed: a cancelled project
 *  is abandoned work, and counting it under "Completed" overstated what the
 *  studio had actually delivered. */
function laneOf(status: string): StatusLane {
  if (status === 'in-progress' || status === 'active') return 'running'
  if (status === 'pending') return 'pending'
  if (status === 'on-hold') return 'held'
  if (status === 'cancelled') return 'cancelled'
  return 'done' // completed, and anything unrecognised
}

/** Triage order: live work first, then what is queued, then what is parked. */
const LANE_RANK: Record<StatusLane, number> = {
  running: 0, pending: 1, held: 2, done: 3, cancelled: 4,
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
})

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`

const DAY = 86_400_000
const daysUntil = (iso: string | null) =>
  iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DAY) : null

/** How a due date reads, and how urgently it should be coloured. Same shape as
 *  the staff home's, so a deadline says the same thing on both pages. */
function due(iso: string | null): { label: string; tone: StatusTone } {
  const d = daysUntil(iso)
  if (d === null) return { label: 'no end date', tone: 'idle' }
  if (d < 0) return { label: `${Math.abs(d)} ${plural(Math.abs(d), 'day')} overdue`, tone: 'danger' }
  if (d === 0) return { label: 'due today', tone: 'warn' }
  if (d <= 7) return { label: `due in ${d} ${plural(d, 'day')}`, tone: 'warn' }
  return { label: `due ${shortDate.format(new Date(iso!))}`, tone: 'idle' }
}

const isOpen = (p: SerializedProject) => !['completed', 'cancelled'].includes(p.status)

// ─── A project line ───────────────────────────────────────────────────────────

function ProjectLine({ project, username }: { project: SerializedProject; username: string }) {
  const meta = projectStatus(project.status)
  const done = project.milestones.filter(m => m.completed).length
  const total = project.milestones.length
  // A deadline only means something while the work is open. Once it is closed
  // the same slot carries when it ended — saying "Completed" here as well as in
  // the column above it was the row stating one fact twice.
  const d: { label: string; tone: StatusTone } = isOpen(project)
    ? due(project.endDate)
    : project.endDate
      ? { label: `ended ${shortDate.format(new Date(project.endDate))}`, tone: 'idle' }
      : { label: '', tone: 'idle' }
  const running = project.sprints.filter(s => s.status === 'in-progress').length

  const extras = [
    project.budget ? usd.format(project.budget) : null,
    running > 0 ? `${running} ${plural(running, 'sprint')} running` : null,
    total > 0 ? `${total} ${plural(total, 'milestone')}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <Link
      href={`/u/${username}/projects/${project.id}`}
      className="group relative block border-b border-[var(--space-divider)] py-4 pl-5 pr-1 transition-colors duration-150 hover:bg-[var(--space-bg-card)] focus-visible:bg-[var(--space-bg-card)] focus-visible:outline-none"
    >
      <ToneRule tone={meta.tone} />

      <div className="flex items-baseline gap-4">
        <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--space-text-primary)]">
          {project.name}
        </span>
        <span className="shrink-0 text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">
          {total > 0 ? `${done}/${total}` : meta.label}
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-4">
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--space-text-tertiary)]">
          {project.client?.name ?? 'no client'}
        </span>
        <span
          className="shrink-0 text-[13px] tabular-nums"
          style={{ color: d.tone === 'idle' ? 'var(--space-text-tertiary)' : toneColor(d.tone) }}
        >
          {d.label}
        </span>
      </div>

      {/* Budget and live sprints — the facts that separate two projects sitting
          at the same milestone count. Hidden on a phone, where the row already
          carries a name, a client and a deadline, and omitted entirely when
          there is nothing to say: the fallback used to be the status, which the
          row states twice over already. */}
      {extras && (
        <span className="mt-1 hidden text-[13px] tabular-nums text-[var(--space-text-tertiary)] sm:block">
          {extras}
        </span>
      )}

      {total > 0 && <Meter pct={(done / total) * 100} tone={meta.tone} />}
    </Link>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectsLedgerView({
  projects,
  username,
  canCreate = false,
  clients,
}: {
  projects: SerializedProject[]
  username: string
  /** Staff only — clients browse their own projects but do not open new ones. */
  canCreate?: boolean
  clients?: ClientOption[]
}) {
  const [lane, setLane] = useState<Lane>('all')
  const [query, setQuery] = useState('')
  const navRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  useSectionCycle(LANES, lane, setLane, navRef)

  // Lane, searchable text and milestone progress, worked out once per project
  // rather than inside every filter and sort pass below.
  const rows = useMemo(
    () =>
      projects.map(p => {
        const total = p.milestones.length
        return {
          project: p,
          lane: laneOf(p.status),
          overdue: isOpen(p) && (daysUntil(p.endDate) ?? 1) < 0,
          done: p.milestones.filter(m => m.completed).length,
          total,
          haystack: [p.name, p.client?.name, p.description]
            .filter(Boolean).join(' ').toLowerCase(),
        }
      }),
    [projects],
  )

  const counts: Partial<Record<Lane, number>> = useMemo(() => {
    const c: Partial<Record<Lane, number>> = {
      all: rows.length,
      overdue: rows.filter(r => r.overdue).length,
    }
    for (const l of LANES) {
      if (l !== 'all' && l !== 'overdue') c[l] = rows.filter(r => r.lane === l).length
    }
    return c
  }, [rows])

  const overdueCount = rows.filter(r => r.overdue).length
  const cancelledCount = rows.filter(r => r.lane === 'cancelled').length
  const openBudget = rows
    .filter(r => isOpen(r.project))
    .reduce((sum, r) => sum + (r.project.budget ?? 0), 0)
  const openMilestones = rows
    .filter(r => isOpen(r.project))
    .reduce((sum, r) => sum + (r.total - r.done), 0)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter(r =>
        lane === 'all' ? true
        : lane === 'overdue' ? r.overdue
        : r.lane === lane,
      )
      .filter(r => !q || r.haystack.includes(q))
      .sort((a, b) =>
        // Overdue to the top wherever you are, then live work, then by deadline.
        (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0) ||
        LANE_RANK[a.lane] - LANE_RANK[b.lane] ||
        (a.project.endDate ? new Date(a.project.endDate).getTime() : Infinity) -
          (b.project.endDate ? new Date(b.project.endDate).getTime() : Infinity) ||
        a.project.name.localeCompare(b.project.name),
      )
  }, [rows, lane, query])

  // Every figure opens the lane it counts — three of these used to press
  // through to 'all', so they read as controls that did nothing. The facts that
  // are not lanes (open budget, milestones outstanding) ride in the notes.
  const figures: FigureSpec<Lane>[] = [
    {
      key: 'all',
      value: rows.length,
      format: String,
      label: plural(rows.length, 'Project'),
      note: openBudget > 0
        ? `${usd.format(openBudget)} of open budget`
        : 'nothing budgeted on open work',
    },
    {
      key: 'running',
      value: counts.running ?? 0,
      format: String,
      label: 'In progress',
      note: openMilestones > 0
        ? `${openMilestones} ${plural(openMilestones, 'milestone')} left`
        : 'no milestones outstanding',
    },
    {
      key: 'overdue',
      value: overdueCount,
      format: String,
      label: 'Overdue',
      note: overdueCount === 0 ? 'every deadline met' : 'past their end date',
    },
    {
      key: 'done',
      value: counts.done ?? 0,
      format: String,
      label: 'Completed',
      note: cancelledCount > 0
        ? `${cancelledCount} cancelled besides`
        : 'nothing cancelled',
    },
  ]

  return (
    <div className="space-true-scale mx-auto w-full px-4 pb-24 pt-6 sm:px-8 sm:pt-10 lg:px-10" style={{ maxWidth: '1180px' }}>

      {/* ── The title card ───────────────────────────────────────────────── */}
      {/* Scrolls away on its own. Nothing here may animate its own height —
          see the note where `useScrollCollapse` used to live in
          `dashboard/ledger`. */}
      <div>
        <header className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-2 sm:pb-10">
          <h1
            className="font-semibold leading-[0.95] tracking-[-0.03em] text-[var(--space-text-primary)]"
            style={{ fontSize: 'clamp(30px, 5vw, 68px)' }}
          >
            Projects
          </h1>
          {canCreate && <CreateProjectModal clients={clients} />}
        </header>

        <section aria-label="Standing">
          <div className="grid grid-cols-2 border-t border-[var(--space-border-hard)] md:grid-cols-4">
            {figures.map(({ key, ...figure }, i) => (
              <Figure
                key={figure.label}
                {...figure}
                active={lane === key}
                onSelect={() => setLane(key)}
                className={figureEdges(i)}
              />
            ))}
          </div>

          {/* The strip's own rule doubles as the mix: live, queued, held, closed. */}
          <div
            className="flex h-[3px] w-full overflow-hidden bg-[var(--space-divider)]"
            role="img"
            aria-label={
              `${counts.running ?? 0} in progress, ${counts.pending ?? 0} pending, ` +
              `${counts.held ?? 0} on hold, ${counts.done ?? 0} completed, ` +
              `${counts.cancelled ?? 0} cancelled`
            }
          >
            <motion.span
              className="flex h-full w-full origin-left"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {([
                ['running', 'active'],
                ['pending', 'idle'],
                ['held', 'warn'],
                ['done', 'ok'],
                ['cancelled', 'danger'],
              ] as Array<[StatusLane, StatusTone]>).map(([l, tone]) => (
                <span
                  key={l}
                  style={{
                    width: `${rows.length ? ((counts[l] ?? 0) / rows.length) * 100 : 0}%`,
                    background: toneColor(tone),
                  }}
                />
              ))}
            </motion.span>
          </div>
        </section>
      </div>

      {/* ── The workspace ────────────────────────────────────────────────── */}
      {/* 54px is `mt-12` spelled out: --spacing is 4.5px inside
          .space-true-scale, so the class this replaces was never the 48px its
          name suggests. */}
      <div
        className="flex flex-col gap-6 lg:flex-row lg:gap-12"
        style={{ marginTop: 54 }}
      >
        <SectionNav
          sections={SECTIONS}
          value={lane}
          onChange={setLane}
          counts={counts}
          navRef={navRef}
          layoutId="projects-lane-chip"
          ariaLabel="Project lanes"
          className="lg:order-2"
        />

        {/* Keyed on the lane, not wrapped in `AnimatePresence mode="wait"` —
            the exit gap would empty the column and throw the page to the top.
            `tabVariants` only touches opacity, transform and blur. */}
        <div className="min-w-0 flex-1 lg:order-1">
          <motion.div
            key={lane}
            variants={tabVariants}
            initial={reduce ? false : 'initial'}
            animate="animate"
          >
            <SectionTitle
              title={LANE_TITLE[lane]}
              aside={
                query.trim()
                  ? `${visible.length} of ${counts[lane] ?? 0} ${visible.length === 1 ? 'match' : 'matches'}`
                  : `${counts[lane] ?? 0} ${plural(counts[lane] ?? 0, 'project')}`
              }
            />

            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search by project, client or description"
              label="Search projects"
            />

            {visible.length === 0 ? (
              <Empty>
                {query.trim() ? `No project matches “${query.trim()}”.` : LANE_EMPTY[lane]}
              </Empty>
            ) : (
              visible.map(({ project }) => (
                <ProjectLine key={project.id} project={project} username={username} />
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
