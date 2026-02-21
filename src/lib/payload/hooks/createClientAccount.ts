/**
 * createClientAccount Hook - Auto-link or create ClientAccount for client role users
 *
 * Runs BEFORE user creation. Finds an existing ClientAccount by email and links
 * the new User to it, or creates a fresh ClientAccount if none exists.
 *
 * NOTE: Nested payload calls intentionally omit `req` to avoid MongoDB session
 * transaction-number conflicts that occur when this hook fires inside server-action
 * contexts (where multiple synthetic requests share the same connection-pool session).
 * The find/create operations here are lightweight and do not need to be atomic with
 * the outer user-creation transaction.
 */

import type { CollectionBeforeChangeHook } from 'payload'

export const createClientAccountHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  const { payload } = req

  // Only proceed for client role users on create
  if (data.role !== 'client' || operation !== 'create') {
    return data
  }

  // Validate required fields for client users
  if (!data.firstName || !data.lastName || !data.email) {
    payload.logger.error('[Create Client Account Hook] Missing required fields')
    throw new Error('Client users require firstName, lastName, and email')
  }

  try {
    // Check if ClientAccount already exists with this email.
    // Do NOT pass `req` — the synthetic req from server-action contexts can carry a
    // stale MongoDB session transaction number, causing MongoServerError conflicts.
    const existingAccount = await payload.find({
      collection: 'client-accounts',
      where: { email: { equals: data.email } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingAccount.docs.length > 0) {
      const accountId = existingAccount.docs[0].id
      data.clientAccount = accountId
      payload.logger.info(
        `[Create Client Account Hook] Linked user ${data.email} to existing account: ${accountId}`
      )
      return data
    }

    // No ClientAccount found — create one. Again, no `req` to avoid session conflicts.
    const newAccount = await payload.create({
      collection: 'client-accounts',
      data: {
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company || undefined,
      },
      overrideAccess: true,
    })

    data.clientAccount = newAccount.id
    payload.logger.info(
      `[Create Client Account Hook] Created new account: ${newAccount.id} for ${data.email}`
    )

    return data
  } catch (error) {
    // Log but do not re-throw — user creation must succeed even if the hook cannot
    // resolve the linked account. The missing link can be corrected manually.
    payload.logger.error(
      `[Create Client Account Hook] Could not link/create ClientAccount for ${data.email}: ${error instanceof Error ? error.message : error}`
    )
    return data
  }
}
