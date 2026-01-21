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

    // 2. Verify Stripe customer exists (following same pattern as hook)
    if (stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId)

        // Check if customer is deleted
        if (customer.deleted) {
          throw new Error('Customer is deleted')
        }

        console.log('[Stripe Invoice] Stripe customer verified:', stripeCustomerId)
      } catch (error: any) {
        console.warn(
          '[Stripe Invoice] Stripe customer invalid or not found in Stripe, will search/create new:',
          stripeCustomerId
        )
        console.warn('[Stripe Invoice] Error details:', error.message || error)

        // Clear invalid ID from database (same as hook)
        await payload.update({
          collection: 'client-accounts',
          id: clientAccountId,
          data: {
            stripeCustomerId: null, // Clear invalid ID
          },
        })

        stripeCustomerId = '' // Clear for search/create flow
        console.log('[Stripe Invoice] Cleared invalid Stripe customer ID from client account')
      }
    }

    // 3. If no valid Stripe customer, search for existing or create new
    if (!stripeCustomerId) {
      console.log('[Stripe Invoice] Searching for existing Stripe customer:', customerEmail)

      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        // Found existing customer in Stripe
        stripeCustomerId = existingCustomers.data[0].id
        console.log('[Stripe Invoice] Found existing Stripe customer:', stripeCustomerId)

        // Update client account with Stripe customer ID
        await payload.update({
          collection: 'client-accounts',
          id: clientAccountId,
          data: {
            stripeCustomerId,
          },
        })
        console.log('[Stripe Invoice] Updated client account with Stripe ID')
      } else {
        // Create new Stripe customer
        console.log('[Stripe Invoice] Creating new Stripe customer for:', customerEmail)

        const newCustomer = await stripe.customers.create({
          email: customerEmail,
          name: customerName || customerEmail.split('@')[0],
          metadata: {
            orcaclub_client_id: clientAccountId,
            created_via: 'orcaclub_admin',
            source: 'payment_links_api',
            created_at: new Date().toISOString(),
          },
        })

        stripeCustomerId = newCustomer.id
        console.log('[Stripe Invoice] Created new Stripe customer:', stripeCustomerId)

        // Update client account with Stripe customer ID
        await payload.update({
          collection: 'client-accounts',
          id: clientAccountId,
          data: {
            stripeCustomerId,
          },
        })
        console.log('[Stripe Invoice] Updated client account with new Stripe ID')
      }
    }

    // 4. Generate order number
    const orderCount = await payload.count({
      collection: 'orders',
    })

    const orderNumber = `INV-${String(orderCount.totalDocs + 1).padStart(4, '0')}`
    console.log('[Stripe Invoice] Generated order number:', orderNumber)

    // Final safety check: Ensure we have a valid Stripe customer ID
    if (!stripeCustomerId) {
      throw new Error(
        'Failed to get or create Stripe customer. Cannot create invoice without valid customer ID.'
      )
    }

    console.log('[Stripe Invoice] Final customer ID check passed:', stripeCustomerId)

    // 5. Create order record in PayloadCMS FIRST (so we have the order ID)
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        clientAccount: clientAccountId,
        amount: totalAmount,
        status: 'pending', // Will be updated to 'paid' via webhook
        stripeCustomerId,
        project: project || undefined, // Optional project name
        lineItems: lineItems.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.unitPrice,
          isRecurring: false,
        })),
      },
    })

    console.log('[Stripe Invoice] Created order record:', order.id, orderNumber)

    // 6. Create invoice items for each line item
    for (const item of lineItems) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        amount: Math.round(item.unitPrice * item.quantity * 100), // Convert to cents
        currency: 'usd',
        description: item.title,
        metadata: {
          order_number: orderNumber,
          orcaclub_order_id: order.id, // Include order ID
          quantity: item.quantity.toString(),
          unit_price: item.unitPrice.toString(),
        },
      })
    }

    // 7. Create invoice WITH order ID in metadata from the start
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice', // Creates hosted invoice page
      days_until_due: 30,
      auto_advance: true, // Auto-finalize the invoice
      description: `Order ${orderNumber}`,
      metadata: {
        order_number: orderNumber,
        orcaclub_order_id: order.id, // ✅ Order ID is set from the beginning
        created_via: 'orcaclub_admin',
      },
    })

    // 8. Finalize invoice to make it payable
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

    console.log('[Stripe Invoice] Invoice created and finalized:', finalizedInvoice.id)
    console.log('[Stripe Invoice] Hosted URL:', finalizedInvoice.hosted_invoice_url)

    // 9. Update order with Stripe invoice details
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        stripeInvoiceId: finalizedInvoice.id,
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url || '',
      },
    })

    console.log('[Stripe Invoice] Updated order with invoice details')

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
