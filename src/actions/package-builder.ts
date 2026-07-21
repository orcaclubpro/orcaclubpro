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
      sort: '-usageCount',
      limit: 200,
      depth: 0,
    })

    return { success: true, items: docs as ServiceItem[] }
  } catch (error) {
    console.error('[getServiceCatalog]', error)
    return { success: false, items: [] as ServiceItem[], error: error instanceof Error ? error.message : 'Failed' }
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
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    const item = await payload.create({
      collection: 'service-items',
      data: {
        name: data.name,
        description: data.description,
        billingType: data.billingType,
        defaultPrice: data.defaultPrice,
        defaultRate: data.defaultRate ?? 40,
        defaultInterval: data.defaultInterval ?? 'month',
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
  lineItems: BuilderLineItem[]
  paymentSchedule?: Array<{
    label: string
    entryType?: 'deposit' | 'installment' | 'balance'
    amount: number
    dueDate?: string
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
  lineItems: BuilderLineItem[]
  paymentSchedule?: Array<{
    label: string
    entryType?: 'deposit' | 'installment' | 'balance'
    amount: number
    dueDate?: string
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
