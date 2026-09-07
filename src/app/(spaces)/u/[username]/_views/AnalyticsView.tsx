'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Wallet, Clock3, Hammer, Users, Info, ArrowUpRight, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  SectionTitle, Empty, Meter, PeriodControl, useCountUp, useSectionCycle,
} from '@/components/dashboard/ledger'
import {
  buildCollected, buildOutstanding, buildWork, buildClients,
  type CollectedStudy, type OutstandingStudy, type WorkStudy, type ClientsStudy,
  type Slice, type ClientSlice, type TimeBucket, type Delta, type PortfolioRow,
} from '@/lib/dashboard/analytics'
import {
  resolvePeriod, previousPeriod, EMPTY_CUSTOM_RANGE,
  type PeriodId, type CustomRange,
} from '@/lib/dashboard/period'
import { toneColor, type StatusTone } from '@/lib/dashboard/status'
import type { SerializedProject } from '@/lib/serialization'
import { tabVariants } from '@/lib/animations'
import { cn } from '@/lib/utils'

// ─── Analytics ───────────────────────────────────────────────────────────────
// The staff home shows four standing figures and lets you press one to see the
// rows behind it. This page answers the harder question: what does the figure
// *mean*, how is it moving, and what is it concentrated in.
//
// Same two rules as every ledger page (see components/dashboard/ledger.tsx):
// colours are --space-* tokens or status tones, and type is authored in real px
// inside .space-true-scale.
//
// One rule of its own. The four figures do not share a time window — collected
// is a flow through the chosen period, outstanding is a balance as of now, and
// active clients uses its own fixed three-month window. On the home page a
// single period control sits above all four and implies otherwise. Here every
// card states its own window, and the strip under the selected card spells out
// exactly what it counts. A figure nobody can define is a figure nobody trusts.

interface AnalyticsViewProps {
  username: string
  clientAccounts: any[]
  allOrders: any[]
  allProjects: any[]
  allPackages: any[]
  serializedProjects: SerializedProject[]
  activeRetainers: any[]
  retainerPortfolio: PortfolioRow[]
  truncated: { orders: boolean; packages: boolean; accounts: boolean }
}

type MetricId = 'collected' | 'outstanding' | 'work' | 'clients'

const METRIC_IDS: MetricId[] = ['collected', 'outstanding', 'work', 'clients']

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const pct = (n: number) => `${Math.round(n)}%`
const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`
const hours = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}h`

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/**
 * What each figure counts, in words, and the thing about it that surprises
 * people. This is the audit result living in the product rather than in a
 * comment — every caveat here is a real property of the data, not a hedge.
 */
const DEFINITION: Record<MetricId, { counts: string; caveat: string }> = {
  collected: {
    counts:
      'Invoices whose date falls in the chosen period and whose status is now paid.',
    caveat:
      'An order carries no payment date — only its invoice date. So an invoice raised in March and paid this morning counts toward March, not today, and marking an old invoice paid changes a past period’s total.',
  },
  outstanding: {
    counts:
      'Unpaid invoices, plus payments agreed in a proposal that has been sent or accepted and not yet invoiced.',
    caveat:
      'A balance as of right now — the period control above does not change it. A scheduled payment counts at full value however far out its due date is.',
  },
  work: {
    counts:
      'Projects that are pending or in progress, plus retainers whose status is active.',
    caveat:
      'Pending means not started yet, and it still counts. On-hold projects do not. Like outstanding, this is a snapshot of now rather than a total for the period.',
  },
  clients: {
    counts:
      'Accounts with at least one order dated in the last three months, whatever that order’s status.',
    caveat:
      'A fixed three-month window that the period control does not change. Status is never checked, so an account whose only recent invoice was cancelled still counts as active.',
  },
}

// ─── Card ────────────────────────────────────────────────────────────────────

function DeltaChip({ change, format }: { change: Delta; format: (n: number) => string }) {
  if (change.direction === 'flat') {
    return <span className="text-[12px] text-[var(--space-text-muted)]">no change</span>
  }
  // Direction is stated in words as well as colour — the status ramp is not
  // guaranteed to read as up/down to everyone, and `sonar` is a warm palette.
  const tone: StatusTone = change.direction === 'up' ? 'ok' : 'danger'
  const arrow = change.direction === 'up' ? '↑' : '↓'
  return (
    <span className="text-[12px] tabular-nums" style={{ color: toneColor(tone) }}>
      {arrow} {change.pct === null ? format(Math.abs(change.value)) : pct(Math.abs(change.pct))}
    </span>
  )
}

