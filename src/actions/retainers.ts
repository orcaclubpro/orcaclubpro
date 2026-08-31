'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cycleFor, nextCycleStart, type Cycle } from '@/lib/retainers/cycle'
import { deriveRecapDefaults, mergeRecap, RECAP_CATEGORY_LABEL, type RecapData } from '@/lib/retainers/recap'
import { deriveScopeRecapDefaults, mergeScopeRecap, type ScopeRecapData } from '@/lib/retainers/scopeRecap'
import { getStripe } from '@/lib/stripe'
import { resolveStripeCustomer } from '@/lib/stripe/customers'
import { createStripeInvoiceForOrder, assertOrderPersisted } from '@/lib/stripe/invoices'
import {
  buildRetainerStatementPdf,
  buildRetainerRecapPdf,
  buildRetainerProposalPdf,
  buildScopeRecapPdf,
} from '@/lib/pdf-generators'
import { WORK_CATEGORY_LABEL } from '@/lib/packages/workLines'
// The one-off send reuses the packages system's own billing + email paths rather than
// re-copying the Stripe sequences. packages.ts does not import this module, so there
// is no cycle.
import { sendProposalEmail, pushPackageSchedule, linkScheduleEntriesToOrders } from '@/actions/packages'
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
  /** Where a scheduled wind-down lands. Absent means 'inactive' (close). */
  deactivateTo?: 'inactive' | 'scoping' | null
  /** When a running plan was switched back to Non-Retainer — bounds the new pitch. */
  nonRetainerSince?: string | null
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
  /** Set when this scope became a one-off proposal instead of a retainer. */
  convertedPackage?: string | { id: string } | null
  convertedPackages?: (string | { id: string })[] | null
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
  /** Where the scheduled wind-down lands. Null when nothing is scheduled. */
  deactivateTo: 'inactive' | 'scoping' | null
  pendingEffectiveFrom: string | null
  pending: { tier?: RetainerTier | null; monthlyFee?: number | null; hoursPerMonth?: number | null; overageRate?: number | null } | null
}

/**
 * What a Non-Retainer client's console needs to walk its retainer past: the bounds of
 * the navigator and which cycle is on screen. Present only on records that came back
 * from a running plan — a record that was only ever scoped has no history to show.
 */
