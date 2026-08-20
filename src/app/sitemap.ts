import type { MetadataRoute } from 'next'
import { ARTICLES } from '@/components/sonar/articles'
import { CHANNELS } from '@/components/sonar/channels'

const BASE_URL = 'https://orcaclub.pro'

// Build timestamp, evaluated once per deploy rather than per request.
// Using `new Date()` inline would stamp every route as "changed just now" on
// every crawl, which makes lastmod noise Google learns to ignore.
const BUILD_DATE = new Date()

type Route = {
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}

// ─── New IA (hub-and-spoke) ──────────────────────────────────────────────────
// Live and indexable. These are the pages the funnel is built around.
const NEW_IA_ROUTES: Route[] = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },

  // Hubs
  { path: '/websites', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/get-found', priority: 0.9, changeFrequency: 'monthly' },

  // Money pages
  { path: '/websites/payload-cms', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/websites/shopify', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/websites/custom-commerce', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/get-found/audit', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/get-found/growth', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/care', priority: 0.8, changeFrequency: 'monthly' },

  // Retainer-service spokes (the SEO/AEO surface)
  { path: '/get-found/seo', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/get-found/google-ads', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/get-found/meta-ads', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/get-found/local-visibility', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/get-found/ai-search', priority: 0.8, changeFrequency: 'monthly' },

  // Decision + vertical + company
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/industries/professional-services', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/sonar', priority: 0.6, changeFrequency: 'monthly' },
]

// ─── SONAR (main-domain mount since the Phase-2 cutover) ─────────────────────
// Channels and articles derive from the shared hardcoded data; when articles
// move into a Payload collection this becomes a CMS query.
const SONAR_ROUTES: Route[] = [
  ...CHANNELS.map((c) => ({
    path: `/sonar/${c.slug}`,
    priority: 0.5,
    changeFrequency: 'monthly' as const,
  })),
  ...Object.values(ARTICLES).map((a) => ({
    path: `/sonar/${a.channel}/${a.slug}`,
    priority: 0.5,
    changeFrequency: 'monthly' as const,
  })),
]

// Legal — low priority, rarely change.
const LEGAL_ROUTES: Route[] = [
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/accessibility', priority: 0.3, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [...NEW_IA_ROUTES, ...SONAR_ROUTES, ...LEGAL_ROUTES]

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: BUILD_DATE,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
