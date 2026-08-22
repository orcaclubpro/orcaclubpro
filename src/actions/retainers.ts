'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cycleFor, nextCycleStart, type Cycle } from '@/lib/retainers/cycle'
import { deriveRecapDefaults, mergeRecap, RECAP_CATEGORY_LABEL, type RecapData } from '@/lib/retainers/recap'
import { getStripe } from '@/lib/stripe'
import { resolveStripeCustomer } from '@/lib/stripe/customers'
import { createStripeInvoiceForOrder, assertOrderPersisted } from '@/lib/stripe/invoices'
import { buildRetainerStatementPdf, buildRetainerRecapPdf, buildRetainerProposalPdf } from '@/lib/pdf-generators'
import {
  generateGenericInvoiceEmail,
  generateGenericInvoiceEmailText,
  type EmailAttachment,
} from '@/lib/payload/utils/genericInvoiceEmailTemplate'
import {
  generateRetainerRecapEmail,
  generateRetainerRecapEmailText,
  retainerRecapEmailSubject,
} from '@/lib/payload/utils/retainerRecapEmailTemplate'
import {
  generateRetainerProposalEmail,
  generateRetainerProposalEmailText,
  retainerProposalEmailSubject,
} from '@/lib/payload/utils/retainerProposalEmailTemplate'

// ── Shared shapes ───────────────────────────────────────────────────────────────

export type RetainerTier = 'basic' | 'growth' | 'enterprise'
export type RetainerStatus = 'scoping' | 'active' | 'inactive'
export type TimeEntryCategory = 'work' | 'meeting' | 'revision' | 'reporting'
export type TimeEntryPriority = 'low' | 'medium' | 'high'
export type TimeEntryCompletion = 'incomplete' | 'complete'
export type TimeEntryStatus = 'draft' | 'logged'

export interface RetainerDoc {
  id: string
  clientAccount: string | { id: string }
  tier: RetainerTier
  /** `scoping` = agreed, no plan yet: no cycle, no cap, nothing billable. */
  status: RetainerStatus
  monthlyFee?: number | null
  hoursPerMonth?: number | null
  overageRate?: number | null
  startDate?: string | null
  activatedAt?: string | null
  deactivateOn?: string | null
  notes?: string | null
  // The pitch headline. Scope ITEMS are draft/logged time entries, not a field here.
  scopeSummary?: string | null
  // The priced offer sent before activation. Kept apart from the live terms so a
  // proposal can never be billed off — activation copies these across.
  proposedTier?: RetainerTier | null
  proposedMonthlyFee?: number | null
  proposedHoursPerMonth?: number | null
  proposedOverageRate?: number | null
  proposedStartDate?: string | null
  proposalIncludesCompletedWork?: boolean | null
  proposalNote?: string | null
  proposalSentAt?: string | null
  proposalSentTo?: { email?: string | null }[] | null
  // One scheduled change that takes effect next cycle (see setRetainer/settle).
  pendingTier?: RetainerTier | null
  pendingMonthlyFee?: number | null
  pendingHoursPerMonth?: number | null
  pendingOverageRate?: number | null
  pendingEffectiveFrom?: string | null
}

export interface TimeEntryDoc {
  id: string
  date: string
  hours: number
  status: TimeEntryStatus
  category?: TimeEntryCategory | null
  priority?: TimeEntryPriority | null
  completion?: TimeEntryCompletion | null
  description?: string | null
  retainer: string | { id: string }
  clientAccount: string | { id: string }
  loggedBy?: string | { id: string } | null
  // Retainer terms frozen when a draft is logged (see logHours / updateTimeEntry).
  capAtLog?: number | null
  overageRateAtLog?: number | null
  feeAtLog?: number | null
  tierAtLog?: RetainerTier | null
}

export interface RetainerTerms {
  tier: RetainerTier
  hoursPerMonth: number
  monthlyFee: number
  overageRate: number
}

export interface RetainerTotals {
  used: number
  cap: number
  remaining: number
  overageHours: number
  overageRate: number
  overageAmount: number
  byCategory: Record<TimeEntryCategory, number>
}

export interface RetainerScheduled {
  deactivateOn: string | null
  pendingEffectiveFrom: string | null
  pending: { tier?: RetainerTier | null; monthlyFee?: number | null; hoursPerMonth?: number | null; overageRate?: number | null } | null
}

/** The order already billed for a cycle, if any — lets the UI show "Invoiced" instead of "Send". */
export interface RetainerCycleInvoice {
  orderId: string
  orderNumber: string
  status: 'pending' | 'paid' | 'cancelled'
  amount: number
  stripeInvoiceUrl: string | null
  createdAt: string
}

/** Client identity attached to the summary — recipient details for the invoice flow. */
export interface RetainerClientInfo {
  name: string
  company: string | null
  email: string | null
}

/** The next billing cycle — retainers bill a month ahead, so the close-out UI needs it. */
export interface RetainerNextCycle {
  start: string
  label: string
  /** Month name of the next cycle, e.g. "August". */
  monthLabel: string
  invoice: RetainerCycleInvoice | null
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Store a `YYYY-MM-DD` day at noon UTC so it never shifts across timezones. */
function dayToIso(date: string): string {
  const day = String(date).slice(0, 10)
  return new Date(`${day}T12:00:00.000Z`).toISOString()
}

/** Normalize any date-ish value to a comparable full ISO string, or null. */
function iso(val: string | Date | null | undefined): string | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/** The billing-cycle anchor for a retainer: activation date, else start date, else now. */
function anchorOf(r: RetainerDoc): string {
  return iso(r.activatedAt) ?? iso(r.startDate) ?? new Date().toISOString()
}

/** Scoped but not yet on a plan — no cycle, no cap, nothing loggable or billable. */
function isScoping(r: RetainerDoc | null | undefined): boolean {
  return r?.status === 'scoping'
}

/** What a scoping retainer has accumulated — the evidence pricing is set from. */
export interface RetainerPitch {
  /** Estimated hours across planned (draft) items — the recurring monthly ask. */
  plannedHours: number
  /** Hours already worked and logged during scoping. */
  doneHours: number
  plannedCount: number
  doneCount: number
}

function computePitch(drafts: TimeEntryDoc[], logged: TimeEntryDoc[]): RetainerPitch {
  const sum = (xs: TimeEntryDoc[]) => Math.round(xs.reduce((t, e) => t + (e.hours ?? 0), 0) * 100) / 100
  return {
    plannedHours: sum(drafts),
    doneHours: sum(logged),
    plannedCount: drafts.length,
    doneCount: logged.length,
  }
}

const EMPTY_CATEGORIES: Record<TimeEntryCategory, number> = {
  work: 0,
  meeting: 0,
  revision: 0,
  reporting: 0,
}

function computeTotals(entries: TimeEntryDoc[], cap: number, overageRate: number): RetainerTotals {
  const byCategory: Record<TimeEntryCategory, number> = { ...EMPTY_CATEGORIES }
  let used = 0
  for (const e of entries) {
    const h = e.hours ?? 0
    used += h
    const cat = (e.category ?? 'work') as TimeEntryCategory
    if (cat in byCategory) byCategory[cat] += h
  }
  const remaining = Math.max(0, cap - used)
  const overageHours = Math.max(0, used - cap)
  return {
    used: Math.round(used * 100) / 100,
    cap,
    remaining: Math.round(remaining * 100) / 100,
    overageHours: Math.round(overageHours * 100) / 100,
    overageRate,
    overageAmount: Math.round(overageHours * overageRate * 100) / 100,
    byCategory,
  }
}

/** The terms in effect for a given date — the scheduled change if the date is on/after
 *  its effective date, otherwise the current terms. Used for display + snapshot-freeze. */
function effectiveTerms(r: RetainerDoc, dateIso: string): RetainerTerms {
  const eff = iso(r.pendingEffectiveFrom)
  const usePending = Boolean(eff && dateIso >= eff)
  return {
    tier: (usePending && r.pendingTier != null ? r.pendingTier : r.tier) as RetainerTier,
    hoursPerMonth: usePending && r.pendingHoursPerMonth != null ? r.pendingHoursPerMonth : (r.hoursPerMonth ?? 0),
    monthlyFee: usePending && r.pendingMonthlyFee != null ? r.pendingMonthlyFee : (r.monthlyFee ?? 0),
    overageRate: usePending && r.pendingOverageRate != null ? r.pendingOverageRate : (r.overageRate ?? 65),
  }
}

/** Terms for a whole cycle. Past cycles read the terms frozen onto their logged entries
 *  (history is immutable); the current/future cycle reads live/effective terms. */
function termsForCycle(r: RetainerDoc, cycle: Cycle, logged: TimeEntryDoc[], nowIso: string): RetainerTerms {
  const isPast = cycle.end <= nowIso
  if (isPast) {
    const snap = logged.find((e) => e.capAtLog != null)
    if (snap) {
      return {
        tier: (snap.tierAtLog ?? r.tier) as RetainerTier,
        hoursPerMonth: snap.capAtLog ?? (r.hoursPerMonth ?? 0),
        monthlyFee: snap.feeAtLog ?? (r.monthlyFee ?? 0),
        overageRate: snap.overageRateAtLog ?? (r.overageRate ?? 65),
      }
    }
  }
  return effectiveTerms(r, cycle.start)
}

const CLEAR_PENDING = {
  pendingTier: null,
  pendingMonthlyFee: null,
  pendingHoursPerMonth: null,
  pendingOverageRate: null,
  pendingEffectiveFrom: null,
}

/**
 * Lazily reconcile a retainer against the clock: promote a due scheduled change into
 * the current terms, or flip to inactive once a scheduled deactivation date passes.
 * Returns the settled doc (already persisted if anything changed). No cron needed.
 */
async function settleRetainer(
  payload: Awaited<ReturnType<typeof getPayload>>,
  retainer: RetainerDoc,
  nowIso: string,
): Promise<RetainerDoc> {
  // Scoping retainers carry no anchor, no pending change, and no deactivation date —
  // there is nothing for the clock to promote or expire.
  if (isScoping(retainer)) return retainer

  const updates: Record<string, unknown> = {}
  const deactivateOn = iso(retainer.deactivateOn)
  const pendingFrom = iso(retainer.pendingEffectiveFrom)

  if (deactivateOn && nowIso >= deactivateOn) {
    updates.status = 'inactive'
    updates.deactivateOn = null
    Object.assign(updates, CLEAR_PENDING)
  } else if (pendingFrom && nowIso >= pendingFrom) {
    if (retainer.pendingTier != null) updates.tier = retainer.pendingTier
    if (retainer.pendingMonthlyFee != null) updates.monthlyFee = retainer.pendingMonthlyFee
    if (retainer.pendingHoursPerMonth != null) updates.hoursPerMonth = retainer.pendingHoursPerMonth
    if (retainer.pendingOverageRate != null) updates.overageRate = retainer.pendingOverageRate
    Object.assign(updates, CLEAR_PENDING)
  }

  if (Object.keys(updates).length === 0) return retainer

  const settled = await payload.update({
    collection: 'retainers',
    id: retainer.id,
    data: updates as any,
  })
  return settled as unknown as RetainerDoc
}

/**
 * The client's current LIVE retainer (settled) — active, or still being scoped.
 * Null if there is none, or if the only one just expired. Scoping and active are
 * both "live" because a client can only have one engagement in flight at a time.
 */
async function loadLiveRetainer(
  payload: Awaited<ReturnType<typeof getPayload>>,
  clientAccountId: string,
  nowIso: string,
): Promise<RetainerDoc | null> {
  const { docs } = await payload.find({
    collection: 'retainers',
    where: {
      and: [{ clientAccount: { equals: clientAccountId } }, { status: { in: ['active', 'scoping'] } }],
    },
    // Active wins if both somehow exist — scoping sorts after it alphabetically.
    sort: 'status',
    limit: 1,
    depth: 0,
  })
  const raw = (docs[0] as RetainerDoc | undefined) ?? null
  if (!raw) return null
  const settled = await settleRetainer(payload, raw, nowIso)
  return settled.status === 'active' || settled.status === 'scoping' ? settled : null
}

// ── Reads ────────────────────────────────────────────────────────────────────────

/**
 * The client's active retainer plus one billing cycle's entries and totals. `refDate`
 * is any date inside the cycle you want (defaults to now) — used by the cycle navigator.
 * Returns logged entries and draft (planned) entries separately. Staff only.
 */
export async function getRetainerSummary(clientAccountId: string, refDate?: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!clientAccountId) return { success: false as const, error: 'A client is required' }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const retainer = await loadLiveRetainer(payload, clientAccountId, now)

