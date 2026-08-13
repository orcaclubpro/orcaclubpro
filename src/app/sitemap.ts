import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

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

// ─── Legacy IA ───────────────────────────────────────────────────────────────
// Still live until the cutover deploy replaces them with 301s. Kept in the
// sitemap so they stay crawled while they're the pages that actually rank —
// DELETE THIS WHOLE BLOCK at cutover (see docs/FRONTEND_REWORK_PLAN.md).
//
// Excluded on purpose even though they're live:
//   - /solutions/{shopify-automation,api-development,cms-setup} — 'use client'
//     pages that cannot export metadata, so they have no title, description, or
//     canonical. Promoting them would tell Google to index three untitled pages.
//   - /insights (placeholder content), /studio, /studio/sonar, /products,
//     /merchandise (Coming Soon stubs — 410 at cutover)
//   - auth pages and gated client surfaces (noindexed)
const LEGACY_ROUTES: Route[] = [
  { path: '/services', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/services/web-development', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/services/web-design', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/custom-development', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/cms-development', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/ecommerce', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/shopify', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/api-integrations', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/automation-workflows', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/integration-automation', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/marketing-integration', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/digital-marketing', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/seo-services', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/services/technical-seo', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/analytics-tracking', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/services/hosting-infrastructure', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/solutions', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/solutions/fast-website-launch', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/solutions/business-automation', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/solutions/stripe-integration', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/solutions/headless-shopify-commerce', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/packages', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/packages/launch', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/packages/scale', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/packages/enterprise', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/project', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/project/development', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/project/onboarding', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/consultations', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/founder', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/portfolio', priority: 0.5, changeFrequency: 'monthly' },
]

// Legal — low priority, rarely change.
const LEGAL_ROUTES: Route[] = [
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/accessibility', priority: 0.3, changeFrequency: 'yearly' },
]

// Static /solutions/* pages shadow the /solutions/[slug] dynamic route — a
// Payload doc published at one of these slugs is unreachable, so skip it.
const STATIC_SOLUTION_SLUGS = new Set([
  'fast-website-launch',
  'business-automation',
  'stripe-integration',
  'headless-shopify-commerce',
  'shopify-automation',
  'api-development',
  'cms-setup',
])

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [...NEW_IA_ROUTES, ...LEGACY_ROUTES, ...LEGAL_ROUTES]

  const entries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: BUILD_DATE,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // CMS-driven solutions pages, with their real edit dates. Never let a DB
  // hiccup break the sitemap — fall back to the static entries alone.
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'solutions',
      limit: 200,
      overrideAccess: false,
      select: { slug: true, updatedAt: true, meta: true },
    })

    for (const doc of docs) {
      const slug = doc.slug as string | undefined
      if (!slug || STATIC_SOLUTION_SLUGS.has(slug)) continue
      if ((doc.meta as { noIndex?: boolean } | undefined)?.noIndex) continue
      entries.push({
        url: `${BASE_URL}/solutions/${slug}`,
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : BUILD_DATE,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }
  } catch (error) {
    console.error('[sitemap] Failed to load solutions from Payload:', error)
  }

  return entries
}
