# ORCACLUB - Payload CMS Development Guide

You are an expert Payload CMS developer working on ORCACLUB, a Technical Operations Development Studio platform.

## Environment

- **Runtime**: Bun (primary) — always use `bun`, never npm/yarn/pnpm
- **Database**: MongoDB Atlas (mongoose adapter)
- **Framework**: Next.js 15 + Payload 3 (co-located — same process, no separate CMS service)

```bash
bun run bun:dev                      # Start dev server (fastest)
bun run build:production             # Production build
bun run payload:generate             # Regenerate payload-types.ts — run after every schema change
bun run payload generate:importmap   # Regenerate import map — run after component path changes
bun run payload:migrate              # Run database migrations
bun run tsc --noEmit                 # Validate TypeScript
bun run lint
```

## Project Structure

```
src/
├── app/
│   ├── (frontend)/       # Public website (marketing, blog, contact)
│   │   ├── packages/     # Tier pages: launch, scale, enterprise
│   │   ├── services/     # MOFU service pages (15+)
│   │   ├── solutions/    # TOFU problem-solution pages
│   │   ├── sonar/        # Blog: listing, [slug], category/[slug]
│   │   └── contact/, about/, login/, forgot-password/, reset-password/
│   ├── (payload)/        # Payload admin (CMS interface) + auto-mounted REST API
│   ├── (spaces)/         # Client portal (see Client Portal Architecture section)
│   │   ├── session.ts    # getSessionUser() — cached auth; ALWAYS use inside (spaces)
│   │   ├── experience.ts # role → 'staff' | 'client' (presentation only)
│   │   └── u/[username]/ # Route-per-tab dashboard
│   │       ├── page.tsx            # Home tab + legacy ?tab= redirects
│   │       ├── tabs.ts             # Tab registry — id === route segment
│   │       ├── dashboard-data.ts   # Per-tab data loaders
│   │       ├── _views/             # View components, one per tab
│   │       ├── projects/ clients/ tasks/ files/ timelines/ packages/  # staff tabs
│   │       ├── invoices/ accounts/                                    # client tabs
│   │       ├── clients/[client]/   # Detail route (detail-data.ts = cached fetches)
│   │       └── projects/[project]/ # Detail route (detail-data.ts = cached fetches)
│   └── api/              # REST endpoints (see API Routes section)
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Header, footer, nav
│   ├── sections/         # Page sections (hero, services grid, etc.)
│   ├── dashboard/        # Client portal components
│   └── payload/          # Custom Payload admin components (see Components section)
├── lib/
│   ├── payload/
│   │   ├── payload.config.ts   # Main Payload config (Users/Media/Leads/Categories/Tags/Posts defined inline here)
│   │   ├── collections/        # One file per collection (newer collections)
│   │   ├── hooks/              # Lifecycle hooks (see Hooks section)
│   │   ├── access/index.ts     # All shared access control functions
│   │   └── utils/              # loginTwoFactor, passwordReset, passkey*, unlockAccount, email templates, fieldEncryption
│   ├── shopify/          # admin-client.ts, customers.ts, products.ts, draft-orders.ts
│   ├── stripe.ts         # Stripe singleton client
│   ├── google-calendar.ts
│   └── email/templates/
├── hooks/                # React hooks (client-side)
├── actions/              # Next.js Server Actions
└── types/payload-types.ts  # Auto-generated — never edit by hand
```

## Client Portal Architecture — (spaces)

The dashboard is **route-per-tab** — there is no client-side tab system. Each tab is a real Next.js route under `u/[username]/`; navigation is plain prefetched `<Link>`s, `loading.tsx` skeletons give instant paint, and `staleTimes` in `next.config.mjs` caches repeat visits.

