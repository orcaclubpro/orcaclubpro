'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { ServiceItem } from '@/types/payload-types'

// ── Shared line-item input shape (used by the builder) ──────────────────────────

export interface BuilderLineItem {
  name: string
  description?: string | null
  billingType?: 'fixed' | 'hourly' | 'recurring'
  price: number
  adjustedPrice?: number | null
  quantity?: number
  hours?: number | null
  recurringInterval?: 'month' | 'year'
  contractTermMonths?: number | null
  isAddOn?: boolean
  sourceServiceItem?: string | null
}

/**
 * Normalize a builder line item into the shape Packages expects, deriving the
 * legacy isRecurring/recurringInterval fields from billingType so every existing
 * consumer (computeTotals, PDF, email, order creation) keeps working unchanged.
 * price stays the source of truth for all money math.
 */
function normalizeLineItem(item: BuilderLineItem) {
  const billingType = item.billingType ?? 'fixed'
  const quantity = item.quantity ?? 1

  // Hourly: total = hours × rate is stored in price. If the caller already
  // computed price we respect it; otherwise derive from hours × price-as-rate.
  let price = item.price ?? 0
  if (billingType === 'hourly' && item.hours != null && item.hours > 0) {
    // price is treated as the per-hour rate when hours is present
    price = Math.round(item.price * item.hours * 100) / 100
  }

  const isRecurring = billingType === 'recurring'

  return {
    name: item.name,
    description: item.description ?? undefined,
    billingType,
    price,
    adjustedPrice: item.adjustedPrice ?? undefined,
    quantity,
    hours: billingType === 'hourly' ? item.hours ?? undefined : undefined,
    isRecurring,
    recurringInterval: isRecurring ? item.recurringInterval ?? 'month' : undefined,
    contractTermMonths: isRecurring ? item.contractTermMonths ?? undefined : undefined,
    isAddOn: item.isAddOn ?? false,
    sourceServiceItem: item.sourceServiceItem ?? undefined,
  }
}

// ── Catalog reads/writes ────────────────────────────────────────────────────────

/** Returns non-archived service catalog items for the builder rail. */
export async function getServiceCatalog() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, items: [] as ServiceItem[], error: 'Unauthorized' }

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'service-items',
      where: { archived: { not_equals: true } },
      // Starred items first, then most-used
      sort: ['-starred', '-usageCount'],
      limit: 200,
      depth: 0,
    })

    return { success: true, items: docs as ServiceItem[] }
  } catch (error) {
    console.error('[getServiceCatalog]', error)
    return { success: false, items: [] as ServiceItem[], error: error instanceof Error ? error.message : 'Failed' }
  }
}

/** Star / unstar a catalog item — starred items render first in the builder. Admin/user only. */
export async function toggleServiceItemStar(id: string, starred: boolean) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    await payload.update({ collection: 'service-items', id, data: { starred } as any })
    return { success: true, starred }
  } catch (error) {
    console.error('[toggleServiceItemStar]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update' }
  }
}

/** Delete a catalog item. Admin only (matches the collection's delete access). */
export async function deleteServiceItem(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') return { success: false, error: 'Only admins can delete catalog items' }

    const payload = await getPayload({ config })
    await payload.delete({ collection: 'service-items', id })
    return { success: true }
  } catch (error) {
    console.error('[deleteServiceItem]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete' }
  }
}

/** Creates a new catalog service item (from the builder's inline "new service item" form). */
export async function createServiceItem(data: {
  name: string
  description?: string
  billingType: 'fixed' | 'hourly' | 'recurring'
  defaultPrice?: number
  defaultRate?: number
  defaultInterval?: 'month' | 'year'
  starred?: boolean
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    const item = await payload.create({
      collection: 'service-items',
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        billingType: data.billingType,
        defaultPrice: data.defaultPrice,
        defaultRate: data.defaultRate ?? 40,
        defaultInterval: data.defaultInterval ?? 'month',
        starred: data.starred ?? false,
        archived: false,
        usageCount: 0,
      } as any,
    })

    return { success: true, item: item as ServiceItem }
  } catch (error) {
    console.error('[createServiceItem]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create service item' }
  }
}

/**
 * Edit a catalog item in place. Existing package lines are NOT touched — they hold a
 * snapshot taken when they were placed (see the ServiceItems doc comment), which is the
 * whole point of the copy model: fixing a typo in the catalog must never rewrite a
 * proposal a client has already been sent.
 */