    if (!retainer) {
      return {
        success: true as const,
        retainer: null,
        cycle: null,
        terms: null,
        logged: [] as TimeEntryDoc[],
        drafts: [] as TimeEntryDoc[],
        totals: computeTotals([], 0, 65),
        scheduled: null,
        client: null as RetainerClientInfo | null,
        cycleInvoice: null as RetainerCycleInvoice | null,
        nextCycle: null as RetainerNextCycle | null,
        pitch: null as RetainerPitch | null,
        proposal: null as RetainerProposalTerms | null,
      }
    }

    // ── Scoping: no anchor, so no cycle to slice by ────────────────────────────
    // Return the whole pitch instead — every planned and completed item logged since
    // scoping began. Null cycle/terms is what keeps this out of the billing paths
    // (see getRetainerBillingModel, which refuses without them).
    if (isScoping(retainer)) {
      const [{ docs: scopeDocs }, scopeAccount] = await Promise.all([
        payload.find({
          collection: 'retainer-time-entries',
          where: { retainer: { equals: retainer.id } },
          sort: '-date',
          depth: 0,
          limit: 500,
        }),
        payload.findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 }).catch(() => null),
      ])
      const scopeAll = scopeDocs as TimeEntryDoc[]
      const scopeLogged = scopeAll.filter((e) => e.status !== 'draft')
      const scopeDrafts = scopeAll.filter((e) => e.status === 'draft')
      return {
        success: true as const,
        retainer,
        cycle: null,
        terms: null,
        logged: scopeLogged,
        drafts: scopeDrafts,
        totals: computeTotals(scopeLogged, 0, retainer.overageRate ?? 65),
        scheduled: null,
        client: scopeAccount
          ? {
              name: (scopeAccount as any).name ?? 'Client',
              company: ((scopeAccount as any).company ?? null) as string | null,
              email: ((scopeAccount as any).email ?? null) as string | null,
            }
          : null,
        cycleInvoice: null as RetainerCycleInvoice | null,
        nextCycle: null as RetainerNextCycle | null,
        pitch: computePitch(scopeDrafts, scopeLogged),
        proposal: proposalTermsOf(retainer),
      }
    }

    const cycle = cycleFor(anchorOf(retainer), refDate ? new Date(refDate).toISOString() : now)
    // Retainers bill a month ahead, so the close-out flow always needs the next window.
    const nextCycle = cycleFor(anchorOf(retainer), cycle.end)

    const [{ docs }, account, { docs: invoiceOrders }] = await Promise.all([
      payload.find({
        collection: 'retainer-time-entries',
        where: {
          and: [
            { clientAccount: { equals: clientAccountId } },
            { date: { greater_than_equal: cycle.start } },
            { date: { less_than: cycle.end } },
          ],
        },
        sort: '-date',
        depth: 0,
        limit: 500,
      }),
      payload.findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 }).catch(() => null),
      // The orders billed for this cycle AND the next one, in one query.
      payload.find({
        collection: 'orders',
        where: {
          and: [
            { retainerRef: { equals: retainer.id } },
            { retainerCycleStart: { in: [cycle.start, nextCycle.start] } },
            { status: { not_equals: 'cancelled' } },
          ],
        },
        sort: '-createdAt',
        depth: 0,
        limit: 10,
      }),
    ])
    const all = docs as TimeEntryDoc[]
    const logged = all.filter((e) => e.status !== 'draft')
    const drafts = all.filter((e) => e.status === 'draft')

    type OrderRow = { id: string; orderNumber: string; status: 'pending' | 'paid' | 'cancelled'; amount: number; stripeInvoiceUrl?: string | null; createdAt: string; retainerCycleStart?: string | null }
    const toCycleInvoice = (o: OrderRow | undefined): RetainerCycleInvoice | null =>
      o
        ? {
            orderId: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            amount: o.amount,
            stripeInvoiceUrl: o.stripeInvoiceUrl ?? null,
            createdAt: o.createdAt,
          }
        : null
    // Match orders to a cycle by their stored start (normalize both to a day key).
    const dayKey = (v: string | null | undefined) => (v ? String(new Date(v).toISOString()).slice(0, 10) : '')
    const orders = invoiceOrders as OrderRow[]
    const cycleInvoice = toCycleInvoice(orders.find((o) => dayKey(o.retainerCycleStart) === dayKey(cycle.start)))
    const nextInvoice = toCycleInvoice(orders.find((o) => dayKey(o.retainerCycleStart) === dayKey(nextCycle.start)))

    const client: RetainerClientInfo | null = account
      ? {
          name: (account as any).name ?? 'Client',
          company: ((account as any).company ?? null) as string | null,
          email: ((account as any).email ?? null) as string | null,
        }
      : null
    const nextCycleInfo: RetainerNextCycle = {
      start: nextCycle.start,
      label: nextCycle.label,
      monthLabel: cycleMonthName(nextCycle.start),
      invoice: nextInvoice,
    }

    const terms = termsForCycle(retainer, cycle, logged, now)
    const scheduled: RetainerScheduled = {
      deactivateOn: iso(retainer.deactivateOn),
      pendingEffectiveFrom: iso(retainer.pendingEffectiveFrom),
      pending: retainer.pendingEffectiveFrom
        ? {
            tier: retainer.pendingTier,
            monthlyFee: retainer.pendingMonthlyFee,
            hoursPerMonth: retainer.pendingHoursPerMonth,
            overageRate: retainer.pendingOverageRate,
          }
        : null,
    }

    return {
      success: true as const,
      retainer,
      cycle,
      terms,
      logged,
      drafts,
      totals: computeTotals(logged, terms.hoursPerMonth, terms.overageRate),
      scheduled,
      client,
      cycleInvoice,
      nextCycle: nextCycleInfo,
      pitch: null as RetainerPitch | null,
      proposal: null as RetainerProposalTerms | null,
    }
  } catch (error) {
    console.error('[getRetainerSummary]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load retainer' }
  }
}

// ── Portfolio ──────────────────────────────────────────────────────────────────

export type RetainerHealth = 'healthy' | 'warning' | 'over' | 'open' | 'scoping'

export interface RetainerPortfolioRow {
  clientAccountId: string
  clientName: string
  clientCompany: string | null
  retainerId: string
  tier: RetainerTier
  used: number
  cap: number
  pct: number // 0–100, clamped
  overageHours: number
  overageAmount: number
  remaining: number
  daysLeft: number // days remaining in the current cycle (0 while scoping)
  cycleLabel: string
  deactivateOn: string | null
  health: RetainerHealth
  /** Set only on scoping rows — the pitch waiting to be priced. */
  pitch: RetainerPitch | null
  /** Set only on scoping rows — when the proposal was last sent, if ever. */
  proposalSentAt: string | null
}

// Scoping sits last: it is a to-do ("price this"), not a burn problem.
const HEALTH_RANK: Record<RetainerHealth, number> = { over: 0, warning: 1, healthy: 2, open: 3, scoping: 4 }

/**
 * Every active retainer with its current-cycle burn — the manager's book at a glance.
 * Sorted most-urgent first (over cap → near cap → healthy), then by days left. Staff only.
 */
