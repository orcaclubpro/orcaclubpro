/**
 * Shared Stripe customer resolution.
 *
 * "Search first, create only if not found" — previously re-implemented in the
 * ClientAccounts beforeChange hook, the payment-links route, and the client
 * actions. Talks to Stripe only; every caller is responsible for persisting the
 * resolved id (mutating hook `data`, updating the client-account doc, etc.).
 */

import type { Payload, PayloadRequest } from 'payload'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'

export interface ResolveStripeCustomerParams {
  email: string
  name?: string | null
  /** An existing id (from the DB) to validate before searching/creating. */
  existingCustomerId?: string | null
  /** Metadata applied only when a brand-new customer is created. */
  metadata?: Record<string, string>
  /**
   * The customer's previous email. When it differs from `email`, the existing
   * Stripe customer's email + name are updated to match (email-change sync).
   */
  previousEmail?: string | null
  /** Reuse an existing Stripe client instead of the singleton. */
  stripe?: Stripe
}

export interface ResolveStripeCustomerResult {
  customerId: string
  /** What happened: validated an existing id, linked one found by email, or created one. */
  action: 'validated' | 'linked' | 'created'
  /** True when `existingCustomerId` was invalid/deleted and dropped before search/create. */
  clearedInvalidId: boolean
}

/** Stripe's `name` is required-ish for display — fall back to the email local part. */
const nameOrEmailLocalPart = (name: string | null | undefined, email: string): string =>
  name || email.split('@')[0]

/**
 * Resolve a Stripe customer for the given email, returning its id.
 *
 * 1. If `existingCustomerId` is given, verify it still exists in Stripe. If the
 *    email changed (`previousEmail`), sync email+name onto it. Invalid/deleted
 *    ids are dropped (`clearedInvalidId: true`) and we fall through to search.
 * 2. Search Stripe by email; link the first match (syncing name if it differs).
 * 3. Otherwise create a new customer.
 */
export async function resolveStripeCustomer(
  params: ResolveStripeCustomerParams,
): Promise<ResolveStripeCustomerResult> {
  const stripe = params.stripe ?? getStripe()
  const { email } = params
  const name = params.name ?? undefined
  let clearedInvalidId = false

  // 1. Validate an existing id.
  if (params.existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(params.existingCustomerId)
      if ((customer as Stripe.DeletedCustomer).deleted) {
        throw new Error('Customer is deleted')
      }

      // Only touch Stripe on an actual email change (matches the hook's behavior).
      const emailChanged = params.previousEmail != null && params.previousEmail !== email
      if (emailChanged) {
        await stripe.customers.update(params.existingCustomerId, {
          email,
          name: nameOrEmailLocalPart(name, email),
        })
      }

      return { customerId: params.existingCustomerId, action: 'validated', clearedInvalidId }
    } catch (error: any) {
      const invalid =
        error?.type === 'StripeInvalidRequestError' ||
        error?.statusCode === 404 ||
        error?.statusCode === 400 ||
        error?.message === 'Customer is deleted'
      if (!invalid) throw error
      clearedInvalidId = true
      // fall through to search/create
    }
  }

  // 2. Search by email.
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) {
    const found = existing.data[0]
    if (name && found.name !== name) {
      await stripe.customers.update(found.id, { name })
    }
    return { customerId: found.id, action: 'linked', clearedInvalidId }
  }

  // 3. Create.
  const created = await stripe.customers.create({
    email,
    name: nameOrEmailLocalPart(name, email),
    ...(params.metadata ? { metadata: params.metadata } : {}),
  })
  return { customerId: created.id, action: 'created', clearedInvalidId }
}

/**
 * Resolve the Stripe customer for a client account and persist any correction.
 *
 * `resolveStripeCustomer` talks to Stripe only; this wraps it with the write-back
 * that every caller was repeating. It also replaces the "Client account has no
 * Stripe customer ID — set it in the admin panel first" dead end that the package
 * flows used to hit: the orders tab, retainer billing, and the admin payment-links
 * route all self-heal here, so a package should too. A stale or deleted id is
 * repaired the same way.
 *
 * Throws when the account has no email — Stripe cannot resolve a customer without one.
 */
export async function resolveClientAccountStripeCustomer(params: {
  payload: Payload
  clientAccountId: string
  email: string | null | undefined
  name?: string | null
  existingCustomerId?: string | null
  /** Metadata applied only when a brand-new Stripe customer is created. */
  metadata?: Record<string, string>
  stripe?: Stripe
  req?: PayloadRequest
}): Promise<string> {
  const { payload, clientAccountId, email } = params

  if (!email) {
    throw new Error(
      'This client account has no email address — add one before invoicing, so Stripe has somewhere to send the invoice.',
    )
  }

  const resolved = await resolveStripeCustomer({
    ...(params.stripe ? { stripe: params.stripe } : {}),
    email,
    name: params.name ?? null,
    existingCustomerId: params.existingCustomerId ?? null,
    ...(params.metadata ? { metadata: params.metadata } : {}),
  })

  if (resolved.customerId !== params.existingCustomerId) {
    await payload
      .update({
        collection: 'client-accounts',
        id: clientAccountId,
        data: { stripeCustomerId: resolved.customerId } as never,
        ...(params.req ? { req: params.req } : {}),
      })
      .catch((e: unknown) =>
        // Non-fatal: the invoice can still be raised against the resolved customer.
        // Worst case the next flow resolves it again and re-attempts the write.
        console.error('[resolveClientAccountStripeCustomer] Failed to persist customer id:', e),
      )
  }

  return resolved.customerId
}
