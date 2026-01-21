/**
 * createClientAccount Hook - Auto-create ClientAccount for client role users
 *
 * This hook runs BEFORE user creation and automatically creates a linked ClientAccount
 * when a new user with role="client" is created.
 *
 * Flow:
 * 1. Check if user role is "client" and operation is "create"
 * 2. Validate required fields (firstName, lastName, email)
 * 3. Check if ClientAccount already exists with this email
 * 4. If exists, link to existing account; otherwise create new account
 * 5. Set user.clientAccount to the account ID
 *
 * Security:
 * - Always passes `req` to maintain transaction atomicity
 * - Validates email uniqueness to prevent duplicate accounts
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
    // Check if ClientAccount already exists with this email
    const existingAccount = await payload.find({
      collection: 'client-accounts',
      where: { email: { equals: data.email } },
      limit: 1,
      req, // Pass req for transaction safety
    })

    if (existingAccount.docs.length > 0) {
      // Link to existing account
      const accountId = existingAccount.docs[0].id
      data.clientAccount = accountId
      payload.logger.info(
        `[Create Client Account Hook] Linked user ${data.email} to existing account: ${accountId}`
      )
      return data
    }

    // Create new ClientAccount
    const newAccount = await payload.create({
      collection: 'client-accounts',
      data: {
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company || undefined,
      },
      req, // CRITICAL: Maintain transaction atomicity
    })

    data.clientAccount = newAccount.id
    payload.logger.info(
      `[Create Client Account Hook] Created new account: ${newAccount.id} for ${data.email}`
    )

    return data
  } catch (error) {
    payload.logger.error(`[Create Client Account Hook] Error: ${error}`)
    throw new Error(`Failed to create client account: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
