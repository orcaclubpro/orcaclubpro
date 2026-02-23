/**
 * API Route: Confirm Password Reset
 * POST /api/auth/reset-password
 *
 * Uses payload.resetPassword() which validates the token against Payload's
 * internal hashed storage (manual payload.find() on resetPasswordToken doesn't work).
 * resetPassword() also returns a JWT, so no separate login call is needed.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { validatePassword } from '@/lib/payload/utils/passwordReset'
import {
  accountSetupNotification,
  accountSetupConfirmation,
  passwordResetAdminNotification,
  passwordResetConfirmation,
} from '@/lib/email/templates'

const ADMIN_EMAIL = 'chance@orcaclub.pro'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { token, password, source } = body
    const isSetup = source === 'setup'

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Reset token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength before hitting the DB
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      )
    }

    // Use Payload's built-in resetPassword — validates the hashed token and
    // resets the password atomically. Returns { token: JWT, user }.
    let result: { token?: string; user: Record<string, unknown> }
    try {
      result = await payload.resetPassword({
        collection: 'users',
        data: { token, password },
        overrideAccess: true,
      })
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.',
        },
        { status: 400 }
      )
    }

    const user = result.user
    let username = (user.username as string | undefined) ?? null

    // Always fetch the full user record — resetPassword() may return a partial
    // object and we need role/name/email for notification emails.
    let fullUser: Record<string, unknown> | null = null
    if (user.id) {
      try {
        fullUser = await payload.findByID({
          collection: 'users',
          id: user.id as string,
          depth: 0,
          overrideAccess: true,
        }) as unknown as Record<string, unknown>
        username = (fullUser.username as string | undefined) ?? username
      } catch {
        // Non-fatal — fall back to /login redirect on the client
      }
    }

    payload.logger.info(`[Password Reset] Password successfully reset for ${user.email as string}`)

    const response = NextResponse.json(
      { success: true, message: 'Password has been reset successfully.', username },
      { status: 200 }
    )

    // resetPassword already returns a fresh JWT — set it as a session cookie
    // so the user is immediately authenticated on the next navigation.
    if (result.token) {
      response.cookies.set({
        name: 'payload-token',
        value: result.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    // Fire-and-forget notification emails — only for client users.
    // isSetup = came from /setup-account (first-time password set)
    // !isSetup = came from /reset-password (subsequent reset)
    const isClient = (fullUser?.role ?? user.role) === 'client'
    if (isClient && fullUser) {
      const clientEmail = (fullUser.email as string) || (user.email as string)
      const firstName = (fullUser.firstName as string | undefined) ?? ''
      const lastName = (fullUser.lastName as string | undefined) ?? ''
      const clientName = [firstName, lastName].filter(Boolean).join(' ') || (fullUser.name as string | undefined) || clientEmail
      const company = (fullUser.company as string | undefined) || undefined
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'
      const timestamp = new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        dateStyle: 'medium',
        timeStyle: 'short',
      })

      void (async () => {
        try {
          if (isSetup) {
            // Admin: Account Setup Notification
            const adminEmail = accountSetupNotification({ clientName, clientEmail, company, timestamp: `${timestamp} PST` })
            await payload.sendEmail({
              to: ADMIN_EMAIL,
              from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
              subject: adminEmail.subject,
              html: adminEmail.html,
              text: adminEmail.text,
            })
            payload.logger.info(`[Account Setup] Admin notification sent for ${clientEmail}`)

            // Client: Account Setup Confirmation
            const dashboardUrl = username ? `${baseUrl}/u/${username}` : `${baseUrl}/login`
            const clientConf = accountSetupConfirmation({ name: firstName || 'there', dashboardUrl })
            await payload.sendEmail({
              to: clientEmail,
              from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
              subject: clientConf.subject,
              html: clientConf.html,
              text: clientConf.text,
            })
            payload.logger.info(`[Account Setup] Client confirmation sent to ${clientEmail}`)
          } else {
            // Admin: Password Reset Notification
            const adminEmail = passwordResetAdminNotification({ clientName, clientEmail, timestamp: `${timestamp} PST` })
            await payload.sendEmail({
              to: ADMIN_EMAIL,
              from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
              subject: adminEmail.subject,
              html: adminEmail.html,
              text: adminEmail.text,
            })
            payload.logger.info(`[Password Reset] Admin notification sent for ${clientEmail}`)

            // Client: Password Reset Confirmation
            const clientConf = passwordResetConfirmation({ name: firstName || 'there' })
            await payload.sendEmail({
              to: clientEmail,
              from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
              subject: clientConf.subject,
              html: clientConf.html,
              text: clientConf.text,
            })
            payload.logger.info(`[Password Reset] Client confirmation sent to ${clientEmail}`)
          }
        } catch (err) {
          payload.logger.error(`[reset-password] Notification email failed for ${clientEmail}: ${err}`)
        }
      })()
    }

    return response
  } catch (error) {
    console.error('[Password Reset API] Error resetting password:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting your password' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