export async function getRetainerPortfolio() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const nowMs = Date.parse(now)

    const { docs } = await payload.find({
      collection: 'retainers',
      where: { status: { in: ['active', 'scoping'] } },
      limit: 200,
      depth: 0,
    })

    // Settle each against the clock (promote pending terms / flip due deactivations),
    // then drop any that just expired. Scoping rows settle to themselves.
    const settled = (
      await Promise.all(
        (docs as RetainerDoc[]).map(async (r) => {
          const s = await settleRetainer(payload, r, now)
          return s.status === 'active' || s.status === 'scoping' ? s : null
        }),
      )
    ).filter(Boolean) as RetainerDoc[]

    if (settled.length === 0) return { success: true as const, rows: [] as RetainerPortfolioRow[] }

    // One query for the client names/companies these retainers point at.
    const clientIds = [...new Set(settled.map((r) => (typeof r.clientAccount === 'object' ? r.clientAccount.id : r.clientAccount)))]
    const { docs: accounts } = await payload.find({
      collection: 'client-accounts',
      where: { id: { in: clientIds } },
      depth: 0,
      limit: clientIds.length,
    })
    const nameById = new Map(accounts.map((a: any) => [a.id, { name: a.name as string, company: (a.company ?? null) as string | null }]))

    const rows = await Promise.all(
      settled.map(async (r): Promise<RetainerPortfolioRow> => {
        const clientAccountId = typeof r.clientAccount === 'object' ? r.clientAccount.id : r.clientAccount

        // ── Scoping row: no cycle, so report the pitch waiting to be priced ─────
        if (isScoping(r)) {
          const { docs: scopeEntries } = await payload.find({
            collection: 'retainer-time-entries',
            where: { retainer: { equals: r.id } },
            depth: 0,
            limit: 500,
          })
          const all = scopeEntries as TimeEntryDoc[]
          const pitch = computePitch(
            all.filter((e) => e.status === 'draft'),
            all.filter((e) => e.status !== 'draft'),
          )
          const scopeAcct = nameById.get(clientAccountId)
          return {
            clientAccountId,
            clientName: scopeAcct?.name ?? 'Client',
            clientCompany: scopeAcct?.company ?? null,
            retainerId: r.id,
            tier: r.tier,
            used: pitch.doneHours,
            cap: 0,
            pct: 0,
            overageHours: 0,
            overageAmount: 0,
            remaining: 0,
            daysLeft: 0,
            cycleLabel: 'Not started',
            deactivateOn: null,
            health: 'scoping',
            pitch,
            proposalSentAt: iso(r.proposalSentAt),
          }
        }

        const cycle = cycleFor(anchorOf(r), now)
        const terms = effectiveTerms(r, cycle.start)

        const { docs: entries } = await payload.find({
          collection: 'retainer-time-entries',
          where: {
            and: [
              { clientAccount: { equals: clientAccountId } },
              { date: { greater_than_equal: cycle.start } },
              { date: { less_than: cycle.end } },
            ],
          },
          depth: 0,
          limit: 500,
        })
        const logged = (entries as TimeEntryDoc[]).filter((e) => e.status !== 'draft')
        const totals = computeTotals(logged, terms.hoursPerMonth, terms.overageRate)

        const pct = totals.cap > 0 ? Math.min(100, Math.round((totals.used / totals.cap) * 100)) : 0
        const daysLeft = Math.max(0, Math.ceil((Date.parse(cycle.end) - nowMs) / 86_400_000))
        const health: RetainerHealth =
          totals.cap <= 0 ? 'open'
            : totals.overageHours > 0 ? 'over'
            : pct >= 80 ? 'warning'
            : 'healthy'
        const acct = nameById.get(clientAccountId)

        return {
          clientAccountId,
          clientName: acct?.name ?? 'Client',
          clientCompany: acct?.company ?? null,
          retainerId: r.id,
          tier: terms.tier,
          used: totals.used,
          cap: totals.cap,
          pct,
          overageHours: totals.overageHours,
          overageAmount: totals.overageAmount,
          remaining: totals.remaining,
          daysLeft,
          cycleLabel: cycle.label,
          deactivateOn: iso(r.deactivateOn),
          health,
          pitch: null,
          proposalSentAt: null,
        }
      }),
    )

    rows.sort((a, b) => {
      if (HEALTH_RANK[a.health] !== HEALTH_RANK[b.health]) return HEALTH_RANK[a.health] - HEALTH_RANK[b.health]
      if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft
      return a.clientName.localeCompare(b.clientName)
    })

    return { success: true as const, rows }
  } catch (error) {
    console.error('[getRetainerPortfolio]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load portfolio' }
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────────

/**
 * Create a client's retainer, or change an existing one.
 *
 * `mode: 'scope'` creates it in the SCOPING state instead: no fee, no hour cap, no
 * cycle anchor. Staff then pitch planned and completed work against it and set
 * pricing afterwards via `activateRetainerPlan`.
 *
 * Editing an ACTIVE retainer's terms schedules them for the next billing cycle
 * (pending slot); notes/start date apply immediately. Editing a SCOPING retainer
 * applies everything at once — nothing is billing yet, so there is no cycle to
 * defer to. Staff only.
 */
export async function setRetainer(input: {
  clientAccountId: string
  tier: RetainerTier
  monthlyFee?: number | null
  hoursPerMonth?: number | null
  overageRate?: number | null
  startDate?: string | null
  notes?: string | null
  scopeSummary?: string | null
  /** 'scope' defers pricing; 'plan' (default) sets terms and activates immediately. */
  mode?: 'plan' | 'scope'
  retainerId?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.clientAccountId) return { success: false as const, error: 'A client is required' }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const overageRate = input.overageRate ?? 65

    // Resolve an existing ACTIVE retainer (explicit id or the client's active one).
    let existing: RetainerDoc | null = null
    if (input.retainerId) {
      existing = (await payload
        .findByID({ collection: 'retainers', id: input.retainerId, depth: 0 })
        .catch(() => null)) as RetainerDoc | null
    } else {
      const { docs } = await payload.find({
        collection: 'retainers',
        where: {
          and: [{ clientAccount: { equals: input.clientAccountId } }, { status: { in: ['active', 'scoping'] } }],
        },
        sort: 'status',
        limit: 1,
        depth: 0,
      })
      existing = (docs[0] as RetainerDoc | undefined) ?? null
    }
    if (existing) existing = await settleRetainer(payload, existing, now)

    // Nothing live for this client → create. Scope mode withholds fee/cap so no
    // cycle anchor is stamped and nothing can be billed until pricing is set.
    if (!existing || (existing.status !== 'active' && existing.status !== 'scoping')) {
      const scopeMode = input.mode === 'scope'
      const created = await payload.create({
        collection: 'retainers',
        data: {
          clientAccount: input.clientAccountId,
          tier: input.tier,
          status: scopeMode ? 'scoping' : 'active',
          monthlyFee: scopeMode ? undefined : (input.monthlyFee ?? undefined),
          hoursPerMonth: scopeMode ? undefined : (input.hoursPerMonth ?? undefined),
          overageRate,
          startDate: input.startDate ? dayToIso(input.startDate) : undefined,
          notes: input.notes ?? undefined,
          scopeSummary: input.scopeSummary ?? undefined,
        } as any,
      })
      return { success: true as const, id: created.id, scheduledFor: null as string | null }
    }

    // Editing a scoping retainer — nothing is billing, so everything applies now.
    if (existing.status === 'scoping') {
      await payload.update({
        collection: 'retainers',
        id: existing.id,
        data: {
          tier: input.tier,
          startDate: input.startDate ? dayToIso(input.startDate) : undefined,
          notes: input.notes ?? undefined,
          scopeSummary: input.scopeSummary ?? undefined,
        } as any,
      })
      return { success: true as const, id: existing.id, scheduledFor: null as string | null }
    }

    // Editing an active retainer: notes/start date now; term changes next cycle.
    const termsChanged =
      input.tier !== existing.tier ||
      (input.monthlyFee ?? null) !== (existing.monthlyFee ?? null) ||
      (input.hoursPerMonth ?? null) !== (existing.hoursPerMonth ?? null) ||
      overageRate !== (existing.overageRate ?? 65)

    const data: Record<string, unknown> = {
      startDate: input.startDate ? dayToIso(input.startDate) : undefined,
      notes: input.notes ?? undefined,
      scopeSummary: input.scopeSummary ?? undefined,
    }

    let scheduledFor: string | null = null
    if (termsChanged) {
      scheduledFor = nextCycleStart(anchorOf(existing), now)
      data.pendingTier = input.tier
      data.pendingMonthlyFee = input.monthlyFee ?? null
      data.pendingHoursPerMonth = input.hoursPerMonth ?? null
      data.pendingOverageRate = overageRate
      data.pendingEffectiveFrom = scheduledFor
    }

    await payload.update({ collection: 'retainers', id: existing.id, data: data as any })
    return { success: true as const, id: existing.id, scheduledFor }
  } catch (error) {
    console.error('[setRetainer]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to save retainer' }
  }
}

/** Save the pitch headline on its own — the scoping view autosaves it. Staff only. */
export async function setRetainerScope(input: { retainerId: string; scopeSummary: string }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId) return { success: false as const, error: 'No retainer selected' }

    const payload = await getPayload({ config })
    await payload.update({
      collection: 'retainers',
      id: input.retainerId,
      data: { scopeSummary: input.scopeSummary ?? '' } as any,
    })
    return { success: true as const }
  } catch (error) {
    console.error('[setRetainerScope]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to save scope' }
  }
}

/**
 * Price a scoped engagement and start it — the "set pricing after the fact" step.
 *
 * Writes the terms staff settled on, flips `scoping → active`, and stamps `activatedAt`
 * to the chosen start day, which becomes the billing-cycle anchor. Everything pitched
 * during scoping is dated before that anchor, so by default it would fall outside cycle
 * one; `carryWork` re-dates it onto the anchor day so the first cycle opens with the
 * planned work already on the board (and, optionally, the completed hours counted).
 *
 * Idempotent by guard: refuses unless the retainer is still scoping. Staff only.
 */
