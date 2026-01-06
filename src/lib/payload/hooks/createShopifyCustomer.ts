/**
 * Shopify Customer Creation Hook
 * Automatically creates Shopify customers when creating client accounts
 */

import type { CollectionBeforeChangeHook } from 'payload'
import { createShopifyCustomer } from '@/lib/shopify/customers'

/**
 * Creates a Shopify customer when a new client account is created
 * - Only runs on 'create' operations
 * - Only runs if no shopifyCustomerId exists
 * - Only runs if email is provided
 * - Gracefully handles errors without blocking client account creation
 */
export const createShopifyCustomerHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  // Only run on create operations
  if (operation !== 'create') return data

  // Only run if no shopifyCustomerId exists
  if (data.shopifyCustomerId) return data

  // Only run if email is provided
  if (!data.email) return data

  try {
    // Use name field if available, otherwise use email prefix
    const customerName = data.name || data.email.split('@')[0]

    req.payload.logger.info(`[Client Account] Creating Shopify customer for: ${data.email}`)

    // Create Shopify customer
    const result = await createShopifyCustomer({
      name: customerName,
      email: data.email,
      phone: data.phone || undefined,
      acceptsMarketing: true, // Default to true for client accounts
    })

    if (result.success && result.customerId) {
      // Store Shopify customer ID
      data.shopifyCustomerId = result.customerId
      req.payload.logger.info(
        `[Client Account] Created Shopify customer: ${result.customerId} for ${data.email}`
      )
    } else if (result.isDuplicate) {
      // Customer already exists in Shopify - log but don't error
      req.payload.logger.warn(
        `[Client Account] Shopify customer already exists for: ${data.email}`
      )
    } else {
      // Log error but don't block client account creation
      req.payload.logger.error(
        `[Client Account] Failed to create Shopify customer for ${data.email}: ${result.error}`
      )
    }
  } catch (error) {
    // Log error but don't block client account creation
    req.payload.logger.error(
      `[Client Account] Error creating Shopify customer for ${data.email}:`,
      error
    )
  }

  return data
}
