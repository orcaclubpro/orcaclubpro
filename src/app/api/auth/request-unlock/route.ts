/**
 * API Route: Request Account Unlock
 * POST /api/auth/request-unlock
 *
 * Generates a signed HMAC token and emails an unlock link to the user.
 * Always returns a generic success response to prevent email enumeration.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { generateUnlockToken, sendUnlockAccountEmail } from '@/lib/payload/utils/unlockAccount'

const SUCCESS = {
  success: true,
  message: 'If an account exists with this email, you will receive an unlock link.',
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email address is required' }, { status: 400 })
    }

    const normalised = email.toLowerCase().trim()

    // Look up user — return generic success even if not found
    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: normalised } },
      limit: 1,
      depth: 0,
    })

    if (docs.length === 0) {
      payload.logger.info(`[Unlock Account] No account found for: ${normalised}`)
      return NextResponse.json(SUCCESS, { status: 200 })
    }

    const user = docs[0]

    const displayName =
      user.role === 'client' && user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.name || 'there'

    const token = generateUnlockToken(normalised)
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'
    const unlockUrl = `${baseUrl}/api/auth/unlock-account?token=${token}`

    await sendUnlockAccountEmail(payload, normalised, displayName, unlockUrl)

    return NextResponse.json(SUCCESS, { status: 200 })
  } catch (error) {
    console.error('[Unlock Account API] Error:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
