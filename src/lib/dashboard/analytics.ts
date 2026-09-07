// ─── The four figures, taken apart ───────────────────────────────────────────
// The staff home shows four standing figures — collected, outstanding, active
// work, active clients — as single numbers. This module is what those numbers
// are made of: for each one, the trend across the period, the composition, and
// the ranked list underneath. `_views/AnalyticsView` renders it; nothing here
// touches React or the database, so the arithmetic can be read on its own.
//
// TWO THINGS TO KNOW BEFORE READING ANY FIGURE HERE
//
// 1. An order has no paid-at timestamp. The only date it carries is its
//    effective invoice date (`issuedAt ?? createdAt`, via orderDate()). So
//    "collected in September" means *September invoices that have since been
//    paid* — not money that arrived during September. Every figure below that
//    is scoped to a period inherits that meaning, and the view says so on
//    screen rather than leaving it in this comment.
//
// 2. The four figures do not share one time window, and never did. Collected is
//    period-scoped; outstanding is a balance as of right now; active clients
//    uses its own fixed trailing window. That is defensible — a debt is not a
//    flow — but it is invisible on the home page, where one period control sits
//    above all four. Each study here carries its own `window` string so the
//    view can state the window per figure instead of implying a shared one.

import { orderDate } from './order-date'
import { inPeriod, periodDays, type Period } from './period'
import { orderStatus, projectStatus, type StatusTone } from './status'

// ─── Shared shapes ───────────────────────────────────────────────────────────

export interface Delta {
  /** Absolute change against the comparison window. */
  value: number
  /** Percentage change, or null when the comparison window was zero. */
  pct: number | null
  direction: 'up' | 'down' | 'flat'
}

export interface TimeBucket {
  key: string
  label: string
  value: number
  count: number
}

export interface Slice {
  key: string
  label: string
  tone: StatusTone
  amount: number
  count: number
  /** Share of the study's total, 0–100. */
  pct: number
}

export interface ClientSlice {
  id: string
  name: string
  amount: number
  count: number
  pct: number
}

// ─── Small helpers ───────────────────────────────────────────────────────────

const idOf = (ref: any): string | null =>
  ref ? (typeof ref === 'object' ? (ref.id ?? null) : String(ref)) : null

const accountName = (a: any): string =>
  a?.company || a?.name || a?.firstName || 'Unnamed client'

const DAY = 86_400_000

/** Percentage of `total`, guarding the zero case that would produce NaN. */
const share = (part: number, total: number): number => (total > 0 ? (part / total) * 100 : 0)

