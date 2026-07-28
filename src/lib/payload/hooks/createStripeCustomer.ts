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
import { resolveStripeCustomer } from '@/lib/stripe/customers'

export const createStripeCustomerHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  // Only proceed if email is present
  if (!data.email) {
    req.payload.logger.warn('[Stripe Customer Hook] No email provided, skipping')
    return data
  }

  try {
    // For partial updates (e.g. from updateClientAccount), stripeCustomerId is not
    // in the incoming data — fall back to originalDoc so we validate the existing
    // customer instead of creating a duplicate.
    const existingCustomerId = data.stripeCustomerId ?? originalDoc?.stripeCustomerId ?? null

    // Carry the existing id forward immediately so a partial update still persists
    // it even if the Stripe call below throws transiently and we fall to the
    // non-fatal catch (matches the prior hook's "always carry forward" guarantee).
    if (existingCustomerId) data.stripeCustomerId = existingCustomerId

    const resolved = await resolveStripeCustomer({
      email: data.email,
      name: data.name ?? null,
      existingCustomerId,
      // On update, sync email/name onto the existing customer when the email
      // changed. Empty string stands in for "no prior email" so first-time email
      // assignment still syncs, matching the previous hook behavior.
      previousEmail: operation === 'update' ? (originalDoc?.email ?? '') : null,
      metadata: {
        orcaclub_client_id: originalDoc?.id || 'pending',
        created_via: 'orcaclub_admin',
        source: 'client_account_hook',
        created_at: new Date().toISOString(),
      },
    })

    data.stripeCustomerId = resolved.customerId
    req.payload.logger.info(
      `[Stripe Customer Hook] Customer ${resolved.action}: ${resolved.customerId}`
    )
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
