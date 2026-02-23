/**
 * API Route: Unlock Account
 * GET /api/auth/unlock-account?token=TOKEN
 *
 * Verifies the HMAC-signed token, calls payload.unlock(), then redirects to /admin.
 * The email is embedded inside the signed token — no separate param needed.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { verifyUnlockToken } from '@/lib/payload/utils/unlockAccount'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'

  if (!token) {
    return NextResponse.redirect(new URL('/admin?unlock=invalid', baseUrl))
  }

  const email = verifyUnlockToken(token)

  if (!email) {
    // Token is invalid or expired
    return NextResponse.redirect(new URL('/admin?unlock=expired', baseUrl))
  }

  try {
    const payload = await getPayload({ config })

    // payload.unlock() requires a password in its type signature but doesn't
    // use it for the unlock operation. Clear the lock fields directly instead.
    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (docs[0]) {
      await payload.update({
        collection: 'users',
        id: String(docs[0].id),
        data: { loginAttempts: 0, lockUntil: null } as any,
        overrideAccess: true,
      })
    }

    payload.logger.info(`[Unlock Account] Account unlocked for ${email}`)

    return NextResponse.redirect(new URL('/admin?unlock=success', baseUrl))
  } catch (error) {
    console.error('[Unlock Account] Error unlocking account:', error)
    return NextResponse.redirect(new URL('/admin?unlock=error', baseUrl))
  }
}
