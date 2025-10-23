# Stripe Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- ✅ Stripe keys already configured in `.env.local`
- ✅ All code files already created
- ✅ Development server ready to run

---

## Step 1: Create Products in Stripe (2 minutes)

1. **Go to:** https://dashboard.stripe.com/test/products

2. **Create Basic Plan:**
   - Click "+ Add product"
   - Name: `Basic Plan`
   - Price: `$9.00` USD
   - Recurring: Monthly
   - **Copy the Price ID** (starts with `price_`)

3. **Create Pro Plan:**
   - Click "+ Add product"
   - Name: `Pro Plan`
   - Price: `$29.00` USD
   - Recurring: Monthly
   - **Copy the Price ID** (starts with `price_`)

---

## Step 2: Update Price IDs (1 minute)

Open `/src/app/(frontend)/pricing/page.tsx` and update:

**Line 19 (Basic Plan):**
```typescript
priceId: 'price_YOUR_BASIC_PRICE_ID',
```

**Line 29 (Pro Plan):**
```typescript
priceId: 'price_YOUR_PRO_PRICE_ID',
```

Save the file.

---

## Step 3: Start Development Server (30 seconds)

```bash
bun run bun:dev
```

---

## Step 4: Test It! (1 minute)

1. **Visit:** http://localhost:3000/pricing

2. **Click "Subscribe"** on Basic or Pro plan

3. **Use Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
   - Email: `test@example.com`

4. **Complete checkout** - you'll be redirected to the billing page!

---

## ✅ That's It!

Your Stripe integration is working!

**What happens next:**
- User data is saved to database
- Subscription is tracked in PayloadCMS
- You can view data at http://localhost:3000/admin

---

## Optional: Set Up Webhooks (For Full Functionality)

Webhooks sync payment events to your database automatically.

### Install Stripe CLI
```bash
brew tap stripe/stripe-brew
brew install stripe
```

### Forward Webhooks
```bash
# Terminal 1: Your dev server
bun run bun:dev

# Terminal 2: Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

Copy the webhook secret (starts with `whsec_`) and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

Restart your dev server and test again!

---

## 🎉 You're Live!

For full setup instructions, see `STRIPE_SETUP_GUIDE.md`
