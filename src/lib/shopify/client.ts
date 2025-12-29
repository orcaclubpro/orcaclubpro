import { createStorefrontApiClient } from '@shopify/storefront-api-client'

// Validate required environment variables
if (!process.env.SHOPIFY_STORE_DOMAIN) {
  throw new Error('SHOPIFY_STORE_DOMAIN is not defined in environment variables')
}

if (!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
  throw new Error('SHOPIFY_STOREFRONT_ACCESS_TOKEN is not defined in environment variables')
}

// Initialize Shopify Storefront API client
export const shopifyClient = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
  apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
  privateAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
})

console.log('[Shopify] Client initialized successfully')
