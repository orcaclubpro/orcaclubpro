/**
 * API Route: Request Password Reset
 * POST /api/auth/forgot-password
 *
 * Generates reset token and sends branded email with reset link
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { generateResetToken, getResetTokenExpiry, sendPasswordResetEmail } from '@/lib/payload/utils/passwordReset'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { email } = body

    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Find user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email.toLowerCase(),
        },
      },
      limit: 1,
    })

    // Security: Always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!users.docs || users.docs.length === 0) {
      payload.logger.info(`[Password Reset] Reset requested for non-existent email: ${email}`)
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, you will receive password reset instructions.',
        },
        { status: 200 }
      )
    }

    const user = users.docs[0]

    // Generate reset token and expiry
    const resetToken = generateResetToken()
    const resetExpiry = getResetTokenExpiry()

    // Update user with reset token
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiration: resetExpiry.toISOString(),
      },
    })

    // Construct reset URL
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    // Send password reset email
    await sendPasswordResetEmail(payload, user.email, user.name, resetUrl)

    payload.logger.info(`[Password Reset] Reset token generated for ${user.email}`)

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Password Reset API] Error processing reset request:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
