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

    // Only include email when it has actually changed — passing the same email
    // through Payload's auth validation triggers uniqueness checks that can fail
    // even when the value is identical. Also guard against null/undefined.
    let emailChanged = Boolean(doc.email && doc.email !== user.email)

    // Before attempting an email update, check whether another user already owns
    // this address. If they do and they're a client, re-link them to THIS
    // ClientAccount (the admin is effectively pointing this account at an existing
    // user by setting a matching email). If they're admin/staff, skip with a warning.
    if (emailChanged) {
      const { docs: conflictUsers } = await payload.find({
        collection: 'users',
        where: {
          and: [
            { email: { equals: doc.email } },
            { id: { not_equals: user.id } },
          ],
        },
        limit: 1,
        req,
        overrideAccess: true,
      })

      if (conflictUsers.length > 0) {
        const conflictUser = conflictUsers[0]

        if (conflictUser.role === 'client') {
          // Re-link the existing email owner to this ClientAccount and sync their profile
          req.payload.logger.info(
            `[syncClientAccountToUser] Email "${doc.email}" already owned by client user ${conflictUser.id} — re-linking to ClientAccount ${doc.id}`
          )
          await payload.update({
            collection: 'users',
            id: conflictUser.id,
            data: {
              clientAccount: doc.id,
              firstName: doc.firstName,
              lastName: doc.lastName,
              ...(doc.company !== undefined ? { company: doc.company } : {}),
            },
            context: { skipClientAccountSync: true },
            req,
            overrideAccess: true,
          })
        } else {
          req.payload.logger.warn(
            `[syncClientAccountToUser] Cannot sync email "${doc.email}" to user ${user.id} — already in use by a non-client account (${conflictUser.role}). Skipping email field.`
          )
        }

        // Either way, don't attempt to update the originally linked user's email
        emailChanged = false
      }
    }

    // Update the originally linked user's profile (name/company, and email if safe)
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        firstName: doc.firstName,
        lastName: doc.lastName,
        ...(doc.company !== undefined ? { company: doc.company } : {}),
        ...(emailChanged ? { email: doc.email } : {}),
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
