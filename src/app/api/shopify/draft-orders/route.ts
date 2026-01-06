/**
 * Shopify Draft Orders API Route
 * POST /api/shopify/draft-orders - Create a draft order
 * GET /api/shopify/draft-orders - Fetch draft orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { createDraftOrder, fetchDraftOrders, CreateDraftOrderInput } from '@/lib/shopify/draft-orders'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { generateOrderInvoiceEmail } from '@/lib/payload/utils/orderEmailTemplate'

/**
 * POST /api/shopify/draft-orders
 * Create a new draft order
 *
 * FLOW:
 * 1. Find or create client account by email (auto-creates Shopify customer via hook)
 * 2. Create Shopify draft order with customer ID
 * 3. Create PayloadCMS order record
 * 4. Send invoice email to customer
 *
 * Request body:
 * {
 *   customerId?: string (Shopify customer GID - optional, will be auto-created if not provided)
 *   email: string (REQUIRED - used to find/create client account)
 *   lineItems: Array<{
 *     variantId?: string (for existing products)
 *     title: string
 *     quantity: number
 *     originalUnitPrice: number
 *     taxable?: boolean
 *     requiresShipping?: boolean
 *   }>
 *   note?: string
 *   tags?: string[]
 *   shippingLine?: {
 *     title: string
 *     price: number
 *   }
 *   appliedDiscount?: {
 *     description?: string
 *     value: number
 *     valueType: 'PERCENTAGE' | 'FIXED_AMOUNT'
 *   }
 *   taxExempt?: boolean
 *   useCustomerDefaultAddress?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateDraftOrderInput = await request.json()

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      )
    }

    if (!body.lineItems || body.lineItems.length === 0) {
      return NextResponse.json(
        { error: 'lineItems is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate line items
    for (const item of body.lineItems) {
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
      if (item.originalUnitPrice === undefined || item.originalUnitPrice < 0) {
        return NextResponse.json(
          { error: 'Each line item must have a valid originalUnitPrice' },
          { status: 400 }
        )
      }
    }

    // STEP 1: Get PayloadCMS instance
    const payload = await getPayload({ config: configPromise })

    // STEP 2: Find or create client account FIRST (this triggers Shopify customer creation)
    let clientAccount = await payload.find({
      collection: 'client-accounts',
      where: {
        email: { equals: body.email },
      },
      limit: 1,
    })

    let clientAccountId = clientAccount.docs[0]?.id
    let shopifyCustomerId: string | undefined = clientAccount.docs[0]?.shopifyCustomerId || body.customerId

    // If no client account exists, create one (this will auto-create Shopify customer via hook)
    if (!clientAccountId) {
      const customerName = body.email.split('@')[0] // Use email prefix as default name

      const newClient = await payload.create({
        collection: 'client-accounts',
        data: {
          name: customerName,
          email: body.email,
        },
      })

      clientAccountId = newClient.id
      shopifyCustomerId = newClient.shopifyCustomerId || undefined
      console.log('[API] Created new client account:', clientAccountId)
      console.log('[API] Auto-created Shopify customer:', shopifyCustomerId)
    }

    // Ensure we have a Shopify customer ID
    if (!shopifyCustomerId) {
      return NextResponse.json(
        { error: 'Failed to create or find Shopify customer. Please try again.' },
        { status: 500 }
      )
    }

    // STEP 3: Create the draft order with the Shopify customer ID
    const result = await createDraftOrder({
      ...body,
      customerId: shopifyCustomerId,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to create draft order',
          userErrors: result.userErrors,
        },
        { status: 400 }
      )
    }

    // STEP 4: Create PayloadCMS order record and send email
    if (result.draftOrder) {
      try {
        // Create order record in PayloadCMS
        await payload.create({
          collection: 'orders',
          data: {
            orderNumber: result.draftOrder.name,
            orderType: 'shopify', // Shopify draft order
            clientAccount: clientAccountId,
            amount: parseFloat(result.draftOrder.totalPrice),
            status: 'pending', // Default to pending payment
            shopifyDraftOrderId: result.draftOrder.id,
            shopifyInvoiceUrl: result.draftOrder.invoiceUrl,
            lineItems: result.draftOrder.lineItems.map(item => ({
              title: item.title,
              quantity: item.quantity,
              price: parseFloat(item.discountedUnitPrice),
              shopifyVariantId: item.variant?.id,
            })),
          },
        })

        console.log('[API] Created order record for client:', clientAccountId)

        // Send invoice email to customer
        const customerName = result.draftOrder.customer?.firstName || undefined

        const emailHtml = generateOrderInvoiceEmail({
          orderNumber: result.draftOrder.name,
          customerName,
          customerEmail: result.draftOrder.email,
          invoiceUrl: result.draftOrder.invoiceUrl,
          totalPrice: result.draftOrder.totalPrice,
          subtotalPrice: result.draftOrder.subtotalPrice,
          totalTax: result.draftOrder.totalTax,
          currencyCode: result.draftOrder.currencyCode,
          lineItems: result.draftOrder.lineItems,
          createdAt: result.draftOrder.createdAt,
        })

        await payload.sendEmail({
          to: result.draftOrder.email,
          subject: `Your Order Invoice #${result.draftOrder.name} - ORCACLUB`,
          html: emailHtml,
        })

        console.log('[API] Order invoice email sent to:', result.draftOrder.email)
      } catch (error) {
        // Log error but don't fail the order creation
        console.error('[API] Error in PayloadCMS integration:', error)
        // Continue with success response even if PayloadCMS operations fail
      }
    }

    return NextResponse.json(
      { draftOrder: result.draftOrder },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Draft order creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create draft order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/shopify/draft-orders
 * Fetch draft orders from Shopify
 *
 * Query parameters:
 * - query: Search query (optional) - e.g., "email:customer@example.com" or "status:OPEN"
 * - limit: Number of draft orders to fetch (default: 50, max: 250)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await fetchDraftOrders(query, limit)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[API] Draft orders fetch error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch draft orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
