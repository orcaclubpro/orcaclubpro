/**
 * Shared Stripe invoice helpers.
 *
 * Centralizes the create → attach line items → finalize sequence and the
 * "mark paid out of band" flow that were previously copy-pasted across the
 * payment-links route, the package/schedule actions, and the fulfill route.
 *
 * Amounts are always passed in DOLLARS and converted to integer cents here,
 * so callers never repeat the `Math.round(x * 100)` conversion.
 */

import type { Payload, PayloadRequest } from 'payload'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'

export interface StripeInvoiceLineInput {
  /** Line description shown on the Stripe invoice. */
  description: string
  /** Total amount for this line in DOLLARS (unit price × quantity). */
  amount: number
  /** Per-line metadata, merged over the shared `lineMetadata`. */
  metadata?: Record<string, string>
}

export interface CreateStripeInvoiceParams {
  stripeCustomerId: string
  lines: StripeInvoiceLineInput[]
  /** Days until the invoice is due. Defaults to 30. */
  daysUntilDue?: number
  /** Invoice-level description (e.g. `Order INV-0001 — Acme`). */
  description?: string
  /** Metadata set on the invoice itself. */
  invoiceMetadata?: Record<string, string>
  /** Metadata merged onto every line item (e.g. `{ order_number }`). */
  lineMetadata?: Record<string, string>
  /** Passed straight to `invoices.create` (e.g. `payment_method_types`). */
  paymentSettings?: Stripe.InvoiceCreateParams.PaymentSettings
  /** Three-letter currency code. Defaults to 'usd'. */
  currency?: string
  /** Reuse an existing Stripe client instead of the singleton. */
  stripe?: Stripe
}

export interface CreateStripeInvoiceResult {
  /** The finalized invoice object. */
  invoice: Stripe.Invoice
  invoiceId: string
  hostedInvoiceUrl: string
}

/**
 * Create a Stripe invoice, attach every line item to it explicitly, and
 * finalize it — returning the finalized invoice plus its hosted URL.
 *
 * Invoice-first with explicit `invoice` attachment on each item, so pending
 * invoice items can never float onto an unrelated invoice. This is the robust
 * pattern all package flows already used; the payment-links route is migrated
 * onto it here (dropping its old items-first + "verify lines exist" dance).
 */
export async function createStripeInvoiceForOrder(
  params: CreateStripeInvoiceParams,
): Promise<CreateStripeInvoiceResult> {
  const stripe = params.stripe ?? getStripe()
  const currency = params.currency ?? 'usd'

  const invoice = await stripe.invoices.create({
    customer: params.stripeCustomerId,
    collection_method: 'send_invoice',
    days_until_due: params.daysUntilDue ?? 30,
    auto_advance: false,
    ...(params.description ? { description: params.description } : {}),
    ...(params.paymentSettings ? { payment_settings: params.paymentSettings } : {}),
    ...(params.invoiceMetadata ? { metadata: params.invoiceMetadata } : {}),
  })

  // `invoice.id` is typed `string | undefined` in current Stripe types; a freshly
  // created invoice always has one, but guard so downstream calls stay type-safe.
  const invoiceId = invoice.id
  if (!invoiceId) {
    throw new Error('Stripe invoice creation returned no id')
  }

  for (const line of params.lines) {
    await stripe.invoiceItems.create({
      customer: params.stripeCustomerId,
      invoice: invoiceId,
      amount: Math.round(line.amount * 100),
      currency,
      description: line.description,
      ...(params.lineMetadata || line.metadata
        ? { metadata: { ...params.lineMetadata, ...line.metadata } }
        : {}),
    })
  }

  const finalized = await stripe.invoices.finalizeInvoice(invoiceId)

  return {
    invoice: finalized,
    invoiceId: finalized.id ?? invoiceId,
    hostedInvoiceUrl: finalized.hosted_invoice_url || '',
  }
}

/**
 * Mark an order as paid for a payment collected outside Stripe (cash, wire, etc.).
 *
 * Syncs the linked Stripe invoice to `paid_out_of_band` first (best-effort —
 * failures are logged, never fatal, since Payload is the source of truth), then
 * flips the Payload order to `paid`, which triggers the balance-recalc hook.
 *
 * Used by both the admin `/fulfill` route and the dashboard `markOrderAsPaid`
 * action so the two "mark as paid" entry points behave identically.
 */
export async function fulfillOrderPaidOutOfBand(
  payload: Payload,
  order: { id: string; stripeInvoiceId?: string | null },
  opts: { idempotencyKey?: string; req?: PayloadRequest } = {},
): Promise<{ stripeUpdated: boolean }> {
  let stripeUpdated = false
  const stripeInvoiceId = order.stripeInvoiceId ?? undefined

  // 1. Sync Stripe first — if it fails we haven't already mutated Payload.
  if (stripeInvoiceId) {
    try {
      const stripe = getStripe()
      const invoice = await stripe.invoices.retrieve(stripeInvoiceId)

      if (invoice.status === 'paid') {
        console.log(`[fulfillOrder] Stripe invoice ${stripeInvoiceId} already paid — skipping`)
        stripeUpdated = true
      } else if (invoice.status === 'void') {
        console.warn(`[fulfillOrder] Stripe invoice ${stripeInvoiceId} is voided — skipping Stripe update`)
      } else if (invoice.status === 'draft') {
        console.warn(`[fulfillOrder] Stripe invoice ${stripeInvoiceId} is still a draft — skipping Stripe update`)
      } else {
        // 'open' or 'uncollectible' — safe to mark paid out of band
        await stripe.invoices.pay(
          stripeInvoiceId,
          { paid_out_of_band: true },
          { idempotencyKey: opts.idempotencyKey ?? `fulfill-${order.id}` },
        )
        stripeUpdated = true
        console.log(`[fulfillOrder] Stripe invoice ${stripeInvoiceId} marked as paid out of band`)
      }
    } catch (stripeErr: any) {
      // Log but don't fail — Payload record is the source of truth
      console.warn(`[fulfillOrder] Could not update Stripe invoice ${stripeInvoiceId}:`, stripeErr?.message)
    }
  }

  // 2. Mark order as paid in Payload (triggers updateClientBalance afterChange hook)
  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { status: 'paid' },
    ...(opts.req ? { req: opts.req } : {}),
  })

  return { stripeUpdated }
}

/**
 * Confirm an Order actually persisted after `payload.create` returned it.
 *
 * Payload runs afterChange hooks inside the create's Mongo transaction. If a nested
 * write in one of those hooks fails — `updateClientBalance` → `syncClientAccountToUser`
 * → an invalid User field, say — the transaction is aborted even though both hooks
 * catch the error and log it. Catching in JS does not un-abort a Mongo transaction.
 * `payload.create` still hands back a doc with an id, so the caller sails on and
 * stamps schedule entries and work entries against an order that no longer exists.
 *
 * Re-reading is the cheapest way to turn that silent data loss into a real error the
 * caller can handle (void the Stripe invoice, clean up, tell the user). Call it
 * immediately after creating an order, before anything else references the id.
 *
 * Throws when the order is gone; returns normally when it is there.
 */
export async function assertOrderPersisted(payload: Payload, orderId: string): Promise<void> {
  const persisted = await payload
    .findByID({ collection: 'orders', id: orderId, depth: 0 })
    .catch(() => null)

  if (!persisted) {
    throw new Error(
      `Order ${orderId} did not persist — an afterChange hook aborted its transaction. ` +
        `Check the server log for a caught hook error at this timestamp (a failed nested ` +
        `write rolls back the order even when the hook swallows the error).`,
    )
  }
}
