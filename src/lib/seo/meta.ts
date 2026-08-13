import type { Metadata } from 'next'
import { BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME } from './site'

type BuildMetadataArgs = {
  title: string
  description: string
  /** Route path starting with '/', e.g. '/websites/payload-cms'. Becomes the canonical. */
  path: string
  ogImage?: string
  ogType?: 'website' | 'article'
  noIndex?: boolean
  keywords?: string[]
}

/**
 * Standard page metadata: self-referencing canonical, OG, Twitter card.
 * Replaces the hand-copied metadata blocks — every page's export becomes:
 *
 *   export const metadata = buildMetadata({
 *     title: '...', description: '...', path: '/websites',
 *   })
 */
export function buildMetadata({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
  keywords,
}: BuildMetadataArgs): Metadata {
  const url = `${BASE_URL}${path === '/' ? '' : path}`
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType,
      locale: 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}
