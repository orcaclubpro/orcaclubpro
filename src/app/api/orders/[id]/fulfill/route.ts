/**
 * POST /api/orders/[id]/fulfill
 *
 * Marks an order as paid for offline payments (cash, wire, etc.).
 * Updates the Payload order status to 'paid' and, if a Stripe invoice
 * is linked, marks it paid out of band without charging the customer.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getStripe } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const headersList = await headers()

    // Authenticate — admin/user only
    let user
    try {
      const result = await payload.auth({ headers: headersList })
      user = result.user
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (user.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch the order
    const order = await payload.findByID({
      collection: 'orders',
      id,
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status === 'paid') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 })
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot mark a cancelled order as paid' }, { status: 400 })
    }

    // 1. Mark order as paid in Payload
    // context flag prevents the updateClientBalance hook from conflicting with
    // the Stripe webhook that fires shortly after
    await payload.update({
      collection: 'orders',
      id,
      data: { status: 'paid' },
      context: { fromManualFulfillment: true },
    })

    console.log(`[Fulfill] Order ${order.orderNumber} marked as paid by ${user.email}`)

    // 2. Mark Stripe invoice as paid out of band (if linked)
    let stripeUpdated = false
    const stripeInvoiceId = order.stripeInvoiceId as string | undefined

    if (stripeInvoiceId) {
      try {
        const stripe = getStripe()
        await stripe.invoices.pay(stripeInvoiceId, {
          paid_out_of_band: true,
        })
        stripeUpdated = true
        console.log(`[Fulfill] Stripe invoice ${stripeInvoiceId} marked as paid out of band`)
      } catch (stripeErr: any) {
        // Invoice already paid, voided, or uncollectible — not a fatal error
        const code = stripeErr?.raw?.code || stripeErr?.code
        if (
          code === 'invoice_already_paid' ||
          stripeErr?.message?.includes('already paid') ||
          stripeErr?.message?.includes('No payment is due')
        ) {
          console.log(`[Fulfill] Stripe invoice ${stripeInvoiceId} already paid — skipping`)
          stripeUpdated = true
        } else {
          // Log but don't fail — Payload record is the source of truth
          console.warn(`[Fulfill] Could not update Stripe invoice ${stripeInvoiceId}:`, stripeErr?.message)
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderId: id,
      orderNumber: order.orderNumber,
      stripeUpdated,
    })
  } catch (error) {
    console.error('[Fulfill] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fulfill order' },
      { status: 500 }
    )
  }
}
