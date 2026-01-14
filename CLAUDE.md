# ORCACLUB - Payload CMS Development Guide

You are an expert Payload CMS developer working on ORCACLUB, a Technical Operations Development Studio platform. Follow these rules when developing.

## Environment

- **Runtime**: Bun (primary), Node.js (fallback)
- **Package Manager**: Bun (use `bun` instead of npm/yarn/pnpm)
- **Database**: MongoDB Atlas (via mongoose adapter)
- **Common Commands**:
  - `bun run bun:dev` - Start development server (fastest)
  - `bun run dev` - Standard dev server
  - `bun run build` - Build for production
  - `bun run payload:generate` - Generate Payload types
  - `bun run payload:migrate` - Run database migrations
  - `bun run lint` - Run linter

## Core Principles

1. **TypeScript-First**: Always use TypeScript with proper types from Payload
2. **Security-Critical**: Follow all security patterns, especially access control
3. **Type Generation**: Run `bun run payload:generate` after schema changes
4. **Transaction Safety**: Always pass `req` to nested operations in hooks
5. **Access Control**: Understand Local API bypasses access control by default
6. **Context Flags**: Use context flags to prevent infinite hook loops

### Code Validation

```bash
# Validate TypeScript
bun run tsc --noEmit

# Generate types after schema changes
bun run payload:generate
```

## Project Structure

```
src/
├── app/
│   ├── (frontend)/              # Public website routes
│   │   ├── project/             # Main conversion hub
│   │   ├── solutions/           # TOFU problem-solution pages
│   │   ├── services/            # MOFU service pages
│   │   ├── contact/             # Lead capture
│   │   ├── sonar/               # Blog system
│   │   └── layout.tsx
│   ├── (payload)/               # Payload admin routes
│   │   ├── admin/               # CMS admin interface
│   │   └── layout.tsx
│   ├── (dashboard)/             # Client dashboard (future)
│   │   └── login/u/[user]/      # User dashboard routes
│   └── api/                     # REST API endpoints
│       ├── auth/                # 2FA authentication endpoints
│       ├── booking/             # Consultation booking
│       ├── contact/             # Contact form
│       ├── stripe/              # Stripe webhooks & APIs
│       ├── shopify/             # Shopify integration
│       └── invoices/            # Invoice management
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Layout components (header, footer)
│   ├── sections/                # Page sections
│   └── payload/                 # Custom Payload admin components
│       ├── CustomLogin.tsx      # 2FA login UI
│       ├── CustomAccount.tsx    # Account management
│       ├── SendInvoiceButton.tsx
│       ├── ConvertToClientButton.tsx
│       └── order-creation/      # Order creation views
├── lib/
│   ├── payload/
│   │   ├── payload.config.ts    # Main Payload configuration
│   │   ├── hooks/               # Payload hooks
│   │   │   ├── revalidate.ts
│   │   │   ├── beforeLogin.ts
│   │   │   └── updateClientBalance.ts
│   │   └── utils/               # Payload utilities
│   │       ├── loginTwoFactor.ts
│   │       └── passwordReset.ts
│   ├── stripe.ts                # Stripe client
│   ├── shopify/                 # Shopify integration
│   ├── google-calendar.ts       # Google Calendar service
│   └── email/                   # Email templates
├── hooks/                       # React hooks
├── types/
│   └── payload-types.ts         # Generated Payload types
└── data/                        # Static data
```

## CRITICAL SECURITY PATTERNS

### 1. Local API Access Control (MOST IMPORTANT)

```typescript
// ❌ SECURITY BUG: Access control bypassed
await payload.find({
  collection: 'orders',
  user: someUser, // Ignored! Operation runs with ADMIN privileges
})

// ✅ SECURE: Enforces user permissions
await payload.find({
  collection: 'orders',
  user: someUser,
  overrideAccess: false, // REQUIRED when passing user
})

// ✅ Administrative operation (intentional bypass)
await payload.find({
  collection: 'orders',
  // No user, overrideAccess defaults to true - use for admin tasks
})
```

