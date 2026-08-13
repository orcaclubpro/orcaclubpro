# ORCACLUB Frontend Rework — Implementation Plan

**v1 · August 2026 · Synthesized from 4-agent codebase analysis**
Companion to: *ORCACLUB — Site Structure & Funnel v1* (target IA), ORCACLUB_Site_Rework_and_Positioning_Plan.md, ORCACLUB_Brand_Spec.md.

---

## Architecture decisions (recommended)

1. **SONAR moves to the main domain at `/sonar`; the subdomain 301s.** The Payload side was already built for this: the Posts revalidate hook and seoPlugin `generateURL` both point at `orcaclub.pro/sonar/*` — routes that don't exist today. The subdomain build bypassed the CMS entirely (7 articles hardcoded as JSX in `src/components/sonar/articles.tsx`). Consolidating puts article link equity on the same origin as the hubs/spokes the articles must link to.
2. **New marketing pages are code routes built from shared templates, not Payload block pages.** ~17 pages with strict per-template structure (link discipline, Q&A word counts, answer-first ledes) are better enforced by React templates than freeform CMS blocks. CMS owns what's genuinely content-shaped: sonar articles (Posts) and case studies (new collection).
3. **One SEO module (`src/lib/seo/`) replaces 30 files of copy-pasted metadata.** `buildMetadata()`, schema builders (Service/FAQPage/Breadcrumb/Article/OfferCatalog), a `<JsonLd>` component, and `redirect-map.mjs` as single source of truth for legacy redirects. FAQ data becomes one array per page feeding both JSX and JSON-LD (today the schema FAQs are retyped and already drifted out of sync with rendered FAQs).
4. **Redirects live in `next.config.mjs` `redirects()`** (runs before middleware and filesystem, `permanent: true`); middleware handles only the 410s for the four Coming-Soon stubs. No redirect chains — every old URL maps in one hop.

## What the analysis found (state of play)

- **21 bespoke marketing pages, ~10,900 LOC in service Content files, 60–70% mechanically duplicated.** Nine copy-pasted FAQ accordions with style drift; two animation libraries in use; the shadcn/ui kit is essentially unused by marketing (4 imports total). Nothing here is a template — the rework builds the first one.
- **Nav is declared 5 separate times in `header.tsx`** (4 const arrays + a divergent mobile array), with tier prices hardcoded into the dropdown. The new IA doesn't fit the existing two-panel dropdown; it's a rewrite, fed by a new single `src/data/nav.ts` shared with the footer.
- **Strong seed copy exists for most new pages** (see mapping below). Net-new writes: `/get-found/local-visibility`, `/get-found/ai-search`, `/get-found/growth` retainer framing, `/industries/professional-services`, and all `/work` case studies.
- **`/packages/page.tsx` is ~70% of `/pricing`** — tiers, feature matrix, retainer plans, FAQs. Structure survives; every number dies.
- **Fabricated metrics must not migrate**: `/about` (50+ projects, 250% ROI), `/portfolio` (placeholder images, `#` links, 1000% organic traffic), `/insights` (fake posts), `digital-marketing` case-study revenue figures. `/work` starts from real, attributable work only.
- **Middleware exploit filter 403s dev-topic slugs** (`/bash/i`, `/base64/i`, `/exec\(/i` tested against the decoded path). Must be fixed before any dev article ships on the main domain.

## Pricing conflicts to resolve before build-out

| Conflict | Where |
|---|---|
| New $4–10k Payload build vs "$1–3K in 3–5 days" | 6 pages incl. `/packages`, `/packages/launch`, `/solutions/fast-website-launch`, `/solutions/cms-setup`, JSON-LD in `web-design`/`web-development` |
| New $2.5–5k Shopify vs "$6K–30K" / "$3,000–$30,000+" | `/solutions/headless-shopify-commerce`, `services/shopify` JSON-LD |
| New custom-commerce "from $12k" vs Enterprise floor $6,000 | 6 places |
| `/care` $500/mo vs "hosting included free, no separate fees, ever" | `services/hosting-infrastructure` (its core claim) |
| Maintenance: $500/$1–2k/$3k (packages page) vs $300/$600/$1,200 (contact form ×2, project-tiers ×1) vs new $500 flat | `packages/page.tsx`, `contact-form.tsx` L343+512, `project-tiers.tsx` L199–222 |
| Undocumented $75/hr rate | `project-tiers.tsx`, `contact-form.tsx` |
| Old tiers baked into metadata/JSON-LD | `packages/layout.tsx`, `project/layout.tsx`, service page schemas, solution metadata descriptions |

## Content mapping (old → new)

**Direct seeds (REUSE):** `services/cms-development` → `/websites/payload-cms` (strongest copy in repo) · `services/shopify` + `solutions/shopify-automation` → `/websites/shopify` · `services/seo-services` → `/get-found/seo` · `services/technical-seo` → `/get-found/audit` deliverables · `services/digital-marketing` → `/get-found/growth` (strip fake case studies) · `services/hosting-infrastructure` → `/care` (reframe: free-hosting claim dies) · `/packages` → `/pricing` · `/portfolio` layout → `/work` (discard all items) · `/project/*` + `/consultations` process copy (NDA→W-9→MSA→SOW, sprint cadence, "scoped before you pay") → `/pricing` + `/contact` — genuinely differentiated, keep.

