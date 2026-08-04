'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cycleFor, nextCycleStart, type Cycle } from '@/lib/retainers/cycle'
import { deriveRecapDefaults, RECAP_CATEGORY_LABEL, type RecapData } from '@/lib/retainers/recap'
import { getStripe } from '@/lib/stripe'
import { createStripeInvoiceForOrder } from '@/lib/stripe/invoices'
import { resolveStripeCustomer } from '@/lib/stripe/customers'
import { sendGenericInvoiceEmail } from '@/lib/payload/utils/genericInvoiceEmailTemplate'

// ── Shared shapes ───────────────────────────────────────────────────────────────

export type RetainerTier = 'basic' | 'growth' | 'enterprise'
export type RetainerStatus = 'active' | 'inactive'
export type TimeEntryCategory = 'work' | 'meeting' | 'revision' | 'reporting'
export type TimeEntryPriority = 'low' | 'medium' | 'high'
export type TimeEntryCompletion = 'incomplete' | 'complete'
export type TimeEntryStatus = 'draft' | 'logged'

export interface RetainerDoc {
  id: string
  clientAccount: string | { id: string }
  tier: RetainerTier
  status: RetainerStatus
  monthlyFee?: number | null
  hoursPerMonth?: number | null
  overageRate?: number | null
  startDate?: string | null
  activatedAt?: string | null
  deactivateOn?: string | null
  notes?: string | null
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

/** The Order (if any) already billed for a cycle — one per (retainer, cycleStart). */
export interface RetainerBilling {
  orderId: string
  orderNumber: string
  status: 'pending' | 'paid' | 'cancelled'
  invoiceUrl: string | null
  packageId: string | null
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

/** The client's current active retainer (settled), or null if none / just expired. */
async function loadActiveRetainer(
  payload: Awaited<ReturnType<typeof getPayload>>,
  clientAccountId: string,
  nowIso: string,
): Promise<RetainerDoc | null> {
  const { docs } = await payload.find({
    collection: 'retainers',
    where: { and: [{ clientAccount: { equals: clientAccountId } }, { status: { equals: 'active' } }] },
    limit: 1,
    depth: 0,
  })
  const raw = (docs[0] as RetainerDoc | undefined) ?? null
  if (!raw) return null
  const settled = await settleRetainer(payload, raw, nowIso)
  return settled.status === 'active' ? settled : null
}

/** Short UTC day label for billing line items, e.g. "Jul 12". */
function fmtEntryDay(dateIso: string): string {
  const d = new Date(dateIso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** The order already billed for a (retainer, cycle) pair, or null. Idempotency + UI state. */
async function findCycleOrder(
  payload: Awaited<ReturnType<typeof getPayload>>,
  retainerId: string,
  cycleStart: string,
): Promise<RetainerBilling | null> {
  const { docs } = await payload.find({
    collection: 'orders',
    where: {
      and: [{ retainerRef: { equals: retainerId } }, { retainerCycleStart: { equals: cycleStart } }],
    },
    limit: 1,
    depth: 0,
  })
  const order = docs[0] as
    | { id: string; orderNumber: string; status: string; stripeInvoiceUrl?: string | null; packageRef?: string | null }
    | undefined
  if (!order) return null
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status as RetainerBilling['status'],
    invoiceUrl: order.stripeInvoiceUrl ?? null,
    packageId: typeof order.packageRef === 'string' ? order.packageRef : null,
  }
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
    const retainer = await loadActiveRetainer(payload, clientAccountId, now)

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
        billing: null as RetainerBilling | null,
      }
    }

    const cycle = cycleFor(anchorOf(retainer), refDate ? new Date(refDate).toISOString() : now)