**Rule**: When passing `user` to Local API, ALWAYS set `overrideAccess: false`

### 2. Transaction Safety in Hooks

```typescript
// ❌ DATA CORRUPTION RISK: Separate transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.update({
        collection: 'client-accounts',
        id: doc.clientAccount,
        data: { lastOrderDate: new Date() },
        // Missing req - runs in separate transaction!
      })
    },
  ],
}

// ✅ ATOMIC: Same transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.update({
        collection: 'client-accounts',
        id: doc.clientAccount,
        data: { lastOrderDate: new Date() },
        req, // Maintains atomicity
      })
    },
  ],
}
```

**Rule**: ALWAYS pass `req` to nested operations in hooks

### 3. Prevent Infinite Hook Loops

```typescript
// ❌ INFINITE LOOP
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.update({
        collection: 'client-accounts',
        id: doc.clientAccount,
        data: { accountBalance: calculateBalance() },
        req,
      }) // Triggers afterChange again!
    },
  ],
}

// ✅ SAFE: Use context flag (pattern used in updateClientBalance.ts)
hooks: {
  afterChange: [
    async ({ doc, req, context }) => {
      if (context.skipBalanceUpdate) return

      await req.payload.update({
        collection: 'client-accounts',
        id: doc.clientAccount,
        data: { accountBalance: calculateBalance() },
        context: { skipBalanceUpdate: true },
        req,
      })
    },
  ],
}
```

## Access Control Patterns

### Reusable Access Functions

Create these in `src/lib/payload/access/` for consistency:

```typescript
import type { Access } from 'payload'

// Anyone (public)
export const anyone: Access = () => true

// Authenticated only
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

// Authenticated or published content
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

// Admin only
export const adminOnly: Access = ({ req: { user } }) => {
  return user?.role === 'admin'
}

// Admin or self (for user profiles)
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') return true
  return { id: { equals: user?.id } }
}
```

### Current Collection Access Patterns

| Collection | Create | Read | Update | Delete |
|------------|--------|------|--------|--------|
| **Users** | admin | authenticated | admin | admin |
| **Media** | authenticated | anyone | authenticated | authenticated |
| **Clients** | anyone | anyone | authenticated | authenticated |
| **Leads** | anyone | authenticated | authenticated | authenticated |
| **Posts** | authenticated | authenticatedOrPublished | authenticated | authenticated |
| **ClientAccounts** | authenticated | authenticated | authenticated | admin |
| **Orders** | authenticated | authenticated | authenticated | admin |

### Field-Level Access

```typescript
// Field access ONLY returns boolean (no query constraints)
{
  name: 'accountBalance',
  type: 'number',
  access: {
    read: ({ req: { user } }) => Boolean(user), // Only authenticated
    update: () => false, // Never directly updated (calculated via hooks)
  },
  admin: {
    readOnly: true,
  },
}
```

## Collections

### Current Collections (9 total)

1. **Users** - Admin users with 2FA
2. **Media** - File uploads (images)
3. **Clients** - Client logos for homepage
4. **Leads** - Contact/booking requests
5. **Categories** - Blog taxonomy
6. **Tags** - Blog keywords
7. **Posts** - Blog content with versioning
8. **ClientAccounts** - Client management with Stripe/Shopify sync
9. **Orders** - Financial records with balance tracking

### Collection Pattern

```typescript
import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Clients',
    defaultColumns: ['orderNumber', 'clientAccount', 'amount', 'status'],
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [updateClientBalance],
    afterDelete: [revertClientBalance],
  },
  fields: [
    { name: 'orderNumber', type: 'text', required: true, unique: true, index: true },
    { name: 'status', type: 'select', options: ['pending', 'paid', 'cancelled'] },
    { name: 'clientAccount', type: 'relationship', relationTo: 'client-accounts', required: true },
    { name: 'amount', type: 'number', required: true, min: 0 },
  ],
}
```

## Hooks

### Hook Patterns Used in This Project

#### Balance Calculation Hook (`updateClientBalance.ts`)

