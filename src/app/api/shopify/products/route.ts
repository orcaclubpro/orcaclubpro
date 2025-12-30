/**
 * Shopify Products API Route
 * GET /api/shopify/products - Fetch products from Shopify Admin API
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchProducts, searchProducts, fetchProductById } from '@/lib/shopify/products'

/**
 * GET /api/shopify/products
 * Query parameters:
 * - query: Search query (optional) - e.g., "title:shirt" or "vendor:Nike"
 * - limit: Number of products to fetch (default: 50, max: 250)
 * - cursor: Pagination cursor (optional)
 * - id: Fetch single product by ID (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor') || undefined
    const productId = searchParams.get('id')

    // Fetch single product by ID
    if (productId) {
      const product = await fetchProductById(productId)

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ product }, { status: 200 })
    }

    // Fetch multiple products
    const result = await fetchProducts(query, limit, cursor)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[API] Products fetch error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
