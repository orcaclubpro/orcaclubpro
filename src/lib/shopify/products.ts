/**
 * Shopify Products Utilities
 * Query products and variants from Shopify Admin API
 */

import { shopifyAdminRequest } from './admin-client'

/**
 * GraphQL query to fetch products with variants
 */
const PRODUCTS_QUERY = `
  query getProducts($first: Int!, $query: String, $after: String) {
    products(first: $first, query: $query, after: $after) {
      edges {
        node {
          id
          title
          description
          handle
          status
          vendor
          productType
          featuredImage {
            url
            altText
          }
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                sku
                price
                inventoryQuantity
                availableForSale
                displayName
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
    }
  }
`

/**
 * GraphQL query to fetch a single product by ID
 */
const PRODUCT_BY_ID_QUERY = `
  query getProduct($id: ID!) {
    product(id: $id) {
      id
      title
      description
      handle
      status
      vendor
      productType
      featuredImage {
        url
        altText
      }
      priceRangeV2 {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            sku
            price
            inventoryQuantity
            availableForSale
            displayName
          }
        }
      }
    }
  }
`

/**
 * Product variant interface
 */
export interface ShopifyVariant {
  id: string
  title: string
  sku: string | null
  price: string
  inventoryQuantity: number
  availableForSale: boolean
  displayName: string
}

/**
 * Product interface
 */
export interface ShopifyProduct {
  id: string
  title: string
  description: string
  handle: string
  status: string
  vendor: string | null
  productType: string | null
  image?: {
    url: string
    alt: string
  }
  priceRange: {
    min: {
      amount: string
      currency: string
    }
    max: {
      amount: string
      currency: string
    }
  }
  variants: ShopifyVariant[]
}

/**
 * Products response with pagination info
 */
export interface ProductsResponse {
  products: ShopifyProduct[]
  pageInfo: {
    hasNextPage: boolean
    hasPreviousPage: boolean
    endCursor: string | null
    startCursor: string | null
  }
}

/**
 * Fetch products from Shopify
 * @param query Optional search query (e.g., "title:shirt" or "vendor:Nike")
 * @param limit Number of products to fetch (default: 50, max: 250)
 * @param cursor Pagination cursor for fetching next page
 */
export async function fetchProducts(
  query?: string,
  limit = 50,
  cursor?: string
): Promise<ProductsResponse> {
  try {
    console.log('[Shopify Products] Fetching products...', { query, limit, cursor })

    const response = await shopifyAdminRequest(PRODUCTS_QUERY, {
      first: Math.min(limit, 250), // Max 250 per request
      query: query || null,
      after: cursor || null,
    })

    if (!response.data?.products) {
      console.error('[Shopify Products] No products data in response')
      return {
        products: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null,
        },
      }
    }

    const edges = response.data.products.edges || []

    const products: ShopifyProduct[] = edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      description: edge.node.description || '',
      handle: edge.node.handle,
      status: edge.node.status,
      vendor: edge.node.vendor,
      productType: edge.node.productType,
      image: edge.node.featuredImage
        ? {
            url: edge.node.featuredImage.url,
            alt: edge.node.featuredImage.altText || edge.node.title,
          }
        : undefined,
      priceRange: {
        min: {
          amount: edge.node.priceRangeV2.minVariantPrice.amount,
          currency: edge.node.priceRangeV2.minVariantPrice.currencyCode,
        },
        max: {
          amount: edge.node.priceRangeV2.maxVariantPrice.amount,
          currency: edge.node.priceRangeV2.maxVariantPrice.currencyCode,
        },
      },
      variants: edge.node.variants.edges.map((v: any) => ({
        id: v.node.id,
        title: v.node.title,
        sku: v.node.sku,
        price: v.node.price,
        inventoryQuantity: v.node.inventoryQuantity,
        availableForSale: v.node.availableForSale,
        displayName: v.node.displayName,
      })),
    }))

    console.log(`[Shopify Products] Fetched ${products.length} products`)

    return {
      products,
      pageInfo: response.data.products.pageInfo,
    }
  } catch (error) {
    console.error('[Shopify Products] Fetch error:', error)
    throw error
  }
}

/**
 * Fetch a single product by ID
 * @param productId Shopify product GID (e.g., "gid://shopify/Product/123")
 */
export async function fetchProductById(productId: string): Promise<ShopifyProduct | null> {
  try {
    console.log('[Shopify Products] Fetching product by ID:', productId)

    const response = await shopifyAdminRequest(PRODUCT_BY_ID_QUERY, {
      id: productId,
    })

    if (!response.data?.product) {
      console.warn('[Shopify Products] Product not found:', productId)
      return null
    }

    const node = response.data.product

    const product: ShopifyProduct = {
      id: node.id,
      title: node.title,
      description: node.description || '',
      handle: node.handle,
      status: node.status,
      vendor: node.vendor,
      productType: node.productType,
      image: node.featuredImage
        ? {
            url: node.featuredImage.url,
            alt: node.featuredImage.altText || node.title,
          }
        : undefined,
      priceRange: {
        min: {
          amount: node.priceRangeV2.minVariantPrice.amount,
          currency: node.priceRangeV2.minVariantPrice.currencyCode,
        },
        max: {
          amount: node.priceRangeV2.maxVariantPrice.amount,
          currency: node.priceRangeV2.maxVariantPrice.currencyCode,
        },
      },
      variants: node.variants.edges.map((v: any) => ({
        id: v.node.id,
        title: v.node.title,
        sku: v.node.sku,
        price: v.node.price,
        inventoryQuantity: v.node.inventoryQuantity,
        availableForSale: v.node.availableForSale,
        displayName: v.node.displayName,
      })),
    }

    console.log('[Shopify Products] Product fetched:', product.title)

    return product
  } catch (error) {
    console.error('[Shopify Products] Fetch by ID error:', error)
    throw error
  }
}

/**
 * Search products by title, vendor, or other attributes
 * Uses Shopify's search query syntax
 * Examples:
 * - "title:shirt" - Search by title
 * - "vendor:Nike" - Search by vendor
 * - "product_type:shoes" - Search by product type
 * - "tag:sale" - Search by tag
 */
export async function searchProducts(
  searchTerm: string,
  limit = 50
): Promise<ProductsResponse> {
  return fetchProducts(searchTerm, limit)
}

console.log('[Shopify Products] Products module loaded')
