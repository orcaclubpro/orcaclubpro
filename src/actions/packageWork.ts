// src/actions/packageWork.ts
'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { buildWorkLines, type WorkCategory } from '@/lib/packages/workLines'
import { derivePackageRecapDefaults, type PackageRecapEntryInput } from '@/lib/packages/recap'

export type WorkEntryStatus = 'planned' | 'logged'
export type WorkEntryCompletion = 'incomplete' | 'complete'

export interface WorkEntryRow {
  id: string
  date: string
  status: WorkEntryStatus
  completion: WorkEntryCompletion
  category: WorkCategory
  hours: number | null
  description: string
  billedOrderId: string | null
  loggedBy: string | null
}

export interface ScheduleRow {
  id: string
  label: string
  entryType: 'deposit' | 'installment' | 'balance' | null
  amount: number
  dueDate: string | null
  orderId: string | null
  invoicedAt: string | null
  paid: boolean
}

/** Normalize a day-only date string to a stable ISO instant (matches retainers' dayToIso). */
function dayToIso(date: string): string {
  const d = date.length === 10 ? `${date}T00:00:00.000Z` : date
  return new Date(d).toISOString()
}

function toRow(e: any): WorkEntryRow {
  return {
    id: e.id,
    date: typeof e.date === 'string' ? e.date : new Date(e.date).toISOString(),
    status: (e.status ?? 'logged') as WorkEntryStatus,
    completion: (e.completion ?? 'incomplete') as WorkEntryCompletion,
    category: (e.category ?? 'work') as WorkCategory,
    hours: e.hours ?? null,
    description: e.description ?? '',
    billedOrderId: e.billedOrderId || null,
    loggedBy: typeof e.loggedBy === 'object' ? e.loggedBy?.id ?? null : e.loggedBy ?? null,
  }
}

function toEntryInput(r: WorkEntryRow): PackageRecapEntryInput {
  return { date: r.date, description: r.description, hours: r.hours, category: r.category }
}

/**
 * Load a proposal package and its client account id. Work entries only ever attach to
 * `type: 'proposal'` packages — enforced here rather than in the collection so the
 * error is a clean action result instead of a validation throw.
 */
async function loadProposal(
  payload: Awaited<ReturnType<typeof getPayload>>,
  packageId: string,
): Promise<{ pkg: any; clientAccountId: string } | null> {
  const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 0 }).catch(() => null)
  if (!pkg || (pkg as any).type !== 'proposal') return null
  const ca = (pkg as any).clientAccount
  const clientAccountId = typeof ca === 'object' && ca ? ca.id : ca
  if (!clientAccountId) return null
  return { pkg, clientAccountId }
}

// ── Writes ───────────────────────────────────────────────────────────────────────

/** Log completed work against a package. Pending until a scheduled-payment invoice consumes it. Staff only. */
export async function logPackageWork(input: {
  packageId: string
  date: string
  hours?: number
  category?: WorkCategory
  description: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.packageId) return { success: false as const, error: 'No package selected' }
    if (!input.date) return { success: false as const, error: 'A date is required' }
    if (!input.description?.trim()) return { success: false as const, error: 'Describe the work' }
    if (input.hours !== undefined && input.hours < 0) return { success: false as const, error: 'Hours cannot be negative' }

    const payload = await getPayload({ config })
    const loaded = await loadProposal(payload, input.packageId)
    if (!loaded) return { success: false as const, error: 'Package proposal not found' }

    const entry = await payload.create({
      collection: 'package-work-entries',
      data: {
        package: input.packageId,
        clientAccount: loaded.clientAccountId,
        date: dayToIso(input.date),
        hours: input.hours ?? undefined,
        status: 'logged',
        completion: 'incomplete',
        category: input.category ?? 'work',
        description: input.description.trim(),
        loggedBy: user.id,
      } as any,
    })

    return { success: true as const, id: entry.id, entry: toRow(entry) }
  } catch (error) {
    console.error('[logPackageWork]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to log work' }
  }
}

