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
          return NextResponse.json({
            received: true,
            warning: 'No order ID in metadata',
          })
        }

        // Update order status to 'paid'
        // Note: We're not storing the charge/payment_intent ID here since the Invoice type
        // doesn't expose it in the TypeScript definitions. The invoice ID is sufficient.
        const updatedOrder = await payload.update({
          collection: 'orders',
          id: orcaclubOrderId,
          data: {
            status: 'paid',
          },
        })

        console.log('[Stripe Webhook] Order marked as paid:', orderNumber, orcaclubOrderId)

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
          return NextResponse.json({
            received: true,
            warning: 'No order ID in metadata',
          })
        }

        // Log payment failure (status remains 'pending')
        console.warn('[Stripe Webhook] Payment failed for order:', orcaclubOrderId)

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
          return NextResponse.json({ received: true })
        }

        // Update order status to 'cancelled'
        await payload.update({
          collection: 'orders',
          id: orcaclubOrderId,
          data: {
            status: 'cancelled',
          },
        })

        console.log('[Stripe Webhook] Order marked as cancelled:', orcaclubOrderId)

        return NextResponse.json({
          received: true,
          orderId: orcaclubOrderId,
          status: 'cancelled',
        })
      }

      default: {
        // Unhandled event type
        console.log('[Stripe Webhook] Unhandled event type:', event.type)
        return NextResponse.json({ received: true })
      }
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error)
    return NextResponse.json(
      {
        error: 'Error processing webhook event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