| Piece | File | Rule |
|-------|------|------|
| Tab registry | `u/[username]/tabs.ts` | Single source of truth for tab ids, labels, icons, nav placement. **Tab id === route segment** — public contract, never rename. |
| Per-tab loaders | `u/[username]/dashboard-data.ts` | Each page fetches only its tab's data. Loaders use `select`/`populate` to trim payloads — when a view needs a new field, add it to the loader's `select`. |
| Cached auth | `(spaces)/session.ts` → `getSessionUser()` | Always use this inside `(spaces)` instead of `getCurrentUser` — `React.cache()` dedupes across layout, page, and metadata in one request. |
| Cached client account | `resolveClientAccount()` in `dashboard-data.ts` | `cache()`d — layout badge + page share one findByID. Returns null → render `<AccountNotFound />` (in `_views/`). |
| Detail-route data | `clients/[client]/detail-data.ts`, `projects/[project]/detail-data.ts` | `cache()`d findByID shared by layout + page + generateMetadata. Never call findByID for these docs directly in a route file. |
| Skeletons | `components/dashboard/LoadingSkeleton.tsx` | Every tab route has a `loading.tsx` composing these primitives. Without one, link prefetch does nothing and navigation shows a blank wait. |
| Nav | `components/dashboard/MobileBottomNav.tsx` | Builds links from `tabs.ts` via `tabHref()`; active state derived from pathname. |
| Experiences | `(spaces)/experience.ts` | Collapses roles → `'staff' \| 'client'` for **presentation only**. Data scoping still distinguishes `admin` vs `user` (see loaders). |

Legacy `?tab=<id>` URLs redirect to the routes in `u/[username]/page.tsx`. The old `orders/` route redirects to `invoices/`.

### Adding a dashboard tab

1. Add a `TabDef` to `STAFF_TABS` or `CLIENT_TABS` in `tabs.ts` (id = route segment)
2. Add a loader to `dashboard-data.ts` — `select` only the fields the view renders
3. Create `u/[username]/<id>/page.tsx`: guard with `experienceFor(user.role)`, call the loader, render the view
4. Create `u/[username]/<id>/loading.tsx` from `LoadingSkeleton` composites
5. Put the view component in `_views/`

### Dashboard themes — plug-and-play

The theme registry in `src/app/(spaces)/themes.ts` is the **single source of truth**. Themes swap `--space-*` CSS variables on `<html>` (custom system — no `next-themes`). Current themes: `sonar` (warm paper, **default**), `light` (neutral), `paper` (Charcoal, dark).

**Add a theme = add one `defineTheme({...})` entry to `THEME_LIST`. Nothing else to touch** — the Payload `dashboardTheme` dropdown (`themeSelectOptions()`), the `ThemeSwitcher` preview cards, and the default (`DEFAULT_THEME`) all derive from the registry.

```typescript
defineTheme({
  id: 'ocean', label: 'Ocean', description: 'Deep blue',
  mode: 'dark',              // picks LIGHT_EXTENDED / DARK_EXTENDED text+card defaults
  accent: '#38bdf8', accentRgb: '56, 189, 248',
  bgBase: '#04121f',
  // overrides: { '--space-bg-card': '#0a2436' },  // only when deviating
})
```

`defineTheme` derives accent-dim/glow/soft, surface, nav-bg, and border from the accent + mode. After editing, run `bun run payload:generate` (the `dashboardTheme` enum is generated). Components consume vars via `var(--space-*)` / `bg-[var(--space-*)]` — never hardcode `text-white`/`bg-black` in dashboard components (breaks light themes).

## CRITICAL SECURITY RULES

### 1. Always set `overrideAccess: false` when passing a user to the Local API

Without it, the user is ignored and the operation silently runs with admin privileges.

```typescript
await payload.find({
  collection: 'orders',
  user,
  overrideAccess: false, // REQUIRED — every query in (spaces)/ must have this
})
```

### 2. Always pass `req` to nested operations in hooks

Missing `req` breaks transaction atomicity — the nested call runs in a separate transaction.

```typescript
await payload.update({
  collection: 'client-accounts',
  id: accountId,
  data: { accountBalance: total },
  req, // REQUIRED
})
```

