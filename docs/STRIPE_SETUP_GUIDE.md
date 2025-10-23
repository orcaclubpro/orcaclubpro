# Stripe Payment Integration Setup Guide

## 📋 Overview

This guide walks you through setting up Stripe payment integration for OrcaClubPro. Your payment system is already built and configured - you just need to connect it to your Stripe account.

---

## ✅ What's Already Done

- ✅ Stripe SDK installed (`stripe@19.1.0`)
- ✅ Database collections created (Users, Subscriptions, Invoices)
- ✅ PayloadCMS schema updated with Stripe fields
- ✅ Webhook handlers implemented
- ✅ API routes created (checkout, billing portal, subscription management)
- ✅ Frontend components built (pricing page, billing dashboard)
- ✅ Stripe keys added to `.env.local`

---

## 🔑 Your Stripe Keys

Your test keys should be in `.env.local`:

- **Publishable Key:** `pk_test_YOUR_PUBLISHABLE_KEY_HERE`
- **Secret Key:** `sk_test_YOUR_SECRET_KEY_HERE`

To get your keys:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your test keys
3. Add them to your `.env.local` file

---

## 🎯 Setup Steps

### Step 1: Create Products & Prices in Stripe Dashboard

**Go to:** https://dashboard.stripe.com/test/products

#### Create Basic Plan

1. Click "**+ Add product**"
2. Fill in:
   - **Product name:** `Basic Plan`
   - **Description:** `OrcaClubPro Basic Subscription`
   - **Pricing model:** Recurring
   - **Price:** `$9.00` USD
   - **Billing period:** Monthly
3. Click "**Save product**"
4. **📋 COPY THE PRICE ID** (starts with `price_`)
   - Example: `price_1ABC123xyz...`

#### Create Pro Plan

1. Click "**+ Add product**"
2. Fill in:
   - **Product name:** `Pro Plan`
   - **Description:** `OrcaClubPro Pro Subscription`
   - **Pricing model:** Recurring
   - **Price:** `$29.00` USD
   - **Billing period:** Monthly
3. Click "**Save product**"
4. **📋 COPY THE PRICE ID** (starts with `price_`)
   - Example: `price_1DEF456xyz...`

#### Update Pricing Page

Once you have both Price IDs, update `/src/app/(frontend)/pricing/page.tsx`:

**Line 19 - Basic Plan:**
```typescript
priceId: 'price_YOUR_BASIC_PRICE_ID_HERE',
```

**Line 29 - Pro Plan:**
```typescript
priceId: 'price_YOUR_PRO_PRICE_ID_HERE',
```

---

### Step 2: Install Stripe CLI (For Webhooks)

The Stripe CLI allows you to test webhooks locally.

#### Option A: Homebrew (Recommended)

```bash
brew tap stripe/stripe-brew
brew install stripe
```

#### Option B: Manual Download

1. Visit: https://github.com/stripe/stripe-cli/releases/latest
2. Download `stripe_darwin_arm64.tar.gz` (for Mac M1/M2)
3. Extract and move to your PATH:
   ```bash
   tar -xzf stripe_darwin_arm64.tar.gz
   sudo mv stripe /usr/local/bin/
   stripe --version
   ```

---

### Step 3: Set Up Local Webhooks

#### Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authorize the CLI.

#### Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

**Important:** This command will output a webhook signing secret like:

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

**📋 Copy this secret!**

#### Update .env.local with Webhook Secret

Replace the placeholder in `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

---

### Step 4: Configure Stripe Customer Portal

The billing portal allows users to manage their subscriptions.

1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Click "**Activate test link**"
3. Configure settings:
   - ✅ **Update payment method**
   - ✅ **Cancel subscription**
   - ✅ **Update billing information**
   - ✅ **View invoices**
4. Click "**Save changes**"

---

## 🧪 Testing Your Integration

### Start Your Development Environment

#### Terminal 1: Start Next.js Server
```bash
bun run bun:dev
```

#### Terminal 2: Start Stripe Webhook Forwarding
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

---

### Test the Complete Flow

#### 1. Visit the Pricing Page
```
http://localhost:3000/pricing
```

#### 2. Click "Subscribe" on Basic or Pro Plan

#### 3. Use Stripe Test Card
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

#### 4. Complete Checkout
- Fill in test email: `test@example.com`
- Click "Subscribe"

#### 5. Verify Success
- You should be redirected to `/login/u/{userId}/billing`
- Check Terminal 2 - you should see webhook events being received
- Check PayloadCMS Admin at `http://localhost:3000/admin`:
  - Navigate to **Subscriptions** collection - see your new subscription
  - Navigate to **Invoices** collection - see the invoice record
  - Navigate to **Users** collection - see `stripeCustomerId` populated

