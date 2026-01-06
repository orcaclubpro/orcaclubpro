/**
 * Stripe Client Configuration
 *
 * This module provides lazy initialization of the Stripe client to ensure
 * environment variables are loaded before the client is instantiated.
 *
 * Usage:
 * - Server-side: Use `getStripe()` to get the Stripe instance
 * - Client-side: Use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from process.env
 */

import Stripe from 'stripe'

/**
 * Cached Stripe instance for server-side operations
 * Using lazy initialization to prevent errors during build time
 */
let _stripe: Stripe | null = null

/**
 * Get or create a Stripe client instance for server-side operations
 *
 * @returns Stripe client configured with secret key
 * @throws Error if STRIPE_SECRET_KEY is not set
 */
export const getStripe = (): Stripe => {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not set. Please add it to your .env.local file.'
      )
    }

    _stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover', // Latest stable API version
      typescript: true,
      appInfo: {
        name: 'ORCACLUB',
        version: '1.0.0',
        url: 'https://orcaclub.pro',
      },
    })
  }

  return _stripe
}

/**
 * Get the publishable key for client-side Stripe.js initialization
 *
 * @returns Stripe publishable key
 * @throws Error if NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set
 */
export const getPublishableKey = (): string => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Please add it to your .env.local file.'
    )
  }

  return publishableKey
}

/**
 * Check if we're using test mode (based on key prefix)
 */
export const isTestMode = (): boolean => {
  const key = process.env.STRIPE_SECRET_KEY || ''
  return key.startsWith('sk_test_')
}