export async function activateRetainerPlan(input: {
  retainerId: string
  tier: RetainerTier
  monthlyFee: number
  hoursPerMonth: number
  overageRate?: number | null
  /** `YYYY-MM-DD` — the first cycle's start and the anchor day. Defaults to the
   *  proposed start if one was quoted, else today. */
  startDate?: string | null
  /** What to carry into cycle one. Planned work almost always should. */
  carryWork?: { planned?: boolean; done?: boolean }
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId) return { success: false as const, error: 'No retainer selected' }
    if (!(input.hoursPerMonth >= 0)) return { success: false as const, error: 'Monthly hours must be zero or more' }
    if (!(input.monthlyFee >= 0)) return { success: false as const, error: 'Monthly fee must be zero or more' }

    const payload = await getPayload({ config })
    const existing = (await payload
      .findByID({ collection: 'retainers', id: input.retainerId, depth: 0 })
      .catch(() => null)) as RetainerDoc | null
    if (!existing) return { success: false as const, error: 'Retainer not found' }
    if (!isScoping(existing)) {
      return { success: false as const, error: 'This retainer is already on a plan' }
    }

    // The anchor: the chosen start day at noon UTC, else the date quoted on the
    // proposal, else today. Everything downstream (cycle windows, invoicing, pending
    // changes) hangs off this one date.
    const anchor = input.startDate
      ? dayToIso(input.startDate)
      : (iso(existing.proposedStartDate) ?? new Date().toISOString())

    await payload.update({
      collection: 'retainers',
      id: existing.id,
      data: {
        tier: input.tier,
        status: 'active',
        monthlyFee: input.monthlyFee,
        hoursPerMonth: input.hoursPerMonth,
        overageRate: input.overageRate ?? 65,
        startDate: anchor,
        activatedAt: anchor,
        // The offer has been accepted into the live terms — retire the proposal slot
        // so a stale quote can never be re-sent against a running retainer.
        proposedTier: null,
        proposedMonthlyFee: null,
        proposedHoursPerMonth: null,
        proposedOverageRate: null,
        proposedStartDate: null,
        ...CLEAR_PENDING,
      } as any,
    })

    // ── Place the pitched work relative to the new anchor ──────────────────────
    // Scoping work is dated whenever it happened, which may be before OR on the anchor
    // day, so neither outcome can be left to chance: carried entries are re-dated ONTO
    // the anchor (inside cycle one), and excluded entries are pushed to the day before
    // cycle one opens. Without that second move, work logged on the start day itself
    // would count against the cap no matter what staff chose.
    const carryPlanned = input.carryWork?.planned ?? true
    const carryDone = input.carryWork?.done ?? false
    const cycleOneStart = cycleFor(anchor, anchor).start
    const dayBefore = new Date(Date.parse(cycleOneStart) - 86_400_000 / 2).toISOString() // noon prior day

    const { docs } = await payload.find({
      collection: 'retainer-time-entries',
      where: { retainer: { equals: existing.id } },
      depth: 0,
      limit: 500,
    })

    let carried = 0
    for (const entry of docs as TimeEntryDoc[]) {
      const carry = entry.status === 'draft' ? carryPlanned : carryDone
      const entryIso = iso(entry.date)
      const insideCycleOne = Boolean(entryIso && entryIso >= cycleOneStart)

      // Already where it belongs — don't churn the record.
      if (carry && insideCycleOne) { carried++; continue }
      if (!carry && !insideCycleOne) continue

      await payload.update({
        collection: 'retainer-time-entries',
        id: entry.id,
        data: {
          date: carry ? anchor : dayBefore,
          // Logged hours entering cycle one freeze onto the terms just agreed.
          ...(carry && entry.status !== 'draft'
            ? {
                capAtLog: input.hoursPerMonth,
                overageRateAtLog: input.overageRate ?? 65,
                feeAtLog: input.monthlyFee,
                tierAtLog: input.tier,
              }
            : {}),
        } as any,
      })
      if (carry) carried++
    }

    return { success: true as const, id: existing.id, activatedAt: anchor, carried }
  } catch (error) {
    console.error('[activateRetainerPlan]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to start retainer' }
  }
}

// ── Proposal — the priced document sent before the retainer starts ────────────

/** The terms being offered, resolved from the stored proposal with sane fallbacks. */
export interface RetainerProposalTerms {
  tier: RetainerTier
  monthlyFee: number
  hoursPerMonth: number
  overageRate: number
  startDate: string | null
  includesCompletedWork: boolean
  note: string | null
  sentAt: string | null
  sentTo: string[]
}

/** Read the stored proposal off a retainer, filling gaps from its live/nominal values.
 *  Internal: exporting it from a 'use server' module would publish it as an action. */
function proposalTermsOf(r: RetainerDoc): RetainerProposalTerms {
  return {
    tier: (r.proposedTier ?? r.tier ?? 'basic') as RetainerTier,
    monthlyFee: r.proposedMonthlyFee ?? r.monthlyFee ?? 0,
    hoursPerMonth: r.proposedHoursPerMonth ?? r.hoursPerMonth ?? 0,
    overageRate: r.proposedOverageRate ?? r.overageRate ?? 65,
    startDate: iso(r.proposedStartDate),
    includesCompletedWork: Boolean(r.proposalIncludesCompletedWork),
    note: r.proposalNote ?? null,
    sentAt: iso(r.proposalSentAt),
    sentTo: (r.proposalSentTo ?? []).map((x) => x?.email ?? '').filter(Boolean),
  }
}

/**
 * Save the priced offer WITHOUT starting the retainer. Terms land in the proposal
 * slot, never the live fields, so nothing becomes billable by saving a quote. Staff only.
 */
export async function setRetainerProposal(input: {
  retainerId: string
  tier: RetainerTier
  monthlyFee: number
  hoursPerMonth: number
  overageRate?: number | null
  startDate?: string | null
  includesCompletedWork?: boolean
  note?: string | null
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId) return { success: false as const, error: 'No retainer selected' }
    if (!(input.hoursPerMonth >= 0)) return { success: false as const, error: 'Monthly hours must be zero or more' }
    if (!(input.monthlyFee >= 0)) return { success: false as const, error: 'Monthly fee must be zero or more' }

    const payload = await getPayload({ config })
    await payload.update({
      collection: 'retainers',
      id: input.retainerId,
      data: {
        proposedTier: input.tier,
        proposedMonthlyFee: input.monthlyFee,
        proposedHoursPerMonth: input.hoursPerMonth,
        proposedOverageRate: input.overageRate ?? 65,
        proposedStartDate: input.startDate ? dayToIso(input.startDate) : null,
        proposalIncludesCompletedWork: Boolean(input.includesCompletedWork),
        proposalNote: input.note ?? null,
      } as any,
    })
    return { success: true as const }
  } catch (error) {
    console.error('[setRetainerProposal]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to save proposal' }
  }
}

/**
 * Everything the proposal document renders, assembled once so the PDF route and the
 * email send can never drift apart. Works only while scoping — a started retainer
 * bills off its live terms and has statements instead. Staff only.
 */
export async function getRetainerProposalModel(retainerId: string) {
  const user = await getCurrentUser()
  if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
  if (!retainerId) return { success: false as const, error: 'No retainer selected' }

  const payload = await getPayload({ config })
  const retainer = (await payload
    .findByID({ collection: 'retainers', id: retainerId, depth: 0 })
    .catch(() => null)) as RetainerDoc | null
  if (!retainer) return { success: false as const, error: 'Retainer not found' }

  const clientAccountId =
    typeof retainer.clientAccount === 'object' ? retainer.clientAccount.id : retainer.clientAccount
  const [{ docs }, account] = await Promise.all([
    payload.find({
      collection: 'retainer-time-entries',
      where: { retainer: { equals: retainer.id } },
      sort: 'date',
      depth: 0,
      limit: 500,
    }),
    payload.findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 }).catch(() => null),
  ])
  const all = docs as TimeEntryDoc[]
  const completed = all.filter((e) => e.status !== 'draft')
  const planned = all.filter((e) => e.status === 'draft')

  return {
    success: true as const,
    retainer,
    clientAccountId,
    terms: proposalTermsOf(retainer),
    client: {
      name: ((account as any)?.name ?? 'Client') as string,
      company: (((account as any)?.company ?? null) as string | null),
      email: (((account as any)?.email ?? null) as string | null),
    },
    completed,
    planned,
    pitch: computePitch(planned, completed),
  }
}

