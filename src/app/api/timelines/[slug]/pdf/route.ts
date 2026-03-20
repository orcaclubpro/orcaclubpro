import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Timeline } from '@/types/payload-types'
import { generateTimelinePDF } from '@/lib/generate-timeline-pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'timelines',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const timeline = docs[0] as Timeline | undefined
  if (!timeline) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const pdf = await generateTimelinePDF(timeline)
    const filename = `timeline-${slug}.pdf`

    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdf.length),
      },
    })
  } catch (err) {
    console.error('[timeline-pdf] generation failed:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
