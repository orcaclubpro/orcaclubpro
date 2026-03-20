# Stripe Migration Guide

## Current State (Option A — Completed)

The `@payloadcms/plugin-stripe` is installed and configured for webhook routing only.
The plugin owns signature verification and event dispatch. All business logic remains in
custom handlers. No schema changes were made.

### What was changed

| Before | After |
|--------|-------|
| `src/app/api/stripe/webhooks/route.ts` — 437-line custom route | **Deleted** |
| `updateClientBalance.ts` — inline `retryOnTransientError` function | Imports from shared util |
| `payload.config.ts` plugins array | Added `stripePlugin(...)` |

### What was added

```
src/lib/stripe/
  retry.ts             — shared retryOnTransientError utility (was duplicated in 2 files)
  webhook-handlers.ts  — handleInvoicePaid, handleInvoicePaymentFailed, handleInvoiceVoided
```

### How the webhook flow works now

```
Stripe → POST /api/stripe/webhooks (plugin-owned route)
  → Plugin verifies signature (STRIPE_WEBHOOK_SECRET)
  → Plugin dispatches to handler based on event.type:
      invoice.paid               → handleInvoicePaid()
      invoice.payment_failed     → handleInvoicePaymentFailed()
      invoice.voided             → handleInvoiceVoided()
      invoice.marked_uncollectible → handleInvoiceVoided()
  → Each handler:
      1. Idempotency check  (WebhookEvents collection)
      2. Acquire lock       (create WebhookEvent status='processing')
      3. Resolve Order      (metadata.orcaclub_order_id → stripeInvoiceId fallback)
      4. Business logic     (update order status)
      5. Mark processed     (WebhookEvent status='processed')
```

### Plugin config in payload.config.ts

```typescript
stripePlugin({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
  webhooks: {
    'invoice.paid':                 (args) => handleInvoicePaid(args),
    'invoice.payment_failed':       (args) => handleInvoicePaymentFailed(args),
    'invoice.voided':               (args) => handleInvoiceVoided(args),
    'invoice.marked_uncollectible': (args) => handleInvoiceVoided(args),
  },
})
```

### Environment variables required (unchanged)

```bash
STRIPE_SECRET_KEY           # sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET       # whsec_... from Stripe dashboard webhook endpoint
```

> The Stripe dashboard webhook endpoint URL is unchanged: `https://orcaclub.pro/api/stripe/webhooks`

---

## Option B — Full Plugin Migration (Future)

Option B adds two-way customer sync between `client-accounts` and Stripe customers.
The plugin injects a `stripeID` field and handles create/update/delete automatically.

### What Option B adds on top of Option A