/** Shape the model into the PDF builder's input — shared by the route and the email. */
function proposalPdfData(m: Extract<Awaited<ReturnType<typeof getRetainerProposalModel>>, { success: true }>) {
  const { terms, client, completed, planned, retainer } = m
  return {
    clientName: client.name,
    clientCompany: client.company,
    tierLabel: TIER_LABEL[terms.tier],
    monthlyFee: terms.monthlyFee,
    hoursPerMonth: terms.hoursPerMonth,
    overageRate: terms.overageRate,
    startLabel: terms.startDate
      ? new Date(terms.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
      : null,
    scopeSummary: retainer.scopeSummary ?? null,
    note: terms.note,
    completed: completed.map((e) => ({
      date: e.date,
      description: e.description ?? '',
      category: e.category ?? 'work',
      hours: e.hours ?? 0,
    })),
    planned: planned.map((e) => ({
      description: e.description ?? '',
      category: e.category ?? 'work',
      priority: e.priority ?? 'medium',
      hours: e.hours ?? 0,
    })),
    includesCompletedWork: terms.includesCompletedWork,
    generatedOn: new Date().toISOString(),
  }
}

/**
 * Build the proposal PDF for a retainer. Shared by the download route and the email.
 * Exported from a 'use server' module, so it is a public endpoint — the staff check
 * inside getRetainerProposalModel is what gates it, not the calling route.
 */
export async function buildProposalPdfFor(retainerId: string) {
  const model = await getRetainerProposalModel(retainerId)
  if (!model.success) return { success: false as const, error: model.error }
  const bytes = await buildRetainerProposalPdf(proposalPdfData(model))
  return { success: true as const, bytes, model }
}

/**
 * Email the proposal to the client with the PDF attached, and stamp when/to whom.
 * Sending does NOT start the retainer — activation stays a separate, deliberate step.
 * Staff only.
 */
export async function sendRetainerProposalEmail(input: {
  retainerId: string
  recipients?: string[]
  message?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId) return { success: false as const, error: 'No retainer selected' }

    const payload = await getPayload({ config })
    const model = await getRetainerProposalModel(input.retainerId)
    if (!model.success) return { success: false as const, error: model.error }
    if (!isScoping(model.retainer)) {
      return { success: false as const, error: 'This retainer has already started — send a statement instead' }
    }

    const { terms, client, pitch } = model
    if (!(terms.hoursPerMonth > 0) || !(terms.monthlyFee > 0)) {
      return { success: false as const, error: 'Set the pricing before sending the proposal' }
    }

    const recipients = cleanRecipients(input.recipients, client.email)
    if (recipients.length === 0) return { success: false as const, error: 'Add at least one recipient email' }

    // The PDF is the document — if it fails to build there is nothing worth sending,
    // so unlike the recap flow this is NOT best-effort.
    let attachment: EmailAttachment
    try {
      const bytes = await buildRetainerProposalPdf(proposalPdfData(model))
      attachment = {
        filename: `ORCACLUB-Retainer-Proposal-${client.company || client.name}.pdf`.replace(/[^\w.\- ]+/g, ''),
        content: Buffer.from(bytes).toString('base64'),
        encoding: 'base64',
        contentType: 'application/pdf',
      }
    } catch (e) {
      console.error('[sendRetainerProposalEmail] PDF build failed:', e)
      return { success: false as const, error: 'Could not build the proposal PDF' }
    }

    const emailData = {
      clientName: client.name,
      clientCompany: client.company,
      tierLabel: TIER_LABEL[terms.tier],
      monthlyFee: terms.monthlyFee,
      hoursPerMonth: terms.hoursPerMonth,
      overageRate: terms.overageRate,
      startLabel: terms.startDate
        ? new Date(terms.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
        : null,
      scopeSummary: model.retainer.scopeSummary ?? null,
      completedHours: pitch.doneHours,
      plannedHours: pitch.plannedHours,
      includesCompletedWork: terms.includesCompletedWork,
      customMessage: input.message?.trim() || terms.note || undefined,
    }

    try {
      await payload.sendEmail({
        to: recipients.join(', '),
        from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
        subject: retainerProposalEmailSubject(emailData),
        html: generateRetainerProposalEmail(emailData),
        text: generateRetainerProposalEmailText(emailData),
        attachments: [attachment],
      } as any)
    } catch (e) {
      console.error('[sendRetainerProposalEmail] Email failed:', e)
      return { success: false as const, error: 'Failed to send the proposal email' }
    }

    // Stamp the send only after it actually went out.
    const sentAt = new Date().toISOString()
    await payload.update({
      collection: 'retainers',
      id: input.retainerId,
      data: {
        proposalSentAt: sentAt,
        proposalSentTo: recipients.map((email) => ({ email })),
        ...(input.message?.trim() ? { proposalNote: input.message.trim() } : {}),
      } as any,
    })

    return { success: true as const, recipients, sentAt }
  } catch (error) {
    console.error('[sendRetainerProposalEmail]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to send proposal' }
  }
}

/**
 * Schedule deactivation / reactivate. Deactivating keeps the retainer active until the
 * end of the current cycle (`deactivateOn`), then it flips inactive on next access.
 * Reactivating cancels a pending deactivation, or restarts an already-inactive retainer
 * with a fresh cycle anchor. Staff only.
 */
export async function setRetainerActive(retainerId: string, active: boolean) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!retainerId) return { success: false as const, error: 'No retainer selected' }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const r = (await payload
      .findByID({ collection: 'retainers', id: retainerId, depth: 0 })
      .catch(() => null)) as RetainerDoc | null
    if (!r) return { success: false as const, error: 'Retainer not found' }

    if (!active) {
      const deactivateOn = nextCycleStart(anchorOf(r), now)
      await payload.update({ collection: 'retainers', id: retainerId, data: { deactivateOn } as any })
      return { success: true as const, deactivateOn }
    }

    // Reactivate.
    if (r.status === 'active') {
      // Just cancel a pending deactivation.
      await payload.update({ collection: 'retainers', id: retainerId, data: { deactivateOn: null } as any })
    } else {
      await payload.update({
        collection: 'retainers',
        id: retainerId,
        data: { status: 'active', activatedAt: now, deactivateOn: null, ...CLEAR_PENDING } as any,
      })
    }
    return { success: true as const, deactivateOn: null }
  } catch (error) {
    console.error('[setRetainerActive]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update retainer' }
  }
}

/**
 * Re-anchor a retainer's billing cycle to a new date. The cycle anchor is normally the
 * auto-stamped `activatedAt` (read-only in admin); this deliberately rewrites it so staff
 * can correct or shift when cycles begin. Only the day-of-month matters for cycle math.
 *
 * NOTE: this re-dates history — past/current cycle windows shift, so already-logged time
 * entries may fall into a different cycle. The caller warns before invoking. Staff only.
 */
export async function setRetainerAnchor(retainerId: string, date: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!retainerId) return { success: false as const, error: 'No retainer selected' }
    const day = String(date).slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { success: false as const, error: 'A valid date is required' }

    const payload = await getPayload({ config })
    const r = (await payload
      .findByID({ collection: 'retainers', id: retainerId, depth: 0 })
      .catch(() => null)) as RetainerDoc | null
    if (!r) return { success: false as const, error: 'Retainer not found' }

    // Local API ignores the field's admin `readOnly` flag — the anchor is rewritten here.
    await payload.update({ collection: 'retainers', id: retainerId, data: { activatedAt: dayToIso(day) } as any })
    return { success: true as const, activatedAt: dayToIso(day) }
  } catch (error) {
    console.error('[setRetainerAnchor]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to re-anchor retainer' }
  }
}

/** Log actual hours against a retainer — freezes the terms in effect on that date. Staff only. */
export async function logHours(input: {
  retainerId: string
  clientAccountId: string
  date: string
  hours: number
  category?: TimeEntryCategory
  priority?: TimeEntryPriority
  description?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId) return { success: false as const, error: 'No retainer selected' }
    if (!input.date) return { success: false as const, error: 'A date is required' }
    if (!(input.hours > 0)) return { success: false as const, error: 'Hours must be greater than zero' }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const entryDate = dayToIso(input.date)

    const raw = (await payload
      .findByID({ collection: 'retainers', id: input.retainerId, depth: 0 })
      .catch(() => null)) as RetainerDoc | null
    const retainer = raw ? await settleRetainer(payload, raw, now) : null
    const terms = retainer ? effectiveTerms(retainer, entryDate) : null

    const entry = await payload.create({
      collection: 'retainer-time-entries',
      data: {
        retainer: input.retainerId,
        clientAccount: input.clientAccountId,
        date: entryDate,
        hours: input.hours,
        status: 'logged',
        category: input.category ?? 'work',
        priority: input.priority ?? 'medium',
        description: input.description || undefined,
        loggedBy: user.id,
        capAtLog: terms?.hoursPerMonth ?? undefined,
        overageRateAtLog: terms?.overageRate ?? undefined,
        feeAtLog: terms?.monthlyFee ?? undefined,
        tierAtLog: terms?.tier ?? undefined,
      } as any,
    })

    return { success: true as const, id: entry.id, entry: entry as unknown as TimeEntryDoc }
  } catch (error) {
    console.error('[logHours]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to log hours' }
  }
}

/**
 * Create a projected (draft) work item — planned work, optionally carrying an hour
 * ESTIMATE. `date` places it in a billing cycle (use a next-cycle date to plan ahead);
 * while scoping there is no cycle, and the estimates are what size the plan. Staff only.
 */
export async function createDraft(input: {
  retainerId: string
  clientAccountId: string
  date: string
  description: string
  category?: TimeEntryCategory
  priority?: TimeEntryPriority
  /** Estimated hours. Drafts never count against the cap — only logged entries do. */
  hours?: number
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId) return { success: false as const, error: 'No retainer selected' }
    if (!input.date) return { success: false as const, error: 'A date is required' }
    if (!input.description?.trim()) return { success: false as const, error: 'Describe the planned work' }

    const payload = await getPayload({ config })
    const entry = await payload.create({
      collection: 'retainer-time-entries',
      data: {
        retainer: input.retainerId,
        clientAccount: input.clientAccountId,
        date: dayToIso(input.date),
        hours: input.hours != null && input.hours > 0 ? input.hours : 0,
        status: 'draft',
        category: input.category ?? 'work',
        priority: input.priority ?? 'medium',
        completion: 'incomplete',
        description: input.description.trim(),
        loggedBy: user.id,
      } as any,
    })

    return { success: true as const, id: entry.id, entry: entry as unknown as TimeEntryDoc }
  } catch (error) {
    console.error('[createDraft]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to create draft' }
  }
}

/**
 * Edit an entry in place — description, date, category, priority, hours, and (for planned
 * work) completion status. Editing does NOT change an entry's kind: a planned/draft item
 * stays planned even with hours set, and a logged entry stays logged. To turn planned work
 * into counted time, use `logHours` (which creates a separate logged entry and leaves the
 * plan in place — see logPlannedHours). Staff only.
 */
export async function updateTimeEntry(input: {
  id: string
  date?: string
  hours?: number
  category?: TimeEntryCategory
  priority?: TimeEntryPriority
  completion?: TimeEntryCompletion
  description?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.id) return { success: false as const, error: 'No entry selected' }

    const payload = await getPayload({ config })
    const entry = (await payload
      .findByID({ collection: 'retainer-time-entries', id: input.id, depth: 0 })
      .catch(() => null)) as TimeEntryDoc | null
    if (!entry) return { success: false as const, error: 'Entry not found' }

    const data: Record<string, unknown> = {}
    if (input.date !== undefined) data.date = dayToIso(input.date)
    if (input.category !== undefined) data.category = input.category
    if (input.priority !== undefined) data.priority = input.priority
    if (input.completion !== undefined) data.completion = input.completion
    if (input.description !== undefined) data.description = input.description
    if (input.hours !== undefined) data.hours = input.hours

    const updated = await payload.update({ collection: 'retainer-time-entries', id: input.id, data: data as any })
    return { success: true as const, id: input.id, entry: updated as unknown as TimeEntryDoc }
  } catch (error) {
    console.error('[updateTimeEntry]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update entry' }
  }
}