export interface RetainerHistoryMeta {
  /** ISO start of the first retainer cycle. */
  firstCycleStart: string
  /** ISO start of the last retainer cycle — the one containing the switch. */
  lastCycleStart: string
  /** How many cycles the plan ran. */
  cycleCount: number
  /** Which cycle is on screen, 1-based. Null while viewing the pitch. */
  cycleIndex: number | null
  /** When the plan was switched off. */
  since: string
  /** Hours logged across the whole retainer era. */
  totalHours: number
  /** The tier the plan ended on. */
  tier: RetainerTier
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

/**
 * The retainer era of a record that came back to Non-Retainer: `[first cycle, switch)`.
 * Null when the record was only ever scoped, so there is no history to walk.
 */
function retainerEraOf(r: RetainerDoc): { anchor: string; since: string } | null {
  const since = iso(r.nonRetainerSince)
  const anchor = iso(r.activatedAt)
  return since && anchor ? { anchor, since } : null
}

/**
 * The time-entry filter for one HISTORICAL cycle — the mirror of `pitchWhere`.
 *
 * The final cycle is clipped at the switch. Ending a plan mid-cycle ("end now") leaves
 * a window that runs past `nonRetainerSince`, and the entries in that tail are pitch
 * work, not retainer hours. Without the clip they would be counted twice: once against
 * the retainer's cap here, and again as scope for the next proposal.
 */
function historyWhere(r: RetainerDoc, cycle: Cycle, since: string): Record<string, unknown> {
  return {
    and: [
      { retainer: { equals: r.id } },
      { date: { greater_than_equal: cycle.start } },
      { date: { less_than: cycle.end < since ? cycle.end : since } },
    ],
  }
}

/**
 * Refuse writes that would land in — or disturb — a closed retainer era.
 *
 * Once a plan is switched off, the cycles it ran are billed history: their hours were
 * capped, snapshotted onto the entries, and usually invoiced. Editing them after the
 * fact changes what a client was charged for. The history view is read-only by design;
 * this is what makes that true for any caller, not just the one that hides the buttons.
 *
 * Returns an error string, or null when the write is fine.
 */
function historyLockError(r: RetainerDoc | null | undefined, ...dates: (string | null | undefined)[]): string | null {
  if (!r || !isScoping(r)) return null
  const era = retainerEraOf(r)
  if (!era) return null
  const hits = dates.some((d) => d && d < era.since)
  return hits
    ? 'That date falls inside the closed retainer period — those cycles are billed history and cannot be edited.'
    : null
}

/** 1-based position of a cycle within the retainer era. Cycles are anchored months,
 *  so plain month arithmetic is exact. */
function cycleIndexOf(anchor: string, cycleStart: string): number {
  const first = new Date(cycleFor(anchor, anchor).start)
  const at = new Date(cycleStart)
  return (at.getUTCFullYear() - first.getUTCFullYear()) * 12 + (at.getUTCMonth() - first.getUTCMonth()) + 1
}

/**
 * The time-entry filter for a scoping record's PITCH.
 *
 * A record that has only ever been scoped owns all of its entries. One that came back
 * from a running plan (`endRetainerPlan` with `then: 'non-retainer'`) does not: the
 * hours logged under that plan are retainer history — already billed, already capped —
 * and must never be re-offered as scope, re-dated onto a new anchor, or migrated into a
 * one-off package. `nonRetainerSince` is the line between the two.
 *
 * Every read that treats entries as "the pitch" goes through this.
 */
function pitchWhere(r: RetainerDoc): Record<string, unknown> {
  const since = iso(r.nonRetainerSince)
  return since
    ? { and: [{ retainer: { equals: r.id } }, { date: { greater_than_equal: since } }] }
    : { retainer: { equals: r.id } }
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
    // A wind-down either closes the engagement or drops it back to Non-Retainer, where
    // one-off work can be scoped against the same record. Unset means close, so records
    // scheduled before `deactivateTo` existed keep their original behaviour.
    const landsOn = retainer.deactivateTo === 'scoping' ? 'scoping' : 'inactive'
    updates.status = landsOn
    updates.deactivateOn = null
    updates.deactivateTo = null
    // The switch date bounds the next pitch: work logged under the plan is history,
    // not scope. Stamped to the wind-down date, not now, so a late settle is accurate.
    if (landsOn === 'scoping') updates.nonRetainerSince = deactivateOn
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
        view: 'none' as const,
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
        history: null as RetainerHistoryMeta | null,
      }
    }

    // ── Non-Retainer: no live cycle, so `refDate` selects the VIEW, not a slice ──
    // Two things live under one status. By default the console is the pitch: every
    // planned and completed item since scoping began, with null cycle/terms keeping it
    // out of the billing paths. But a record that came back from a running plan also
    // owns a retainer past, and pointing `refDate` into that era returns the cycle
    // instead — read-only history, priced at the terms frozen onto its own entries.
    if (isScoping(retainer)) {
      const era = retainerEraOf(retainer)
      const refIso = refDate ? new Date(refDate).toISOString() : null

      // Everything the navigator needs, whichever view is showing. One extra read, and
      // only for records that actually have a past.
      let history: RetainerHistoryMeta | null = null
      if (era) {
        const { docs: eraDocs } = await payload.find({
          collection: 'retainer-time-entries',
          where: {
            and: [
              { retainer: { equals: retainer.id } },
              { date: { less_than: era.since } },
              { status: { not_equals: 'draft' } },
            ],
          },
          select: { hours: true } as any,
          depth: 0,
          limit: 2000,
        })
        history = {
          firstCycleStart: cycleFor(era.anchor, era.anchor).start,
          lastCycleStart: cycleFor(era.anchor, era.since).start,
          cycleCount: cycleIndexOf(era.anchor, cycleFor(era.anchor, era.since).start),
          cycleIndex: null,
          since: era.since,
          totalHours:
            Math.round((eraDocs as { hours?: number | null }[]).reduce((t, e) => t + (e.hours ?? 0), 0) * 100) / 100,
          tier: retainer.tier,
        }
      }

      // ── History: one past retainer cycle, read-only ─────────────────────────
      if (era && history && refIso && refIso < era.since) {
        const histCycle = cycleFor(era.anchor, refIso)
        const [{ docs: histDocs }, histAccount, { docs: histOrders }] = await Promise.all([
          payload.find({
            collection: 'retainer-time-entries',
            where: historyWhere(retainer, histCycle, era.since) as any,
            sort: '-date',
            depth: 0,
            limit: 500,
          }),
          payload.findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 }).catch(() => null),
          payload.find({
            collection: 'orders',
            where: {
              and: [
                { retainerRef: { equals: retainer.id } },
                { retainerCycleStart: { equals: histCycle.start } },
                { status: { not_equals: 'cancelled' } },
              ],
            },
            sort: '-createdAt',
            depth: 0,
            limit: 5,
          }),
        ])
        const histAll = histDocs as TimeEntryDoc[]
        const histLogged = histAll.filter((e) => e.status !== 'draft')
        const histDrafts = histAll.filter((e) => e.status === 'draft')
        // The era is over, so every cycle in it is past — termsForCycle reads the
        // snapshot frozen onto the entries rather than today's (cleared) plan fields.
        const histTerms = termsForCycle(retainer, histCycle, histLogged, now)
        const histOrder = (histOrders as any[])[0]
        return {
          success: true as const,
          view: 'history' as const,
          retainer,
          cycle: histCycle,
          terms: histTerms,
          logged: histLogged,
          drafts: histDrafts,
          totals: computeTotals(histLogged, histTerms.hoursPerMonth, histTerms.overageRate),
          scheduled: null,
          client: histAccount
            ? {
                name: (histAccount as any).name ?? 'Client',
                company: ((histAccount as any).company ?? null) as string | null,
                email: ((histAccount as any).email ?? null) as string | null,
              }
            : null,
          cycleInvoice: histOrder
            ? {
                orderId: histOrder.id,
                orderNumber: histOrder.orderNumber,
                status: histOrder.status,
                amount: histOrder.amount,
                stripeInvoiceUrl: histOrder.stripeInvoiceUrl ?? null,
                createdAt: histOrder.createdAt,
              }
            : null,
          nextCycle: null as RetainerNextCycle | null,
          pitch: null as RetainerPitch | null,
          proposal: null as RetainerProposalTerms | null,
          history: { ...history, cycleIndex: cycleIndexOf(era.anchor, histCycle.start) },
        }
      }

      // ── The pitch ───────────────────────────────────────────────────────────
      const [{ docs: scopeDocs }, scopeAccount] = await Promise.all([
        payload.find({
          collection: 'retainer-time-entries',
          where: pitchWhere(retainer) as any,
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
        view: 'pitch' as const,
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
        history,
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
      deactivateTo: retainer.deactivateOn ? (retainer.deactivateTo ?? 'inactive') : null,
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
      view: 'live' as const,
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
      history: null as RetainerHistoryMeta | null,
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
            where: pitchWhere(r) as any,
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
      where: pitchWhere(existing) as any,
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

// ── Conversion — a scope that turns out to be one-off, not recurring ──────────

/**
 * Retainer work categories don't line up 1:1 with package ones: packages have
 * `design` where retainers have `reporting`. Reporting folds into `work` — it is the
 * generic bucket on both sides, and nothing downstream prices off the category.
 */
const WORK_CATEGORY_FOR_PACKAGE: Record<TimeEntryCategory, 'work' | 'design' | 'revision' | 'meeting'> = {
  work: 'work',
  meeting: 'meeting',
  revision: 'revision',
  reporting: 'work',
}

/** A priced deliverable on a one-off proposal. */
export interface OneOffLineInput {
  name: string
  description?: string
  /** Per-unit price. For an hourly line this is the RATE — hours multiply it. */
  price: number
  quantity?: number
  /** Optional extra the client can request; excluded from the proposal total. */
  isAddOn?: boolean
  billingType?: 'fixed' | 'hourly' | 'recurring'
  hours?: number
  recurringInterval?: 'month' | 'year'
}

/** One planned payment on a one-off proposal — the unit an Order is created from. */
export interface OneOffScheduleInput {
  label: string
  entryType?: 'deposit' | 'installment' | 'balance'
  amount: number
  /** yyyy-mm-dd */
  dueDate?: string
}

/**
 * Normalize a builder line the way the package editor would before storing it.
 *
 * Deliberately mirrors `normalizeLineItem` in actions/package-builder.ts rather than
 * importing it: that module is 'use server', so it can only export async functions.
 * Keep the two in step — both define how a package line is persisted.
 */
function normalizeOneOffLine(it: OneOffLineInput) {
  const billingType = it.billingType ?? 'fixed'
  const round2 = (n: number) => Math.max(0, Math.round((n || 0) * 100) / 100)
  const hours = billingType === 'hourly' ? Math.max(0, it.hours ?? 1) : undefined
  // Packages store hourly lines as rate × hours in `price`, keeping `hours` for display.
  const price = billingType === 'hourly' ? round2((it.price || 0) * (hours ?? 1)) : round2(it.price)
  return {
    name: (it.name ?? '').trim(),
    description: it.description?.trim() || undefined,
    price,
    quantity: Math.max(1, Math.round(it.quantity ?? 1)),
    billingType,
    hours,
    // isRecurring/recurringInterval are the legacy mirror of billingType — keep them true to it.
    isRecurring: billingType === 'recurring',
    recurringInterval: billingType === 'recurring' ? (it.recurringInterval ?? 'month') : undefined,
    isAddOn: Boolean(it.isAddOn),
  }
}

/** Normalize a schedule row; drops anything unlabelled or non-positive. */
function normalizeOneOffSchedule(rows: OneOffScheduleInput[] | undefined) {
  return (rows ?? [])
    .map((r) => ({
      label: (r.label ?? '').trim(),
      entryType: r.entryType ?? 'installment',
      amount: Math.max(0, Math.round((r.amount || 0) * 100) / 100),
      dueDate: r.dueDate ? dayToIso(r.dueDate) : undefined,
    }))
    .filter((r) => r.label && r.amount > 0)
}

/**
 * Turn a non-retainer client's scope into a one-off itemized proposal.
 *
 * Some scopes are not recurring — they are a fixed job with a list of deliverables.
 * Rather than grow a second line-item/scheduling system inside retainers, this hands
 * the scope to the `packages` proposal machinery, which already does itemized lines,
 * payment schedules, add-ons, the proposal PDF, and the milestones work log.
 *
 * Pitched work MOVES with it: every PITCH time entry is rewritten as a
 * package-work-entry (draft → planned, logged → logged) and the originals are deleted,
 * so the new package is the single source of truth. Retainer history is out of scope —
 * `pitchWhere` bounds both the copy and the delete at `nonRetainerSince`.
 *
 * The engagement stays OPEN afterwards: the client remains a Non-Retainer client with
 * their history intact, and the new package is appended to `convertedPackages`.
 *
 * This only ever produces a DRAFT proposal — emailing it and creating Orders are
 * `sendOneOffProject`'s job, so a failure there never leaves a half-sent package.
 *
 * Staff only. Refuses anything that is not still a non-retainer scope.
 */
export async function convertScopeToPackage(input: {
  retainerId: string
  /** Proposal name — defaults to "{client} — {scope headline or 'Project'}". */
  name?: string
  /** Cover message on the proposal PDF. Defaults to the scope summary. */
  coverMessage?: string
  /** The priced deliverables. Normally the pitched planned work, now with prices. */
  lineItems: OneOffLineInput[]
  /** Planned payments — each becomes one Order when the proposal is sent. */
  paymentSchedule?: OneOffScheduleInput[]
  /** Project to attach the proposal to, if there is one. */
  projectRef?: string | null
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId) return { success: false as const, error: 'No client selected' }

    const payload = await getPayload({ config })
    const retainer = (await payload
      .findByID({ collection: 'retainers', id: input.retainerId, depth: 0 })
      .catch(() => null)) as RetainerDoc | null
    if (!retainer) return { success: false as const, error: 'Retainer not found' }
    if (!isScoping(retainer)) {
      return { success: false as const, error: 'Only a scope that has not started can be converted' }
    }

    const lineItems = (input.lineItems ?? []).map(normalizeOneOffLine).filter((it) => it.name)
    if (lineItems.length === 0) {
      return { success: false as const, error: 'Add at least one priced line item' }
    }
    const paymentSchedule = normalizeOneOffSchedule(input.paymentSchedule)

    const clientAccountId =
      typeof retainer.clientAccount === 'object' ? retainer.clientAccount.id : retainer.clientAccount
    const account = (await payload
      .findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 })
      .catch(() => null)) as any
    const clientLabel = account?.company || account?.name || 'Client'

    // ── The proposal ───────────────────────────────────────────────────────────
    const pkg = await payload.create({
      collection: 'packages',
      data: {
        name: input.name?.trim() || `${clientLabel} — ${retainer.scopeSummary?.trim().slice(0, 60) || 'Project'}`,
        description: retainer.scopeSummary ?? undefined,
        coverMessage: input.coverMessage?.trim() || retainer.proposalNote || undefined,
        notes: retainer.notes ?? undefined,
        type: 'proposal',
        status: 'draft',
        clientAccount: clientAccountId,
        projectRef: input.projectRef || undefined,
        lineItems,
        paymentSchedule,
      } as any,
    })

    // ── Move the pitched work across ───────────────────────────────────────────
    // Copy first, delete second: a failure mid-way leaves duplicates (visible and
    // fixable) rather than losing the log entirely.
    const { docs: entries } = await payload.find({
      collection: 'retainer-time-entries',
      where: pitchWhere(retainer) as any,
      sort: 'date',
      depth: 0,
      limit: 500,
    })
    let migrated = 0
    for (const entry of entries as TimeEntryDoc[]) {
      const pkgCategory = WORK_CATEGORY_FOR_PACKAGE[(entry.category ?? 'work') as TimeEntryCategory]
      await payload.create({
        collection: 'package-work-entries',
        data: {
          date: entry.date,
          hours: entry.hours ?? undefined,
          status: entry.status === 'draft' ? 'planned' : 'logged',
          completion: entry.completion ?? 'incomplete',
          category: pkgCategory,
          // package-work-entries requires a description; fall back to the category.
          description: entry.description?.trim() || WORK_CATEGORY_LABEL[pkgCategory],
          package: pkg.id,
          clientAccount: clientAccountId,
          loggedBy: typeof entry.loggedBy === 'object' ? entry.loggedBy?.id : (entry.loggedBy ?? undefined),
        } as any,
      })
      migrated++
    }
    for (const entry of entries as TimeEntryDoc[]) {
      await payload.delete({ collection: 'retainer-time-entries', id: entry.id }).catch(() => null)
    }

    // ── Record what it became, and LEAVE THE ENGAGEMENT OPEN ───────────────────
    // This used to flip the record to `inactive`. That was right when a scoping record
    // was throwaway scaffolding — created only to pitch, then either activated into a
    // retainer or converted and discarded.
    //
    // It is wrong now that `scoping` also means "Non-Retainer client", which is a
    // durable relationship that can carry years of retainer history behind it. Closing
    // it on conversion made every read path (loadLiveRetainer, getRetainerPortfolio,
    // setRetainer) drop the record — all three filter to ['active','scoping'] — so
    // selling a client one project silently took their whole retainer past off the
    // dashboard. The entries were never deleted; nothing could reach them any more.
    //
    // So the client stays a Non-Retainer client, with their history and cycle navigator
    // intact, ready for the next project. Which is why the back-link is a list.
    const priorPackages = (retainer.convertedPackages ?? []).map((x) =>
      typeof x === 'object' ? x.id : x,
    )
    await payload.update({
      collection: 'retainers',
      id: retainer.id,
      data: {
        convertedPackages: [...priorPackages, pkg.id],
        proposedTier: null,
        proposedMonthlyFee: null,
        proposedHoursPerMonth: null,
        proposedOverageRate: null,
        proposedStartDate: null,
      } as any,
    })

    if (user.username) revalidatePath(`/u/${user.username}/clients/${clientAccountId}`)

    return { success: true as const, packageId: pkg.id as string, clientAccountId, migrated }
  } catch (error) {
    console.error('[convertScopeToPackage]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to convert scope' }
  }
}

/**
 * The one-off project's single "send" — everything the retainer branch spreads over
 * three surfaces, done in one call so staff never leave the pitch console.
 *
 * In order: build the proposal (see convertScopeToPackage), email it to the client,
 * then create the Orders behind the payment schedule.
 *
 * Order matters and is deliberate. The email goes FIRST because it is the pitch: a
 * client must never receive an invoice for a proposal they have not seen. And every
 * step after the package exists is reported rather than thrown — the package is the
 * expensive, work-migrating part, so once it is created a failed email or a declined
 * Stripe call comes back as a warning against a real packageId that staff can retry
 * from Milestones, not as an error that hides what was already built.
 *
 * `invoiceNow` is the only step that charges anyone. It is off unless explicitly
 * asked for, and it requires `createOrders` — there is no path where a proposal
 * bills a client as a side effect of being sent.
 *
 * Staff only.
 */
export async function sendOneOffProject(input: {
  retainerId: string
  name?: string
  coverMessage?: string
  lineItems: OneOffLineInput[]
  paymentSchedule?: OneOffScheduleInput[]
  projectRef?: string | null
  /** Email the proposal. Omit to create the draft and stop there. */
  send?: {
    recipients: string[]
    /** Overrides the cover message on the document and in the email. */
    message?: string
    sendAs?: 'proposal' | 'invoice' | 'sow'
  } | null
  /** Create an Order per payment-schedule entry. */
  createOrders?: boolean
  /** Finalize a Stripe invoice for each of those Orders. Requires createOrders. */
  invoiceNow?: boolean
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }

    const recipients = (input.send?.recipients ?? [])
      .map((e) => e.trim())
      .filter((e) => e.includes('@'))
    const wantsSend = Boolean(input.send) && recipients.length > 0
    if (input.send && recipients.length === 0) {
      return { success: false as const, error: 'Add at least one valid recipient email' }
    }

    const schedule = normalizeOneOffSchedule(input.paymentSchedule)
    // Orders are created from schedule entries — without one there is nothing to bill.
    if (input.createOrders && schedule.length === 0) {
      return {
        success: false as const,
        error: 'Add a payment schedule row, or turn off "Create orders on send"',
      }
    }
    if (input.invoiceNow && !input.createOrders) {
      return { success: false as const, error: 'Invoicing through Stripe requires creating orders' }
    }

    // The send message is what the document says — write it in before anything renders it.
    const coverMessage = input.send?.message?.trim() || input.coverMessage?.trim() || undefined

    // ── 1. The proposal ────────────────────────────────────────────────────────
    const built = await convertScopeToPackage({
      retainerId: input.retainerId,
      name: input.name,
      coverMessage,
      lineItems: input.lineItems,
      paymentSchedule: schedule,
      projectRef: input.projectRef,
    })
    if (!built.success) return built

    const packageId = built.packageId
    const warnings: string[] = []
    let emailed = 0

    // ── 2. The pitch, before any bill ──────────────────────────────────────────
    // Unless Stripe is doing the billing. Each Stripe invoice email already carries the
    // line items, a payment link, and a link back to the proposal page — so finalizing
    // IS the send. Firing the document email as well puts two pieces of mail in the
    // client's inbox for one button press, and three on a two-row schedule.
    const documentEmailSuppressed = wantsSend && Boolean(input.invoiceNow)
    if (wantsSend && !documentEmailSuppressed) {
      try {
        const res = await sendProposalEmail(packageId, recipients, input.send?.sendAs ?? 'proposal')
        emailed = 'sent' in res ? (res.sent ?? 0) : 0
        if (emailed > 0) {
          const payload = await getPayload({ config })
          await payload
            .update({ collection: 'packages', id: packageId, data: { status: 'sent' } as any })
            .catch(() => null)
        } else {
          warnings.push(('error' in res && res.error) || 'The proposal email could not be sent')
        }
      } catch (e) {
        console.error('[sendOneOffProject] proposal email failed:', e)
        warnings.push('The proposal email could not be sent')
      }
    }

    // ── 3. The money ───────────────────────────────────────────────────────────
    let ordersCreated = 0
    const invoiceUrls: string[] = []
    if (input.createOrders) {
      try {
        if (input.invoiceNow) {
          const res = await pushPackageSchedule(packageId)
          if (res.success) {
            ordersCreated = res.count ?? 0
            invoiceUrls.push(...(res.invoiceUrls ?? []))
          } else {
            warnings.push(res.error ?? 'Could not invoice the payment schedule')
          }
        } else {
          const res = await linkScheduleEntriesToOrders(packageId)
          if (res.success) ordersCreated = res.created ?? 0
          else warnings.push(res.error ?? 'Could not create the orders')
        }
      } catch (e) {
        console.error('[sendOneOffProject] order creation failed:', e)
        warnings.push('Could not create the orders')
      }
    }

    if (user.username) {
      revalidatePath(`/u/${user.username}/clients/${built.clientAccountId}`)
      revalidatePath(`/u/${user.username}/packages`)
    }

    // Billing through Stripe marks the proposal sent too — the client has it, just as
    // an invoice rather than a quote.
    if (documentEmailSuppressed && ordersCreated > 0) {
      const payload = await getPayload({ config })
      await payload
        .update({ collection: 'packages', id: packageId, data: { status: 'sent' } as any })
        .catch(() => null)
    }

    return {
      success: true as const,
      packageId,
      migrated: built.migrated,
      emailed,
      /** True when the Stripe invoices replaced the document email. */
      documentEmailSuppressed,
      ordersCreated,
      invoiceUrls,
      invoiced: Boolean(input.invoiceNow) && ordersCreated > 0,
      warnings,
    }
  } catch (error) {
    console.error('[sendOneOffProject]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to send the project' }
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
      where: pitchWhere(retainer) as any,
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
  /** Attach the scope recap alongside the proposal, using the composed narrative. */
  attachScopeRecap?: boolean
  scopeRecap?: Partial<ScopeRecapData> | null
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

    // The recap is a companion, not the offer — unlike the proposal PDF this is
    // best-effort, so a recap that fails to render never blocks the proposal going out.
    const attachments: EmailAttachment[] = [attachment]
    if (input.attachScopeRecap) {
      try {
        const recap = await scopeRecapPdfBytes(input.retainerId, input.scopeRecap)
        if (recap.success) {
          attachments.push({
            filename: `ORCACLUB-Work-Recap-${client.company || client.name}.pdf`.replace(/[^\w.\- ]+/g, ''),
            content: Buffer.from(recap.bytes).toString('base64'),
            encoding: 'base64',
            contentType: 'application/pdf',
          })
        } else {
          console.error('[sendRetainerProposalEmail] recap skipped:', recap.error)
        }
      } catch (e) {
        console.error('[sendRetainerProposalEmail] recap PDF failed:', e)
      }
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
        attachments,
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

    return { success: true as const, recipients, sentAt, recapAttached: attachments.length > 1 }
  } catch (error) {
    console.error('[sendRetainerProposalEmail]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to send proposal' }
  }
}

// ── Scope recap — the document that backs a proposal ────────────────────────────
// A scoping retainer has no anchor, so no cycle, so neither of the billing-event recaps
// (getRecapModel / getPackageRecapModel) can describe it. This one is anchored to the
// pitch instead: work already delivered on one side, work planned next on the other.
// Engagement-agnostic — the same document precedes a retainer and a one-off package.

/** "$2,400" — whole dollars, which is how every retainer figure is quoted. */
function moneyLabel(n: number): string {
  return `$${Math.round(n || 0).toLocaleString('en-US')}`
}

/**
 * Everything the scope recap renders. Numbers, buckets and the planned list come from
 * the work log; the proposed figure comes from the saved proposal slot, so it is absent
 * until the offer is priced and can never drift from what the proposal itself quotes.
 * Staff only.
 */
export async function getScopeRecapModel(retainerId: string) {
  try {
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
        where: pitchWhere(retainer) as any,
        sort: 'date',
        depth: 0,
        limit: 500,
      }),
      payload.findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 }).catch(() => null),
    ])
    const all = docs as TimeEntryDoc[]
    const shape = (e: TimeEntryDoc) => ({
      date: e.date,
      description: e.description ?? '',
      hours: e.hours ?? null,
      category: (e.category ?? 'work') as TimeEntryCategory,
    })

    // Only a priced proposal contributes a figure — an unpriced scope shows no money.
    const terms = proposalTermsOf(retainer)
    const priced = terms.monthlyFee > 0 && terms.hoursPerMonth > 0

    const model = deriveScopeRecapDefaults({
      clientName: ((account as any)?.name ?? 'Client') as string,
      clientCompany: (((account as any)?.company ?? null) as string | null),
      scopeSummary: retainer.scopeSummary ?? null,
      loggedEntries: all.filter((e) => e.status !== 'draft').map(shape),
      plannedEntries: all.filter((e) => e.status === 'draft').map(shape),
      proposedAmountLabel: priced ? `${moneyLabel(terms.monthlyFee)}/mo` : null,
      proposedTermsLabel: priced
        ? `${TIER_LABEL[terms.tier]} · ${fmtHrsLabel(terms.hoursPerMonth)} hrs/mo included`
        : null,
    })

    return { success: true as const, model, retainerId: retainer.id, clientAccountId }
  } catch (error) {
    console.error('[getScopeRecapModel]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to build recap' }
  }
}

