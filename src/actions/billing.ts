'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe'

/**
 * Creates a Stripe Billing Portal session for a client account.
 *
 * The portal lets clients:
 * - View and pay all outstanding invoices
 * - Add / update payment methods (credit card, ACH bank account)
 * - Manage subscriptions
 * - Download receipts
 *
 * Sessions are short-lived (~10 min) — generate on-demand when the client
 * wants to access billing.
 */
export async function createBillingPortalSession(clientAccountId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const clientAccount = await payload.findByID({
      collection: 'client-accounts',
      id: clientAccountId,
      depth: 0,
    })

    if (!clientAccount) return { success: false, error: 'Client account not found' }

    const stripeCustomerId = clientAccount.stripeCustomerId as string | null
    if (!stripeCustomerId) {
      return { success: false, error: 'No Stripe customer linked to this account yet. Contact support.' }
    }

    const stripe = getStripe()

    // Determine return URL — if client, send back to their invoices tab; staff go back to client profile
    const returnUrl =
      user.role === 'client' && user.username
        ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://orcaclub.pro'}/u/${user.username}?tab=invoices`
        : `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://orcaclub.pro'}/u/${user.username}/clients/${clientAccountId}`

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    })

    return { success: true, url: session.url }
  } catch (error) {
    console.error('[createBillingPortalSession]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to open billing portal' }
  }
}