/** Create a planned work item — "what's left" until it is logged. Staff only. */
export async function createPackagePlan(input: {
  packageId: string
  date: string
  description: string
  category?: WorkCategory
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.packageId) return { success: false as const, error: 'No package selected' }
    if (!input.date) return { success: false as const, error: 'A date is required' }
    if (!input.description?.trim()) return { success: false as const, error: 'Describe the planned work' }

    const payload = await getPayload({ config })
    const loaded = await loadProposal(payload, input.packageId)
    if (!loaded) return { success: false as const, error: 'Package proposal not found' }

    const entry = await payload.create({
      collection: 'package-work-entries',
      data: {
        package: input.packageId,
        clientAccount: loaded.clientAccountId,
        date: dayToIso(input.date),
        status: 'planned',
        completion: 'incomplete',
        category: input.category ?? 'work',
        description: input.description.trim(),
        loggedBy: user.id,
      } as any,
    })

    return { success: true as const, id: entry.id, entry: toRow(entry) }
  } catch (error) {
    console.error('[createPackagePlan]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to create plan' }
  }
}

/**
 * Log a planned item as done WITHOUT consuming it. Creates a separate logged entry and
 * marks the plan complete, so the plan list keeps a permanent record — same pattern as
 * the retainer's logPlannedHours. Staff only.
 */
export async function logPlannedWork(input: {
  planId: string
  date?: string
  hours?: number
  category?: WorkCategory
  description?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.planId) return { success: false as const, error: 'No planned item selected' }

    const payload = await getPayload({ config })
    const plan = await payload
      .findByID({ collection: 'package-work-entries', id: input.planId, depth: 0 })
      .catch(() => null)
    if (!plan) return { success: false as const, error: 'Planned item not found' }
    if ((plan as any).status !== 'planned') return { success: false as const, error: 'That entry is not a planned item' }

    const packageId = typeof (plan as any).package === 'object' ? (plan as any).package.id : (plan as any).package

    const logged = await logPackageWork({
      packageId,
      date: input.date ?? String((plan as any).date).slice(0, 10),
      hours: input.hours,
      category: input.category ?? ((plan as any).category ?? 'work'),
      description: input.description ?? (plan as any).description ?? '',
    })
    if (!logged.success) return logged

    await payload.update({
      collection: 'package-work-entries',
      id: input.planId,
      data: { completion: 'complete' } as any,
    })

    return { success: true as const, id: logged.id }
  } catch (error) {
    console.error('[logPlannedWork]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to log planned work' }
  }
}

/**
 * Edit an entry in place. Editing never changes an entry's kind: a planned item stays
 * planned even with hours set, and a logged entry stays logged. Entries already consumed
 * by an invoice are frozen — the client has seen them on a document. Staff only.
 */
export async function updateWorkEntry(input: {
  id: string
  date?: string
  hours?: number
  category?: WorkCategory
  completion?: WorkEntryCompletion
  description?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.id) return { success: false as const, error: 'No entry selected' }

    const payload = await getPayload({ config })
    const existing = await payload
      .findByID({ collection: 'package-work-entries', id: input.id, depth: 0 })
      .catch(() => null)
    if (!existing) return { success: false as const, error: 'Entry not found' }
    if ((existing as any).billedOrderId) {
      return { success: false as const, error: 'This entry is already on an invoice and cannot be edited' }
    }

    const data: Record<string, unknown> = {}
    if (input.date !== undefined) data.date = dayToIso(input.date)
    if (input.hours !== undefined) data.hours = input.hours
    if (input.category !== undefined) data.category = input.category
    if (input.completion !== undefined) data.completion = input.completion
    if (input.description !== undefined) data.description = input.description

    const updated = await payload.update({ collection: 'package-work-entries', id: input.id, data: data as any })
    return { success: true as const, id: input.id, entry: toRow(updated) }
  } catch (error) {
    console.error('[updateWorkEntry]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update entry' }
  }
}