/**
 * Re-derive the scope recap server-side, overlay the staff-composed narrative, and
 * render it. Internal: the PDF route and the proposal email both go through here so a
 * composed recap and its emailed copy can never differ.
 */
async function scopeRecapPdfBytes(retainerId: string, composed?: Partial<ScopeRecapData> | null) {
  const model = await getScopeRecapModel(retainerId)
  if (!model.success) return { success: false as const, error: model.error }
  const merged = mergeScopeRecap(model.model, composed)
  const bytes = await buildScopeRecapPdf({ ...merged, generatedOn: new Date().toISOString() })
  return { success: true as const, bytes, merged }
}

/**
 * Build the scope recap PDF. Exported from a 'use server' module, so it is a public
 * endpoint — the staff check inside getScopeRecapModel is what gates it.
 */
export async function buildScopeRecapPdfFor(retainerId: string, composed?: Partial<ScopeRecapData> | null) {
  return scopeRecapPdfBytes(retainerId, composed)
}

/**
 * Schedule deactivation / reactivate. Deactivating keeps the retainer active until the
 * end of the current cycle (`deactivateOn`), then it flips inactive on next access.
 * Reactivating cancels a pending deactivation, or restarts an already-inactive retainer
 * with a fresh cycle anchor. Staff only.
 */
