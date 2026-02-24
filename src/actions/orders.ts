'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe'

// ── Update due date ────────────────────────────────────────────────────────────

/**
 * Update the due date on an order, syncing to Stripe when possible.
 * Always writes to Payload. Stripe sync only works on future dates and
 * draft invoices — non-fatal warnings returned otherwise.
 */
export async function updateOrderDueDate(
  orderId: string,
  dueDateIso: string | null,
): Promise<{ success: boolean; warning?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
    if (!order) return { success: false, error: 'Order not found' }

    await payload.update({ collection: 'orders', id: orderId, data: { dueDate: dueDateIso as any } })

    let warning: string | undefined
    const stripeInvoiceId = order.stripeInvoiceId as string | null | undefined
    if (stripeInvoiceId && dueDateIso) {
      const unixTs = Math.floor(new Date(dueDateIso).getTime() / 1000)
      const nowTs  = Math.floor(Date.now() / 1000)

      if (unixTs <= nowTs) {
        warning = 'Saved locally. Stripe requires a future date — past dates cannot be synced to the invoice.'
      } else {
        try {
          const stripe = getStripe()
          await stripe.invoices.update(stripeInvoiceId, { due_date: unixTs })
        } catch (stripeErr: any) {
          console.warn('[updateOrderDueDate] Stripe sync failed:', stripeErr?.message)
          warning = 'Saved locally. Stripe invoice could not be updated — it may already be finalized or paid.'
        }
      }
    }

    return { success: true, warning }
  } catch (error) {
    console.error('[updateOrderDueDate]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update due date' }
  }
}

// ── Update line items ──────────────────────────────────────────────────────────

export interface LineItemInput {
  title: string
  description?: string | null
  quantity: number
  price: number
  isRecurring?: boolean | null
  recurringInterval?: 'month' | 'year' | null
}

/**
 * Update all line items on an order.
 *
 * Always writes to Payload and recalculates amount.
 * Stripe sync:
 *   - draft invoice   → deletes all existing invoice items, recreates from new data ✓
 *   - open invoice    → Payload-only, returns warning (invoice is finalized/locked)
 *   - paid/void/other → Payload-only, returns info message
 */
export async function updateOrderLineItems(
  orderId: string,
  lineItems: LineItemInput[],
): Promise<{ success: boolean; synced?: boolean; warning?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }
    if (lineItems.length === 0) return { success: false, error: 'At least one line item is required' }

    const payload = await getPayload({ config })

    const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
    if (!order) return { success: false, error: 'Order not found' }

    // Recalculate total from new line items
    const newAmount = lineItems.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0)

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        lineItems: lineItems.map((item) => ({
          title: item.title,
          description: item.description ?? undefined,
          quantity: item.quantity,
          price: item.price,
          isRecurring: item.isRecurring ?? false,
          recurringInterval: item.recurringInterval ?? undefined,
        })) as any,
        amount: newAmount,
      },
    })

    // Attempt Stripe sync
    let synced = false
    let warning: string | undefined
    const stripeInvoiceId = order.stripeInvoiceId as string | null | undefined
    const stripeCustomerId = order.stripeCustomerId as string | null | undefined

    if (stripeInvoiceId) {
      try {
        const stripe = getStripe()
        const invoice = await stripe.invoices.retrieve(stripeInvoiceId)

        if (invoice.status === 'draft') {
          // List all current line items and delete the invoice items
          const existingLines = await stripe.invoices.listLineItems(stripeInvoiceId, { limit: 100 })
          for (const line of existingLines.data) {
            const lineAny = line as any
            const invoiceItemId =
              typeof lineAny.invoice_item === 'string'
                ? lineAny.invoice_item
                : lineAny.invoice_item?.id
            if (invoiceItemId) {
              await stripe.invoiceItems.del(invoiceItemId)
            }
          }

          // Recreate invoice items from the updated list
          const customerId = stripeCustomerId || (typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id)
          for (const item of lineItems) {
            const descParts = [item.title, item.description].filter(Boolean)
            await stripe.invoiceItems.create({
              customer: customerId,
              invoice: stripeInvoiceId,
              amount: Math.round(item.price * (item.quantity ?? 1) * 100),
              currency: 'usd',
              description: descParts.join(' — '),
            } as any)
          }

          synced = true
        } else if (invoice.status === 'open') {
          warning = `Saved locally. The Stripe invoice is finalized (open) — line items are locked once an invoice is sent. Void and recreate the invoice to push changes to Stripe.`
        } else {
          warning = `Saved locally. Stripe invoice is ${invoice.status} and cannot be modified.`
        }
      } catch (stripeErr: any) {
        console.warn('[updateOrderLineItems] Stripe sync failed:', stripeErr?.message)
        warning = 'Saved locally. Could not connect to Stripe to sync — please retry or update the invoice manually.'
      }
    }

    return { success: true, synced, warning }
  } catch (error) {
    console.error('[updateOrderLineItems]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update line items' }
  }
}