/** Delete an unbilled work entry. Billed entries are frozen. Staff only. */
export async function deleteWorkEntry(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!id) return { success: false as const, error: 'No entry selected' }

    const payload = await getPayload({ config })
    const existing = await payload
      .findByID({ collection: 'package-work-entries', id, depth: 0 })
      .catch(() => null)
    if (!existing) return { success: false as const, error: 'Entry not found' }
    if ((existing as any).billedOrderId) {
      return { success: false as const, error: 'This entry is already on an invoice and cannot be deleted' }
    }

    await payload.delete({ collection: 'package-work-entries', id })
    return { success: true as const }
  } catch (error) {
    console.error('[deleteWorkEntry]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to delete entry' }
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────────

/**
 * Everything the Milestones station needs for one package: the work log split into
 * pending / billed / planned, plus the payment schedule joined to order status. Staff only.
 */
export async function getPackageWorkSummary(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!packageId) return { success: false as const, error: 'A package is required' }

    const payload = await getPayload({ config })
    const loaded = await loadProposal(payload, packageId)
    if (!loaded) return { success: false as const, error: 'Package proposal not found' }

    const { docs } = await payload.find({
      collection: 'package-work-entries',
      where: { package: { equals: packageId } },
      depth: 0,
      sort: 'date',
      limit: 1000,
    })
    const rows = (docs as any[]).map(toRow)

    const schedule = (((loaded.pkg as any).paymentSchedule ?? []) as any[]).map((e) => ({
      id: e.id as string,
      label: (e.label ?? '') as string,
      entryType: (e.entryType ?? null) as ScheduleRow['entryType'],
      amount: (e.amount ?? 0) as number,
      dueDate: (e.dueDate ?? null) as string | null,
      orderId: (e.orderId ?? null) as string | null,
      invoicedAt: (e.invoicedAt ?? null) as string | null,
      paid: false,
    }))

    // Join order status so the timeline can show paid ● vs invoiced ●.
    const orderIds = schedule.map((s) => s.orderId).filter(Boolean) as string[]
    if (orderIds.length > 0) {
      const { docs: orders } = await payload.find({
        collection: 'orders',
        where: { id: { in: orderIds } },
        depth: 0,
        limit: orderIds.length,
      })
      const paidById = new Map((orders as any[]).map((o) => [o.id, o.status === 'paid']))
      for (const s of schedule) {
        if (s.orderId) s.paid = paidById.get(s.orderId) ?? false
      }
    }

    const account = await payload
      .findByID({ collection: 'client-accounts', id: loaded.clientAccountId, depth: 0 })
      .catch(() => null)

    return {
      success: true as const,
      package: {
        id: packageId,
        name: ((loaded.pkg as any).name ?? 'Package') as string,
        clientAccountId: loaded.clientAccountId,
        clientName: ((account as any)?.name ?? 'Client') as string,
        clientCompany: (((account as any)?.company ?? null) as string | null),
      },
      pending: rows.filter((r) => r.status === 'logged' && !r.billedOrderId),
      billed: rows.filter((r) => r.status === 'logged' && !!r.billedOrderId),
      planned: rows.filter((r) => r.status === 'planned'),
      schedule,
    }
  } catch (error) {
    console.error('[getPackageWorkSummary]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load work summary' }
  }
}

export interface MilestonePortfolioRow {
  clientAccountId: string
  clientName: string
  clientCompany: string | null
  packageId: string
  packageName: string
  nextEntry: { id: string; label: string; amount: number; dueDate: string | null } | null
  pendingWorkCount: number
  plannedOpenCount: number
  /** A payment is due within 30 days and there is unbilled logged work. */
  needsRecap: boolean
}

