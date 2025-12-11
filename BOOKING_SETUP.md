# Booking System Setup Guide

## Overview

The booking system allows visitors to schedule consultations directly through the website. When a user submits a booking request:

1. **Customer receives** a confirmation email with booking details
2. **Admin (you) receives** a notification email with all submission details
3. **Optional webhooks** can track email delivery status in real-time

## Components

### 1. Booking Modal (`src/components/booking-modal.tsx`)
- Beautiful dialog form with the following fields:
  - Full Name (required)
  - Email (required)
  - Phone Number (optional)
  - Company Name (optional)
  - Service Selection (required)
  - Preferred Date (optional)
  - Project Details/Message (required)
- Form validation and error handling
- Loading states during submission
- Toast notifications for success/error feedback

### 2. API Route (`src/app/api/booking/route.ts`)
- Handles form submissions
- Validates input data
- Sends two emails via Resend:
  - **Customer confirmation email** - Professional branded email with booking details
  - **Admin notification email** - Detailed submission info sent to `chance@orcaclub.pro`
- Returns success/error responses

### 3. Navigation Integration
- "Book a Call" button in the header (desktop & mobile)
- Styled with brand colors (#67e8f9 cyan accent)
- Accessible from all frontend pages

## Setup Instructions

### Step 1: Verify Email Domain in Resend

Before emails will send successfully, you need to verify your domain in Resend:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Add `orcaclub.pro`
4. Add the DNS records Resend provides to your domain's DNS settings:
   - **TXT record** for domain verification
   - **DKIM records** for email authentication
   - **MX records** (optional, for receiving emails)
5. Wait for DNS propagation (can take up to 48 hours, usually faster)
6. Verify the domain in Resend dashboard

**Note:** Until the domain is verified, you can use Resend's development email: `onboarding@resend.dev` for testing.

### Step 2: Update Email Addresses in Code

After domain verification, update the sender email in `src/app/api/booking/route.ts`:

```typescript
const FROM_EMAIL = "bookings@orcaclub.pro" // Change this to your verified domain email
```

You can use any email prefix you want:
- `bookings@orcaclub.pro`
- `hello@orcaclub.pro`
- `contact@orcaclub.pro`
- `noreply@orcaclub.pro`

### Step 3: Environment Variables

The API key has already been added to `.env.local`:

```bash
RESEND_API_KEY=re_LkZsENn1_Dg8SRYyBYXTYnwT9aFA2zYXJ
```

**Important Security Notes:**
- `.env.local` is gitignored and contains sensitive keys
- Never commit API keys to version control
- Use different API keys for development and production
- Regenerate keys if they're ever exposed

### Step 4: Test the Booking Form

1. Start the development server:
   ```bash
   bun run dev
   ```

2. Open `http://localhost:3000` in your browser

3. Click the "Book a Call" button in the navigation

4. Fill out the form with test data

5. Submit and check:
   - Toast notification appears
   - Check your email inbox for confirmation (both customer and admin emails)
   - Check Resend dashboard for email logs

## Setting Up Webhooks (Optional but Recommended)

Webhooks allow you to receive real-time notifications about email events directly to your server. This is useful for tracking:
- Email delivery status
- Bounced emails
- Spam complaints
- Email opens (if tracking is enabled)
- Link clicks

### Why Use Webhooks?

Instead of manually checking if emails were delivered, webhooks notify your system automatically when:
- An email is sent
- An email is delivered
- An email bounces
- A recipient opens the email
- A recipient clicks a link

### Setting Up Webhooks via Resend Dashboard

1. **Create a Webhook Endpoint Handler**

   Create a new API route at `src/app/api/webhooks/resend/route.ts`:

   ```typescript
   import { NextRequest, NextResponse } from "next/server"
   import { Webhook } from "svix"

   // Install svix for webhook verification: bun add svix

   export async function POST(request: NextRequest) {
     try {
       const payload = await request.text()
       const headers = {
         "svix-id": request.headers.get("svix-id") || "",
         "svix-timestamp": request.headers.get("svix-timestamp") || "",
         "svix-signature": request.headers.get("svix-signature") || "",
       }

       const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
       if (!webhookSecret) {
         throw new Error("Missing RESEND_WEBHOOK_SECRET")
       }

       // Verify the webhook signature
       const wh = new Webhook(webhookSecret)
       const event = wh.verify(payload, headers)

       // Handle different event types
       switch (event.type) {
         case "email.sent":
           console.log("Email sent:", event.data)
           // Log to database or send notification
           break

         case "email.delivered":
           console.log("Email delivered:", event.data)
           // Update delivery status in database
           break

         case "email.bounced":
           console.log("Email bounced:", event.data)
           // Alert admin about bounce
           break

         case "email.complained":
           console.log("Spam complaint:", event.data)
           // Remove from mailing list
           break

         default:
           console.log("Unknown event type:", event.type)
       }

       return NextResponse.json({ received: true }, { status: 200 })
     } catch (error) {
       console.error("Webhook error:", error)
       return NextResponse.json(
         { error: "Webhook verification failed" },
         { status: 400 }
       )
     }
   }
   ```

2. **Install Svix for Webhook Verification**

   ```bash
   bun add svix
   ```

3. **Configure Webhook in Resend Dashboard**

   - Go to [Resend Webhooks](https://resend.com/webhooks)
   - Click "Create Webhook"
   - Set endpoint URL: `https://orcaclub.pro/api/webhooks/resend`
     - For development, use a service like [ngrok](https://ngrok.com/) to expose your local server
   - Select events to track:
     - ✅ `email.sent`
     - ✅ `email.delivered`
     - ✅ `email.delivery_delayed`
     - ✅ `email.bounced`
     - ✅ `email.complained`
   - Copy the "Signing Secret" (starts with `whsec_`)

4. **Add Webhook Secret to Environment Variables**

   Add to `.env.local`:
   ```bash
   RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

5. **Deploy and Test**

   - Deploy your application to production
   - Send a test email via the booking form
   - Check your webhook endpoint logs to see events coming in
   - Verify events in the Resend dashboard under "Webhooks" → "Events"

### Alternative: Email Notifications to Your Inbox

If you prefer simpler email notifications without webhooks:

The current setup already sends you an email notification at `chance@orcaclub.pro` for every booking request. This includes:
- Full contact information
- Service requested
- Project details
- Timestamp

You can set up email filters/rules in your inbox to:
- Auto-label booking requests
- Forward to a team channel (Slack, Discord, etc.)
- Trigger automated responses

## Email Templates

### Customer Confirmation Email
- ORCACLUB branded header
- Personalized greeting
- Booking details summary
- "What happens next" timeline
- Contact information
- Professional footer with copyright

### Admin Notification Email
- Clear "New Booking Request" subject
- Contact details (clickable email/phone links)
- Full project information
- Timestamp
- Reply-to set to customer's email for easy response

## Customization Options

### Modify Form Fields

Edit `src/components/booking-modal.tsx` to add/remove fields:

```typescript
interface BookingFormData {
  name: string
  email: string
  // Add custom fields here
  budget?: string
  timeline?: string
  referralSource?: string
}
```

### Change Email Templates

Edit the HTML/text email templates in `src/app/api/booking/route.ts`:
- Update colors and branding
- Add/remove sections
- Change wording
- Add your logo (host image and reference URL)

### Modify Service Options

Update the service dropdown in `src/components/booking-modal.tsx`:

```typescript
<option value="new-service" className="bg-black">New Service Name</option>
```

## Troubleshooting

### Emails Not Sending

1. **Check API key** - Verify `RESEND_API_KEY` in `.env.local`
2. **Check domain verification** - Domain must be verified in Resend
3. **Check sender email** - Must use verified domain email
4. **Check console logs** - Look for errors in terminal/browser console
5. **Check Resend dashboard** - View email logs and error messages

### Form Not Submitting

1. **Check browser console** - Look for JavaScript errors
2. **Check network tab** - Verify API request is being made
3. **Verify API route** - Check `/api/booking` returns 200 status
4. **Check required fields** - Ensure all required fields are filled

### Webhooks Not Working

1. **Verify webhook URL** - Must be publicly accessible HTTPS endpoint
2. **Check signing secret** - Verify `RESEND_WEBHOOK_SECRET` is correct
3. **Check webhook logs** - View in Resend dashboard
4. **Test with curl** - Send test webhook event manually
5. **Check svix installation** - Ensure `svix` package is installed

## Security Considerations

- ✅ API key stored in environment variables
- ✅ Form validation on both client and server
- ✅ Email validation with regex
- ✅ Rate limiting (recommended to add)
- ✅ HTTPS only in production
- ✅ Webhook signature verification
- ⚠️ Consider adding CAPTCHA for spam prevention
- ⚠️ Consider adding rate limiting to prevent abuse

## Next Steps

1. **Verify domain** in Resend dashboard
2. **Test booking flow** thoroughly
3. **Set up webhooks** (optional)
4. **Monitor email delivery** rates
5. **Set up auto-responses** or CRM integration
6. **Add analytics tracking** for conversion rates

## Support

- Resend Documentation: https://resend.com/docs
- Resend Dashboard: https://resend.com/overview
- Resend Support: support@resend.com

---

**Built with:**
- [Resend](https://resend.com) - Email API
- [Next.js](https://nextjs.org) - React Framework
- [shadcn/ui](https://ui.shadcn.com) - UI Components
- [Tailwind CSS](https://tailwindcss.com) - Styling
