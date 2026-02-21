/**
 * API Route: Request Password Reset
 * POST /api/auth/forgot-password
 *
 * Uses payload.forgotPassword() to generate and store the token correctly
 * (Payload hashes tokens internally — manual crypto + payload.find() doesn't work).
 * We pass disableEmail: true and send our own branded email.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/payload/utils/passwordReset'

// Always return this regardless of whether the email exists (prevents enumeration)
const SUCCESS = {
  success: true,
  message: 'If an account exists with this email, you will receive password reset instructions.',
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    const normalised = email.toLowerCase().trim()

    // Use Payload's built-in forgotPassword — it hashes the token and stores it
    // correctly against Payload's internal auth fields.
    // disableEmail: true means we handle the send ourselves.
    let token: string
    try {
      token = await payload.forgotPassword({
        collection: 'users',
        data: { email: normalised },
        disableEmail: true,
      })
    } catch {
      // User not found — return success silently for security
      payload.logger.info(`[Password Reset] No account found for: ${normalised}`)
      return NextResponse.json(SUCCESS, { status: 200 })
    }

    if (!token) {
      return NextResponse.json(SUCCESS, { status: 200 })
    }

    // Fetch user for display name
    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: normalised } },
      limit: 1,
      depth: 0,
    })

    if (docs.length === 0) {
      return NextResponse.json(SUCCESS, { status: 200 })
    }

    const user = docs[0]
    const displayName =
      user.role === 'client' && user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.name || 'there'

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await sendPasswordResetEmail(payload, user.email, displayName, resetUrl)
    payload.logger.info(`[Password Reset] Reset email sent to ${user.email}`)

    return NextResponse.json(SUCCESS, { status: 200 })
  } catch (error) {
    console.error('[Password Reset API] Error processing reset request:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
