/**
 * API Route: Request Login 2FA Code
 * POST /api/auth/request-login-code
 *
 * Generates login verification code and sends minimal branded email
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { generateLoginCode, getLoginCodeExpiry, sendLoginCodeEmail } from '@/lib/payload/utils/loginTwoFactor'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
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

    // Attempt to authenticate with email and password
    try {
      const loginResult = await payload.login({
        collection: 'users',
        data: {
          email: email.toLowerCase(),
          password,
        },
      })

      // If login successful, user credentials are valid
      const user = loginResult.user

      // Check if account is verified (for new account 2FA)
      if (!user.twoFactorVerified) {
        return NextResponse.json(
          {
            success: false,
            message: 'Please verify your account first using the code sent to your email during registration.',
          },
          { status: 403 }
        )
      }

      // Generate login code and expiry
      const loginCode = generateLoginCode()
      const loginExpiry = getLoginCodeExpiry()

      // Update user with login code
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          loginTwoFactorCode: loginCode,
          loginTwoFactorExpiry: loginExpiry.toISOString(),
        },
      })

      // Send login code email - construct name from firstName/lastName for client users
      const displayName = user.role === 'client' && user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.name || 'User'
      await sendLoginCodeEmail(payload, user.email, displayName, loginCode)

      payload.logger.info(`[Login 2FA] Login code generated for ${user.email}`)

      return NextResponse.json(
        {
          success: true,
          message: 'Login code sent to your email. Please check your inbox.',
          email: user.email, // Return email for verification step
        },
        { status: 200 }
      )
    } catch (authError: any) {
      // Invalid credentials
      payload.logger.info(`[Login 2FA] Failed login attempt for ${email}`)
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('[Login 2FA API] Error processing login request:', error)
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
