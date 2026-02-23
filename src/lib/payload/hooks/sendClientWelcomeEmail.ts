/**
 * PayloadCMS Hook: Send Client Welcome Email After Account Creation
 *
 * Fires on Users afterChange (create only) when role === 'client'.
 * Generates a password-setup link via Payload's forgotPassword mechanism
 * so the new client can choose their own password on first login.
 *
 * Non-blocking — runs inside setImmediate so the create operation
 * completes immediately and is never blocked by email delivery.
 */

import type { CollectionAfterChangeHook } from 'payload'
import { clientWelcome } from '@/lib/email/templates'

export const sendClientWelcomeEmailHook: CollectionAfterChangeHook = async ({
  doc,
  req: { payload },
  operation,
  context,
}) => {
  if (operation !== 'create') return doc
  if (doc.role !== 'client') return doc
  if (context?.skipClientWelcomeEmail) return doc

  // Capture the payload instance before setImmediate so it's available
  // after the request context may have been torn down.
  const payloadInstance = payload

  setImmediate(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'

      // Generate a password-setup token using Payload's built-in forgotPassword.
      // disableEmail: true means Payload stores + returns the token but sends nothing.
      let setupUrl = `${baseUrl}/login`
      try {
        const token = await payloadInstance.forgotPassword({
          collection: 'users',
          data: { email: doc.email },
          disableEmail: true,
        })
        if (token) {
          setupUrl = `${baseUrl}/setup-account?token=${token}`
        }
      } catch (tokenError) {
        payloadInstance.logger.warn(
          `[Client Welcome] Could not generate setup token for ${doc.email}: ${tokenError}`
        )
        // Fall back to the plain login URL — email is still sent
      }

      const displayName =
        doc.firstName && doc.lastName
          ? `${doc.firstName} ${doc.lastName}`
          : doc.firstName || 'there'

      const { subject, html, text } = clientWelcome({ name: displayName, setupUrl })

      await payloadInstance.sendEmail({
        to: doc.email,
        from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
        subject,
        html,
        text,
      })

      payloadInstance.logger.info(`[Client Welcome] Welcome email sent to ${doc.email}`)
    } catch (error) {
      payloadInstance.logger.error(
        `[Client Welcome] Failed to send welcome email to ${doc.email}:`,
        error
      )
    }
  })

  return doc
}
