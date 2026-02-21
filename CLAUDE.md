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
│   ├── (payload)/        # Payload admin (CMS interface)
│   ├── (spaces)/         # Client portal
│   │   └── u/[username]/ # Dashboard: clients/, orders/, projects/[project]/, tasks/
│   └── api/              # REST endpoints (see API Routes section)
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Header, footer, nav
│   ├── sections/         # Page sections (hero, services grid, etc.)
│   ├── dashboard/        # Client portal components
│   └── payload/          # Custom Payload admin components (see Components section)
├── lib/
│   ├── payload/
│   │   ├── payload.config.ts   # Main Payload config
│   │   ├── collections/        # One file per collection
│   │   ├── hooks/              # Lifecycle hooks (see Hooks section)
│   │   ├── access/index.ts     # All shared access control functions
│   │   └── utils/              # loginTwoFactor.ts, passwordReset.ts
│   ├── shopify/          # admin-client.ts, customers.ts, products.ts, draft-orders.ts
│   ├── stripe.ts         # Stripe singleton client
│   ├── google-calendar.ts
│   └── email/templates/
├── hooks/                # React hooks (client-side)
├── actions/              # Next.js Server Actions
└── types/payload-types.ts  # Auto-generated — never edit by hand
```

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

## Collections (14 total)

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
| WebhookEvents | `webhook-events` | Stripe webhook idempotency tracker | — |

### Content & Marketing

| Collection | Slug | Purpose |
|-----------|------|---------|
| Media | `media` | File uploads with image resizing (thumbnail, card, logo) |
| Clients | `clients` | Portfolio logos on homepage |
| Leads | `leads` | Contact/booking submissions. Status: `new → contacted → converted → lost` |
| Categories | `categories` | Blog taxonomy |
| Tags | `tags` | Blog keywords |
| Posts | `posts` | Blog content with draft/publish versioning | `revalidate` (afterChange + afterDelete) |

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
| WebhookEvents | internal | adminOnly | adminOnly | adminOnly |
| Media | authenticated | anyone | authenticated | authenticated |
| Clients | authenticated | anyone | authenticated | authenticated |
| Leads | anyone | authenticated | authenticated | authenticated |
| Posts | authenticated | authenticatedOrPublished | authenticated | authenticated |

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
| `sendTwoFactorEmail.ts` | Users `afterChange` | Sends 2FA setup email. Part of dormant 2FA system. |
| `revalidate.ts` | Posts `afterChange`, `afterDelete` | Calls `revalidatePath` for `/`, `/sonar`, `/sonar/[slug]`. |

**Hook rules:**
1. Always pass `req` to nested Payload operations
2. Use context flags to prevent infinite loops — check AND set
3. External service hooks must be non-blocking — catch errors, log, never re-throw

## Integrations

All integrations use singletons and are non-blocking in hooks.

| Integration | Files | Key Behavior |
|------------|-------|-------------|
| **Stripe** | `src/lib/stripe.ts` | Singleton. API version `2025-12-15.clover`. Webhooks: `invoice.paid`, `invoice.payment_failed`, `invoice.voided`. Idempotency via `WebhookEvents` collection. |
| **Shopify** | `src/lib/shopify/` | OAuth token cached in memory with auto-refresh. `customers.ts` does email lookup before create to prevent duplicates. |
| **Google Calendar** | `src/lib/google-calendar.ts` | Service account with lazy init. Creates events with Google Meet links. `getAvailableSlots()` returns free 1-hour slots 9AM–5PM. |
| **Email** | `src/lib/email/templates/` | Nodemailer via Gmail SMTP. All sends are non-blocking. |

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
| `CreateOrderButton.tsx` | Client | Floating action in admin nav actions |
| `order-creation/` | Mixed | Order creation workflow (customer selector, product search, cart, invoice summary) |

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

### Business Logic

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/contact` | POST | Save Lead → Shopify customer → confirmation emails |
| `/api/booking` | POST | Create Lead + Google Calendar event |
| `/api/booking/available-slots` | GET | Available time slots for a given date |
| `/api/invoices/send` | POST | Send invoice email for an Order |
| `/api/stripe/webhooks` | POST | Handle Stripe invoice events |
| `/api/stripe/payment-links` | POST | Create a Stripe payment link for an Order |
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

## Authentication & 2FA

The 2FA infrastructure is built but **currently disabled** — `beforeLogin.ts` passes all authenticated users through.

| File | Purpose |
|------|---------|
| `src/lib/payload/utils/loginTwoFactor.ts` | Code generation, email sending, verification |
| `src/app/api/auth/request-login-code/route.ts` | Request code endpoint |
| `src/app/api/auth/verify-login-code/route.ts` | Verify code, create session |
| `src/lib/payload/hooks/beforeLogin.ts` | Currently: allow all. To re-enable: restore `bypassLoginTwoFactor` context check. |
| `src/components/payload/CustomLogin.tsx` | Login UI with email → code flow |

User fields: `loginTwoFactorCode`, `loginTwoFactorExpiry` (10 min TTL), `twoFactorCode`, `twoFactorExpiry`, `twoFactorVerified`

## Development Workflow

### After schema changes

```bash
bun run payload:generate             # Always — keeps payload-types.ts current
bun run payload generate:importmap   # Only if component paths changed
bun run tsc --noEmit                 # Verify no TypeScript errors
```

### Adding a new collection

1. Create `src/lib/payload/collections/[name].ts`
2. Import access functions from `src/lib/payload/access/index.ts`
3. Add hooks in `src/lib/payload/hooks/` following existing patterns
4. Register in `payload.config.ts` `collections` array
5. Run `bun run payload:generate`
6. Add `index: true` on any field used in `where` queries

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

```tsx
// Logo pattern
<span className="font-bold text-white">ORCA</span>
<span className="font-bold gradient-text">CLUB</span>
```

`gradient-text` is defined in `globals.css` — cyan to blue animated gradient on text.

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
| Package manager errors | Always use `bun`, never npm/yarn/pnpm |

## Resources

- **Payload Docs**: https://payloadcms.com/docs
- **Payload LLM Context**: https://payloadcms.com/llms-full.txt (use via Context7 MCP)
- **Project Reference**: `/docs/ORCACLUB.md` — comprehensive architecture doc
- **Cursor Rules**: `.cursor/rules/` — deep-dive context files per topic
- **Project Admin**: http://localhost:3000/admin
