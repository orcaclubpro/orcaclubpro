/**
 * Balance Update Hooks
 * Automatically update client account balances when orders are created, updated, or deleted
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/**
 * Retry helper for transient MongoDB errors (write conflicts)
 * Based on MongoDB's official retry pattern for TransientTransactionError
 * @see https://www.mongodb.com/docs/manual/core/retryable-writes/
 */
async function retryOnTransientError<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Check if it's a transient write conflict that can be retried
      const isTransient =
        error?.message?.includes('Write conflict') ||
        error?.errorLabels?.includes('TransientTransactionError')

      if (!isTransient || attempt === maxRetries) {
        throw error // Not retryable or max retries reached
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = 100 * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Updates client account balance after order creation or update
 * Recalculates balance from PENDING orders (what client owes)
 */
export const updateClientBalance: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  const { payload, context } = req

  // Prevent infinite loops
  if (context?.skipBalanceUpdate) return doc

  // Extract client account ID
  const clientId = typeof doc.clientAccount === 'string'
    ? doc.clientAccount
    : doc.clientAccount?.id

  if (!clientId) {
    payload.logger.warn('[Balance] No client account ID found on order')
    return doc
  }

  try {
    // First, verify the client account exists
    const clientExists = await payload.findByID({
      collection: 'client-accounts',
      id: clientId,
    })

    if (!clientExists) {
      payload.logger.error(`[Balance] Client account not found: ${clientId}`)
      return doc
    }

    // Fetch PENDING orders for balance calculation (what client owes)
    const pendingOrders = await payload.find({
      collection: 'orders',
      where: {
        clientAccount: { equals: clientId },
        status: { equals: 'pending' },
      },
      limit: 1000,
      req, // Maintain transaction atomicity
    })

    // Calculate total balance from PENDING orders (outstanding balance)
    const accountBalance = pendingOrders.docs.reduce(
      (sum, order) => sum + (order.amount || 0),
      0
    )

    // Fetch ALL orders for totalOrders count (lifetime order count)
    const allOrders = await payload.find({
      collection: 'orders',
      where: {
        clientAccount: { equals: clientId },
      },
      limit: 1000,
      req, // Maintain transaction atomicity
    })

    const totalOrders = allOrders.totalDocs

    // Update client account with retry logic for write conflicts
    try {
      await retryOnTransientError(async () => {
        await payload.update({
          collection: 'client-accounts',
          id: clientId,
          data: {
            accountBalance,
            totalOrders,
          },
          req, // Maintain transaction atomicity
          context: { skipBalanceUpdate: true }, // Prevent infinite loop
        })
      })

      payload.logger.info(
        `[Balance] Updated client ${clientId}: balance=$${accountBalance.toFixed(2)}, orders=${totalOrders}`
      )
    } catch (updateError) {
      payload.logger.error(`[Balance] Failed to update client account ${clientId}: ${updateError}`)
      // Don't fail the order creation if balance update fails
    }

    // Update order with balance snapshot (only on creation)
    // Skip this during the create operation - we'll set it via beforeChange instead
    if (!doc.balanceSnapshot && operation === 'update') {
      try {
        await retryOnTransientError(async () => {
          await payload.update({
            collection: 'orders',
            id: doc.id,
            data: { balanceSnapshot: accountBalance },
            req, // Maintain transaction atomicity
            context: { skipBalanceUpdate: true },
          })
        })
      } catch (snapshotError) {
        payload.logger.warn(`[Balance] Could not update balance snapshot: ${snapshotError}`)
        // Don't fail if snapshot update fails
      }
    }
  } catch (error) {
    payload.logger.error(`[Balance] Error in balance calculation: ${error}`)
  }

  return doc
}

/**
 * Reverts client balance when order is deleted
 * Recalculates balance from remaining PENDING orders
 */
export const revertClientBalance: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const { payload } = req
  // Extract client account ID
  const clientId = typeof doc.clientAccount === 'string'
    ? doc.clientAccount
    : doc.clientAccount?.id

  if (!clientId) return

  try {
    // First, verify the client account exists
    const clientExists = await payload.findByID({
      collection: 'client-accounts',
      id: clientId,
    })

    if (!clientExists) {
      payload.logger.error(`[Balance Revert] Client account not found: ${clientId}`)
      return
    }

    // Recalculate balance from remaining PENDING orders
    const pendingOrders = await payload.find({
      collection: 'orders',
      where: {
        clientAccount: { equals: clientId },
        status: { equals: 'pending' },
      },
      limit: 1000,
      req, // Maintain transaction atomicity
    })

    const accountBalance = pendingOrders.docs.reduce(
      (sum, order) => sum + (order.amount || 0),
      0
    )

    // Fetch ALL orders for totalOrders count
    const allOrders = await payload.find({
      collection: 'orders',
      where: {
        clientAccount: { equals: clientId },
      },
      limit: 1000,
      req, // Maintain transaction atomicity
    })

    // Update client account with retry logic for write conflicts
    try {
      await retryOnTransientError(async () => {
        await payload.update({
          collection: 'client-accounts',
          id: clientId,
          data: {
            accountBalance,
            totalOrders: allOrders.totalDocs,
          },
          req, // Maintain transaction atomicity
          context: { skipBalanceUpdate: true },
        })
      })

      payload.logger.info(
        `[Balance Revert] Updated client ${clientId}: balance=$${accountBalance.toFixed(2)}`
      )
    } catch (updateError) {
      payload.logger.error(`[Balance Revert] Failed to update client account ${clientId}: ${updateError}`)
    }
  } catch (error) {
    payload.logger.error(`[Balance Revert] Error: ${error}`)
  }
}
