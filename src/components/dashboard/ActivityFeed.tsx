'use client'

import { Fragment, useMemo } from 'react'
import Link from 'next/link'
import { ReceiptText, FolderPlus, SquarePen, Clock3, Mail } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { projectStatus, orderStatus, toneColor, type StatusTone } from '@/lib/dashboard/status'

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
}: {
  events: ActivityEvent[]
  username: string
  limit?: number
  emptyMessage?: string
}) {
  // Newest first, then grouped by day so the column carries a scale without
  // repeating the date on every row.
  const days = useMemo(() => {
    const sorted = [...events]
      .filter((e) => !Number.isNaN(new Date(e.occurredAt).getTime()))
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, limit)

    const now = new Date()
    const out: Array<{ key: string; label: string; events: ActivityEvent[] }> = []
    for (const e of sorted) {
      const d = new Date(e.occurredAt)
      const key = dayKey(d)
      const last = out[out.length - 1]
      if (last?.key === key) last.events.push(e)
      else out.push({ key, label: dayHeading(d, now), events: [e] })
    }
    return out
  }, [events, limit])

  if (days.length === 0) {
    return (
      <p className="border-t border-[var(--space-divider)] px-1 py-8 text-center text-[15px] text-[var(--space-text-muted)]">
        {emptyMessage}
      </p>
    )
  }

  return (
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