---

## 🎨 Stripe Test Cards

| Scenario | Card Number | Description |
|----------|-------------|-------------|
| **Success** | `4242 4242 4242 4242` | Payment succeeds |
| **Decline** | `4000 0000 0000 0002` | Card declined |
| **Insufficient Funds** | `4000 0000 0000 9995` | Insufficient funds |
| **3D Secure** | `4000 0027 6000 3184` | Requires 3D Secure authentication |

Use any future expiry, any CVC, and any ZIP code.

---

## 🔍 Webhook Events You'll See

When testing, watch Terminal 2 for these events:

- ✅ `checkout.session.completed` - Checkout successful
- ✅ `customer.created` - New Stripe customer created
- ✅ `customer.subscription.created` - Subscription created
- ✅ `invoice.created` - Invoice generated
- ✅ `invoice.paid` - Payment successful
- ✅ `customer.subscription.updated` - Subscription changed

---

## 📊 Test the Billing Portal

1. After creating a subscription, go to: `http://localhost:3000/login/u/{userId}/billing`
2. Click "**Manage Subscription**"
3. This opens the Stripe Customer Portal where users can:
   - Update payment method
   - View invoices
   - Cancel subscription
   - Download invoice PDFs

---

## 🔐 Database Collections

### Users Collection
New fields added:
- `stripeCustomerId` - Stripe customer ID
- `stripeSubscriptionId` - Active subscription ID
- `subscriptionStatus` - Current status (free, active, canceled, etc.)
- `subscriptionTier` - Plan tier (free, basic, pro, enterprise)
- `billingEmail` - Billing email address

### Subscriptions Collection
Tracks all subscription data:
- `user` - Link to user
- `stripeSubscriptionId` - Stripe subscription ID
- `stripePriceId` - Price ID for the plan
- `status` - Subscription status
- `currentPeriodStart` - Billing period start
- `currentPeriodEnd` - Billing period end
- `cancelAtPeriodEnd` - Scheduled cancellation
- `trialStart` / `trialEnd` - Trial period dates
- `metadata` - Additional Stripe metadata

### Invoices Collection
Tracks all invoices:
- `user` - Link to user
- `subscription` - Link to subscription
- `stripeInvoiceId` - Stripe invoice ID
- `amount` - Amount in cents
- `status` - Invoice status (paid, open, void, etc.)
- `invoiceUrl` - Hosted invoice URL
- `pdfUrl` - PDF download URL
- `paidAt` - Payment date

**Access via PayloadCMS Admin:** http://localhost:3000/admin

---

## 🚀 API Endpoints

### Checkout
```
POST /api/stripe/checkout
Body: { priceId: "price_xxx" }
Returns: { url: "https://checkout.stripe.com/..." }
```

### Billing Portal
```
POST /api/stripe/portal
Returns: { url: "https://billing.stripe.com/..." }
```

### Cancel Subscription
```
POST /api/stripe/cancel-subscription
Returns: { success: true, cancelAtPeriodEnd: true }
```

### Get Subscription Status
```
GET /api/stripe/status
Returns: { status: "active", tier: "pro" }
```

### Webhooks
```
POST /api/stripe/webhooks
(Called by Stripe automatically)
```

---

## 🛠️ Troubleshooting

### Webhooks Not Working

**Problem:** Subscriptions created but not showing in database

**Solution:**
1. Check Terminal 2 - is `stripe listen` running?
2. Check webhook secret in `.env.local` matches the CLI output
3. Restart dev server after updating webhook secret

### Checkout Redirects to Wrong URL

**Problem:** After checkout, redirected to wrong page