### 3. Use context flags to prevent infinite hook loops

Check the flag before doing work, set it before the nested call.

```typescript
if (context?.skipBalanceUpdate) return doc

await payload.update({
  collection: 'client-accounts',
  id: accountId,
  data: { accountBalance: total },
  context: { skipBalanceUpdate: true },
  req,
})
```

### 4. Field-level access returns boolean only

No query constraints at field level — those belong at collection level.

```typescript
access: {
  read: ({ req: { user } }) => Boolean(user),
  update: () => false, // Never directly updated — calculated via hooks
}
```

### 5. Always verify webhook signatures

```typescript
stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
```

## Collections (20 total)

Most collections have their own file in `src/lib/payload/collections/`; **Users, Media, Leads, Categories, Tags, and Posts are defined inline in `payload.config.ts`**.

### Business Operations

| Collection | Slug | Purpose | Key Hooks |
|-----------|------|---------|-----------|
| Users | `users` | Admin/staff/client auth. Roles: `admin`, `user`, `client` | `beforeLogin`, `createClientAccount`, `syncUserToClientAccount` |
| ClientAccounts | `client-accounts` | Central client record. Stripe/Shopify IDs, account balance | `createStripeCustomer`, `createShopifyCustomer`, `syncClientAccountToUser` |
| Orders | `orders` | Financial records with line items. `pending → paid → cancelled` | `updateClientBalance` (afterChange + afterDelete) |
| Projects | `projects` | Project management with milestones, budget, dates | — |
| Tasks | `tasks` | Work items with status, priority, sprint, time tracking | — |
| Sprints | `sprints` | Groups tasks per project. `completedTasksCount` is read-only | — |
| Files | `files` | Documents attached to projects or sprints | — |
| Packages | `packages` | Service packages / proposals per client account | — |
| ServiceItems | `service-items` | Line-item catalog for packages/orders | — |
| Credentials | `credentials` | Client-facing credentials attached to projects | — |
| WebhookEvents | `webhook-events` | Stripe webhook idempotency tracker | — |

### Content & Marketing

| Collection | Slug | Purpose |
|-----------|------|---------|
| Media | `media` | File uploads with image resizing (thumbnail, card, logo) |
| Clients | `clients` | Portfolio logos on homepage |
| Leads | `leads` | Contact/booking submissions. Status: `new → contacted → converted → lost` |
| Categories | `categories` | Blog taxonomy |
| Tags | `tags` | Blog keywords |
| Posts | `posts` | Blog content with draft/publish versioning. `revalidate` hook (afterChange + afterDelete) |
| Solutions | `solutions` | TOFU solution pages content (also uses revalidate hooks) |
| Pages | `pages` | CMS-managed pages |
| Timelines | `timelines` | Public project timelines (`/timelines/[slug]`, PDF export) |

## Access Control

All access functions live in `src/lib/payload/access/index.ts`. Always import from here — never inline logic in collection configs.

```typescript
anyone                    // Public, no auth required
authenticated             // Any logged-in user (any role)
authenticatedOrPublished  // Authenticated users OR published documents
adminOnly                 // role === 'admin'
adminOrUser               // role === 'admin' | 'user' (excludes clients)
adminOrAssigned           // Admins see all; users see only assigned items
adminOrProjectMember      // Admins see all; users see items from assigned projects
adminOrOwnClient          // Admins see all; clients see only their own account
adminOrSelf               // Admins see all; users see only their own user record
adminOrProjectMemberOrClient // Project members + the client who owns the project (Credentials)
adminOrUserOrOwnOrder     // Staff, or the client whose clientAccount owns the order
```

**Collection access matrix:**

