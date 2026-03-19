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

    // 1. Mark Stripe invoice as paid out of band (if linked) — do this first so
    //    if Stripe fails we haven't already mutated the Payload record
    let stripeUpdated = false
    const stripeInvoiceId = order.stripeInvoiceId as string | undefined

    if (stripeInvoiceId) {
      try {
        const stripe = getStripe()

        // Pre-check invoice status — invoice.pay() only works on 'open' or 'uncollectible'
        const stripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId)

        if (stripeInvoice.status === 'paid') {
          console.log(`[Fulfill] Stripe invoice ${stripeInvoiceId} already paid — skipping`)
          stripeUpdated = true
        } else if (stripeInvoice.status === 'void') {
          console.warn(`[Fulfill] Stripe invoice ${stripeInvoiceId} is voided — skipping Stripe update`)
        } else if (stripeInvoice.status === 'draft') {
          console.warn(`[Fulfill] Stripe invoice ${stripeInvoiceId} is still a draft — skipping Stripe update`)
        } else {
          // 'open' or 'uncollectible' — safe to mark paid out of band
          await stripe.invoices.pay(
            stripeInvoiceId,
            { paid_out_of_band: true },
            { idempotencyKey: `fulfill-${id}` },
          )
          stripeUpdated = true
          console.log(`[Fulfill] Stripe invoice ${stripeInvoiceId} marked as paid out of band`)
        }
      } catch (stripeErr: any) {
        // Log but don't fail — Payload record is the source of truth
        console.warn(`[Fulfill] Could not update Stripe invoice ${stripeInvoiceId}:`, stripeErr?.message)
      }
    }

    // 2. Mark order as paid in Payload
    await payload.update({
      collection: 'orders',
      id,
      data: { status: 'paid' },
    })

    console.log(`[Fulfill] Order ${order.orderNumber} marked as paid by ${user.email}`)

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