/** Every proposal package with a pending scheduled payment, soonest due first. Staff only. */
export async function getMilestonePortfolio() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    const { docs: packages } = await payload.find({
      collection: 'packages',
      where: { type: { equals: 'proposal' } } as any,
      depth: 0,
      limit: 300,
    })

    // Keep only packages with at least one un-invoiced schedule entry.
    const candidates = (packages as any[])
      .map((pkg) => {
        const pending = ((pkg.paymentSchedule ?? []) as any[])
          .filter((e) => !(e.orderId && e.invoicedAt))
          .sort((a, b) => String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999')))
        return { pkg, pending }
      })
      .filter((c) => c.pending.length > 0)

    if (candidates.length === 0) return { success: true as const, rows: [] as MilestonePortfolioRow[] }

    const clientIds = [
      ...new Set(
        candidates
          .map((c) => (typeof c.pkg.clientAccount === 'object' ? c.pkg.clientAccount?.id : c.pkg.clientAccount))
          .filter(Boolean),
      ),
    ] as string[]
    const { docs: accounts } = clientIds.length
      ? await payload.find({ collection: 'client-accounts', where: { id: { in: clientIds } }, depth: 0, limit: clientIds.length })
      : { docs: [] as any[] }
    const acctById = new Map((accounts as any[]).map((a) => [a.id, { name: a.name as string, company: (a.company ?? null) as string | null }]))

    // One query for every candidate package's entries, then bucket in memory.
    const packageIds = candidates.map((c) => c.pkg.id as string)
    const { docs: entries } = await payload.find({
      collection: 'package-work-entries',
      where: { package: { in: packageIds } },
      depth: 0,
      limit: 5000,
    })
    const byPackage = new Map<string, { pending: number; plannedOpen: number }>()
    for (const e of entries as any[]) {
      const pid = typeof e.package === 'object' ? e.package?.id : e.package
      if (!pid) continue
      const bucket = byPackage.get(pid) ?? { pending: 0, plannedOpen: 0 }
      if (e.status === 'logged' && !e.billedOrderId) bucket.pending += 1
      if (e.status === 'planned' && e.completion !== 'complete') bucket.plannedOpen += 1
      byPackage.set(pid, bucket)
    }

    const soon = Date.now() + 30 * 86_400_000
    const rows: MilestonePortfolioRow[] = candidates.map(({ pkg, pending }) => {
      const clientAccountId = (typeof pkg.clientAccount === 'object' ? pkg.clientAccount?.id : pkg.clientAccount) as string
      const acct = acctById.get(clientAccountId)
      const counts = byPackage.get(pkg.id as string) ?? { pending: 0, plannedOpen: 0 }
      const next = pending[0]
      const dueSoon = next?.dueDate ? Date.parse(next.dueDate) <= soon : false
      return {
        clientAccountId,
        clientName: acct?.name ?? 'Client',
        clientCompany: acct?.company ?? null,
        packageId: pkg.id as string,
        packageName: (pkg.name ?? 'Package') as string,
        nextEntry: next
          ? { id: next.id as string, label: (next.label ?? '') as string, amount: (next.amount ?? 0) as number, dueDate: (next.dueDate ?? null) as string | null }
          : null,
        pendingWorkCount: counts.pending,
        plannedOpenCount: counts.plannedOpen,
        needsRecap: dueSoon && counts.pending > 0,
      }
    })

    // Soonest pending due date first; undated entries sort last.
    rows.sort((a, b) => {
      const ad = a.nextEntry?.dueDate ?? '9999'
      const bd = b.nextEntry?.dueDate ?? '9999'
      if (ad !== bd) return ad.localeCompare(bd)
      return a.clientName.localeCompare(b.clientName)
    })

    return { success: true as const, rows }
  } catch (error) {
    console.error('[getMilestonePortfolio]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load portfolio' }
  }
}

/**
 * The default recap for one scheduled payment — the model the composer opens with.
 * Numbers come from the package's schedule and its pending work log; narrative fields
 * start blank. Staff only.
 */
export async function getPackageRecapModel(packageId: string, entryId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!packageId || !entryId) return { success: false as const, error: 'A package and payment are required' }

    const summary = await getPackageWorkSummary(packageId)
    if (!summary.success) return { success: false as const, error: summary.error }

    const idx = summary.schedule.findIndex((s) => s.id === entryId)
    if (idx === -1) return { success: false as const, error: 'Schedule entry not found' }
    const entry = summary.schedule[idx]

    const packageTotal = summary.schedule.reduce((s, e) => s + (e.amount ?? 0), 0)
    const amountPaid = summary.schedule.filter((e) => e.paid).reduce((s, e) => s + (e.amount ?? 0), 0)
    const remainingPayments = summary.schedule
      .slice(idx + 1)
      .filter((e) => !(e.orderId && e.invoicedAt))
      .map((e) => ({ label: e.label, amount: e.amount, dueDate: e.dueDate }))

    const model = derivePackageRecapDefaults({
      clientName: summary.package.clientName,
      clientCompany: summary.package.clientCompany,
      packageName: summary.package.name,
      paymentLabel: entry.label,
      paymentAmount: entry.amount,
      paymentDueDate: entry.dueDate,
      paymentIndex: idx + 1,
      paymentCount: summary.schedule.length,
      packageTotal,
      amountPaid,
      loggedEntries: summary.pending.map(toEntryInput),
      plannedOpen: summary.planned.filter((p) => p.completion !== 'complete').map(toEntryInput),
      remainingPayments,
    })

    return {
      success: true as const,
      model,
      packageId,
      entryId,
      /**
       * The pending entries this recap covers, already formatted as the exact $0 lines
       * the invoice will carry. Date-ordered and id-carrying, so the send modal can show
       * a deselectable list that matches the invoice one-for-one. (The recap's `buckets`
       * regroup the same work by category and carry no ids — do not use them for this.)
       */
      workLines: buildWorkLines(
        summary.pending.map((p) => ({
          id: p.id,
          date: p.date,
          description: p.description,
          hours: p.hours,
          category: p.category,
        })),
      ),
    }
  } catch (error) {
    console.error('[getPackageRecapModel]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to build recap' }
  }
}
