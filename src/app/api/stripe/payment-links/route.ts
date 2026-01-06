import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

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
    const body = await request.json()

    const { customerEmail, customerName, lineItems } = body

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

    // Create PayloadCMS records first to get order number
    const payload = await getPayload({ config: configPromise })

    // 1. Find or create client account
    let clientAccount = await payload.find({
      collection: 'client-accounts',
      where: {
        email: { equals: customerEmail },
      },
      limit: 1,
    })

    let clientAccountId = clientAccount.docs[0]?.id

    // If no client account exists, create one
    if (!clientAccountId) {
      const newClient = await payload.create({
        collection: 'client-accounts',
        data: {
          name: customerName || customerEmail.split('@')[0],
          email: customerEmail,
        },
      })

      clientAccountId = newClient.id
      console.log('[Stripe Invoice] Created new client account:', clientAccountId)
    }

    // 2. Generate order number
    const orderCount = await payload.count({
      collection: 'orders',
      where: {
        orderType: { equals: 'stripe' },
      },
    })

    const orderNumber = `STRIPE-${String(orderCount.totalDocs + 1).padStart(4, '0')}`

    // 3. Get Stripe customer ID from client account
    let stripeCustomerId = clientAccount.docs[0]?.stripeCustomerId

    if (!stripeCustomerId) {
      console.warn('[Stripe Invoice] No Stripe customer ID found in client account')
      console.warn('[Stripe Invoice] This should have been created by the beforeChange hook')

      // Fallback: search for existing customer or create new one
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id
        console.log('[Stripe Invoice] Found existing customer (fallback):', stripeCustomerId)

        // Update client account with Stripe customer ID
        await payload.update({
          collection: 'client-accounts',
          id: clientAccountId,
          data: {
            stripeCustomerId,
          },
        })
      } else {
        // Create new Stripe customer (fallback)
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName || customerEmail.split('@')[0],
          metadata: {
            orcaclub_client_id: clientAccountId,
            created_via: 'orcaclub_admin',
            source: 'invoice_api_fallback',
          },
        })
        stripeCustomerId = customer.id
        console.log('[Stripe Invoice] Created new customer (fallback):', stripeCustomerId)

        // Update client account with Stripe customer ID
        await payload.update({
          collection: 'client-accounts',
          id: clientAccountId,
          data: {
            stripeCustomerId,
          },
        })
      }
    } else {
      console.log('[Stripe Invoice] Using existing Stripe customer from client account:', stripeCustomerId)
    }

    // 4. Create invoice items for each line item
    for (const item of lineItems) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        amount: Math.round(item.unitPrice * item.quantity * 100), // Convert to cents
        currency: 'usd',
        description: item.title,
        metadata: {
          order_number: orderNumber,
          quantity: item.quantity.toString(),
          unit_price: item.unitPrice.toString(),
        },
      })
    }

    // 5. Create invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice', // Creates hosted invoice page
      days_until_due: 30,
      auto_advance: true, // Auto-finalize the invoice
      description: `Order ${orderNumber}`,
      metadata: {
        order_number: orderNumber,
        orcaclub_order_id: '', // Will be updated after order creation
        created_via: 'orcaclub_admin',
      },
    })

    // 6. Finalize invoice to make it payable
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

    console.log('[Stripe Invoice] Invoice created and finalized:', finalizedInvoice.id)
    console.log('[Stripe Invoice] Hosted URL:', finalizedInvoice.hosted_invoice_url)

    // 7. Create order record in PayloadCMS
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        orderType: 'stripe',
        clientAccount: clientAccountId,
        amount: totalAmount,
        status: 'pending', // Will be updated to 'paid' via webhook
        stripeInvoiceId: finalizedInvoice.id,
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url || '',
        stripeCustomerId,
        lineItems: lineItems.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.unitPrice,
          isRecurring: false,
        })),
      },
    })

    console.log('[Stripe Invoice] Created order record:', order.id, orderNumber)

    // 8. Update invoice metadata with PayloadCMS order ID
    await stripe.invoices.update(finalizedInvoice.id, {
      metadata: {
        order_number: orderNumber,
        orcaclub_order_id: order.id,
        created_via: 'orcaclub_admin',
      },
    })

    return NextResponse.json({
      success: true,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      invoiceId: finalizedInvoice.id,
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
