'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Activity as ActivityIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import DynamicGreeting from '@/components/layout/dynamic-greeting'
import {
  ActivityFeed, activityLanes, type ActivityEvent, type KindFilter,
} from '@/components/dashboard/ActivityFeed'
import {
  Figure, figureEdges, SectionNav, SectionTitle, Empty, ToneRule, Meter, PeriodControl,
  useSectionCycle, type FigureSpec, type LedgerSection,
} from '@/components/dashboard/ledger'
import { orderStatus, projectStatus, toneColor, type StatusTone } from '@/lib/dashboard/status'
import { orderDate } from '@/lib/dashboard/utils'
import {
  resolvePeriod, inPeriod, EMPTY_CUSTOM_RANGE,
  type PeriodId, type CustomRange,
} from '@/lib/dashboard/period'
import type { SerializedProject } from '@/lib/serialization'
import { tabVariants } from '@/lib/animations'
import { cn } from '@/lib/utils'

// ─── The ledger ──────────────────────────────────────────────────────────────
// The staff home reads like the studio's books opened to today. Two bands:
//
//   • The standing — four figures that are always on screen. Money in, money
//     owed, work open, clients live. Pressing one opens its workings.
//   • The workspace — the activity log, with the nav listing its lanes.
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

// ─── What the page can be showing ─────────────────────────────────────────────
// Two kinds of section, one piece of state.
//
// The nav lists the *lanes of the activity log* — All, Invoices, New projects,
// Updates, Emails — because the log is what this page is for. It used to list
// six other sections instead (Needs you, Moving, Invoices, Analytics, Timeline)
// and they went unused, so they are gone; Analytics survives as its own route.
//
// The other four ids are a standing figure's workings, opened by pressing the
// figure rather than from the nav. They deliberately share `section` with the
// lanes: while one is open no lane matches, so the nav simply shows nothing
// selected, and pressing any lane returns to the log.

const FIGURE_SECTIONS = ['collected', 'outstanding', 'projects', 'clients'] as const
type FigureSection = typeof FIGURE_SECTIONS[number]

type SectionId = KindFilter | FigureSection

const isFigureSection = (id: SectionId): id is FigureSection =>
  (FIGURE_SECTIONS as readonly string[]).includes(id)

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

/** The client's own invoice ledger — the section id is the `?tab=` contract
 *  of `clients/[client]`, so it must stay `orders`. */
const clientInvoicesHref = (username: string, accountId: string) =>
  `/u/${username}/clients/${accountId}?tab=orders`

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
// Two destinations, both named: the number opens the invoice where it belongs —
// the owning client's Invoices tab, in the portal — and the trailing link opens
// the same invoice on Stripe. The row itself is not a link, so the two anchors
// stay valid and unambiguous. Orders with no readable client account (depth-0
// refs, deleted accounts) fall back to the admin edit view rather than
// pointing at a client route that cannot be built.

