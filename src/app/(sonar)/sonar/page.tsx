import type { Metadata } from 'next'
import { articlesByChannel } from '@/components/sonar/articles'
import { ChannelCarousel, type CarouselChannel } from '@/components/sonar/channel-carousel'
import { CHANNELS } from '@/components/sonar/channels'

// THE DESK — SONAR's home hub, served at orcaclub.pro/sonar. Presented as a
// tabbed channel carousel so the four categories read as four distinct
// destinations. Static content in Phase 1; each panel derives from the shared
// CHANNELS/ARTICLES data.

export const metadata: Metadata = {
  title: 'SONAR — by ORCACLUB',
  description:
    'Signal from beneath the noise. A research desk that builds what it writes about.',
  alternates: { canonical: 'https://orcaclub.pro/sonar' },
}

export default function DeskPage() {
  const channels: CarouselChannel[] = CHANNELS.map((c) => {
    const articles = articlesByChannel(c.slug)
    return {
      slug: c.slug,
      name: c.name,
      kind: c.group === 'studio' ? 'Studio' : 'Channel',
      star: c.star,
      accent: c.accent,
      accentDeep: c.accentDeep,
      blurb: c.blurb,
      count: articles.length,
      dispatches: articles.slice(0, 3).map((a) => ({
        href: `/sonar/${a.channel}/${a.slug}`,
        title: a.title,
        meta: `${a.date} · ${a.readTime}`,
      })),
    }
  })

  return (
    <main className="read hub-read">
      <div className="hub">
        <ChannelCarousel channels={channels} />
      </div>
    </main>
  )
}
