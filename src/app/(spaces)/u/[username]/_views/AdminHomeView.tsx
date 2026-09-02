'use client'

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight, CalendarDays, Wallet, Zap, ReceiptText, BarChart3, CalendarRange,
  Activity as ActivityIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import DynamicGreeting from '@/components/layout/dynamic-greeting'
import { Spine } from '@/components/dashboard/Spine'
import { RangeCalendar } from '@/components/dashboard/RangeCalendar'
import { ActivityFeed, type ActivityEvent } from '@/components/dashboard/ActivityFeed'
import { clientSpineEvents } from '@/lib/dashboard/spine-events'
import { sprintStatus, orderStatus, projectStatus, toneColor, type StatusTone } from '@/lib/dashboard/status'
import { orderDate } from '@/lib/dashboard/utils'
import {
  resolvePeriod, inPeriod, onTimeline, EMPTY_CUSTOM_RANGE,
  PERIOD_IDS, PERIOD_LABEL, type PeriodId, type CustomRange,
} from '@/lib/dashboard/period'
import type { SerializedProject } from '@/lib/serialization'
import { tabVariants } from '@/lib/animations'
import { cn } from '@/lib/utils'

// ─── The ledger ──────────────────────────────────────────────────────────────
// The staff home reads like the studio's books opened to today. Two bands:
//
//   • The standing — four figures that are always on screen, whichever section
//     is open. Money in, money owed, work open, clients live.
//   • The workspace — a sidebar of sections, one at a time, so the page stays
//     one screen deep instead of a scroll.
//
// Two rules this view holds to, because the old five-tab version broke both:
//   1. Every colour is a --space-* token or a status-ramp tone. No raw hex, no
//      Tailwind palette classes — `sonar` (warm paper) is the default theme.
//   2. Type is authored in real px inside .space-true-scale, not in rem against
//      the portal's 1.5 root scale.

interface AdminHomeViewProps {
  user: { firstName?: string | null; role: string }
  username: string
  clientAccounts: any[]
  allOrders: any[]
  allProjects: any[]
  allTasks: any[]
  allPackages: any[]
  completedTasksCount: number
  completedSprintsCount: number
  timeframe: '7d' | '30d' | '90d'
  serializedProjects: SerializedProject[]
  activeRetainers: any[]
  activity: ActivityEvent[]
}

// The sidebar owns five of these; the other four are opened by pressing the
// figure they belong to, so each headline number can show its own workings.
type SectionId =
  | 'activity' | 'needs' | 'moving' | 'invoices' | 'analytics' | 'timeline'
  | 'collected' | 'outstanding' | 'projects' | 'clients'

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
  { id: 'needs', label: 'Needs you', icon: Wallet },
  { id: 'moving', label: 'Moving', icon: Zap },
  { id: 'invoices', label: 'Invoices', icon: ReceiptText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'timeline', label: 'Timeline', icon: CalendarRange },
]

const ACTIVE_PROJECT_STATUSES = new Set(['in-progress', 'pending', 'active'])

/** How far back an order still counts a client as active. */
const ACTIVE_CLIENT_MONTHS = 3

