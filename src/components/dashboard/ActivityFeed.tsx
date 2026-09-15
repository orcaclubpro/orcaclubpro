'use client'

import { Fragment, useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ReceiptText, FolderPlus, SquarePen, Clock3, Mail, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { projectStatus, orderStatus, toneColor, type StatusTone } from '@/lib/dashboard/status'
import { cn } from '@/lib/utils'

// ─── Recent activity ─────────────────────────────────────────────────────────
// The studio's day, in one column. Where <Spine> is a *time axis* — every fact
// a record knows, plotted at its true date, future included — this is a *log*:
// things that already happened, newest first, across every collection at once.
//
// Rows are read-only and presentational. Events arrive already loaded and
// already scoped (see loadStaffActivity in u/[username]/dashboard-data.ts);
// nothing is fetched here. Hrefs arrive portal-relative and are prefixed with
// /u/<username> at render, so a row links to the same route the nav would.

export interface ActivityEvent {
  id: string
  kind: 'order-created' | 'project-created' | 'project-updated' | 'retainer-log' | 'email-sent'
  /** ISO timestamp. Events with an unparseable date are dropped. */
  occurredAt: string
  title: string
  meta?: string | null
  /** Raw status of the subject at event time — mapped to a tone below. */
  status?: string | null
  /** Dollars for orders, hours for retainer logs. Unit follows `kind`. */
  amount?: number | null
  /** Portal-relative, e.g. `/projects/<id>` — WITHOUT the /u/<username> prefix. */
  href?: string | null
  actorName?: string | null
  changes?: Array<{ field: string; from?: string | null; to?: string | null }>
}

const KIND_LABEL: Record<ActivityEvent['kind'], string> = {
  'order-created': 'Invoice',
  'project-created': 'Project',
  'project-updated': 'Update',
  'retainer-log': 'Retainer',
  'email-sent': 'Email',
}

const KIND_ICON: Record<ActivityEvent['kind'], LucideIcon> = {
  'order-created': ReceiptText,
  'project-created': FolderPlus,
  'project-updated': SquarePen,
  'retainer-log': Clock3,
  'email-sent': Mail,
}

/** Lane order in the filter bar — money, then work, then correspondence. */
const KIND_ORDER: readonly ActivityEvent['kind'][] = [
  'order-created',
  'project-created',
  'project-updated',
  'retainer-log',
  'email-sent',
]

/** Filter-bar labels. Plural, because a lane is a set, not one row. */
const KIND_LANE: Record<ActivityEvent['kind'], string> = {
  'order-created': 'Invoices',
  'project-created': 'New projects',
  'project-updated': 'Updates',
  'retainer-log': 'Retainer',
  'email-sent': 'Emails',
}

export type KindFilter = 'all' | ActivityEvent['kind']

/** One lane in the filter, and how many of it are loaded. */
export interface ActivityLane {
  id: KindFilter
  label: string
  icon: LucideIcon
  count: number
}

/**
 * The lanes a set of events actually offers, "All" first.
 *
 * Exported because the staff home lists these in its section nav rather than in
 * a row of chips above the feed — the nav is already the page's one place for
 * choosing what you are looking at, and a second radio group directly beneath
 * it was asking the same question twice.
 *
 * Counts come from the whole loaded set, not a visible slice: a lane showing
 * "3" and then rendering three rows is the honest reading. Lanes with nothing
 * in them never appear, so the list only ever offers a real choice, and events
 * with an unreadable date are dropped here for the same reason the feed drops
 * them — a lane must count exactly what it can show.
 */
export function activityLanes(events: ActivityEvent[]): ActivityLane[] {
  const counts = new Map<ActivityEvent['kind'], number>()
  let total = 0
  for (const e of events) {
    if (Number.isNaN(new Date(e.occurredAt).getTime())) continue
    counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1)
    total++
  }

  const lanes = KIND_ORDER.filter((k) => (counts.get(k) ?? 0) > 0).map((k) => ({
    id: k as KindFilter,
    label: KIND_LANE[k],
    icon: KIND_ICON[k],
    count: counts.get(k) ?? 0,
  }))

  // A list with one real lane in it is a label, not a control — say there are
  // no lanes at all and let the caller leave the choice out.
  if (lanes.length < 2) return []

  return [{ id: 'all' as KindFilter, label: 'All', icon: Layers, count: total }, ...lanes]
}

