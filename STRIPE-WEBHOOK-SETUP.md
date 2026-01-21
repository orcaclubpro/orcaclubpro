# Stripe Webhook Setup Guide - ORCACLUB

Complete guide for setting up Stripe webhooks to automatically update order status when invoices are paid.

---

## 📋 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Production Setup](#production-setup)
3. [Testing Your Webhooks](#testing-your-webhooks)
4. [Verifying Everything Works](#verifying-everything-works)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Local Development Setup

### Step 1: Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (using Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin
```

### Step 2: Authenticate Stripe CLI

```bash
stripe login
```

This opens your browser to authenticate with your Stripe account.

### Step 3: Start Your Development Server

```bash
# Terminal 1
bun run dev
```

Your app will be running at `http://localhost:3000`

### Step 4: Forward Webhooks to Local Endpoint

```bash
# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

**Copy the webhook signing secret** from the output:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Step 5: Add Secret to Environment

Add to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Restart your dev server (Terminal 1) after adding this.

### Step 6: Test Webhook Events

```bash
# Terminal 3: Trigger test events
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger invoice.voided
```

**You should see:**
- Terminal 1: Your app logs showing webhook processing
- Terminal 2: Stripe CLI showing events being forwarded
- Admin Panel: New records in `webhook-events` collection

---

## 🚀 Production Setup

### Step 1: Deploy Your Application

Make sure your app is deployed and accessible at your production URL:
- Example: `https://orcaclub.pro`
- Endpoint: `https://orcaclub.pro/api/stripe/webhooks`

### Step 2: Add Webhook Endpoint in Stripe Dashboard

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks
   - Or: Dashboard → Developers → Webhooks

2. **Click "Add endpoint"**

3. **Configure Endpoint:**
   ```
   Endpoint URL: https://orcaclub.pro/api/stripe/webhooks
   Description: ORCACLUB Order Status Updates
   Version: Latest API version (or leave default)
   ```

4. **Select Events to Listen To:**

   Click "Select events" and choose:
   - ✅ `invoice.paid` - When invoice payment succeeds
   - ✅ `invoice.payment_failed` - When invoice payment fails
   - ✅ `invoice.voided` - When invoice is voided
   - ✅ `invoice.marked_uncollectible` - When invoice is marked uncollectible
   - ✅ `invoice.updated` (optional) - For additional tracking

5. **Click "Add endpoint"**

### Step 3: Get Production Webhook Secret

After creating the endpoint:

1. Click on your newly created endpoint
2. Click "Reveal" next to **Signing secret**
3. Copy the secret (starts with `whsec_`)

### Step 4: Add Production Secret to Environment

Add to your production environment variables (Vercel, AWS, etc.):

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Important:** This is different from your local development secret!

---

## 🧪 Testing Your Webhooks

### Test 1: Create an Invoice via Admin Panel

1. Go to `/admin/order` in your Payload admin
2. Create a new invoice for a client
3. Copy the payment link from the success screen
4. Open payment link in new tab
5. Use Stripe test card: `4242 4242 4242 4242`
6. Complete payment

**Expected Result:**
- Order status changes to `paid` ✅
- Client balance updates automatically ✅
- Webhook event logged in `webhook-events` collection ✅

### Test 2: Trigger Test Events (Local Only)

```bash
# Test successful payment
stripe trigger invoice.paid

# Test failed payment
stripe trigger invoice.payment_failed

# Test voided invoice
stripe trigger invoice.voided
```

### Test 3: Test Idempotency (Duplicate Prevention)

```bash
# Trigger the same event twice
stripe trigger invoice.paid
stripe trigger invoice.paid
```

**Expected Result:**
- First event: Creates webhook event record, updates order
- Second event: Skipped (already processed)
- Check logs for "already processed" message

### Test 4: View Webhook Events in Admin

1. Go to `/admin/collections/webhook-events`
2. You should see all processed events
3. Check status: `processed`, `processing`, or `failed`
4. Click an event to see full payload

---

## ✅ Verifying Everything Works

### Check 1: Webhook Endpoint is Receiving Events

**Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click your webhook endpoint
3. Scroll to "Recent deliveries"
4. All should show `200` status code (green checkmark)

**If you see `400` or `500` errors:** Check your application logs

### Check 2: Orders Update Correctly

**Test Flow:**
1. Create invoice → Order status: `pending`
2. Pay invoice → Order status: `paid` ✅
3. Check client account → Balance decreased ✅

### Check 3: Webhook Events Logged

**Admin Panel:**
1. Navigate to `/admin/collections/webhook-events`
2. All events should have `status: processed`
3. `orderId` should link to the correct order
4. No `errorMessage` should be present

### Check 4: No Duplicate Processing

**Create a test scenario:**
1. Pay an invoice
2. Check webhook-events collection
3. Should only see ONE event for that invoice payment
4. Even if Stripe sends duplicate events

---

## 🔍 Troubleshooting

### Problem: Webhooks not being received

**Solution:**
```bash
# Check if endpoint is publicly accessible
curl -X POST https://orcaclub.pro/api/stripe/webhooks

# Should return: {"error":"No signature"}
```

If you get connection errors, your endpoint isn't publicly accessible.

### Problem: Signature verification fails

**Error:** `Webhook signature verification failed`

**Solutions:**
1. Check webhook secret in environment variables
2. Ensure you're using the correct secret (dev vs production)
3. Verify raw body is being passed (Next.js: `express.raw()`)

```bash
# Check environment variable is set
echo $STRIPE_WEBHOOK_SECRET
```

### Problem: Order status not updating

**Check:**
1. Order has `stripeInvoiceId` set
2. Invoice metadata contains `orcaclub_order_id`
3. Check logs for errors

**Fix metadata issue:**
```typescript
// In /api/stripe/payment-links/route.ts
// Ensure invoice has metadata
const invoice = await stripe.invoices.create({
  metadata: {
    orcaclub_order_id: order.id,  // ✅ MUST BE SET
    order_number: orderNumber,
  },
})
```

### Problem: Balance not updating automatically

**This should work automatically via `updateClientBalance` hook.**

**Check:**
1. Hook is registered in Orders collection
2. Order status change triggers the hook
3. Check logs for balance update messages

**Manual fix if needed:**
```bash
# Go to /admin/collections/orders
# Edit an order
# Change status to 'paid'
# Save
# Balance should recalculate
```

### Problem: Duplicate events being processed

**This should NOT happen with idempotency implementation.**

**Check:**
1. `webhook-events` collection has unique index on `eventId`
2. Check logs for "already processed" messages
3. Verify idempotency code is running

**If duplicates occur:**
```bash
# Check webhook-events for duplicate eventId
# Should only have one record per event.id
```

### Problem: Testing locally but webhooks aren't working

**Checklist:**
```bash
# 1. Stripe CLI is running
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# 2. Dev server is running
bun run dev

# 3. Webhook secret is in .env.local
cat .env.local | grep STRIPE_WEBHOOK_SECRET

# 4. Dev server was restarted after adding secret

# 5. Try triggering an event
stripe trigger invoice.paid
```

---

## 📊 Monitoring in Production

### View Webhook Delivery Logs

**Stripe Dashboard:**
- https://dashboard.stripe.com/webhooks
- Click your endpoint
- View "Recent deliveries"
- Check for failed deliveries (red X)

### View Application Logs

**Server logs should show:**
```
[Stripe Webhook] Received event: invoice.paid evt_xxx
[Stripe Webhook] Created webhook event record: 12345
[Stripe Webhook] Order marked as paid: INV-0001 67890
[Stripe Webhook] Event marked as processed: evt_xxx
[Balance] Updated client 123: balance=$0.00, orders=5
```

### Monitor Failed Events

**Admin Panel:**
1. Go to `/admin/collections/webhook-events`
2. Filter by `status: failed`
3. Check `errorMessage` for details
4. Retry manually if needed

---

## 🎯 Summary

**When everything is working:**

1. ✅ Stripe sends `invoice.paid` event
2. ✅ Your webhook endpoint receives and verifies signature
3. ✅ Event is logged in `webhook-events` collection
4. ✅ Order status changes to `paid`
5. ✅ Client balance updates automatically
6. ✅ Duplicate events are prevented
7. ✅ All logs show success

**Flow:**
```
Customer pays invoice
       ↓
Stripe sends webhook
       ↓
/api/stripe/webhooks receives event
       ↓
Verifies signature
       ↓
Checks idempotency (no duplicates)
       ↓
Updates order status to 'paid'
       ↓
updateClientBalance hook runs
       ↓
Client balance recalculated
       ↓
Success! 🎉
```

---

## 📚 Additional Resources

- **Stripe Webhooks Docs**: https://stripe.com/docs/webhooks
- **Stripe CLI Docs**: https://stripe.com/docs/stripe-cli
- **Testing Webhooks**: https://stripe.com/docs/webhooks/test
- **Event Types**: https://stripe.com/docs/api/events/types

---

## 🆘 Need Help?

If you're still having issues:

1. Check server logs for errors
2. Check Stripe dashboard for webhook delivery status
3. Verify webhook secret matches
4. Test with Stripe CLI first (local development)
5. Ensure endpoint is publicly accessible (production)

**Debug mode:**
Add more logging to `/api/stripe/webhooks/route.ts`:
```typescript
console.log('[DEBUG] Full event:', JSON.stringify(event, null, 2))
console.log('[DEBUG] Order ID:', orcaclubOrderId)
console.log('[DEBUG] Webhook Event ID:', webhookEventId)
```