const RETAINER_TIER: Record<string, string> = {
  basic: 'Basic',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
})

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`

const DAY = 86_400_000
const daysUntil = (iso: string | null | undefined) =>
  iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DAY) : null

/** How a due date reads, and how urgently it should be coloured. */
function due(iso: string | null | undefined, soonWithin: number): { label: string; tone: StatusTone } {
  const d = daysUntil(iso)
  if (d === null) return { label: 'no date set', tone: 'idle' }
  if (d < 0) return { label: `${Math.abs(d)} ${plural(Math.abs(d), 'day')} overdue`, tone: 'danger' }
  if (d === 0) return { label: 'due today', tone: 'warn' }
  if (d <= soonWithin) return { label: `due in ${d} ${plural(d, 'day')}`, tone: 'warn' }
  return { label: `due ${shortDate.format(new Date(iso!))}`, tone: 'idle' }
}

const accountName = (account: any): string =>
  account?.company || account?.name || account?.firstName || 'Client'

const idOf = (ref: any): string | null =>
  ref ? (typeof ref === 'object' ? ref.id ?? null : String(ref)) : null

/** Where staff act on an order — the Payload admin edit view. */
const adminOrderHref = (id: string) => `/admin/collections/orders/${id}`

// ─── Count-up ─────────────────────────────────────────────────────────────────
// The page's one orchestrated moment: the standing tallies itself on arrival,
// and re-tallies whenever the period changes. State starts at the final value
// so server-rendered HTML is already correct; a layout effect resets to zero
// before the browser paints, so nobody sees the final figure flash first.

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(target)
  const reduce = useReducedMotion()

  useIsoLayoutEffect(() => {
    if (reduce || target === 0) {
      setValue(target)
      return
    }
    setValue(0)
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // ease-out cubic — fast, then settles
      setValue(target * eased)
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, reduce])

  return value
}

// ─── Standing figure ──────────────────────────────────────────────────────────

interface FigureSpec {
  /** Doubles as the React key and the view this figure opens. */
  key: SectionId
  value: number
  format: (n: number) => string
  label: string
  note?: string | null
}

/**
 * Dividers sit between figures, so which edges get a rule depends on where the
 * grid wraps: two per row on phones, four across from `md` up.
 */
function figureEdges(i: number): string {
  return cn(
    'border-[var(--space-divider)]',
    i % 2 === 0 ? 'border-l-0 pl-0' : 'border-l pl-5',
    i >= 2 ? 'border-t' : '',
    i === 0 ? 'md:border-l-0 md:pl-0' : 'md:border-l md:pl-5',
    'md:border-t-0',
  )
}

function Figure({
  value, format, label, note, active, onSelect, className,
}: Omit<FigureSpec, 'key'> & {
  active: boolean
  onSelect: () => void
  className?: string
}) {
  const shown = useCountUp(value)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'py-4 pr-5 text-left transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]',
        active ? 'bg-[var(--space-bg-card)]' : 'hover:bg-[var(--space-bg-card)]',
        className,
      )}
    >
      <span
        className="block font-semibold tabular-nums leading-none tracking-[-0.02em] text-[var(--space-text-primary)]"
        style={{ fontSize: 'clamp(30px, 3.6vw, 46px)' }}
      >
        {format(Math.round(shown))}
      </span>
      <span className={cn(
        'mt-3 block text-[13px]',
        active ? 'text-[var(--space-text-primary)]' : 'text-[var(--space-text-tertiary)]',
      )}>
        {label}
      </span>
      {note && <span className="mt-1 block text-[12px] text-[var(--space-text-tertiary)]">{note}</span>}
    </button>
  )
}

// ─── Shared section furniture ─────────────────────────────────────────────────

function SectionTitle({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-[var(--space-border-hard)] pb-3">
      <h2 className="text-[15px] font-semibold text-[var(--space-text-primary)]">{title}</h2>
      <div className="ml-auto text-[13px] text-[var(--space-text-tertiary)]">{aside}</div>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-[14px] text-[var(--space-text-tertiary)]">{children}</p>
}

/** Shared left rule — the row's status lives here, so no dots or pills are needed. */
function ToneRule({ tone }: { tone: StatusTone }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-0 top-0 h-full w-[2px] opacity-40 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      style={{ background: toneColor(tone) }}
    />
  )
}

/** A labelled hairline bar — the one chart primitive this page uses. */
function Meter({ pct, tone }: { pct: number; tone: StatusTone }) {
  return (
    <span aria-hidden="true" className="mt-3 block h-[2px] w-full bg-[var(--space-divider)]">
      <span
        className="block h-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: toneColor(tone) }}
      />
    </span>
  )
}

// ─── A row in the "Needs you" / "Moving" sections ─────────────────────────────

function Row({
  href, tone, primary, secondary, right, rightTone, note, progress,
}: {
  href: string
  tone: StatusTone
  primary: string
  secondary: string
  right: string
  rightTone?: StatusTone
  note: string
  /** 0–100. Draws a hairline fill across the full row width when present. */
  progress?: number
}) {
  return (
    <Link
      href={href}
      className="group relative block border-b border-[var(--space-divider)] py-4 pl-5 pr-1 transition-colors duration-150 hover:bg-[var(--space-bg-card)] focus-visible:bg-[var(--space-bg-card)] focus-visible:outline-none"
    >
      <ToneRule tone={tone} />
      <div className="flex items-baseline gap-4">
        <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--space-text-primary)]">{primary}</span>
        <span className="shrink-0 text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">{right}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-4">
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--space-text-tertiary)]">{secondary}</span>
        <span
          className="shrink-0 text-[13px] tabular-nums"
          style={{ color: rightTone ? toneColor(rightTone) : 'var(--space-text-tertiary)' }}
        >
          {note}
        </span>
      </div>
      {progress !== undefined && <Meter pct={progress} tone={tone} />}
    </Link>
  )
}

// ─── An invoice line ──────────────────────────────────────────────────────────
// Two destinations, both named: the number opens the order in the admin, the
// trailing link opens the same invoice on Stripe. The row itself is not a link,
// so the two anchors stay valid and unambiguous.

function InvoiceLine({ order }: { order: any }) {
  const meta = orderStatus(order.status)
  const account = typeof order.clientAccount === 'object' ? order.clientAccount : null

  return (
    <div className="group relative flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-[var(--space-divider)] py-4 pl-5 pr-1 transition-colors duration-150 hover:bg-[var(--space-bg-card)] focus-within:bg-[var(--space-bg-card)]">
      <ToneRule tone={meta.tone} />

      <Link
        href={adminOrderHref(order.id)}
        className="w-[120px] shrink-0 truncate text-[15px] text-[var(--space-text-primary)] underline decoration-transparent underline-offset-4 transition-colors hover:decoration-[var(--space-accent)] focus-visible:decoration-[var(--space-accent)] focus-visible:outline-none"
      >
        {order.orderNumber || 'Invoice'}
      </Link>

      <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--space-text-tertiary)]">
        {accountName(account)}
      </span>

      {/* Date and status are the first things to go on a phone: the status is
          already carried by the left rule, and the list is newest-first. */}
      <span className="hidden w-[70px] shrink-0 text-[13px] tabular-nums text-[var(--space-text-tertiary)] sm:block">
        {orderDate(order) ? shortDate.format(new Date(orderDate(order))) : ''}
      </span>

      <span className="hidden w-[70px] shrink-0 text-[13px] sm:block" style={{ color: toneColor(meta.tone) }}>
        {meta.label}
      </span>

      <span className="w-[90px] shrink-0 text-right text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">
        {usd.format(order.amount || 0)}
      </span>

      {/* Left empty when the order never reached Stripe — an absent link says
          that more quietly than a placeholder would. */}
      <span className="w-[76px] shrink-0 whitespace-nowrap text-right text-[13px]">
        {order.stripeInvoiceUrl && (
          <a
            href={order.stripeInvoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--space-text-tertiary)] transition-colors hover:text-[var(--space-accent)] focus-visible:text-[var(--space-accent)] focus-visible:outline-none"
          >
            Stripe
            <ArrowUpRight className="size-[13px]" aria-hidden="true" />
          </a>
        )}
      </span>
    </div>
  )
}

// ─── Period control ───────────────────────────────────────────────────────────

function PeriodControl({
  value, onChange, custom, onCustomChange, rangeLabel,
}: {
  value: PeriodId
  onChange: (id: PeriodId) => void
  custom: CustomRange
  onCustomChange: (r: CustomRange) => void
  /** The concrete days the chosen period covers, spelled out. */
  rangeLabel: string
}) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const reduce = useReducedMotion()

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    leaveTimer.current = null
  }
  const enter = () => { clearLeave(); setHovered(true) }
  const leave = () => {
    clearLeave()
    leaveTimer.current = setTimeout(() => setHovered(false), 140)
  }
  useEffect(() => clearLeave, [])

  // At rest the control is a single icon with the dates read out beneath it —
  // the ledger is the point of the page, not its filter. Hovering shows the
  // choices; clicking pins them open for anyone not using a mouse.
  const expanded = hovered || pinned || calendarOpen

  const choose = (id: PeriodId) => {
    onChange(id)
    // Custom cannot answer for itself, so picking it opens the calendar;
    // picking it again toggles that calendar back shut.
    setCalendarOpen(id === 'custom' ? !(value === 'custom' && calendarOpen) : false)
    // Unpin once a choice is made: still open while the pointer rests here,
    // and tucked away the moment it leaves.
    if (id !== 'custom') setPinned(false)
  }

  return (
    <div
      className="relative inline-flex flex-col items-end gap-3"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPinned(false)
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={reduce ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 10 }}
            transition={{ duration: 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
            role="group"
            aria-label="Reporting period"
            /* One segmented control rather than five loose words: the hairline
               box says these are the choices, and the solid segment says which
               is on. The fill is --space-text-primary, so it is ink-black on
               the light themes and flips to paper-white on charcoal — a literal
               black chip would vanish into the dark theme's background. */
            className="flex items-stretch overflow-hidden rounded-lg border border-[var(--space-border-hard)]"
          >
            {PERIOD_IDS.map((id, i) => {
              const selected = value === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => choose(id)}
                  aria-pressed={selected}
                  aria-expanded={id === 'custom' ? calendarOpen : undefined}
                  className={cn(
                    // Six segments do not fit a phone at desktop sizing; the tap height is
                    // unchanged, only the type and side padding give way.
                    'flex items-center gap-1.5 whitespace-nowrap px-2 py-[9px] text-[12px] transition-colors duration-150 sm:px-4 sm:text-[13px]',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]',
                    i > 0 && 'border-l border-[var(--space-border-hard)]',
                    !selected && 'text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)]',
                  )}
                  style={selected ? { background: 'var(--space-text-primary)', color: 'var(--space-bg-base)' } : undefined}
                >
                  {PERIOD_LABEL[id]}
                  {id === 'custom' && (
                    <CalendarDays className="size-[14px] shrink-0 opacity-70" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            type="button"
            initial={reduce ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 10 }}
            transition={{ duration: 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => setPinned(true)}
            onFocus={() => setPinned(true)}
            aria-expanded={false}
            aria-label={`Reporting period: ${PERIOD_LABEL[value]}, ${rangeLabel}. Open to change it.`}
            className="rounded-lg border border-[var(--space-border-hard)] p-[9px] text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]"
          >
            <CalendarDays className="size-[15px]" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      {calendarOpen && (
        <RangeCalendar
          value={custom}
          onChange={onCustomChange}
          onClose={() => { setCalendarOpen(false); setPinned(false) }}
        />
      )}
    </div>
  )
}

// ─── Section sidebar ──────────────────────────────────────────────────────────
// A panel of section entries — a scrolling row of pills on phones, a column on
// the right from `lg` up. The active entry is a solid chip that slides between
// rows, which is the only thing on the page that moves in response to a click.

function SectionNav({
  value, onChange, counts,
}: {
  value: SectionId
  onChange: (id: SectionId) => void
  counts: Partial<Record<SectionId, number>>
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const navRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  // On phones the panel is a scrolling row, so the chosen section can sit past
  // the right edge with nothing to say it is there. Nudge it into view — by
  // scrollLeft rather than scrollIntoView, which would also move the page.
  useEffect(() => {
    const nav = navRef.current
    const button = refs.current[SECTIONS.findIndex(s => s.id === value)]
    if (!nav || !button || nav.scrollWidth <= nav.clientWidth) return

    const behavior = reduce ? 'auto' : 'smooth'
    const left = button.offsetLeft
    const right = left + button.offsetWidth
    if (left < nav.scrollLeft) nav.scrollTo({ left: left - 12, behavior })
    else if (right > nav.scrollLeft + nav.clientWidth) {
      nav.scrollTo({ left: right - nav.clientWidth + 12, behavior })
    }
  }, [value, reduce])

  const onKeyDown = useCallback((e: React.KeyboardEvent, i: number) => {
    const last = SECTIONS.length - 1
    let next = i
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = i === last ? 0 : i + 1
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = i === 0 ? last : i - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    onChange(SECTIONS[next].id)
    refs.current[next]?.focus()
  }, [onChange])

  return (
    <nav
      ref={navRef}
      aria-label="Dashboard sections"
      className="scrollbar-none flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-[var(--space-border-hard)] p-1.5 lg:sticky lg:w-[212px] lg:flex-col lg:overflow-visible"
      style={{ top: 'calc(var(--space-header) + 20px)', alignSelf: 'flex-start' }}
    >
      {SECTIONS.map(({ id, label, icon: Icon }, i) => {
        const active = value === id
        const count = counts[id]
        return (
          <button
            key={id}
            ref={el => { refs.current[i] = el }}
            type="button"
            onClick={() => onChange(id)}
            onKeyDown={e => onKeyDown(e, i)}
            aria-current={active ? 'true' : undefined}
            tabIndex={active ? 0 : -1}
            className={cn(
              'relative shrink-0 rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors duration-150 lg:w-full',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]',
              !active && 'text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)]',
            )}
          >
            {active && (
              <motion.span
                layoutId="section-chip"
                aria-hidden="true"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'var(--space-text-primary)' }}
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            )}
            <span
              className="relative z-10 flex items-center gap-2.5 whitespace-nowrap"
              style={active ? { color: 'var(--space-bg-base)' } : undefined}
            >
              <Icon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={cn('ml-2 text-[13px] tabular-nums lg:ml-auto', !active && 'text-[var(--space-text-tertiary)]')}>
                  {count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminHomeView({
  user, username, clientAccounts, allOrders, allProjects,
  allPackages, completedTasksCount, completedSprintsCount, serializedProjects,
  activeRetainers, activity,
}: AdminHomeViewProps) {
  const [periodId, setPeriodId] = useState<PeriodId>('week')
  const [custom, setCustom] = useState<CustomRange>(EMPTY_CUSTOM_RANGE)
  const [section, setSection] = useState<SectionId>('activity')
  const reduce = useReducedMotion()

  const period = useMemo(() => resolvePeriod(periodId, Date.now(), custom), [periodId, custom])

  // ── Money in the selected period ───────────────────────────────────────────
  // Orders carry no paid-at timestamp, so the period is read off the invoice
  // date. "Collected in September" therefore means September invoices that have
  // since been paid — not payments received during September.

  const pipeline = useMemo(() => {
    let paid = 0, pending = 0, cancelled = 0
    let paidCount = 0, pendingCount = 0, cancelledCount = 0
    for (const o of allOrders) {
      if (!inPeriod(orderDate(o), period)) continue
      const amount = o.amount || 0
      if (o.status === 'paid') { paid += amount; paidCount++ }
      else if (o.status === 'pending') { pending += amount; pendingCount++ }
      else if (o.status === 'cancelled') { cancelled += amount; cancelledCount++ }
    }
    return { paid, pending, cancelled, paidCount, pendingCount, cancelledCount }
  }, [allOrders, period])

  const pipelineTotal = pipeline.paid + pipeline.pending + pipeline.cancelled || 1
  const shares = {
    paid: (pipeline.paid / pipelineTotal) * 100,
    pending: (pipeline.pending / pipelineTotal) * 100,
    cancelled: (pipeline.cancelled / pipelineTotal) * 100,
  }

  // ── Money owed right now (a balance, so never scoped to the period) ─────────

  // Planned payments that have not become an invoice yet. Only proposals that
  // actually went out to a client count — templates and drafts are not owed.
  const scheduled = useMemo(() => {
    return (allPackages ?? [])
      .filter((pkg: any) => pkg.type === 'proposal' && (pkg.status === 'sent' || pkg.status === 'accepted'))
      .flatMap((pkg: any) =>
        (pkg.paymentSchedule ?? [])
          .filter((e: any) => !e.orderId)
          .map((e: any, i: number) => ({
            id: e.id ?? `${pkg.id}-${i}`,
            label: e.label || 'Payment',
            amount: e.amount || 0,
            dueDate: e.dueDate ?? null,
            packageName: pkg.name ?? 'Untitled package',
            accountId: idOf(pkg.clientAccount),
          })),
      )
  }, [allPackages])

  const openInvoices = useMemo(
    () => allOrders.filter((o: any) => o.status === 'pending'),
    [allOrders],
  )
  const openInvoiceAmount = openInvoices.reduce((s: number, o: any) => s + (o.amount || 0), 0)
  const scheduledAmount = scheduled.reduce((s, e) => s + e.amount, 0)
  const outstanding = openInvoiceAmount + scheduledAmount

  // ── Work and clients ───────────────────────────────────────────────────────

  // Serialized rather than raw, so pressing the figure can list the projects
  // with their milestones — same set either way, both come from allProjects.
  const activeProjects = useMemo(
    () => serializedProjects.filter(p => ACTIVE_PROJECT_STATUSES.has(p.status)),
    [serializedProjects],
  )

  // "Active" for a client means money has moved recently: an order raised in
  // the last three months. Deliberately not tied to the period control above —
  // this is a standing measure of who is currently a customer, so it keeps the
  // same three-month window whichever period the ledger is showing.
  const activeClients = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now.getFullYear(), now.getMonth() - ACTIVE_CLIENT_MONTHS, now.getDate()).getTime()

    const byAccount = new Map<string, { orders: number; total: number; last: number }>()
    for (const o of allOrders) {
      const raised = new Date(orderDate(o)).getTime()
      if (Number.isNaN(raised) || raised < cutoff) continue
      const id = idOf(o.clientAccount)
      if (!id) continue
      const seen = byAccount.get(id) ?? { orders: 0, total: 0, last: 0 }
      seen.orders += 1
      seen.total += o.amount || 0
      seen.last = Math.max(seen.last, raised)
      byAccount.set(id, seen)
    }

    return clientAccounts
      .filter((c: any) => byAccount.has(c.id))
      .map((c: any) => ({ id: c.id, name: accountName(c), ...byAccount.get(c.id)! }))
      .sort((a, b) => b.total - a.total)
  }, [allOrders, clientAccounts])

  const activeClientCount = activeClients.length

  // A retainer is ongoing work the same way a project is, so the headline
  // counts both. The note underneath keeps the split visible.
  const activeWorkCount = activeProjects.length + activeRetainers.length

  const retainerMonthly = activeRetainers.reduce(
    (sum: number, r: any) => sum + (r.monthlyFee || 0), 0,
  )

  // What each headline figure is made of, for when someone presses it.
  const collectedOrders = useMemo(
    () => allOrders.filter((o: any) => o.status === 'paid' && inPeriod(orderDate(o), period)),
    [allOrders, period],
  )

  const moving = useMemo(
    () =>
      serializedProjects
        .flatMap(p => p.sprints.map(s => ({ ...s, projectName: p.name })))
        .filter(s => s.status === 'in-progress' || s.status === 'delayed')
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
    [serializedProjects],
  )

  // Open invoices and not-yet-invoiced schedule entries are the same job —
  // money someone owes that needs a nudge — so they share one list, soonest first.
  const needsYou = useMemo(() => {
    const invoices = openInvoices.map((o: any) => {
      const account = typeof o.clientAccount === 'object' ? o.clientAccount : null
      return {
        key: `order-${o.id}`,
        primary: o.orderNumber || 'Invoice',
        secondary: accountName(account),
        amount: o.amount || 0,
        dueDate: o.dueDate ?? null,
        soonWithin: 3,
        href: account?.id ? `/u/${username}/clients/${account.id}` : `/u/${username}/clients`,
      }
    })

    const upcoming = scheduled.map(e => ({
      key: `sched-${e.id}`,
      primary: e.label,
      secondary: e.packageName,
      amount: e.amount,
      dueDate: e.dueDate,
      soonWithin: 7,
      href: e.accountId ? `/u/${username}/clients/${e.accountId}` : `/u/${username}/packages`,
    }))

    return [...invoices, ...upcoming].sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }, [openInvoices, scheduled, username])

  const latestInvoices = useMemo(
    () =>
      [...allOrders]
        .sort((a: any, b: any) => new Date(orderDate(b)).getTime() - new Date(orderDate(a)).getTime())
        .slice(0, 5),
    [allOrders],
  )

  const spineEvents = useMemo(
    () =>
      clientSpineEvents(serializedProjects, allOrders, username)
        .filter(e => onTimeline(e.date, period)),
    [serializedProjects, allOrders, username, period],
  )

  const weeklyRevenue = useMemo(() => {
    const now = Date.now()
    return [3, 2, 1, 0].map(weeksAgo => {
      const end = now - weeksAgo * 7 * DAY
      const start = end - 7 * DAY
      const inWeek = allOrders.filter((o: any) => {
        const t = new Date(orderDate(o)).getTime()
        return t > start && t <= end
      })
      return {
        label: shortDate.format(new Date(start)),
        revenue: inWeek
          .filter((o: any) => o.status === 'paid')
          .reduce((sum: number, o: any) => sum + (o.amount || 0), 0),
      }
    })
  }, [allOrders])

  const projectMix = useMemo(() => ({
    active: allProjects.filter((p: any) => p.status === 'in-progress').length,
    pending: allProjects.filter((p: any) => p.status === 'pending').length,
    completed: allProjects.filter((p: any) => p.status === 'completed').length,
  }), [allProjects])

  // ── Copy ───────────────────────────────────────────────────────────────────

  const clientNoun = user.role === 'admin' ? 'client' : 'assigned client'


  const figures: FigureSpec[] = [
    {
      key: 'collected',
      value: pipeline.paid,
      format: n => usd.format(n),
      label: `Collected ${period.phrase}`,
      note: `${pipeline.paidCount} paid ${plural(pipeline.paidCount, 'invoice')}`,
    },
    {
      key: 'outstanding',
      value: outstanding,
      format: n => usd.format(n),
      label: 'Outstanding today',
      note: outstanding === 0
        ? 'nothing owed'
        : `${openInvoices.length} invoiced, ${scheduled.length} scheduled`,
    },
    {
      key: 'projects',
      value: activeWorkCount,
      format: String,
      label: 'Active work',
      note: `${activeProjects.length} ${plural(activeProjects.length, 'project')}, ` +
        `${activeRetainers.length} ${plural(activeRetainers.length, 'retainer')}`,
    },
    {
      key: 'clients',
      value: activeClientCount,
      format: String,
      label: `Active ${plural(activeClientCount, clientNoun)}`,
      note: `ordered in the last ${ACTIVE_CLIENT_MONTHS} months`,
    },
  ]

  const counts: Partial<Record<SectionId, number>> = {
    needs: needsYou.length,
    moving: moving.length,
    invoices: latestInvoices.length,
  }

  return (
    <div className="space-true-scale mx-auto w-full px-6 pb-24 pt-10 sm:px-10" style={{ maxWidth: '1180px' }}>

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <header className="pb-14 pt-6">
        <DynamicGreeting fontSize="clamp(30px, 6.5vw, 104px)" />
      </header>

      {/* ── The standing ─────────────────────────────────────────────────── */}
      <section aria-label="Standing">
        <div className="flex justify-end pb-3">
          <PeriodControl
            value={periodId}
            onChange={setPeriodId}
            custom={custom}
            onCustomChange={setCustom}
            rangeLabel={period.rangeLabel}
          />
        </div>

        <div className="grid grid-cols-2 border-t border-[var(--space-border-hard)] md:grid-cols-4">
          {figures.map(({ key, ...figure }, i) => (
            <Figure
              key={key}
              {...figure}
              active={section === key}
              onSelect={() => setSection(key)}
              className={figureEdges(i)}
            />
          ))}
        </div>

        {/* The strip's own rule doubles as the pipeline: paid, owed, written off. */}
        <div
          className="flex h-[3px] w-full overflow-hidden bg-[var(--space-divider)]"
          role="img"
          aria-label={`Invoiced ${period.phrase}: ${Math.round(shares.paid)}% paid, ${Math.round(shares.pending)}% outstanding, ${Math.round(shares.cancelled)}% cancelled`}
        >
          <motion.span
            key={`${periodId}-${custom.from}-${custom.to}`}
            className="flex h-full w-full origin-left"
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span style={{ width: `${shares.paid}%`, background: toneColor('ok') }} />
            <span style={{ width: `${shares.pending}%`, background: toneColor('warn') }} />
            <span style={{ width: `${shares.cancelled}%`, background: toneColor('danger'), opacity: 0.5 }} />
          </motion.span>
        </div>

        {/* The days the figures above actually cover, sitting under the bar
            that summarises them. */}
        <p
          className="pt-3 text-right text-[13px] tabular-nums text-[var(--space-text-tertiary)]"
          aria-live="polite"
        >
          {period.rangeLabel}
        </p>
      </section>

      {/* ── The workspace ────────────────────────────────────────────────── */}
      <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Nav is first in the DOM so phones meet it before the content, and
            ordered last on desktop so it sits down the right-hand side. */}
        <div className="lg:order-2">
          <SectionNav value={section} onChange={setSection} counts={counts} />
        </div>

        <div className="min-w-0 flex-1 lg:order-1">
          <AnimatePresence mode="wait">

            {section === 'activity' && (
              <motion.section key="activity" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <SectionTitle title="Recent activity" aside="newest first" />
                <div className="pt-2">
                  <ActivityFeed
                    events={activity}
                    username={username}
                    emptyMessage="Nothing has happened yet. Orders, projects, retainer logs and emails land here as they go out."
                  />
                </div>
              </motion.section>
            )}

            {section === 'collected' && (
              <motion.section key="collected" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <SectionTitle
                  title="Collected"
                  aside={`${usd.format(pipeline.paid)} ${period.phrase}`}
                />
                {collectedOrders.length === 0 ? (
                  <Empty>Nothing was collected {period.phrase}.</Empty>
                ) : (
                  collectedOrders.map((order: any) => <InvoiceLine key={order.id} order={order} />)
                )}
              </motion.section>
            )}

            {section === 'outstanding' && (
              <motion.section key="outstanding" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="space-y-10">
                <div>
                  <SectionTitle
                    title="Invoiced and unpaid"
                    aside={openInvoices.length > 0 ? usd.format(openInvoiceAmount) : undefined}
                  />
                  {openInvoices.length === 0 ? (
                    <Empty>Every invoice raised has been paid.</Empty>
                  ) : (
                    openInvoices.map((order: any) => <InvoiceLine key={order.id} order={order} />)
                  )}
                </div>

                {/* The other half of the figure: money a client has agreed to but
                    that has not become an invoice yet. */}
                <div>
                  <SectionTitle
                    title="Scheduled, not yet invoiced"
                    aside={scheduled.length > 0 ? usd.format(scheduledAmount) : undefined}
                  />
                  {scheduled.length === 0 ? (
                    <Empty>No payments are scheduled ahead.</Empty>
                  ) : (
                    scheduled.map(entry => {
                      const d = due(entry.dueDate, 7)
                      return (
                        <Row
                          key={entry.id}
                          href={entry.accountId ? `/u/${username}/clients/${entry.accountId}` : `/u/${username}/packages`}
                          tone={d.tone}
                          primary={entry.label}
                          secondary={entry.packageName}
                          right={usd.format(entry.amount)}
                          rightTone={d.tone === 'idle' ? undefined : d.tone}
                          note={d.label}
                        />
                      )
                    })
                  )}
                </div>
              </motion.section>
            )}

            {section === 'projects' && (
              <motion.section key="projects" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="space-y-10">
                <div>
                  <SectionTitle
                    title="Active projects"
                    aside={`${activeProjects.length} of ${allProjects.length}`}
                  />
                  {activeProjects.length === 0 ? (
                    <Empty>No project is open. Start one from a client.</Empty>
                  ) : (
                    activeProjects.map(project => {
                      const meta = projectStatus(project.status)
                      const done = project.milestones.filter(m => m.completed).length
                      const total = project.milestones.length
                      const d = due(project.endDate, 7)
                      return (
                        <Row
                          key={project.id}
                          href={`/u/${username}/projects/${project.id}`}
                          tone={meta.tone}
                          primary={project.name}
                          secondary={project.client?.name ?? meta.label}
                          right={total > 0 ? `${done}/${total}` : meta.label}
                          rightTone={d.tone === 'idle' ? undefined : d.tone}
                          note={project.endDate ? d.label : meta.label}
                          progress={total > 0 ? Math.round((done / total) * 100) : undefined}
                        />
                      )
                    })
                  )}
                </div>

                <div>
                  <SectionTitle
                    title="Active retainers"
                    aside={
                      retainerMonthly > 0
                        ? `${usd.format(retainerMonthly)} a month`
                        : undefined
                    }
                  />
                  {activeRetainers.length === 0 ? (
                    <Empty>No retainer is running.</Empty>
                  ) : (
                    activeRetainers.map((retainer: any) => {
                      const account = typeof retainer.clientAccount === 'object' ? retainer.clientAccount : null
                      const accountId = idOf(retainer.clientAccount)
                      const since = retainer.activatedAt ?? retainer.startDate
                      return (
                        <Row
                          key={retainer.id}
                          href={accountId ? `/u/${username}/clients/${accountId}` : `/u/${username}/clients`}
                          tone="ok"
                          primary={accountName(account)}
                          secondary={
                            retainer.hoursPerMonth
                              ? `${RETAINER_TIER[retainer.tier] ?? 'Retainer'} retainer, ${retainer.hoursPerMonth} ${plural(retainer.hoursPerMonth, 'hour')} a month`
                              : `${RETAINER_TIER[retainer.tier] ?? 'Retainer'} retainer`
                          }
                          right={retainer.monthlyFee ? `${usd.format(retainer.monthlyFee)}/mo` : '—'}
                          note={since ? `since ${shortDate.format(new Date(since))}` : 'no start date'}
                        />
                      )
                    })
                  )}
                </div>
              </motion.section>
            )}

            {section === 'clients' && (
              <motion.section key="clients" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <SectionTitle
                  title="Active clients"
                  aside={`ordered in the last ${ACTIVE_CLIENT_MONTHS} months`}
                />
                {activeClients.length === 0 ? (
                  <Empty>
                    No client has ordered in the last {ACTIVE_CLIENT_MONTHS} months.
                  </Empty>
                ) : (
                  activeClients.map(client => (
                    <Row
                      key={client.id}
                      href={`/u/${username}/clients/${client.id}`}
                      tone="ok"
                      primary={client.name}
                      secondary={`${client.orders} ${plural(client.orders, 'order')}`}
                      right={usd.format(client.total)}
                      note={`last ${shortDate.format(new Date(client.last))}`}
                    />
                  ))
                )}
              </motion.section>
            )}

            {section === 'needs' && (
              <motion.section key="needs" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <SectionTitle
                  title="Needs you"
                  aside={needsYou.length > 0
                    ? `${usd.format(outstanding)} owed`
                    : undefined}
                />
                {needsYou.length === 0 ? (
                  <Empty>Everything invoiced is paid. Nothing to chase.</Empty>
                ) : (
                  <>
                    {needsYou.slice(0, 8).map(item => {
                      const d = due(item.dueDate, item.soonWithin)
                      return (
                        <Row
                          key={item.key}
                          href={item.href}
                          tone={d.tone}
                          primary={item.primary}
                          secondary={item.secondary}
                          right={usd.format(item.amount)}
                          rightTone={d.tone === 'idle' ? undefined : d.tone}
                          note={d.label}
                        />
                      )
                    })}
                    {needsYou.length > 8 && (
                      <p className="pt-4 text-[13px] text-[var(--space-text-tertiary)]">
                        {needsYou.length - 8} more owed, totalling{' '}
                        {usd.format(needsYou.slice(8).reduce((s, i) => s + i.amount, 0))}.
                      </p>
                    )}
                  </>
                )}
              </motion.section>
            )}

            {section === 'moving' && (
              <motion.section key="moving" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <SectionTitle
                  title="Moving"
                  aside={moving.length > 0 ? `${moving.length} ${plural(moving.length, 'sprint')} running` : undefined}
                />
                {moving.length === 0 ? (
                  <Empty>No sprint is running. Start one from a project.</Empty>
                ) : (
                  moving.map(sprint => {
                    const meta = sprintStatus(sprint.status)
                    const d = due(sprint.endDate, 3)
                    const pct = sprint.totalTasksCount > 0
                      ? Math.round((sprint.completedTasksCount / sprint.totalTasksCount) * 100)
                      : 0
                    return (
                      <Row
                        key={sprint.id}
                        href={`/u/${username}/projects/${sprint.projectId}`}
                        tone={meta.tone}
                        primary={sprint.name}
                        secondary={sprint.projectName}
                        right={`${sprint.completedTasksCount}/${sprint.totalTasksCount}`}
                        rightTone={d.tone === 'idle' ? undefined : d.tone}
                        note={d.label}
                        progress={pct}
                      />
                    )
                  })
                )}
              </motion.section>
            )}

            {section === 'invoices' && (
              <motion.section key="invoices" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <SectionTitle
                  title="Latest invoices"
                  aside={
                    <Link
                      href="/admin/collections/orders"
                      className="underline decoration-[var(--space-divider)] underline-offset-4 transition-colors hover:text-[var(--space-text-primary)] hover:decoration-[var(--space-accent)]"
                    >
                      All orders
                    </Link>
                  }
                />
                {latestInvoices.length === 0 ? (
                  <Empty>No invoices yet. Build a package to raise the first one.</Empty>
                ) : (
                  latestInvoices.map((order: any) => <InvoiceLine key={order.id} order={order} />)
                )}
              </motion.section>
            )}

            {section === 'analytics' && (
              <motion.section key="analytics" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="space-y-12">
                <div>
                  <SectionTitle title="Revenue collected" aside="last four weeks" />
                  <div className="flex items-end gap-4 pt-8" role="img" aria-label={weeklyRevenue.map(w => `${w.label}: ${usd.format(w.revenue)}`).join(', ')}>
                    {weeklyRevenue.map(w => {
                      const max = Math.max(...weeklyRevenue.map(x => x.revenue), 1)
                      return (
                        <div key={w.label} className="flex flex-1 flex-col items-start gap-2">
                          <span className="text-[13px] tabular-nums text-[var(--space-text-primary)]">
                            {usd.format(w.revenue)}
                          </span>
                          <span className="flex h-[3px] w-full bg-[var(--space-divider)]">
                            <span
                              className="h-full transition-[width] duration-700 ease-out"
                              style={{ width: `${(w.revenue / max) * 100}%`, background: toneColor('ok') }}
                            />
                          </span>
                          <span className="text-[12px] text-[var(--space-text-tertiary)]">{w.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <SectionTitle title="Invoiced" aside={period.phrase} />
                  {[
                    { label: 'Collected', amount: pipeline.paid, count: pipeline.paidCount, pct: shares.paid, tone: 'ok' as StatusTone },
                    { label: 'Outstanding', amount: pipeline.pending, count: pipeline.pendingCount, pct: shares.pending, tone: 'warn' as StatusTone },
                    { label: 'Cancelled', amount: pipeline.cancelled, count: pipeline.cancelledCount, pct: shares.cancelled, tone: 'danger' as StatusTone },
                  ].map(row => (
                    <div key={row.label} className="border-b border-[var(--space-divider)] py-4">
                      <div className="flex items-baseline gap-4">
                        <span className="flex-1 text-[15px] text-[var(--space-text-primary)]">{row.label}</span>
                        <span className="text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">
                          {usd.format(row.amount)}
                        </span>
                      </div>
                      <div className="mt-1 text-[13px] text-[var(--space-text-tertiary)]">
                        {row.count} {plural(row.count, 'invoice')}
                      </div>
                      <Meter pct={row.pct} tone={row.tone} />
                    </div>
                  ))}
                </div>

                <div>
                  <SectionTitle title="Projects" aside={`${allProjects.length} on the books`} />
                  {[
                    { label: 'In progress', value: projectMix.active, tone: 'active' as StatusTone },
                    { label: 'Pending', value: projectMix.pending, tone: 'idle' as StatusTone },
                    { label: 'Completed', value: projectMix.completed, tone: 'ok' as StatusTone },
                  ].map(row => (
                    <div key={row.label} className="border-b border-[var(--space-divider)] py-4">
                      <div className="flex items-baseline gap-4">
                        <span className="flex-1 text-[15px] text-[var(--space-text-primary)]">{row.label}</span>
                        <span className="text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">
                          {row.value}
                        </span>
                      </div>
                      <Meter pct={(row.value / Math.max(allProjects.length, 1)) * 100} tone={row.tone} />
                    </div>
                  ))}
                </div>

                {(completedTasksCount > 0 || completedSprintsCount > 0) && (
                  <p className="text-[13px] text-[var(--space-text-tertiary)]">
                    Delivered so far: {completedTasksCount.toLocaleString()}{' '}
                    {plural(completedTasksCount, 'task')} across {completedSprintsCount}{' '}
                    finished {plural(completedSprintsCount, 'sprint')}.
                  </p>
                )}
              </motion.section>
            )}

            {section === 'timeline' && (
              <motion.section key="timeline" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <SectionTitle
                  title="Timeline"
                  aside={periodId === 'all' ? 'everything on record' : period.phrase}
                />
                <div className="pt-6">
                  <Spine
                    events={spineEvents}
                    emptyMessage={`Nothing started, invoiced or paid ${period.phrase}.`}
                  />
                </div>
              </motion.section>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
