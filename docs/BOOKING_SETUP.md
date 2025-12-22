# OrcaClubPro Contact & Booking System - Complete Development Guide

> **📢 System Update (v2.0)**: This system now includes **dual functionality** - a simple contact form AND consultation booking. See [CONTACT_FUNCTIONALITY_UPDATE.md](./CONTACT_FUNCTIONALITY_UPDATE.md) for detailed information about the new contact form features.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Technical Design](#architecture--technical-design)
3. [Prerequisites](#prerequisites)
4. [Initial Setup](#initial-setup)
5. [Development Guide](#development-guide)
6. [API Reference](#api-reference)
7. [Component Reference](#component-reference)
8. [Integration Guides](#integration-guides)
9. [Configuration Reference](#configuration-reference)
10. [Deployment](#deployment)
11. [Maintenance & Operations](#maintenance--operations)
12. [Troubleshooting](#troubleshooting)
13. [Security Best Practices](#security-best-practices)
14. [Performance Optimization](#performance-optimization)
15. [Testing Strategy](#testing-strategy)
16. [Future Roadmap](#future-roadmap)

---

## System Overview

### What is the Contact & Booking System?

The OrcaClubPro system provides **dual functionality** for customer engagement:

1. **Contact Form** - Simple inquiry submission without scheduling
2. **Consultation Booking** - Real-time appointment scheduling with calendar integration

Both workflows are built into a single, unified contact page with tabbed navigation, ensuring all customer inquiries are captured and managed through PayloadCMS.

#### Contact Form Features

- **Simple inquiry submission** without scheduling requirements
- **Lead capture** saved to PayloadCMS MongoDB database
- **Professional email confirmation** to customers
- **No Google Calendar integration** (simpler, faster workflow)
- **Same form fields** as booking (except date/time)

#### Consultation Booking Features

- **Real-time availability checking** via Google Calendar FreeBusy API
- **Automatic calendar event creation** with Google Meet video conference links
- **Professional email notifications** with consultation details
- **Timezone-aware scheduling** (Pacific Time by default)
- **Double-booking prevention** through atomic availability checks
- **Lead saved to PayloadCMS** with calendar link reference

### Key Features

#### For Customers
- ✅ **Two ways to connect**: Contact form or schedule consultation
- ✅ Browse available time slots in real-time (booking only)
- ✅ Select preferred service type
- ✅ Receive instant email confirmation
- ✅ Automatic Google Calendar invitation with Meet link (booking only)
- ✅ Mobile-responsive tabbed interface
- ✅ Seamless switching between contact and booking modes

#### For Administrators
- ✅ **All inquiries saved to PayloadCMS** (contact + bookings)
- ✅ Consultation bookings automatically added to Google Calendar
- ✅ Google Meet links auto-generated for scheduled consultations
- ✅ Lead tracking and status management via PayloadCMS admin
- ✅ Differentiate between contacts (status: "new") and bookings (status: "scheduled")
- ✅ Never lose a lead - saved before email/calendar operations

### User Flow (Updated with PayloadCMS)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Customer clicks "Free Consultation" button                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Booking modal opens with form fields                         │
│    - Name, Email, Phone, Company                                │
│    - Service selection                                          │
│    - Preferred date picker                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Customer selects a date                                      │
│    → Frontend calls GET /api/booking/available-slots?date=YYYY-MM-DD │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Backend queries Google Calendar FreeBusy API                 │
│    → Returns available time slots (e.g., 9:00 AM, 10:00 AM)    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Customer selects time slot and fills project details         │
│    → Submits form                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Backend validates submission (POST /api/booking)             │
│    → Re-checks slot availability (prevent race conditions)      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. ⭐ SAVES LEAD TO PAYLOADCMS FIRST (CRITICAL)                 │
│    → Lead stored in MongoDB with status "new"                   │
│    → Even if everything else fails, we have the lead!          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Creates Google Calendar event with:                          │
│    - Customer details and project info                          │
│    - Google Meet conference link                                │
│    - 1-hour time block                                          │
│    - Lead ID in description                                     │
│    → Updates lead: calendarCreated=true, status="scheduled"    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Sends confirmation emails via Resend:                        │
│    - Customer: Branded confirmation with booking details        │
│    - Admin: Notification with customer info (optional)          │
│    → Updates lead: emailSent=true                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. Success response returned to frontend                       │
│    → Form resets, modal closes, success toast shown            │
│    → Response includes leadId for tracking                      │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Next.js 15 | UI framework with App Router |
| | shadcn/ui + Radix UI | Accessible component library |
| | Tailwind CSS v4 | Utility-first styling |
| | Sonner | Toast notifications |
| **Backend** | Next.js API Routes | Server-side endpoints |
| | TypeScript 5 | Type safety |
| | **PayloadCMS 3.x** | **Headless CMS & lead storage** |
| **Database** | **MongoDB** | **Lead persistence & CMS data** |
| **Email** | Resend API | Transactional emails |
| **Calendar** | Google Calendar API v3 | Event management & availability |
| | googleapis (Node.js) | Official Google API client |
| **Runtime** | Bun 1.2.15 (dev) | Fast development server |
| | Node.js (production) | Production runtime |

---

## Architecture & Technical Design

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  BookingModal Component (src/components/booking-modal.tsx) │  │
│  │  - Client-side form with React state                       │  │
│  │  - Real-time validation                                    │  │
│  │  - Dynamic slot loading                                    │  │
│  └───────────────────────┬────────────────────────────────────┘  │
└────────────────────────────┼───────────────────────────────────────┘
                             │ HTTP Requests
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/booking (src/app/api/booking/route.ts)        │   │
│  │  - Validates booking data                                 │   │
│  │  - Orchestrates calendar & email services                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  GET /api/booking/available-slots                         │   │
│  │  (src/app/api/booking/available-slots/route.ts)          │   │
│  │  - Queries calendar availability                          │   │
│  │  - Returns time slots                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
             ┌───────────────┴───────────────┐
             │                               │
             ▼                               ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│   CALENDAR SERVICE      │    │      EMAIL SERVICE           │
│ (src/lib/google-        │    │   (Resend API)               │
│  calendar.ts)           │    │                              │
│                         │    │ - Customer confirmation      │
│ - FreeBusy API          │    │ - Admin notification         │
│ - Event creation        │    │   (optional)                 │
│ - Availability checks   │    │                              │
│ - Meet link generation  │    │                              │
└────────┬────────────────┘    └──────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              GOOGLE CALENDAR API                            │
│  - Service Account Authentication                           │
│  - Domain-wide Delegation                                   │
│  - Calendar v3 API                                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

#### 1. **Available Slots Request Flow**

```typescript
// Frontend initiates request when date changes
const response = await fetch(`/api/booking/available-slots?date=${date}`)

// API Route Handler (available-slots/route.ts)
export async function GET(request: NextRequest) {
  // 1. Extract and validate date parameter
  // 2. Call Google Calendar Service
  const slots = await googleCalendar.getAvailableSlots(date, 60, 9, 17, 'America/Los_Angeles')
  // 3. Return formatted time slots
  return NextResponse.json({ slots })
}

// Google Calendar Service (google-calendar.ts)
async getAvailableSlots(date, duration, startHour, endHour, timeZone) {
  // 1. Query FreeBusy API for the entire day
  const busyPeriods = await this.getFreeBusyInfo(startOfDay, endOfDay)

  // 2. Generate all possible time slots (e.g., 9:00 AM, 10:00 AM, etc.)
  const allSlots = generateTimeSlots(startHour, endHour, duration)

  // 3. Filter out slots that conflict with busy periods
  const availableSlots = allSlots.filter(slot => !conflictsWithBusy(slot, busyPeriods))

  // 4. Return available slots with formatted labels
  return availableSlots
}
```

#### 2. **Booking Submission Flow**

```typescript
// Frontend submits booking
const response = await fetch('/api/booking', {
  method: 'POST',
  body: JSON.stringify(formData)
})

// API Route Handler (booking/route.ts)
export async function POST(request: NextRequest) {
  // 1. Validate all required fields
  if (!body.name || !body.email || !body.service || !body.message ||
      !body.preferredDate || !body.preferredTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 2. Validate email format
  if (!emailRegex.test(body.email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // 3. RE-CHECK availability (prevent race conditions)
  const isAvailable = await googleCalendar.isTimeSlotAvailable(startDateTime, endDateTime)
  if (!isAvailable) {
    return NextResponse.json({ error: 'Time slot no longer available' }, { status: 409 })
  }

  // 4. Create Google Calendar event
  const calendarEventLink = await googleCalendar.createEvent({
    summary: `ORCACLUB Consultation Invite`,
    description: `Consultation with ${name}...`,
    startDateTime, endDateTime,
    attendeeEmail: email,
    attendeeName: name,
    timeZone: 'America/Los_Angeles'
  })

  // 5. Send confirmation email to customer
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'ORCACLUB Consultation',
    html: customerEmailTemplate,
    text: customerEmailTextTemplate
  })

  // 6. Return success with calendar link
  return NextResponse.json({ success: true, calendarEventLink })
}
```

### Component Architecture

#### **BookingModal Component** (`src/components/booking-modal.tsx`)

```typescript
interface BookingFormData {
  name: string          // Required: Full name
  email: string         // Required: Valid email address
  phone: string         // Optional: Phone number
  company: string       // Optional: Company name
  service: string       // Required: Selected service type
  message: string       // Required: Project details
  preferredDate: string // Required: YYYY-MM-DD format
  preferredTime: string // Required: ISO 8601 datetime string
}

interface TimeSlot {
  start: string   // ISO 8601 datetime
  end: string     // ISO 8601 datetime
  label: string   // Human-readable (e.g., "10:00 AM")
}

// Component state management
const [open, setOpen] = useState(false)                    // Modal visibility
const [isSubmitting, setIsSubmitting] = useState(false)    // Submit button loading
const [isLoadingSlots, setIsLoadingSlots] = useState(false) // Time slots loading
const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
const [formData, setFormData] = useState<BookingFormData>({ ... })

// Key behaviors:
// 1. When date changes → fetchAvailableSlots(date)
// 2. When form submits → POST /api/booking with all data
// 3. On success → Reset form, close modal, show success toast
// 4. On error → Show error toast with descriptive message
```

#### **Google Calendar Service** (`src/lib/google-calendar.ts`)

```typescript
class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null
  private calendarId: string  // From env or 'primary'

  // Singleton pattern - single instance across app
  constructor() {
    this.initializeCalendar()
  }

  // Key methods:
  async createEvent(eventData: CalendarEvent): Promise<string | null>
  async isTimeSlotAvailable(startDateTime, endDateTime): Promise<boolean>
  async getFreeBusyInfo(startDateTime, endDateTime): Promise<BusyPeriod[]>
  async getAvailableSlots(date, duration, startHour, endHour, timeZone): Promise<TimeSlot[]>
  async updateEvent(eventId, updates): Promise<boolean>
  async deleteEvent(eventId): Promise<boolean>
}

// Exported singleton instance
export const googleCalendar = new GoogleCalendarService()
```

### Design Patterns Used

1. **Singleton Pattern** - Google Calendar service (one instance, shared auth)
2. **Service Layer Pattern** - Business logic separated from API routes
3. **Repository Pattern** - Google Calendar acts as data repository
4. **Factory Pattern** - Time slot generation based on business hours
5. **Strategy Pattern** - Timezone handling for different regions

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **No Database** | Google Calendar is source of truth; reduces complexity |
| **Service Account Auth** | Automated access without user OAuth flow |
| **FreeBusy API** | Efficient availability checking without listing all events |
| **Atomic Availability Check** | Re-verify slot before booking to prevent double-booking |
| **Pacific Timezone Default** | Business operates in PST/PDT |
| **1-Hour Slots** | Standard consultation duration (configurable) |
| **Synchronous Flow** | Simpler error handling; acceptable latency |
| **Email Optional for Admin** | Calendar is primary notification; email is redundant |

---

## Prerequisites

### Required Accounts & Services

#### 1. **Google Cloud Platform Account**
- Create account at: https://console.cloud.google.com
- Enable billing (free tier available)
- Required for Google Calendar API access

#### 2. **Resend Account**
- Sign up at: https://resend.com
- Free tier: 100 emails/day, 3,000 emails/month
- Paid plans available for higher volume

#### 3. **Domain Access**
- Control over `orcaclub.pro` DNS settings
- Required for Resend domain verification
- Ability to add TXT, MX, and DKIM records

### Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| **Node.js** | 18.17.0+ | Runtime for production |
| **Bun** | 1.2.0+ | Development runtime (optional but recommended) |
| **Git** | 2.x | Version control |
| **Code Editor** | Any | VS Code recommended |

### Required Knowledge

- **TypeScript/JavaScript** - Intermediate level
- **React & Next.js** - Understanding of App Router, API routes, Server/Client components
- **REST APIs** - HTTP methods, status codes, JSON
- **Google APIs** - Basic familiarity with OAuth and service accounts
- **Email Deliverability** - DNS records (SPF, DKIM, DMARC)

---

## Initial Setup

### Part 1: Google Calendar API Setup

#### Step 1.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name: `orcaclub-booking-system`
4. Click "Create"
5. Wait for project creation (takes ~30 seconds)

#### Step 1.2: Enable Google Calendar API

1. In the Cloud Console, ensure your new project is selected
2. Navigate to "APIs & Services" → "Library"
3. Search for "Google Calendar API"
4. Click on "Google Calendar API"
5. Click "Enable"
6. Wait for API activation

#### Step 1.3: Create Service Account

1. Navigate to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in details:
   - **Service account name**: `booking-calendar-service`
   - **Service account ID**: (auto-generated)
   - **Description**: "Service account for OrcaClub booking system calendar access"
4. Click "Create and Continue"
5. **Grant this service account access to project** (Role selection):
   - Skip this step (click "Continue")
6. **Grant users access to this service account**:
   - Skip this step (click "Done")

#### Step 1.4: Create Service Account Key

1. In "Credentials" page, find your service account under "Service Accounts"
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" → "Create new key"
5. Select "JSON" format
6. Click "Create"
7. **IMPORTANT**: A JSON file will download - this is your credentials file
8. **Store this file securely** - it contains sensitive credentials

#### Step 1.5: Set Up Domain-Wide Delegation (Optional but Recommended)

This allows the service account to act on behalf of a user in your Google Workspace domain.

1. In the service account details page, check "Enable Google Workspace Domain-wide Delegation"
2. Click "Save"
3. Note the "Client ID" (numeric ID)
4. Go to [Google Workspace Admin Console](https://admin.google.com) (requires admin access)
5. Navigate to "Security" → "API Controls" → "Domain-wide Delegation"
6. Click "Add new"
7. Enter the Client ID from step 3
8. Add OAuth Scopes:
   ```
   https://www.googleapis.com/auth/calendar
   ```
9. Click "Authorize"

**Without domain-wide delegation**: Calendar events will be created by the service account, and invitations will come from a generic address.

**With domain-wide delegation**: Events can be created on behalf of your user (e.g., `chance@orcaclub.pro`), and invitations will appear to come from you.

#### Step 1.6: Share Calendar with Service Account

1. Open [Google Calendar](https://calendar.google.com)
2. On the left sidebar, find the calendar you want to use for bookings
3. Click the three dots next to the calendar → "Settings and sharing"
4. Scroll to "Share with specific people"
5. Click "Add people"
6. Enter the service account email (found in your credentials JSON file, looks like `booking-calendar-service@orcaclub-booking-system.iam.gserviceaccount.com`)
7. Set permission to "Make changes to events"
8. Click "Send"

#### Step 1.7: Get Calendar ID

1. In Calendar Settings (same page as above)
2. Scroll to "Integrate calendar"
3. Copy the "Calendar ID" (usually `primary` for your main calendar, or an email-like ID)
4. Save this for later - you'll need it in environment variables

### Part 2: Resend Email Setup

#### Step 2.1: Create Resend Account

1. Go to [Resend](https://resend.com)
2. Click "Sign Up"
3. Create account with email/password or GitHub
4. Verify your email address

#### Step 2.2: Get API Key

1. Log in to [Resend Dashboard](https://resend.com/overview)
2. Navigate to "API Keys" in the sidebar
3. Click "Create API Key"
4. Name: `OrcaClub Production` (or `Development` for testing)
5. Permission: Select "Sending access" (full access if you plan to use webhooks)
6. Click "Create"
7. **IMPORTANT**: Copy the API key immediately - it won't be shown again
8. Store securely

#### Step 2.3: Verify Domain

**Important**: Until your domain is verified, you can only send emails to the email address you signed up with. Use `onboarding@resend.dev` as the sender for testing.

1. In Resend Dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter `orcaclub.pro`
4. Click "Add"

#### Step 2.4: Add DNS Records

Resend will provide you with DNS records to add to your domain:

##### **TXT Record (Domain Verification)**
```
Type: TXT
Name: @ (or leave blank, depending on DNS provider)
Value: resend-verify=xyz123abc456... (provided by Resend)
TTL: 3600 (or Auto)
```

##### **DKIM Record (Email Authentication)**
```
Type: TXT
Name: resend._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSq... (provided by Resend)
TTL: 3600
```

##### **SPF Record (Add to existing or create new)**
```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

**If you already have an SPF record**, modify it to include Resend:
```
Old: v=spf1 include:_spf.google.com ~all
New: v=spf1 include:_spf.google.com include:_spf.resend.com ~all
```

##### **MX Records (Optional - for receiving emails)**
Only needed if you want to receive emails via Resend:
```
Type: MX
Name: @ (or leave blank)
Value: mx1.resend.com
Priority: 10
```

#### Step 2.5: Verify Domain Status

1. After adding DNS records, wait 5-60 minutes for propagation
2. Return to Resend Dashboard → Domains
3. Click "Verify" next to your domain
4. If successful, status will change to "Verified"
5. If not verified yet, wait longer or check DNS records with:
   ```bash
   dig TXT orcaclub.pro
   dig TXT resend._domainkey.orcaclub.pro
   ```

### Part 3: Project Environment Configuration

#### Step 3.1: Environment Variables Setup

Create or update `.env.local` in your project root:

```bash
# =====================================================
# GOOGLE CALENDAR API CONFIGURATION
# =====================================================

# Service Account Credentials (JSON content, minified)
# Get from: Google Cloud Console → Service Accounts → Keys → Downloaded JSON
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"orcaclub-booking-system","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"booking-calendar-service@orcaclub-booking-system.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

# Calendar ID to use (usually 'primary' or a specific calendar ID)
GOOGLE_CALENDAR_ID=primary

# Email address to impersonate (only if using domain-wide delegation)
# Leave empty if not using delegation
GOOGLE_DELEGATED_USER_EMAIL=chance@orcaclub.pro

# =====================================================
# RESEND EMAIL API CONFIGURATION
# =====================================================

# Resend API Key
# Get from: Resend Dashboard → API Keys
RESEND_API_KEY=re_LkZsENn1_Dg8SRYyBYXTYnwT9aFA2zYXJ

# =====================================================
# APPLICATION CONFIGURATION
# =====================================================

# Public URL of your application (used in emails)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# =====================================================
# OPTIONAL: WEBHOOK CONFIGURATION
# =====================================================

# Resend Webhook Secret (for webhook verification)
# Get from: Resend Dashboard → Webhooks → Create Webhook → Copy Secret
# RESEND_WEBHOOK_SECRET=whsec_abc123...
```

**⚠️ Security Notes:**
- **NEVER commit `.env.local` to version control**
- The `.gitignore` file should already exclude it
- Use different API keys for development vs. production
- Rotate keys regularly (every 90 days recommended)
- If keys are ever exposed, regenerate immediately

#### Step 3.2: Update Email Sender Address

After your domain is verified in Resend, update the sender email in the booking API:

**File**: `src/app/api/booking/route.ts`

```typescript
// Line 9: Update this after domain verification
const FROM_EMAIL = "bookings@orcaclub.pro"  // Change from onboarding@resend.dev

// You can use any email prefix with your verified domain:
// - bookings@orcaclub.pro
// - hello@orcaclub.pro
// - contact@orcaclub.pro
// - noreply@orcaclub.pro
```

#### Step 3.3: Install Dependencies

```bash
# With Bun (recommended)
bun install

# Or with npm
npm install

# Or with pnpm
pnpm install
```

#### Step 3.4: Verify Installation

Check that all required packages are installed:

```bash
# Check for Resend
bun run check-deps
# Or manually:
grep "resend" package.json

# Check for googleapis
grep "googleapis" package.json
```

Expected output:
```json
{
  "dependencies": {
    "resend": "^x.x.x",
    "googleapis": "^x.x.x"
  }
}
```

### Part 4: Testing the Setup

#### Step 4.1: Start Development Server

```bash
# With Bun (recommended - faster)
bun run bun:dev

# Or with Node
bun run dev
```

#### Step 4.2: Test the Booking Form

1. Open your browser to `http://localhost:3000`
2. Click "Free Consultation" button in the navigation
3. Fill out the form:
   - **Name**: Test User
   - **Email**: `your-verified-email@example.com` (use YOUR email for testing)
   - **Phone**: (optional) +1 555-123-4567
   - **Company**: (optional) Test Company
   - **Service**: Select any service
   - **Preferred Date**: Select tomorrow or any future date
   - **Preferred Time**: Wait for slots to load, then select one
   - **Project Details**: "This is a test booking"
4. Click "Submit Request"

#### Step 4.3: Verify Success

Check the following to confirm everything works:

1. **Frontend**:
   - ✅ Success toast notification appears
   - ✅ Form resets and modal closes

2. **Your Email Inbox**:
   - ✅ Confirmation email received from `bookings@orcaclub.pro` (or `onboarding@resend.dev` if domain not verified)
   - ✅ Email contains booking details
   - ✅ Email design matches branding

3. **Google Calendar**:
   - ✅ Open your Google Calendar
   - ✅ Event appears at the selected date/time
   - ✅ Event title: "ORCACLUB Consultation Invite"
   - ✅ Event contains customer details
   - ✅ Google Meet link is attached

4. **Terminal Logs**:
   - ✅ Check terminal for success messages:
     ```
     Calendar event created successfully: https://...
     Email sent successfully: { id: '...' }
     ```

#### Step 4.4: Troubleshooting First Test

If the test fails, check:

**Calendar Event Not Created:**
- Check terminal for Google Calendar errors
- Verify `GOOGLE_SERVICE_ACCOUNT_KEY` is valid JSON
- Verify calendar is shared with service account
- Check `GOOGLE_CALENDAR_ID` matches your calendar

**Email Not Received:**
- Check spam/junk folder
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard → Emails → Logs for delivery status
- If domain not verified, ensure using the email you signed up with

**Time Slots Not Loading:**
- Check browser console for errors
- Verify Google Calendar API is enabled
- Check terminal for FreeBusy API errors

---

## Development Guide

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── booking/
│   │       ├── route.ts                    # Main booking endpoint
│   │       └── available-slots/
│   │           └── route.ts                # Availability endpoint
│   └── (frontend)/
│       └── ... (pages that use booking modal)
├── components/
│   ├── booking-modal.tsx                   # Main booking form component
│   └── ui/                                 # shadcn/ui components
│       ├── dialog.tsx
│       ├── button.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   ├── google-calendar.ts                  # Google Calendar service
│   └── utils.ts                            # Utility functions
└── types/
    └── ... (TypeScript types)
```

### Adding New Fields to the Booking Form

#### Step 1: Update TypeScript Interface

**File**: `src/components/booking-modal.tsx`

```typescript
interface BookingFormData {
  name: string
  email: string
  phone: string
  company: string
  service: string
  message: string
  preferredDate: string
  preferredTime: string

  // ✅ ADD NEW FIELDS HERE
  budget: string           // Example: Budget range
  timeline: string         // Example: Project timeline
  referralSource: string   // Example: How did you hear about us?
}
```

#### Step 2: Update Initial State

```typescript
const [formData, setFormData] = useState<BookingFormData>({
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "",
  message: "",
  preferredDate: "",
  preferredTime: "",

  // ✅ ADD DEFAULT VALUES
  budget: "",
  timeline: "",
  referralSource: "",
})
```

#### Step 3: Add Form Field in JSX

```tsx
{/* Add this in the form section of booking-modal.tsx */}

{/* Budget Field */}
<div className="space-y-2">
  <Label htmlFor="budget" className="text-white font-medium">
    Budget Range <span className="text-red-500">*</span>
  </Label>
  <select
    id="budget"
    name="budget"
    required
    value={formData.budget}
    onChange={handleInputChange}
    className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md focus:border-[#67e8f9] focus:ring-1 focus:ring-[#67e8f9] focus:outline-none"
  >
    <option value="" className="bg-black">Select budget range...</option>
    <option value="under-5k" className="bg-black">Under $5,000</option>
    <option value="5k-10k" className="bg-black">$5,000 - $10,000</option>
    <option value="10k-25k" className="bg-black">$10,000 - $25,000</option>
    <option value="25k-plus" className="bg-black">$25,000+</option>
  </select>
</div>

{/* Timeline Field */}
<div className="space-y-2">
  <Label htmlFor="timeline" className="text-white font-medium">
    Project Timeline
  </Label>
  <Input
    id="timeline"
    name="timeline"
    type="text"
    value={formData.timeline}
    onChange={handleInputChange}
    placeholder="e.g., 3-6 months"
    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
  />
</div>
```

#### Step 4: Update API Route

**File**: `src/app/api/booking/route.ts`

```typescript
// Update interface
interface BookingFormData {
  name: string
  email: string
  phone: string
  company: string
  service: string
  message: string
  preferredDate: string
  preferredTime: string
  budget: string        // ✅ ADD HERE
  timeline: string      // ✅ ADD HERE
  referralSource: string // ✅ ADD HERE
}

// Update validation (if required fields)
if (!body.budget) {
  return NextResponse.json(
    { error: "Budget is required" },
    { status: 400 }
  )
}

// Update calendar event description
const calendarEventLink = await googleCalendar.createEvent({
  summary: `ORCACLUB Consultation Invite`,
  description: `
Consultation with ${name}${company ? ` from ${company}` : ''}

Service: ${service}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
Budget: ${budget}              // ✅ ADD TO DESCRIPTION
Timeline: ${timeline}          // ✅ ADD TO DESCRIPTION
Referral Source: ${referralSource}  // ✅ ADD TO DESCRIPTION

Project Details:
${message}

---
Booked via ORCACLUB Booking System
  `.trim(),
  // ... rest of config
})

// Update email templates to include new fields
```

#### Step 5: Update Email Templates

Add new fields to both customer confirmation and admin notification emails:

```typescript
// In the HTML email template, add to the details table:
<tr>
  <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400;">Budget</td>
  <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 400;">${budget}</td>
</tr>
```

### Adding New Service Types

**File**: `src/components/booking-modal.tsx`

```tsx
<select id="service" name="service" required ...>
  <option value="" className="bg-black">Select a service...</option>
  <option value="web-design" className="bg-black">Web Design</option>
  <option value="ai-automation" className="bg-black">AI & Automation</option>
  <option value="custom-software" className="bg-black">Custom Software Development</option>
  <option value="seo-services" className="bg-black">SEO Services</option>
  <option value="consulting" className="bg-black">Consulting</option>

  {/* ✅ ADD NEW SERVICES HERE */}
  <option value="mobile-app" className="bg-black">Mobile App Development</option>
  <option value="ecommerce" className="bg-black">E-commerce Solutions</option>
  <option value="branding" className="bg-black">Brand & Identity Design</option>

  <option value="other" className="bg-black">Other</option>
</select>
```

### Customizing Business Hours

#### Method 1: Update Default Parameters

**File**: `src/app/api/booking/available-slots/route.ts`

```typescript
// Change default business hours
const startHour = parseInt(searchParams.get("startHour") || "9")   // 9 AM → Change to 8 for 8 AM
const endHour = parseInt(searchParams.get("endHour") || "17")       // 5 PM → Change to 18 for 6 PM
```

#### Method 2: Make Configurable via Query Params

Frontend can pass custom hours:

```typescript
// In booking-modal.tsx
const response = await fetch(
  `/api/booking/available-slots?date=${date}&startHour=8&endHour=18&duration=30`
)
```

#### Method 3: Environment Variables (Recommended for Production)

**File**: `.env.local`

```bash
BOOKING_START_HOUR=9
BOOKING_END_HOUR=17
BOOKING_SLOT_DURATION=60
BOOKING_TIMEZONE=America/Los_Angeles
```

**File**: `src/app/api/booking/available-slots/route.ts`

```typescript
const startHour = parseInt(
  searchParams.get("startHour") || process.env.BOOKING_START_HOUR || "9"
)
const endHour = parseInt(
  searchParams.get("endHour") || process.env.BOOKING_END_HOUR || "17"
)
const duration = parseInt(
  searchParams.get("duration") || process.env.BOOKING_SLOT_DURATION || "60"
)
```

### Customizing Email Templates

Email templates are in `src/app/api/booking/route.ts` (lines 65-261 for customer email, lines 265-454 for admin email).

#### Changing Colors

Replace color hex codes:

```typescript
// Old cyan accent
style="color: #67e8f9"

// New purple accent
style="color: #a855f7"
```

Update gradient backgrounds:

```typescript
// Old gradient
style="background: linear-gradient(45deg, #67e8f9, #3b82f6)"

// New gradient
style="background: linear-gradient(45deg, #a855f7, #8b5cf6)"
```

#### Adding a Logo

1. Host your logo image (e.g., on Vercel, Cloudflare, or Imgur)
2. Add to email template:

```html
<img
  src="https://orcaclub.pro/media/logo.png"
  alt="ORCACLUB Logo"
  style="max-width: 150px; height: auto; margin-bottom: 16px;"
/>
```

#### Changing Wording

Simply edit the text content in the HTML and text templates:

```typescript
// Old
<p>We've received your consultation request and our team is excited to learn more about your project.</p>

// New
<p>Thank you for choosing ORCACLUB! We're thrilled to discuss your project and explore how we can help bring your vision to life.</p>
```

### Extending Google Calendar Functionality

#### Adding Reminders

**File**: `src/lib/google-calendar.ts` (line 84-89)

```typescript
reminders: {
  useDefault: false,
  overrides: [
    { method: 'popup', minutes: 60 },      // 1 hour before (popup)
    { method: 'email', minutes: 1440 },    // ✅ ADD: 24 hours before (email)
    { method: 'popup', minutes: 10 },      // ✅ ADD: 10 minutes before (popup)
  ],
},
```

#### Adding Custom Event Colors

```typescript
const event: calendar_v3.Schema$Event = {
  summary: eventData.summary,
  description: eventData.description,

  // ✅ ADD: Color ID (1-11)
  // 1=Lavender, 2=Sage, 3=Grape, 4=Flamingo, 5=Banana,
  // 6=Tangerine, 7=Peacock, 8=Graphite, 9=Blueberry, 10=Basil, 11=Tomato
  colorId: '9',  // Blueberry (blue)

  start: { ... },
  end: { ... },
  // ... rest
}
```

#### Canceling/Updating Events

Add helper functions to `google-calendar.ts`:

```typescript
// Cancel a booking by deleting the event
async cancelBooking(eventId: string): Promise<boolean> {
  return await this.deleteEvent(eventId)
}

// Reschedule a booking
async rescheduleBooking(
  eventId: string,
  newStartDateTime: string,
  newEndDateTime: string
): Promise<boolean> {
  return await this.updateEvent(eventId, {
    startDateTime: newStartDateTime,
    endDateTime: newEndDateTime,
  })
}
```

---

## API Reference

### POST /api/booking

Submit a new booking request.

#### Request

```typescript
POST /api/booking
Content-Type: application/json

{
  "name": "John Doe",                      // Required: Customer full name
  "email": "john@example.com",             // Required: Valid email address
  "phone": "+1 (555) 123-4567",            // Optional: Phone number
  "company": "Acme Inc.",                  // Optional: Company name
  "service": "web-design",                 // Required: Service type
  "message": "I need a new website...",    // Required: Project details
  "preferredDate": "2025-12-25",           // Required: YYYY-MM-DD format
  "preferredTime": "2025-12-25T10:00:00-08:00" // Required: ISO 8601 datetime
}
```

#### Response (Success)

```typescript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Booking request submitted successfully",
  "customerEmailId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "calendarEventLink": "https://calendar.google.com/calendar/event?eid=..."
}
```

#### Response (Error - Missing Fields)

```typescript
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Missing required fields"
}
```

#### Response (Error - Invalid Email)

```typescript
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid email address"
}
```

#### Response (Error - Time Slot Taken)

```typescript
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "Time slot no longer available",
  "details": "This time slot was just booked. Please select another time."
}
```

#### Response (Error - Server Error)

```typescript
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Failed to process booking request",
  "details": "Error message here"
}
```

### GET /api/booking/available-slots

Retrieve available time slots for a specific date.

#### Request

```typescript
GET /api/booking/available-slots?date=2025-12-25&duration=60&startHour=9&endHour=17&timeZone=America/Los_Angeles
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | string | **Yes** | - | Date in YYYY-MM-DD format |
| `duration` | number | No | 60 | Slot duration in minutes (15-240) |
| `startHour` | number | No | 9 | Business hours start (0-23) |
| `endHour` | number | No | 17 | Business hours end (0-23) |
| `timeZone` | string | No | America/Los_Angeles | IANA timezone |

#### Response (Success)

```typescript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "date": "2025-12-25",
  "timeZone": "America/Los_Angeles",
  "slots": [
    {
      "start": "2025-12-25T09:00:00-08:00",
      "end": "2025-12-25T10:00:00-08:00",
      "label": "9:00 AM"
    },
    {
      "start": "2025-12-25T10:00:00-08:00",
      "end": "2025-12-25T11:00:00-08:00",
      "label": "10:00 AM"
    },
    {
      "start": "2025-12-25T14:00:00-08:00",
      "end": "2025-12-25T15:00:00-08:00",
      "label": "2:00 PM"
    }
  ],
  "count": 3
}
```

#### Response (No Slots Available)

```typescript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "date": "2025-12-25",
  "timeZone": "America/Los_Angeles",
  "slots": [],
  "count": 0
}
```

#### Response (Error - Missing Date)

```typescript
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Missing date parameter"
}
```

#### Response (Error - Invalid Date Format)

```typescript
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid date format. Use YYYY-MM-DD"
}
```

#### Response (Error - Past Date)

```typescript
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Cannot book slots in the past"
}
```

---

## Component Reference

### BookingModal

**Location**: `src/components/booking-modal.tsx`

**Description**: Main booking form component with dialog modal, form validation, and real-time slot loading.

#### Props

```typescript
// This component uses shadcn/ui Dialog with a trigger button
// No props needed - it's self-contained
```

#### Usage

```tsx
import { BookingModal } from '@/components/booking-modal'

export default function Page() {
  return (
    <div>
      {/* The button is built into the component */}
      <BookingModal />
    </div>
  )
}
```

#### Customization

##### Change Button Text

```tsx
// Line 142-147 in booking-modal.tsx
<DialogTrigger asChild>
  <Button variant="default" className="...">
    Free Consultation  {/* ✅ Change text here */}
  </Button>
</DialogTrigger>
```

##### Change Button Style

```tsx
<Button
  variant="default"
  className="bg-[#67e8f9] text-black hover:bg-[#67e8f9]/90 font-semibold"
  {/* ✅ Modify className for different styling */}
>
  Book Now
</Button>
```

##### Use as Separate Button

```tsx
import { BookingModal } from '@/components/booking-modal'
import { Button } from '@/components/ui/button'

// Modify BookingModal to expose setOpen:
export function BookingModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>Free Consultation</Button>
        </DialogTrigger>
      )}
      {/* ... rest of modal */}
    </Dialog>
  )
}

// Usage:
<BookingModal trigger={<Button variant="outline">Schedule Call</Button>} />
```

#### State Management

```typescript
const [open, setOpen] = useState(false)              // Modal visibility
const [isSubmitting, setIsSubmitting] = useState(false)  // Form submission state
const [isLoadingSlots, setIsLoadingSlots] = useState(false) // Slots loading state
const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]) // Available slots
const [formData, setFormData] = useState<BookingFormData>({ ... }) // Form data
```

#### Key Functions

##### handleInputChange

```typescript
const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value } = e.target
  setFormData((prev) => ({ ...prev, [name]: value }))

  // Special handling: when date changes, fetch slots
  if (name === "preferredDate" && value) {
    fetchAvailableSlots(value)
  }
}
```

##### fetchAvailableSlots

```typescript
const fetchAvailableSlots = async (date: string) => {
  setIsLoadingSlots(true)
  setAvailableSlots([])
  setFormData((prev) => ({ ...prev, preferredTime: "" }))

  try {
    const response = await fetch(`/api/booking/available-slots?date=${date}`)
    const data = await response.json()

    if (!response.ok) throw new Error(data.error)

    setAvailableSlots(data.slots || [])

    if (data.slots.length === 0) {
      toast.info("No available slots", {
        description: "This date is fully booked. Please select another date.",
      })
    }
  } catch (error) {
    console.error("Failed to fetch slots:", error)
    toast.error("Unable to load available times")
  } finally {
    setIsLoadingSlots(false)
  }
}
```

##### handleSubmit

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    const response = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error)

    toast.success("Booking request submitted!", {
      description: "We'll get back to you within 24 hours.",
    })

    // Reset and close
    setFormData({ /* reset all fields */ })
    setAvailableSlots([])
    setOpen(false)
  } catch (error) {
    toast.error("Something went wrong", {
      description: error instanceof Error ? error.message : "Please try again later.",
    })
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## Integration Guides

### Google Calendar Integration

#### Architecture

The Google Calendar integration uses:
- **googleapis** npm package (official Node.js client)
- **Service Account** authentication (no OAuth flow required)
- **Calendar v3 API**
- **FreeBusy API** for efficient availability checking

#### Authentication Flow

```
1. Service Account Credentials (JSON) loaded from environment
2. GoogleAuth client created with credentials
3. Optional: Domain-wide delegation to impersonate user
4. Calendar API client initialized with auth
5. API requests made with authenticated client
```

#### Key Methods

##### createEvent

```typescript
await googleCalendar.createEvent({
  summary: "ORCACLUB Consultation Invite",
  description: "Customer details and project info...",
  startDateTime: "2025-12-25T10:00:00-08:00",
  endDateTime: "2025-12-25T11:00:00-08:00",
  attendeeEmail: "john@example.com",
  attendeeName: "John Doe",
  timeZone: "America/Los_Angeles"
})

// Returns: Calendar event HTML link or null
```

##### isTimeSlotAvailable

```typescript
await googleCalendar.isTimeSlotAvailable(
  "2025-12-25T10:00:00-08:00",  // start
  "2025-12-25T11:00:00-08:00"   // end
)

// Returns: true if no conflicting events, false otherwise
```

##### getAvailableSlots

```typescript
await googleCalendar.getAvailableSlots(
  "2025-12-25",        // date (YYYY-MM-DD)
  60,                  // duration in minutes
  9,                   // business hours start (9 AM)
  17,                  // business hours end (5 PM)
  "America/Los_Angeles" // timezone
)

// Returns: Array of { start, end, label } objects
```

#### Quotas & Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Queries per day | 1,000,000 | Shared across all API methods |
| Queries per 100 seconds | 50,000 | Rate limit |
| FreeBusy queries per day | 150,000 | Specific to FreeBusy API |
| Events per calendar | Unlimited | No hard limit |

**Recommendation**: Implement caching for frequently requested dates to reduce API calls.

#### Error Handling

```typescript
try {
  const event = await googleCalendar.createEvent(eventData)
} catch (error) {
  if (error.code === 403) {
    // Permission denied - check calendar sharing
  } else if (error.code === 404) {
    // Calendar not found - check GOOGLE_CALENDAR_ID
  } else if (error.code === 409) {
    // Conflict (e.g., duplicate event)
  } else {
    // Other errors
  }
}
```

### Resend Email Integration

#### Authentication

Resend uses API key authentication via `Authorization` header:

```typescript
const resend = new Resend(process.env.RESEND_API_KEY)
```

#### Sending Emails

##### Single Email

```typescript
const { data, error } = await resend.emails.send({
  from: "bookings@orcaclub.pro",
  to: "customer@example.com",
  subject: "ORCACLUB Consultation",
  html: "<h1>Thank you for booking!</h1>",
  text: "Thank you for booking!",  // Plain text fallback
  replyTo: "chance@orcaclub.pro",   // Optional
  cc: ["team@orcaclub.pro"],        // Optional
  bcc: ["archive@orcaclub.pro"],    // Optional
  attachments: [                    // Optional
    {
      filename: "invoice.pdf",
      content: base64EncodedPDF
    }
  ]
})

if (error) {
  console.error("Email failed:", error)
} else {
  console.log("Email sent:", data.id)
}
```

##### Batch Emails

```typescript
const { data, error } = await resend.batch.send([
  { from: "...", to: "customer1@...", subject: "...", html: "..." },
  { from: "...", to: "customer2@...", subject: "...", html: "..." },
])
```

#### Email Templates Best Practices

1. **Always provide both HTML and text versions**
   - HTML for rich formatting
   - Text for email clients that don't support HTML

2. **Use inline CSS** (not `<style>` tags or external stylesheets)
   - Email clients strip `<style>` tags
   - All styling must be inline: `style="color: #67e8f9;"`

3. **Use tables for layout** (not divs/flexbox/grid)
   - Email clients don't support modern CSS layout
   - Use `<table role="presentation">` for structure

4. **Test across email clients**
   - Gmail, Outlook, Apple Mail, Yahoo, etc.
   - Use services like Litmus or Email on Acid for testing

5. **Optimize images**
   - Host images externally (not inline Base64 for large images)
   - Provide alt text for accessibility
   - Size images appropriately (max 600px width)

#### Rate Limits

| Plan | Limit |
|------|-------|
| **Free** | 100 emails/day, 3,000 emails/month |
| **Pro** | 50,000 emails/month, then $0.40/1k |
| **Enterprise** | Custom volume, dedicated support |

**Best Practice**: Monitor usage in Resend dashboard and set up alerts.

#### Error Codes

```typescript
if (error) {
  switch (error.statusCode) {
    case 400:
      // Bad request - check email format, missing fields
      break
    case 401:
      // Invalid API key
      break
    case 403:
      // Domain not verified or permission denied
      break
    case 404:
      // Resource not found
      break
    case 422:
      // Validation error - check email addresses
      break
    case 429:
      // Rate limit exceeded
      break
    case 500:
      // Resend server error
      break
  }
}
```

### PayloadCMS Lead Storage Integration

#### Architecture Overview

The booking system uses **PayloadCMS 3.x** as a headless CMS to persistently store all booking leads in **MongoDB**. This ensures that even if external services (email, calendar) fail, customer data is never lost.

**Key Design Principles:**

1. **Save First, Process Later** - Lead is saved to PayloadCMS BEFORE email/calendar operations
2. **Graceful Degradation** - If PayloadCMS fails, system continues but logs critical error
3. **Atomic Updates** - Lead status updated incrementally as operations succeed
4. **Referential Integrity** - Lead ID included in calendar events and API responses

**Data Flow:**

```
User submits booking
    ↓
Validation passes
    ↓
⭐ SAVE TO PAYLOADCMS (status: "new")
    ↓
Create Google Calendar event
    ↓
Update lead (calendarCreated: true, status: "scheduled")
    ↓
Send confirmation emails
    ↓
Update lead (emailSent: true)
    ↓
Return success with leadId
```

#### Leads Collection Schema

**Collection**: `leads`
**Location**: `src/lib/payload/payload.config.ts` (lines 117-253)

> **⚠️ v2.0 Update**: `preferredDate` and `preferredTime` are now **OPTIONAL** to support contact form submissions without scheduling.

##### Required Fields

| Field | Type | Validation | Description |
|-------|------|-----------|-------------|
| `name` | text | required | Customer full name |
| `email` | email | required | Customer email address |
| `service` | select | required | Selected service type |
| `message` | textarea | required | Project details and requirements |
| `status` | select | required, default: "new" | Lead status tracking |

##### Optional Fields (Including Booking Fields)

| Field | Type | Description |
|-------|------|-------------|
| `phone` | text | Customer phone number |
| `company` | text | Customer company name |
| `notes` | textarea | Internal admin notes |
| `preferredDate` | date | **⚠️ v2.0: OPTIONAL** - Preferred consultation date (NULL for contact form) |
| `preferredTime` | text | **⚠️ v2.0: OPTIONAL** - Preferred time in ISO 8601 format (NULL for contact form) |

##### System Tracking Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `emailSent` | checkbox | false | Whether confirmation email was sent |
| `calendarCreated` | checkbox | false | Whether calendar event was created |
| `calendarEventLink` | text | - | Link to Google Calendar event |

##### Service Options

```typescript
'web-design'          // Web Design
'ai-automation'       // AI & Automation
'custom-software'     // Custom Software Development
'seo-services'        // SEO Services
'consulting'          // Consulting
'other'              // Other
```

##### Status Options

```typescript
'new'         // Initial state when lead is created
'contacted'   // Admin has reached out to customer
'scheduled'   // Calendar event confirmed
'completed'   // Consultation completed
'cancelled'   // Booking cancelled
```

#### Accessing Leads in PayloadCMS Admin

##### Step 1: Access Admin Panel

1. Start your development server:
   ```bash
   bun run bun:dev
   ```

2. Navigate to: `http://localhost:3000/admin`

3. Log in with your admin credentials

##### Step 2: View Leads

1. In the left sidebar, click "Leads" (under "Content" group)
2. You'll see a table with columns:
   - Name
   - Email
   - Service
   - Preferred Date
   - Status
   - Created At

##### Step 3: View Lead Details

1. Click on any lead to view full details
2. Sidebar shows:
   - Status (editable dropdown)
   - Email Sent (checkbox indicator)
   - Calendar Created (checkbox indicator)
   - Calendar Event Link (clickable link)

##### Step 4: Manage Leads

**Update Status:**
- Click "Edit" on a lead
- Change status in sidebar (e.g., from "new" to "contacted")
- Click "Save"

**Add Internal Notes:**
- Scroll to "Notes" field
- Add internal comments (not visible to customer)
- Click "Save"

**Filter Leads:**
- Use search bar to find by name/email
- Click column headers to sort

**Export Leads:**
- PayloadCMS supports CSV export (requires custom implementation)

#### Lead Lifecycle & Status Workflow

##### Standard Workflow

```
1. NEW (Default)
   ↓
   Customer submits booking
   Lead created in PayloadCMS
   Status: "new"

2. SCHEDULED (Automatic)
   ↓
   Calendar event created successfully
   Status auto-updated to "scheduled"
   calendarCreated: true

3. CONTACTED (Manual)
   ↓
   Admin reviews lead and reaches out
   Manually update status to "contacted"

4. COMPLETED (Manual)
   ↓
   Consultation takes place
   Manually update status to "completed"

ALTERNATIVE:
5. CANCELLED (Manual)
   ↓
   Customer or admin cancels
   Manually update status to "cancelled"
```

##### Status Meanings

- **new**: Just submitted, awaiting admin review
- **contacted**: Admin has reached out to customer
- **scheduled**: Calendar event confirmed, awaiting consultation
- **completed**: Consultation has taken place
- **cancelled**: Booking cancelled before completion

##### Recommended SOP (Standard Operating Procedure)

1. **Daily Review** (Every morning at 9 AM):
   - Check all "new" leads
   - Verify calendar events were created
   - Verify confirmation emails were sent
   - If any issues, manually follow up

2. **Lead Follow-Up** (Within 24 hours):
   - Review lead details
   - Call or email customer to confirm
   - Update status to "contacted"

3. **Pre-Consultation** (1 day before):
   - Check calendar event exists
   - Verify customer received invitation
   - Send reminder if needed

4. **Post-Consultation** (Same day):
   - Update status to "completed"
   - Add notes about discussion
   - Create follow-up tasks if needed

#### Querying Leads Programmatically

PayloadCMS provides a **Local API** for server-side operations.

##### Get All Leads

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const leads = await payload.find({
  collection: 'leads',
  sort: '-createdAt', // Most recent first
  limit: 100,
})

console.log(`Found ${leads.totalDocs} leads`)
leads.docs.forEach(lead => {
  console.log(`${lead.name} - ${lead.email} - ${lead.status}`)
})
```

##### Filter by Status

```typescript
const newLeads = await payload.find({
  collection: 'leads',
  where: {
    status: {
      equals: 'new',
    },
  },
})

console.log(`${newLeads.totalDocs} new leads awaiting review`)
```

##### Filter by Date Range

```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)

const todaysLeads = await payload.find({
  collection: 'leads',
  where: {
    createdAt: {
      greater_than_equal: today.toISOString(),
    },
  },
})

console.log(`${todaysLeads.totalDocs} leads submitted today`)
```

##### Get Single Lead by ID

```typescript
const lead = await payload.findByID({
  collection: 'leads',
  id: 'lead-id-here',
})

console.log(`Lead: ${lead.name} (${lead.email})`)
console.log(`Status: ${lead.status}`)
console.log(`Email sent: ${lead.emailSent}`)
console.log(`Calendar created: ${lead.calendarCreated}`)
```

##### Update Lead Status

```typescript
const updatedLead = await payload.update({
  collection: 'leads',
  id: 'lead-id-here',
  data: {
    status: 'contacted',
    notes: 'Called customer, confirmed consultation time.',
  },
})

console.log(`Updated lead ${updatedLead.id} to status: ${updatedLead.status}`)
```

##### Complex Queries

```typescript
// Find all scheduled leads with email sent but no calendar event
const problematicLeads = await payload.find({
  collection: 'leads',
  where: {
    and: [
      {
        emailSent: {
          equals: true,
        },
      },
      {
        calendarCreated: {
          equals: false,
        },
      },
      {
        status: {
          not_equals: 'cancelled',
        },
      },
    ],
  },
})

console.log(`${problematicLeads.totalDocs} leads need calendar event creation`)
```

#### Integration with Booking Flow

##### Booking API Implementation

**File**: `src/app/api/booking/route.ts`

The booking API follows this sequence:

```typescript
export async function POST(request: NextRequest) {
  let leadId: string | null = null

  try {
    // 1. Parse and validate request body
    const body: BookingFormData = await request.json()

    // 2. Validate required fields
    if (!body.name || !body.email || !body.service ||
        !body.message || !body.preferredDate || !body.preferredTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 3. ⭐ SAVE TO PAYLOADCMS FIRST (CRITICAL)
    try {
      const payload = await getPayload({ config })

      const lead = await payload.create({
        collection: 'leads',
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone || '',
          company: body.company || '',
          service: body.service,
          message: body.message,
          preferredDate: body.preferredDate,
          preferredTime: body.preferredTime,
          status: 'new',
          emailSent: false,
          calendarCreated: false,
        },
      })

      leadId = lead.id
      console.log(`[Booking] Lead created: ${leadId}`)
    } catch (payloadError) {
      console.error('[Booking] CRITICAL: Failed to save lead:', payloadError)
      // Continue with email/calendar even if Payload fails
      // This is a fail-safe - we don't want to lose the booking
    }

    // 4. Create Google Calendar event
    let calendarCreated = false
    let calendarEventLink = null

    try {
      calendarEventLink = await googleCalendar.createEvent({
        summary: `ORCACLUB Consultation Invite`,
        description: `Lead ID: ${leadId}\n\n${body.message}`,
        startDateTime: body.preferredTime,
        endDateTime: /* ... calculate end time ... */,
        attendeeEmail: body.email,
        attendeeName: body.name,
      })

      calendarCreated = !!calendarEventLink

      // Update lead with calendar info
      if (leadId && calendarCreated) {
        await payload.update({
          collection: 'leads',
          id: leadId,
          data: {
            calendarCreated: true,
            calendarEventLink,
            status: 'scheduled',
          },
        })
      }
    } catch (calendarError) {
      console.error('[Booking] Calendar creation failed:', calendarError)
    }

    // 5. Send confirmation email
    let emailSent = false

    try {
      await resend.emails.send({
        from: 'bookings@orcaclub.pro',
        to: body.email,
        subject: 'ORCACLUB Consultation Confirmed',
        html: /* ... email template ... */,
      })

      emailSent = true

      // Update lead with email status
      if (leadId) {
        await payload.update({
          collection: 'leads',
          id: leadId,
          data: { emailSent: true },
        })
      }
    } catch (emailError) {
      console.error('[Booking] Email send failed:', emailError)
    }

    // 6. Return success with lead ID
    return NextResponse.json({
      success: true,
      message: "Booking request submitted successfully",
      leadId,
      calendarEventLink,
      emailSent,
      calendarCreated,
    }, { status: 200 })

  } catch (error) {
    console.error('[Booking] Error:', error)

    // Even on error, return leadId if we have it
    return NextResponse.json({
      error: "Failed to process booking",
      details: error instanceof Error ? error.message : "Unknown error",
      leadId, // Admin knows lead was saved
    }, { status: 500 })
  }
}
```

##### Key Integration Points

1. **Lead ID in Calendar Description**
   - Every calendar event includes `Lead ID: ${leadId}` in description
   - Allows cross-referencing between PayloadCMS and Google Calendar

2. **Lead ID in API Response**
   - Always returned to frontend (even on error)
   - Can be displayed to user for reference
   - Logged for debugging

3. **Status Tracking**
   - `emailSent` boolean tracks email delivery
   - `calendarCreated` boolean tracks calendar event
   - `status` enum tracks overall lead state

4. **Error Resilience**
   - PayloadCMS save wrapped in try-catch
   - System continues if Payload fails (logged as CRITICAL)
   - Other operations update lead incrementally

#### Backup & Data Retention

##### MongoDB Backups

**Recommendation**: Set up automated daily backups of MongoDB database.

##### Option 1: MongoDB Atlas Automated Backups

If using MongoDB Atlas (recommended):

1. Go to MongoDB Atlas Dashboard
2. Select your cluster
3. Click "Backup" tab
4. Enable "Cloud Provider Snapshots"
5. Configure retention policy:
   - **Daily snapshots**: Retain 7 days
   - **Weekly snapshots**: Retain 4 weeks
   - **Monthly snapshots**: Retain 12 months

##### Option 2: Manual MongoDB Backups

For self-hosted MongoDB:

```bash
#!/bin/bash
# Script: backup-mongodb.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/backups/mongodb"
MONGO_URI="mongodb+srv://user:password@cluster.mongodb.net/orcapod"

# Create backup
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/$DATE.tar.gz" "$BACKUP_DIR/$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/$DATE.tar.gz"
```

**Schedule with cron**:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-mongodb.sh
```

##### Option 3: PayloadCMS Export Plugin

Install export plugin for CSV/JSON exports:

```bash
bun add @payloadcms/plugin-export
```

```typescript
// src/lib/payload/payload.config.ts
import { exportPlugin } from '@payloadcms/plugin-export'

export default buildConfig({
  plugins: [
    exportPlugin({
      collections: ['leads'],
      beforeExport: async (data) => {
        // Transform data before export
        return data
      },
    }),
  ],
  // ... rest of config
})
```

##### Data Retention Policy

**Recommendation**:

- **Active Leads** (new, contacted, scheduled): Retain indefinitely
- **Completed Leads**: Retain for 2 years (for analytics/follow-up)
- **Cancelled Leads**: Retain for 1 year
- **Spam/Invalid Leads**: Delete after 90 days

**Implementation**:

```typescript
// scripts/cleanup-old-leads.ts
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

// Delete cancelled leads older than 1 year
const oneYearAgo = new Date()
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

const deletedLeads = await payload.delete({
  collection: 'leads',
  where: {
    and: [
      {
        status: {
          equals: 'cancelled',
        },
      },
      {
        createdAt: {
          less_than: oneYearAgo.toISOString(),
        },
      },
    ],
  },
})

console.log(`Deleted ${deletedLeads.docs.length} old cancelled leads`)
```

**Schedule cleanup** (monthly cron job):
```bash
0 0 1 * * cd /var/www/orcaclubpro && bun run scripts/cleanup-old-leads.ts
```

#### PayloadCMS Admin Best Practices

1. **Regular Review** - Check leads daily for new submissions

2. **Status Hygiene** - Keep status updated to reflect real state

3. **Notes Documentation** - Add detailed notes for complex cases

4. **Backup Verification** - Test backup restoration quarterly

5. **Monitor Storage** - Watch MongoDB storage usage, set up alerts

6. **Access Control** - Restrict PayloadCMS admin access to authorized users only

7. **Audit Trail** - PayloadCMS automatically tracks createdAt, updatedAt, and user who made changes

#### Troubleshooting PayloadCMS Integration

##### Issue: Lead not saved to PayloadCMS

**Symptoms**: Booking succeeds but lead missing from admin panel

**Possible Causes**:
- MongoDB connection failed
- Invalid data format
- PayloadCMS server not running

**Solutions**:
```bash
# Check terminal logs for PayloadCMS errors
# Look for: "[Booking] CRITICAL: Failed to save lead"

# Verify MongoDB connection
echo $DATABASE_URI
# Should be: mongodb+srv://...

# Test PayloadCMS connection
curl http://localhost:3000/admin
# Should return HTML (admin panel)

# Check MongoDB Atlas cluster status
# Visit: https://cloud.mongodb.com
```

##### Issue: Lead created but not updated after email/calendar

**Symptoms**: Lead exists with status "new" but email was sent

**Possible Causes**:
- Lead update call failed
- Network timeout
- Payload API error

**Solutions**:
```bash
# Check terminal logs for update errors
# Look for: "Failed to update lead"

# Manually update lead via admin panel:
# 1. Go to /admin/collections/leads
# 2. Click on the lead
# 3. Manually set emailSent/calendarCreated checkboxes
# 4. Update status to "scheduled"
# 5. Click Save
```

##### Issue: Duplicate leads created

**Symptoms**: Same booking appears multiple times

**Possible Causes**:
- User clicked submit button multiple times
- Network retry logic

**Solutions**:
```bash
# Implement idempotency check (future improvement):
# - Add unique constraint on email + preferredTime
# - Check for existing lead before creating

# Current workaround:
# - Delete duplicate leads manually via admin panel
# - Keep the earliest created lead
```

---

## Configuration Reference

### Environment Variables

#### Required Variables

```bash
# Google Calendar Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Resend API Key
RESEND_API_KEY=re_abc123...
```

#### Optional Variables

```bash
# Google Calendar Configuration
GOOGLE_CALENDAR_ID=primary
GOOGLE_DELEGATED_USER_EMAIL=chance@orcaclub.pro

# Application URLs
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Business Hours (Optional - defaults to 9 AM - 5 PM)
BOOKING_START_HOUR=9
BOOKING_END_HOUR=17
BOOKING_SLOT_DURATION=60
BOOKING_TIMEZONE=America/Los_Angeles

# Resend Webhook (if using webhooks)
RESEND_WEBHOOK_SECRET=whsec_abc123...
```

### Configuration Files

#### TypeScript Config (`tsconfig.json`)

Ensure path aliases are configured:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

#### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "bun:dev": "bun --bun run next dev --turbopack",
    "build": "next build",
    "bun:build": "bun --bun run next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## Deployment

### Vercel Deployment (Recommended)

#### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Select the repository

#### Step 2: Configure Build Settings

Vercel auto-detects Next.js projects. Confirm settings:

- **Framework Preset**: Next.js
- **Build Command**: `bun run bun:build` or `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `bun install` or `npm install`

#### Step 3: Add Environment Variables

In Vercel project settings → "Environment Variables":

```bash
# Required
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
RESEND_API_KEY=re_abc123...

# Optional
GOOGLE_CALENDAR_ID=primary
GOOGLE_DELEGATED_USER_EMAIL=chance@orcaclub.pro
NEXT_PUBLIC_SERVER_URL=https://orcaclub.pro
```

**Important**:
- Select "Production" for production-only variables
- Select "Preview" and "Development" for testing environments
- Never commit secrets to Git

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-5 minutes)
3. Vercel provides a production URL: `https://orcaclub-pro.vercel.app`

#### Step 5: Add Custom Domain

1. In Vercel project settings → "Domains"
2. Add `orcaclub.pro` and `www.orcaclub.pro`
3. Update your DNS records as instructed by Vercel
4. Wait for DNS propagation (~15 minutes to 24 hours)

#### Step 6: Test Production Deployment

1. Visit `https://orcaclub.pro`
2. Test booking flow end-to-end
3. Verify emails are sent from `bookings@orcaclub.pro`
4. Check Google Calendar events are created

### Manual Deployment (VPS / Custom Server)

#### Requirements

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18.17.0+
- PM2 or similar process manager
- Nginx or similar reverse proxy
- SSL certificate (Let's Encrypt)

#### Step 1: Clone Repository

```bash
cd /var/www
git clone https://github.com/yourusername/orcaclubpro.git
cd orcaclubpro
```

#### Step 2: Install Dependencies

```bash
npm install --production
```

#### Step 3: Create Environment File

```bash
nano .env.local
# Paste all environment variables
# Save with Ctrl+X, Y, Enter
```

#### Step 4: Build Application

```bash
npm run build
```

#### Step 5: Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "orcaclubpro" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

#### Step 6: Configure Nginx

```nginx
server {
    listen 80;
    server_name orcaclub.pro www.orcaclub.pro;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name orcaclub.pro www.orcaclub.pro;

    ssl_certificate /etc/letsencrypt/live/orcaclub.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/orcaclub.pro/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Step 7: Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Maintenance & Operations

### Monitoring Email Delivery

#### Via Resend Dashboard

1. Log in to [Resend Dashboard](https://resend.com/emails)
2. Navigate to "Emails" → "Logs"
3. Filter by:
   - Date range
   - Status (sent, delivered, bounced, complained)
   - Email address

#### Email Statuses

| Status | Description |
|--------|-------------|
| **Sent** | Email successfully sent from Resend |
| **Delivered** | Email accepted by recipient's mail server |
| **Bounced** | Email rejected (invalid address, mailbox full, etc.) |
| **Complained** | Recipient marked as spam |
| **Opened** | Recipient opened email (requires tracking) |
| **Clicked** | Recipient clicked a link (requires tracking) |

#### Handling Bounces

**Hard Bounces** (permanent failures):
- Remove email from future mailings
- Notify admin to follow up with customer

**Soft Bounces** (temporary failures):
- Retry automatically (Resend retries 3 times)
- If persistent, treat as hard bounce

### Monitoring Calendar Events

#### Via Google Calendar

1. Open [Google Calendar](https://calendar.google.com)
2. Check for newly created events
3. Verify event details are correct

#### Via Calendar API (Programmatic)

```typescript
import { googleCalendar } from '@/lib/google-calendar'

const upcomingEvents = await googleCalendar.getUpcomingEvents(10)

upcomingEvents.forEach(event => {
  console.log(`${event.summary} - ${event.start?.dateTime}`)
})
```

### Logging Best Practices

#### Current Logging

The system currently uses `console.log` and `console.error`. For production, consider:

#### Structured Logging with Pino

```bash
bun add pino pino-pretty
```

```typescript
// src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
})

// Usage:
logger.info({ bookingId: '123', email: 'test@example.com' }, 'Booking created')
logger.error({ error: err.message }, 'Failed to send email')
```

#### Error Tracking with Sentry

```bash
bun add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### Backup & Disaster Recovery

#### Calendar Backups

**Automated Google Takeout**:
1. Go to [Google Takeout](https://takeout.google.com)
2. Select "Calendar"
3. Schedule monthly exports
4. Download and store securely

**Programmatic Backup**:
```typescript
// Backup script: scripts/backup-calendar.ts
const events = await googleCalendar.getUpcomingEvents(1000)
fs.writeFileSync('backup.json', JSON.stringify(events, null, 2))
```

#### Email Backup

Resend stores email logs for **90 days** on paid plans. For longer retention:

1. Set up email forwarding to an archive inbox
2. Use BCC to archive emails automatically
3. Export logs periodically via Resend API

### Database Considerations (Future)

Currently, the system has NO database. All data is stored in:
- Google Calendar (event details)
- Resend (email logs, limited retention)

**When to add a database:**
- Need to track booking history beyond calendar
- Want analytics on bookings (conversion rates, popular services, etc.)
- Need to implement cancellation/rescheduling flows
- Want to store customer relationship data

**Recommended database**: PostgreSQL with Drizzle ORM (already in the stack per CLAUDE.md)

---

## Troubleshooting

### Common Issues

#### Issue: "Calendar event not created"

**Symptoms**: Booking succeeds, email sent, but no calendar event

**Possible Causes**:
1. Invalid service account credentials
2. Calendar not shared with service account
3. Incorrect calendar ID

**Solutions**:
```bash
# Check terminal logs for errors
# Look for: "Failed to create calendar event:"

# Verify credentials are valid JSON
echo $GOOGLE_SERVICE_ACCOUNT_KEY | jq .

# Verify calendar sharing
# Go to Google Calendar → Settings → Share with service account email

# Verify calendar ID
# Go to Google Calendar → Settings → Calendar ID
# Should match GOOGLE_CALENDAR_ID environment variable
```

#### Issue: "No time slots available" for any date

**Symptoms**: Time slot dropdown always shows "No available time slots"

**Possible Causes**:
1. Google Calendar API not enabled
2. Service account lacks calendar access
3. Calendar ID incorrect
4. FreeBusy API quota exceeded

**Solutions**:
```bash
# Check browser console for API errors
# Check terminal logs for FreeBusy errors

# Enable Google Calendar API
# Go to: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

# Check API quota
# Go to: https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas
```

#### Issue: "Emails not sending"

**Symptoms**: Booking succeeds, but customer doesn't receive confirmation email

**Possible Causes**:
1. Invalid Resend API key
2. Domain not verified
3. Email in spam folder
4. Rate limit exceeded

**Solutions**:
```bash
# Check Resend dashboard logs
# https://resend.com/emails

# Verify domain status
# https://resend.com/domains

# Check spam folder

# Verify FROM_EMAIL uses verified domain
# File: src/app/api/booking/route.ts, line 9
# Should be: bookings@orcaclub.pro (not onboarding@resend.dev)
```

#### Issue: "Time slot no longer available" error

**Symptoms**: User selects slot, submits form, gets 409 error

**Possible Causes**:
1. Slow user (slot was booked by someone else between selection and submission)
2. Multiple users booking simultaneously
3. Calendar has conflicting event added manually

**Solutions**:
- **This is expected behavior** - it prevents double booking
- User should select a different time slot
- Consider showing a warning: "This slot is in high demand. Complete your booking quickly to secure it."

#### Issue: "Invalid date format" error

**Symptoms**: API returns 400 Bad Request with "Invalid date format"

**Possible Causes**:
1. Frontend sending date in wrong format
2. Timezone issues causing date parsing errors

**Solutions**:
```typescript
// Ensure date is in YYYY-MM-DD format
const formattedDate = new Date(date).toISOString().split('T')[0]

// Check API route validation
// File: src/app/api/booking/available-slots/route.ts, lines 18-24
```

### Debug Mode

Enable verbose logging:

```typescript
// src/lib/google-calendar.ts
// Add console.logs for debugging:

async getAvailableSlots(...) {
  console.log('DEBUG: Fetching slots for date:', date)
  console.log('DEBUG: Business hours:', startHour, '-', endHour)

  const busyPeriods = await this.getFreeBusyInfo(...)
  console.log('DEBUG: Busy periods:', busyPeriods)

  const allSlots = generateTimeSlots(...)
  console.log('DEBUG: Generated slots:', allSlots.length)

  const availableSlots = filterSlots(...)
  console.log('DEBUG: Available slots after filtering:', availableSlots.length)

  return availableSlots
}
```

---

## Security Best Practices

### API Key Security

1. **Never commit secrets to Git**
   ```bash
   # Add to .gitignore (should already be there)
   .env.local
   .env.production
   ```

2. **Rotate keys regularly**
   - Every 90 days recommended
   - Immediately if exposed
   - Use separate keys for dev/staging/production

3. **Use environment variables, not hardcoded values**
   ```typescript
   // ❌ BAD
   const apiKey = "re_abc123xyz"

   // ✅ GOOD
   const apiKey = process.env.RESEND_API_KEY
   ```

4. **Restrict API key permissions**
   - Resend: Use "Sending access" only (not full access) if not using webhooks
   - Google: Use minimum required scopes

### Input Validation

1. **Always validate on the server** (never trust client-side validation alone)

2. **Sanitize user input**
   ```typescript
   import DOMPurify from 'isomorphic-dompurify'

   const sanitizedMessage = DOMPurify.sanitize(body.message)
   ```

3. **Validate email addresses**
   ```typescript
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   if (!emailRegex.test(email)) {
     return error
   }
   ```

4. **Validate dates**
   ```typescript
   const selectedDate = new Date(date)
   const today = new Date()
   today.setHours(0, 0, 0, 0)

   if (selectedDate < today) {
     return error("Cannot book in the past")
   }
   ```

### Rate Limiting (Recommended to Implement)

**Problem**: API routes are currently vulnerable to abuse (spam bookings, DDoS)

**Solution**: Implement rate limiting with `@upstash/ratelimit`

```bash
bun add @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'), // 5 requests per 10 minutes
  analytics: true,
})

// Usage in API route:
const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
const { success } = await ratelimit.limit(identifier)

if (!success) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  )
}
```

### CAPTCHA Protection (Recommended to Implement)

**Problem**: Bots can spam the booking form

**Solution**: Add hCaptcha or reCAPTCHA

#### Option 1: hCaptcha (Privacy-focused)

```bash
bun add @hcaptcha/react-hcaptcha
```

```tsx
// In booking-modal.tsx
import HCaptcha from '@hcaptcha/react-hcaptcha'

const [captchaToken, setCaptchaToken] = useState<string | null>(null)

// In form:
<HCaptcha
  sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
  onVerify={(token) => setCaptchaToken(token)}
/>

// In handleSubmit:
if (!captchaToken) {
  toast.error("Please complete the CAPTCHA")
  return
}

// Send token to API for verification
```

#### Option 2: reCAPTCHA v3 (Invisible)

```bash
bun add react-google-recaptcha-v3
```

```tsx
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

const { executeRecaptcha } = useGoogleReCaptcha()

const handleSubmit = async (e) => {
  if (!executeRecaptcha) return

  const token = await executeRecaptcha('booking')

  // Send token with booking request
}
```

### HTTPS Only

**Vercel**: HTTPS is automatic

**Custom deployment**: Use Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d orcaclub.pro -d www.orcaclub.pro
```

### CORS Configuration

If you plan to call the API from other domains:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Only allow your own domain
  const allowedOrigins = [
    'https://orcaclub.pro',
    'https://www.orcaclub.pro',
    'http://localhost:3000', // for development
  ]

  const origin = request.headers.get('origin')
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

---

## Performance Optimization

### Current Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **Booking Submission** | ~2-4 seconds | Includes calendar + email |
| **Slot Loading** | ~500-1500ms | Depends on calendar size |
| **Form Render** | <100ms | React component only |

### Optimization Strategies

#### 1. Caching Available Slots

**Problem**: Every date selection queries Google Calendar API

**Solution**: Cache slots for frequently requested dates

```typescript
// src/lib/cache.ts
const cache = new Map<string, { slots: TimeSlot[], expires: number }>()

export function getCachedSlots(date: string): TimeSlot[] | null {
  const cached = cache.get(date)
  if (cached && cached.expires > Date.now()) {
    return cached.slots
  }
  return null
}

export function setCachedSlots(date: string, slots: TimeSlot[], ttlMinutes = 5) {
  cache.set(date, {
    slots,
    expires: Date.now() + ttlMinutes * 60 * 1000
  })
}

// In available-slots/route.ts:
const cached = getCachedSlots(date)
if (cached) {
  return NextResponse.json({ slots: cached, cached: true })
}

const slots = await googleCalendar.getAvailableSlots(...)
setCachedSlots(date, slots)
return NextResponse.json({ slots })
```

#### 2. Parallel API Calls

**Current**: Sequential (calendar → email)

**Optimized**: Parallel

```typescript
// In booking/route.ts
const [calendarEventLink, customerEmail] = await Promise.all([
  googleCalendar.createEvent(eventData),
  resend.emails.send(customerEmailData)
])
```

**Benefit**: Saves ~500-1000ms

#### 3. Background Email Sending (Advanced)

**Problem**: User waits for email to send before seeing success

**Solution**: Queue email in background

```typescript
// With Vercel: Use background functions (Beta)
// Or: Use a job queue like BullMQ with Redis

import { Queue } from 'bullmq'

const emailQueue = new Queue('emails', {
  connection: { host: 'redis-host', port: 6379 }
})

// In booking/route.ts:
await emailQueue.add('send-confirmation', {
  to: email,
  subject: 'Booking Confirmation',
  html: emailTemplate
})

// Return success immediately
return NextResponse.json({ success: true })
```

#### 4. Lazy Load Modal Content

**Current**: Modal content renders on page load

**Optimized**: Dynamic import

```typescript
// src/app/page.tsx
import dynamic from 'next/dynamic'

const BookingModal = dynamic(() => import('@/components/booking-modal'), {
  loading: () => <Button disabled>Loading...</Button>,
  ssr: false // Don't render on server
})
```

**Benefit**: Reduces initial page load

#### 5. Optimize Email Templates

**Current**: Large HTML emails (~20-30KB)

**Optimized**:
- Minify HTML (remove whitespace)
- Inline CSS (already done)
- Compress images
- Use system fonts instead of web fonts

```typescript
// Minify email HTML
import { minify } from 'html-minifier'

const minifiedHTML = minify(emailTemplate, {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true
})
```

---

## Testing Strategy

### Current State

**No automated tests exist.** Manual testing only.

### Recommended Testing Approach

#### Unit Tests (Functions & Components)

**Tool**: Vitest (recommended) or Jest

```bash
bun add -d vitest @testing-library/react @testing-library/jest-dom
```

**Example test**:

```typescript
// src/lib/google-calendar.test.ts
import { describe, it, expect } from 'vitest'
import { GoogleCalendarService } from './google-calendar'

describe('GoogleCalendarService', () => {
  it('should format time labels correctly', () => {
    const service = new GoogleCalendarService()
    const date = new Date('2025-12-25T10:00:00-08:00')
    const label = service['formatTimeLabel'](date, 'America/Los_Angeles')
    expect(label).toBe('10:00 AM')
  })
})
```

#### Integration Tests (API Routes)

**Tool**: Playwright or Cypress

```bash
bun add -d @playwright/test
```

**Example test**:

```typescript
// tests/booking-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete booking flow', async ({ page }) => {
  await page.goto('http://localhost:3000')

  // Open modal
  await page.click('text=Free Consultation')

  // Fill form
  await page.fill('input[name="name"]', 'Test User')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.selectOption('select[name="service"]', 'web-design')

  // Select date
  await page.fill('input[name="preferredDate"]', '2025-12-25')

  // Wait for slots to load
  await page.waitForSelector('select[name="preferredTime"] option:nth-child(2)')

  // Select time
  await page.selectOption('select[name="preferredTime"]', { index: 1 })

  // Fill message
  await page.fill('textarea[name="message"]', 'Test booking')

  // Submit
  await page.click('button[type="submit"]')

  // Verify success
  await expect(page.locator('text=Booking request submitted!')).toBeVisible()
})
```

#### E2E Tests (Full User Journey)

Test the complete flow including external services:

```typescript
test('booking creates calendar event and sends email', async ({ page }) => {
  // ... fill and submit form

  // Verify calendar event was created (requires API access)
  const events = await googleCalendar.getUpcomingEvents(1)
  expect(events[0].summary).toContain('ORCACLUB Consultation')

  // Verify email was sent (check Resend API or inbox)
})
```

### Manual Testing Checklist

Before deploying to production:

- [ ] Test booking with all required fields
- [ ] Test booking with optional fields empty
- [ ] Test booking on different dates/times
- [ ] Test selecting fully booked date (should show "No slots")
- [ ] Test submitting with missing required fields (should show error)
- [ ] Test submitting with invalid email (should show error)
- [ ] Test double-booking scenario (two users select same slot)
- [ ] Test on mobile devices (responsive design)
- [ ] Test in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify calendar event created correctly
- [ ] Verify customer email received and formatted correctly
- [ ] Verify Google Meet link works
- [ ] Test timezone handling (book from different timezones)

---

## Future Roadmap

### Planned Improvements

#### High Priority

1. **Rate Limiting**
   - Implement IP-based rate limiting to prevent spam
   - **Effort**: Low | **Impact**: High
   - **Timeline**: 1-2 days

2. **CAPTCHA Protection**
   - Add hCaptcha or reCAPTCHA to prevent bot submissions
   - **Effort**: Low | **Impact**: High
   - **Timeline**: 1 day

3. **Database Integration**
   - Add PostgreSQL with Drizzle ORM
   - Store booking history for analytics
   - **Effort**: Medium | **Impact**: High
   - **Timeline**: 1 week

4. **Admin Dashboard**
   - View all bookings in one place
   - Filter by date, service, status
   - Export to CSV
   - **Effort**: Medium | **Impact**: Medium
   - **Timeline**: 1-2 weeks

#### Medium Priority

5. **Webhook Implementation**
   - Resend webhooks for email delivery tracking
   - Real-time notification of bounces/complaints
   - **Effort**: Low | **Impact**: Medium
   - **Timeline**: 2-3 days

6. **Cancellation/Rescheduling Flow**
   - Allow customers to cancel or reschedule bookings
   - Send unique confirmation token with booking
   - **Effort**: High | **Impact**: High
   - **Timeline**: 2 weeks

7. **Multiple Timezone Support**
   - Allow customers to select their timezone
   - Display available slots in customer's local time
   - **Effort**: Medium | **Impact**: Medium
   - **Timeline**: 1 week

8. **Email Customization UI**
   - Admin interface to edit email templates without code
   - WYSIWYG editor for email content
   - **Effort**: High | **Impact**: Low
   - **Timeline**: 2 weeks

#### Low Priority

9. **Analytics & Reporting**
   - Track conversion rates (views → bookings)
   - Most popular services
   - Peak booking times
   - **Effort**: Medium | **Impact**: Medium
   - **Timeline**: 1 week

10. **Automated Reminders**
    - Send email reminder 24 hours before consultation
    - Send SMS reminder (via Twilio)
    - **Effort**: Medium | **Impact**: Low
    - **Timeline**: 3-4 days

11. **Integration with CRM**
    - Sync bookings to HubSpot, Salesforce, or Pipedrive
    - Automatic lead creation
    - **Effort**: High | **Impact**: Low
    - **Timeline**: 2 weeks

12. **Multi-Calendar Support**
    - Support multiple team members' calendars
    - Round-robin assignment
    - **Effort**: High | **Impact**: Medium
    - **Timeline**: 2 weeks

13. **Internationalization (i18n)**
    - Translate form and emails to multiple languages
    - Spanish, French, German, etc.
    - **Effort**: Medium | **Impact**: Low
    - **Timeline**: 1 week

### Breaking Changes to Consider

- **v2.0**: Move from service account to OAuth for better user experience
- **v2.0**: Introduce database schema (breaking change for existing data)
- **v2.0**: Replace inline email templates with external template service (e.g., Handlebars + files)

---

## Appendix

### File Reference

#### Core Booking Files

| File Path | Purpose | Lines of Code |
|-----------|---------|---------------|
| `src/components/booking-modal.tsx` | Booking form modal (legacy, still functional) | ~365 |
| `src/app/api/booking/route.ts` | Booking submission endpoint | ~649 |
| `src/app/api/booking/available-slots/route.ts` | Available slots endpoint | ~90 |
| `src/lib/google-calendar.ts` | Google Calendar service | ~382 |

#### New Contact Form Files (v2.0)

| File Path | Purpose | Lines of Code |
|-----------|---------|---------------|
| `src/app/(frontend)/contact/page.tsx` | Tabbed contact page with dual functionality | ~606 |
| `src/app/api/contact/route.ts` | Contact form submission endpoint | ~280 |
| `src/components/ui/tabs.tsx` | Tabs UI component (shadcn/ui) | ~60 |

#### Configuration Files

| File Path | Purpose | Notes |
|-----------|---------|-------|
| `src/lib/payload/payload.config.ts` | PayloadCMS configuration | Modified: Lines 186-200 (optional date/time) |

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.3.1 | Framework |
| `react` | 19.x | UI library |
| `resend` | Latest | Email API client |
| `googleapis` | Latest | Google APIs client |
| `sonner` | Latest | Toast notifications |
| `lucide-react` | Latest | Icons |
| `@radix-ui/*` | Latest | UI primitives |

### External Resources

- [Resend Documentation](https://resend.com/docs)
- [Google Calendar API Reference](https://developers.google.com/calendar)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS v4 Docs](https://tailwindcss.com)

### Support & Contact

For questions or issues:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/orcaclubpro/issues)
- **Email**: chance@orcaclub.pro
- **Documentation**: This file

---

**Last Updated**: December 21, 2025 (v2.0 - Added Contact Form)
**Version**: 2.0.0
**Author**: ORCACLUB Development Team

> **Note**: This document primarily covers the booking/consultation scheduling workflow. For the new contact form functionality, see [CONTACT_FUNCTIONALITY_UPDATE.md](./CONTACT_FUNCTIONALITY_UPDATE.md) which includes:
> - Contact form workflow and API documentation
> - Updated PayloadCMS schema details
> - Contact page component architecture
> - Migration guide from v1.0 to v2.0
> - Testing checklist for both workflows
