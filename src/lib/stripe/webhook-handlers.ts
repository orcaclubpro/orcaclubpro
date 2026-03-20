/**
 * Stripe Webhook Handlers
 *
 * These handlers are registered via stripePlugin({ webhooks: {...} }) in payload.config.ts.
 * The plugin owns signature verification and routing — each handler receives a verified event.
 *
 * Each handler is fully self-contained:
 * - Idempotency check against WebhookEvents collection
 * - Processing lock (status: 'processing')
 * - Business logic
 * - Final status update (status: 'processed' | 'failed')
 */

import type { Payload, PayloadRequest } from 'payload'
import type Stripe from 'stripe'
import { retryOnTransientError } from '@/lib/stripe/retry'
import { sendPaymentConfirmationEmails } from '@/lib/payload/utils/paymentConfirmationEmail'

// ─── Type matching @payloadcms/plugin-stripe handler signature ────────────────

type StripeHandlerArgs = {
  event: Stripe.Event
  payload: Payload
  req: PayloadRequest
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Resolve a Payload order ID from a Stripe invoice.
 * Prefers metadata (set at invoice creation time), falls back to stripeInvoiceId index.
 */
async function resolveOrderId(payload: Payload, invoice: Stripe.Invoice): Promise<string | null> {
  const fromMetadata = invoice.metadata?.orcaclub_order_id ?? null
  if (fromMetadata) return fromMetadata

  const { docs } = await payload.find({
    collection: 'orders',
    where: { stripeInvoiceId: { equals: invoice.id } },
    limit: 1,
  })
  return (docs[0]?.id as string) ?? null
}

/**
 * Check whether this event has already been processed or is in-flight.
 * Returns true if the caller should bail out.
 */
async function isAlreadyHandled(payload: Payload, eventId: string): Promise<boolean> {
  const existing = await payload.find({
    collection: 'webhook-events',
    where: { eventId: { equals: eventId } },
    limit: 1,
  })

  if (existing.docs.length === 0) return false
  const status = existing.docs[0].status as string
  if (status === 'processed') {
    console.log(`[Stripe Webhook] Event ${eventId} already processed, skipping`)
    return true
  }
  if (status === 'processing') {
    console.log(`[Stripe Webhook] Event ${eventId} currently processing, skipping`)
    return true
  }
  return false
}

/**
 * Create the WebhookEvent processing lock.
 * Returns the new record's ID, or null if a concurrent handler already claimed it.
 */
async function acquireWebhookLock(
  payload: Payload,
  event: Stripe.Event,
): Promise<string | null> {
  try {
    const record = await payload.create({
      collection: 'webhook-events',
      data: {
        eventId: event.id,
        eventType: event.type,
        status: 'processing',
        processingStartedAt: new Date().toISOString(),
        payload: event as any,
      },
    })
    return record.id as string
  } catch (err: any) {
    if (err?.code === 11000 || err?.message?.includes('duplicate')) {
      console.log(`[Stripe Webhook] Event ${event.id} lock already held, skipping`)
      return null
    }
    throw err
  }
}

async function markProcessed(
  payload: Payload,
  webhookEventId: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await retryOnTransientError(() =>
    payload.update({
      collection: 'webhook-events',
      id: webhookEventId,
      data: { status: 'processed', processingCompletedAt: new Date().toISOString(), ...extra },
    }),
  )
}

async function markFailed(
  payload: Payload,
  webhookEventId: string,
  errorMessage: string,
): Promise<void> {
  await retryOnTransientError(() =>
    payload.update({
      collection: 'webhook-events',
      id: webhookEventId,
      data: {
        status: 'failed',
        errorMessage,
        processingCompletedAt: new Date().toISOString(),
      },
    }),
  )
}

// ─── Event handlers ───────────────────────────────────────────────────────────

/**
 * invoice.paid
 * Marks the linked Order as 'paid', which triggers the updateClientBalance afterChange hook.
 * Sends a payment confirmation email to the client (non-blocking).
 */
export async function handleInvoicePaid({ event, payload }: StripeHandlerArgs): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice
  console.log('[Stripe Webhook] invoice.paid:', invoice.id)

  if (await isAlreadyHandled(payload, event.id)) return

  const webhookEventId = await acquireWebhookLock(payload, event)
  if (!webhookEventId) return

  try {
    const resolvedOrderId = await resolveOrderId(payload, invoice)

    if (!resolvedOrderId) {
      console.warn('[Stripe Webhook] No order found for invoice:', invoice.id)
      await markFailed(
        payload,
        webhookEventId,
        'No order found for invoice (checked metadata + stripeInvoiceId)',
      )
      return
    }

    if (invoice.status !== 'paid' || invoice.amount_paid === 0) {
      console.warn('[Stripe Webhook] Invoice not fully paid:', {
        status: invoice.status,
        amountPaid: invoice.amount_paid,
      })
      await markProcessed(payload, webhookEventId, {
        errorMessage: `Invoice status: ${invoice.status}, amount paid: ${invoice.amount_paid}`,
      })
      return
    }

    // Update order → triggers updateClientBalance afterChange hook automatically
    await retryOnTransientError(() =>
      payload.update({
        collection: 'orders',
        id: resolvedOrderId,
        data: { status: 'paid' },
      }),
    )

    console.log('[Stripe Webhook] Order marked as paid:', resolvedOrderId)

    // Non-blocking — errors caught inside sendPaymentConfirmationEmails
    void sendPaymentConfirmationEmails(payload, resolvedOrderId)

    await markProcessed(payload, webhookEventId, {
      orderId: resolvedOrderId,
      stripeInvoiceId: invoice.id,
    })
  } catch (error) {
    console.error('[Stripe Webhook] Error in invoice.paid handler:', error)
    await markFailed(
      payload,
      webhookEventId,
      error instanceof Error ? error.message : 'Unknown error',
    )
    throw error
  }
}

