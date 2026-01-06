/**
 * Stripe Customer Creation Hook
 * Automatically creates or syncs Stripe customer when client account is created/updated
 *
 * Similar to createShopifyCustomer hook but for Stripe integration
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
    return data
  }

  // Skip if Stripe customer already exists (unless email changed)
  const emailChanged = operation === 'update' && originalDoc?.email !== data.email
  if (data.stripeCustomerId && !emailChanged) {
    req.payload.logger.info(`[Stripe Customer Hook] Customer already exists: ${data.stripeCustomerId}`)
    return data
  }

  try {
    // If email changed, search for existing customer with new email
    if (emailChanged) {
      req.payload.logger.info(`[Stripe Customer Hook] Email changed from ${originalDoc?.email} to ${data.email}`)

      const existingCustomers = await stripe.customers.list({
        email: data.email,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        // Found existing customer, link it
        data.stripeCustomerId = existingCustomers.data[0].id
        req.payload.logger.info(`[Stripe Customer Hook] Linked existing customer: ${data.stripeCustomerId}`)
        return data
      }
    }

    // Search for existing Stripe customer by email (for create operations or email changes)
    if (operation === 'create' || emailChanged) {
      const existingCustomers = await stripe.customers.list({
        email: data.email,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        // Customer already exists in Stripe
        data.stripeCustomerId = existingCustomers.data[0].id
        req.payload.logger.info(`[Stripe Customer Hook] Found existing customer: ${data.stripeCustomerId}`)
        return data
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name || data.email.split('@')[0],
        metadata: {
          orcaclub_client_id: originalDoc?.id || 'pending',
          created_via: 'orcaclub_admin',
          source: 'client_account_hook',
        },
      })

      data.stripeCustomerId = customer.id
      req.payload.logger.info(`[Stripe Customer Hook] Created new customer: ${customer.id}`)
    }

    return data
  } catch (error) {
    req.payload.logger.error(`[Stripe Customer Hook] Error: ${error}`)
    // Don't fail the client account creation if Stripe fails
    return data
  }
}
