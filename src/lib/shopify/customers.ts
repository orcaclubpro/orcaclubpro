/**
 * Shopify Customer Utilities
 * Create and manage customers via Shopify Admin API
 */

import { shopifyAdminRequest } from './admin-client'

/**
 * GraphQL mutation to create a customer
 */
const CUSTOMER_CREATE_MUTATION = `
  mutation customerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        phone
        firstName
        lastName
        createdAt
        updatedAt
        verifiedEmail
        state
      }
      userErrors {
        field
        message
      }
    }
  }
`

/**
 * Input for creating a Shopify customer
 */
export interface CreateShopifyCustomerInput {
  email: string
  firstName?: string
  lastName?: string
  name?: string // Alternative to firstName/lastName - will be split automatically
  phone?: string
  acceptsMarketing?: boolean // For marketing consent
}

/**
 * Result of customer creation
 */
export interface CreateShopifyCustomerResult {
  success: boolean
  customerId: string | null // Shopify GID: "gid://shopify/Customer/123"
  customer: any | null
  error?: string
  isDuplicate?: boolean // True if customer already exists
  userErrors?: Array<{ field: string[]; message: string }>
}

/**
 * Create a customer in Shopify
 * Returns the customer object with Shopify GID for use in draft orders
 */
export async function createShopifyCustomer(
  input: CreateShopifyCustomerInput
): Promise<CreateShopifyCustomerResult> {
  try {
    console.log('[Shopify Customers] Creating customer for:', input.email)

    // Build the GraphQL input
    const graphqlInput: any = {
      email: input.email,
    }

    // Handle name splitting if provided as full name
    if (input.name && !input.firstName && !input.lastName) {
      const nameParts = input.name.trim().split(' ')
      if (nameParts.length > 1) {
        graphqlInput.firstName = nameParts[0]
        graphqlInput.lastName = nameParts.slice(1).join(' ')
      } else {
        graphqlInput.firstName = input.name
      }
    } else {
      // Add optional fields
      if (input.firstName) {
        graphqlInput.firstName = input.firstName
      }

      if (input.lastName) {
        graphqlInput.lastName = input.lastName
      }
    }

    if (input.phone) {
      graphqlInput.phone = input.phone
    }

    if (input.acceptsMarketing !== undefined) {
      graphqlInput.acceptsMarketing = input.acceptsMarketing
    }

    const response = await shopifyAdminRequest(CUSTOMER_CREATE_MUTATION, {
      input: graphqlInput,
    })

    // Check for user errors
    const userErrors = response.data?.customerCreate?.userErrors || []
    if (userErrors.length > 0) {
      console.error('[Shopify Customers] User errors:', userErrors)

      // Check if error indicates duplicate customer (email already exists)
      const isDuplicateError = userErrors.some((err: { field?: string[]; message: string }) =>
        err.message.toLowerCase().includes('taken') ||
        err.message.toLowerCase().includes('already exists') ||
        err.field?.includes('email')
      )

      return {
        success: false,
        customerId: null,
        customer: null,
        error: userErrors[0].message,
        isDuplicate: isDuplicateError,
        userErrors,
      }
    }

    // Check if customer was created
    const customer = response.data?.customerCreate?.customer
    if (!customer) {
      console.error('[Shopify Customers] No customer in response')
      return {
        success: false,
        customerId: null,
        customer: null,
        error: 'No customer returned from API',
      }
    }

    console.log('[Shopify Customers] Customer created successfully:', customer.id)
    console.log('[Shopify Customers] Email:', customer.email)

    return {
      success: true,
      customerId: customer.id,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        verifiedEmail: customer.verifiedEmail,
        state: customer.state,
      },
    }
  } catch (error) {
    console.error('[Shopify Customers] Creation error:', error)
    return {
      success: false,
      customerId: null,
      customer: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

console.log('[Shopify Customers] Customer module loaded')

// Alias for backward compatibility
export const createCustomerSafely = createShopifyCustomer