```typescript
// Pattern: Calculate derived data with loop prevention
export const updateClientBalance: CollectionAfterChangeHook = async ({
  doc,
  req,
  context,
}) => {
  // Prevent infinite loops
  if (context.skipBalanceUpdate) return doc

  const { payload } = req
  const clientAccountId = typeof doc.clientAccount === 'string'
    ? doc.clientAccount
    : doc.clientAccount?.id

  // Calculate balance from all pending orders
  const { docs: pendingOrders } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { clientAccount: { equals: clientAccountId } },
        { status: { equals: 'pending' } },
      ],
    },
    req,
  })

  const totalBalance = pendingOrders.reduce((sum, order) => sum + (order.amount || 0), 0)

  // Update with loop prevention flag
  await payload.update({
    collection: 'client-accounts',
    id: clientAccountId,
    data: { accountBalance: totalBalance },
    context: { skipBalanceUpdate: true },
    req,
  })

  return doc
}
```

#### Revalidation Hook (`revalidate.ts`)

```typescript
// Pattern: Next.js cache revalidation on content change
import { revalidatePath } from 'next/cache'

export const revalidateHomepage: CollectionAfterChangeHook = async ({ doc }) => {
  revalidatePath('/')
  return doc
}

// Multi-path revalidation for blog posts
export const createMultiPathRevalidate = (paths: string[]): CollectionAfterChangeHook => {
  return async ({ doc }) => {
    paths.forEach(path => revalidatePath(path))
    return doc
  }
}
```

#### Customer Creation Hooks

```typescript
// Pattern: Auto-create external service records
export const createStripeCustomerHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create') return data
  if (data.stripeCustomerId) return data // Already has one

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email: data.email,
    name: data.name,
  })

  return {
    ...data,
    stripeCustomerId: customer.id,
  }
}
```

### Hook Best Practices

1. **Always pass `req`** to nested Payload operations
2. **Use context flags** to prevent infinite loops
3. **Handle errors gracefully** - log but don't fail the main operation
4. **Use retry logic** for transient errors (network, database locks)
5. **Keep hooks focused** - one responsibility per hook

## Components

### Server vs Client Components

**All components are Server Components by default** (can use Local API directly):

```tsx
// Server Component (default) - components/payload/OrderStats.tsx
import { getPayload } from 'payload'
import config from '@payload-config'

async function OrderStats() {
  const payload = await getPayload({ config })
  const { totalDocs } = await payload.count({ collection: 'orders' })

  return <div>{totalDocs} orders</div>
}

export default OrderStats
```

**Client Components** need the `'use client'` directive:

```tsx
// Client Component - components/payload/SendInvoiceButton.tsx
'use client'
import { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export function SendInvoiceButton() {
  const [loading, setLoading] = useState(false)
  const { id } = useDocumentInfo()

  const handleSend = async () => {
    setLoading(true)
    await fetch(`/api/invoices/send`, {
      method: 'POST',
      body: JSON.stringify({ orderId: id }),
    })
    setLoading(false)
  }

  return (
    <button onClick={handleSend} disabled={loading}>
      {loading ? 'Sending...' : 'Send Invoice'}
    </button>
  )
}
```

### Custom Admin Components

**Location**: `src/components/payload/`

| Component | Type | Purpose |
|-----------|------|---------|
| `CustomLogin.tsx` | Client | 2FA login flow |
| `CustomAccount.tsx` | Client | Account management |
| `SendInvoiceButton.tsx` | Client | Send invoice from order |
| `ConvertToClientButton.tsx` | Client | Convert lead to client |
| `Logo.tsx` | Server | Admin panel logo |
| `Icon.tsx` | Server | Admin panel icon |
| `order-creation/*` | Mixed | Order creation workflow |

### Using Payload Hooks (Client Components Only)

