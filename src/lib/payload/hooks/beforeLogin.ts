/**
 * beforeLogin Hook - Simple role-based authentication
 *
 * This hook runs AFTER credentials are validated but BEFORE a token is generated.
 *
 * Flow:
 * - Client users: Direct login allowed (no 2FA)
 * - Admin/User roles: Direct login allowed (2FA disabled for all users)
 *
 * Note: 2FA system is disabled. All authenticated users can login directly.
 */

import type { CollectionBeforeLoginHook } from 'payload'

export const beforeLoginHook: CollectionBeforeLoginHook = async ({ user, req }) => {
  const payload = req.payload

  // Allow all authenticated users to login
  // 2FA is disabled for all roles
  payload.logger.info(`[Login] User ${user.email} (${user.role}) authenticated successfully`)

  return user
}
