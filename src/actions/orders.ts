'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe'
import {
  assertOrderPersisted,
  createStripeInvoiceForOrder,
  fulfillOrderPaidOutOfBand,
} from '@/lib/stripe/invoices'
import { resolveStripeCustomer } from '@/lib/stripe/customers'
import { sendGenericInvoiceEmail } from '@/lib/payload/utils/genericInvoiceEmailTemplate'
import { nextOrderNumber } from '@/lib/payload/utils/orderNumber'
import { revalidatePath } from 'next/cache'

// ── Create a client-scoped order (invoice) ─────────────────────────────────────

export interface CreateClientOrderLine {
  title: string
  description?: string
  /** Defaults to 1. */
  quantity?: number
  /** Unit price in DOLLARS. */
  price: number
}

export interface CreateClientOrderInput {
  clientAccountId: string
  lines: CreateClientOrderLine[]
  invoiceNote?: string
  /** Days Stripe gives the client to pay. Defaults to 30. */
  daysUntilDue?: number
  /** Defaults to 'full'. */
  invoiceType?: 'full' | 'deposit' | 'installment' | 'balance'
  projectId?: string
  /** Create the order + Stripe invoice but send no email. */
  skipEmail?: boolean
  /**
   * Create and finalize a Stripe invoice for this order. Defaults to TRUE.
   * When false the order is only recorded in Payload (so it shows on the
   * client's profile and balance) and no Stripe API call is made at all —
   * for work already billed somewhere else.
   */
  createStripeInvoice?: boolean
  /**
   * Optional link to an existing invoice / payment page. Stored as the order's
   * `stripeInvoiceUrl`. Overrides the hosted Stripe URL when a Stripe invoice
   * is also created. Must be an http(s) URL.
   */
  invoiceUrl?: string
}

export interface CreateClientOrderResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  /** Whatever ended up on the order — hosted Stripe URL, the supplied link, or null. */
  invoiceUrl?: string | null
  /** True when a Stripe invoice was created and finalized for this order. */
  stripeInvoiceCreated?: boolean
  /** Whether an invoice email was dispatched to the client. */
  emailed?: boolean
  /** Non-fatal explanation — e.g. why no email was sent. */
  notice?: string
  total?: number
  error?: string
}

