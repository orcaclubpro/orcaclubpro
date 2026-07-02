# SONAR — Content Engine: design spec

**Date:** 2026-07-02
**Status:** Draft for review
**Owner:** chance

## 1. Overview

SONAR ("Signal from beneath the noise") is ORCACLUB's research/content engine and its
top-of-funnel into premium rebranding work. It is a **modern dashboard UI wearing
book/editorial aesthetics** — a light, calm reading surface with an app-like shell.

This spec covers **Phase 1**: standing up SONAR as a new route group in the existing
Next.js 15 + Payload 3 app, served on its own subdomain `sonar.orcaclub.pro`, with the
four already-designed page types ported from static HTML mockups to React using
**hardcoded/static content**. CMS wiring is explicitly deferred to Phase 2.

Design exploration is complete. Reference mockups (validated, light + dark):
`docs/superpowers/concepts/` — `sonar-concept-a.html` (Decode/reading), `sonar-page-desk.html`
(The Desk), `sonar-page-fieldnote.html` (Field Note), `sonar-page-markets.html` (Markets Brief),
plus `sonar-variant-deep.html` (dark reference). Brand assets: `sonar-orca.png`, `sonar-word.png`.

## 2. Goals / non-goals

**Goals (Phase 1)**
- `sonar.orcaclub.pro/` serves The Desk; `sonar.orcaclub.pro/<path>` serves the app pages.
- `orcaclub.pro/sonar` becomes a **landing page** for SONAR (replacing the placeholder blog).
- New `(sonar)` route group with its own shell/layout, light default + dark ("Deep") toggle.
- Four page types live as static React: **Decode** (reading), **The Desk** (home),
  **Field Note** (funnel), **Markets Brief** (premium).
- Extend the existing `src/middleware.ts` to route the subdomain — do not add a second middleware.
- Deploy config: add the Vercel domain + DNS.

**Non-goals (deferred to Phase 2)**
- Payload collections / CMS-driven content (content is hardcoded in Phase 1).
- Search ("Scan the archive"), live freshness counts, subscribe/premium/sponsor backends.
- Channel index pages beyond a basic stub (The Desk establishes the card language).
- Auth-gated premium reading (the gate is presentational in Phase 1).

## 3. Topology & routing

Two surfaces, two hosts:

| URL | Serves | Group |
|---|---|---|
| `orcaclub.pro/sonar` | SONAR **landing page** (promo → "Enter SONAR →") | `(frontend)` |
| `sonar.orcaclub.pro/` | The Desk (app home) | `(sonar)` |
| `sonar.orcaclub.pro/<path>` | App pages (channels, articles) | `(sonar)` |