/**
 * Log actual hours against a planned (draft) item WITHOUT consuming it. Creates a separate
 * logged entry (counted against the cap, terms frozen on its date) and marks the plan
 * complete, so the planned-work checklist keeps a permanent record. Staff only.
 */
export async function logPlannedHours(input: {
  draftId: string
  hours: number
  date?: string
  category?: TimeEntryCategory
  priority?: TimeEntryPriority
  description?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.draftId) return { success: false as const, error: 'No planned item selected' }
    if (!(input.hours > 0)) return { success: false as const, error: 'Hours must be greater than zero' }

    const payload = await getPayload({ config })
    const draft = (await payload
      .findByID({ collection: 'retainer-time-entries', id: input.draftId, depth: 0 })
      .catch(() => null)) as TimeEntryDoc | null
    if (!draft) return { success: false as const, error: 'Planned item not found' }

    const retainerId = typeof draft.retainer === 'object' ? draft.retainer.id : draft.retainer
    const clientAccountId = typeof draft.clientAccount === 'object' ? draft.clientAccount.id : draft.clientAccount

    // Create the logged entry — defaults come from the plan (incl. its date so the time
    // lands in the same cycle), overridable from the log dialog.
    const logged = await logHours({
      retainerId,
      clientAccountId,
      date: input.date ?? String(draft.date).slice(0, 10),
      hours: input.hours,
      category: input.category ?? (draft.category ?? 'work') as TimeEntryCategory,
      priority: input.priority ?? (draft.priority ?? 'medium') as TimeEntryPriority,
      description: input.description ?? draft.description ?? undefined,
    })
    if (!logged.success) return logged

    // Mark the plan complete — it stays in the planned list for tracking.
    await payload.update({
      collection: 'retainer-time-entries',
      id: input.draftId,
      data: { completion: 'complete' } as any,
    })

    return { success: true as const, id: logged.id }
  } catch (error) {
    console.error('[logPlannedHours]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to log planned hours' }
  }
}

const TIER_LABEL: Record<RetainerTier, string> = { basic: 'Basic', growth: 'Growth', enterprise: 'Enterprise' }

/**
 * Derive the default recap for a client's current (or `refDate`) billing cycle —
 * the pre-filled model the composer opens with. Numbers come straight from the
 * cycle summary; narrative fields start blank. Next-month priorities are seeded
 * from any planned (draft) items already sitting in the *next* cycle. Staff only.
 */
export async function getRecapModel(clientAccountId: string, refDate?: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!clientAccountId) return { success: false as const, error: 'A client is required' }

    const summary = await getRetainerSummary(clientAccountId, refDate)
    if (!summary.success) return { success: false as const, error: summary.error }
    if (!summary.retainer || !summary.cycle || !summary.terms) {
      return { success: false as const, error: 'No active retainer cycle to recap' }
    }

    const payload = await getPayload({ config })
    const account = await payload
      .findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 })
      .catch(() => null)

    // Group logged descriptions by category to seed each bucket's narrative.
    const loggedDescriptions: Partial<Record<TimeEntryCategory, string[]>> = {}
    for (const e of summary.logged) {
      if (!e.description) continue
      const cat = (e.category ?? 'work') as TimeEntryCategory
      ;(loggedDescriptions[cat] ??= []).push(e.description)
    }

    // Seed next-month priorities from planned items already sitting in the next cycle.
    let nextMonthPriorities: string[] = []
    const nextSummary = await getRetainerSummary(clientAccountId, summary.cycle.end)
    if (nextSummary.success) {
      nextMonthPriorities = nextSummary.drafts.map((d) => d.description ?? '').filter(Boolean)
    }

    const model = deriveRecapDefaults({
      clientName: account?.name ?? 'Client',
      clientCompany: account?.company ?? null,
      tier: summary.terms.tier,
      tierLabel: TIER_LABEL[summary.terms.tier],
      periodLabel: summary.cycle.label,
      monthlyFee: summary.terms.monthlyFee,
      hoursPerMonth: summary.terms.hoursPerMonth,
      hoursUsed: summary.totals.used,
      byCategory: summary.totals.byCategory,
      loggedCount: summary.logged.length,
      loggedDescriptions,
      nextMonthPriorities,
    })

    return {
      success: true as const,
      model,
      retainerId: summary.retainer.id,
      cycleStart: summary.cycle.start,
    }
  } catch (error) {
    console.error('[getRecapModel]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to build recap' }
  }
}

/** "July" for a cycle starting Jul 10 — the invoice's display month is the cycle's start month. */
function cycleMonthName(cycleStartIso: string): string {
  return new Date(cycleStartIso).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
}

export interface RetainerBillingSide {
  cycleStart: string
  cycleLabel: string
  monthLabel: string
  tier: RetainerTier
  tierLabel: string
  hoursPerMonth: number
  monthlyFee: number
  invoice: RetainerCycleInvoice | null
}

/**
 * Everything the close-out UI needs in one read: the cycle being closed (current —
 * its hours + overage feed the recap and the overage line) and the cycle being billed
 * (next — its effective fee + planned work feed the invoice). Staff only.
 */
export async function getRetainerBillingModel(clientAccountId: string, ref?: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!clientAccountId) return { success: false as const, error: 'A client is required' }

    const current = await getRetainerSummary(clientAccountId, ref)
    if (!current.success) return { success: false as const, error: current.error }
    if (!current.retainer || !current.cycle || !current.terms) {
      return { success: false as const, error: 'No active retainer cycle to bill' }
    }
    const next = await getRetainerSummary(clientAccountId, current.cycle.end)
    if (!next.success || !next.cycle || !next.terms) {
      return { success: false as const, error: 'Could not resolve next cycle' }
    }

    return {
      success: true as const,
      retainerId: current.retainer.id,
      client: current.client,
      current: {
        cycleStart: current.cycle.start,
        cycleLabel: current.cycle.label,
        monthLabel: cycleMonthName(current.cycle.start),
        tier: current.terms.tier,
        tierLabel: TIER_LABEL[current.terms.tier],
        hoursPerMonth: current.terms.hoursPerMonth,
        monthlyFee: current.terms.monthlyFee,
        invoice: current.cycleInvoice,
      } satisfies RetainerBillingSide,
      currentUsage: {
        hoursUsed: current.totals.used,
        overageHours: current.totals.overageHours,
        overageRate: current.terms.overageRate,
        overageAmount: current.totals.overageAmount,
        loggedCount: current.logged.length,
      },
      next: {
        cycleStart: next.cycle.start,
        cycleLabel: next.cycle.label,
        monthLabel: cycleMonthName(next.cycle.start),
        tier: next.terms.tier,
        tierLabel: TIER_LABEL[next.terms.tier],
        hoursPerMonth: next.terms.hoursPerMonth,
        monthlyFee: next.terms.monthlyFee,
        invoice: next.cycleInvoice,
      } satisfies RetainerBillingSide,
      nextPlanned: next.drafts.map((d) => d.description ?? '').filter(Boolean),
    }
  } catch (error) {
    console.error('[getRetainerBillingModel]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load billing model' }
  }
}

/** Normalize a recipient list — trimmed, de-duped, non-empty entries only. */
function cleanRecipients(list: string[] | undefined, fallback: string | null | undefined): string[] {
  const raw = list && list.length ? list : fallback ? [fallback] : []
  return [...new Set(raw.map((e) => e.trim()).filter(Boolean))]
}

/**
 * Bill NEXT month's retainer. `ref` points at the cycle being billed (the modal passes
 * next month); the base fee comes from that cycle's effective terms. The closing month's
 * overage is passed in explicitly (arrears) and added as a line. Creates the Stripe
 * invoice + linked Order (retainerRef + retainerCycleStart) and emails the invoice —
 * "August's Retainer" — with the month's planned work and an optional cover note. No PDFs
 * (those ride the separate recap email). Refuses a cycle that already has an order unless
 * `force`. Staff only.
 */
