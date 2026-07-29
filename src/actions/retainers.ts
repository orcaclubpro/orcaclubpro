'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

// ── Shared shapes ───────────────────────────────────────────────────────────────

export type RetainerTier = 'basic' | 'growth' | 'enterprise'
export type RetainerStatus = 'active' | 'paused' | 'cancelled'
export type TimeEntryCategory = 'work' | 'meeting' | 'revision' | 'reporting'

export interface RetainerDoc {
  id: string
  clientAccount: string | { id: string }
  tier: RetainerTier
  status: RetainerStatus
  monthlyFee?: number | null
  hoursPerMonth?: number | null
  overageRate?: number | null
  startDate?: string | null
  notes?: string | null
}

export interface TimeEntryDoc {
  id: string
  date: string
  hours: number
  category?: TimeEntryCategory | null
  description?: string | null
  retainer: string | { id: string }
  clientAccount: string | { id: string }
  loggedBy?: string | { id: string } | null
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

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Current calendar month as `YYYY-MM` (UTC). */
function currentMonth(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

/** [start, end) ISO bounds for a `YYYY-MM` month (UTC). end = first day of next month. */
function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 1))
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Store a `YYYY-MM-DD` day at noon UTC so it never shifts across timezones. */
function dayToIso(date: string): string {
  // Accept full ISO too; take just the date part.
  const day = String(date).slice(0, 10)
  return new Date(`${day}T12:00:00.000Z`).toISOString()
}

const EMPTY_CATEGORIES: Record<TimeEntryCategory, number> = {
  work: 0,
  meeting: 0,
  revision: 0,
  reporting: 0,
}

function computeTotals(entries: TimeEntryDoc[], retainer: RetainerDoc | null): RetainerTotals {
  const cap = retainer?.hoursPerMonth ?? 0
  const overageRate = retainer?.overageRate ?? 65
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

// ── Reads ────────────────────────────────────────────────────────────────────────

/**
 * The active retainer for a client plus a month's entries and computed totals.
 * `month` is `YYYY-MM`; defaults to the current calendar month. Staff only.
 */
export async function getRetainerSummary(clientAccountId: string, month?: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!clientAccountId) return { success: false as const, error: 'A client is required' }

    const payload = await getPayload({ config })
    const mo = month ?? currentMonth()

    const { docs: retainers } = await payload.find({
      collection: 'retainers',
      where: { and: [{ clientAccount: { equals: clientAccountId } }, { status: { equals: 'active' } }] },
      limit: 1,
      depth: 0,
    })
    const retainer = (retainers[0] as RetainerDoc | undefined) ?? null

    let entries: TimeEntryDoc[] = []
    if (retainer) {
      const { start, end } = monthRange(mo)
      const res = await payload.find({
        collection: 'retainer-time-entries',
        where: {
          and: [
            { clientAccount: { equals: clientAccountId } },
            { date: { greater_than_equal: start } },
            { date: { less_than: end } },
          ],
        },
        sort: '-date',
        depth: 0,
        limit: 500,
      })
      entries = res.docs as TimeEntryDoc[]
    }

    return {
      success: true as const,
      retainer,
      entries,
      month: mo,
      totals: computeTotals(entries, retainer),
    }
  } catch (error) {
    console.error('[getRetainerSummary]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load retainer' }
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────────

/**
 * Create or update a client's retainer. One ACTIVE retainer per client — if one
 * already exists it is updated rather than duplicated. Staff only.
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

    const data = {
      clientAccount: input.clientAccountId,
      tier: input.tier,
      status: 'active',
      monthlyFee: input.monthlyFee ?? undefined,
      hoursPerMonth: input.hoursPerMonth ?? undefined,
      overageRate: input.overageRate ?? 65,
      startDate: input.startDate ? dayToIso(input.startDate) : undefined,
      notes: input.notes ?? undefined,
    }

    // Resolve the target: explicit id, else the client's existing active retainer.
    let targetId = input.retainerId
    if (!targetId) {
      const { docs } = await payload.find({
        collection: 'retainers',
        where: { and: [{ clientAccount: { equals: input.clientAccountId } }, { status: { equals: 'active' } }] },
        limit: 1,
        depth: 0,
      })
      targetId = (docs[0] as { id: string } | undefined)?.id
    }

    const retainer = targetId
      ? await payload.update({ collection: 'retainers', id: targetId, data: data as any })
      : await payload.create({ collection: 'retainers', data: data as any })

    return { success: true as const, id: retainer.id, retainer: retainer as unknown as RetainerDoc }
  } catch (error) {
    console.error('[setRetainer]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to save retainer' }
  }
}

/** Log a block of hours against a retainer. Stamps the logging staff member. */
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
    const entry = await payload.create({
      collection: 'retainer-time-entries',
      data: {
        retainer: input.retainerId,
        clientAccount: input.clientAccountId,
        date: dayToIso(input.date),
        hours: input.hours,
        category: input.category ?? 'work',
        description: input.description || undefined,
        loggedBy: user.id,
      } as any,
    })

    return { success: true as const, id: entry.id, entry: entry as unknown as TimeEntryDoc }
  } catch (error) {
    console.error('[logHours]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to log hours' }
  }
}

/** Delete a logged time entry. Staff only. */
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
