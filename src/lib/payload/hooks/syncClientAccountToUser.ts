import type { CollectionAfterChangeHook } from 'payload'

/**
 * Syncs ClientAccount changes to their linked User
 * Finds the user with clientAccount relationship pointing to this ClientAccount
 */
export const syncClientAccountToUser: CollectionAfterChangeHook = async ({
  doc,
  req,
  context,
}) => {
  // Prevent infinite loops
  if (context.skipUserSync) return doc

  const { payload } = req

  try {
    // Find the user linked to this client account
    const { docs: users } = await payload.find({
      collection: 'users',
      where: {
        and: [
          { role: { equals: 'client' } },
          { clientAccount: { equals: doc.id } },
        ],
      },
      limit: 1,
      req,
      overrideAccess: true, // Admin-level sync operation
    })

    // Only sync if a linked client user exists
    if (users.length === 0) return doc

    const user = users[0]

    // Update the User with client account data
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        firstName: doc.firstName,
        lastName: doc.lastName,
        company: doc.company,
        email: doc.email,
      },
      context: { skipClientAccountSync: true }, // Prevent reverse sync loop
      req,
      overrideAccess: true, // Admin-level sync operation
    })

    req.payload.logger.info(
      `Synced client account ${doc.id} to user ${user.id}`
    )
  } catch (error) {
    req.payload.logger.error(
      `Failed to sync client account ${doc.id} to user: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    // Don't fail the main operation
  }

  return doc
}