| Collection | create | read | update | delete |
|-----------|--------|------|--------|--------|
| Users | adminOnly | adminOrSelf | adminOrSelf | adminOnly |
| ClientAccounts | authenticated | adminOrOwnClient | authenticated | adminOnly |
| Orders | authenticated | authenticated | authenticated | adminOnly |
| Projects | adminOrUser | adminOrAssigned | adminOrAssigned | adminOnly |
| Tasks | adminOrUser | adminOrAssigned | adminOrAssigned | adminOnly |
| Sprints | adminOrUser | adminOrProjectMember | adminOrProjectMember | adminOnly |
| Files | adminOrUser | adminOrProjectMember | adminOrProjectMember | adminOnly |
| Packages | adminOrUser | custom (staff or owning client) | adminOrUser | adminOnly |
| ServiceItems | adminOrUser | adminOrUser | adminOrUser | adminOnly |
| Credentials | adminOrUser | adminOrProjectMember | adminOrUser | adminOnly |
| WebhookEvents | internal | adminOnly | adminOnly | adminOnly |
| Media | authenticated | anyone | authenticated | authenticated |
| Clients | authenticated | anyone | authenticated | authenticated |
| Leads | anyone | authenticated | authenticated | authenticated |
| Posts | authenticated | authenticatedOrPublished | authenticated | authenticated |
| Solutions | authenticated | authenticatedOrPublished | authenticated | authenticated |
| Pages | adminOnly | authenticatedOrPublished | adminOnly | adminOnly |
| Timelines | adminOrUser | anyone | adminOrUser | adminOnly |

## Hooks

All hooks in `src/lib/payload/hooks/`.

| File | Trigger | Purpose |
|------|---------|---------|
| `updateClientBalance.ts` | Orders `afterChange`, `afterDelete` | Recalculates `accountBalance` on ClientAccount by summing pending orders. Has retry logic for MongoDB write conflicts. |
| `beforeLogin.ts` | Users `beforeLogin` | **Currently passes all users through — 2FA is disabled.** See Authentication section. |
| `createClientAccount.ts` | Users `afterChange` | Auto-creates ClientAccount when a `role: 'client'` user is created. |
| `createStripeCustomer.ts` | ClientAccounts `beforeChange` | Finds or creates Stripe customer. Non-blocking. |
| `createShopifyCustomer.ts` | ClientAccounts `beforeChange` | Finds or creates Shopify customer via GraphQL. Non-blocking. |
| `syncUserToClientAccount.ts` | Users `afterChange` | Keeps ClientAccount email/name in sync with User. |
| `syncClientAccountToUser.ts` | ClientAccounts `afterChange` | Keeps User email/name in sync with ClientAccount. |
| `sendTwoFactorEmail.ts` | Users `afterChange` | Sends 2FA setup email. Part of account-setup 2FA (login 2FA is bypassed). |
| `sendClientWelcomeEmail.ts` | Users `afterChange` | Sends welcome email to newly created client users. Non-blocking. |
| `clearClientAccountOnDelete.ts` | ClientAccounts `afterDelete` | Clears the ClientAccount linkage on the associated User. |
| `revalidate.ts` | Posts + Solutions `afterChange`, `afterDelete` | `revalidatePath` for `/`, `/sonar`, `/sonar/[slug]`; also exports homepage/multi-path revalidate helpers. |

**Hook rules:**
1. Always pass `req` to nested Payload operations
2. Use context flags to prevent infinite loops — check AND set
3. External service hooks must be non-blocking — catch errors, log, never re-throw

## Integrations

All integrations use singletons and are non-blocking in hooks.

| Integration | Files | Key Behavior |
|------------|-------|-------------|
| **Stripe** | `src/lib/stripe.ts` | Singleton. API version `2025-12-15.clover`. Webhooks handled by `stripePlugin` in `payload.config.ts` (NOT an app route): `invoice.paid`, `invoice.payment_failed`, `invoice.voided`, `invoice.marked_uncollectible`. Idempotency via `WebhookEvents` collection. |
| **Shopify** | `src/lib/shopify/` | OAuth token cached in memory with auto-refresh. `customers.ts` does email lookup before create to prevent duplicates. |
| **Google Calendar** | `src/lib/google-calendar.ts` | Service account with lazy init. Creates events with Google Meet links. `getAvailableSlots()` returns free 1-hour slots 9AM–5PM. |
| **Email** | `src/lib/email/templates/` | Nodemailer via Gmail SMTP. All sends are non-blocking. See `/docs/EMAIL_TEMPLATES.md` for the full design standard — **always follow it when creating or modifying any email template**. |

