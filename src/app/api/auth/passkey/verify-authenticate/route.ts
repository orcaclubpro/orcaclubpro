import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { randomUUID } from 'node:crypto'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { getChallenge, clearChallengeCookie } from '@/lib/payload/utils/passkeyChallenge'
import { getRpConfig } from '@/lib/payload/utils/passkeyRpConfig'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const expectedChallenge = getChallenge(request)
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'No challenge found. Please restart authentication.' }, { status: 400 })
    }

    const body = await request.json()
    const { credential } = body

    if (!credential?.id) {
      return NextResponse.json({ error: 'Invalid credential' }, { status: 400 })
    }

    // Find user by credentialID
    // credentialID has index:true on the schema for efficient querying
    const allUsers = await payload.find({
      collection: 'users',
      where: {
        'passkeyCredentials.credentialID': { equals: credential.id },
      },
      limit: 1,
      depth: 0,
    })

    const user = allUsers.docs[0]
    if (!user) {
      const response = NextResponse.json({ error: 'No passkey found for this credential' }, { status: 401 })
      clearChallengeCookie(response)
      return response
    }

    const storedCredentials = ((user as any).passkeyCredentials ?? []) as any[]
    const storedCred = storedCredentials.find((c: any) => c.credentialID === credential.id)

    if (!storedCred) {
      const response = NextResponse.json({ error: 'Credential not found' }, { status: 401 })
      clearChallengeCookie(response)
      return response
    }

    const { rpID, origin } = getRpConfig()

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: storedCred.credentialID,
        publicKey: Buffer.from(storedCred.publicKey, 'base64url'),
        counter: storedCred.counter,
        transports: storedCred.transports ?? undefined,
      },
    })

    if (!verification.verified) {
      const response = NextResponse.json({ error: 'Authentication verification failed' }, { status: 401 })
      clearChallengeCookie(response)
      return response
    }

    // A verified assertion alone isn't enough. `userVerification: 'required'` in
    // the options is a request, not a guarantee — confirm the authenticator
    // actually checked a biometric or PIN before handing out a session.
    if (!verification.authenticationInfo.userVerified) {
      const response = NextResponse.json(
        { error: 'Biometric or PIN verification is required to sign in with a passkey.' },
        { status: 401 },
      )
      clearChallengeCookie(response)
      return response
    }

    // Update counter to prevent replay attacks
    const newCounter = verification.authenticationInfo.newCounter
    const updatedCredentials = storedCredentials.map((c: any) =>
      c.credentialID === credential.id ? { ...c, counter: newCounter } : c
    )

    await payload.update({
      collection: 'users',
      id: user.id,
      data: { passkeyCredentials: updatedCredentials } as any,
      context: { skipNameValidation: true },
    })

    // Issue Payload session using payload's exported JWT utilities
    const { jwtSign, getFieldsToSign } = await import('payload')

    const collectionConfig = payload.collections['users'].config
    const tokenExpiration =
      collectionConfig.auth && typeof collectionConfig.auth === 'object'
        ? ((collectionConfig.auth as any).tokenExpiration ?? 7200)
        : 7200

    // Payload's JWT strategy rejects any token whose `sid` has no matching entry
    // in the user's `sessions` array, and `auth.useSessions` defaults to true —
    // so a correctly-signed token alone still resolves to `user: null`. Mirror
    // what payload's own login operation does: record a session, then sign its
    // id into the token. `sessions` has field-level `update: () => false`, so it
    // has to go through db.updateOne — payload.update would silently strip it.
    let sid: string | undefined

    if ((collectionConfig.auth as any)?.useSessions) {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + tokenExpiration * 1000)
      sid = randomUUID()

      const existingSessions = ((user as any).sessions ?? []) as Array<{
        id: string
        createdAt?: Date | string
        expiresAt: Date | string
      }>

      const sessions = [
        ...existingSessions.filter((sess) => new Date(sess.expiresAt) > now),
        { id: sid, createdAt: now, expiresAt },
      ]

      await payload.db.updateOne({
        id: user.id,
        collection: 'users',
        data: { sessions },
        returning: false,
      })
    }

    const fieldsToSign = getFieldsToSign({
      collectionConfig,
      email: user.email ?? '',
      sid,
      user: user as any,
    })

    const { token, exp } = await jwtSign({
      fieldsToSign,
      secret: payload.secret,
      tokenExpiration,
    })

    payload.logger.info(`[Passkey] User ${user.email} authenticated via passkey`)

    const responseData = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: (user as any).name,
        role: (user as any).role,
        username: (user as any).username,
        firstName: (user as any).firstName,
      },
      token,
      exp,
    })

    responseData.cookies.set({
      name: 'payload-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokenExpiration,
    })

    clearChallengeCookie(responseData)
    return responseData
  } catch (err) {
    console.error('[Passkey] verify-authenticate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
