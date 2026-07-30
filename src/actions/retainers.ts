'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cycleFor, nextCycleStart, type Cycle } from '@/lib/retainers/cycle'

// ── Shared shapes ───────────────────────────────────────────────────────────────

export type RetainerTier = 'basic' | 'growth' | 'enterprise'
export type RetainerStatus = 'active' | 'inactive'
export type TimeEntryCategory = 'work' | 'meeting' | 'revision' | 'reporting'
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

/** Log actual hours against a retainer — freezes the terms in effect on that date. Staff only. */
export async function logHours(input: {
  retainerId: string
  clientAccountId: string
  date: string
  hours: number
  category?: TimeEntryCategory
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
 * Edit an entry. Setting hours > 0 on a draft CONVERTS it to a logged entry and freezes
 * the terms in effect on its date; editing an already-logged entry leaves its frozen
 * terms untouched (an edit changes the work item, not the contract). Staff only.
 */
export async function updateTimeEntry(input: {
  id: string
  date?: string
  hours?: number
  category?: TimeEntryCategory
  description?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.id) return { success: false as const, error: 'No entry selected' }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const entry = (await payload
      .findByID({ collection: 'retainer-time-entries', id: input.id, depth: 0 })
      .catch(() => null)) as TimeEntryDoc | null
    if (!entry) return { success: false as const, error: 'Entry not found' }

    const data: Record<string, unknown> = {}
    if (input.date !== undefined) data.date = dayToIso(input.date)
    if (input.category !== undefined) data.category = input.category
    if (input.description !== undefined) data.description = input.description
    if (input.hours !== undefined) data.hours = input.hours

    const nextHours = input.hours ?? entry.hours
    const nextDate = (data.date as string | undefined) ?? entry.date

    // Draft → logged conversion: freeze terms in effect on the entry's date.
    if (entry.status === 'draft' && nextHours > 0) {
      data.status = 'logged'
      data.loggedBy = user.id
      const retId = typeof entry.retainer === 'object' ? entry.retainer.id : entry.retainer
      const raw = (await payload
        .findByID({ collection: 'retainers', id: retId, depth: 0 })
        .catch(() => null)) as RetainerDoc | null
      const retainer = raw ? await settleRetainer(payload, raw, now) : null
      if (retainer) {
        const terms = effectiveTerms(retainer, new Date(nextDate).toISOString())
        data.capAtLog = terms.hoursPerMonth
        data.overageRateAtLog = terms.overageRate
        data.feeAtLog = terms.monthlyFee
        data.tierAtLog = terms.tier
      }
    }

    const updated = await payload.update({ collection: 'retainer-time-entries', id: input.id, data: data as any })
    return { success: true as const, id: input.id, entry: updated as unknown as TimeEntryDoc }
  } catch (error) {
    console.error('[updateTimeEntry]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update entry' }
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
