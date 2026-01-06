/**
 * API Route: Verify 2FA Code
 * POST /api/verify-2fa
 *
 * Verifies the 6-digit 2FA code sent to user's email
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { verifyTwoFactorCode } from '@/lib/payload/utils/twoFactor'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { userId, code } = body

    // Validate input
    if (!userId || !code) {
      return NextResponse.json(
        { success: false, message: 'User ID and verification code are required' },
        { status: 400 }
      )
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, message: 'Verification code must be 6 digits' },
        { status: 400 }
      )
    }

    // Verify the 2FA code
    const result = await verifyTwoFactorCode(payload, userId, code)

    if (result.success) {
      return NextResponse.json(
        { success: true, message: result.message },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[2FA API] Error verifying code:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while verifying your code' },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
