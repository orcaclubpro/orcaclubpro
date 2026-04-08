import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { setChallengeCookie } from '@/lib/payload/utils/passkeyChallenge'
import { getRpConfig } from '@/lib/payload/utils/passkeyRpConfig'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rpID, rpName } = getRpConfig()

    // Collect existing credential IDs to exclude (prevent re-registration of same device)
    const existingCredentials = ((user as any).passkeyCredentials ?? []) as any[]
    const excludeCredentials = existingCredentials.map((c: any) => ({
      id: c.credentialID,
      transports: c.transports ?? undefined,
    }))

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: (user as any).name || (user as any).firstName || user.email,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    })

    const response = NextResponse.json({ options })
    setChallengeCookie(response, options.challenge)
    return response
  } catch (err) {
    console.error('[Passkey] register-options error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
