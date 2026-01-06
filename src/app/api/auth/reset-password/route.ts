/**
 * API Route: Confirm Password Reset
 * POST /api/auth/reset-password
 *
 * Validates reset token and updates user password
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

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Reset token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      )
    }

    // Find user by reset token
    const users = await payload.find({
      collection: 'users',
      where: {
        resetPasswordToken: {
          equals: token,
        },
      },
      limit: 1,
    })

    if (!users.docs || users.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    const user = users.docs[0]

    // Check if token has expired
    if (user.resetPasswordExpiration && new Date(user.resetPasswordExpiration) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      )
    }

    // Update user password and clear reset token
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password: password,
        resetPasswordToken: null,
        resetPasswordExpiration: null,
      },
    })

    payload.logger.info(`[Password Reset] Password successfully reset for ${user.email}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Password Reset API] Error resetting password:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting your password' },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
