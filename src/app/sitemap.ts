import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

const BASE_URL = 'https://orcaclub.pro'

// Every indexable static marketing route, with its crawl priority.
// Excluded on purpose: auth pages (login, setup-account, forgot/reset-password),
// gated client surfaces (/timelines, /c, /orcaclub/projects), "Coming Soon"
// stubs (/studio, /studio/sonar, /products, /merchandise), and /insights
// (placeholder content — add it back when real posts render there).
const STATIC_ROUTES: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },

  // Services (MOFU)
  { path: '/services', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/services/web-development', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/services/web-design', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/custom-development', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/cms-development', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/ecommerce', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/shopify', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/api-integrations', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/automation-workflows', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/integration-automation', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/services/marketing-integration', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/digital-marketing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/services/seo-services', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/services/technical-seo', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/analytics-tracking', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/hosting-infrastructure', priority: 0.8, changeFrequency: 'monthly' },

  // Solutions (TOFU) — static pages; CMS-driven ones are appended below
  { path: '/solutions', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/solutions/fast-website-launch', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/solutions/business-automation', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/solutions/stripe-integration', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/solutions/headless-shopify-commerce', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/solutions/shopify-automation', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/solutions/api-development', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/solutions/cms-setup', priority: 0.8, changeFrequency: 'monthly' },

  // Packages (pricing tiers)
  { path: '/packages', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/packages/launch', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/packages/scale', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/packages/enterprise', priority: 0.8, changeFrequency: 'monthly' },

  // Funnel (BOFU) + company
  { path: '/project', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/project/development', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/project/onboarding', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/consultations', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/founder', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/portfolio', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/sonar', priority: 0.7, changeFrequency: 'monthly' },

  // Legal
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/accessibility', priority: 0.3, changeFrequency: 'yearly' },
]

// Slugs above that shadow the /solutions/[slug] dynamic route — a Payload doc
// with one of these slugs is unreachable (the static page wins), so skip it.
const STATIC_SOLUTION_SLUGS = new Set(
  STATIC_ROUTES.filter((r) => r.path.startsWith('/solutions/')).map((r) =>
    r.path.replace('/solutions/', ''),
  ),
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // CMS-driven solutions pages. Never let a CMS/DB hiccup break the sitemap —
  // fall back to the static entries alone.
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
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
  } catch (error) {
    console.error('[sitemap] Failed to load solutions from Payload:', error)
  }

  return entries
}