export async function sendRetainerInvoice(input: {
  retainerId: string
  clientAccountId: string
  /** Cycle to BILL (any date inside it) — the modal points this at next month. */
  ref?: string
  baseFee?: number
  /** Closing month's overage hours (arrears) — the modal passes the previous cycle's. */
  overageHours?: number
  overageRate?: number
  /** Overrides the computed fee + overage total as the invoice amount. */
  totalOverride?: number
  daysUntilDue?: number
  /** Recipients — defaults to the client account email. */
  recipients?: string[]
  /** Optional staff cover note rendered in the invoice email. */
  message?: string
  /** Planned-work lines shown in the email (defaults to the billed cycle's drafts). */
  plannedWork?: string[]
  /** Send even though this cycle already has an order. */
  force?: boolean
}) {
  // The billing package is created before the Stripe invoice — tracked here so a
  // mid-flow failure can remove it again (no orphaned client-facing documents).
  let billingPackageId: string | null = null
  let orderCreated = false
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId || !input.clientAccountId) return { success: false as const, error: 'A retainer is required' }

    const payload = await getPayload({ config })

    // ── The cycle being billed (next month) ──────────────────────────────────────
    const summary = await getRetainerSummary(input.clientAccountId, input.ref)
    if (!summary.success) return { success: false as const, error: summary.error }
    if (!summary.retainer || !summary.cycle || !summary.terms) {
      return { success: false as const, error: 'No active retainer cycle to invoice' }
    }
    const { cycle, terms } = summary

    if (summary.cycleInvoice && !input.force) {
      return {
        success: false as const,
        error: `${cycleMonthName(cycle.start)} is already invoiced (#${summary.cycleInvoice.orderNumber}).`,
        alreadyInvoiced: summary.cycleInvoice,
      }
    }

    // ── Numbers — computed defaults, staff-overridable ───────────────────────────
    const baseFee = input.baseFee ?? terms.monthlyFee
    const overageHours = input.overageHours ?? 0 // arrears — caller supplies the closing month's
    const overageRate = input.overageRate ?? terms.overageRate
    const overageAmount = Math.round(overageHours * overageRate * 100) / 100
    const computedTotal = Math.round((baseFee + overageAmount) * 100) / 100
    const total = input.totalOverride ?? computedTotal
    if (!(total > 0)) return { success: false as const, error: 'Invoice amount must be greater than zero' }

    const month = cycleMonthName(cycle.start)
    const clientName = summary.client?.name ?? 'Client'
    const recipients = cleanRecipients(input.recipients, summary.client?.email)
    if (recipients.length === 0) return { success: false as const, error: 'Add at least one recipient email' }
    const stripeEmail = summary.client?.email ?? recipients[0]

    // Line items in DOLLARS. When the total is overridden, collapse to one line at the
    // override so the Stripe invoice always sums to exactly what staff approved.
    const feeTitle = `${month} Retainer — ${TIER_LABEL[terms.tier]} (${terms.hoursPerMonth} hrs/mo)`
    const lines: { title: string; amount: number }[] =
      input.totalOverride != null && input.totalOverride !== computedTotal
        ? [{ title: `${month} Retainer — ${TIER_LABEL[terms.tier]}`, amount: total }]
        : [
            ...(baseFee > 0 ? [{ title: feeTitle, amount: baseFee }] : []),
            ...(overageAmount > 0
              ? [{ title: `Overage — ${fmtHrsLabel(overageHours)} hrs × $${overageRate}/hr`, amount: overageAmount }]
              : []),
          ]
    if (lines.length === 0) lines.push({ title: feeTitle, amount: total })

    const plannedWork = input.plannedWork ?? summary.drafts.map((d) => d.description ?? '').filter(Boolean)

    // ── Itemized work-hour lines — the closing cycle's logged entries, each valued
    // at the effective rate (fee ÷ cap), over-cap hours at the overage rate (running
    // split). Rendered at $0 on the order + package: the hours are covered by the
    // fee/overage lines, so totals still balance.
    const round2 = (n: number) => Math.round((n || 0) * 100) / 100
    const fmtEntryDay = (iso: string) =>
      new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    const prevRef = new Date(new Date(cycle.start).getTime() - 86_400_000).toISOString()
    const prevSummary = await getRetainerSummary(input.clientAccountId, prevRef)
    const workLines: { title: string; description: string; hours: number; value: number }[] = []
    if (prevSummary.success && prevSummary.cycle && prevSummary.terms) {
      const pTerms = prevSummary.terms
      const effRate = pTerms.hoursPerMonth > 0 ? pTerms.monthlyFee / pTerms.hoursPerMonth : 0
      let running = 0
      for (const e of [...prevSummary.logged].sort((a, b) => (a.date < b.date ? -1 : 1))) {
        const h = e.hours ?? 0
        const coveredH = round2(Math.max(0, Math.min(h, pTerms.hoursPerMonth - running)))
        const overH = round2(h - coveredH)
        running = round2(running + h)
        const value = round2(coveredH * effRate + overH * pTerms.overageRate)
        const calc = [
          coveredH > 0 ? `${coveredH}h × $${round2(effRate)}/hr` : null,
          overH > 0 ? `${overH}h × $${pTerms.overageRate}/hr overage` : null,
        ]
          .filter(Boolean)
          .join(' + ')
        const category = RECAP_CATEGORY_LABEL[(e.category ?? 'work') as TimeEntryCategory]
        workLines.push({
          title: `${fmtEntryDay(e.date)} — ${e.description?.trim() || category}`,
          description: `${h}h · ${category} · ${calc} = $${value}${overH > 0 ? '' : ' · included in retainer'}`,
          hours: h,
          value,
        })
      }
    }
    const workValue = round2(workLines.reduce((s, l) => s + l.value, 0))
    const prevLabel = prevSummary.success && prevSummary.cycle ? prevSummary.cycle.label : 'last cycle'

    // ── Stripe: resolve customer → create + finalize invoice ─────────────────────
    const stripe = getStripe()
    const account = await payload
      .findByID({ collection: 'client-accounts', id: input.clientAccountId, depth: 0 })
      .catch(() => null)
    const resolved = await resolveStripeCustomer({
      stripe,
      email: stripeEmail,
      name: clientName,
      existingCustomerId: ((account as any)?.stripeCustomerId as string | undefined) ?? null,
      metadata: { orcaclub_client_id: input.clientAccountId, created_via: 'orcaclub_retainer' },
    })
    if (resolved.customerId !== (account as any)?.stripeCustomerId) {
      await payload.update({
        collection: 'client-accounts',
        id: input.clientAccountId,
        data: { stripeCustomerId: resolved.customerId } as any,
      })
    }

    // ── The client-facing billing package — fee/overage lines plus the itemized
    // hours and the planned work for the billed month (recap parity). Lives in the
    // client's Packages tab / print view; the order links to it via packageRef.
    const coverLines = [
      `Retainer billing for ${month}.`,
      workLines.length > 0 ? `Work delivered ${prevLabel}: ${fmtHrsLabel(round2(workLines.reduce((s, l) => s + l.hours, 0)))} hrs — $${workValue} in logged hours.` : null,
      overageAmount > 0 ? `Includes ${fmtHrsLabel(overageHours)} hrs of overage at $${overageRate}/hr.` : null,
      plannedWork.length > 0 ? `\nPlanned for ${month}:\n${plannedWork.map((p) => `• ${p}`).join('\n')}` : null,
    ].filter(Boolean)

    const pkg = await payload.create({
      collection: 'packages',
      data: {
        name: `${month} Retainer — ${TIER_LABEL[terms.tier]}`,
        type: 'proposal',
        status: 'sent',
        clientAccount: input.clientAccountId,
        coverMessage: coverLines.join('\n'),
        lineItems: [
          ...lines.map((l) => ({ name: l.title, billingType: 'fixed', price: l.amount, quantity: 1 })),
          // Itemized hours — the closing cycle's work, valued per line, $0 (covered).
          ...workLines.map((l) => ({
            name: l.title,
            description: l.description,
            billingType: 'hourly',
            hours: l.hours,
            price: 0,
            quantity: 1,
          })),
        ],
      } as any,
    })
    billingPackageId = pkg.id as string

    const { invoice, invoiceId, hostedInvoiceUrl } = await createStripeInvoiceForOrder({
      stripe,
      stripeCustomerId: resolved.customerId,
      daysUntilDue: input.daysUntilDue ?? 30,
      description: `${month} Retainer — ${clientName}`,
      paymentSettings: { payment_method_types: ['card', 'us_bank_account'] },
      invoiceMetadata: {
        created_via: 'orcaclub_retainer',
        retainer_id: input.retainerId,
        cycle_start: cycle.start,
        orcaclub_package_id: billingPackageId,
      },
      lines: lines.map((l) => ({ description: l.title, amount: l.amount })),
    })

    // ── The linked Order — void the Stripe invoice if this write fails ───────────
    const orderNumber = invoice.number ?? invoiceId
    let order
    try {
      order = await payload.create({
        collection: 'orders',
        data: {
          orderNumber,
          clientAccount: input.clientAccountId,
          amount: total,
          status: 'pending',
          stripeCustomerId: resolved.customerId,
          stripeInvoiceId: invoiceId,
          stripeInvoiceUrl: hostedInvoiceUrl,
          retainerRef: input.retainerId,
          retainerCycleStart: cycle.start,
          packageRef: billingPackageId,
          invoiceType: 'retainer',
          invoiceNote: `${month} Retainer`,
          ...(invoice.due_date ? { dueDate: new Date(invoice.due_date * 1000).toISOString() } : {}),
          lineItems: [
            ...lines.map((l) => ({ title: l.title, quantity: 1, price: l.amount, isRecurring: false })),
            // Itemized hours at $0 — covered by the lines above; amount still balances.
            ...workLines.map((l) => ({ title: l.title, description: l.description, quantity: 1, price: 0 })),
          ],
        } as any,
      })
      // Payload runs afterChange hooks inside the create's Mongo transaction. A hook that
      // catches its own error (updateClientBalance → syncClientAccountToUser) still leaves
      // the transaction aborted, so `payload.create` can hand back a doc with an id for a
      // row that was rolled back. Re-read before ANYTHING stamps against `order.id` —
      // and only then treat the order as created, so a throw here still takes the cleanup
      // path below (void the Stripe invoice) and the outer catch (delete the billing
      // package) instead of leaving both orphaned behind a false success.
      await assertOrderPersisted(payload, order.id as string)
      orderCreated = true
    } catch (createErr) {
      await stripe.invoices.voidInvoice(invoiceId).catch((e: unknown) =>
        console.error('[sendRetainerInvoice] Failed to void orphaned invoice:', e),
      )
      throw createErr
    }

    // Record the invoice on the package's payment schedule (best-effort).
    await payload
      .update({
        collection: 'packages',
        id: billingPackageId,
        data: {
          paymentSchedule: [
            { label: `${month} Retainer`, amount: total, orderId: order.id, invoicedAt: new Date().toISOString() },
          ],
        } as any,
      })
      .catch((e) => console.error('[sendRetainerInvoice] Failed to update payment schedule:', e))

    // ── Email — "August's Retainer". Order + Stripe invoice survive an email failure. ─
    let emailSent = false
    try {
      const emailData = {
        orderNumber,
        customerName: clientName,
        customerEmail: recipients[0],
        customerCompany: summary.client?.company ?? undefined,
        lineItems: lines.map((l) => ({ title: l.title, quantity: 1, price: l.amount })),
        totalAmount: total,
        stripeInvoiceUrl: hostedInvoiceUrl,
        invoiceNote: `${month} Retainer`,
        customMessage: input.message,
        plannedWork,
        hasPdfAttachment: false,
        ...(invoice.due_date ? { dueDate: new Date(invoice.due_date * 1000).toISOString() } : {}),
      }
      await payload.sendEmail({
        to: recipients.join(', '),
        from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
        subject: `${month}'s Retainer — ORCACLUB`,
        html: generateGenericInvoiceEmail(emailData),
        text: generateGenericInvoiceEmailText(emailData),
      } as any)
      emailSent = true

      // Record the send on the order's history — one entry per recipient.
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          invoices: recipients.map((r) => ({ sentAt: new Date().toISOString(), sentTo: r, sentBy: user.id, status: 'sent' })),
        } as any,
      })
    } catch (e) {
      console.error('[sendRetainerInvoice] Email failed (invoice + order created):', e)
    }

    return {
      success: true as const,
      orderId: order.id,
      orderNumber,
      hostedInvoiceUrl,
      total,
      emailSent,
      recipients,
      packageId: billingPackageId,
    }
  } catch (error) {
    // Remove an orphaned billing package if the flow died before the order existed.
    if (billingPackageId && !orderCreated) {
      const cleanupPayload = await getPayload({ config }).catch(() => null)
      cleanupPayload
        ?.delete({ collection: 'packages', id: billingPackageId })
        .catch((e) => console.error('[sendRetainerInvoice] Failed to remove orphaned package:', e))
    }
    console.error('[sendRetainerInvoice]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to send retainer invoice' }
  }
}

