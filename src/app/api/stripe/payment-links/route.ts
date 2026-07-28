import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { resolveStripeCustomer } from '@/lib/stripe/customers'
import { createStripeInvoiceForOrder } from '@/lib/stripe/invoices'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

/**
 * POST /api/stripe/payment-links
 *
 * Create a Stripe Invoice with a hosted payment page
 * Uses proper Stripe Invoices API instead of creating products
 *
 * Request Body:
 * {
 *   customerEmail: string
 *   customerName?: string
 *   project?: string (optional - project name for the order)
 *   lineItems: Array<{
 *     title: string
 *     description?: string
 *     unitPrice: number (in dollars)
 *     quantity: number
 *   }>
 * }
 *
 * Response:
 * {
 *   success: true,
 *   invoiceUrl: string (hosted invoice URL),
 *   invoiceId: string,
 *   orderNumber: string,
 *   totalAmount: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const payload = await getPayload({ config: configPromise })

    // Authenticate — staff only. This endpoint creates client accounts, orders,
    // and finalized Stripe invoices, so it must never be reachable anonymously.
    let user
    try {
      const result = await payload.auth({ headers: await headers() })
      user = result.user
    } catch {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin' && user.role !== 'user') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const { customerEmail, customerName, lineItems, project } = body

    // Validation
    if (!customerEmail || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer email and line items are required' },
        { status: 400 }
      )
    }

    // Validate line items
    for (const item of lineItems) {
      if (!item.title) {
        return NextResponse.json(
          { error: 'Each line item must have a title' },
          { status: 400 }
        )
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each line item must have a quantity greater than 0' },
          { status: 400 }
        )
      }
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        return NextResponse.json(
          { error: 'Each line item must have a valid unitPrice' },
          { status: 400 }
        )
      }
    }

    // Calculate total amount
    const totalAmount = lineItems.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    )

    // 1. Find or create client account
    let clientAccount = await payload.find({
      collection: 'client-accounts',
      where: {
        email: { equals: customerEmail },
      },
      limit: 1,
    })

    let clientAccountId = clientAccount.docs[0]?.id
    let stripeCustomerId: string

    // If no client account exists, create one (hook will create Stripe customer)
    if (!clientAccountId) {
      console.log('[Stripe Invoice] Creating new client account for:', customerEmail)

      // Split name into first and last name
      const fullName = customerName || customerEmail.split('@')[0]
      const nameParts = fullName.split(/[\s.]+/)
      const firstName = nameParts[0] || fullName
      const lastName = nameParts.slice(1).join(' ') || 'Client'

      const newClient = await payload.create({
        collection: 'client-accounts',
        data: {
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          email: customerEmail,
        },
      })

      clientAccountId = newClient.id
      stripeCustomerId = newClient.stripeCustomerId as string

      console.log('[Stripe Invoice] Created client account:', clientAccountId)
      console.log('[Stripe Invoice] Stripe customer ID from hook:', stripeCustomerId)
    } else {
      // Client account exists, get or create Stripe customer
      stripeCustomerId = clientAccount.docs[0]?.stripeCustomerId as string

      console.log('[Stripe Invoice] Found existing client account:', clientAccountId)
      console.log('[Stripe Invoice] Stripe customer ID:', stripeCustomerId)
    }

    // 2. Resolve the Stripe customer: validate the existing id → search by email → create.
    const resolvedCustomer = await resolveStripeCustomer({
      stripe,
      email: customerEmail,
      name: customerName || customerEmail.split('@')[0],
      existingCustomerId: stripeCustomerId || null,
      metadata: {
        orcaclub_client_id: clientAccountId,
        created_via: 'orcaclub_admin',
        source: 'payment_links_api',
        created_at: new Date().toISOString(),
      },
    })

    // 3. Persist the resolved id whenever it changed (linked, created, or the old
    //    one was invalid and dropped) so the client account stays in sync.
    if (resolvedCustomer.customerId !== stripeCustomerId) {
      await payload.update({
        collection: 'client-accounts',
        id: clientAccountId,
        data: { stripeCustomerId: resolvedCustomer.customerId },
      })
      console.log(
        `[Stripe Invoice] Client account Stripe customer ${resolvedCustomer.action}:`,
        resolvedCustomer.customerId,
      )
    }
    stripeCustomerId = resolvedCustomer.customerId

    // Final safety check: Ensure we have a valid Stripe customer ID
    if (!stripeCustomerId) {
      throw new Error(
        'Failed to get or create Stripe customer. Cannot create invoice without valid customer ID.'
      )
    }

    console.log('[Stripe Invoice] Final customer ID check passed:', stripeCustomerId)

    // 5. Create the Stripe invoice FIRST so we can stamp its real invoice number
    //    onto the order. Attach every line item explicitly, then finalize.
    const { invoice, invoiceId, hostedInvoiceUrl } = await createStripeInvoiceForOrder({
      stripe,
      stripeCustomerId,
      daysUntilDue: 30,
      ...(project ? { description: `Order — ${project}` } : {}),
      paymentSettings: {
        payment_method_types: ['card', 'us_bank_account'], // Enable ACH (capped at $5)
      },
      invoiceMetadata: {
        created_via: 'orcaclub_admin',
      },
      lines: lineItems.map((item: any) => ({
        description: item.title,
        amount: item.unitPrice * item.quantity,
        metadata: {
          quantity: item.quantity.toString(),
          unit_price: item.unitPrice.toString(),
        },
      })),
    })

    // Stripe assigns the invoice number at finalization — use it as the order
    // number so the two always match. Fall back to the invoice id (unique) in the
    // should-never-happen case where a finalized invoice has no number.
    const orderNumber = invoice.number ?? invoiceId
    console.log('[Stripe Invoice] Invoice finalized:', invoiceId, '→', orderNumber)

    // 6. Create the order with the Stripe invoice already linked. If this write
    //    fails, void the invoice so we never strand a payable invoice with no
    //    matching order (the webhook resolves orders by stripeInvoiceId).
    let order
    try {
      order = await payload.create({
        collection: 'orders',
        data: {
          orderNumber,
          clientAccount: clientAccountId,
          amount: totalAmount,
          status: 'pending', // Will be updated to 'paid' via webhook
          stripeCustomerId,
          stripeInvoiceId: invoiceId,
          stripeInvoiceUrl: hostedInvoiceUrl,
          project: project || undefined, // Optional project name
          lineItems: lineItems.map((item: any) => ({
            title: item.title,
            quantity: item.quantity,
            price: item.unitPrice,
            isRecurring: false,
          })),
        },
      })
    } catch (createErr) {
      await stripe.invoices.voidInvoice(invoiceId).catch((e: any) =>
        console.error('[Stripe Invoice] Failed to void orphaned invoice:', e)
      )
      throw createErr
    }

    console.log('[Stripe Invoice] Created order record:', order.id, orderNumber)

    return NextResponse.json({
      success: true,
      invoiceUrl: hostedInvoiceUrl,
      invoiceId,
      orderNumber,
      totalAmount,
    })
  } catch (error: any) {
    console.error('[Stripe Invoice] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create invoice',
      },
      { status: 500 }
    )
  }
}
