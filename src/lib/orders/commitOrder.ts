/**
 * The single way an Order row gets written.
 *
 * `createStripeInvoiceForOrder()` centralized the Stripe half of invoicing; this
 * centralizes the Payload half. Every flow that creates an order — the client
 * orders tab, the five package flows, retainer billing, the admin payment-links
 * route — went through the same four steps by hand:
 *
 *   1. build the order data
 *   2. `payload.create`
 *   3. verify it actually persisted (`assertOrderPersisted`)
 *   4. void the finalized Stripe invoice if either of the above failed
 *
 * Copy-pasting those four steps nine times meant only four sites did (3) and only
 * eight did (4) — so a failed write could leave a client holding a live, payable
 * Stripe invoice that no webhook could ever resolve back to an order. `commitOrder`
 * does all four every time.
 *
 * Line-item construction genuinely differs per source (packages carry `name`,
 * retainers carry itemized $0 hours, the modal carries free-form rows), so callers
 * still build `lineItems` themselves — they just stop owning the commit.
 */

import type { Payload, PayloadRequest } from 'payload'
import type Stripe from 'stripe'
import { assertOrderPersisted } from '@/lib/stripe/invoices'

export interface OrderLineInput {
  title: string
  description?: string | null
  /** Defaults to 1. */
  quantity?: number | null
  /** Unit price in DOLLARS. */
  price: number
  isRecurring?: boolean | null
  recurringInterval?: 'month' | 'year' | null
}

export type OrderInvoiceType = 'full' | 'deposit' | 'installment' | 'balance' | 'retainer'

export interface OrderRecordInput {
  /** From the finalized Stripe invoice (`invoice.number`), or `nextOrderNumber()` for non-Stripe orders. */
  orderNumber: string
  clientAccountId: string
  /** Order total in DOLLARS. Must match the line-item sum — Orders `beforeValidate` warns otherwise. */
  amount: number
  lineItems: OrderLineInput[]
  /** Defaults to 'pending'. Use 'paid' only for orders settled on arrival (fulfillment). */
  status?: 'pending' | 'paid'
  invoiceType?: OrderInvoiceType
  invoiceNote?: string | null
  projectRef?: string | null
  /** DEPRECATED free-text project name. Prefer `projectRef`. */
  projectName?: string | null
  packageRef?: string | null
  retainerRef?: string | null
  retainerCycleStart?: string | null
  stripeCustomerId?: string | null
  stripeInvoiceId?: string | null
  stripeInvoiceUrl?: string | null
  /** Payment method configuration (`pmc_…`) the invoice's method list was derived from. */
  paymentConfigId?: string | null
  /** That configuration's display name, snapshotted so the order reads without a Stripe call. */
  paymentConfigName?: string | null
  dueDate?: string | null
  fulfilledAt?: string | null
  fulfillmentNote?: string | null
}

export interface CommitOrderOptions {
  /**
   * A finalized Stripe invoice to void if the order cannot be written. Without this,
   * a failed write strands a payable invoice with no order behind it — and the
   * `invoice.paid` webhook resolves orders by `stripeInvoiceId`, so nothing would
   * ever reconcile it.
   */
  voidOnFailure?: { stripe: Stripe; invoiceId: string }
  /** Prefix for server-log lines, e.g. `sendScheduledPayment`. */
  logLabel?: string
  /**
   * Message thrown when the order does not persist. Should tell the operator what
   * was and was not billed. A sensible default is used when omitted.
   */
  failureMessage?: string
  /** Passed to `payload.create` to keep nested writes in the caller's transaction. */
  req?: PayloadRequest
}

const DEFAULT_FAILURE_MESSAGE =
  'The order could not be saved, so nothing was recorded. Please try again.'

/** Drop null/undefined so optional Stripe/relationship fields are omitted, not blanked. */
const put = <T>(key: string, value: T | null | undefined): Record<string, T> =>
  value === null || value === undefined || value === '' ? {} : ({ [key]: value } as Record<string, T>)