```tsx
'use client'
import {
  useAuth,           // Current user
  useConfig,         // Payload config (client-safe)
  useDocumentInfo,   // Document info (id, collection, etc.)
  useField,          // Field value and setter
  useForm,           // Form state
  useFormFields,     // Multiple field values (optimized)
} from '@payloadcms/ui'

export function MyComponent() {
  const { user } = useAuth()
  const { id, collection } = useDocumentInfo()

  // ❌ BAD: Re-renders on every form change
  const { fields } = useForm()

  // ✅ GOOD: Only re-renders when specific field changes
  const status = useFormFields(([fields]) => fields.status?.value)

  return <div>Document {id} in {collection}</div>
}
```

## Integrations

### Stripe Integration

**File**: `src/lib/stripe.ts`

```typescript
import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-12-15.clover',
    })
  }
  return stripeInstance
}

// Webhook handler: /api/stripe/webhooks
// Events handled: invoice.paid, invoice.payment_failed, invoice.voided
```

### Shopify Integration

**Files**: `src/lib/shopify/`

- `admin-client.ts` - OAuth token management, GraphQL client
- `customers.ts` - Customer creation/lookup
- `products.ts` - Product queries
- `draft-orders.ts` - Draft order management

```typescript
// Pattern: Token caching with automatic refresh
let tokenCache: { token: string; expiry: number } | null = null

export async function getAdminToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiry - 300000) {
    return tokenCache.token
  }

  // Refresh token...
  const response = await fetch(/* OAuth endpoint */)
  const { access_token, expires_in } = await response.json()

  tokenCache = {
    token: access_token,
    expiry: Date.now() + expires_in * 1000,
  }

  return tokenCache.token
}
```

### Google Calendar Integration

**File**: `src/lib/google-calendar.ts`

```typescript
// Singleton pattern for service account auth
class GoogleCalendarService {
  private static instance: GoogleCalendarService
  private calendar: calendar_v3.Calendar | null = null

  static getInstance(): GoogleCalendarService {
    if (!this.instance) {
      this.instance = new GoogleCalendarService()
    }
    return this.instance
  }

  async createEvent(eventData: EventInput): Promise<calendar_v3.Schema$Event> {
    // Creates event with Google Meet link
  }

  async getAvailableSlots(date: Date): Promise<TimeSlot[]> {
    // Returns available 1-hour slots (9 AM - 5 PM)
  }
}
```

## Authentication & 2FA

### Overview

ORCACLUB uses a custom 2FA system for admin login:

1. User enters email/password → `/api/auth/request-login-code`
2. System validates credentials, sends 6-digit code via email
3. User enters code → `/api/auth/verify-login-code`
4. System validates code, creates session, redirects to `/admin`

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/payload/utils/loginTwoFactor.ts` | Code generation, email sending, verification |
| `src/app/api/auth/request-login-code/route.ts` | Request 2FA code endpoint |
| `src/app/api/auth/verify-login-code/route.ts` | Verify code and create session |
| `src/lib/payload/hooks/beforeLogin.ts` | Blocks direct login, requires 2FA |
| `src/components/payload/CustomLogin.tsx` | Custom login UI with 2FA flow |

### User Fields for 2FA

```typescript
// Account-level 2FA (one-time verification)
twoFactorCode: string | null
twoFactorExpiry: Date | null
twoFactorVerified: boolean

