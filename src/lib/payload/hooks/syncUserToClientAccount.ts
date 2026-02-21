import type { CollectionAfterChangeHook } from 'payload'

/**
 * Syncs User changes to their linked ClientAccount
 * Only runs for users with role='client' who have a clientAccount relationship
 */
export const syncUserToClientAccount: CollectionAfterChangeHook = async ({
  doc,
  req,
  context,
}) => {
  // Prevent infinite loops
  if (context.skipClientAccountSync) return doc

  // Only sync for client users with a linked account
  if (doc.role !== 'client' || !doc.clientAccount) return doc

  const { payload } = req

  try {
    const clientAccountId =
      typeof doc.clientAccount === 'string' ? doc.clientAccount : doc.clientAccount?.id

    if (!clientAccountId) return doc

    // Verify the ClientAccount exists before attempting a sync.
    // If the linked document was deleted the user will have an orphaned reference —
    // log a warning and skip rather than throwing a Not Found error.
    const existing = await payload.find({
      collection: 'client-accounts',
      where: { id: { equals: clientAccountId } },
      limit: 1,
      depth: 0,
      req,
    })

    if (existing.totalDocs === 0) {
      req.payload.logger.warn(
        `syncUserToClientAccount: ClientAccount ${clientAccountId} not found for user ${doc.id} — orphaned reference, skipping sync`
      )
      return doc
    }

    // Update the ClientAccount with user data
    await payload.update({
      collection: 'client-accounts',
      id: clientAccountId,
      data: {
        firstName: doc.firstName,
        lastName: doc.lastName,
        company: doc.company,
        email: doc.email,
      },
      context: { skipUserSync: true }, // Prevent reverse sync loop
      req,
      overrideAccess: true, // Admin-level sync operation
    })

    req.payload.logger.info(
      `Synced user ${doc.id} to client account ${clientAccountId}`
    )
  } catch (error) {
    req.payload.logger.error(
      `Failed to sync user ${doc.id} to client account: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    // Don't fail the main operation
  }

  return doc
}