export function delta(current: number, previous: number): Delta {
  const value = current - previous
  // A rise from zero has no meaningful percentage — reporting "+100%" or
  // "+∞%" for the first dollar ever collected would be theatre, so the view
  // shows the absolute change instead.
  const pct = previous > 0 ? (value / previous) * 100 : null
  return { value, pct, direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat' }
}

/** Rank a map of client totals into the shape every "by client" list uses. */
function rankClients(
  byId: Map<string, { name: string; amount: number; count: number }>,
  total: number,
): ClientSlice[] {
  return [...byId.entries()]
    .map(([id, v]) => ({ id, name: v.name, amount: v.amount, count: v.count, pct: share(v.amount, total) }))
    .sort((a, b) => b.amount - a.amount)
}

// ─── Time buckets ────────────────────────────────────────────────────────────
// Granularity follows the span so a trend always reads as a handful of columns
// rather than one tall bar or three hundred hairlines.

type Grain = 'day' | 'week' | 'month'

export function grainFor(period: Period): Grain {
  const days = periodDays(period)
  if (days === 0) return 'month' // unbounded ("all time")
  if (days <= 14) return 'day'
  if (days <= 92) return 'week'
  return 'month'
}

const DAY_FMT = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const MONTH_FMT = new Intl.DateTimeFormat('en-US', { month: 'short' })

function bucketStart(d: Date, grain: Grain): Date {
  if (grain === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (grain === 'week') return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function advance(d: Date, grain: Grain): Date {
  if (grain === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  if (grain === 'week') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

function bucketLabel(d: Date, grain: Grain): string {
  if (grain === 'day') return DAY_FMT.format(d)
  if (grain === 'week') return DATE_FMT.format(d)
  return MONTH_FMT.format(d)
}

/**
 * Empty buckets spanning the period, so a quiet week draws as a gap rather
 * than disappearing and making the axis lie about how much time passed.
 *
 * "All time" has no lower bound, so the run starts at the earliest dated row
 * rather than at the epoch. A cap keeps a stray 1970 date from generating
 * decades of empty columns.
 */
const MAX_BUCKETS = 60

function emptyBuckets(period: Period, earliest: number | null, grain: Grain): TimeBucket[] {
  const from = period.start ?? earliest
  if (from === null) return []

  let cursor = bucketStart(new Date(from), grain)
  const end = period.end
  const out: TimeBucket[] = []

  while (cursor.getTime() <= end && out.length < MAX_BUCKETS) {
    out.push({
      key: String(cursor.getTime()),
      label: bucketLabel(cursor, grain),
      value: 0,
      count: 0,
    })
    cursor = advance(cursor, grain)
  }

  // More history than columns: keep the most recent run, since a trend is read
  // from its right-hand end.
  return out
}

function fillBuckets(
  buckets: TimeBucket[],
  rows: Array<{ at: number; amount: number }>,
  grain: Grain,
): TimeBucket[] {
  if (buckets.length === 0) return buckets
  const byKey = new Map(buckets.map((b) => [b.key, b]))
  for (const row of rows) {
    const key = String(bucketStart(new Date(row.at), grain).getTime())
    const bucket = byKey.get(key)
    if (!bucket) continue // outside the drawn run (see MAX_BUCKETS)
    bucket.value += row.amount
    bucket.count += 1
  }
  return buckets
}

// ─── 1 · Collected ───────────────────────────────────────────────────────────

export interface CollectedStudy {
  window: string
  total: number
  count: number
  previousTotal: number
  change: Delta
  /** Mean paid invoice in the period. */
  average: number
  largest: { name: string; amount: number } | null
  series: TimeBucket[]
  grain: Grain
  /** Every status an invoice dated in the period currently holds. */
  byStatus: Slice[]
  byClient: ClientSlice[]
  /** Invoices dated in the period, whatever their status. */
  invoicedTotal: number
  /**
   * Invoices whose status is none of paid/pending/cancelled — refunded, or
   * anything added to the enum later. The home page's pipeline silently drops
   * these, so they are counted here rather than vanishing.
   */
  unclassified: { amount: number; count: number }
}

export function buildCollected(
  orders: any[],
  period: Period,
  previous: Period | null,
): CollectedStudy {
  const inWindow = orders.filter((o) => inPeriod(orderDate(o), period))
  const paid = inWindow.filter((o) => o.status === 'paid')

  const total = paid.reduce((s, o) => s + (o.amount || 0), 0)
  const previousTotal = previous
    ? orders
        .filter((o) => o.status === 'paid' && inPeriod(orderDate(o), previous))
        .reduce((s, o) => s + (o.amount || 0), 0)
    : 0

  // Status composition of everything dated in the window — this is where a
  // cancelled or refunded invoice becomes visible instead of being dropped.
  const invoicedTotal = inWindow.reduce((s, o) => s + (o.amount || 0), 0)
  const KNOWN = ['paid', 'pending', 'cancelled'] as const
  const byStatus: Slice[] = KNOWN.map((key) => {
    const rows = inWindow.filter((o) => o.status === key)
    const amount = rows.reduce((s, o) => s + (o.amount || 0), 0)
    const meta = orderStatus(key)
    return { key, label: meta.label, tone: meta.tone, amount, count: rows.length, pct: share(amount, invoicedTotal) }
  }).filter((s) => s.count > 0)

  const other = inWindow.filter((o) => !KNOWN.includes(o.status))
  if (other.length > 0) {
    // Group whatever else turned up under its own status label, so an enum that
    // grows does not quietly stop being counted.
    const seen = new Map<string, { amount: number; count: number }>()
    for (const o of other) {
      const key = String(o.status ?? 'unknown')
      const acc = seen.get(key) ?? { amount: 0, count: 0 }
      acc.amount += o.amount || 0
      acc.count += 1
      seen.set(key, acc)
    }
    for (const [key, v] of seen) {
      const meta = orderStatus(key)
      byStatus.push({ key, label: meta.label, tone: meta.tone, amount: v.amount, count: v.count, pct: share(v.amount, invoicedTotal) })
    }
  }

  const byId = new Map<string, { name: string; amount: number; count: number }>()
  for (const o of paid) {
    const id = idOf(o.clientAccount)
    if (!id) continue
    const acc = byId.get(id) ?? { name: accountName(typeof o.clientAccount === 'object' ? o.clientAccount : null), amount: 0, count: 0 }
    acc.amount += o.amount || 0
    acc.count += 1
    byId.set(id, acc)
  }

  const grain = grainFor(period)
  const earliest = paid.length > 0
    ? Math.min(...paid.map((o) => new Date(orderDate(o)).getTime()).filter(Number.isFinite))
    : null

  const series = fillBuckets(
    emptyBuckets(period, earliest, grain),
    paid.map((o) => ({ at: new Date(orderDate(o)).getTime(), amount: o.amount || 0 })),
    grain,
  )

  const largestOrder = paid.reduce<any | null>((best, o) => (!best || (o.amount || 0) > (best.amount || 0) ? o : best), null)

  const unclassifiedRows = other
  return {
    window: `invoices dated ${period.phrase} that have since been paid`,
    total,
    count: paid.length,
    previousTotal,
    change: delta(total, previousTotal),
    average: paid.length > 0 ? total / paid.length : 0,
    largest: largestOrder
      ? { name: accountName(typeof largestOrder.clientAccount === 'object' ? largestOrder.clientAccount : null), amount: largestOrder.amount || 0 }
      : null,
    series,
    grain,
    byStatus,
    byClient: rankClients(byId, total),
    invoicedTotal,
    unclassified: {
      amount: unclassifiedRows.reduce((s, o) => s + (o.amount || 0), 0),
      count: unclassifiedRows.length,
    },
  }
}

// ─── 2 · Outstanding ─────────────────────────────────────────────────────────
// A balance, not a flow: everything owed as of right now, whatever period the
// control is showing. Two sources — invoices raised and not paid, and payments
// a client has agreed to in a proposal that have not been invoiced yet.

export interface OwedItem {
  key: string
  kind: 'invoice' | 'scheduled'
  primary: string
  secondary: string
  amount: number
  dueDate: string | null
  /** Days past due; negative means not due yet, null means no date set. */
  overdueBy: number | null
  accountId: string | null
}

export interface OutstandingStudy {
  window: string
  total: number
  invoiced: { amount: number; count: number }
  scheduled: { amount: number; count: number }
  /** not-due / 1–30 / 31–60 / 60+ / undated, by days past `dueDate`. */
  aging: Slice[]
  overdue: { amount: number; count: number }
  byClient: ClientSlice[]
  items: OwedItem[]
  /** Mean age in days of the overdue portion — 0 when nothing is overdue. */
  averageOverdueDays: number
}

const AGING_BANDS: Array<{ key: string; label: string; tone: StatusTone; min: number; max: number }> = [
  { key: 'current', label: 'Not due yet', tone: 'idle', min: -Infinity, max: 0 },
  { key: '1-30', label: '1–30 days over', tone: 'warn', min: 1, max: 30 },
  { key: '31-60', label: '31–60 days over', tone: 'warn', min: 31, max: 60 },
  { key: '60+', label: 'Over 60 days', tone: 'danger', min: 61, max: Infinity },
]

export function buildOutstanding(
  orders: any[],
  packages: any[],
  now: number = Date.now(),
): OutstandingStudy {
  const pending = orders.filter((o) => o.status === 'pending')

  // Only proposals that actually went to a client are owed — a template or an
  // unsent draft is a plan, not a debt. An entry with an `orderId` has already
  // become an invoice and would otherwise be counted twice.
  const scheduledEntries = (packages ?? [])
    .filter((pkg: any) => pkg.type === 'proposal' && (pkg.status === 'sent' || pkg.status === 'accepted'))
    .flatMap((pkg: any) =>
      (pkg.paymentSchedule ?? [])
        .filter((e: any) => !e.orderId)
        .map((e: any, i: number) => ({
          key: `sched-${e.id ?? `${pkg.id}-${i}`}`,
          kind: 'scheduled' as const,
          primary: e.label || 'Scheduled payment',
          secondary: pkg.name ?? 'Untitled package',
          amount: e.amount || 0,
          dueDate: e.dueDate ?? null,
          accountId: idOf(pkg.clientAccount),
          accountName: accountName(typeof pkg.clientAccount === 'object' ? pkg.clientAccount : null),
        })),
    )

  const invoiceItems: Array<OwedItem & { accountName: string }> = pending.map((o: any) => {
    const account = typeof o.clientAccount === 'object' ? o.clientAccount : null
    return {
      key: `order-${o.id}`,
      kind: 'invoice' as const,
      primary: o.orderNumber || 'Invoice',
      secondary: accountName(account),
      amount: o.amount || 0,
      dueDate: o.dueDate ?? null,
      overdueBy: null,
      accountId: idOf(o.clientAccount),
      accountName: accountName(account),
    }
  })

  const all = [
    ...invoiceItems,
    ...scheduledEntries.map((e) => ({ ...e, overdueBy: null as number | null })),
  ].map((item) => ({
    ...item,
    overdueBy: item.dueDate ? Math.floor((now - new Date(item.dueDate).getTime()) / DAY) : null,
  }))

  const total = all.reduce((s, i) => s + i.amount, 0)

  const aging: Slice[] = AGING_BANDS.map((band) => {
    const rows = all.filter((i) => i.overdueBy !== null && i.overdueBy >= band.min && i.overdueBy <= band.max)
    const amount = rows.reduce((s, i) => s + i.amount, 0)
    return { key: band.key, label: band.label, tone: band.tone, amount, count: rows.length, pct: share(amount, total) }
  })

  // Undated rows cannot be aged, and folding them into "not due yet" would
  // claim a due date nobody set. They get their own band.
  const undated = all.filter((i) => i.overdueBy === null)
  if (undated.length > 0) {
    const amount = undated.reduce((s, i) => s + i.amount, 0)
    aging.push({ key: 'undated', label: 'No due date', tone: 'idle', amount, count: undated.length, pct: share(amount, total) })
  }

  const overdueRows = all.filter((i) => i.overdueBy !== null && i.overdueBy > 0)

  const byId = new Map<string, { name: string; amount: number; count: number }>()
  for (const i of all) {
    if (!i.accountId) continue
    const acc = byId.get(i.accountId) ?? { name: i.accountName, amount: 0, count: 0 }
    acc.amount += i.amount
    acc.count += 1
    byId.set(i.accountId, acc)
  }

  return {
    window: 'everything owed as of today — not scoped to the period',
    total,
    invoiced: { amount: invoiceItems.reduce((s, i) => s + i.amount, 0), count: invoiceItems.length },
    scheduled: { amount: scheduledEntries.reduce((s, e) => s + e.amount, 0), count: scheduledEntries.length },
    aging: aging.filter((a) => a.count > 0),
    overdue: { amount: overdueRows.reduce((s, i) => s + i.amount, 0), count: overdueRows.length },
    byClient: rankClients(byId, total),
    items: all
      .map(({ accountName: _drop, ...rest }) => rest)
      // Most overdue first, undated last — the order you would work the list in.
      .sort((a, b) => {
        if (a.overdueBy === null) return 1
        if (b.overdueBy === null) return -1
        return b.overdueBy - a.overdueBy
      }),
    averageOverdueDays:
      overdueRows.length > 0
        ? overdueRows.reduce((s, i) => s + (i.overdueBy ?? 0), 0) / overdueRows.length
        : 0,
  }
}

// ─── 3 · Active work ─────────────────────────────────────────────────────────

export interface RetainerLoad {
  id: string
  name: string
  tier: string
  hoursUsed: number
  hoursCap: number
  /** Used ÷ cap, 0–100 clamped. `overageHours` carries what spilled past it. */
  utilization: number
  overageHours: number
  overageAmount: number
  daysLeft: number
  cycleLabel: string
  tone: StatusTone
}

export interface WorkStudy {
  window: string
  total: number
  projectCount: number
  retainerCount: number
  byStatus: Slice[]
  sprints: { inProgress: number; delayed: number; pending: number; finished: number }
  retainers: RetainerLoad[]
  /** Sum of active retainer monthly fees — committed recurring revenue. */
  monthlyRecurring: number
  /** Hours burnt this cycle across every retainer, against the total cap. */
  hoursUsed: number
  hoursCap: number
  overageAmount: number
  /**
   * Projects whose status the enum does not define. `serializeProject` defaults
   * a missing status to 'active', which is not a Projects status — so these are
   * counted as active work by the home page without ever having been set.
   */
  untypedProjects: number
}

/**
 * Which project statuses count as "active work".
 *
 * Mirrors the home page, including its oddities, so the two pages cannot
 * disagree about the headline number: `pending` (not started) counts, `on-hold`
 * does not, and `active` is not a Projects status at all — it only matches rows
 * whose status is missing, via serializeProject's fallback. The breakdown below
 * shows every status so what the headline leaves out is visible rather than
 * implied.
 */
export const ACTIVE_PROJECT_STATUSES = new Set(['in-progress', 'pending', 'active'])

/** The subset of `RetainerPortfolioRow` this module reads. */
export interface PortfolioRow {
  retainerId: string
  clientName: string
  clientCompany?: string | null
  tier: string
  used: number
  cap: number
  pct: number
  overageHours: number
  overageAmount: number
  daysLeft: number
  cycleLabel: string
  health: 'healthy' | 'warning' | 'over' | 'open' | 'scoping'
}

const HEALTH_TONE: Record<PortfolioRow['health'], StatusTone> = {
  over: 'danger',
  warning: 'warn',
  healthy: 'ok',
  open: 'active',
  scoping: 'idle',
}

export function buildWork(
  projects: any[],
  serializedProjects: any[],
  retainers: any[],
  portfolio: PortfolioRow[],
): WorkStudy {
  const active = projects.filter((p: any) => ACTIVE_PROJECT_STATUSES.has(p.status))

  // Every status on the books, not just the active ones — the point of the
  // breakdown is to show what the headline count leaves out.
  const statusCounts = new Map<string, number>()
  for (const p of projects) {
    const key = p.status ?? 'unknown'
    statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1)
  }

  const byStatus: Slice[] = [...statusCounts.entries()]
    .map(([key, count]) => {
      const meta = projectStatus(key)
      return { key, label: meta.label, tone: meta.tone, amount: count, count, pct: share(count, projects.length) }
    })
    .sort((a, b) => b.count - a.count)

  const allSprints = (serializedProjects ?? []).flatMap((p: any) => p.sprints ?? [])
  const sprints = {
    inProgress: allSprints.filter((s: any) => s.status === 'in-progress').length,
    delayed: allSprints.filter((s: any) => s.status === 'delayed').length,
    pending: allSprints.filter((s: any) => s.status === 'pending').length,
    finished: allSprints.filter((s: any) => s.status === 'finished').length,
  }

  // Burn comes from getRetainerPortfolio(), which settles each retainer against
  // the clock and reads its own billing cycle — cycles are anchored to
  // `activatedAt`, so they are not calendar months and cannot be derived by
  // summing this month's time entries.
  const retainerLoads: RetainerLoad[] = (portfolio ?? [])
    .filter((r) => r.health !== 'scoping')
    .map((r) => ({
      id: r.retainerId,
      name: r.clientCompany || r.clientName,
      tier: r.tier,
      hoursUsed: r.used,
      hoursCap: r.cap,
      utilization: r.pct,
      overageHours: r.overageHours,
      overageAmount: r.overageAmount,
      daysLeft: r.daysLeft,
      cycleLabel: r.cycleLabel,
      tone: HEALTH_TONE[r.health] ?? 'idle',
    }))
    .sort((a, b) => b.utilization - a.utilization || b.overageHours - a.overageHours)

  // Fee lives on the retainer record, not the portfolio row.
  const monthlyRecurring = (retainers ?? []).reduce((s: number, r: any) => s + (r.monthlyFee || 0), 0)

  return {
    window: 'open right now — projects and retainers, not scoped to the period',
    total: active.length + (retainers?.length ?? 0),
    projectCount: active.length,
    retainerCount: retainers?.length ?? 0,
    byStatus,
    sprints,
    retainers: retainerLoads,
    monthlyRecurring,
    hoursUsed: retainerLoads.reduce((s, r) => s + r.hoursUsed, 0),
    hoursCap: retainerLoads.reduce((s, r) => s + r.hoursCap, 0),
    overageAmount: retainerLoads.reduce((s, r) => s + r.overageAmount, 0),
    untypedProjects: projects.filter((p: any) => !p.status).length,
  }
}

// ─── 4 · Active clients ──────────────────────────────────────────────────────

export interface ClientRow {
  id: string
  name: string
  /** Orders of any status inside the window — what makes the client "active". */
  orders: number
  /** Value of those orders, cancelled ones included (see `paid`). */
  total: number
  /** The paid share of `total` — what actually became money. */
  paid: number
  /** ISO of the most recent order, or null. */
  lastOrder: string | null
  daysSince: number | null
  /** First order ever falls inside the window — a client won recently. */
  isNew: boolean
  /** Every order in the window was cancelled. Counted active on a technicality. */
  cancelledOnly: boolean
}

export interface ClientsStudy {
  window: string
  windowMonths: number
  activeCount: number
  /** Every account on the books, active or not. */
  totalCount: number
  /** Share of window revenue held by the single largest client, 0–100. */
  concentration: number
  /** Share held by the top three. */
  concentrationTop3: number
  active: ClientRow[]
  /** Had orders once, none inside the window — the churn list. */
  quiet: ClientRow[]
  /** Accounts that have never ordered at all. */
  neverOrdered: number
  newCount: number
  /** Paid revenue from active clients inside the window. */
  revenue: number
  /**
   * Active clients whose only orders in the window were cancelled. The headline
   * counts them because it filters on date alone, never on status — so they are
   * named here rather than quietly padding the number.
   */
  cancelledOnlyCount: number
}

export const ACTIVE_CLIENT_MONTHS = 3

interface Hist {
  first: number
  last: number
  inWindow: number
  total: number
  paid: number
  live: number
}

export function buildClients(
  clientAccounts: any[],
  orders: any[],
  now: number = Date.now(),
  windowMonths: number = ACTIVE_CLIENT_MONTHS,
): ClientsStudy {
  const d = new Date(now)
  // "The same day, N months back" — with the day clamped to the length of the
  // target month. Passing an out-of-range day to the Date constructor rolls it
  // forward instead of erroring (May 31 → "Feb 31" → Mar 3), which would shrink
  // the window by up to three days on month-ends.
  const targetMonth = d.getMonth() - windowMonths
  const daysInTarget = new Date(d.getFullYear(), targetMonth + 1, 0).getDate()
  const cutoff = new Date(
    d.getFullYear(),
    targetMonth,
    Math.min(d.getDate(), daysInTarget),
  ).getTime()

  // One pass over every order, tracking the whole history and the window
  // separately — "new" needs the first-ever order, "quiet" needs the last one.
  const hist = new Map<string, Hist>()
  for (const o of orders) {
    const at = new Date(orderDate(o)).getTime()
    if (!Number.isFinite(at)) continue
    const id = idOf(o.clientAccount)
    if (!id) continue
    const acc = hist.get(id) ?? { first: at, last: at, inWindow: 0, total: 0, paid: 0, live: 0 }
    acc.first = Math.min(acc.first, at)
    acc.last = Math.max(acc.last, at)
    if (at >= cutoff) {
      acc.inWindow += 1
      acc.total += o.amount || 0
      if (o.status === 'paid') acc.paid += o.amount || 0
      if (o.status !== 'cancelled') acc.live += 1
    }
    hist.set(id, acc)
  }

  const row = (c: any, h: Hist): ClientRow => ({
    id: String(c.id),
    name: accountName(c),
    orders: h.inWindow,
    total: h.total,
    paid: h.paid,
    lastOrder: Number.isFinite(h.last) ? new Date(h.last).toISOString() : null,
    daysSince: Number.isFinite(h.last) ? Math.floor((now - h.last) / DAY) : null,
    isNew: h.first >= cutoff,
    cancelledOnly: h.inWindow > 0 && h.live === 0,
  })

  const active: ClientRow[] = []
  const quiet: ClientRow[] = []
  let neverOrdered = 0
  for (const c of clientAccounts) {
    const h = hist.get(String(c.id))
    // Never ordered — not a churn risk, just not a customer yet.
    if (!h) { neverOrdered += 1; continue }
    if (h.inWindow > 0) active.push(row(c, h))
    else quiet.push(row(c, h))
  }

  active.sort((a, b) => b.paid - a.paid || b.total - a.total)
  quiet.sort((a, b) => (a.daysSince ?? 0) - (b.daysSince ?? 0))

  const revenue = active.reduce((s, c) => s + c.paid, 0)

  return {
    window: `ordered in the last ${windowMonths} months — a fixed window, not the period`,
    windowMonths,
    activeCount: active.length,
    totalCount: clientAccounts.length,
    concentration: share(active[0]?.paid ?? 0, revenue),
    concentrationTop3: share(active.slice(0, 3).reduce((s, c) => s + c.paid, 0), revenue),
    active,
    quiet,
    neverOrdered,
    newCount: active.filter((c) => c.isNew).length,
    revenue,
    cancelledOnlyCount: active.filter((c) => c.cancelledOnly).length,
  }
}
