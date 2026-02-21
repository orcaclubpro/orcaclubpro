import type { CollectionAfterDeleteHook } from 'payload'

/**
 * When a ClientAccount is deleted, null out the clientAccount relationship
 * on any User that was pointing to it. Without this the User retains an
 * orphaned reference which causes syncUserToClientAccount to error on every
 * subsequent save of that user.
 */
export const clearClientAccountOnDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const { payload } = req

  try {
    const { docs: linkedUsers } = await payload.find({
      collection: 'users',
      where: { clientAccount: { equals: doc.id } },
      limit: 100,
      depth: 0,
      req,
    })

    if (linkedUsers.length === 0) return doc

    await Promise.all(
      linkedUsers.map((user) =>
        payload.update({
          collection: 'users',
          id: user.id,
          data: { clientAccount: null },
          context: { skipClientAccountSync: true, skipNameValidation: true },
          req,
        })
      )
    )

    payload.logger.info(
      `[clearClientAccountOnDelete] Cleared clientAccount reference on ${linkedUsers.length} user(s) after deleting account ${doc.id}`
    )
  } catch (error) {
    payload.logger.error(
      `[clearClientAccountOnDelete] Failed to clear clientAccount on linked users: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return doc
}