Because the landing page owns `/sonar`, the app **cannot** mount at `/sonar` internally
(two route groups can't resolve the same path). The app mounts at an internal segment
**`/s`**, and middleware rewrites the subdomain onto it. `/s` is never visible on the
subdomain (it's rewritten); direct `orcaclub.pro/s/*` hits are redirected to the subdomain.

### Route group structure
```
src/app/
├── (frontend)/
│   └── sonar/page.tsx              # SONAR landing page (replaces placeholder blog)
└── (sonar)/
    ├── layout.tsx                  # SONAR shell: sidebar + theme + fonts (sibling of (frontend))
    └── s/
        ├── page.tsx                # The Desk            → sonar.orcaclub.pro/
        └── [channel]/
            ├── page.tsx            # Channel index (stub) → /ai, /markets, /research, /field-notes
            └── [slug]/page.tsx     # Article (template chosen by channel) → /ai/<slug>, /field-notes/<slug>
```
`[channel]` values in Phase 1: `ai`, `markets`, `research`, `field-notes`. A single
`[channel]/[slug]` route handles every article; the template (Decode / Brief / Field Note) is
selected from the channel — no separate per-format folders.

### Article format routing
An article's template is chosen by its channel/format:
- `research`, `ai` → **Decode** template (long-form reading + sounding-line).
- `markets` → **Brief** template (thesis-first, data strip, premium gate).
- `field-notes` → **Field Note** template (case study + services funnel).

In Phase 1 this is a static map keyed by channel; in Phase 2 it becomes a `format` field.

## 4. Middleware (extend existing `src/middleware.ts`)

Add a host check near the top of `middleware()`, **before** the existing `/` dashboard-redirect
block, and after the security/exploit checks. Pseudocode:

```ts
const host = (request.headers.get('host') || '').split(':')[0]
const isSonarHost = host === 'sonar.orcaclub.pro' || host.endsWith('.sonar.localhost')

if (isSonarHost) {
  // Subdomain: rewrite everything except API/admin/static onto the /s app mount.
  if (!pathname.startsWith('/api') && !pathname.startsWith('/admin') && !pathname.startsWith('/s')) {
    const url = request.nextUrl.clone()
    url.pathname = `/s${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)          // sonar.orcaclub.pro/ai → /s/ai
  }
} else if (pathname === '/s' || pathname.startsWith('/s/')) {
  // Main domain: don't expose the internal app mount — send to the subdomain.
  return NextResponse.redirect(new URL(`https://sonar.orcaclub.pro${pathname.replace(/^\/s/, '')}`))
}
```

Notes:
- `/api` and `/admin` are excluded so Payload REST + admin keep working on the subdomain.
- The existing exploit-blocking, rate-limiting, and `/u/` auth logic are untouched and still run.
- The `config.matcher` already excludes `_next`, static files, and `admin`; no change needed.
- **Local dev:** use `sonar.localhost:3000` (Chrome resolves `*.localhost` automatically), or
  hit `localhost:3000/s/...` directly.

## 5. The shell — `(sonar)/layout.tsx`

Ported from the mockup shell. One component tree, two token sets.

- **Root layout note:** `src/app/layout.tsx` (the app root with `<html>`) sets a black body +
  Montserrat + GTM. The `(sonar)` layout overrides within its subtree: wraps content in a
  themed container that sets the SONAR background/`data-theme` and applies SONAR fonts, so the
  black body/Montserrat do not bleed in. (Single shared root layout; no multi-root split in Phase 1.)
- **Fonts** via `next/font/google`: **Newsreader** (reading serif), **Jost** (UI labels),
  **JetBrains Mono** (data). Exposed as CSS variables on the SONAR container.
- **Sidebar (spine):** brand lockup (orca + wordmark, subline reveals on hover), grouped nav —
  `CHANNELS` (AI ● / Markets ● / Research) + `STUDIO` (Field Notes ★) with freshness signals,
  the light/dark **mode toggle**, the "Scan the archive" input (non-functional stub in Phase 1),
  and an edition marker. Collapses to a top bar < 720px.
- **Right rail:** a per-format slot — sounding-line (Decode) / THE ENGINE (Desk) /
  PROJECT sheet (Field Note) / SIGNAL box (Markets). Hides < 1100px.
- **Theme:** light is the default; a small client component toggles `data-theme="deep"` on the
  SONAR container. `deep` token overrides + logo `invert` filter + funnel/glow rules per the mockup.

### Components (extracted from the mockups)
```
src/components/sonar/
├── Spine.tsx           # sidebar (client — active state, toggle)
├── ModeToggle.tsx      # light/deep switch (client)
├── SoundingLine.tsx    # Decode right rail
├── EnginePanel.tsx     # Desk right rail
├── ProjectSheet.tsx    # Field Note right rail
├── SignalPanel.tsx     # Markets right rail
├── ArticleCard.tsx     # Desk cards
├── Funnel.tsx          # "we build what we write about" → ORCACLUB CTA
└── BrandLockup.tsx     # orca + wordmark + hover subline
```
Brand PNGs move to `public/sonar/` (`orca.png`, `word.png`). Phase 2 may replace with inline SVG.

## 6. Page types (static content in Phase 1)

| Page | Route | Right rail | Notes |
|---|---|---|---|
| The Desk | `/` (→ `/s`) | THE ENGINE + dispatch signup | Masthead, featured lead, latest-by-channel grid, Field Note spotlight |
| Decode | `/research/<slug>`, `/ai/<slug>` | Sounding-line | Reading view, drop cap, pull quote, footnotes, funnel line |
| Field Note | `/field-notes/<slug>` | PROJECT fact sheet | Case study, before/after, outcome strip, Redesign→Retainer CTA |
| Markets Brief | `/markets/<slug>` | SIGNAL box | Thesis line, data strip, premium gate (presentational), sponsor slot |

Each ships with 1–2 hardcoded sample entries so the routes resolve and are navigable.

## 7. Old blog handling

`src/app/(frontend)/sonar/` currently holds a **placeholder** blog (hardcoded fake posts,
no real content/SEO). Action:
- Replace `(frontend)/sonar/page.tsx` with the SONAR **landing page** — a designed portal
  (mockup: `docs/superpowers/concepts/sonar-landing.html`): paper hero, the orca surfacing out
  of a settling noise field via a sonar-ping entry animation, wordmark sweep-in, tagline, and two
  CTAs — **Enter SONAR →** (to the subdomain) and **Learn more** (scrolls to a channels explainer).
  Reduced-motion safe. Same brand system as the app.
- Remove `(frontend)/sonar/[slug]/` and `(frontend)/sonar/category/[slug]/` (placeholder routes).
- Add catch-all redirects `orcaclub.pro/sonar/:slug*` → the landing (or the subdomain) to avoid
  404s on any stale links. (Low priority — the slugs were never real.)
- `studio/sonar` and `insights` are left as-is in Phase 1 (out of scope; revisit in Phase 2).

## 8. Deploy — Vercel + DNS

- Vercel: Project → Domains → add `sonar.orcaclub.pro` (auto-provisions SSL).
- DNS at registrar: `CNAME sonar → cname.vercel-dns.com`.
- No separate service or process — same Next.js app, routed by middleware.

## 9. Phase 2 (future, not in this build)

- Payload collections: `sonar-articles` (with `channel` + `format`, body richtext, `signal`
  freshness, sounding sections, sidenotes), `sonar-channels` (or enum), Field Note project
  metadata (client, scope, duration, package, before/after, outcome), premium + sponsor flags.
- Wire freshness counts, search, subscribe/premium gate + finance sponsor, channel index pages.
- Revisit `studio/sonar` + `insights` consolidation.
- Consider inline-SVG brand assets and multi-root layout if html-level divergence is wanted.

## 10. Open questions

- Confirm the app internal mount name `/s` (alternatives: `/desk`, `/signal`).
- Confirm `sonar.orcaclub.pro` is the final subdomain (vs `sonar.orcaclub.co` or other).
