/**
 * API Route: Verify Login 2FA Code
 * POST /api/auth/verify-login-code
 *
 * Verifies login code and creates authenticated session.
 * This endpoint requires both the email, code, AND the original password
 * to complete the authentication flow.
 *
 * Flow:
 * 1. Verify the 2FA code matches and is not expired
 * 2. Use Local API to authenticate with password + bypass flag
 * 3. Return session token and set HTTP-only cookie
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { verifyLoginCode } from '@/lib/payload/utils/loginTwoFactor'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { email, code, password } = body

    // Validate input
    if (!email || !code || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and verification code are required' },
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

    // Verify the login code
    const result = await verifyLoginCode(payload, email, code)

    if (!result.success || !result.userId) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    // Code verified - authenticate user and create session
    try {
      const user = await payload.findByID({
        collection: 'users',
        id: result.userId,
      })

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      }

      // Create authenticated session with bypass flag
      // The bypassLoginTwoFactor flag allows the beforeLogin hook to permit this login
      const loginResult = await payload.login({
        collection: 'users',
        data: {
          email: user.email,
          password: password,
        },
        context: {
          bypassLoginTwoFactor: true, // Set bypass flag for beforeLogin hook
        },
      })

      payload.logger.info(`[Login 2FA] User ${email} successfully authenticated with 2FA`)

      // Ensure we have a valid token
      if (!loginResult.token) {
        return NextResponse.json(
          { success: false, message: 'Failed to generate authentication token' },
          { status: 500 }
        )
      }

      // Set HTTP-only cookie with the auth token
      const response = NextResponse.json(
        {
          success: true,
          message: 'Login successful!',
          user: {
            id: loginResult.user.id,
            email: loginResult.user.email,
            name: loginResult.user.name,
            role: loginResult.user.role,
          },
          token: loginResult.token,
          exp: loginResult.exp,
        },
        { status: 200 }
      )

      // Set the authentication cookie (matches PayloadCMS's default cookie name)
      response.cookies.set({
        name: 'payload-token',
        value: loginResult.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })

      return response
    } catch (error) {
      payload.logger.error(`[Login 2FA] Error authenticating user ${email}:`, error)
      return NextResponse.json(
        { success: false, message: 'Error authenticating user' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Login 2FA API] Error verifying code:', error)
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
