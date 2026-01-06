/**
 * PayloadCMS Hook: Send 2FA Email After User Creation
 * Automatically sends a verification code when a new user account is created
 */

import type { CollectionAfterChangeHook } from 'payload'
import { generateTwoFactorCode, getTwoFactorExpiry, sendTwoFactorEmail } from '../utils/twoFactor'

/**
 * Hook to send 2FA code after a new user is created
 */
export const sendTwoFactorEmailHook: CollectionAfterChangeHook = async ({
  doc,
  req: { payload, context },
  operation,
}) => {
  // Only run on create operations (new user registration)
  if (operation !== 'create') {
    return doc
  }

  // Skip if this is a seed operation or migration
  if (context?.skipTwoFactorEmail) {
    payload.logger.info(`[2FA Hook] Skipping 2FA email for user ${doc.id} (context flag set)`)
    return doc
  }

  // Check if user already has 2FA verified (shouldn't happen on create, but safeguard)
  if (doc.twoFactorVerified) {
    payload.logger.info(`[2FA Hook] User ${doc.id} already verified, skipping email`)
    return doc
  }

  // Check if this is the first user - if so, skip 2FA email (they're already auto-verified by default)
  try {
    const userCount = await payload.count({
      collection: 'users',
    })

    if (userCount.totalDocs === 1) {
      payload.logger.info(`[2FA Hook] First user detected (${doc.email}) - skipping 2FA email (auto-verified)`)
      return doc
    }
  } catch (error) {
    payload.logger.error(`[2FA Hook] Error checking user count:`, error)
    // Continue with normal 2FA flow if count check fails
  }

  try {
    // Generate 2FA code and expiry
    const code = generateTwoFactorCode()
    const expiry = getTwoFactorExpiry()

    payload.logger.info(`[2FA Hook] Generated code for user ${doc.email}`)

    // Update user with 2FA code and expiry (use setImmediate to avoid blocking)
    setImmediate(async () => {
      try {
        await payload.update({
          collection: 'users',
          id: doc.id,
          data: {
            twoFactorCode: code,
            twoFactorExpiry: expiry.toISOString(),
            twoFactorVerified: false,
          },
          context: {
            skipTwoFactorEmail: true, // Prevent infinite loop
          },
        })

        // Send 2FA email
        await sendTwoFactorEmail(payload, doc.email, doc.name, code)

        payload.logger.info(`[2FA Hook] Successfully sent verification email to ${doc.email}`)
      } catch (error) {
        payload.logger.error(`[2FA Hook] Error processing 2FA for user ${doc.id}:`, error)
      }
    })

    return doc
  } catch (error) {
    payload.logger.error(`[2FA Hook] Critical error in sendTwoFactorEmailHook:`, error)
    // Don't throw - allow user creation to succeed even if email fails
    return doc
  }
}
