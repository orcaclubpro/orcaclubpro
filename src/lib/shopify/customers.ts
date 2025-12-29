import { shopifyClient } from './client'
import crypto from 'crypto'

/**
 * Parse a full name into first and last name
 */
function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  // First word is firstName, everything else is lastName
  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')

  return { firstName, lastName }
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * GraphQL mutation for creating a customer
 */
const CREATE_CUSTOMER_MUTATION = `
  mutation createCustomerAccount($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        phone
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`

export interface CreateCustomerInput {
  name: string
  email: string
  phone?: string
  acceptsMarketing?: boolean
}

export interface CreateCustomerResult {
  success: boolean
  customerId: string | null
  generatedPassword: string | null
  error?: string
  isDuplicate?: boolean
}

/**
 * Create a Shopify customer via Storefront API
 */
export async function createShopifyCustomer(
  input: CreateCustomerInput
): Promise<CreateCustomerResult> {
  try {
    const { firstName, lastName } = parseName(input.name)
    const password = generateSecurePassword()

    console.log(`[Shopify] Creating customer: ${input.email}`)

    const response = await shopifyClient.request(CREATE_CUSTOMER_MUTATION, {
      variables: {
        input: {
          email: input.email,
          password,
          firstName,
          lastName,
          phone: input.phone || undefined,
          acceptsMarketing: input.acceptsMarketing ?? true,
        },
      },
    })

    const data = response.data as any

    // Check for user errors
    if (data?.customerCreate?.customerUserErrors?.length > 0) {
      const errors = data.customerCreate.customerUserErrors
      const firstError = errors[0]

      // Check if customer already exists
      if (
        firstError.code === 'CUSTOMER_ALREADY_EXISTS' ||
        firstError.message?.toLowerCase().includes('already exists')
      ) {
        console.log(`[Shopify] Customer already exists: ${input.email}`)
        return {
          success: false,
          customerId: null,
          generatedPassword: null,
          error: 'Customer already exists in Shopify',
          isDuplicate: true,
        }
      }

      // Other errors
      console.error('[Shopify] Customer creation failed:', errors)
      return {
        success: false,
        customerId: null,
        generatedPassword: null,
        error: firstError.message || 'Unknown error creating customer',
      }
    }

    // Success
    const customer = data?.customerCreate?.customer
    if (customer?.id) {
      console.log(`[Shopify] Customer created successfully: ${customer.id}`)
      return {
        success: true,
        customerId: customer.id,
        generatedPassword: password,
      }
    }

    // Unexpected response
    console.error('[Shopify] Unexpected response:', data)
    return {
      success: false,
      customerId: null,
      generatedPassword: null,
      error: 'Unexpected response from Shopify API',
    }
  } catch (error) {
    console.error('[Shopify] Customer creation error:', error)
    return {
      success: false,
      customerId: null,
      generatedPassword: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle customer creation with graceful error handling
 * This is a non-blocking wrapper that logs errors but doesn't throw
 */
export async function createCustomerSafely(
  input: CreateCustomerInput
): Promise<CreateCustomerResult> {
  try {
    return await createShopifyCustomer(input)
  } catch (error) {
    console.error('[Shopify] Safe customer creation caught error:', error)
    return {
      success: false,
      customerId: null,
      generatedPassword: null,
      error: 'Failed to create customer - caught exception',
    }
  }
}
