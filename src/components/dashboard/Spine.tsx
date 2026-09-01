'use client'

import { Fragment, useMemo } from 'react'
import Link from 'next/link'
import { toneColor, type StatusTone } from '@/lib/dashboard/status'

// ─── The spine ───────────────────────────────────────────────────────────────
// A single vertical time axis. Every fact the portal knows about a record —
// project starts, sprints, milestones, invoices, payments — lands on it as a
// tick at its true date, newest first, with a rule marking today.
//
// This replaced five separate timeline components (PortfolioTimeline,
// ClientPortfolioTimeline, ProfileTimeline, ProjectTimeline and
// ClientInvoiceTimeline). Feed it events from an adapter in
// `src/lib/dashboard/spine-events.ts`; it renders the same way for every record
// type, so a client and a project read alike.

export interface SpineEvent {
  id: string
  /** ISO date. Events without a real date must be filtered out by the adapter. */
  date: string
  kind: 'project' | 'sprint' | 'milestone' | 'invoice' | 'payment'
  title: string
  /** Second line — status, counts, whatever qualifies the event. */
  meta?: string | null
  tone: StatusTone
  href?: string | null
  /** Rendered right-aligned and monospaced when present. */
  amount?: number | null
}

const KIND_LABEL: Record<SpineEvent['kind'], string> = {
  project: 'Project',
  sprint: 'Sprint',
  milestone: 'Milestone',
  invoice: 'Invoice',
  payment: 'Payment',
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dayMonth = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`
}

export function Spine({
  events,
  emptyMessage = 'Nothing on the timeline yet.',
}: {
  events: SpineEvent[]
  emptyMessage?: string
}) {
  const now = Date.now()

  // Newest first, then grouped into months so the axis carries a scale.
  const months = useMemo(() => {
    const sorted = [...events]
      .filter((e) => !Number.isNaN(new Date(e.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const out: Array<{ key: string; label: string; events: SpineEvent[] }> = []
    for (const e of sorted) {
      const d = new Date(e.date)
      const key = monthKey(d)
      const last = out[out.length - 1]
      if (last?.key === key) last.events.push(e)
      else out.push({ key, label: monthYear.format(d), events: [e] })
    }
    return out
  }, [events])

  if (months.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--space-border-hard)] px-5 py-8 text-center text-[15px] text-[var(--space-text-muted)]">
        {emptyMessage}
      </p>
    )
  }

  // The rule sits above the first event that has already happened.
  const firstPastId = months.flatMap((m) => m.events).find((e) => new Date(e.date).getTime() <= now)?.id

  return (
    <div className="relative">
      {/* The axis itself — one hairline the whole column hangs from. */}
      <div
        aria-hidden
        className="absolute bottom-1 top-1 w-px bg-[var(--space-divider)]"
        style={{ left: 'calc(3.5rem + 0.1875rem)' }}
      />

      <ol className="space-y-0">
        {months.map((month) => (
          <Fragment key={month.key}>
            <li className="relative flex items-center gap-3 py-2">
              <span className="w-14 shrink-0" />
              <span className="relative z-10 -ml-[3px] size-1.5 rounded-full bg-[var(--space-border-hard)]" />
              <span className="ml-2 text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--space-text-muted)]">
                {month.label}
              </span>
            </li>

            {month.events.map((event) => (
              <Fragment key={event.id}>
                {event.id === firstPastId && <TodayRule />}
                <SpineRow event={event} future={new Date(event.date).getTime() > now} />
              </Fragment>
            ))}
          </Fragment>
        ))}
      </ol>
    </div>
  )
}

function TodayRule() {
  return (
    <li className="relative flex items-center gap-3 py-1.5" aria-label="Today">
      <span className="w-14 shrink-0 text-right text-[13px] font-medium text-[var(--space-accent)]">
        Today
      </span>
      <span className="relative z-10 -ml-[3px] size-1.5" />
      <span className="ml-2 h-px flex-1 bg-[var(--space-accent)] opacity-40" />
    </li>
  )
}

function SpineRow({ event, future }: { event: SpineEvent; future: boolean }) {
  const color = toneColor(event.tone)
  const date = new Date(event.date)

  const body = (
    <>
      <time
        dateTime={date.toISOString()}
        className="w-14 shrink-0 pt-px text-right text-[13px] tabular-nums text-[var(--space-text-muted)]"
      >
        {dayMonth.format(date)}
      </time>

      {/* Tick: filled once it has happened, hollow while it is still ahead. */}
      <span
        aria-hidden
        className="relative z-10 -ml-[3px] mt-1 size-1.5 shrink-0 rounded-full border"
        style={{
          borderColor: color,
          background: future ? 'var(--space-bg-base)' : color,
        }}
      />

      <span className="ml-2 min-w-0 flex-1">
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
      </span>

      {typeof event.amount === 'number' && (
        <span className="shrink-0 pt-px text-[14px] tabular-nums" style={{ color }}>
          {money.format(event.amount)}
        </span>
      )}
    </>
  )

  return (
    <li className="relative">
      {event.href ? (
        <Link
          href={event.href}
          className="flex items-start gap-3 rounded-lg py-2 pr-2 transition-colors hover:bg-[var(--space-bg-card-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--space-accent)]"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-start gap-3 py-2 pr-2">{body}</div>
      )}
    </li>
  )
}