/** A bare sparkline in one tone — the trend, with no axis and no chrome. */
function Spark({ series, tone }: { series: TimeBucket[]; tone: StatusTone }) {
  const path = useMemo(() => {
    if (series.length < 2) return null
    const max = Math.max(...series.map((b) => b.value), 1)
    const w = 100
    const h = 22
    return series
      .map((b, i) => {
        const x = (i / (series.length - 1)) * w
        const y = h - (b.value / max) * h
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [series])

  if (!path) return <span className="block h-[22px]" aria-hidden="true" />

  return (
    <svg
      viewBox="0 0 100 22"
      preserveAspectRatio="none"
      className="block h-[22px] w-full overflow-visible"
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke={toneColor(tone)} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** A proportional bar — for the three cards whose figure is a composition, not a trend. */
function SplitBar({ parts }: { parts: Array<{ value: number; tone: StatusTone; label: string }> }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  if (total <= 0) return <span className="block h-[22px]" aria-hidden="true" />
  return (
    <span
      className="flex h-[22px] w-full items-center"
      role="img"
      aria-label={parts.map((p) => `${p.label}: ${Math.round((p.value / total) * 100)}%`).join(', ')}
    >
      <span className="flex h-[3px] w-full gap-px overflow-hidden">
        {parts.map((p, i) =>
          p.value > 0 ? (
            <span
              key={i}
              className="h-full transition-[width] duration-700 ease-out"
              style={{ width: `${(p.value / total) * 100}%`, background: toneColor(p.tone) }}
            />
          ) : null,
        )}
      </span>
    </span>
  )
}

function ScoreCard({
  label, icon: Icon, value, format, note, window, active, onSelect, children, cardRef, onKeyDown,
}: {
  label: string
  icon: LucideIcon
  value: number
  format: (n: number) => string
  note: string
  /** One short line naming the figure's own time window. */
  window: string
  active: boolean
  onSelect: () => void
  /** The card's trend strip — a spark for a flow, a split bar for a balance. */
  children: React.ReactNode
  cardRef: (el: HTMLButtonElement | null) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}) {
  const shown = useCountUp(value)

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-current={active ? 'true' : undefined}
      tabIndex={active ? 0 : -1}
      aria-label={`${label}. ${format(value)}. ${note}. ${window}.`}
      className={cn(
        'relative flex flex-col gap-2 overflow-hidden rounded-xl border p-4 text-left transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]',
        active
          ? 'border-[var(--space-accent)] bg-[var(--space-bg-card)]'
          : 'border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card)]',
      )}
    >
      {/* The open card is marked by a rule that slides between cards, so the
          selection reads as one object moving rather than four toggling. */}
      {active && (
        <motion.span
          layoutId="analytics-card-rule"
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: 'var(--space-accent)' }}
          transition={{ type: 'spring', stiffness: 520, damping: 42 }}
        />
      )}

      <span className="flex items-center gap-2">
        <Icon className="size-[14px] shrink-0 opacity-60 text-[var(--space-text-tertiary)]" aria-hidden="true" />
        <span className="text-[13px] text-[var(--space-text-tertiary)]">{label}</span>
      </span>

      <span
        className="block font-semibold tabular-nums leading-none tracking-[-0.02em] text-[var(--space-text-primary)]"
        style={{ fontSize: 'clamp(26px, 3vw, 38px)' }}
      >
        {format(Math.round(shown))}
      </span>

      <span className="text-[13px] text-[var(--space-text-tertiary)]">{note}</span>

      <span className="mt-auto block pt-2">{children}</span>

      {/* The window each figure actually covers. Four different answers, said
          four times, because one period control above them says otherwise. */}
      <span className="text-[12px] text-[var(--space-text-muted)]">{window}</span>
    </button>
  )
}

// ─── Panel furniture ─────────────────────────────────────────────────────────

function Definition({ metric }: { metric: MetricId }) {
  const { counts, caveat } = DEFINITION[metric]
  return (
    <div className="mt-6 flex gap-3 rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] px-4 py-3.5">
      <Info className="mt-[3px] size-[14px] shrink-0 text-[var(--space-text-muted)]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[14px] text-[var(--space-text-primary)]">{counts}</p>
        <p className="mt-1 text-[13px] leading-[1.5] text-[var(--space-text-tertiary)]">{caveat}</p>
      </div>
    </div>
  )
}

/** A bar chart with no axis furniture — columns, a scale line, and labels. */
function Bars({ series, tone, format }: { series: TimeBucket[]; tone: StatusTone; format: (n: number) => string }) {
  const max = Math.max(...series.map((b) => b.value), 1)
  // Past a dozen columns, every label would collide — thin them to a readable
  // handful and keep the first and last, which are the ones that orient you.
  const every = Math.ceil(series.length / 12)

  if (series.length === 0) return <Empty>No dated rows in this period.</Empty>

  return (
    <div
      className="flex items-end gap-[3px] pt-6"
      style={{ height: '160px' }}
      role="img"
      aria-label={series.map((b) => `${b.label}: ${format(b.value)}`).join(', ')}
    >
      {series.map((b, i) => {
        const showLabel = i === 0 || i === series.length - 1 || i % every === 0
        return (
          <div key={b.key} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
            {/* The value sits in flow directly above its own bar rather than in a
                floating layer, so it reads as belonging to that column however
                tall the bar is. Its row is always reserved, so revealing it on
                hover shifts nothing. */}
            <span className="pointer-events-none h-[15px] shrink-0 truncate text-center text-[12px] leading-[15px] tabular-nums text-[var(--space-text-primary)] opacity-0 transition-opacity group-hover:opacity-100">
              {format(b.value)}
            </span>
            {/* Columns still divide the full width so labels line up under their
                own slot, but the bar itself is capped and centred — a seven-day
                period should not draw seven slabs. */}
            <span
              className="mx-auto w-full rounded-t-[2px] transition-[height] duration-700 ease-out"
              style={{
                maxWidth: '52px',
                height: `${Math.max(b.value > 0 ? 2 : 1, (b.value / max) * 100)}%`,
                background: b.value > 0 ? toneColor(tone) : 'var(--space-divider)',
                opacity: b.value > 0 ? 0.85 : 1,
              }}
            />
            <span className="h-[14px] truncate text-center text-[11px] text-[var(--space-text-muted)]">
              {showLabel ? b.label : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Status/aging composition — label, figure, count, hairline meter. */
function Breakdown({
  slices, format, total, noun = 'invoice',
}: {
  slices: Slice[]
  format: (n: number) => string
  /** Denominator for the meters. Falls back to the largest slice. */
  total?: number
  /** What a row counts — the same shape serves invoices, projects and owed items. */
  noun?: string
}) {
  if (slices.length === 0) return <Empty>Nothing to break down.</Empty>
  const denom = total ?? Math.max(...slices.map((s) => s.amount), 1)
  return (
    <div>
      {slices.map((s) => (
        <div key={s.key} className="border-b border-[var(--space-divider)] py-4">
          <div className="flex items-baseline gap-4">
            <span className="flex-1 text-[15px] text-[var(--space-text-primary)]">{s.label}</span>
            <span className="text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">
              {format(s.amount)}
            </span>
          </div>
          <div className="mt-1 text-[13px] text-[var(--space-text-tertiary)]">
            {s.count} {plural(s.count, noun)} · {pct(s.pct)} of the total
          </div>
          <Meter pct={(s.amount / denom) * 100} tone={s.tone} />
        </div>
      ))}
    </div>
  )
}

/** Ranked clients with a share bar — who a figure is concentrated in. */
function ClientRanking({
  rows, username, format, emptyMessage, limit = 8, noun = 'invoice',
}: {
  rows: ClientSlice[]
  username: string
  format: (n: number) => string
  emptyMessage: string
  limit?: number
  noun?: string
}) {
  if (rows.length === 0) return <Empty>{emptyMessage}</Empty>
  const top = rows.slice(0, limit)
  const max = Math.max(...top.map((r) => r.amount), 1)

  return (
    <div>
      {top.map((r) => (
        <Link
          key={r.id}
          href={`/u/${username}/clients/${r.id}`}
          className="block border-b border-[var(--space-divider)] py-4 transition-colors hover:bg-[var(--space-bg-card-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--space-accent)]"
        >
          <div className="flex items-baseline gap-4">
            <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--space-text-primary)]">{r.name}</span>
            <span className="text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">
              {format(r.amount)}
            </span>
          </div>
          <div className="mt-1 text-[13px] text-[var(--space-text-tertiary)]">
            {r.count} {plural(r.count, noun)} · {pct(r.pct)} of the total
          </div>
          <Meter pct={(r.amount / max) * 100} tone="active" />
        </Link>
      ))}
      {rows.length > limit && (
        <p className="pt-4 text-[13px] text-[var(--space-text-muted)]">
          +{rows.length - limit} more not shown
        </p>
      )}
    </div>
  )
}

/** A row of small labelled figures — the secondary numbers under a headline. */
function Stats({ items }: { items: Array<{ label: string; value: string; tone?: StatusTone }> }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-[var(--space-divider)] pb-6 pt-5 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label}>
          <dd
            className="text-[20px] font-medium tabular-nums leading-none text-[var(--space-text-primary)]"
            style={i.tone ? { color: toneColor(i.tone) } : undefined}
          >
            {i.value}
          </dd>
          <dt className="mt-2 text-[13px] text-[var(--space-text-tertiary)]">{i.label}</dt>
        </div>
      ))}
    </dl>
  )
}

function Note({ tone = 'warn', children }: { tone?: StatusTone; children: React.ReactNode }) {
  return (
    <p
      className="mt-5 flex gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-[1.5]"
      style={{
        color: 'var(--space-text-secondary)',
        borderColor: `var(--space-status-${tone}-line)`,
        background: `var(--space-status-${tone}-soft)`,
      }}
    >
      <TriangleAlert
        className="mt-[2px] size-[14px] shrink-0"
        style={{ color: toneColor(tone) }}
        aria-hidden="true"
      />
      <span className="min-w-0">{children}</span>
    </p>
  )
}

// ─── The four studies ────────────────────────────────────────────────────────

function CollectedPanel({ study, username, periodName }: { study: CollectedStudy; username: string; periodName: string }) {
  const grainWord = study.grain === 'day' ? 'day' : study.grain === 'week' ? 'week' : 'month'
  return (
    <div className="space-y-12">
      <div>
        <SectionTitle title={`Collected by ${grainWord}`} aside={periodName} />
        <Bars series={study.series} tone="ok" format={usd.format} />
        <Stats
          items={[
            { label: 'Paid invoices', value: String(study.count) },
            { label: 'Average invoice', value: usd.format(study.average) },
            {
              label: 'Largest',
              value: study.largest ? usd.format(study.largest.amount) : '—',
            },
            {
              label: 'Previous span',
              value: usd.format(study.previousTotal),
            },
          ]}
        />
        {study.largest && (
          <p className="pt-4 text-[13px] text-[var(--space-text-tertiary)]">
            The largest paid invoice in this period was {usd.format(study.largest.amount)} from {study.largest.name}.
          </p>
        )}
      </div>

      <div>
        <SectionTitle
          title="Every invoice dated in this period"
          aside={usd.format(study.invoicedTotal)}
        />
        <Breakdown slices={study.byStatus} format={usd.format} total={study.invoicedTotal} />
        {study.unclassified.count > 0 && (
          <Note>
            {study.unclassified.count} {plural(study.unclassified.count, 'invoice')} worth{' '}
            {usd.format(study.unclassified.amount)}{' '}
            {study.unclassified.count === 1 ? 'carries' : 'carry'} a status outside paid, unpaid
            and cancelled — refunded, most likely. The home page’s pipeline bar drops these
            entirely, so its three slices do not add up to what was invoiced.
          </Note>
        )}
      </div>

      <div>
        <SectionTitle title="Who paid" aside={`${study.byClient.length} ${plural(study.byClient.length, 'client')}`} />
        <ClientRanking
          rows={study.byClient}
          username={username}
          format={usd.format}
          emptyMessage="No invoices were paid in this period."
        />
      </div>
    </div>
  )
}

function OutstandingPanel({ study, username }: { study: OutstandingStudy; username: string }) {
  return (
    <div className="space-y-12">
      <div>
        <SectionTitle title="How old the money is" aside={usd.format(study.total)} />
        <Breakdown slices={study.aging} format={usd.format} total={study.total} noun="item" />
        <Stats
          items={[
            { label: 'Invoiced', value: usd.format(study.invoiced.amount) },
            { label: 'Scheduled', value: usd.format(study.scheduled.amount) },
            {
              label: 'Overdue',
              value: usd.format(study.overdue.amount),
              tone: study.overdue.amount > 0 ? 'danger' : undefined,
            },
            {
              label: 'Average age',
              value: study.averageOverdueDays > 0 ? `${Math.round(study.averageOverdueDays)}d` : '—',
            },
          ]}
        />
        <p className="pt-4 text-[13px] text-[var(--space-text-tertiary)]">
          {study.invoiced.count} unpaid {plural(study.invoiced.count, 'invoice')} and{' '}
          {study.scheduled.count} scheduled {plural(study.scheduled.count, 'payment')} that have not
          been invoiced yet.
        </p>
      </div>

      <div>
        <SectionTitle title="Who owes it" aside={`${study.byClient.length} ${plural(study.byClient.length, 'client')}`} />
        <ClientRanking
          rows={study.byClient}
          username={username}
          format={usd.format}
          emptyMessage="Nothing is owed."
          noun="item"
        />
      </div>

      <div>
        <SectionTitle title="The list" aside="most overdue first" />
        {study.items.length === 0 ? (
          <Empty>Every invoice raised has been paid.</Empty>
        ) : (
          study.items.slice(0, 15).map((item) => {
            const overdue = item.overdueBy !== null && item.overdueBy > 0
            const tone: StatusTone = overdue ? (item.overdueBy! > 60 ? 'danger' : 'warn') : 'idle'
            const when =
              item.overdueBy === null
                ? 'no due date'
                : item.overdueBy > 0
                  ? `${item.overdueBy} ${plural(item.overdueBy, 'day')} overdue`
                  : `due ${shortDate.format(new Date(item.dueDate!))}`
            const href = item.accountId
              ? `/u/${username}/clients/${item.accountId}`
              : `/u/${username}/clients`
            return (
              <Link
                key={item.key}
                href={href}
                className="block border-b border-[var(--space-divider)] py-3.5 transition-colors hover:bg-[var(--space-bg-card-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--space-accent)]"
              >
                <div className="flex items-baseline gap-4">
                  <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--space-text-primary)]">
                    {item.primary}
                  </span>
                  <span className="text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">
                    {usd.format(item.amount)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-baseline gap-2 text-[13px]">
                  <span className="min-w-0 flex-1 truncate text-[var(--space-text-tertiary)]">
                    {item.secondary}
                    <span className="text-[var(--space-text-muted)]">
                      {' '}· {item.kind === 'invoice' ? 'invoiced' : 'scheduled'}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums" style={{ color: toneColor(tone) }}>
                    {when}
                  </span>
                </div>
              </Link>
            )
          })
        )}
        {study.items.length > 15 && (
          <p className="pt-4 text-[13px] text-[var(--space-text-muted)]">
            +{study.items.length - 15} more not shown
          </p>
        )}
      </div>
    </div>
  )
}

function WorkPanel({ study }: { study: WorkStudy }) {
  const utilisation = study.hoursCap > 0 ? (study.hoursUsed / study.hoursCap) * 100 : 0
  return (
    <div className="space-y-12">
      <div>
        <SectionTitle title="Projects by status" aside={`${study.byStatus.reduce((s, r) => s + r.count, 0)} on the books`} />
        <Breakdown
          slices={study.byStatus}
          format={String}
          total={study.byStatus.reduce((s, r) => s + r.count, 0)}
          noun="project"
        />
        <Stats
          items={[
            { label: 'Counted as active', value: String(study.projectCount) },
            { label: 'Sprints in progress', value: String(study.sprints.inProgress) },
            {
              label: 'Sprints delayed',
              value: String(study.sprints.delayed),
              tone: study.sprints.delayed > 0 ? 'warn' : undefined,
            },
            { label: 'Sprints finished', value: String(study.sprints.finished) },
          ]}
        />
        {study.untypedProjects > 0 && (
          <Note>
            {study.untypedProjects} {plural(study.untypedProjects, 'project')}{' '}
            {study.untypedProjects === 1 ? 'has' : 'have'} no status set, so{' '}
            {study.untypedProjects === 1 ? 'it sits' : 'they sit'} under “Unknown” above and{' '}
            {study.untypedProjects === 1 ? 'is' : 'are'} not counted as active work here. The home
            page counts {study.untypedProjects === 1 ? 'it' : 'them'} as active anyway — a missing
            status defaults to “active” on the way into that view.
          </Note>
        )}
      </div>

      <div>
        <SectionTitle
          title="Retainer load"
          aside={`${usd.format(study.monthlyRecurring)} a month`}
        />
        {study.retainers.length === 0 ? (
          <Empty>No active retainers.</Empty>
        ) : (
          <>
            <Stats
              items={[
                { label: 'Active retainers', value: String(study.retainerCount) },
                { label: 'Hours used this cycle', value: hours(study.hoursUsed) },
                { label: 'Hours capped', value: hours(study.hoursCap) },
                {
                  label: 'Overage billable',
                  value: usd.format(study.overageAmount),
                  tone: study.overageAmount > 0 ? 'warn' : undefined,
                },
              ]}
            />
            <p className="pb-2 pt-4 text-[13px] text-[var(--space-text-tertiary)]">
              {pct(utilisation)} of the committed hours across every retainer have been logged in
              the current cycle. Each retainer runs on its own cycle anchored to the day it was
              activated, not the calendar month.
            </p>
            {study.retainers.map((r) => (
              <div key={r.id} className="border-b border-[var(--space-divider)] py-4">
                <div className="flex items-baseline gap-4">
                  <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--space-text-primary)]">
                    {r.name}
                    <span className="ml-2 text-[13px] capitalize text-[var(--space-text-muted)]">{r.tier}</span>
                  </span>
                  <span className="shrink-0 text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">
                    {hours(r.hoursUsed)}
                    <span className="text-[var(--space-text-muted)]"> / {hours(r.hoursCap)}</span>
                  </span>
                </div>
                <div className="mt-1 text-[13px] text-[var(--space-text-tertiary)]">
                  {r.cycleLabel} · {r.daysLeft} {plural(r.daysLeft, 'day')} left
                  {r.overageHours > 0 && (
                    <span style={{ color: toneColor('danger') }}>
                      {' '}· {hours(r.overageHours)} over, {usd.format(r.overageAmount)} billable
                    </span>
                  )}
                </div>
                <Meter pct={r.utilization} tone={r.tone} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function ClientsPanel({ study, username }: { study: ClientsStudy; username: string }) {
  const ranked: ClientSlice[] = study.active.map((c) => ({
    id: c.id,
    name: c.name,
    amount: c.paid,
    count: c.orders,
    pct: study.revenue > 0 ? (c.paid / study.revenue) * 100 : 0,
  }))

  return (
    <div className="space-y-12">
      <div>
        <SectionTitle title="Concentration" aside={`${usd.format(study.revenue)} paid in the window`} />
        <Stats
          items={[
            {
              label: 'Largest client’s share',
              value: study.revenue > 0 ? pct(study.concentration) : '—',
              tone: study.concentration > 50 ? 'warn' : undefined,
            },
            {
              label: 'Top three combined',
              value: study.revenue > 0 ? pct(study.concentrationTop3) : '—',
              tone: study.concentrationTop3 > 80 ? 'warn' : undefined,
            },
            { label: 'Won in the window', value: String(study.newCount) },
            { label: 'Accounts on the books', value: String(study.totalCount) },
          ]}
        />
        {study.concentration > 50 && study.revenue > 0 && (
          <Note>
            One client accounts for {pct(study.concentration)} of everything paid in the last{' '}
            {study.windowMonths} months. Losing them would take that much of the studio’s recent
            revenue with it.
          </Note>
        )}
        {study.cancelledOnlyCount > 0 && (
          <Note>
            {study.cancelledOnlyCount} of these accounts{' '}
            {study.cancelledOnlyCount === 1 ? 'has' : 'have'} nothing but a cancelled invoice in the
            window. The figure counts any order regardless of status, so{' '}
            {study.cancelledOnlyCount === 1 ? 'it reads' : 'they read'} as active customers
            without having bought anything.
          </Note>
        )}
      </div>

      <div>
        <SectionTitle title="Active clients" aside="by amount paid" />
        <ClientRanking
          rows={ranked}
          username={username}
          format={usd.format}
          emptyMessage="No client has ordered in the window."
          limit={12}
        />
      </div>

      <div>
        <SectionTitle title="Gone quiet" aside={`${study.quiet.length} ${plural(study.quiet.length, 'account')}`} />
        {study.quiet.length === 0 ? (
          <Empty>Every client who has ever ordered has ordered recently.</Empty>
        ) : (
          <>
            <p className="pb-2 pt-4 text-[13px] text-[var(--space-text-tertiary)]">
              Ordered before, but nothing in the last {study.windowMonths} months. Longest-standing
              relationships first.
            </p>
            {study.quiet.slice(0, 10).map((c) => (
              <Link
                key={c.id}
                href={`/u/${username}/clients/${c.id}`}
                className="block border-b border-[var(--space-divider)] py-3.5 transition-colors hover:bg-[var(--space-bg-card-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--space-accent)]"
              >
                <div className="flex items-baseline gap-4">
                  <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--space-text-primary)]">
                    {c.name}
                  </span>
                  <span className="shrink-0 text-[13px] tabular-nums text-[var(--space-text-tertiary)]">
                    {c.daysSince === null ? 'never' : `${c.daysSince} ${plural(c.daysSince, 'day')} ago`}
                  </span>
                </div>
              </Link>
            ))}
            {study.quiet.length > 10 && (
              <p className="pt-4 text-[13px] text-[var(--space-text-muted)]">
                +{study.quiet.length - 10} more not shown
              </p>
            )}
          </>
        )}
        {study.neverOrdered > 0 && (
          <p className="pt-5 text-[13px] text-[var(--space-text-muted)]">
            {study.neverOrdered} {plural(study.neverOrdered, 'account')} on the books{' '}
            {study.neverOrdered === 1 ? 'has' : 'have'} never had an order at all, and{' '}
            {study.neverOrdered === 1 ? 'is' : 'are'} counted in neither list.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function AnalyticsView({
  username, clientAccounts, allOrders, allProjects, allPackages,
  serializedProjects, activeRetainers, retainerPortfolio, truncated,
}: AnalyticsViewProps) {
  const [periodId, setPeriodId] = useState<PeriodId>('month')
  const [custom, setCustom] = useState<CustomRange>(EMPTY_CUSTOM_RANGE)
  const [metric, setMetric] = useState<MetricId>('collected')

  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const cardGroup = useRef<HTMLElement>(null)
  useSectionCycle(METRIC_IDS, metric, setMetric, cardGroup)

  const period = useMemo(() => resolvePeriod(periodId, Date.now(), custom), [periodId, custom])
  const previous = useMemo(() => previousPeriod(period), [period])

  const collected = useMemo(
    () => buildCollected(allOrders, period, previous),
    [allOrders, period, previous],
  )
  const outstanding = useMemo(
    () => buildOutstanding(allOrders, allPackages),
    [allOrders, allPackages],
  )
  const work = useMemo(
    () => buildWork(allProjects, serializedProjects, activeRetainers, retainerPortfolio),
    [allProjects, serializedProjects, activeRetainers, retainerPortfolio],
  )
  const clients = useMemo(() => buildClients(clientAccounts, allOrders), [clientAccounts, allOrders])

  const onCardKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = METRIC_IDS.length - 1
    let next = i
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    setMetric(METRIC_IDS[next])
    cardRefs.current[next]?.focus()
  }

  const anyTruncated = truncated.orders || truncated.packages || truncated.accounts

  return (
    <div
      className="space-true-scale mx-auto w-full px-6 pb-24 pt-10 sm:px-10"
      style={{ maxWidth: '1180px' }}
    >
      <header className="flex flex-wrap items-end justify-between gap-6 pb-10">
        <div className="min-w-0">
          <h1
            className="font-semibold leading-none tracking-[-0.02em] text-[var(--space-text-primary)]"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
          >
            Analytics
          </h1>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.5] text-[var(--space-text-tertiary)]">
            The four standing figures from your home page, taken apart — what each one counts, how
            it is moving, and what it is concentrated in.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PeriodControl
            value={periodId}
            onChange={setPeriodId}
            custom={custom}
            onCustomChange={setCustom}
            rangeLabel={period.rangeLabel}
          />
          <p className="text-[13px] tabular-nums text-[var(--space-text-tertiary)]" aria-live="polite">
            {period.rangeLabel}
          </p>
        </div>
      </header>

      {/* ── The four cards ──────────────────────────────────────────────── */}
      <section
        ref={cardGroup as React.RefObject<HTMLElement>}
        role="group"
        aria-label="Choose a figure"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <ScoreCard
          label={`Collected ${period.phrase}`}
          icon={Wallet}
          value={collected.total}
          format={usd.format}
          note={`${collected.count} paid ${plural(collected.count, 'invoice')}`}
          window={`invoices dated ${period.phrase}`}
          active={metric === 'collected'}
          onSelect={() => setMetric('collected')}
          cardRef={(el) => { cardRefs.current[0] = el }}
          onKeyDown={(e) => onCardKeyDown(e, 0)}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1">
              <Spark series={collected.series} tone="ok" />
            </span>
            {previous && <DeltaChip change={collected.change} format={usd.format} />}
          </span>
        </ScoreCard>

        <ScoreCard
          label="Outstanding"
          icon={Clock3}
          value={outstanding.total}
          format={usd.format}
          note={
            outstanding.total === 0
              ? 'nothing owed'
              : `${outstanding.invoiced.count} invoiced, ${outstanding.scheduled.count} scheduled`
          }
          window="as of today"
          active={metric === 'outstanding'}
          onSelect={() => setMetric('outstanding')}
          cardRef={(el) => { cardRefs.current[1] = el }}
          onKeyDown={(e) => onCardKeyDown(e, 1)}
        >
          <SplitBar
            parts={outstanding.aging.map((a) => ({ value: a.amount, tone: a.tone, label: a.label }))}
          />
        </ScoreCard>

        <ScoreCard
          label="Active work"
          icon={Hammer}
          value={work.total}
          format={String}
          note={`${work.projectCount} ${plural(work.projectCount, 'project')}, ${work.retainerCount} ${plural(work.retainerCount, 'retainer')}`}
          window="open right now"
          active={metric === 'work'}
          onSelect={() => setMetric('work')}
          cardRef={(el) => { cardRefs.current[2] = el }}
          onKeyDown={(e) => onCardKeyDown(e, 2)}
        >
          <SplitBar
            parts={[
              { value: work.projectCount, tone: 'active', label: 'Projects' },
              { value: work.retainerCount, tone: 'ok', label: 'Retainers' },
            ]}
          />
        </ScoreCard>

        <ScoreCard
          label="Active clients"
          icon={Users}
          value={clients.activeCount}
          format={String}
          note={`of ${clients.totalCount} on the books`}
          window={`ordered in the last ${clients.windowMonths} months`}
          active={metric === 'clients'}
          onSelect={() => setMetric('clients')}
          cardRef={(el) => { cardRefs.current[3] = el }}
          onKeyDown={(e) => onCardKeyDown(e, 3)}
        >
          <SplitBar
            parts={[
              { value: clients.activeCount, tone: 'ok', label: 'Active' },
              { value: clients.quiet.length, tone: 'warn', label: 'Gone quiet' },
              { value: clients.neverOrdered, tone: 'idle', label: 'Never ordered' },
            ]}
          />
        </ScoreCard>
      </section>

      {/* What the open figure actually counts. */}
      <Definition metric={metric} />

      {anyTruncated && (
        <Note tone="hold">
          These figures are floors, not totals — a query hit its row ceiling
          {truncated.orders && ' (orders)'}
          {truncated.packages && ' (proposals)'}
          {truncated.accounts && ' (client accounts)'}
          , so anything past it is not counted here.
        </Note>
      )}

      {/* ── The open study ──────────────────────────────────────────────── */}
      <div className="pt-14">
        <AnimatePresence mode="wait">
          {metric === 'collected' && (
            <motion.section key="collected" variants={tabVariants} initial="initial" animate="animate" exit="exit">
              <CollectedPanel study={collected} username={username} periodName={period.name} />
            </motion.section>
          )}
          {metric === 'outstanding' && (
            <motion.section key="outstanding" variants={tabVariants} initial="initial" animate="animate" exit="exit">
              <OutstandingPanel study={outstanding} username={username} />
            </motion.section>
          )}
          {metric === 'work' && (
            <motion.section key="work" variants={tabVariants} initial="initial" animate="animate" exit="exit">
              <WorkPanel study={work} />
            </motion.section>
          )}
          {metric === 'clients' && (
            <motion.section key="clients" variants={tabVariants} initial="initial" animate="animate" exit="exit">
              <ClientsPanel study={clients} username={username} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <p className="pt-16 text-[13px] text-[var(--space-text-muted)]">
        <Link
          href={`/u/${username}`}
          className="inline-flex items-center gap-1 hover:text-[var(--space-text-primary)]"
        >
          Back to the home ledger
          <ArrowUpRight className="size-[13px]" aria-hidden="true" />
        </Link>
      </p>
    </div>
  )
}
