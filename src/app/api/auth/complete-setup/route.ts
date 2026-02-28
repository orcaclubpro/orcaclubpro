/**
 * API Route: Complete Account Setup (Step 2 — Business Details)
 * POST /api/auth/complete-setup
 *
 * Called after the client has set their password in /setup-account.
 * Saves optional company, phone, and address to their linked ClientAccount.
 * Requires an authenticated session (payload-token cookie set in step 1).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    // Authenticate directly from the incoming request headers — this correctly
    // picks up the payload-token cookie that was set by /api/auth/reset-password
    // in the same browser session. Using next/headers() here would lose context.
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'client') {
      return NextResponse.json(
        { success: false, message: 'Only clients can complete setup' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { company, phone, address } = body

    const clientAccountId = user.clientAccount
      ? typeof user.clientAccount === 'string'
        ? user.clientAccount
        : (user.clientAccount as { id: string }).id
      : null

    if (!clientAccountId) {
      return NextResponse.json(
        { success: false, message: 'No linked client account found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (company !== undefined && company !== '') updateData.company = company
    if (phone !== undefined && phone !== '') updateData.phone = phone
    if (address !== undefined) {
      const hasAnyField = Object.values(address).some((v) => v !== '' && v != null)
      if (hasAnyField) updateData.address = address
    }

    if (Object.keys(updateData).length > 0) {
      await payload.update({
        collection: 'client-accounts',
        id: clientAccountId,
        data: updateData,
        overrideAccess: true,
        context: { skipClientAccountSync: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[complete-setup]', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save business details' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