/**
 * Write an Order, prove it survived, and clean up Stripe if it did not.
 *
 * Payload runs afterChange hooks inside the create's Mongo transaction. A hook that
 * catches its own error (`updateClientBalance` → `syncClientAccountToUser`) still
 * leaves the transaction aborted, and `payload.create` hands back a doc with an id
 * for a row that was rolled back — so callers that skip the re-read go on to stamp
 * that id onto package schedules and work entries. `assertOrderPersisted` turns that
 * silent data loss into a real error, and `voidOnFailure` makes the retry start clean
 * instead of double-billing.
 *
 * Returns the created order. Throws (after voiding) when the write did not stick.
 */
export async function commitOrder(
  payload: Payload,
  input: OrderRecordInput,
  opts: CommitOrderOptions = {},
): Promise<{ id: string; orderNumber: string }> {
  const label = opts.logLabel ? `[${opts.logLabel}]` : '[commitOrder]'

  const data = {
    orderNumber: input.orderNumber,
    clientAccount: input.clientAccountId,
    amount: input.amount,
    status: input.status ?? 'pending',
    invoiceType: input.invoiceType ?? 'full',
    ...put('invoiceNote', input.invoiceNote),
    ...put('projectRef', input.projectRef),
    ...put('project', input.projectName),
    ...put('packageRef', input.packageRef),
    ...put('retainerRef', input.retainerRef),
    ...put('retainerCycleStart', input.retainerCycleStart),
    ...put('stripeCustomerId', input.stripeCustomerId),
    // `stripeInvoiceId` is `unique` — writing '' would collide across every order
    // that has no Stripe invoice, which is exactly what `put` guards against.
    ...put('stripeInvoiceId', input.stripeInvoiceId),
    ...put('stripeInvoiceUrl', input.stripeInvoiceUrl),
    ...put('stripePaymentConfig', input.paymentConfigId),
    ...put('stripePaymentConfigName', input.paymentConfigName),
    ...put('dueDate', input.dueDate),
    ...put('fulfilledAt', input.fulfilledAt),
    ...put('fulfillmentNote', input.fulfillmentNote),
    lineItems: input.lineItems.map((l) => ({
      title: l.title,
      ...put('description', l.description),
      quantity: l.quantity ?? 1,
      price: l.price,
      isRecurring: l.isRecurring ?? false,
      ...put('recurringInterval', l.recurringInterval),
    })),
  }

  try {
    const order = await payload.create({
      collection: 'orders',
      data: data as never,
      ...(opts.req ? { req: opts.req } : {}),
    })

    await assertOrderPersisted(payload, order.id as string)

    return { id: order.id as string, orderNumber: input.orderNumber }
  } catch (error) {
    console.error(`${label} Order was not committed:`, error)

    if (opts.voidOnFailure) {
      await opts.voidOnFailure.stripe.invoices
        .voidInvoice(opts.voidOnFailure.invoiceId)
        .catch((e: unknown) =>
          console.error(`${label} Failed to void orphaned Stripe invoice:`, e),
        )
    }

    throw new Error(opts.failureMessage ?? DEFAULT_FAILURE_MESSAGE)
  }
}

/**
 * Run an invoice-email send to completion, swallowing failures.
 *
 * Every order flow used to launch its email in a floating `;(async () => {})()`.
 * On a serverless host the function can freeze the moment the action returns, which
 * kills the in-flight send silently — the same bug that was fixed in the Stripe
 * webhook handler (`handleInvoicePaid` awaits `sendPaymentReceiptOnce` for exactly
 * this reason) but never fixed in the actions.
 *
 * Awaiting costs the caller the send latency; losing the invoice email costs a
 * client who never learns they were billed. The order and the Stripe invoice still
 * survive a failed send — that is what the catch is for.
 */
export async function deliverInvoiceEmail(
  label: string,
  send: () => Promise<unknown>,
): Promise<boolean> {
  try {
    const result = await send()
    // The template senders report a missing order / missing client email as
    // `{ success: false }` rather than throwing, so a try/catch alone would call
    // an unsent email sent. Anything else (including void) counts as delivered.
    if (result && typeof result === 'object' && 'success' in result && !(result as { success: unknown }).success) {
      const message = (result as { message?: unknown }).message
      console.error(`[${label}] Invoice email not sent (order still created):`, message ?? result)
      return false
    }
    return true
  } catch (e) {
    console.error(`[${label}] Invoice email failed (order still created):`, e)
    return false
  }
}
