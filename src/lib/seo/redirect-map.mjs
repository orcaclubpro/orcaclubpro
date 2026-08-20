// Legacy → new-IA redirect map. Single source of truth, consumed by
// next.config.mjs redirects() (301s) and src/middleware.ts (410s).
//
// LIVE since the Phase-2 cutover (Aug 2026). Keep entries ≥ 1 year.
//
// Rules: one hop only (no chains); every destination must exist and be
// indexable. Plain .mjs so next.config.mjs can import it.

export const LEGACY_REDIRECTS = [
  // --- services → /websites cluster
  { source: '/services', destination: '/websites' },
  { source: '/services/web-development', destination: '/websites' },
  { source: '/services/web-design', destination: '/websites' },
  { source: '/services/custom-development', destination: '/websites' },
  { source: '/services/api-integrations', destination: '/websites' },
  { source: '/services/cms-development', destination: '/websites/payload-cms' },
  { source: '/services/shopify', destination: '/websites/shopify' },
  { source: '/services/ecommerce', destination: '/websites/custom-commerce' },

  // --- services → /get-found cluster
  { source: '/services/digital-marketing', destination: '/get-found' },
  { source: '/services/marketing-integration', destination: '/get-found' },
  { source: '/services/seo-services', destination: '/get-found/seo' },
  { source: '/services/technical-seo', destination: '/get-found/seo' },
  // TODO(decision): analytics-tracking → /get-found/audit or /get-found/growth
  { source: '/services/analytics-tracking', destination: '/get-found/audit' },

  // --- services → /care
  // TODO(decision): hosting-infrastructure promises free hosting — /care contradicts it
  { source: '/services/hosting-infrastructure', destination: '/care' },
  { source: '/services/automation-workflows', destination: '/websites/custom-commerce' },
  { source: '/services/integration-automation', destination: '/websites/custom-commerce' },

  // --- solutions (static children first; CMS catch-all must stay LAST)
  { source: '/solutions/fast-website-launch', destination: '/websites/payload-cms' },
  { source: '/solutions/cms-setup', destination: '/websites/payload-cms' },
  { source: '/solutions/shopify-automation', destination: '/websites/shopify' },
  { source: '/solutions/headless-shopify-commerce', destination: '/websites/custom-commerce' },
  { source: '/solutions/stripe-integration', destination: '/websites/custom-commerce' },
  { source: '/solutions/api-development', destination: '/websites/custom-commerce' },
  { source: '/solutions/business-automation', destination: '/websites/custom-commerce' },
  { source: '/solutions', destination: '/websites' },
  // TODO(decision + pre-cutover): export live CMS solution slugs from Payload;
  // migrate docs with traffic into sonar articles w/ per-slug redirects here.
  { source: '/solutions/:slug', destination: '/sonar' },

  // --- packages → /pricing (the Phase-0 /pricing→/packages 302 in
  // next.config.mjs MUST be removed in the cutover deploy or this loops)
  { source: '/packages', destination: '/pricing' },
  { source: '/packages/launch', destination: '/pricing' },
  { source: '/packages/scale', destination: '/pricing' },
  { source: '/packages/enterprise', destination: '/pricing' },

  // --- funnel/company
  { source: '/project', destination: '/contact' },
  { source: '/project/development', destination: '/contact' },
  { source: '/project/onboarding', destination: '/contact' },
  { source: '/consultations', destination: '/contact' },
  // Retarget /portfolio → /work when /work ships with real case studies.
  { source: '/portfolio', destination: '/websites' },
  { source: '/insights', destination: '/sonar' },
  // /about stays live in the new IA; the solo-operator story folds into it.
  { source: '/founder', destination: '/about' },

  // --- SONAR consolidation: the internal /s mount is gone; the subdomain
  // 301s to the main domain via the host-scoped rules in next.config.mjs.
  { source: '/s', destination: '/sonar' },
  { source: '/s/:path*', destination: '/sonar/:path*' },
]

// Pages with no topical successor and no meaningful backlinks: honest 410
// (a redirect to '/' would be treated as a soft-404 and consolidate nothing).
// Served from middleware; redirects() cannot emit 410.
export const GONE_PATHS = ['/studio', '/studio/sonar', '/products', '/merchandise']