## Custom Admin Components

Location: `src/components/payload/`. After adding or changing a component path, run `bun run payload generate:importmap`.

Components are registered in `payload.config.ts` using **file paths** (not direct imports), relative to the project root.

| Component | Type | Purpose |
|-----------|------|---------|
| `CustomLogin.tsx` | Client | 2FA login UI — email step then code step |
| `CustomAccount.tsx` | Client | Account management panel |
| `Logo.tsx` | Server | Admin panel logo |
| `Icon.tsx` | Server | Admin panel icon |
| `BeforeLogin.tsx` | Server | Pre-login banner |
| `SendInvoiceButton.tsx` | Client | Send invoice from Order edit view |
| `ConvertToClientButton.tsx` | Client | Convert Lead → ClientAccount + User |
| `actions/CreateOrderButton.tsx` | Client | Floating action in admin nav actions |
| `order-creation/` | Mixed | Order creation workflow (customer selector, product search, cart, invoice summary) |
| `MarkAsPaidButton.tsx` | Client | Mark an Order paid from the edit view |
| `PasskeyManager.tsx` | Client | Manage WebAuthn passkeys from the admin account panel |
| `timelines/` | Mixed | Timelines builder: custom admin view (`TimelinesBuilderView`), nav link (`afterNavLinks`), preview tab |

**UI field pattern** — presentational only, stores no data:

```typescript
{
  name: 'sendInvoiceButton',
  type: 'ui',
  admin: { components: { Field: '/components/payload/SendInvoiceButton' } },
}
```

**Client Component hooks** — import from `@payloadcms/ui`:
- `useAuth` — current user
- `useDocumentInfo` — document id, collection slug
- `useFormFields(([fields]) => fields[path])` — prefer over `useForm()` to avoid re-renders on every keystroke

## API Routes

### Authentication

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/request-login-code` | POST | Generate and email a login code |
| `/api/auth/verify-login-code` | POST | Verify code, create Payload session |
| `/api/auth/forgot-password` | POST | Send password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/complete-setup` | POST | Finish account setup |
| `/api/auth/passkey/*` | POST/GET | WebAuthn passkeys — `register-options`, `verify-register`, `authenticate-options`, `verify-authenticate`, `credentials` |
| `/api/auth/request-unlock`, `/api/auth/unlock-account` | POST | Locked-account recovery flow |
| `/api/resend-2fa`, `/api/verify-2fa` | POST | Account-setup 2FA verification |

### Business Logic

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/contact` | POST | Save Lead → Shopify customer → confirmation emails |
| `/api/booking` | POST | Create Lead + Google Calendar event |
| `/api/booking/available-slots` | GET | Available time slots for a given date |
| `/api/invoices/send` | POST | Send invoice email for an Order |
| `/api/stripe/payment-links` | POST | Create a Stripe payment link for an Order |
| `/api/orders/[id]/fulfill` | POST | Fulfill an order |
| `/api/timelines/[slug]/pdf` | GET | Timeline PDF export |
| `/api/users/theme` | POST | Save dashboard theme preference |
| `/api/projects/[project]/tasks` | GET, POST | List or create tasks |
| `/api/projects/[project]/sprints` | GET, POST | List or create sprints |
| `/api/users/[username]/projects` | GET | List projects for a user |
| `/api/health` | GET | Health check |

**Prefer Server Component queries over API routes** when inside `(spaces)/`. Server Components can call the Payload Local API directly:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

const payload = await getPayload({ config })
const { user } = await payload.auth({ headers: await headers() })
const { docs } = await payload.find({ collection: 'orders', user, overrideAccess: false })
```

