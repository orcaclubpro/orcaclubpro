import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import type { Timeline } from '@/types/payload-types'
import TimelineRenderer from '@/components/sections/TimelineRenderer'
import TimelineAccessGate from '@/components/sections/timelines/TimelineAccessGate'
import { cookieName, computeHash } from '@/lib/timeline-access'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'timelines',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  const timeline = docs[0]
  if (!timeline) return {}
  const fullTitle = [timeline.title, timeline.titleEmphasis].filter(Boolean).join(' ')
  return { title: `${fullTitle} — ORCACLUB` }
}

export default async function OrcaProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'timelines',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })

  const timeline = docs[0]
  if (!timeline) return notFound()

  const code = timeline.accessCode as string | null | undefined

  if (code) {
    const jar = await cookies()
    const stored = jar.get(cookieName(slug))?.value
    const expected = await computeHash(code, slug)

    if (stored !== expected) {
      return (
        <TimelineAccessGate
          slug={slug}
          eyebrow={timeline.eyebrow}
          title={timeline.title}
        />
      )
    }
  }

  const { accessCode: _omit, ...safeTimeline } = timeline as any
  return <TimelineRenderer timeline={safeTimeline as Timeline} />
}