export async function updateServiceItem(
  id: string,
  data: {
    name: string
    description?: string | null
    billingType: 'fixed' | 'hourly' | 'recurring'
    defaultPrice?: number | null
    defaultRate?: number | null
    defaultInterval?: 'month' | 'year'
    starred?: boolean
  },
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!id) return { success: false as const, error: 'No catalog item selected' }
    if (!data.name?.trim()) return { success: false as const, error: 'A name is required' }

    const payload = await getPayload({ config })
    const item = await payload.update({
      collection: 'service-items',
      id,
      data: {
        name: data.name.trim(),
        // null clears the field; undefined would leave the old text in place.
        description: data.description?.trim() || null,
        billingType: data.billingType,
        defaultPrice: data.billingType === 'hourly' ? null : (data.defaultPrice ?? null),
        defaultRate: data.billingType === 'hourly' ? (data.defaultRate ?? 40) : undefined,
        defaultInterval: data.billingType === 'recurring' ? (data.defaultInterval ?? 'month') : undefined,
        ...(data.starred === undefined ? {} : { starred: data.starred }),
      } as any,
    })

    return { success: true as const, item: item as ServiceItem }
  } catch (error) {
    console.error('[updateServiceItem]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update service item' }
  }
}

/** Increment usageCount for a set of catalog item ids (best-effort, non-blocking). */
async function bumpUsage(payload: Awaited<ReturnType<typeof getPayload>>, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))]
  await Promise.all(
    unique.map(async (id) => {
      try {
        const current = await payload.findByID({ collection: 'service-items', id, depth: 0 })
        await payload.update({
          collection: 'service-items',
          id,
          data: { usageCount: ((current as any)?.usageCount ?? 0) + 1 } as any,
        })
      } catch (e) {
        console.error('[bumpUsage] failed for', id, e)
      }
    }),
  )
}

// ── Opening an existing package in the builder ──────────────────────────────────

/** One row in the builder's package picker — enough to choose by, nothing heavier. */
export interface BuilderPackageRow {
  id: string
  name: string
  type: 'template' | 'proposal'
  status: string | null
  clientId: string | null
  clientLabel: string | null
  lineCount: number
  total: number
  updatedAt: string
}

/**
 * Everything the builder can open: templates to clone from, and proposals to edit or
 * clone. Deliberately light — `select` keeps the list query off the full line-item
 * arrays, and the chosen package is fetched whole by `getPackageForBuilder`.
 */
export async function getBuilderPackages() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') {
      return { success: false as const, packages: [] as BuilderPackageRow[], error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'packages',
      sort: '-updatedAt',
      limit: 200,
      depth: 1,
      select: {
        name: true, type: true, status: true, clientAccount: true, lineItems: true, updatedAt: true,
      } as any,
    })

    const packages: BuilderPackageRow[] = (docs as any[]).map((d) => {
      const ca = d.clientAccount
      const items = (d.lineItems ?? []) as any[]
      // Add-ons are an offer, not a price — same rule the proposal documents follow.
      const total = items
        .filter((li) => !li.isAddOn)
        .reduce((sum, li) => sum + (li.adjustedPrice ?? li.price ?? 0) * (li.quantity ?? 1), 0)
      return {
        id: d.id as string,
        name: (d.name as string) ?? 'Untitled',
        type: (d.type as 'template' | 'proposal') ?? 'template',
        status: (d.status as string) ?? null,
        clientId: ca ? (typeof ca === 'string' ? ca : (ca.id as string)) : null,
        clientLabel: ca && typeof ca === 'object' ? (ca.company || ca.name) ?? null : null,
        lineCount: items.length,
        total: Math.round(total * 100) / 100,
        updatedAt: String(d.updatedAt ?? ''),
      }
    })

    return { success: true as const, packages }
  } catch (error) {
    console.error('[getBuilderPackages]', error)
    return {
      success: false as const,
      packages: [] as BuilderPackageRow[],
      error: error instanceof Error ? error.message : 'Failed to load packages',
    }
  }
}

/**
 * The full package, shaped for the builder to load.
 *
 * `mode: 'clone'` strips everything that belongs to the ORIGINAL rather than to the
 * work: the payment schedule's `orderId`/`invoicedAt` stamps above all. Copying those
 * would make a brand-new package look already invoiced, and `pushPackageSchedule`
 * skips stamped rows — so the clone could never be billed.
 */
export async function getPackageForBuilder(packageId: string, mode: 'edit' | 'clone' = 'edit') {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!packageId) return { success: false as const, error: 'No package selected' }

    const payload = await getPayload({ config })
    const doc = (await payload.findByID({ collection: 'packages', id: packageId, depth: 1 }).catch(() => null)) as any
    if (!doc) return { success: false as const, error: 'Package not found' }

    const cloning = mode === 'clone'
    const ca = doc.clientAccount
    const schedule = ((doc.paymentSchedule ?? []) as any[]).map((e) => ({
      label: e?.label ?? '',
      entryType: e?.entryType ?? 'installment',
      amount: e?.amount ?? 0,
      dueDate: e?.dueDate ?? null,
      // Billing state stays with the original.
      orderId: cloning ? null : (e?.orderId ?? null),
      invoicedAt: cloning ? null : (e?.invoicedAt ?? null),
    }))

    return {
      success: true as const,
      package: {
        id: doc.id as string,
        // A template becomes a proposal on clone, so its name carries over as-is; a
        // cloned proposal is marked so two rows for one client stay tellable apart.
        name: cloning && doc.type === 'proposal' ? `${doc.name} (copy)` : (doc.name as string),
        type: (doc.type as 'template' | 'proposal') ?? 'template',
        description: doc.description ?? null,
        coverMessage: doc.coverMessage ?? null,
        notes: doc.notes ?? null,
        hourlyRate: doc.hourlyRate ?? null,
        // A clone is unattached work until it is saved somewhere — carrying the source's
        // project would silently file it under a job it has nothing to do with.
        projectRef: cloning ? null : (doc.projectRef ?? null),
        clientAccount: ca
          ? typeof ca === 'string'
            ? ca
            : { id: ca.id as string, name: (ca.name as string) ?? '', company: ca.company ?? null }
          : null,
        lineItems: (doc.lineItems ?? []) as any[],
        paymentSchedule: schedule,
        /** The template a clone came from — recorded as provenance on save. */
        sourcePackage: cloning && doc.type === 'template' ? (doc.id as string) : null,
      },
    }
  } catch (error) {
    console.error('[getPackageForBuilder]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load package' }
  }
}

