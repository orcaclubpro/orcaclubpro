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

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { token, password } = body

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
    const username = (user.username as string | undefined) ?? null

    payload.logger.info(`[Password Reset] Password successfully reset for ${user.email as string}`)

    const response = NextResponse.json(
      { success: true, message: 'Password has been reset successfully.', username },
      { status: 200 }
    )

    // resetPassword already returns a fresh JWT — use it to log the user in
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