// ── Mark order as paid ─────────────────────────────────────────────────────────

/**
 * Manually mark a pending order as paid (for payments collected outside Stripe).
 * Admin and user roles only — triggers the afterChange balance recalculation hook.
 */
export async function markOrderAsPaid(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
    if (!order) return { success: false, error: 'Order not found' }
    if (order.status === 'paid') return { success: false, error: 'Order is already paid' }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { status: 'paid' } as any,
    })

    return { success: true }
  } catch (error) {
    console.error('[markOrderAsPaid]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to mark as paid' }
  }
}

// ── Delete order ───────────────────────────────────────────────────────────────

/**
 * Delete an order from Payload and clean up in Stripe.
 *
 * Stripe cleanup by invoice status:
 *   - draft       → permanently deleted (stripe.invoices.del)
 *   - open        → voided (stripe.invoices.voidInvoice) — keeps audit trail
 *   - uncollectible → voided
 *   - paid / void → Stripe untouched (terminal states)
 *
 * The afterDelete Payload hook automatically recalculates the client balance.
 * Admin only — users cannot delete orders.
 */
export async function deleteOrder(
  orderId: string,
): Promise<{ success: boolean; stripeAction?: 'voided' | 'deleted' | 'skipped'; warning?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') return { success: false, error: 'Admin access required to delete orders' }

    const payload = await getPayload({ config })

    const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
    if (!order) return { success: false, error: 'Order not found' }

    const stripeInvoiceId = order.stripeInvoiceId as string | null | undefined

    // Delete from Payload first (triggers afterDelete balance recalculation hook)
    await payload.delete({ collection: 'orders', id: orderId })

    // Attempt Stripe cleanup
    let stripeAction: 'voided' | 'deleted' | 'skipped' = 'skipped'
    let warning: string | undefined

    if (stripeInvoiceId) {
      try {
        const stripe = getStripe()
        const invoice = await stripe.invoices.retrieve(stripeInvoiceId)

        if (invoice.status === 'draft') {
          await stripe.invoices.del(stripeInvoiceId)
          stripeAction = 'deleted'
        } else if (invoice.status === 'open' || invoice.status === 'uncollectible') {
          await stripe.invoices.voidInvoice(stripeInvoiceId)
          stripeAction = 'voided'
        } else {
          // paid or already void — nothing to do
          stripeAction = 'skipped'
          if (invoice.status === 'paid') {
            warning = 'Order deleted locally. The Stripe invoice was already paid and cannot be voided — it remains in Stripe for your records.'
          }
        }
      } catch (stripeErr: any) {
        console.warn('[deleteOrder] Stripe cleanup failed (non-fatal):', stripeErr?.message)
        warning = 'Order deleted locally. Could not clean up the Stripe invoice — please void it manually in the Stripe dashboard.'
      }
    }

    return { success: true, stripeAction, warning }
  } catch (error) {
    console.error('[deleteOrder]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete order' }
  }
}