    const { docs } = await payload.find({
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
    })
    const all = docs as TimeEntryDoc[]
    const logged = all.filter((e) => e.status !== 'draft')
    const drafts = all.filter((e) => e.status === 'draft')

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
      billing: await findCycleOrder(payload, retainer.id, cycle.start),
    }
  } catch (error) {
    console.error('[getRetainerSummary]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load retainer' }
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────────

/**
 * Create a client's retainer, or change an existing one. Initial setup applies
 * immediately. Editing an ACTIVE retainer's terms schedules them for the next billing
 * cycle (pending slot); notes/start date apply immediately. Staff only.
 */
export async function setRetainer(input: {
  clientAccountId: string
  tier: RetainerTier
  monthlyFee?: number | null
  hoursPerMonth?: number | null
  overageRate?: number | null
  startDate?: string | null
  notes?: string | null
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
        where: { and: [{ clientAccount: { equals: input.clientAccountId } }, { status: { equals: 'active' } }] },
        limit: 1,
        depth: 0,
      })
      existing = (docs[0] as RetainerDoc | undefined) ?? null
    }
    if (existing) existing = await settleRetainer(payload, existing, now)

    // No active retainer → create immediately.
    if (!existing || existing.status !== 'active') {
      const created = await payload.create({
        collection: 'retainers',
        data: {
          clientAccount: input.clientAccountId,
          tier: input.tier,
          status: 'active',
          monthlyFee: input.monthlyFee ?? undefined,
          hoursPerMonth: input.hoursPerMonth ?? undefined,
          overageRate,
          startDate: input.startDate ? dayToIso(input.startDate) : undefined,
          notes: input.notes ?? undefined,
        } as any,
      })
      return { success: true as const, id: created.id, scheduledFor: null as string | null }
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
 * Create a projected (draft) work item — a planned task with no hours yet. `date` places
 * it in a billing cycle (use a next-cycle date to plan ahead). Staff only.
 */
export async function createDraft(input: {
  retainerId: string
  clientAccountId: string
  date: string
  description: string
  category?: TimeEntryCategory
  priority?: TimeEntryPriority
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
        hours: 0,
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

/**
 * Send retainer billing for one cycle: creates a client-facing Package (proposal)
 * whose cover lists next cycle's planned items (recap parity), a Stripe invoice for
 * the monthly fee + any overage, and a pending Order linked to both. The Order flows
 * through the normal pipeline (balance hook, invoice email, `invoice.paid` webhook).
 * One order per (retainer, cycle) — re-sending an already-billed cycle errors. Staff only.
 */
export async function sendRetainerBilling(clientAccountId: string, refDate?: string) {
  // Track created artifacts so a mid-flow failure can clean up (void invoice, drop package).
  let stripe: ReturnType<typeof getStripe> | null = null
  let finalizedInvoiceId: string | null = null
  let packageId: string | null = null
  let orderCreated = false

  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!clientAccountId) return { success: false as const, error: 'A client is required' }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const retainer = await loadActiveRetainer(payload, clientAccountId, now)
    if (!retainer) return { success: false as const, error: 'No active retainer for this client' }

    const cycle = cycleFor(anchorOf(retainer), refDate ? new Date(refDate).toISOString() : now)

    // Idempotency — one order per cycle.
    const existing = await findCycleOrder(payload, retainer.id, cycle.start)
    if (existing) {
      return { success: false as const, error: `This cycle is already billed (${existing.orderNumber})` }
    }

    // Cycle terms + totals (same derivation as the summary).
    const { docs: entryDocs } = await payload.find({
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
    const logged = (entryDocs as TimeEntryDoc[]).filter((e) => e.status !== 'draft')
    const terms = termsForCycle(retainer, cycle, logged, now)
    const totals = computeTotals(logged, terms.hoursPerMonth, terms.overageRate)

    const feeAmount = terms.monthlyFee ?? 0
    const totalAmount = Math.round((feeAmount + totals.overageAmount) * 100) / 100
    if (totalAmount <= 0) {
      return { success: false as const, error: 'Nothing to bill — no monthly fee or overage for this cycle' }
    }

    // Next cycle's planned items — same seeding as the recap's "next month priorities".
    const nextCycle = cycleFor(anchorOf(retainer), cycle.end)
    const { docs: nextDocs } = await payload.find({
      collection: 'retainer-time-entries',
      where: {
        and: [
          { clientAccount: { equals: clientAccountId } },
          { status: { equals: 'draft' } },
          { date: { greater_than_equal: nextCycle.start } },
          { date: { less_than: nextCycle.end } },
        ],
      },
      sort: 'date',
      depth: 0,
      limit: 100,
    })
    const planned = (nextDocs as TimeEntryDoc[]).map((d) => d.description?.trim() ?? '').filter(Boolean)

    // Stripe customer (validate → search-by-email → create; persist a new/changed id).
    const account = (await payload
      .findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 })
      .catch(() => null)) as { id: string; name?: string | null; email?: string | null; stripeCustomerId?: string | null } | null
    if (!account?.email) {
      return { success: false as const, error: 'Client account has no email — required for Stripe invoicing' }
    }
    stripe = getStripe()
    const { customerId } = await resolveStripeCustomer({
      email: account.email,
      name: account.name,
      existingCustomerId: account.stripeCustomerId,
      stripe,
    })
    if (customerId !== account.stripeCustomerId) {
      await payload
        .update({ collection: 'client-accounts', id: clientAccountId, data: { stripeCustomerId: customerId } as any })
        .catch((e) => console.warn('[sendRetainerBilling] Could not persist Stripe customer id:', e))
    }

    const tierLabel = TIER_LABEL[terms.tier]
    const billingName = `Retainer — ${tierLabel} · ${cycle.label}`
    const overageDesc = `Overage — ${totals.overageHours}h × $${terms.overageRate}/hr`

    // Itemized work-hour lines — every logged entry, oldest first, at $0 (the hours
    // are covered by the fee/overage lines, so the amount check still balances).
    // Each line shows its value: covered hours at the effective rate (fee ÷ cap),
    // hours past the cap at the overage rate — split by a running-hours counter.
    const round2 = (n: number) => Math.round(n * 100) / 100
    const effectiveRate = terms.hoursPerMonth > 0 ? feeAmount / terms.hoursPerMonth : 0
    const workEntries = [...logged].sort((a, b) => (a.date < b.date ? -1 : 1))
    let runningHours = 0
    const workLines = workEntries.map((e) => {
      const h = e.hours ?? 0
      const coveredH = round2(Math.max(0, Math.min(h, terms.hoursPerMonth - runningHours)))
      const overH = round2(h - coveredH)
      runningHours = round2(runningHours + h)
      const value = round2(coveredH * effectiveRate + overH * terms.overageRate)
      const calcParts = [
        coveredH > 0 ? `${coveredH}h × $${round2(effectiveRate)}/hr` : null,
        overH > 0 ? `${overH}h × $${terms.overageRate}/hr overage` : null,
      ].filter(Boolean)
      const category = RECAP_CATEGORY_LABEL[(e.category ?? 'work') as TimeEntryCategory]
      return {
        title: `${fmtEntryDay(e.date)} — ${e.description?.trim() || category}`,
        description: `${h}h · ${category} · ${calcParts.join(' + ')} = $${value}${overH > 0 ? '' : ' · included in retainer'}`,
        hours: h,
        value,
      }
    })
    const workValue = round2(workLines.reduce((sum, l) => sum + l.value, 0))

    // 1. Package (proposal, sent) — the client-facing billing document. Cover lists
    //    the hours summary and next cycle's planned work.
    const coverLines = [
      `Retainer billing for ${cycle.label}: ${totals.used} of ${terms.hoursPerMonth} hours used.`,
      workValue > 0 ? `Work delivered this cycle: $${workValue} in logged hours.` : null,
      totals.overageHours > 0 ? `Includes ${totals.overageHours}h of overage at $${terms.overageRate}/hr.` : null,
      planned.length
        ? `\nPlanned for ${nextCycle.label}:\n${planned.map((p) => `• ${p}`).join('\n')}`
        : null,
    ].filter(Boolean)

    const pkg = await payload.create({
      collection: 'packages',
      data: {
        name: billingName,
        type: 'proposal',
        status: 'sent',
        clientAccount: clientAccountId,
        coverMessage: coverLines.join('\n'),
        lineItems: [
          ...(feeAmount > 0
            ? [{
                name: `Monthly retainer — ${tierLabel}`,
                description: `${terms.hoursPerMonth} hrs/mo · ${cycle.label}`,
                billingType: 'fixed',
                price: feeAmount,
                quantity: 1,
              }]
            : []),
          ...(totals.overageAmount > 0
            ? [{
                name: overageDesc,
                description: cycle.label,
                billingType: 'fixed',
                price: totals.overageAmount,
                quantity: 1,
              }]
            : []),
          // Itemized hours — client-facing detail of the work the fee covered.
          ...workLines.map((line) => ({
            name: line.title,
            description: line.description,
            billingType: 'hourly',
            hours: line.hours,
            price: 0,
            quantity: 1,
          })),
        ],
      } as any,
    })
    packageId = pkg.id as string

    // 2. Stripe invoice — create → attach lines → finalize (amounts in dollars).
    const { invoice: finalized } = await createStripeInvoiceForOrder({
      stripe,
      stripeCustomerId: customerId,
      description: billingName,
      invoiceMetadata: {
        orcaclub_retainer_id: retainer.id,
        orcaclub_cycle_start: cycle.start,
        orcaclub_package_id: packageId,
      },
      lines: [
        ...(feeAmount > 0
          ? [{ description: `Monthly retainer — ${tierLabel} (${cycle.label})`, amount: feeAmount }]
          : []),
        ...(totals.overageAmount > 0 ? [{ description: overageDesc, amount: totals.overageAmount }] : []),
      ],
    })
    finalizedInvoiceId = finalized.id ?? null
    // Stripe assigns the invoice number at finalization — it becomes the order number.
    const orderNumber = finalized.number ?? finalized.id

    // 3. Order — pending; triggers updateClientBalance, pays via webhook or mark-as-paid.
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        clientAccount: clientAccountId,
        packageRef: packageId,
        retainerRef: retainer.id,
        retainerCycleStart: cycle.start,
        invoiceType: 'retainer',
        invoiceNote: billingName,
        amount: totalAmount,
        status: 'pending',
        stripeCustomerId: customerId,
        stripeInvoiceId: finalized.id,
        stripeInvoiceUrl: finalized.hosted_invoice_url || '',
        lineItems: [
          ...(feeAmount > 0
            ? [{ title: `Monthly retainer — ${tierLabel}`, description: cycle.label, price: feeAmount, quantity: 1 }]
            : []),
          ...(totals.overageAmount > 0 ? [{ title: overageDesc, price: totals.overageAmount, quantity: 1 }] : []),
          // Itemized hours at $0 — covered by the lines above; amount still balances.
          ...workLines.map((line) => ({ title: line.title, description: line.description, price: 0, quantity: 1 })),
        ],
      } as any,
    })
    orderCreated = true

    // 4. Record the invoice on the package's payment schedule (best-effort).
    await payload
      .update({
        collection: 'packages',
        id: packageId,
        data: {
          paymentSchedule: [{ label: billingName, amount: totalAmount, orderId: order.id, invoicedAt: now }],
        } as any,
      })
      .catch((e) => console.error('[sendRetainerBilling] Failed to update payment schedule:', e))

    // 5. Non-blocking invoice email to the client, linking the package print view.
    ;(async () => {
      try {
        const { docs: portalUsers } = await payload.find({
          collection: 'users',
          where: { clientAccount: { equals: clientAccountId } },
          limit: 1,
          depth: 0,
        })
        const username = (portalUsers[0] as { username?: string } | undefined)?.username
        const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://app.orcaclub.pro'
        const printUrl = username ? `${base}/u/${username}/packages/${packageId}/print` : undefined
        await sendGenericInvoiceEmail(payload, order.id, user.id, printUrl)
      } catch (e) {
        console.error('[sendRetainerBilling] Invoice email failed:', e)
      }
    })()

    return {
      success: true as const,
      orderId: order.id as string,
      orderNumber: orderNumber as string,
      invoiceUrl: finalized.hosted_invoice_url ?? null,
      packageId,
      plannedCount: planned.length,
    }
  } catch (error) {
    // Cleanup: void an orphaned Stripe invoice / drop an orphaned package (best-effort).
    if (!orderCreated) {
      if (finalizedInvoiceId && stripe) {
        stripe.invoices
          .voidInvoice(finalizedInvoiceId)
          .catch((e) => console.error('[sendRetainerBilling] Failed to void orphaned Stripe invoice:', e))
      }
      if (packageId) {
        const payload = await getPayload({ config }).catch(() => null)
        payload
          ?.delete({ collection: 'packages', id: packageId })
          .catch((e) => console.error('[sendRetainerBilling] Failed to remove orphaned package:', e))
      }
    }
    console.error('[sendRetainerBilling]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to send retainer billing' }
  }
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
