import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

// GET /api/auth/passkey/credentials — list current user's passkeys
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const credentials = ((user as any).passkeyCredentials ?? []) as any[]
    return NextResponse.json({
      credentials: credentials.map((c: any, index: number) => ({
        id: c.id ?? String(index), // Payload assigns IDs to array items
        credentialID: c.credentialID,
        deviceName: c.deviceName || 'Passkey',
        registeredAt: c.registeredAt,
        credentialDeviceType: c.credentialDeviceType,
        credentialBackedUp: c.credentialBackedUp,
      })),
    })
  } catch (err) {
    console.error('[Passkey] GET credentials error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/auth/passkey/credentials?credentialID=xxx — remove a passkey
export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const credentialID = request.nextUrl.searchParams.get('credentialID')
    if (!credentialID) {
      return NextResponse.json({ error: 'credentialID query param required' }, { status: 400 })
    }

    const existing = ((user as any).passkeyCredentials ?? []) as any[]
    const updated = existing.filter((c: any) => c.credentialID !== credentialID)

    if (updated.length === existing.length) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: { passkeyCredentials: updated } as any,
      context: { skipNameValidation: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Passkey] DELETE credential error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
