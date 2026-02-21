# ORCACLUB — Platform Reference

Technical Operations Development Studio. Full-stack business platform built on Payload CMS 3 + Next.js 15 + MongoDB Atlas.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [App Structure](#app-structure)
4. [Collections](#collections)
5. [Access Control](#access-control)
6. [Hooks](#hooks)
7. [Integrations](#integrations)
8. [API Routes](#api-routes)
9. [Custom Admin Components](#custom-admin-components)
10. [Client Dashboard](#client-dashboard)
11. [Key Data Flows](#key-data-flows)
12. [Development Workflow](#development-workflow)
13. [Security Rules](#security-rules)
14. [Environment Variables](#environment-variables)
15. [Common Gotchas](#common-gotchas)

---

## Architecture Overview

ORCACLUB has three distinct surfaces inside a single Next.js monorepo:

| Surface | Route Group | Who Uses It |
|---------|-------------|-------------|
| Public website | `app/(frontend)/` | Visitors, leads |
| Payload CMS admin | `app/(payload)/` | Staff, admins |
| Client portal | `app/(spaces)/` | Client users |

The CMS and Next.js share the same process — Payload is embedded, not a separate service. This means Server Components can query the database directly via the Local API without any HTTP roundtrip.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Bun | 1.2.15 |
| Framework | Next.js | 15.3 |
| CMS | Payload | 3.44.0 |
| Database | MongoDB Atlas (via mongoose adapter) | — |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS v4 | 4.1 |
| UI Components | shadcn/ui + Radix | — |
| Rich Text | Lexical editor | — |
| Email | Nodemailer (Gmail SMTP) | — |
| Payments | Stripe | 20.1 |
| E-commerce | Shopify Admin API | — |
| Calendar | Google Calendar (service account) | — |
| Animations | Framer Motion | 12.23 |
| Charts | Recharts | 2.15 |
| Forms | React Hook Form + Zod | — |

**Package manager:** Always use `bun`. Never npm/yarn/pnpm.

---

## App Structure

```
src/
├── app/
│   ├── (frontend)/              # Public website
│   │   ├── about/
│   │   ├── contact/
│   │   ├── packages/            # launch, scale, enterprise tier pages
│   │   ├── services/            # MOFU service pages (15+)
│   │   ├── solutions/           # TOFU problem-solution pages
│   │   ├── sonar/               # Blog (listing, posts, categories)
│   │   ├── portfolio/
│   │   ├── login/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── layout.tsx
│   ├── (payload)/               # Payload CMS admin
│   │   ├── admin/[[...segments]]/
│   │   ├── api/[...slug]/route.ts
│   │   ├── graphql/route.ts
│   │   └── layout.tsx
│   ├── (spaces)/                # Client portal
│   │   └── u/[username]/
│   │       ├── page.tsx         # Dashboard home
│   │       ├── clients/
│   │       ├── orders/
│   │       ├── projects/[project]/
│   │       └── tasks/
│   └── api/                     # REST API endpoints
│       ├── auth/                # 2FA + password reset
│       ├── booking/             # Calendar booking
│       ├── contact/             # Contact form
│       ├── invoices/            # Invoice sending
│       ├── projects/            # Project/task/sprint APIs
│       ├── stripe/              # Webhooks + payment links
│       └── users/               # User APIs
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── layout/                  # Header, footer, nav
│   ├── sections/                # Page sections (hero, services grid, etc.)
│   ├── dashboard/               # Client portal components (20+)
│   ├── auth/                    # Login/register forms
│   └── payload/                 # Custom Payload admin components
├── lib/
│   ├── payload/
│   │   ├── payload.config.ts    # Main Payload config
│   │   ├── collections/         # One file per collection
│   │   ├── hooks/               # Lifecycle hooks
│   │   ├── access/index.ts      # Shared access control functions
│   │   └── utils/               # loginTwoFactor, passwordReset, emails
│   ├── shopify/                 # admin-client, customers, products, draft-orders
│   ├── stripe.ts
│   ├── google-calendar.ts
│   └── email/templates/
├── hooks/                       # React hooks (client-side)
├── actions/                     # Next.js Server Actions
├── types/
│   └── payload-types.ts         # Auto-generated — never edit by hand
└── middleware.ts
```

---

## Collections

14 collections total, split into two categories.

### Business Operations

| Collection | Slug | Description |
|-----------|------|-------------|
| **Users** | `users` | Admin/staff/client authentication. Roles: `admin`, `user`, `client`. 2FA fields present. |
| **ClientAccounts** | `client-accounts` | Central client record. Holds Stripe customer ID, Shopify customer ID, account balance, linked orders and projects. |
| **Orders** | `orders` | Financial records with line items. Status: `pending → paid → cancelled/voided`. Triggers balance recalculation on every change. |
| **Projects** | `projects` | Project management. Linked to client account and assigned team members. Has milestones, budget, dates. |
| **Tasks** | `tasks` | Individual work items. Status, priority, sprint assignment, time tracking (estimated vs actual hours). |
| **Sprints** | `sprints` | Groups tasks into iterations per project. `completedTasksCount` and `totalTasksCount` are read-only calculated fields. |
| **Files** | `files` | Document management attached to projects or sprints. Versioning, tagging, categorization. |
| **WebhookEvents** | `webhook-events` | Stripe webhook idempotency tracker. Prevents duplicate order status updates on retried webhooks. |

### Content & Marketing

| Collection | Slug | Description |
|-----------|------|-------------|
| **Media** | `media` | File uploads with image resizing (thumbnail, card, logo sizes). |
| **Clients** | `clients` | Portfolio client logos shown on homepage. Has ordering and featured flag. |
| **Leads** | `leads` | Contact/booking form submissions. Status: `new → contacted → converted → lost`. Has `ConvertToClientButton` UI field. |
| **Categories** | `categories` | Blog taxonomy. |
| **Tags** | `tags` | Blog keywords. |
| **Posts** | `posts` | Blog content. Draft/publish versioning. Status-based read access (published = public). |

---

## Access Control

All access functions live in `src/lib/payload/access/index.ts`. Never inline access logic in collection configs — import from here.

### Available Functions

```typescript
anyone                    // Public — no auth required
authenticated             // Requires a logged-in user (any role)
authenticatedOrPublished  // Authenticated users OR published documents
adminOnly                 // role === 'admin' only
adminOrUser               // role === 'admin' OR role === 'user' (excludes clients)
adminOrAssigned           // Admins see all; users see only items assigned to them
adminOrProjectMember      // Admins see all; users see items from their assigned projects
adminOrOwnClient          // Admins see all; clients see only their own account data
adminOrSelf               // Admins see all; users see only their own user record
```

### Collection Access Matrix

| Collection | create | read | update | delete |
|-----------|--------|------|--------|--------|
| Users | adminOnly | adminOrSelf | adminOrSelf | adminOnly |
| ClientAccounts | authenticated | adminOrOwnClient | authenticated | adminOnly |
| Orders | authenticated | authenticated | authenticated | adminOnly |
| Projects | adminOrUser | adminOrAssigned | adminOrAssigned | adminOnly |
| Tasks | adminOrUser | adminOrAssigned | adminOrAssigned | adminOnly |
| Sprints | adminOrUser | adminOrProjectMember | adminOrProjectMember | adminOnly |
| Files | adminOrUser | adminOrProjectMember | adminOrProjectMember | adminOnly |
| WebhookEvents | — (internal) | adminOnly | adminOnly | adminOnly |
| Media | authenticated | anyone | authenticated | authenticated |
| Clients | authenticated | anyone | authenticated | authenticated |
| Leads | anyone | authenticated | authenticated | authenticated |
| Posts | authenticated | authenticatedOrPublished | authenticated | authenticated |

### Critical Rule — Local API + overrideAccess

When calling the Payload Local API with a `user`, you **must** set `overrideAccess: false` or access control is silently bypassed:

```typescript
// WRONG — user is ignored, runs as admin
await payload.find({ collection: 'orders', user })

// CORRECT — enforces user's permissions
await payload.find({ collection: 'orders', user, overrideAccess: false })
```

Every query in `app/(spaces)/` must follow this pattern. This is the highest-priority security rule.

---

## Hooks

All hooks in `src/lib/payload/hooks/`.

| File | Trigger | Purpose |
|------|---------|---------|
| `updateClientBalance.ts` | Orders `afterChange`, `afterDelete` | Recalculates `accountBalance` on ClientAccount by summing all pending orders. Uses retry logic for MongoDB write conflicts. |
| `beforeLogin.ts` | Users `beforeLogin` | Currently passes all authenticated users through. 2FA bypass is intentional — see note below. |
| `createClientAccount.ts` | Users `afterChange` | Auto-creates a ClientAccount when a user with `role: 'client'` is created. |
| `createStripeCustomer.ts` | ClientAccounts `beforeChange` | Finds or creates a Stripe customer. Non-blocking — logs error, doesn't fail account creation. |
| `createShopifyCustomer.ts` | ClientAccounts `beforeChange` | Finds or creates a Shopify customer via GraphQL. Non-blocking. |
| `syncUserToClientAccount.ts` | Users `afterChange` | Keeps ClientAccount email/name in sync when User record changes. |
| `syncClientAccountToUser.ts` | ClientAccounts `afterChange` | Keeps User email/name in sync when ClientAccount changes. |
| `sendTwoFactorEmail.ts` | Users `afterChange` | Sends 2FA setup email. Part of dormant 2FA system. |
| `revalidate.ts` | Posts `afterChange`, `afterDelete` | Calls `revalidatePath` for `/`, `/sonar`, `/sonar/[slug]`. |

### Hook Safety Rules

**1. Always pass `req` to nested operations** — maintains transaction atomicity:

```typescript
// CORRECT
await payload.update({
  collection: 'client-accounts',
  id: accountId,
  data: { accountBalance: total },
  req,  // required
})
```

**2. Always use context flags to prevent infinite loops:**

```typescript
// In the hook
if (context?.skipBalanceUpdate) return doc

// In the nested call
await payload.update({
  ...
  context: { skipBalanceUpdate: true },
  req,
})
```

**3. Make external service hooks non-blocking:**

```typescript
try {
  await createStripeCustomer(data)
} catch (error) {
  console.error('[createStripeCustomer] Failed:', error)
  // do NOT re-throw — let account creation succeed
}
```

### 2FA System Status

The 2FA flow (email code on every login) is **currently disabled**. `beforeLogin.ts` allows all authenticated users through. The infrastructure (fields, endpoints, `CustomLogin.tsx`, email templates) is still present.

To re-enable: restore the `bypassLoginTwoFactor` context check in `beforeLogin.ts`.
To remove: delete `loginTwoFactorCode`, `loginTwoFactorExpiry` fields from Users, simplify `beforeLogin.ts`, and remove the verify-login-code endpoint.

Do not leave it in an ambiguous half-state — pick one.

---

## Integrations

### Stripe — `src/lib/stripe.ts`

Singleton client. API version: `2025-12-15.clover`.

**Webhook flow** (`/api/stripe/webhooks`):
1. Verify signature with `STRIPE_WEBHOOK_SECRET`
2. Check `WebhookEvents` collection for duplicate (idempotency)
3. Mark event as `processing`
4. Handle `invoice.paid` → update Order status → triggers balance recalculation
5. Mark event as `processed` or `failed`

**Creating invoices:** done via the order creation workflow in the admin panel, which calls Stripe's invoice API and stores `stripeInvoiceId` on the Order.

### Shopify — `src/lib/shopify/`

| File | Purpose |
|------|---------|
| `admin-client.ts` | OAuth token caching + GraphQL request wrapper |
| `customers.ts` | Create/find customer by email. Returns `{ success, customerId, isDuplicate? }` |
| `products.ts` | Query products by title |
| `draft-orders.ts` | Create draft orders, add line items, generate invoice links |

Token is cached in memory with auto-refresh before expiry.

### Google Calendar — `src/lib/google-calendar.ts`

Singleton with lazy initialization. Uses service account with domain-wide delegation.

- `createEvent(data)` — creates event with Google Meet link, sends attendee invite
- `getAvailableSlots(date)` — returns free 1-hour slots between 9 AM–5 PM

Credentials loaded from `GOOGLE_SERVICE_ACCOUNT_KEY` env var (JSON string).

### Email — `src/lib/email/templates/`

Nodemailer via Gmail SMTP. Templates are functions returning HTML strings. All email sends are non-blocking — they log errors but never fail the parent operation.

Key templates: `contactConfirmation`, `contactAdminNotification`, invoice email, 2FA code email.

---

## API Routes

### Authentication

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/request-login-code` | POST | Generate and email a login code |
| `/api/auth/verify-login-code` | POST | Verify code, create Payload session |
| `/api/auth/forgot-password` | POST | Send password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/resend-2fa` | POST | Resend 2FA code |
| `/api/verify-2fa` | POST | Verify 2FA code |

### Business Logic

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/contact` | POST | Save Lead → Shopify customer → confirmation emails |
| `/api/booking` | POST | Create Lead + Google Calendar event |
| `/api/booking/available-slots` | GET | Return available time slots for a given date |
| `/api/invoices/send` | POST | Send invoice email for an Order |
| `/api/health` | GET | Health check |

### Stripe

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stripe/webhooks` | POST | Handle `invoice.paid`, `invoice.payment_failed`, `invoice.voided` |
| `/api/stripe/payment-links` | POST | Create a Stripe payment link for an Order |

### Project Management

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/projects/[project]/tasks` | GET, POST | List or create tasks for a project |
| `/api/projects/[project]/sprints` | GET, POST | List or create sprints for a project |
| `/api/users/[username]/projects` | GET | List projects for a user |

**Note:** Many of these routes can be replaced with direct Payload Local API calls in Server Components. Only use API routes when you need client-side fetching or external access.

---

## Custom Admin Components

All in `src/components/payload/`.

| Component | Type | Location in Admin | Purpose |
|-----------|------|-------------------|---------|
| `CustomLogin.tsx` | Client | Login view | 2FA login UI — email step then code step |
| `CustomAccount.tsx` | Client | Account view | Account management panel |
| `Logo.tsx` | Server | Nav header | ORCACLUB branded logo |
| `Icon.tsx` | Server | Browser tab | Admin panel icon |
| `BeforeLogin.tsx` | Server | Above login form | Pre-login banner |
| `SendInvoiceButton.tsx` | Client | Order edit view | Sends invoice email for current Order |
| `ConvertToClientButton.tsx` | Client | Lead edit view | Converts Lead → ClientAccount + User |
| `CreateOrderButton.tsx` | Client | Admin nav (actions) | Floating button to open order creation |
| `order-creation/` | Mixed | Custom admin view | Full order creation workflow (customer selector, product search, cart, invoice summary) |

After modifying any component path or adding a new one, run:

```bash
bun run payload generate:importmap
```

---

## Client Dashboard

Route group: `app/(spaces)/u/[username]/`

Protected by middleware — requires authenticated user with matching username.

| Route | Purpose |
|-------|---------|
| `/u/[username]` | Overview: balance, open orders, active projects |
| `/u/[username]/clients` | Client account list |
| `/u/[username]/clients/[client]` | Client account detail |
| `/u/[username]/projects` | Project list |
| `/u/[username]/projects/[project]` | Project detail: tasks, milestones, sprints, files |
| `/u/[username]/tasks` | Task list + kanban board |
| `/u/[username]/orders` | Order list, payment status, invoice links |

Dashboard components live in `src/components/dashboard/`. Key components: `AccountOverview`, `ProjectsList`, `TasksList`, `OrdersList`, `CreateProjectModal`, `CreateTaskSheet`, `ProjectTimeline`, `MilestonesSection`, `FloatingTaskManager`.

Visualization utilities: `ProgressRing`, `Sparkline`, `MiniBar`, `ActivityTimeline`.

---

## Key Data Flows

### Lead → Client Conversion

```
Contact form submit
  → POST /api/contact
  → Create Lead (status: 'new')                    ← never skipped
  → Create Shopify customer                         ← non-blocking
  → Send confirmation email to lead                 ← non-blocking
  → Send notification email to admin                ← non-blocking

Admin reviews Lead in CMS
  → Clicks "Convert to Client" button
  → POST /api/leads/[id]/convert
  → Create ClientAccount
  → Create User (role: 'client')
  → Hooks: createStripeCustomer, createShopifyCustomer, syncUserToClientAccount
```

### Order → Invoice → Payment

```
Admin creates Order (status: 'pending')
  → afterChange hook: updateClientBalance
  → accountBalance = sum of all pending orders

Admin clicks "Send Invoice"
  → POST /api/invoices/send
  → Creates Stripe Invoice with line items
  → Stores stripeInvoiceId on Order
  → Sends invoice email to client

Client pays Stripe invoice
  → POST /api/stripe/webhooks (invoice.paid)
  → Idempotency check via WebhookEvents
  → Order status → 'paid'
  → afterChange hook: updateClientBalance
  → accountBalance recalculated (paid orders excluded)
```

### Content Publishing

```
Admin creates/edits Post (draft)
  → afterChange hook: revalidate
  → revalidatePath('/'), revalidatePath('/sonar'), revalidatePath('/sonar/[slug]')
  → Next.js ISR cache cleared
```

---

## Development Workflow

### Starting the server

```bash
bun run bun:dev     # Recommended — fastest
bun run dev         # Standard
```

Access points: `http://localhost:3000` (app), `http://localhost:3000/admin` (CMS).

### After schema changes

```bash
bun run payload:generate            # Regenerate payload-types.ts
bun run payload generate:importmap  # Regenerate import map (if components changed)
```

**Never edit `src/types/payload-types.ts` by hand.** It is fully auto-generated.

### Validating TypeScript

```bash
bun run tsc --noEmit
```

### Adding a new collection

1. Create `src/lib/payload/collections/[name].ts`
2. Import access functions from `src/lib/payload/access/index.ts`
3. Add hooks in `src/lib/payload/hooks/` (follow existing patterns)
4. Register in `payload.config.ts` `collections` array
5. Run `bun run payload:generate`
6. Add index fields on any field used in `where` queries

### Adding a new integration

1. Create singleton client in `src/lib/[service].ts`
2. Create operation functions in `src/lib/[service]/`
3. Attach via `beforeChange` or `afterChange` hook
4. Make the hook non-blocking (catch errors, log, don't re-throw)
5. Add idempotency tracking if webhooks are involved

### Building for production

```bash
bun run build:production
```

---

## Security Rules

These are non-negotiable. Review before every PR.

**1. `overrideAccess: false` when passing a user**
```typescript
// Any call in (spaces)/ or with a user context
await payload.find({
  collection: 'orders',
  user,
  overrideAccess: false,  // REQUIRED
})
```

**2. Always pass `req` in hooks**
```typescript
await payload.update({ collection: 'client-accounts', id, data, req })
```

**3. Always use context flags to prevent hook loops**
```typescript
if (context?.skipBalanceUpdate) return doc
// ...
context: { skipBalanceUpdate: true }
```

**4. Always verify webhook signatures**
```typescript
stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
```

**5. Validate all user input with Zod before any database operation**

**6. Never commit `.env.local`**

**7. Field-level access returns only boolean** — no query constraints at field level, only at collection level.

---

## Environment Variables

```bash
# Database
DATABASE_URI=mongodb+srv://...

# Payload
PAYLOAD_SECRET=                    # Long random string

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=                         # App-specific password
EMAIL_FROM=chance@orcaclub.pro
EMAIL_FROM_NAME=ORCACLUB

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Shopify
SHOPIFY_STORE=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_KEY=        # Full JSON string of service account credentials
GOOGLE_CALENDAR_ID=primary
GOOGLE_DELEGATED_USER_EMAIL=

# App
NEXT_PUBLIC_SERVER_URL=https://orcaclub.pro
```

---

## Common Gotchas

| Gotcha | Detail |
|--------|--------|
| Local API bypasses access control | Always set `overrideAccess: false` when passing `user` |
| `payload-types.ts` is stale | Run `bun run payload:generate` after any schema change |
| Import map is stale | Run `bun run payload generate:importmap` after adding/changing component paths |
| Hook triggers its own afterChange | Use context flags (`skipBalanceUpdate`, etc.) |
| Nested hook operation in separate transaction | Missing `req` in nested calls breaks atomicity |
| MongoDB write conflicts | The balance hook has retry logic — don't remove it |
| Stripe webhook fired twice | `WebhookEvents` collection handles idempotency — always check it |
| Google Calendar missing credentials | Lazy init returns null gracefully — check env var is valid JSON |
| Shopify duplicate customer | `createCustomerSafely()` detects duplicates via email lookup first |
| 2FA is disabled | `beforeLogin.ts` currently passes all through — don't confuse with a bug |
| Client sees other client's data | Missing `overrideAccess: false` in `(spaces)/` queries |
| `bun` vs `npm` | Always use `bun`. Scripts are tuned for Bun's module resolution. |