/**
 * Undo a cycle's retainer billing so it can be sent again. Voids the Stripe invoice,
 * deletes the client-facing billing package (`packageRef`), then deletes the order —
 * whose `afterDelete` hook recalculates the client account balance, so nothing here
 * touches the balance by hand.
 *
 * Retainer time entries are sliced by calendar cycle and carry no order stamp (unlike
 * package work entries), so there is nothing to release.
 *
 * Stripe and the package are best-effort: the point of this action is unsticking a
 * broken state, so a Stripe rejection (already void, deleted, bad key) or a missing
 * package must never abort the reset. A paid order is never reset — that would detach
 * a paid invoice.
 */
export async function resetRetainerInvoice(input: { retainerId: string; cycleStart: string }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId || !input.cycleStart) {
      return { success: false as const, error: 'A retainer and cycle are required' }
    }

    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { retainerRef: { equals: input.retainerId } },
          { retainerCycleStart: { equals: input.cycleStart } },
        ],
      },
      sort: '-createdAt',
      depth: 0,
      limit: 1,
    })
    const order = docs[0] as
      | {
          id: string
          orderNumber?: string | null
          status?: 'pending' | 'paid' | 'cancelled' | null
          stripeInvoiceId?: string | null
          packageRef?: string | { id: string } | null
        }
      | undefined
    if (!order) return { success: false as const, error: 'No invoice found for this cycle' }

    if (order.status === 'paid') {
      return {
        success: false as const,
        error: 'This cycle has already been paid — reset would detach a paid invoice.',
      }
    }

    // ── Void the Stripe invoice (best-effort) ────────────────────────────────────
    let stripeVoided = false
    if (order.stripeInvoiceId) {
      try {
        const stripe = getStripe()
        const invoice = await stripe.invoices.retrieve(order.stripeInvoiceId).catch(() => null)
        if (!invoice || invoice.status !== 'void') {
          await stripe.invoices.voidInvoice(order.stripeInvoiceId)
          stripeVoided = true
        }
      } catch (e) {
        console.error('[resetRetainerInvoice] Failed to void Stripe invoice:', order.stripeInvoiceId, e)
      }
    }

    // ── Drop the client-facing billing package (best-effort) ─────────────────────
    // Retainer-specific: leaving it behind strands a document in the client's Packages
    // tab pointing at an invoice that no longer exists.
    let billingPackageDeleted = false
    const packageId =
      typeof order.packageRef === 'string' ? order.packageRef : order.packageRef?.id ?? null
    if (packageId) {
      try {
        await payload.delete({ collection: 'packages', id: packageId })
        billingPackageDeleted = true
      } catch (e) {
        console.error('[resetRetainerInvoice] Failed to delete billing package:', packageId, e)
      }
    }

    // ── Drop the order — `revertClientBalance` (afterDelete) fixes the balance ────
    await payload.delete({ collection: 'orders', id: order.id })

    return {
      success: true as const,
      orderNumber: order.orderNumber ?? '',
      stripeVoided,
      billingPackageDeleted,
    }
  } catch (error) {
    console.error('[resetRetainerInvoice]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to reset invoice' }
  }
}

/**
 * The backward-looking half of a cycle close: email THIS month's hours & recap, with the
 * hour-log statement and/or the monthly recap deck attached as PDFs. Purely informational
 * — no Stripe, no order. Attachments are best-effort. `recap` overlays the staff-composed
 * narrative onto the server-derived numbers. Staff only.
 */
export async function sendRetainerRecapEmail(input: {
  clientAccountId: string
  /** Cycle to recap (any date inside it) — the month being closed. */
  ref?: string
  recipients?: string[]
  message?: string
  attachStatement?: boolean
  attachRecap?: boolean
  recap?: Partial<RecapData>
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.clientAccountId) return { success: false as const, error: 'A client is required' }

    const payload = await getPayload({ config })
    const summary = await getRetainerSummary(input.clientAccountId, input.ref)
    if (!summary.success) return { success: false as const, error: summary.error }
    if (!summary.retainer || !summary.cycle || !summary.terms) {
      return { success: false as const, error: 'No active retainer cycle to recap' }
    }
    const { cycle, terms, totals } = summary

    const month = cycleMonthName(cycle.start)
    const clientName = summary.client?.name ?? 'Client'
    const recipients = cleanRecipients(input.recipients, summary.client?.email)
    if (recipients.length === 0) return { success: false as const, error: 'Add at least one recipient email' }

    const attachStatement = input.attachStatement !== false
    const attachRecap = input.attachRecap !== false

    // ── Attachments — best-effort; a failed PDF never blocks the send ────────────
    const attachments: EmailAttachment[] = []
    let hasStatement = false
    let mergedRecap: RecapData | null = null

    if (attachStatement) {
      try {
        const pdf = await buildRetainerStatementPdf({
          clientName,
          clientCompany: summary.client?.company ?? null,
          tierLabel: TIER_LABEL[terms.tier],
          periodLabel: cycle.label,
          monthlyFee: terms.monthlyFee,
          hoursPerMonth: terms.hoursPerMonth,
          overageRate: terms.overageRate,
          entries: summary.logged.map((e) => ({
            date: e.date,
            description: e.description ?? '',
            category: e.category ?? 'work',
            hours: e.hours,
            priority: e.priority ?? 'medium',
          })),
          planned: summary.drafts.map((e) => ({
            date: e.date,
            description: e.description ?? '',
            category: e.category ?? 'work',
            priority: e.priority ?? 'medium',
            completion: e.completion ?? 'incomplete',
          })),
          totals: {
            used: totals.used,
            remaining: totals.remaining,
            overageHours: totals.overageHours,
            overageAmount: totals.overageAmount,
          },
          generatedOn: new Date().toISOString(),
        })
        attachments.push({
          filename: `ORCACLUB-Statement-${month}.pdf`,
          content: Buffer.from(pdf).toString('base64'),
          encoding: 'base64',
          contentType: 'application/pdf',
        })
        hasStatement = true
      } catch (e) {
        console.error('[sendRetainerRecapEmail] Statement PDF failed (sending without):', e)
      }
    }

    if (attachRecap) {
      try {
        const model = await getRecapModel(input.clientAccountId, input.ref)
        if (model.success) {
          mergedRecap = mergeRecap(model.model, input.recap)
          const pdf = await buildRetainerRecapPdf({ ...mergedRecap, generatedOn: new Date().toISOString() })
          attachments.push({
            filename: `ORCACLUB-Recap-${month}.pdf`,
            content: Buffer.from(pdf).toString('base64'),
            encoding: 'base64',
            contentType: 'application/pdf',
          })
        }
      } catch (e) {
        console.error('[sendRetainerRecapEmail] Recap PDF failed (sending without):', e)
      }
    }
    const hasRecap = Boolean(mergedRecap) && attachments.some((a) => a.filename.includes('Recap'))

    // Prefer the staff-edited bucket labels; fall back to derived category hours.
    const buckets = mergedRecap
      ? mergedRecap.buckets.map((b) => ({ label: b.label, hours: b.hours }))
      : (Object.keys(totals.byCategory) as TimeEntryCategory[])
          .filter((c) => (totals.byCategory[c] ?? 0) > 0)
          .map((c) => ({ label: RECAP_CATEGORY_LABEL[c], hours: totals.byCategory[c] }))

    const emailData = {
      clientName,
      clientCompany: summary.client?.company ?? null,
      periodLabel: cycle.label,
      monthLabel: month,
      hoursUsed: totals.used,
      hoursPerMonth: terms.hoursPerMonth,
      overageHours: totals.overageHours,
      overageAmount: totals.overageAmount,
      itemsShipped: summary.logged.length,
      buckets,
      customMessage: input.message,
      headline: mergedRecap?.headline,
      hasStatement,
      hasRecap,
    }

    try {
      await payload.sendEmail({
        to: recipients.join(', '),
        from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
        subject: retainerRecapEmailSubject(emailData),
        html: generateRetainerRecapEmail(emailData),
        text: generateRetainerRecapEmailText(emailData),
        ...(attachments.length ? { attachments } : {}),
      } as any)
    } catch (e) {
      console.error('[sendRetainerRecapEmail] Email failed:', e)
      return { success: false as const, error: 'Failed to send the recap email' }
    }

    return { success: true as const, recipients, attachmentCount: attachments.length }
  } catch (error) {
    console.error('[sendRetainerRecapEmail]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to send recap email' }
  }
}

/** Format hours for a Stripe line label (trim to 2 decimals). */
function fmtHrsLabel(n: number): string {
  return String(Math.round((n ?? 0) * 100) / 100)
}

/** Delete an entry (draft or logged). Staff only. */
export async function deleteTimeEntry(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    await payload.delete({ collection: 'retainer-time-entries', id })
    return { success: true as const }
  } catch (error) {
    console.error('[deleteTimeEntry]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to delete entry' }
  }
}
