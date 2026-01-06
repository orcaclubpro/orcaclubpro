/**
 * API Route: Resend 2FA Code
 * POST /api/resend-2fa
 *
 * Generates a new 2FA code and resends it to the user's email
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { generateTwoFactorCode, getTwoFactorExpiry, sendTwoFactorEmail } from '@/lib/payload/utils/twoFactor'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { userId } = body

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.twoFactorVerified) {
      return NextResponse.json(
        { success: false, message: 'Account is already verified' },
        { status: 400 }
      )
    }

    // Generate new code and expiry
    const code = generateTwoFactorCode()
    const expiry = getTwoFactorExpiry()

    // Update user with new code
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        twoFactorCode: code,
        twoFactorExpiry: expiry.toISOString(),
      },
      context: {
        skipTwoFactorEmail: true, // Prevent hook from triggering
      },
    })

    // Send new verification email
    await sendTwoFactorEmail(payload, user.email, user.name, code)

    payload.logger.info(`[2FA API] Resent verification code to ${user.email}`)

    return NextResponse.json(
      { success: true, message: 'Verification code has been resent to your email' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[2FA API] Error resending code:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while resending the code' },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