**Solution:**
Update `NEXT_PUBLIC_SERVER_URL` in `.env.local`:
```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### Products Not Showing Correct Prices

**Problem:** Pricing page shows wrong amounts

**Solution:**
Update Price IDs in `/src/app/(frontend)/pricing/page.tsx` lines 19 and 29

### Webhook Signature Verification Failed

**Problem:** Webhook endpoint returns 400 error

**Solution:**
1. Get new webhook secret: `stripe listen --forward-to localhost:3000/api/stripe/webhooks`
2. Update `.env.local` with new `STRIPE_WEBHOOK_SECRET`
3. Restart Next.js dev server

---

## 📱 Frontend Pages

### Pricing Page
**URL:** `/pricing`
**File:** `/src/app/(frontend)/pricing/page.tsx`

Shows all subscription tiers with pricing and features. Clicking "Subscribe" creates a Stripe Checkout session.

### Billing Dashboard
**URL:** `/login/u/[user]/billing`
**File:** `/src/app/(dashboard)/login/u/[user]/billing/page.tsx`

Shows current subscription status and provides access to Stripe Customer Portal.

---

## 🌐 Going to Production

### 1. Switch to Live API Keys

In Stripe Dashboard:
1. Toggle from "Test mode" to "Live mode"
2. Go to: https://dashboard.stripe.com/apikeys
3. Copy your **live** keys
4. Update `.env.local` (or production environment variables):

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
```

### 2. Create Live Products & Prices

Recreate your products in **live mode** and update price IDs in your code.

### 3. Configure Production Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set URL: `https://yourdomain.com/api/stripe/webhooks`
4. Select events:
   - `customer.created`
   - `customer.updated`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.created`
   - `invoice.updated`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Copy webhook signing secret
6. Add to production environment: `STRIPE_WEBHOOK_SECRET=whsec_...`

### 4. Update Server URL

Set production URL in environment variables:
```bash
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

### 5. Enable Customer Portal (Live Mode)

1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Toggle to "Live mode"
3. Click "Activate live link"
4. Configure same settings as test mode

---

## 📚 Additional Resources

### Stripe Documentation
- **Checkout:** https://docs.stripe.com/checkout
- **Subscriptions:** https://docs.stripe.com/billing/subscriptions
- **Webhooks:** https://docs.stripe.com/webhooks
- **Customer Portal:** https://docs.stripe.com/customer-management/customer-portal
- **Testing:** https://docs.stripe.com/testing

### PayloadCMS Documentation
- **Collections:** https://payloadcms.com/docs/configuration/collections
- **Authentication:** https://payloadcms.com/docs/authentication/overview
- **TypeScript:** https://payloadcms.com/docs/typescript/overview

### Your Code Files
- **Stripe Client:** `/src/lib/stripe/stripe.ts`
- **Server Actions:** `/src/lib/stripe/actions.ts`
- **Webhook Handler:** `/src/app/api/stripe/webhooks/route.ts`
- **Checkout Route:** `/src/app/api/stripe/checkout/route.ts`
- **PayloadCMS Config:** `/src/lib/payload/payload.config.ts`
- **Pricing Page:** `/src/app/(frontend)/pricing/page.tsx`
- **Billing Dashboard:** `/src/app/(dashboard)/login/u/[user]/billing/page.tsx`

---

## ✅ Quick Checklist

Before going live, ensure:

- [ ] Products created in Stripe Dashboard (live mode)
- [ ] Price IDs updated in pricing page
- [ ] Live API keys in production environment
- [ ] Production webhook endpoint configured
- [ ] Webhook signing secret added to production environment
- [ ] Customer Portal enabled in live mode
- [ ] `NEXT_PUBLIC_SERVER_URL` set to production domain
- [ ] Test checkout flow in live mode with real card
- [ ] Test webhook events are being received
- [ ] Test customer portal access
- [ ] Test subscription cancellation
- [ ] Verify database is syncing correctly

---

## 🎉 You're All Set!

Your Stripe integration is production-ready. Just complete the setup steps above and you'll be accepting payments!

**Need help?** Check the troubleshooting section or refer to the Stripe documentation links.

**Next Steps:**
1. Create your products in Stripe Dashboard
2. Update the Price IDs in your pricing page
3. Test with Stripe test cards
4. Deploy to production with live keys

---

**Generated:** 2025-10-20
**Version:** 1.0.0
**Integration:** Stripe API Version 2024-12-18.acacia
