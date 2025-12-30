/**
 * Shopify Draft Order Invoice Send API Route
 * POST /api/shopify/draft-orders/send-invoice - Send invoice email for a draft order
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendDraftOrderInvoice, SendDraftOrderInvoiceInput } from '@/lib/shopify/draft-orders'

/**
 * POST /api/shopify/draft-orders/send-invoice
 * Send invoice email for an existing draft order
 *
 * Request body:
 * {
 *   draftOrderId: string (Shopify draft order GID: "gid://shopify/DraftOrder/123")
 *   email?: {
 *     to?: string (override recipient email)
 *     from?: string (custom from email)
 *     subject?: string (custom email subject)
 *     customMessage?: string (custom message in email body)
 *     bcc?: string[] (BCC recipients)
 *   }
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   invoiceSentAt?: string (timestamp when invoice was sent)
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendDraftOrderInvoiceInput = await request.json()

    // Validate required fields
    if (!body.draftOrderId) {
      return NextResponse.json(
        { error: 'draftOrderId is required' },
        { status: 400 }
      )
    }

    // Validate draft order ID format (should be a Shopify GID)
    if (!body.draftOrderId.startsWith('gid://shopify/DraftOrder/')) {
      return NextResponse.json(
        { error: 'Invalid draftOrderId format. Expected format: gid://shopify/DraftOrder/123' },
        { status: 400 }
      )
    }

    // Send the invoice
    const result = await sendDraftOrderInvoice(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to send invoice',
          userErrors: result.userErrors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        invoiceSentAt: result.invoiceSentAt,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Draft order invoice send error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