function InvoiceLine({ order, username }: { order: any; username: string }) {
  const meta = orderStatus(order.status)
  const account = typeof order.clientAccount === 'object' ? order.clientAccount : null

  return (
    <div className="group relative flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-[var(--space-divider)] py-4 pl-5 pr-1 transition-colors duration-150 hover:bg-[var(--space-bg-card)] focus-within:bg-[var(--space-bg-card)]">
      <ToneRule tone={meta.tone} />

      <Link
        href={account?.id ? clientInvoicesHref(username, account.id) : adminOrderHref(order.id)}
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

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminHomeView({
  user, username, clientAccounts, allOrders, allProjects,
  allPackages, completedTasksCount, completedSprintsCount, serializedProjects,
  activeRetainers, activity,
}: AdminHomeViewProps) {
  const [periodId, setPeriodId] = useState<PeriodId>('week')
  const [custom, setCustom] = useState<CustomRange>(EMPTY_CUSTOM_RANGE)
  // One piece of state for both kinds of section — a lane of the log, or a
  // standing figure's workings. See the note above `FIGURE_SECTIONS`.
  const [section, setSection] = useState<SectionId>('all')
  const navRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const period = useMemo(() => resolvePeriod(periodId, Date.now(), custom), [periodId, custom])

  // The lanes the loaded events actually offer. Empty when there is only one
  // kind, which the nav reads as "there is no real choice to draw".
  const lanes = useMemo(() => activityLanes(activity), [activity])

  // A lane can vanish between loads. Fall back to the whole log rather than
  // leaving the page on a lane the nav no longer lists.
  const activeLane: KindFilter =
    !isFigureSection(section) && (section === 'all' || lanes.some(l => l.id === section))
      ? section
      : 'all'

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

  // ── Copy ───────────────────────────────────────────────────────────────────

  const clientNoun = user.role === 'admin' ? 'client' : 'assigned client'


  const figures: FigureSpec<SectionId>[] = [
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

  // ── The nav ────────────────────────────────────────────────────────────────
  // The lanes of the log, and nothing else. When only one kind of event is
  // loaded there is no real choice to offer, so the panel falls back to a single
  // "Activity" entry rather than a row of one.

  const navSections: LedgerSection<SectionId>[] = useMemo(
    () =>
      lanes.length > 0
        ? lanes.map(l => ({ id: l.id as SectionId, label: l.label, icon: l.icon }))
        : [{ id: 'all' as SectionId, label: 'Activity', icon: ActivityIcon }],
    [lanes],
  )

  const navIds = useMemo(() => navSections.map(s => s.id), [navSections])

  const counts: Partial<Record<SectionId, number>> = useMemo(
    () => Object.fromEntries(lanes.map(l => [l.id, l.count])),
    [lanes],
  )

  // Tab walks the lanes, as it does the sections on the client record. A
  // figure's workings is not in the nav, so entering the cycle from one would
  // dead-end on `indexOf === -1`; pointing it at the last lane instead means
  // the next Tab wraps onto the first, putting you back in the log.
  const cycleFrom: SectionId = isFigureSection(section)
    ? navIds[navIds.length - 1]
    : section

  useSectionCycle(navIds, cycleFrom, setSection, navRef)

  return (
    <div className="space-true-scale mx-auto w-full px-6 pb-24 pt-10 sm:px-10" style={{ maxWidth: '1180px' }}>

      {/* ── The title card ───────────────────────────────────────────────── */}
      {/* Greeting and standing together: the page's opening statement, which
          scrolls away on its own like any other content at the top of a
          document. It used to collapse on scroll and the page jumped every
          time — see the note where `useScrollCollapse` used to live in
          `dashboard/ledger`. Nothing here may animate its own height. */}
      <div>

        {/* ── Greeting ─────────────────────────────────────────────────── */}
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

      </div>

      {/* ── The workspace ────────────────────────────────────────────────── */}
      {/* 54px is `mt-12` spelled out: --spacing is 4.5px inside
          .space-true-scale, so the class this replaced was never the 48px its
          name suggests. A fixed margin, not an animated one — it used to close
          along with the collapsing band, which was a third simultaneous height
          change on a page that already jumped. */}
      <div
        className="flex flex-col gap-6 lg:flex-row lg:gap-12"
        style={{ marginTop: 54 }}
      >
        {/* Nav is first in the DOM so phones meet it before the content, and
            ordered last on desktop so it sits down the right-hand side. It is a
            direct flex child so its sticky position can travel the full height
            of the workspace on a phone. */}
        <SectionNav
          sections={navSections}
          value={section}
          onChange={setSection}
          counts={counts}
          navRef={navRef}
          ariaLabel="Activity lanes"
          className="lg:order-2"
        />

        {/* One keyed wrapper rather than `AnimatePresence mode="wait"`. The old
            arrangement unmounted the open section, rendered *nothing* for the
            140ms exit, then mounted the next one — so on a page scrolled past
            the fold the document collapsed to viewport height mid-swap, the
            browser clamped the scroll to the top, and changing section threw
            you back to the greeting. Keying on `section` remounts in one commit:
            the entering section plays `tabVariants` (opacity, transform, blur —
            none of which touch layout) and the page never has an empty frame. */}
        <div className="min-w-0 flex-1 lg:order-1">
          <motion.div
            key={section}
            variants={tabVariants}
            initial={reduce ? false : 'initial'}
            animate="animate"
          >

            {/* Every section id that is not a figure's workings is a lane of
                the log, so this is the page's default and its resting state. */}
            {!isFigureSection(section) && (
              <section>
                {/* The heading names the open lane as well as the order, so the
                    column says what it is showing without the reader having to
                    look back at the nav to find out why it is short. */}
                <SectionTitle
                  title="Recent activity"
                  aside={
                    activeLane === 'all'
                      ? 'newest first'
                      : `${lanes.find(l => l.id === activeLane)?.label ?? ''}, newest first`
                  }
                />
                <div className="pt-2">
                  <ActivityFeed
                    events={activity}
                    username={username}
                    lane={lanes.length > 0 ? activeLane : undefined}
                    onLaneChange={setSection}
                    emptyMessage="Nothing has happened yet. Orders, projects, retainer logs and emails land here as they go out."
                  />
                </div>
              </section>
            )}

            {section === 'collected' && (
              <section>
                <SectionTitle
                  title="Collected"
                  aside={`${usd.format(pipeline.paid)} ${period.phrase}`}
                />
                {collectedOrders.length === 0 ? (
                  <Empty>Nothing was collected {period.phrase}.</Empty>
                ) : (
                  collectedOrders.map((order: any) => <InvoiceLine key={order.id} order={order} username={username} />)
                )}
              </section>
            )}

            {section === 'outstanding' && (
              <section className="space-y-10">
                <div>
                  <SectionTitle
                    title="Invoiced and unpaid"
                    aside={openInvoices.length > 0 ? usd.format(openInvoiceAmount) : undefined}
                  />
                  {openInvoices.length === 0 ? (
                    <Empty>Every invoice raised has been paid.</Empty>
                  ) : (
                    openInvoices.map((order: any) => <InvoiceLine key={order.id} order={order} username={username} />)
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
              </section>
            )}

            {section === 'projects' && (
              <section className="space-y-10">
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
              </section>
            )}

            {section === 'clients' && (
              <section>
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
              </section>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  )
}