/**
 * invoice.payment_failed
 * Logs the failure; order status stays 'pending' — no state change needed.
 */
export async function handleInvoicePaymentFailed({
  event,
  payload,
}: StripeHandlerArgs): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice
  console.log('[Stripe Webhook] invoice.payment_failed:', invoice.id)

  if (await isAlreadyHandled(payload, event.id)) return

  const webhookEventId = await acquireWebhookLock(payload, event)
  if (!webhookEventId) return

  try {
    const resolvedOrderId = await resolveOrderId(payload, invoice)

    if (!resolvedOrderId) {
      console.warn('[Stripe Webhook] No order found for failed invoice:', invoice.id)
      await markProcessed(payload, webhookEventId, {
        errorMessage: 'No order found for invoice',
      })
      return
    }

    // Order stays 'pending' — payment failure doesn't change our state
    console.warn('[Stripe Webhook] Payment failed for order:', resolvedOrderId)

    await markProcessed(payload, webhookEventId, {
      orderId: resolvedOrderId,
      stripeInvoiceId: invoice.id,
    })
  } catch (error) {
    console.error('[Stripe Webhook] Error in invoice.payment_failed handler:', error)
    await markFailed(
      payload,
      webhookEventId,
      error instanceof Error ? error.message : 'Unknown error',
    )
    throw error
  }
}

/**
 * invoice.voided / invoice.marked_uncollectible
 * Marks the linked Order as 'cancelled'.
 */
export async function handleInvoiceVoided({ event, payload }: StripeHandlerArgs): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice
  console.log('[Stripe Webhook] invoice.voided/uncollectible:', invoice.id)

  if (await isAlreadyHandled(payload, event.id)) return

  const webhookEventId = await acquireWebhookLock(payload, event)
  if (!webhookEventId) return

  try {
    const resolvedOrderId = await resolveOrderId(payload, invoice)

    if (!resolvedOrderId) {
      await markProcessed(payload, webhookEventId)
      return
    }

    await retryOnTransientError(() =>
      payload.update({
        collection: 'orders',
        id: resolvedOrderId,
        data: { status: 'cancelled' },
      }),
    )

    console.log('[Stripe Webhook] Order marked as cancelled:', resolvedOrderId)

    await markProcessed(payload, webhookEventId, {
      orderId: resolvedOrderId,
      stripeInvoiceId: invoice.id,
    })
  } catch (error) {
    console.error('[Stripe Webhook] Error in invoice.voided handler:', error)
    await markFailed(
      payload,
      webhookEventId,
      error instanceof Error ? error.message : 'Unknown error',
    )
    throw error
  }
}
