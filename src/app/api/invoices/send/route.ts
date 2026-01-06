/**
 * Invoice Send API Endpoint
 * POST /api/invoices/send - Send invoice email for an existing order
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendGenericInvoiceEmail } from '@/lib/payload/utils/genericInvoiceEmailTemplate'
import { headers } from 'next/headers'

/**
 * POST /api/invoices/send
 * Send invoice email to customer for an existing order
 *
 * Request Body:
 * {
 *   orderId: string
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   invoice?: {
 *     sentAt: string
 *     sentTo: string
 *     sentBy: string
 *     status: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get authenticated user from payload-token cookie
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie')

    // Extract payload-token from cookies
    const payloadToken = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('payload-token='))
      ?.split('=')[1]

    if (!payloadToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user is authenticated
    let user
    try {
      const result = await payload.auth({ headers: headersList })
      user = result.user
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { orderId } = body

    // Validation
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      )
    }

    // Send invoice email (utility function handles everything)
    const result = await sendGenericInvoiceEmail(payload, orderId, user.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        invoice: result.invoice,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Invoice API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
