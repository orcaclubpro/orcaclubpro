/**
 * Stripe Webhooks Handler
 * POST /api/stripe/webhooks
 *
 * Handles Stripe webhook events, specifically:
 * - invoice.paid - Updates order status to 'paid' when invoice is paid
 * - invoice.payment_failed - Updates order status when payment fails
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Stripe from 'stripe'

/**
 * Retry helper for transient MongoDB errors (write conflicts)
 * Webhooks can trigger concurrent updates causing write conflicts
 * @see https://www.mongodb.com/docs/manual/core/retryable-writes/
 */
async function retryOnTransientError<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Check if it's a transient write conflict that can be retried
      const isTransient =
        error?.message?.includes('Write conflict') ||
        error?.code === 112 || // WriteConflict error code
        error?.codeName === 'WriteConflict' ||
        error?.errorLabels?.includes('TransientTransactionError')

      if (!isTransient || attempt === maxRetries) {
        throw error // Not retryable or max retries reached
      }

      console.log(`[Stripe Webhook] Write conflict detected, retrying (${attempt}/${maxRetries})`)

      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = 100 * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const payload = await getPayload({ config: configPromise })

  // Get the raw body for signature verification
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('[Stripe Webhook] No signature provided')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  // Verify webhook signature
  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    )
  }

  console.log('[Stripe Webhook] Received event:', event.type, event.id)

  // ✅ IDEMPOTENCY CHECK: Has this event already been processed?
  const existingEvent = await payload.find({
    collection: 'webhook-events',
    where: {
      eventId: { equals: event.id },
    },
    limit: 1,
  })

  if (existingEvent.docs.length > 0) {
    const status = existingEvent.docs[0].status

    if (status === 'processed') {
      console.log(`[Stripe Webhook] Event ${event.id} already processed, skipping`)
      return NextResponse.json({
        received: true,
        skipped: true,
        reason: 'already_processed',
      })
    }

    if (status === 'processing') {
      console.log(`[Stripe Webhook] Event ${event.id} currently being processed, skipping`)
      return NextResponse.json({
        received: true,
        skipped: true,
        reason: 'currently_processing',
      })
    }
  }

  // ✅ CREATE WEBHOOK EVENT RECORD (idempotency lock)
  let webhookEventId: string
  try {
    const webhookEvent = await payload.create({
      collection: 'webhook-events',
      data: {
        eventId: event.id,
        eventType: event.type,
        status: 'processing',
        processingStartedAt: new Date().toISOString(),
        payload: event as any,
      },
    })
    webhookEventId = webhookEvent.id
    console.log('[Stripe Webhook] Created webhook event record:', webhookEventId)
  } catch (createError: any) {
    // If creation fails due to unique constraint, event is already being processed
    if (createError.code === 11000 || createError.message?.includes('duplicate')) {
      console.log(`[Stripe Webhook] Event ${event.id} creation conflict, already processing`)
      return NextResponse.json({
        received: true,
        skipped: true,
        reason: 'concurrent_processing',
      })
    }
    throw createError
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('[Stripe Webhook] Invoice paid:', invoice.id)
        console.log('[Stripe Webhook] Invoice metadata:', invoice.metadata)

        // Get order ID from invoice metadata
        const orcaclubOrderId = invoice.metadata?.orcaclub_order_id
        const orderNumber = invoice.metadata?.order_number

        if (!orcaclubOrderId) {
          console.warn('[Stripe Webhook] No orcaclub_order_id in invoice metadata')

          // Mark event as failed (with retry logic)
          await retryOnTransientError(async () => {
            return await payload.update({
              collection: 'webhook-events',
              id: webhookEventId,
              data: {
                status: 'failed',
                errorMessage: 'No orcaclub_order_id in invoice metadata',
                processingCompletedAt: new Date().toISOString(),
              },
            })
          })

          return NextResponse.json({
            received: true,
            warning: 'No order ID in metadata',
          })
        }

        // Update order status to 'paid' with retry logic for write conflicts
        // Note: Balance will automatically recalculate via updateClientBalance hook
        const updatedOrder = await retryOnTransientError(async () => {
          return await payload.update({
            collection: 'orders',
            id: orcaclubOrderId,
            data: {
              status: 'paid',
            },
          })
        })

        console.log('[Stripe Webhook] Order marked as paid:', orderNumber, orcaclubOrderId)

        // ✅ MARK EVENT AS PROCESSED (with retry logic)
        await retryOnTransientError(async () => {
          return await payload.update({
            collection: 'webhook-events',
            id: webhookEventId,
            data: {
              status: 'processed',
              orderId: orcaclubOrderId,
              stripeInvoiceId: invoice.id,
              processingCompletedAt: new Date().toISOString(),
            },
          })
        })

        console.log('[Stripe Webhook] Event marked as processed:', event.id)

        return NextResponse.json({
          received: true,
          orderId: orcaclubOrderId,
          orderNumber,
          status: 'paid',
        })
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('[Stripe Webhook] Invoice payment failed:', invoice.id)

        const orcaclubOrderId = invoice.metadata?.orcaclub_order_id

        if (!orcaclubOrderId) {
          console.warn('[Stripe Webhook] No orcaclub_order_id in invoice metadata')

          await retryOnTransientError(async () => {
            return await payload.update({
              collection: 'webhook-events',
              id: webhookEventId,
              data: {
                status: 'processed',
                errorMessage: 'No orcaclub_order_id in invoice metadata',
                processingCompletedAt: new Date().toISOString(),
              },
            })
          })

          return NextResponse.json({
            received: true,
            warning: 'No order ID in metadata',
          })
        }

        // Log payment failure (status remains 'pending')
        console.warn('[Stripe Webhook] Payment failed for order:', orcaclubOrderId)

        // Mark event as processed (with retry logic)
        await retryOnTransientError(async () => {
          return await payload.update({
            collection: 'webhook-events',
            id: webhookEventId,
            data: {
              status: 'processed',
              orderId: orcaclubOrderId,
              stripeInvoiceId: invoice.id,
              processingCompletedAt: new Date().toISOString(),
            },
          })
        })

        return NextResponse.json({
          received: true,
          orderId: orcaclubOrderId,
          status: 'payment_failed',
        })
      }

      case 'invoice.voided':
      case 'invoice.marked_uncollectible': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('[Stripe Webhook] Invoice voided/uncollectible:', invoice.id)

        const orcaclubOrderId = invoice.metadata?.orcaclub_order_id

        if (!orcaclubOrderId) {
          await retryOnTransientError(async () => {
            return await payload.update({
              collection: 'webhook-events',
              id: webhookEventId,
              data: {
                status: 'processed',
                processingCompletedAt: new Date().toISOString(),
              },
            })
          })
          return NextResponse.json({ received: true })
        }

        // Update order status to 'cancelled' (with retry logic)
        await retryOnTransientError(async () => {
          return await payload.update({
            collection: 'orders',
            id: orcaclubOrderId,
            data: {
              status: 'cancelled',
            },
          })
        })

        console.log('[Stripe Webhook] Order marked as cancelled:', orcaclubOrderId)

        // Mark event as processed (with retry logic)
        await retryOnTransientError(async () => {
          return await payload.update({
            collection: 'webhook-events',
            id: webhookEventId,
            data: {
              status: 'processed',
              orderId: orcaclubOrderId,
              stripeInvoiceId: invoice.id,
              processingCompletedAt: new Date().toISOString(),
            },
          })
        })

        return NextResponse.json({
          received: true,
          orderId: orcaclubOrderId,
          status: 'cancelled',
        })
      }

      default: {
        // Unhandled event type - mark as processed but do nothing
        console.log('[Stripe Webhook] Unhandled event type:', event.type)

        await retryOnTransientError(async () => {
          return await payload.update({
            collection: 'webhook-events',
            id: webhookEventId,
            data: {
              status: 'processed',
              processingCompletedAt: new Date().toISOString(),
            },
          })
        })

        return NextResponse.json({ received: true })
      }
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error)

    // ✅ MARK EVENT AS FAILED (with retry logic)
    try {
      await retryOnTransientError(async () => {
        return await payload.update({
          collection: 'webhook-events',
          id: webhookEventId,
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            processingCompletedAt: new Date().toISOString(),
          },
        })
      })
    } catch (updateError) {
      console.error('[Stripe Webhook] Failed to mark event as failed:', updateError)
    }

    return NextResponse.json(
      {
        error: 'Error processing webhook event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
