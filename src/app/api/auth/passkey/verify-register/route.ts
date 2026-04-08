import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { getChallenge, clearChallengeCookie } from '@/lib/payload/utils/passkeyChallenge'
import { getRpConfig } from '@/lib/payload/utils/passkeyRpConfig'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const expectedChallenge = getChallenge(request)
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'No challenge found. Please restart registration.' }, { status: 400 })
    }

    const body = await request.json()
    const { credential, deviceName } = body

    const { rpID, origin } = getRpConfig()

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      const response = NextResponse.json({ error: 'Verification failed' }, { status: 400 })
      clearChallengeCookie(response)
      return response
    }

    const { credential: cred, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    // Append new credential to user's passkeyCredentials array
    const existingCredentials = ((user as any).passkeyCredentials ?? []) as any[]
    const newCredential = {
      credentialID: cred.id,
      publicKey: Buffer.from(cred.publicKey).toString('base64url'),
      counter: cred.counter,
      deviceName: deviceName || 'Passkey',
      transports: credential.response?.transports ?? null,
      credentialDeviceType,
      credentialBackedUp,
      registeredAt: new Date().toISOString(),
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        passkeyCredentials: [...existingCredentials, newCredential],
      } as any,
      context: { skipNameValidation: true },
    })

    payload.logger.info(`[Passkey] Credential registered for user ${user.email}`)

    const response = NextResponse.json({
      success: true,
      credentialId: cred.id,
    })
    clearChallengeCookie(response)
    return response
  } catch (err) {
    console.error('[Passkey] verify-register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