// Every colour a row can take comes back through the status ramp, so the feed
// reads in the same vocabulary as the rest of the portal in every theme.
function eventTone(event: ActivityEvent): StatusTone {
  switch (event.kind) {
    case 'order-created':
      return orderStatus(event.status).tone
    case 'project-created':
    case 'project-updated':
      return projectStatus(event.status).tone
    case 'retainer-log':
      // Draft entries are *planned* work — estimates that never hit the cap.
      return event.status === 'draft' ? 'idle' : 'active'
    case 'email-sent':
      return 'idle'
  }
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const clock = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const dayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

function dayHeading(d: Date, now: Date): string {
  const today = dayKey(now)
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  const key = dayKey(d)
  if (key === today) return 'Today'
  if (key === yesterday) return 'Yesterday'
  return dayLabel.format(d)
}

function amountLabel(event: ActivityEvent): string | null {
  if (typeof event.amount !== 'number') return null
  if (event.kind === 'retainer-log') return `${event.amount}h`
  if (event.kind === 'order-created') return money.format(event.amount)
  return null
}

export function ActivityFeed({
  events,
  username,
  limit = 40,
  emptyMessage = 'Nothing has happened yet.',
  filterable = true,
  lane,
  onLaneChange,
}: {
  events: ActivityEvent[]
  username: string
  limit?: number
  emptyMessage?: string
  /** Set false where the feed is a fixed excerpt rather than a browsable log. */
  filterable?: boolean
  /**
   * Controlled lane. Pass it — with `activityLanes()` rendered somewhere of
   * your own — and the feed drops its own chip bar and follows yours instead.
   * Left undefined, the feed owns the choice and shows the bar.
   */
  lane?: KindFilter
  /** Only needed for the "nothing in this lane" way back on a controlled feed. */
  onLaneChange?: (id: KindFilter) => void
}) {
  const [ownKind, setOwnKind] = useState<KindFilter>('all')
  const controlled = lane !== undefined
  const kind = controlled ? lane : ownKind
  const setKind = controlled ? (onLaneChange ?? (() => {})) : setOwnKind

  // Parse and sort once. Rows with an unreadable date are dropped here rather
  // than in the grouping pass, so the lane counts below match what a lane can
  // actually show.
  const sorted = useMemo(
    () =>
      [...events]
        .filter((e) => !Number.isNaN(new Date(e.occurredAt).getTime()))
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
    [events],
  )

  // The same lanes a caller would get from `activityLanes`, so the bar drawn
  // here and a nav drawn elsewhere can never disagree about what exists or how
  // many are in it. "All" is split back out because the bar prepends its own.
  const allLanes = useMemo(() => activityLanes(events), [events])
  const lanes = useMemo(() => allLanes.filter((l) => l.id !== 'all'), [allLanes])

  // A bar with one lane in it is a label, not a control — and a controlled feed
  // has its lanes listed by whoever owns them, so it never draws its own.
  const showFilter = filterable && !controlled && lanes.length > 1

  // The chosen lane can vanish between renders — a new load, or a period change
  // upstream that leaves the feed without that kind. Fall back to everything
  // rather than rendering an empty list under a chip that is no longer there.
  const active: KindFilter =
    kind === 'all' || lanes.some((l) => l.id === kind) ? kind : 'all'

  // Newest first, then grouped by day so the column carries a scale without
  // repeating the date on every row. The limit applies *after* the lane filter,
  // so narrowing to one kind reaches further back rather than showing whatever
  // survived a slice of the mixed feed.
  const days = useMemo(() => {
    const visible = (active === 'all' ? sorted : sorted.filter((e) => e.kind === active)).slice(
      0,
      limit,
    )

    const now = new Date()
    const out: Array<{ key: string; label: string; events: ActivityEvent[] }> = []
    for (const e of visible) {
      const d = new Date(e.occurredAt)
      const key = dayKey(d)
      const last = out[out.length - 1]
      if (last?.key === key) last.events.push(e)
      else out.push({ key, label: dayHeading(d, now), events: [e] })
    }
    return out
  }, [sorted, active, limit])

  // Nothing at all versus nothing in this lane are different facts, and only the
  // second one is the user's own doing — so only the second offers a way back.
  if (days.length === 0) {
    return (
      <>
        {showFilter && (
          <KindFilterBar
            lanes={lanes}
            total={sorted.length}
            value={active}
            onChange={setKind}
          />
        )}
        <p className="border-t border-[var(--space-divider)] px-1 py-8 text-center text-[15px] text-[var(--space-text-muted)]">
          {active === 'all' ? (
            emptyMessage
          ) : (
            <>
              Nothing in this lane.
              {/* Controlled feeds have no chip bar of their own, so the way back
                  has to live here — the reader chose this lane and should not
                  need to find the nav again to leave it. */}
              {controlled && onLaneChange && (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={() => onLaneChange('all')}
                    className="underline decoration-[var(--space-divider)] underline-offset-4 transition-colors hover:text-[var(--space-text-primary)] hover:decoration-[var(--space-accent)] focus-visible:outline-none focus-visible:text-[var(--space-text-primary)]"
                  >
                    Show everything
                  </button>
                </>
              )}
            </>
          )}
        </p>
      </>
    )
  }

  return (
    <>
      {showFilter && (
        <KindFilterBar lanes={lanes} total={sorted.length} value={active} onChange={setKind} />
      )}
      <ol className="divide-y divide-[var(--space-divider)] border-t border-[var(--space-divider)]">
        {days.map((day) => (
          <Fragment key={day.key}>
            <li className="px-1 pb-1.5 pt-3 text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--space-text-muted)]">
              {day.label}
            </li>
            {day.events.map((event) => (
              <ActivityRow key={event.id} event={event} username={username} />
            ))}
          </Fragment>
        ))}
      </ol>
    </>
  )
}

// ─── Lane filter ─────────────────────────────────────────────────────────────
// One row of the feed's kinds, each carrying how many of it are loaded. It is a
// radio group, not a set of toggles — the feed shows everything or one lane, so
// there is no state where two chips are on and the reader has to work out what
// the column is.
//
// Keyboard follows the section nav next door: one tab stop for the group, then
// arrows to move between chips (which selects, so the feed always matches the
// focused chip). `data-tab-cycle="off"` opts the group out of the ledger's
// Tab-cycles-sections binding, so once focus is inside, Tab leaves the group
// normally instead of jumping to another section.

function KindFilterBar({
  lanes,
  total,
  value,
  onChange,
}: {
  lanes: Array<{ id: KindFilter; label: string; icon: LucideIcon; count: number }>
  total: number
  value: KindFilter
  onChange: (id: KindFilter) => void
}) {
  const chips = useMemo(
    () => [{ id: 'all' as KindFilter, label: 'All', icon: Layers, count: total }, ...lanes],
    [lanes, total],
  )
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent, i: number) => {
      const last = chips.length - 1
      let next = i
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = last
      else return
      e.preventDefault()
      onChange(chips[next].id)
      refs.current[next]?.focus()
    },
    [chips, onChange],
  )

  return (
    <div
      role="radiogroup"
      aria-label="Filter activity by type"
      data-tab-cycle="off"
      className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-3"
    >
      {chips.map(({ id, label, icon: Icon, count }, i) => {
        const active = value === id
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'relative shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]',
              !active &&
                'text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)]',
            )}
          >
            {active && (
              <motion.span
                layoutId="activity-lane-chip"
                aria-hidden="true"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'var(--space-text-primary)' }}
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            )}
            <span
              className="relative z-10 flex items-center gap-1.5 whitespace-nowrap"
              style={active ? { color: 'var(--space-bg-base)' } : undefined}
            >
              <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
              {label}
              <span
                className={cn('tabular-nums', !active && 'text-[var(--space-text-muted)]')}
                style={active ? { opacity: 0.7 } : undefined}
              >
                {count}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ActivityRow({ event, username }: { event: ActivityEvent; username: string }) {
  const color = toneColor(eventTone(event))
  const Icon = KIND_ICON[event.kind]
  const at = new Date(event.occurredAt)
  const amount = amountLabel(event)
  const href = event.href ? `/u/${username}${event.href}` : null

  const body = (
    <>
      <time
        dateTime={at.toISOString()}
        className="w-14 shrink-0 pt-px text-right text-[13px] tabular-nums text-[var(--space-text-muted)]"
      >
        {clock.format(at)}
      </time>

      <Icon aria-hidden className="mt-0.5 size-3.5 shrink-0" style={{ color }} />

      <span className="ml-1 min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-[15px] font-medium text-[var(--space-text-primary)]">
            {event.title}
          </span>
          <span className="shrink-0 text-[13px] text-[var(--space-text-muted)]">
            {KIND_LABEL[event.kind]}
          </span>
        </span>

        {event.meta && (
          <span className="mt-0.5 block truncate text-[14px] text-[var(--space-text-secondary)]">
            {event.meta}
          </span>
        )}

        {/* Project updates carry their diff — the fields that actually moved. */}
        {event.changes && event.changes.length > 0 && (
          <span className="mt-0.5 block truncate text-[13px] text-[var(--space-text-tertiary)]">
            {event.changes.slice(0, 3).map((change, i) => (
              <Fragment key={`${change.field}-${i}`}>
                {i > 0 && <span className="text-[var(--space-text-muted)]"> · </span>}
                {change.field}{' '}
                <span className="text-[var(--space-text-muted)]">{change.from ?? '—'} → </span>
                {change.to ?? '—'}
              </Fragment>
            ))}
            {event.changes.length > 3 && (
              <span className="text-[var(--space-text-muted)]">
                {' '}· +{event.changes.length - 3} more
              </span>
            )}
          </span>
        )}

        {event.actorName && (
          <span className="mt-0.5 block text-[13px] text-[var(--space-text-muted)]">
            {event.actorName}
          </span>
        )}
      </span>

      {amount && (
        <span className="shrink-0 pt-px text-[14px] tabular-nums" style={{ color }}>
          {amount}
        </span>
      )}
    </>
  )

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className="flex items-start gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-[var(--space-bg-card-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--space-accent)]"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-start gap-3 px-1 py-2.5">{body}</div>
      )}
    </li>
  )
}