// Login-level 2FA (every login)
loginTwoFactorCode: string | null
loginTwoFactorExpiry: Date | null  // 10 minutes
```

### beforeLogin Hook Pattern

```typescript
// Enforces 2FA by blocking direct logins
export const beforeLoginHook: CollectionBeforeLoginHook = async ({ req, user }) => {
  // Check bypass flag from verify-login-code endpoint
  if (req.context?.bypassLoginTwoFactor === true) {
    return user // Allow login
  }

  // Block direct login attempts
  throw new Error('Please use the 2FA login flow')
}
```

## Common Gotchas

1. **Local API Default**: Access control bypassed unless `overrideAccess: false`
2. **Transaction Safety**: Missing `req` in nested operations breaks atomicity
3. **Hook Loops**: Operations in hooks can trigger the same hooks
4. **Field Access**: Cannot use query constraints, only boolean
5. **Relationship Depth**: Default depth is 2, set to 0 for IDs only
6. **Draft Status**: `_status` field auto-injected when drafts enabled
7. **Type Generation**: Types not updated until `bun run payload:generate` runs
8. **MongoDB Transactions**: Require replica set configuration
9. **Context Flags**: Must check AND set context flags to prevent loops
10. **Webhook Secrets**: Always verify signatures on incoming webhooks

## TypeScript Configuration

### Path Aliases

```json
{
  "paths": {
    "@payload-config": ["./src/lib/payload/payload.config.ts"],
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/ui/*": ["./src/components/ui/*"],
    "@/hooks/*": ["./src/hooks/*"],
    "@/types/*": ["./src/types/*"]
  }
}
```

### Import Best Practices

```typescript
// ✅ Preferred - Use TypeScript path aliases
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Order } from '@/types/payload-types'
import config from '@payload-config'

// ❌ Avoid relative imports across directories
import Button from '../../../components/ui/button'
```

## Styling

### Tailwind CSS v4

```css
/* globals.css */
@import "tailwindcss";
@plugin "tailwindcss-animate";

@theme {
  --font-sans: var(--font-montserrat), system-ui, sans-serif;
  --color-intelligence-cyan: #67e8f9;
  --radius: 0.5rem;
}

.gradient-text {
  background: linear-gradient(45deg, #67e8f9, #3b82f6, #1e40af, #67e8f9);
  background-size: 300% 300%;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 4s ease-in-out infinite;
}
```

### Brand Colors

- **Primary**: Intelligence cyan (`#67e8f9`)
- **Background**: Black with subtle gradients
- **Text**: White, gray-400, gray-300 hierarchy
- **Accents**: Cyan for CTAs

### ORCACLUB Logo Pattern

```tsx
<span className="font-bold text-white">ORCA</span>
<span className="font-bold gradient-text">CLUB</span>
```

## API Routes

### Authentication

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/request-login-code` | POST | Request 2FA code |
| `/api/auth/verify-login-code` | POST | Verify code, create session |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |

### Business Logic

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/contact` | POST | Submit contact form, create Lead |
| `/api/booking` | POST | Book consultation, create Calendar event |
| `/api/booking/available-slots` | GET | Get available time slots |
| `/api/invoices/send` | POST | Send invoice email |
| `/api/stripe/webhooks` | POST | Handle Stripe events |
| `/api/shopify/products` | POST | Search Shopify products |

## Development Workflow

### Starting Development

```bash
# Recommended (fastest)
bun run bun:dev

# Standard
bun run dev

# Access points
# App: http://localhost:3000
# Admin: http://localhost:3000/admin
# Health: http://localhost:3000/api/health
```

### After Schema Changes

```bash
# Generate TypeScript types
bun run payload:generate

# Run migrations if needed
bun run payload:migrate
```

### Building for Production

```bash
bun run build:production
```

## Business Context

### Service Model

ORCACLUB is a Technical Operations Development Studio offering:

- **Launch Tier**: $1K-3K, 3-5 days (CMS setup, hosting, responsive design)
- **Scale Tier**: $3K-5K, 7-10 days (+ 2 integrations, analytics, automation)
- **Enterprise Tier**: $6K-30K, 14-21 days (+ Shopify, custom APIs, admin dashboard)
- **Monthly Maintenance**: $300-1,200/mo

### Conversion Funnel

```
/solutions/* (TOFU) → /project (BOFU) → /contact (Conversion)
/services/* (MOFU) ↗
```

The `/project` page is the main conversion hub with all tier information.

### Key Data Flows

1. **Lead Capture**: Contact form → Lead collection → Shopify customer
2. **Booking**: Booking form → Lead + Google Calendar event
3. **Client Management**: Lead → ClientAccount (with Stripe/Shopify sync)
4. **Orders**: Order created → Balance calculated → Invoice sent

## Resources

- **Payload Docs**: https://payloadcms.com/docs
- **Payload LLM Context**: https://payloadcms.com/llms-full.txt
- **Payload GitHub**: https://github.com/payloadcms/payload
- **Project Admin**: http://localhost:3000/admin
