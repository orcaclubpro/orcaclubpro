/**
 * Stripe Customer Creation Hook
 * Automatically creates or syncs Stripe customer when client account is created/updated
 *
 * Standard Pattern: "Search First, Create Only If Not Found"
 * - Validates existing stripeCustomerId
 * - Searches Stripe by email to find existing customers
 * - Creates new customer only if none exists
 * - Always ensures stripeCustomerId is set before saving
 */

import type { CollectionBeforeChangeHook } from 'payload'
import { getStripe } from '@/lib/stripe'

export const createStripeCustomerHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const stripe = getStripe()

  // Only proceed if email is present
  if (!data.email) {
    req.payload.logger.warn('[Stripe Customer Hook] No email provided, skipping')
    return data
  }

  try {
    // STEP 1: If stripeCustomerId already exists, verify it's still valid in Stripe.
    // For partial updates (e.g. from updateClientAccount), stripeCustomerId is not in
    // the incoming data — fall back to originalDoc to avoid creating duplicates.
    const existingStripeId = data.stripeCustomerId ?? originalDoc?.stripeCustomerId

    if (existingStripeId) {
      // Always carry the ID forward so it is saved on partial updates
      data.stripeCustomerId = existingStripeId

      try {
        await stripe.customers.retrieve(existingStripeId)

        // Customer exists and is valid — update email/name in Stripe if they changed
        const emailChanged = operation === 'update' && data.email && originalDoc?.email !== data.email
        if (emailChanged) {
          await stripe.customers.update(existingStripeId, {
            email: data.email,
            name: data.name || data.email.split('@')[0],
          })
          req.payload.logger.info(
            `[Stripe Customer Hook] Updated email for ${existingStripeId}: ${originalDoc?.email} → ${data.email}`
          )
        }

        req.payload.logger.info(`[Stripe Customer Hook] Customer verified: ${existingStripeId}`)
        return data
      } catch (error: any) {
        // Customer was deleted or doesn't exist in Stripe, need to find/create new one
        if (
          error.type === 'StripeInvalidRequestError' ||
          error.statusCode === 404 ||
          error.statusCode === 400
        ) {
          req.payload.logger.warn(
            `[Stripe Customer Hook] Customer ${existingStripeId} invalid or not found in Stripe, will search/create new`
          )
          req.payload.logger.warn(`[Stripe Customer Hook] Error details: ${error.message}`)
          data.stripeCustomerId = undefined // Clear invalid ID
        } else {
          throw error // Re-throw other errors
        }
      }
    }

    // STEP 2: Search for existing customer by email
    req.payload.logger.info(`[Stripe Customer Hook] Searching for customer with email: ${data.email}`)

    const existingCustomers = await stripe.customers.list({
      email: data.email,
      limit: 1,
    })

    // STEP 3a: Link existing customer if found
    if (existingCustomers.data.length > 0) {
      const existingCustomer = existingCustomers.data[0]
      data.stripeCustomerId = existingCustomer.id

      req.payload.logger.info(
        `[Stripe Customer Hook] Found existing customer: ${existingCustomer.id} (${existingCustomer.email})`
      )

      // Update customer name if it's different
      if (data.name && existingCustomer.name !== data.name) {
        await stripe.customers.update(existingCustomer.id, {
          name: data.name,
        })
        req.payload.logger.info(`[Stripe Customer Hook] Updated name for ${existingCustomer.id}: ${data.name}`)
      }

      return data
    }

    // STEP 3b: Create new customer if none exists
    req.payload.logger.info(`[Stripe Customer Hook] No existing customer found, creating new customer`)

    const newCustomer = await stripe.customers.create({
      email: data.email,
      name: data.name || data.email.split('@')[0],
      metadata: {
        orcaclub_client_id: originalDoc?.id || 'pending',
        created_via: 'orcaclub_admin',
        source: 'client_account_hook',
        created_at: new Date().toISOString(),
      },
    })

    data.stripeCustomerId = newCustomer.id
    req.payload.logger.info(`[Stripe Customer Hook] Created new customer: ${newCustomer.id} (${newCustomer.email})`)

    return data
  } catch (error) {
    req.payload.logger.error(`[Stripe Customer Hook] Error: ${error}`)

    // Log detailed error info
    if (error instanceof Error) {
      req.payload.logger.error(`[Stripe Customer Hook] Error details: ${error.message}`)
      req.payload.logger.error(`[Stripe Customer Hook] Stack: ${error.stack}`)
    }

    // Don't fail the client account creation if Stripe fails
    // But log prominently so admin knows to fix manually
    req.payload.logger.error(
      `[Stripe Customer Hook] ⚠️ WARNING: Client account will be saved without Stripe customer ID!`
    )

    return data
  }
}