const round2 = (n: number) => Math.round((n || 0) * 100) / 100
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Create a standalone invoice for a client — no package or retainer required.
 *
 * Mirrors `createPartialInvoiceFromPackage`: validate → resolve the Stripe
 * customer → create/finalize the Stripe invoice → persist the Order → email
 * (non-blocking). The order number comes from the finalized Stripe invoice;
 * if the Payload write fails afterwards the invoice is voided so no orphaned
 * Stripe invoice is left behind.
 *
 * With `createStripeInvoice: false` the whole Stripe leg is skipped — no
 * customer resolution, no invoice, no Stripe call of any kind. The order is
 * recorded in Payload only (it still counts toward the client's balance), it
 * takes an `INV-NNNN` number from `nextOrderNumber()` — the placeholder
 * numbering scheme that exists precisely for non-Stripe orders — and its
 * payable link is whatever `invoiceUrl` the caller supplied, if any.
 */
export async function createClientOrder(
  input: CreateClientOrderInput,
): Promise<CreateClientOrderResult> {
  let finalizedInvoice: any = null
  let stripe: ReturnType<typeof getStripe> | null = null

  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    if (!input.clientAccountId) return { success: false, error: 'A client account is required' }

    // ── Validate every line before touching Stripe ───────────────────────────
    const rawLines = input.lines ?? []
    if (rawLines.length === 0) return { success: false, error: 'At least one line item is required' }

    const lines: { title: string; description?: string; quantity: number; price: number }[] = []
    for (const [i, line] of rawLines.entries()) {
      const title = (line?.title ?? '').trim()
      if (!title) return { success: false, error: `Line ${i + 1} needs a title` }

      const price = Number(line.price)
      if (!isFinite(price) || price < 0) {
        return { success: false, error: `Line ${i + 1} ("${title}") needs a price of $0 or more` }
      }

      const quantity = line.quantity === undefined || line.quantity === null ? 1 : Number(line.quantity)
      if (!isFinite(quantity) || quantity < 1) {
        return { success: false, error: `Line ${i + 1} ("${title}") needs a quantity of at least 1` }
      }

      lines.push({
        title,
        description: line.description?.trim() || undefined,
        quantity: Math.round(quantity),
        price: round2(price),
      })
    }

    // The order's `amount` is this exact sum — the Orders beforeValidate hook
    // warns on any mismatch between amount and the line items.
    const total = round2(lines.reduce((sum, l) => sum + l.price * l.quantity, 0))
    if (total <= 0) return { success: false, error: 'Invoice total must be greater than $0' }

    const daysUntilDue = Math.max(1, Math.round(input.daysUntilDue ?? 30))
    const invoiceType = input.invoiceType ?? 'full'
    // Default TRUE — omitting the flag preserves the original Stripe-backed flow.
    const withStripeInvoice = input.createStripeInvoice !== false

    // ── Validate the optional link before anything is created ────────────────
    // This value is rendered as a clickable link in the portal and the invoice
    // email, so only absolute http(s) URLs are allowed through.
    let manualInvoiceUrl: string | null = null
    const rawInvoiceUrl = input.invoiceUrl?.trim()
    if (rawInvoiceUrl) {
      let parsed: URL | null = null
      try {
        parsed = new URL(rawInvoiceUrl)
      } catch {
        parsed = null
      }
      if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
        return {
          success: false,
          error: 'The invoice link must be a full URL starting with http:// or https://',
        }
      }
      manualInvoiceUrl = rawInvoiceUrl
    }

    const payload = await getPayload({ config })

    const account = await payload
      .findByID({ collection: 'client-accounts', id: input.clientAccountId, depth: 0 })
      .catch(() => null)
    if (!account) return { success: false, error: 'Client account not found' }

    const clientEmail = (account as any).email as string | null | undefined
    // Stripe needs an email to resolve/create the customer. A Payload-only order
    // does not — the client can still be missing one and just get no email.
    if (!clientEmail && withStripeInvoice) {
      return { success: false, error: 'Client account has no email — add one before invoicing' }
    }
    const accountStripeCustomerId =
      ((account as any).stripeCustomerId as string | undefined) ?? null
    const clientName =
      ((account as any).name as string | undefined) ||
      [(account as any).firstName, (account as any).lastName].filter(Boolean).join(' ') ||
      clientEmail ||
      'Client'

    const invoiceNote = input.invoiceNote?.trim() || undefined

    let orderNumber: string
    let stripeInvoiceId: string | null = null
    let stripeCustomerId: string | null = null
    let orderInvoiceUrl: string | null = null
    let dueDate: string | undefined

    if (withStripeInvoice) {
      stripe = getStripe()

      // ── Stripe customer — validate → search by email → create ──────────────
      const resolved = await resolveStripeCustomer({
        stripe,
        email: clientEmail as string,
        name: clientName,
        existingCustomerId: accountStripeCustomerId,
        metadata: {
          orcaclub_client_id: input.clientAccountId,
          created_via: 'orcaclub_dashboard',
          source: 'client_orders_tab',
        },
      })
      if (resolved.customerId !== accountStripeCustomerId) {
        await payload.update({
          collection: 'client-accounts',
          id: input.clientAccountId,
          data: { stripeCustomerId: resolved.customerId } as any,
        })
      }
      stripeCustomerId = resolved.customerId

      // ── Stripe invoice — create → attach lines → finalize ──────────────────
      const { invoice: finalized, invoiceId, hostedInvoiceUrl } = await createStripeInvoiceForOrder({
        stripe,
        stripeCustomerId: resolved.customerId,
        daysUntilDue,
        description: invoiceNote ?? `Invoice — ${clientName}`,
        invoiceMetadata: {
          orcaclub_client_id: input.clientAccountId,
          orcaclub_invoice_type: invoiceType,
          created_via: 'orcaclub_dashboard',
          ...(input.projectId ? { orcaclub_project_id: input.projectId } : {}),
        },
        lines: lines.map((l) => ({
          description: l.quantity > 1 ? `${l.title} × ${l.quantity}` : l.title,
          amount: round2(l.price * l.quantity),
        })),
      })
      finalizedInvoice = finalized

      // Order numbers are Stripe's — never generate an INV- number here.
      orderNumber = finalized.number ?? invoiceId
      stripeInvoiceId = invoiceId
      // A link the caller supplied deliberately wins over Stripe's hosted page.
      orderInvoiceUrl = manualInvoiceUrl ?? hostedInvoiceUrl ?? null
      dueDate = finalized.due_date
        ? new Date(finalized.due_date * 1000).toISOString()
        : undefined
    } else {
      // ── Payload-only order — no Stripe call of any kind ────────────────────
      // INV-NNNN is the placeholder numbering scheme reserved for orders with no
      // Stripe invoice behind them, so it is the correct source here.
      orderNumber = await nextOrderNumber(payload)
      // Reuse an existing Stripe customer id if the account already has one, but
      // never create one. `stripeInvoiceId` stays unset — a non-Stripe link must
      // never land in an id field, and a fabricated id would break webhook
      // reconciliation, which matches orders by `stripeInvoiceId`.
      stripeCustomerId = accountStripeCustomerId
      orderInvoiceUrl = manualInvoiceUrl
      // No Stripe `due_date` to read back, so derive the same terms locally.
      dueDate = new Date(Date.now() + daysUntilDue * DAY_MS).toISOString()
    }

    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        clientAccount: input.clientAccountId,
        projectRef: input.projectId || undefined,
        invoiceType,
        ...(invoiceNote ? { invoiceNote } : {}),
        amount: total,
        status: 'pending',
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
        ...(stripeInvoiceId ? { stripeInvoiceId } : {}),
        ...(orderInvoiceUrl ? { stripeInvoiceUrl: orderInvoiceUrl } : {}),
        ...(dueDate ? { dueDate } : {}),
        lineItems: lines.map((l) => ({
          title: l.title,
          description: l.description,
          quantity: l.quantity,
          price: l.price,
          isRecurring: false,
        })),
      } as any,
    })

    // ── Confirm the order actually persisted ─────────────────────────────────
    // An Orders afterChange hook (updateClientBalance → syncClientAccountToUser) can
    // abort the create's Mongo transaction while swallowing the error — `payload.create`
    // still returns a doc with an id for a row that was rolled back. Verify before we
    // report success or email the client about an invoice with no order behind it; a
    // throw here reaches the catch below, which voids the finalized Stripe invoice.
    try {
      await assertOrderPersisted(payload, order.id as string)
    } catch (e) {
      // Keep the diagnostic detail in the server log; surface something legible upstream.
      console.error('[createClientOrder] Order did not persist:', e)
      throw new Error(
        withStripeInvoice
          ? 'The invoice could not be saved, so no order was created. ' +
            'The Stripe invoice has been voided and the client was not billed — please try again.'
          : 'The order could not be saved — nothing was recorded. Please try again.',
      )
    }

    revalidatePath(`/u/${user.username}/clients`)

    // ── Email ────────────────────────────────────────────────────────────────
    // With no Stripe invoice and no supplied link there is nothing payable to
    // point the client at, so don't mail a dead invoice — report it instead.
    let notice: string | undefined
    let emailed = false
    if (input.skipEmail) {
      // Caller opted out — nothing to explain.
    } else if (!clientEmail) {
      notice = 'No email sent — this client account has no email address.'
    } else if (!stripeInvoiceId && !orderInvoiceUrl) {
      notice = 'No email sent — the order has no invoice link for the client to pay from.'
    } else {
      emailed = true
      // Non-blocking: the order + Stripe invoice must survive an email failure.
      ;(async () => {
        try {
          await sendGenericInvoiceEmail(payload, order.id as string, user.id as string)
        } catch (e) {
          console.error('[createClientOrder] Invoice email failed (order still created):', e)
        }
      })()
    }

    return {
      success: true,
      orderId: order.id as string,
      orderNumber,
      invoiceUrl: orderInvoiceUrl || null,
      stripeInvoiceCreated: Boolean(stripeInvoiceId),
      emailed,
      notice,
      total,
    }
  } catch (error) {
    // Never leave an orphaned Stripe invoice behind a failed order write.
    if (finalizedInvoice && stripe) {
      stripe.invoices
        .voidInvoice(finalizedInvoice.id)
        .catch((e: any) =>
          console.error('[createClientOrder] Failed to void orphaned Stripe invoice:', e),
        )
    }
    console.error('[createClientOrder]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create order' }
  }
}

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
 * Also syncs the linked Stripe invoice to paid-out-of-band (shared with the admin
 * /fulfill route) so the Stripe invoice never lingers as `open` after payment.
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

    await fulfillOrderPaidOutOfBand(payload, {
      id: orderId,
      stripeInvoiceId: order.stripeInvoiceId as string | undefined,
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
