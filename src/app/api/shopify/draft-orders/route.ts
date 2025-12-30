/**
 * Shopify Draft Orders API Route
 * POST /api/shopify/draft-orders - Create a draft order
 * GET /api/shopify/draft-orders - Fetch draft orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { createDraftOrder, fetchDraftOrders, CreateDraftOrderInput } from '@/lib/shopify/draft-orders'

/**
 * POST /api/shopify/draft-orders
 * Create a new draft order
 *
 * Request body:
 * {
 *   customerId: string (Shopify customer GID)
 *   email: string
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
    if (!body.customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

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

    // Create the draft order
    const result = await createDraftOrder(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to create draft order',
          userErrors: result.userErrors,
        },
        { status: 400 }
      )
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