## Authentication

**Login 2FA is bypassed** — `beforeLogin.ts` passes all authenticated users through (the file contains no re-enable scaffolding; enforcing 2FA again means writing the check back in). Account-setup 2FA (`sendTwoFactorEmail` hook, `/api/resend-2fa`, `/api/verify-2fa`) is still active.

| File | Purpose |
|------|---------|
| `src/lib/payload/utils/loginTwoFactor.ts` | Code generation, email sending, verification |
| `src/app/api/auth/request-login-code/route.ts` | Request code endpoint |
| `src/app/api/auth/verify-login-code/route.ts` | Verify code, create session |
| `src/lib/payload/hooks/beforeLogin.ts` | Currently: allow all |
| `src/components/payload/CustomLogin.tsx` | Login UI with email → code flow |

User fields: `loginTwoFactorCode`, `loginTwoFactorExpiry` (10 min TTL), `twoFactorCode`, `twoFactorExpiry`, `twoFactorVerified`

**Passkeys (WebAuthn) — active.** `Users.passkeyCredentials` array field; routes under `/api/auth/passkey/*`; `PasskeySetupPrompt` shows in the dashboard for users with no passkey (rendered by `u/[username]/layout.tsx`); `PasskeyManager` in the admin account panel; helpers in `utils/passkeyChallenge.ts` + `utils/passkeyRpConfig.ts` (built on `@simplewebauthn`).

**Account unlock**: `utils/unlockAccount.ts` + `/api/auth/request-unlock` + `/api/auth/unlock-account`.

## Development Workflow

### After schema changes

```bash
bun run payload:generate             # Always — keeps payload-types.ts current
bun run payload generate:importmap   # Only if component paths changed
bun run tsc --noEmit                 # Verify no TypeScript errors
```

### Adding a new collection

1. Create `src/lib/payload/collections/[name].ts` (new collections get their own file — only the six legacy ones live inline in `payload.config.ts`)
2. Import access functions from `src/lib/payload/access/index.ts`
3. Add hooks in `src/lib/payload/hooks/` following existing patterns
4. Register in `payload.config.ts` `collections` array
5. Run `bun run payload:generate`
6. Add `index: true` on any field used in `where` or `sort` queries; use the collection-level `indexes: [{ fields: [...] }]` array for compound indexes matching multi-field queries (`createdAt`/`updatedAt` are auto-indexed by Payload)

### Adding a new integration