// ── Proposal creation (replaces template → assignPackageToClient) ────────────────

/**
 * Create a proposal directly for a client — no shadow template. Saves as a draft
 * by default; status only advances when the proposal is actually sent/invoiced.
 */
export async function createProposal(input: {
  clientAccountId: string
  name: string
  description?: string
  coverMessage?: string
  notes?: string
  projectRef?: string | null
  /** Default USD/hr for hourly lines added in the builder. Null clears it. */
  hourlyRate?: number | null
  /** Template this proposal was cloned from — provenance only. */
  sourcePackage?: string | null
  lineItems: BuilderLineItem[]
  paymentSchedule?: Array<{
    label: string
    entryType?: 'deposit' | 'installment' | 'balance'
    amount: number
    dueDate?: string
    /** Round-tripped from the stored entry — the builder never authors these. */
    orderId?: string | null
    invoicedAt?: string | null
  }>
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    if (!input.clientAccountId) return { success: false, error: 'A client is required' }
    if (!input.name?.trim()) return { success: false, error: 'A package name is required' }

    const payload = await getPayload({ config })

    const lineItems = (input.lineItems ?? []).map(normalizeLineItem)

    const proposal = await payload.create({
      collection: 'packages',
      data: {
        name: input.name.trim(),
        description: input.description,
        coverMessage: input.coverMessage,
        notes: input.notes,
        type: 'proposal',
        status: 'draft',
        clientAccount: input.clientAccountId,
        projectRef: input.projectRef || undefined,
        hourlyRate: input.hourlyRate ?? undefined,
        sourcePackage: input.sourcePackage || undefined,
        lineItems,
        paymentSchedule: input.paymentSchedule ?? [],
      } as any,
    })

    // Best-effort usage counting for catalog provenance
    await bumpUsage(
      payload,
      (input.lineItems ?? []).map((li) => li.sourceServiceItem).filter(Boolean) as string[],
    )

    revalidatePath(`/u/${user.username}/clients/${input.clientAccountId}`)

    return { success: true, id: proposal.id, proposal }
  } catch (error) {
    console.error('[createProposal]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create proposal' }
  }
}

/** Update an existing proposal's core fields + line items (builder edit mode). */
export async function updateProposal(input: {
  packageId: string
  name: string
  description?: string
  coverMessage?: string
  notes?: string
  projectRef?: string | null
  /** Default USD/hr for hourly lines added in the builder. Null clears it. */
  hourlyRate?: number | null
  lineItems: BuilderLineItem[]
  paymentSchedule?: Array<{
    label: string
    entryType?: 'deposit' | 'installment' | 'balance'
    amount: number
    dueDate?: string
    /** Round-tripped from the stored entry — the builder never authors these. */
    orderId?: string | null
    invoicedAt?: string | null
  }>
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const existing = await payload.findByID({ collection: 'packages', id: input.packageId, depth: 0 })
    // Only bump an accepted proposal back to 'sent' on edit — never silently mark a draft as sent.
    const statusReset = (existing as any)?.status === 'accepted' ? { status: 'sent' as const } : {}

    const lineItems = (input.lineItems ?? []).map(normalizeLineItem)

    const proposal = await payload.update({
      collection: 'packages',
      id: input.packageId,
      data: {
        name: input.name.trim(),
        description: input.description,
        coverMessage: input.coverMessage,
        notes: input.notes,
        projectRef: input.projectRef || null,
        hourlyRate: input.hourlyRate ?? null,
        lineItems,
        ...(input.paymentSchedule ? { paymentSchedule: input.paymentSchedule } : {}),
        ...statusReset,
      } as any,
    })

    await bumpUsage(
      payload,
      (input.lineItems ?? []).map((li) => li.sourceServiceItem).filter(Boolean) as string[],
    )

    if (user.username) revalidatePath(`/u/${user.username}/clients`)

    return { success: true, id: proposal.id, proposal }
  } catch (error) {
    console.error('[updateProposal]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update proposal' }
  }
}