**Merges:** `web-design`/`web-development` → `/websites` + payload-cms · `ecommerce`/`custom-development`/`api-integrations`/`solutions/{stripe-integration,api-development,headless-shopify-commerce}` + `packages/enterprise` → `/websites/custom-commerce` · `marketing-integration` split → google-ads/meta-ads spokes · `analytics-tracking` → growth + audit · `packages/launch+scale` → payload-cms (launch's Professional Services card seeds `/industries/professional-services`).

**Kills (redirect):** `/services` index, `automation-workflows` + `integration-automation` (duplicate pair — extract the time-cost calculator first), `/solutions` index + `business-automation`, `/about`*, `/founder`*, `/insights`. **Kills (410):** `/studio`, `/studio/sonar`, `/products`, `/merchandise`.
*Recommend keeping a live `/about` (costs nothing, avoids soft-404) with `/founder` 301 → `/about`; the solo-operator positioning from `/founder` is real differentiation worth folding in.

Full redirect map: see agent SEO report / to be encoded in `src/lib/seo/redirect-map.mjs`.

## CMS work

**Posts (→ /sonar articles).** Exists, versioned, seoPlugin-wired, zero frontend consumers. Add: `lastUpdated`, `sources[]` (title/publisher/url/accessedDate), `stats[]`, **required single `hub` + `spoke` link fields** (enforces the linking rule at the schema level), `channel` + `format` selects, `issueNo`/`signalFlag`. Author bio: new `authors` collection (bio, avatar, credentials, url) rather than exposing Payload auth users publicly.

**CaseStudies (new, → /work).** Model on `Solutions.ts`: title/slug, `client → clients` (logo reuse), industry, summary, heroImage, gallery, **required `moneyPage` relationship** (the tagging rule), scope/stack/metrics arrays, testimonial group, ArticleBlock body, drafts, seoPlugin, revalidate hooks, sitemap block. Do NOT extend `Projects` (would leak budgets/client-accounts) or `Clients` (logo wall).

**Field-notes overlap:** the SONAR `field-notes` channel is "the case study, as content" — under the new IA that content belongs to `/work`. Drop the channel or make field-notes a view of a case-study doc; both URLs carrying it = duplicate content.

## Phases

### Phase 0 — now, independent of the rework (safe to deploy immediately)
1. Exploit-filter fix: two-tier patterns (path-safe traversal/null-byte checks stay on the path; command patterns require shell metacharacters/query context). Include a pass/fail URL checklist (`/sonar/dev/bash-vs-zsh` passes, `?cmd=;bash` fails).
2. `/pricing` → `/packages` **temporary 302** (kills 4 live 404 links; polarity flips at cutover — removal is an explicit cutover checklist item to avoid a redirect loop).
3. Root layout JSON-LD trim: Organization + WebSite only; drop sitewide FAQPage/Service, phantom `/search` SearchAction; fix `orcaclub.co` author URL.
4. Scaffold `src/lib/seo/` (meta, schema, JsonLd, redirect-map).

### Phase 1 — build-out (old site untouched and indexed; new pages on preview only)
1. Shared foundation: `Section`/`SectionHeader`/page-shell primitives, single `<FAQ>` (data feeds JSX + schema), `<Stat withSource>`, `<LastUpdated>`, `<AuthorBio>`, `<LiftableAnswer>`, prop-driven scroll-spy TOC (from `DevelopmentSideNav`), breadcrumb UI; install shadcn accordion/table/breadcrumb; fix `components.json` css path; pick ONE animation lib.
2. Four templates: Hub, Money (two-outbound-link discipline baked in), Spoke, Pricing.
3. `src/data/nav.ts` + header/footer rewrite consuming it.
4. Pages in dependency order: `/pricing` (from packages) → `/websites` + 3 money pages → `/get-found` + audit/growth → 5 spokes → `/care` → `/industries/professional-services` → home rewrite.
5. SONAR remount: `(sonar)/s/*` → `(frontend)/sonar/*` (landing becomes the hub), href prefixes, sonar.css scoping check, full article metadata + Article schema.
6. CMS: Posts field additions, authors collection, CaseStudies collection, `/work` route; reconcile seoPlugin `generateURL` + revalidate paths with the chosen URL shape.

### Phase 2 — cutover (one atomic deploy)
Redirects + 410s live · sonar host-redirect rules in next.config, middleware sonar blocks deleted · old page dirs deleted (`services/`, `solutions/` incl. `[slug]`, `packages/`, `project/`, `consultations/`, `portfolio/`, `insights/`, stubs, `(sonar)/`) · nav/footer/all internal links grep-verified (no internal link through a redirect) · sitemap/robots swapped (robots adds `/u/`, `/login`, `/c/`, `/timelines/`) · temp `/pricing` redirect removed · contact-form budget options repriced · build-time check: every redirect destination exists in the new sitemap.

### Phase 3 — post-launch (same day + monitoring)
GSC sitemap resubmit; URL-Inspect top old URLs + all new hubs/money pages; `curl -sI` single-hop verification incl. subdomain; watch GSC Enhancements for FAQ rich-result migration; redirects stay ≥ 1 year; expect 2–6 weeks ranking wobble.

## Open decisions (blocking their respective steps)

1. **Sonar URL shape**: nested `/sonar/[channel]/[slug]` (current structure, recommended) vs flat `/sonar/[slug]` (what seoPlugin/hooks assume). Must be settled before Posts wiring.
2. **`/about`**: keep live (recommended) or kill.
3. **`/care` positioning**: how the paid plan supersedes the "free hosting forever" promise for existing pages/clients.
4. **CMS solutions long tail**: migrate live `/solutions/[slug]` docs into sonar articles with per-slug redirects (recommended) vs blanket redirect. Needs the live slug list from Payload + GSC traffic check.
5. **Keep/kill the automation time-cost calculator** (`integration-automation`) — good asset, no obvious home; could seed a sonar article or a `/websites/custom-commerce` section.
6. **Real case-study material** for `/work` — the fabricated portfolio dies; need actual projects, metrics, permissions.