1. Singleton client in `src/lib/[service].ts`
2. Operation functions in `src/lib/[service]/`
3. Hook attachments must be non-blocking (catch, log, don't re-throw)
4. Add idempotency tracking if webhooks are involved

## Business Context

ORCACLUB is a Technical Operations Development Studio. Two audiences: staff managing client work in the Payload admin, and clients viewing their own projects/orders in the `(spaces)/` portal.

**Service tiers:** Launch $1K–3K / Scale $3K–5K / Enterprise $6K–30K / Maintenance $300–1,200/mo

**Conversion funnel:**
```
/solutions/* (TOFU) → /project (BOFU) → /contact (Conversion)
/services/* (MOFU) ↗
```

**Key data flows:**
1. Contact form → Lead → Shopify customer → confirmation emails
2. Lead → ClientAccount + User → Stripe + Shopify sync via hooks
3. Order created → `updateClientBalance` → invoice sent → Stripe webhook → `paid` → balance recalculated

## Styling

- **Brand**: Intelligence cyan `#67e8f9` for CTAs and accents
- **Background**: Black with subtle gradients
- **Text hierarchy**: white → gray-300 → gray-400

### Font system

| Role | Font | Color |
|------|------|-------|
| ORCACLUB wordmark | `Cinzel_Decorative` (weight 700) — gothic display | `text-white` |
| Secondary labels (SPACES, EST, etc.) | System sans-serif (default) | `gradient-text` or `text-intelligence-cyan` |
| Body / legible text | System sans-serif (default) | `text-white` → `text-gray-300` → `text-gray-400` |

```tsx
// ORCACLUB wordmark — always Cinzel Decorative, always white
import { Cinzel_Decorative } from 'next/font/google'
const gothic = Cinzel_Decorative({ weight: '700', subsets: ['latin'] })

<span className={`${gothic.className} text-white`}>ORCACLUB</span>

// Secondary accent labels — regular font, gradient or cyan
<span className="text-sm font-semibold gradient-text tracking-widest">SPACES</span>
```

`gradient-text` is defined in `globals.css` — cyan to blue animated gradient on text. Never split ORCA/CLUB into separate colored spans on the wordmark — the full word is white in the gothic font.

**Path aliases** — always use these, never relative imports across directories:

```typescript
import config from '@payload-config'
import type { Order } from '@/types/payload-types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

## Common Gotchas

| Gotcha | Fix |
|--------|-----|
| Local API bypasses access control | Set `overrideAccess: false` when passing `user` |
| `payload-types.ts` is stale | Run `bun run payload:generate` after schema changes |
| Import map is stale | Run `bun run payload generate:importmap` after component path changes |
| Hook triggers itself infinitely | Use context flags — check AND set before the nested call |
| Nested operation in separate transaction | Add `req` to all nested Payload calls inside hooks |
| Stripe webhook processed twice | `WebhookEvents` collection handles idempotency — always check before processing |
| Shopify creates duplicate customer | `createCustomerSafely()` does email lookup first — use it |
| 2FA flow appears broken | It's intentionally disabled — `beforeLogin.ts` passes all users |
| Client can see another client's data | Missing `overrideAccess: false` in `(spaces)/` query |
| MongoDB write conflict in balance hook | `updateClientBalance.ts` has exponential retry — don't remove it |
| Dashboard view renders a blank/missing field | Staff loaders use `select` — add the field to the loader's `select` in `dashboard-data.ts` |
| New dashboard route shows nothing while loading | Add a `loading.tsx` (compose from `LoadingSkeleton.tsx`) — prefetch needs a loading boundary |
| Duplicate auth/doc fetches in `(spaces)` | Use `getSessionUser()` and the `detail-data.ts` `cache()` helpers — never raw `getCurrentUser`/`findByID` in both layout and page |
| Package manager errors | Always use `bun`, never npm/yarn/pnpm |

## Email System Rules

When creating or modifying any email template, **always read `/docs/EMAIL_TEMPLATES.md` first**. It contains:

- The full dark design standard (color tokens, typography, component snippets)
- When to use `baseEmailTemplate` vs a standalone template
- Copy-paste HTML for every reusable component (CTA, detail box, code display, warning, etc.)
- Step-by-step guide for creating a new template and registering it in `index.ts`
- The standard `payload.sendEmail()` sending pattern with logging
- Email client compatibility rules (inline styles only — Gmail strips `<style>` blocks entirely)

Key rules enforced by the doc:
- Never use `<style>` blocks or CSS classes — all styles must be inline
- Always send via `payload.sendEmail()`, never nodemailer directly
- Always include a plain text version
- ORCACLUB wordmark uses Cinzel Decorative font, split `#333333` ORCA / `#67e8f9` CLUB
- `from:` fallback is always `carbon@orcaclub.pro` (note: Gmail SMTP overrides this with `SMTP_USER` — see doc for fix options)

## Resources

- **Payload Docs**: https://payloadcms.com/docs
- **Payload LLM Context**: https://payloadcms.com/llms-full.txt (use via Context7 MCP)
- **Project Reference**: `/docs/ORCACLUB.md` — comprehensive architecture doc
- **Email Template Standard**: `/docs/EMAIL_TEMPLATES.md` — design system for all emails
- **Cursor Rules**: `.cursor/rules/` — deep-dive context files per topic
- **Project Admin**: http://localhost:3000/admin
