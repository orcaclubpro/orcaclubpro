import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ARTICLES, ArticleView, getArticle } from '@/components/sonar/articles'
import { channelName } from '@/components/sonar/channels'

// Article — a single [channel]/[slug] route handles every format. The reading
// template (Decode / Brief / Field Note) is chosen from the article's format,
// which in Phase 1 is derived from its channel.

export function generateStaticParams() {
  return Object.values(ARTICLES).map((a) => ({ channel: a.channel, slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ channel: string; slug: string }>
}): Promise<Metadata> {
  const { channel, slug } = await params
  const article = getArticle(channel, slug)
  if (!article) return { title: 'SONAR' }
  return { title: `SONAR — ${channelName(article.channel)}` }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ channel: string; slug: string }>
}) {
  const { channel, slug } = await params
  const article = getArticle(channel, slug)
  if (!article) notFound()
  return <ArticleView article={article} />
}
