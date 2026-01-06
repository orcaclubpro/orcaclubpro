# Stripe Integration Setup Guide

## Overview

This guide explains how Stripe is configured in the ORCACLUB project for creating payment links and processing payments.

## Environment Variables

Your Stripe API keys have been configured in `.env.local`:

```bash
# Stripe Configuration
# Public key (safe to expose in client-side code)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Secret key (NEVER expose this in client-side code)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### Key Types Explained

**Publishable Key (`pk_test_...`):**
- ✅ Safe to expose in client-side JavaScript
- Used for Stripe.js on the frontend
- Can only create tokens and setup intents
- Prefixed with `NEXT_PUBLIC_` to make it available to the browser

**Secret Key (`sk_test_...`):**
- ❌ NEVER expose in client-side code
- Used for server-side operations only
- Has full access to your Stripe account
- Keep this in `.env.local` (never commit to git)

**Test vs Live Keys:**
- `pk_test_` and `sk_test_` = Test mode (fake payments)
- `pk_live_` and `sk_live_` = Live mode (real payments)
- Your current keys are test keys, which is perfect for development

## File Structure

```
src/
├── lib/
│   └── stripe.ts                      # Stripe client configuration
├── app/
│   └── api/
│       └── stripe/
│           └── payment-links/
│               └── route.ts           # Payment link creation API
└── components/
    └── payload/
        └── order-creation/
            ├── OrderTypeSidebar.tsx   # Order type selector
            ├── StripeProductForm.tsx  # Stripe product form
            └── StripeCartSidebar.tsx  # Stripe cart display
```

## Core Implementation

### 1. Stripe Client (`src/lib/stripe.ts`)

This file provides a lazily-initialized Stripe client following best practices:

```typescript
import { getStripe } from '@/lib/stripe'

// Server-side usage
const stripe = getStripe()
const customers = await stripe.customers.list()

// Check if in test mode
const isTest = isTestMode() // Returns true for test keys

// Get publishable key for client
const pubKey = getPublishableKey()
```

**Features:**
- Lazy initialization (prevents build-time errors)
- Type-safe TypeScript implementation
- Proper error handling
- App info metadata for Stripe dashboard

### 2. Payment Links API (`src/app/api/stripe/payment-links/route.ts`)

Creates Stripe Payment Links for custom products/services:

```typescript
POST /api/stripe/payment-links

Request Body:
{
  "customerEmail": "customer@example.com",
  "lineItems": [
    {
      "title": "Premium Web Development",
      "description": "Custom Next.js website",
      "unitPrice": 3000.00,
      "quantity": 1,
      "isRecurring": false
    },
    {
      "title": "Monthly Maintenance",
      "description": "Ongoing support and updates",
      "unitPrice": 300.00,
      "quantity": 1,
      "isRecurring": true,
      "recurringInterval": "month"
    }
  ]
}

Response:
{
  "success": true,
  "paymentLink": "https://buy.stripe.com/test_...",
  "paymentLinkId": "plink_..."
}
```

**How it works:**
1. Creates a Stripe Product for each line item
2. Creates a Price (one-time or recurring) for each product
3. Generates a Payment Link with all items
4. Returns shareable URL to send to customers

### 3. Order Creation UI

The admin order page (`/admin/order`) now supports both Shopify and Stripe:

**OrderTypeSidebar** - Choose between Shopify or Stripe
**StripeProductForm** - Create custom products with:
- Product/Service name and description
- Quantity and unit price
- Recurring payment toggle (monthly/yearly)

**StripeCartSidebar** - View cart with:
- All added items
- Quantity adjustment
- Subtotal calculation
- Recurring payment indicators

## Usage Examples

### Creating a One-Time Payment

```typescript
// In your API route or server component
import { getStripe } from '@/lib/stripe'

const stripe = getStripe()

// Create a product
const product = await stripe.products.create({
  name: 'Website Development - Launch Tier',
  description: '3-5 day website launch',
})

// Create a price
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 200000, // $2000.00 in cents
  currency: 'usd',
})

// Create a payment link
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{ price: price.id, quantity: 1 }],
})

console.log('Send this to customer:', paymentLink.url)
```

### Creating a Recurring Subscription

```typescript
import { getStripe } from '@/lib/stripe'

const stripe = getStripe()

// Create a product
const product = await stripe.products.create({
  name: 'Essential Care - Monthly Maintenance',
  description: 'Monthly website maintenance and support',
})

// Create a recurring price
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 30000, // $300.00/month in cents
  currency: 'usd',
  recurring: {
    interval: 'month',
  },
})

// Create a payment link
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{ price: price.id, quantity: 1 }],
})

console.log('Subscription link:', paymentLink.url)
```

### Using the Payment Links API

From the admin order page, when Stripe mode is selected:

```typescript
// This is handled automatically by OrderCreationClient
const response = await fetch('/api/stripe/payment-links', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerEmail: 'customer@example.com',
    lineItems: stripeLineItems, // From cart
  }),
})