- `sync` array in `stripePlugin` config — maps `client-accounts` ↔ Stripe `customers`
- Custom `beforeValidate` hook for find-or-create (email dedup — plugin doesn't have this built in)
- Removes `createStripeCustomer.ts` hook (replaced by plugin sync)
- Field rename: `stripeCustomerId` → `stripeID` everywhere (~30 locations)
- Two-way sync: Stripe customer updates (email/name changed in Stripe dashboard) flow back to Payload automatically via webhook

### Step-by-step

#### Step 1 — Add `beforeValidate` find-or-create hook to ClientAccounts

The plugin's `beforeValidate` hook always calls `stripe.customers.create()` on new documents.
To preserve email-based deduplication, add this hook to the `ClientAccounts` collection **before**
the plugin appends its own hook (collection-defined hooks run first):

```typescript
// src/lib/payload/hooks/findOrLinkStripeCustomer.ts
import type { CollectionBeforeValidateHook } from 'payload'
import { getStripe } from '@/lib/stripe'

export const findOrLinkStripeCustomer: CollectionBeforeValidateHook = async ({
  data,
  operation,
}) => {
  if (operation !== 'create' || !data?.email) return data

  const stripe = getStripe()

  try {
    const existing = await stripe.customers.list({ email: data.email, limit: 1 })
    if (existing.data.length > 0) {
      // Pre-populate stripeID so plugin skips creation entirely
      data.stripeID = existing.data[0].id
      data.skipSync = true
    }
  } catch (err) {
    console.error('[findOrLinkStripeCustomer] Stripe lookup failed:', err)
    // Non-blocking — allow creation to proceed without a stripeID
  }

  return data
}
```

Add to `ClientAccounts.ts` collection hooks:
```typescript
hooks: {
  beforeValidate: [findOrLinkStripeCustomer], // MUST be before plugin appends its hook
  // ... existing hooks
}
```

#### Step 2 — Update `stripePlugin` config to add `sync`

```typescript
stripePlugin({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
  sync: [
    {
      collection: 'client-accounts',
      stripeResourceType: 'customers',
      stripeResourceTypeSingular: 'customer',
      fields: [
        { fieldPath: 'name',  stripeProperty: 'name' },
        { fieldPath: 'email', stripeProperty: 'email' },
      ],
    },
  ],
  webhooks: {
    'invoice.paid':                 (args) => handleInvoicePaid(args),
    'invoice.payment_failed':       (args) => handleInvoicePaymentFailed(args),
    'invoice.voided':               (args) => handleInvoiceVoided(args),
    'invoice.marked_uncollectible': (args) => handleInvoiceVoided(args),
  },
})
```

#### Step 3 — Remove `createStripeCustomer.ts` hook from ClientAccounts

The `sync` array replaces it. Remove from `ClientAccounts.ts`:
```typescript
// Remove this import:
import { createStripeCustomerHook } from '../hooks/createStripeCustomer'

// Remove from hooks.beforeChange:
beforeChange: [createStripeCustomerHook, ...]  →  beforeChange: [...]
```

Then delete `src/lib/payload/hooks/createStripeCustomer.ts`.

#### Step 4 — Field rename: `stripeCustomerId` → `stripeID`

The plugin injects `stripeID` (hardcoded name) — not configurable. Every reference to
`stripeCustomerId` on `ClientAccounts` documents must be updated.

Files to update (confirmed locations from audit):

| File | Lines | Change |
|------|-------|--------|
| `src/lib/payload/collections/ClientAccounts.ts` | field definition | Remove `stripeCustomerId`, plugin injects `stripeID` |
| `src/app/api/stripe/payment-links/route.ts` | ~144, ~172, ~199 | `.stripeCustomerId` → `.stripeID` |
| `src/actions/orders.ts` | 113, 135 | `order.stripeCustomerId` → derive from `order.clientAccount.stripeID` |
| `src/actions/billing.ts` | 35, 49 | `clientAccount.stripeCustomerId` → `clientAccount.stripeID` |
| `src/actions/packages.ts` | ~25 locations | `clientAccount.stripeCustomerId` → `clientAccount.stripeID` |

After all edits:
```bash
bun run payload:generate   # regenerates payload-types.ts with stripeID field
bun run tsc --noEmit       # verify no missed references
```

#### Step 5 — Update Stripe dashboard webhook (if needed)

The plugin webhook endpoint URL is the same (`/api/stripe/webhooks`) — no dashboard change needed.
However, Stripe will now also send `customer.created`, `customer.updated`, `customer.deleted` events
if you have those enabled. The plugin handles them internally via `handleCreatedOrUpdated` /
`handleDeleted` — they sync changes back to Payload `client-accounts`.

If you don't want bidirectional sync triggered by Stripe-side changes, do not enable
`customer.*` events in the Stripe dashboard webhook config.

### Option B risk summary

| Risk | Mitigation |
|------|------------|
| Missed `stripeCustomerId` reference → runtime error | `bun run tsc --noEmit` catches all before deploy |
| Plugin creates duplicate Stripe customer on `create` | `findOrLinkStripeCustomer` beforeValidate hook pre-empts it |
| Plugin deletes Stripe customer when ClientAccount deleted | Expected behavior — if not wanted, set `skipSync: true` in `afterDelete` hook before plugin runs |
| `packages.ts` has ~25 references — easy to miss | Run TypeScript check, grep for `stripeCustomerId` before merging |

---

## Option C — No Plugin (Reference Only)

If the plugin is ever removed, the original approach was a fully custom webhook route at
`src/app/api/stripe/webhooks/route.ts`. The handlers in `src/lib/stripe/webhook-handlers.ts`
can be re-wired to a Next.js route without the plugin by:

1. Recreating `src/app/api/stripe/webhooks/route.ts` with manual signature verification
2. Calling `handleInvoicePaid`, `handleInvoicePaymentFailed`, `handleInvoiceVoided` from the route's `switch (event.type)` block
3. Removing `stripePlugin` from `payload.config.ts`

The `retryOnTransientError` util at `src/lib/stripe/retry.ts` is used by both paths.

---

## Architecture Reference

```
src/lib/stripe/
  retry.ts              — shared MongoDB write-conflict retry (exponential backoff)
  webhook-handlers.ts   — invoice event handlers (paid / failed / voided)

src/lib/payload/
  hooks/
    createStripeCustomer.ts     — beforeChange on ClientAccounts: find-or-create Stripe customer
    updateClientBalance.ts      — afterChange/afterDelete on Orders: recalc accountBalance
  collections/
    ClientAccounts.ts           — stripeCustomerId field (becomes stripeID in Option B)
    Orders.ts                   — stripeInvoiceId, stripeInvoiceUrl, stripeCustomerId fields
    WebhookEvents.ts            — idempotency tracker (eventId unique index)

src/app/api/stripe/
  payment-links/route.ts        — creates Stripe invoice + Payload Order (10-step flow)
  webhooks/route.ts             — DELETED (plugin owns this route now)

src/actions/
  orders.ts                     — updateOrderDueDate, updateOrderLineItems, markOrderAsPaid, deleteOrder
  billing.ts                    — createBillingPortalSession (Stripe Customer Portal)
```

### Key data flow (unchanged by Option A)

```
Admin creates order:
  /admin/order → POST /api/stripe/payment-links
    1. Find or create ClientAccount
    2. createStripeCustomer hook → stripeCustomerId on ClientAccount
    3. Create Order record (Payload)
    4. stripe.invoiceItems.create() × lineItems
    5. stripe.invoices.create() + finalizeInvoice()
    6. Update Order with stripeInvoiceId + stripeInvoiceUrl

Client pays:
  Stripe hosted invoice page → payment processed by Stripe

Stripe fires webhook:
  POST /api/stripe/webhooks (plugin route)
    → handleInvoicePaid()
    → payload.update({ collection: 'orders', status: 'paid' })
    → updateClientBalance hook fires (afterChange)
    → ClientAccount.accountBalance recalculated
    → sendPaymentConfirmationEmails() (non-blocking)
```
