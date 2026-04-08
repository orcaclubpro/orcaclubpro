import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { setChallengeCookie } from '@/lib/payload/utils/passkeyChallenge'
import { getRpConfig } from '@/lib/payload/utils/passkeyRpConfig'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { rpID } = getRpConfig()

    // Optional: if email provided, include only that user's credentials as allowCredentials
    // This is optional — omitting allowCredentials enables discoverable credential flow
    let allowCredentials: any[] | undefined = undefined
    try {
      const body = await request.json()
      if (body.email) {
        const users = await payload.find({
          collection: 'users',
          where: { email: { equals: body.email.toLowerCase() } },
          limit: 1,
        })
        const user = users.docs[0]
        if (user) {
          const creds = ((user as any).passkeyCredentials ?? []) as any[]
          if (creds.length > 0) {
            allowCredentials = creds.map((c: any) => ({
              id: c.credentialID,
              transports: c.transports ?? undefined,
            }))
          }
        }
      }
    } catch {
      // No body or no email — use discoverable credentials
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials,
    })

    const response = NextResponse.json({ options })
    setChallengeCookie(response, options.challenge)
    return response
  } catch (err) {
    console.error('[Passkey] authenticate-options error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