const { paymentLink, paymentLinkId } = await response.json()
// Send paymentLink to customer via email or direct link
```

## Integration with Order Flow

### Step 1: Select Order Type
- User chooses **Stripe** from OrderTypeSidebar
- System switches to Stripe product form

### Step 2: Add Products
- User fills in product details in StripeProductForm
- Can toggle recurring payments
- Items added to StripeCartSidebar

### Step 3: Review & Create
- User reviews all items in OrderSummary
- System calls `/api/stripe/payment-links`
- Payment link generated and displayed to admin
- Admin can copy link and send to customer

## Testing Your Integration

### Test Cards

Stripe provides test cards for different scenarios:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Authentication: 4000 0025 0000 3155

Use any future expiry date and any 3-digit CVC
```

### Testing Payment Links

1. Start the dev server: `bun run bun:dev`
2. Navigate to `/admin/order`
3. Select "Stripe Payment" from sidebar
4. Fill in product details
5. Add to cart
6. Review and create payment link
7. Open the payment link in a new tab
8. Use test card to complete payment

### Viewing Test Payments

Visit your Stripe Dashboard:
- **Test Mode**: https://dashboard.stripe.com/test/payments
- **Products**: https://dashboard.stripe.com/test/products
- **Payment Links**: https://dashboard.stripe.com/test/payment-links

## Best Practices

### Security

✅ **DO:**
- Keep `STRIPE_SECRET_KEY` in `.env.local` (never commit)
- Use `getStripe()` for all server-side operations
- Validate all input before creating products/prices
- Use HTTPS in production

❌ **DON'T:**
- Expose secret key in client-side code
- Hardcode API keys in source files
- Use live keys during development
- Skip input validation

### Error Handling

Always wrap Stripe API calls in try-catch:

```typescript
try {
  const stripe = getStripe()
  const paymentLink = await stripe.paymentLinks.create({...})
  return { success: true, paymentLink: paymentLink.url }
} catch (error) {
  console.error('Stripe error:', error)
  return { success: false, error: error.message }
}
```

### Pricing

- Always store prices in **cents** (not dollars)
- Convert dollars to cents: `Math.round(dollars * 100)`
- Convert cents to dollars: `cents / 100`

```typescript
// ✅ Correct
unit_amount: Math.round(300.00 * 100) // $300.00 = 30000 cents

// ❌ Wrong
unit_amount: 300 // This is $3.00, not $300.00
```

### Metadata

Add metadata to track orders:

```typescript
await stripe.products.create({
  name: 'Custom Service',
  metadata: {
    customer_email: 'customer@example.com',
    created_via: 'orcaclub_admin',
    order_id: 'ORD-123',
  },
})
```

## Going Live

When ready for production:

1. **Get Live API Keys:**
   - Visit https://dashboard.stripe.com/apikeys
   - Copy your live publishable key (`pk_live_...`)
   - Copy your live secret key (`sk_live_...`)

2. **Update Environment Variables:**
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

3. **Enable Payment Methods:**
   - Visit https://dashboard.stripe.com/settings/payment_methods
   - Enable credit cards, ACH, etc.

4. **Set Up Webhooks** (for advanced features):
   - Visit https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://orcaclub.pro/api/stripe/webhooks`
   - Select events to listen for

5. **Test in Production:**
   - Use real cards (start with small amounts)
   - Verify emails are sent correctly
   - Check payment confirmations

## Troubleshooting

### Error: "No such price: price_..."

**Cause:** Price ID doesn't exist or was created in different mode (test vs live)

**Solution:**
- Verify you're using the correct mode in Stripe Dashboard
- Recreate the price if needed
- Check `isTestMode()` matches your dashboard

### Error: "Invalid API Key"

**Cause:** Secret key is incorrect or not set

**Solution:**
- Check `.env.local` has correct `STRIPE_SECRET_KEY`
- Restart dev server after changing env vars
- Verify key starts with `sk_test_` or `sk_live_`

### Payment Link Not Working

**Cause:** Customer sees error when clicking link

**Solution:**
- Check payment link is still active in dashboard
- Verify products/prices weren't deleted
- Check for expired links (if expiration was set)

## Resources

**Official Stripe Documentation:**
- [Payment Links Guide](https://stripe.com/docs/payment-links)
- [Node.js SDK](https://github.com/stripe/stripe-node)
- [Testing](https://stripe.com/docs/testing)
- [API Reference](https://stripe.com/docs/api)

**ORCACLUB Implementation:**
- Payment Links API: `src/app/api/stripe/payment-links/route.ts`
- Stripe Client: `src/lib/stripe.ts`
- Order UI: `src/components/payload/order-creation/`

## Next Steps

1. **Integrate with Email System:**
   - Send payment links via email to customers
   - Include order details and instructions

2. **Add Webhook Handler:**
   - Listen for `payment_intent.succeeded` events
   - Update order status in database
   - Send confirmation emails

3. **Create Invoice System:**
   - Use Stripe Invoices API for detailed billing
   - Support partial payments
   - Automatic reminder emails

4. **Add Customer Portal:**
   - Allow customers to manage subscriptions
   - Update payment methods
   - View billing history

---

**Questions or Issues?**

Consult the Stripe Dashboard or reach out to Stripe Support for help with specific payment scenarios.
