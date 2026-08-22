import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { buildProposalPdfFor } from '@/actions/retainers'

/**
 * The retainer proposal PDF — the priced offer staff preview before sending it.
 * Same document the client receives as an email attachment (both go through
 * buildProposalPdfFor, so the preview can never differ from what was sent).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload({ config })

    // ── Auth: staff only ────────────────────────────────────────────────────────
    const { user } = await payload.auth({ headers: await headers() })
    if (!user || user.role === 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const built = await buildProposalPdfFor(id)
    if (!built.success) {
      return NextResponse.json({ error: built.error }, { status: 404 })
    }

    return new NextResponse(Buffer.from(built.bytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="retainer-proposal.pdf"',
        'Content-Length': String(built.bytes.length),
      },
    })
  } catch (err) {
    console.error('[retainer proposal pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
