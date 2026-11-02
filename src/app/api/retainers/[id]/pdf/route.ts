import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { buildRetainerStatementPdfFor } from '@/lib/retainers/statementPdf'
import type { Retainer } from '@/types/payload-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload({ config })

    // ── Auth: staff only ────────────────────────────────────────────────────────
    const { user } = await payload.auth({ headers: await headers() })
    if (!user || user.role === 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Load the retainer, derive the client account id ──────────────────────────
    const { id } = await params
    const retainer = (await payload
      .findByID({ collection: 'retainers', id, depth: 0 })
      .catch(() => null)) as Retainer | null
    if (!retainer) {
      return NextResponse.json({ error: 'Retainer not found' }, { status: 404 })
    }

    const clientAccountId =
      typeof retainer.clientAccount === 'object' && retainer.clientAccount
        ? retainer.clientAccount.id
        : (retainer.clientAccount as string)
    if (!clientAccountId) {
      return NextResponse.json({ error: 'Retainer has no client account' }, { status: 404 })
    }

    // ── Build the PDF (shared with the MCP draft tool) ───────────────────────────
    const ref = new URL(request.url).searchParams.get('ref')
    const built = await buildRetainerStatementPdfFor(clientAccountId, ref ?? undefined)
    if (!built.success) {
      return NextResponse.json({ error: built.error }, { status: built.notFound ? 404 : 400 })
    }
    const pdfBytes = built.bytes

    return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="retainer-statement.pdf"',
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (err) {
    console.error('[retainer pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
