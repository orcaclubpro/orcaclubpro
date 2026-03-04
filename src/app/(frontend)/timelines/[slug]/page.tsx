import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import TimelineRenderer from '@/components/sections/TimelineRenderer'
import type { Timeline } from '@/types/payload-types'

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
  })
  const timeline = docs[0]
  if (!timeline) return {}
  const fullTitle = [timeline.title, timeline.titleEmphasis].filter(Boolean).join(' ')
  return { title: `${fullTitle} — ORCACLUB` }
}

export default async function TimelinePage({
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
  })
  const timeline = docs[0]
  if (!timeline) notFound()

  return <TimelineRenderer timeline={timeline as Timeline} />
}
