import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { articlesByChannel } from '@/components/sonar/articles'
import { CHANNELS, channelName } from '@/components/sonar/channels'

// Channel index — a basic stub in Phase 1 (The Desk establishes the card
// language). Lists the hardcoded sample articles for the channel.

export function generateStaticParams() {
  return CHANNELS.map((c) => ({ channel: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ channel: string }>
}): Promise<Metadata> {
  const { channel } = await params
  return { title: `SONAR — ${channelName(channel)}` }
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channel: string }>
}) {
  const { channel } = await params
  if (!CHANNELS.some((c) => c.slug === channel)) notFound()

  const articles = articlesByChannel(channel)

  return (
    <main className="read">
      <div className="index-head">
        <div className="eyebrow">
          <span className="dot" />
          <span className="label crumb">
            <Link href="/">Sonar</Link>
            <span className="sep">/</span>
            <span>{channelName(channel)}</span>
          </span>
        </div>
        <h1 className="title">{channelName(channel)}</h1>
      </div>
      <div className="index-list">
        {articles.length === 0 ? (
          <p className="index-empty">No dispatches on this channel yet.</p>
        ) : (
          articles.map((a) => (
            <Link className="index-row" key={a.slug} href={`/${a.channel}/${a.slug}`}>
              <h2 className="card-title">{a.title}</h2>
              <div className="card-meta mono" style={{ marginTop: 8 }}>
                {a.date} · {a.readTime}
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  )
}
