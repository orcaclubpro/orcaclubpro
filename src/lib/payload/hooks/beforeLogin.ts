/**
 * beforeLogin Hook - Enforce Login 2FA
 *
 * This hook runs AFTER credentials are validated but BEFORE a token is generated.
 * It enforces 2FA verification by requiring a special bypass flag in the request context.
 *
 * Flow:
 * 1. Regular /admin login attempts will be BLOCKED by this hook
 * 2. Custom 2FA login flow uses API endpoints with context flag to bypass this check
 * 3. This ensures ALL logins go through the 2FA verification process
 *
 * The hook checks for req.context.bypassLoginTwoFactor flag which is set by:
 * - Custom 2FA login API endpoints after successful code verification
 * - Internal Payload operations that need to bypass 2FA
 */

import type { CollectionBeforeLoginHook } from 'payload'

export const beforeLoginHook: CollectionBeforeLoginHook = async ({ user, req }) => {
  const payload = req.payload

  try {
    // Check if this login is coming from a verified 2FA flow
    if (req.context?.bypassLoginTwoFactor === true) {
      payload.logger.info(`[Login 2FA] User ${user.email} authenticated via 2FA flow`)
      return user
    }

    // Check if user has account-level 2FA verified
    if (!user.twoFactorVerified) {
      payload.logger.warn(`[Login 2FA] User ${user.email} attempted login without account verification`)
      throw new Error('Please verify your account first using the code sent during registration.')
    }

    // Check if this is the first/only user - allow direct login without login 2FA
    const userCount = await payload.count({
      collection: 'users',
    })

    if (userCount.totalDocs === 1) {
      payload.logger.info(`[Login 2FA] First user ${user.email} - allowing direct login without 2FA`)
      return user
    }

    // Block direct login attempts - require 2FA flow
    payload.logger.warn(`[Login 2FA] User ${user.email} attempted direct login without 2FA verification`)
    throw new Error(
      'Login verification required. Please use the login form which will send a verification code to your email.'
    )
  } catch (error) {
    // Re-throw errors to deny login
    payload.logger.error(`[Login 2FA] Error in beforeLogin hook for ${user.email}:`, error)
    throw error
  }
}
