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
import { fulfillOrderPaidOutOfBand } from '@/lib/stripe/invoices'
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

    // Sync the Stripe invoice to paid-out-of-band (if linked), then mark the
    // Payload order paid — shared with the dashboard markOrderAsPaid action.
    const result = await fulfillOrderPaidOutOfBand(payload, {
      id,
      stripeInvoiceId: order.stripeInvoiceId as string | undefined,
    })

    // 409 — the request is well-formed, but the invoice's current state forbids
    // it. Nothing was written, so the client can safely retry once it settles.
    if (!result.ok) {
      console.warn(`[Fulfill] Order ${order.orderNumber} not fulfilled (${result.reason})`)
      return NextResponse.json({ error: result.message, reason: result.reason }, { status: 409 })
    }

    console.log(`[Fulfill] Order ${order.orderNumber} marked as paid by ${user.email}`)

    return NextResponse.json({
      success: true,
      orderId: id,
      orderNumber: order.orderNumber,
      stripeUpdated: result.stripeUpdated,
      ...(result.warning ? { warning: result.warning } : {}),
    })
  } catch (error) {
    console.error('[Fulfill] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fulfill order' },
      { status: 500 }
    )
  }
}