/** What ending a plan leaves behind. */
export type RetainerEndTo = 'close' | 'non-retainer'

/**
 * End a running retainer plan — the one action behind the console's Deactivate.
 *
 * Two independent choices, because they answer different questions:
 *
 *   `when`  — 'cycle-end' (default) lets the current cycle finish so it can still be
 *             invoiced; 'now' stops it on the spot. Only 'now' can strand unbilled
 *             hours, which is why the caller is told the count before confirming.
 *   `then`  — 'close' retires the engagement to `inactive`. 'non-retainer' drops it
 *             back to `scoping`, so the SAME record carries on as a Non-Retainer
 *             client and one-off projects can be scoped and sold against it.
 *
 * Choosing 'non-retainer' is a status transition, not a new record: hours, notes and
 * the scope headline all stay put, and `nonRetainerSince` marks the line so the
 * retainer-era hours are treated as history rather than as scope for the next pitch
 * (see `pitchWhere`). Deferred ends store the choice in `deactivateTo`; `settleRetainer`
 * applies it when the date arrives.
 *
 * Staff only.
 */
export async function endRetainerPlan(input: {
  retainerId: string
  when?: 'cycle-end' | 'now'
  then?: RetainerEndTo
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.retainerId) return { success: false as const, error: 'No retainer selected' }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const r = (await payload
      .findByID({ collection: 'retainers', id: input.retainerId, depth: 0 })
      .catch(() => null)) as RetainerDoc | null
    if (!r) return { success: false as const, error: 'Retainer not found' }
    if (r.status !== 'active') {
      return { success: false as const, error: 'Only a running plan can be ended' }
    }

    const landsOn = input.then === 'non-retainer' ? 'scoping' : 'inactive'

    // Deferred: record the intent and let settleRetainer apply it. The plan stays
    // active and billable until then, which is the whole point of this option.
    if (input.when !== 'now') {
      const deactivateOn = nextCycleStart(anchorOf(r), now)
      await payload.update({
        collection: 'retainers',
        id: input.retainerId,
        data: { deactivateOn, deactivateTo: landsOn } as any,
      })
      if (user.username) revalidatePath(`/u/${user.username}/clients`)
      return { success: true as const, applied: false as const, deactivateOn, landsOn }
    }

    // Immediate.
    await payload.update({
      collection: 'retainers',
      id: input.retainerId,
      data: {
        status: landsOn,
        deactivateOn: null,
        deactivateTo: null,
        // Stamped now: everything logged from here is scope for the next pitch, and
        // everything before it stays retainer history.
        ...(landsOn === 'scoping' ? { nonRetainerSince: now } : {}),
        ...CLEAR_PENDING,
      } as any,
    })

    if (user.username) revalidatePath(`/u/${user.username}/clients`)
    return { success: true as const, applied: true as const, deactivateOn: null, landsOn }
  } catch (error) {
    console.error('[endRetainerPlan]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to end the plan' }
  }
}

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
      // Legacy entry point — defers to closing the engagement. New callers use
      // endRetainerPlan, which also chooses where the wind-down lands.
      const deactivateOn = nextCycleStart(anchorOf(r), now)
      await payload.update({
        collection: 'retainers',
        id: retainerId,
        data: { deactivateOn, deactivateTo: 'inactive' } as any,
      })
      return { success: true as const, deactivateOn }
    }

    // Reactivate.
    if (r.status === 'active') {
      // Just cancel a pending wind-down — the intent goes with it.
      await payload.update({
        collection: 'retainers',
        id: retainerId,
        data: { deactivateOn: null, deactivateTo: null } as any,
      })
    } else {
      await payload.update({
        collection: 'retainers',
        id: retainerId,
        data: { status: 'active', activatedAt: now, deactivateOn: null, deactivateTo: null, ...CLEAR_PENDING } as any,
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
    const locked = historyLockError(retainer, entryDate)
    if (locked) return { success: false as const, error: locked }
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
    const draftFor = (await payload
      .findByID({ collection: 'retainers', id: input.retainerId, depth: 0 })
      .catch(() => null)) as RetainerDoc | null
    const draftLocked = historyLockError(draftFor, dayToIso(input.date))
    if (draftLocked) return { success: false as const, error: draftLocked }

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

    // Both ends matter: an entry already inside the closed era cannot be edited, and a
    // live one cannot be re-dated into it.
    const entryRetainerId = typeof entry.retainer === 'object' ? entry.retainer.id : entry.retainer
    const entryRetainer = (await payload
      .findByID({ collection: 'retainers', id: entryRetainerId, depth: 0 })
      .catch(() => null)) as RetainerDoc | null
    const editLocked = historyLockError(
      entryRetainer,
      iso(entry.date),
      input.date !== undefined ? dayToIso(input.date) : null,
    )
    if (editLocked) return { success: false as const, error: editLocked }

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

    // A closed cycle is still billable — that is the whole point of keeping the history
    // view live. Ending a plan mid-cycle strands its hours uninvoiced, and scrolling
    // back to send that invoice is the only way to recover them. There is no "next
    // cycle" to preview, so the model reports the same one on both sides.
    const isHistory = current.view === 'history'
    const next = isHistory ? current : await getRetainerSummary(clientAccountId, current.cycle.end)
    if (!next.success || !next.cycle || !next.terms) {
      return { success: false as const, error: 'Could not resolve next cycle' }
    }

    return {
      success: true as const,
      retainerId: current.retainer.id,
      client: current.client,
      /**
       * Billing a CLOSED cycle after the fact rather than the next one in advance.
       * `current` and `next` are the same cycle here, so the invoice lands on the cycle
       * on screen, at its own frozen fee plus its own overage — which is what arrears
       * means. The modal only needs it to stop saying "closing X → billing Y".
       */
      arrears: isHistory,
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
    const doomed = (await payload
      .findByID({ collection: 'retainer-time-entries', id, depth: 0 })
      .catch(() => null)) as TimeEntryDoc | null
    if (doomed) {
      const owner = typeof doomed.retainer === 'object' ? doomed.retainer.id : doomed.retainer
      const ownerDoc = (await payload
        .findByID({ collection: 'retainers', id: owner, depth: 0 })
        .catch(() => null)) as RetainerDoc | null
      const locked = historyLockError(ownerDoc, iso(doomed.date))
      if (locked) return { success: false as const, error: locked }
    }

    await payload.delete({ collection: 'retainer-time-entries', id })
    return { success: true as const }
  } catch (error) {
    console.error('[deleteTimeEntry]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to delete entry' }
  }
}
