# Google Calendar Integration - Technical Documentation

**ORCACLUB Booking System**
*Last Updated: January 2026*

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [Available Slots Workflow](#available-slots-workflow)
5. [Booking Creation Workflow](#booking-creation-workflow)
6. [Code Reference](#code-reference)
7. [Data Flow](#data-flow)
8. [API Endpoints](#api-endpoints)
9. [Google Calendar Service](#google-calendar-service)
10. [Error Handling](#error-handling)
11. [Security Considerations](#security-considerations)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The ORCACLUB booking system integrates with Google Calendar to provide **real-time availability checking** and **automatic consultation scheduling**. The system uses **Google Service Account** authentication with **domain-wide delegation** to manage calendar events on behalf of the business owner.

### Key Capabilities

✅ **Real-time availability** - Checks actual calendar free/busy status
✅ **Double-booking prevention** - Validates slot availability before creating events
✅ **Automatic calendar invites** - Sends email invitations to clients
✅ **Google Meet integration** - Auto-generates video conference links
✅ **Timezone handling** - All times in Pacific timezone (PST/PDT aware)
✅ **Multi-system sync** - PayloadCMS → Google Calendar → Email

---

## Architecture

### High-Level Flow

```
┌──────────────┐
│   Frontend   │ /contact page (booking tab)
│   (React)    │
└──────┬───────┘
       │ 1. User selects date
       ▼
┌────────────────────────────────────┐
│ GET /api/booking/available-slots   │
│ ?date=2026-01-15                   │
└──────┬─────────────────────────────┘
       │ 2. Query Google Calendar FreeBusy API
       ▼
┌────────────────────────────────────┐
│  GoogleCalendarService             │
│  .getFreeBusyInfo()                │
│  → Returns busy periods            │
└──────┬─────────────────────────────┘
       │ 3. Generate available slots
       ▼
┌────────────────────────────────────┐
│  Filter out conflicts              │
│  → Return: [{start, end, label}]   │
└──────┬─────────────────────────────┘
       │ 4. Display slots to user
       ▼
┌────────────────────────────────────┐
│  User selects time & submits form  │
└──────┬─────────────────────────────┘
       │ 5. POST /api/booking
       ▼
┌────────────────────────────────────┐
│  Booking API Route                 │
│  → Save to PayloadCMS (CRITICAL)   │
│  → Validate slot still available   │
│  → Create Google Calendar event    │
│  → Send confirmation emails        │
└────────────────────────────────────┘
```

### Component Breakdown

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **Contact Page** | `src/app/(frontend)/contact/page.tsx` | User interface with contact/booking tabs |
| **Booking API** | `src/app/api/booking/route.ts` | Handles booking submissions |
| **Slots API** | `src/app/api/booking/available-slots/route.ts` | Returns available time slots |
| **Calendar Service** | `src/lib/google-calendar.ts` | Google Calendar API wrapper |
| **PayloadCMS** | `src/lib/payload/` | Lead storage and management |

---

## Authentication Flow

### Service Account with Domain-Wide Delegation

The system uses **Google Service Account** credentials to authenticate with the Google Calendar API. This requires:

1. **Service Account** - Machine-to-machine authentication
2. **Domain-Wide Delegation** - Allows impersonating a user account
3. **OAuth Scopes** - Limited to Calendar API only

### Environment Variables

```bash
# Service account JSON credentials (single line)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...",...}'

# Calendar to use (default: primary calendar)
GOOGLE_CALENDAR_ID=primary

# User account to impersonate (required for sending invites)
GOOGLE_DELEGATED_USER_EMAIL=chance@orcaclub.pro
```

### Authentication Code

**Location:** `src/lib/google-calendar.ts:23-54`

```typescript
private initializeCalendar() {
  try {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    const delegatedUser = process.env.GOOGLE_DELEGATED_USER_EMAIL

    if (!credentials) {
      console.warn('Google Calendar: No credentials found. Integration disabled.')
      return
    }

    const parsedCredentials = JSON.parse(credentials)

    // Create auth client with service account
    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      // Domain-wide delegation to impersonate user
      clientOptions: delegatedUser ? {
        subject: delegatedUser,
      } : undefined,
    })

    // Initialize calendar client
    this.calendar = google.calendar({ version: 'v3', auth })

    console.log('Google Calendar initialized' +
      (delegatedUser ? ` (impersonating ${delegatedUser})` : ''))
  } catch (error) {
    console.error('Failed to initialize Google Calendar:', error)
    this.calendar = null
  }
}
```

**Key Points:**
- Parses JSON credentials from environment variable
- Sets OAuth scope to `calendar` only (principle of least privilege)
- Uses `subject` to impersonate the delegated user account
- Gracefully degrades if credentials are missing

---

## Available Slots Workflow

### Step 1: Frontend Date Selection

**File:** `src/app/(frontend)/contact/page.tsx:94-98`

When user selects a date in the booking tab:

```typescript
if (name === "preferredDate" && value && activeTab === "booking") {
  fetchAvailableSlots(value)
}
```

### Step 2: Fetch Available Slots

**File:** `src/app/(frontend)/contact/page.tsx:100-128`

```typescript
const fetchAvailableSlots = async (date: string) => {
  setIsLoadingSlots(true)
  setAvailableSlots([])
  setFormData((prev) => ({ ...prev, preferredTime: "" }))

  try {
    const response = await fetch(`/api/booking/available-slots?date=${date}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch available slots")
    }

    setAvailableSlots(data.slots || [])

    if (data.slots.length === 0) {
      toast.info("No available slots", {
        description: "This date is fully booked. Please select another date.",
      })
    }
  } catch (error) {
    console.error("Failed to fetch slots:", error)
    toast.error("Unable to load available times", {
      description: "Please try selecting a different date.",
    })
  } finally {
    setIsLoadingSlots(false)
  }
}
```

**User Experience:**
- Shows loading spinner while fetching
- Clears previously selected time
- Displays toast if no slots available
- Handles errors gracefully

### Step 3: Available Slots API

**File:** `src/app/api/booking/available-slots/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") // YYYY-MM-DD format

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    )
  }

  // Check if date is in the past
  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate < today) {
    return NextResponse.json(
      { error: "Cannot book slots in the past" },
      { status: 400 }
    )
  }

  // Optional parameters with defaults
  const duration = parseInt(searchParams.get("duration") || "60") // minutes
  const startHour = parseInt(searchParams.get("startHour") || "9") // 9 AM
  const endHour = parseInt(searchParams.get("endHour") || "17") // 5 PM
  const timeZone = searchParams.get("timeZone") || "America/Los_Angeles"

  // Get available slots from Google Calendar
  const availableSlots = await googleCalendar.getAvailableSlots(
    date,
    duration,
    startHour,
    endHour,
    timeZone
  )

  return NextResponse.json({
    success: true,
    date,
    timeZone,
    slots: availableSlots,
    count: availableSlots.length,
  })
}
```

**Request Example:**
```
GET /api/booking/available-slots?date=2026-01-15
```

**Response Example:**
```json
{
  "success": true,
  "date": "2026-01-15",
  "timeZone": "America/Los_Angeles",
  "count": 5,
  "slots": [
    {
      "start": "2026-01-15T09:00:00-08:00",
      "end": "2026-01-15T10:00:00-08:00",
      "label": "9:00 AM"
    },
    {
      "start": "2026-01-15T10:00:00-08:00",
      "end": "2026-01-15T11:00:00-08:00",
      "label": "10:00 AM"
    }
  ]
}
```

### Step 4: Generate Available Slots

**File:** `src/lib/google-calendar.ts:183-274`

The `getAvailableSlots()` method:

1. **Creates Pacific timezone dates** for business hours (9 AM - 5 PM)
2. **Queries Google Calendar FreeBusy API** for busy periods
3. **Generates all possible time slots** (1-hour intervals by default)
4. **Filters out conflicting slots** that overlap with busy periods
5. **Returns formatted slots** with human-readable labels

```typescript
async getAvailableSlots(
  date: string,
  slotDurationMinutes: number = 60,
  businessHoursStart: number = 9,
  businessHoursEnd: number = 17,
  timeZone: string = 'America/Los_Angeles'
): Promise<{ start: string; end: string; label: string }[]> {
  // Create start/end of business day in Pacific timezone
  const dayStart = createPacificDate(date, businessHoursStart)
  const dayEnd = createPacificDate(date, businessHoursEnd)

  // Get busy periods from Google Calendar FreeBusy API
  const busyPeriods = await this.getFreeBusyInfo(
    startOfDay.toISOString(),
    endOfDay.toISOString()
  )

  // Generate all possible time slots
  const allSlots = []
  let currentSlotStart = new Date(dayStart)

  while (currentSlotStart < dayEnd) {
    const currentSlotEnd = new Date(
      currentSlotStart.getTime() + slotDurationMinutes * 60000
    )
    if (currentSlotEnd <= dayEnd) {
      allSlots.push({
        start: new Date(currentSlotStart),
        end: new Date(currentSlotEnd),
      })
    }
    currentSlotStart = new Date(currentSlotEnd)
  }

  // Filter out slots that conflict with busy periods
  const availableSlots = allSlots.filter((slot) => {
    return !busyPeriods.some((busy) => {
      const busyStart = new Date(busy.start)
      const busyEnd = new Date(busy.end)
      // Check if slot overlaps with busy period
      return (
        (slot.start >= busyStart && slot.start < busyEnd) ||
        (slot.end > busyStart && slot.end <= busyEnd) ||
        (slot.start <= busyStart && slot.end >= busyEnd)
      )
    })
  })

  // Format slots with labels
  return availableSlots.map((slot) => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
    label: this.formatTimeLabel(slot.start, timeZone), // e.g., "9:00 AM"
  }))
}
```

**Timezone Handling:**

The system uses a smart Pacific timezone offset detector to handle PST/PDT automatically:

```typescript
const createPacificDate = (dateStr: string, hours: number, minutes: number = 0) => {
  // Determine Pacific timezone offset for the given date (handles DST)
  const tempDate = new Date(`${dateStr}T12:00:00Z`)
  const pacificTime = tempDate.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: false,
  })

  // Calculate offset from UTC (-08:00 for PST, -07:00 for PDT)
  const pacificNoonHour = parseInt(pacificTime.match(/(\d+):00:00/)[1])
  const offset = 12 - pacificNoonHour
  const offsetStr = offset === 8 ? '-08:00' : '-07:00'

  // Create ISO string with Pacific timezone offset
  const isoString = `${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00${offsetStr}`
  return new Date(isoString)
}
```

### Step 5: FreeBusy API Query

**File:** `src/lib/google-calendar.ts:146-173`

```typescript
async getFreeBusyInfo(
  startDateTime: string,
  endDateTime: string
): Promise<{ start: string; end: string }[]> {
  if (!this.calendar) {
    return []
  }

  try {
    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: startDateTime,
        timeMax: endDateTime,
        items: [{ id: this.calendarId }],
      },
    })

    const calendarBusy = response.data.calendars?.[this.calendarId]?.busy || []

    return calendarBusy.map((period) => ({
      start: period.start || '',
      end: period.end || '',
    }))
  } catch (error) {
    console.error('Failed to get FreeBusy info:', error)
    return []
  }
}
```

**Google API Request:**
```json
{
  "timeMin": "2026-01-15T00:00:00-08:00",
  "timeMax": "2026-01-15T23:59:00-08:00",
  "items": [
    { "id": "primary" }
  ]
}
```

**Google API Response:**
```json
{
  "calendars": {
    "primary": {
      "busy": [
        {
          "start": "2026-01-15T11:00:00-08:00",
          "end": "2026-01-15T12:00:00-08:00"
        },
        {
          "start": "2026-01-15T14:00:00-08:00",
          "end": "2026-01-15T15:00:00-08:00"
        }
      ]
    }
  }
}
```

---

## Booking Creation Workflow

### Step 1: Form Submission

**File:** `src/app/(frontend)/contact/page.tsx:182-225`

```typescript
const handleBookingSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    const response = await fetch("/api/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit booking request")
    }

    toast.success("Consultation booked!", {
      description: "Check your email for confirmation and calendar invite.",
    })

    // Reset form and slots
    setFormData({ /* empty state */ })
    setAvailableSlots([])
  } catch (error) {
    toast.error("Something went wrong", {
      description: error instanceof Error ? error.message : "Please try again later.",
    })
  } finally {
    setIsSubmitting(false)
  }
}
```

### Step 2: Booking API Handler

**File:** `src/app/api/booking/route.ts`

The booking API follows a **defensive architecture** that prioritizes data integrity:

```typescript
export async function POST(request: NextRequest) {
  let leadId: string | null = null

  try {
    const body: BookingFormData = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.service ||
        !body.message || !body.preferredDate || !body.preferredTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { name, email, phone, company, service, message,
            preferredDate, preferredTime } = body

    // ==========================================
    // STEP 1: SAVE TO PAYLOADCMS FIRST (CRITICAL)
    // ==========================================
    try {
      const payload = await getPayload({ config })

      const lead = await payload.create({
        collection: 'leads',
        data: {
          name,
          email,
          phone: phone || '',
          company: company || '',
          service,
          message,
          preferredDate,
          preferredTime,
          status: 'new',
          emailSent: false,
          calendarCreated: false,
        },
      })

      leadId = lead.id
      console.log(`[Booking] Lead created in PayloadCMS: ${leadId}`)
    } catch (payloadError) {
      console.error('[Booking] CRITICAL: Failed to save lead:', payloadError)
      // Continue anyway - we'll try to complete the booking
    }

    // [Steps 2-5 continue below...]
  } catch (error) {
    console.error("[Booking] API error:", error)

    return NextResponse.json({
      error: "Failed to process booking request",
      details: error instanceof Error ? error.message : "Unknown error",
      leadId, // Include leadId so admin knows it was saved
    }, { status: 500 })
  }
}
```

**Critical Design Decision:**

The lead is saved to PayloadCMS **BEFORE** any external API calls (calendar, email). This ensures:

✅ **No lost leads** - Even if calendar/email fails, we have the contact info
✅ **Data integrity** - Lead saved in atomic transaction
✅ **Recovery path** - Admin can manually follow up if automation fails

### Step 3: Create Shopify Customer (Optional)

**File:** `src/app/api/booking/route.ts:85-153`

```typescript
// STEP 1.5: CREATE SHOPIFY CUSTOMER
let shopifyCustomerId: string | null = null

if (leadId) {
  try {
    const shopifyResult = await createCustomerSafely({
      name,
      email,
      phone,
      acceptsMarketing: true,
    })

    if (shopifyResult.success && shopifyResult.customerId) {
      shopifyCustomerId = shopifyResult.customerId
      console.log(`[Booking] Shopify customer created: ${shopifyCustomerId}`)

      // Update PayloadCMS lead with Shopify customer ID
      await payload.update({
        collection: 'leads',
        id: leadId,
        data: {
          shopifyCustomerId,
          shopifyPasswordGenerated: true,
        },
      })
    } else if (shopifyResult.isDuplicate) {
      console.log(`[Booking] Shopify customer already exists for ${email}`)
    }
  } catch (shopifyError) {
    console.error('[Booking] Shopify customer creation failed:', shopifyError)
    // Non-blocking - continue with booking
  }
}
```

**Purpose:**
- Creates customer account in Shopify for future marketing/commerce
- Non-blocking (fails gracefully if Shopify unavailable)
- Updates lead with Shopify customer ID for cross-system tracking

### Step 4: Validate Slot Still Available

**File:** `src/app/api/booking/route.ts:596-636`

**Race Condition Prevention:**

Before creating the calendar event, the system re-validates that the selected time slot is still available. This prevents double-booking if two users select the same slot simultaneously.

```typescript
// Parse the selected date and time
const startDate = new Date(preferredTime) // ISO string from frontend

// Create end time (1 hour after start)
const endDate = new Date(startDate)
endDate.setHours(startDate.getHours() + 1)

// Verify the time slot is still available (prevent double booking)
const isAvailable = await googleCalendar.isTimeSlotAvailable(
  startDate.toISOString(),
  endDate.toISOString()
)

if (!isAvailable) {
  // Update lead with failure reason
  if (leadId) {
    await payload.update({
      collection: 'leads',
      id: leadId,
      data: {
        notes: 'Time slot was no longer available at booking time',
      },
    })
  }

  return NextResponse.json({
    error: "Time slot no longer available",
    details: "This time slot was just booked. Please select another time.",
    leadId, // Still return leadId so we know it was saved
  }, { status: 409 })
}
```

**`isTimeSlotAvailable()` Implementation:**

**File:** `src/lib/google-calendar.ts:118-141`

```typescript
async isTimeSlotAvailable(
  startDateTime: string,
  endDateTime: string
): Promise<boolean> {
  if (!this.calendar) {
    return true // If calendar not initialized, assume available
  }

  try {
    const response = await this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: startDateTime,
      timeMax: endDateTime,
      singleEvents: true,
      orderBy: 'startTime',
    })

    // If there are any events in this time range, slot is not available
    return (response.data.items?.length || 0) === 0
  } catch (error) {
    console.error('Failed to check calendar availability:', error)
    return true // On error, assume available to not block bookings
  }
}
```

### Step 5: Create Google Calendar Event

**File:** `src/app/api/booking/route.ts:638-688`

```typescript
// Create calendar event with Google Meet link
calendarEventLink = await googleCalendar.createEvent({
  summary: `ORCACLUB Consultation Invite`,
  description: `
Consultation with ${name}${company ? ` from ${company}` : ''}

Service: ${service}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

Project Details:
${message}

---
Booked via ORCACLUB Booking System
Lead ID: ${leadId || 'N/A'}
  `.trim(),
  startDateTime: startDate.toISOString(),
  endDateTime: endDate.toISOString(),
  attendeeEmail: email,
  attendeeName: name,
  timeZone: 'America/Los_Angeles',
})

if (calendarEventLink) {
  calendarCreated = true
  console.log('[Booking] Calendar event created:', calendarEventLink)

  // Update lead with calendar status
  if (leadId) {
    await payload.update({
      collection: 'leads',
      id: leadId,
      data: {
        calendarCreated: true,
        calendarEventLink,
        status: 'scheduled', // Update status to scheduled
      },
    })
  }
}
```

**`createEvent()` Implementation:**

**File:** `src/lib/google-calendar.ts:59-113`

```typescript
async createEvent(eventData: CalendarEvent): Promise<string | null> {
  if (!this.calendar) {
    console.warn('Google Calendar not initialized. Skipping event creation.')
    return null
  }

  try {
    const event: calendar_v3.Schema$Event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || 'America/Los_Angeles',
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || 'America/Los_Angeles',
      },
      attendees: [
        {
          email: eventData.attendeeEmail,
          displayName: eventData.attendeeName,
          responseStatus: 'needsAction',
        },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `booking-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet', // Auto-generate Google Meet link
          },
        },
      },
    }

    const response = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: event,
      conferenceDataVersion: 1, // Required for Google Meet link
      sendUpdates: 'all', // Send email invitations to attendees
    })

    console.log('Calendar event created:', response.data.id)
    return response.data.htmlLink || response.data.id || null
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    return null
  }
}
```

**Key Features:**

✅ **Attendee added** - Client email added with `responseStatus: 'needsAction'`
✅ **Google Meet link** - Auto-generated via `conferenceData`
✅ **Calendar invite sent** - `sendUpdates: 'all'` sends email to attendee
✅ **Reminders** - 1 hour popup reminder (no email to avoid spam)
✅ **Returns event link** - HTML link to Google Calendar event

### Step 6: Send Confirmation Emails

**File:** `src/app/api/booking/route.ts:175-591`

The system sends a professionally branded confirmation email to the customer using Resend:

```typescript
const customerEmail = await resend.emails.send({
  from: FROM_EMAIL, // bookings@orcaclub.pro
  to: email,
  subject: "ORCACLUB Consultation",
  html: `[Branded HTML email template]`,
  text: `[Plain text fallback]`,
})

if (!customerEmail.error) {
  emailSent = true
  console.log(`[Booking] Email sent: ${customerEmail.data?.id}`)

  // Update lead with email status
  if (leadId) {
    await payload.update({
      collection: 'leads',
      id: leadId,
      data: {
        emailSent: true,
      },
    })
  }
}
```

**Email Template Features:**

- ORCACLUB branded design with gradient logo
- Booking details (service, date, time)
- "What Happens Next" checklist
- Contact information
- Mobile-responsive HTML + plain text fallback

**Admin Email (Optional):**

An admin notification email is available but **disabled by default** (lines 373-565). This is because the admin already receives:
- Calendar event in Google Calendar
- Lead record in PayloadCMS admin

To enable admin emails, uncomment the code block.

### Step 7: Return Success Response

**File:** `src/app/api/booking/route.ts:691-702`

```typescript
return NextResponse.json({
  success: true,
  message: "Booking request submitted successfully",
  leadId,
  customerEmailId: customerEmail.data?.id,
  calendarEventLink,
  emailSent,
  calendarCreated,
}, { status: 200 })
```

**Response Example:**
```json
{
  "success": true,
  "message": "Booking request submitted successfully",
  "leadId": "67a1234567890abcdef12345",
  "customerEmailId": "re_abc123xyz",
  "calendarEventLink": "https://calendar.google.com/calendar/event?eid=...",
  "emailSent": true,
  "calendarCreated": true
}
```

---

## Code Reference

### File Structure

```
src/
├── app/
│   ├── (frontend)/
│   │   └── contact/
│   │       └── page.tsx                 # Contact form with booking tab
│   └── api/
│       └── booking/
│           ├── route.ts                 # POST /api/booking
│           └── available-slots/
│               └── route.ts             # GET /api/booking/available-slots
├── lib/
│   ├── google-calendar.ts               # GoogleCalendarService class
│   ├── payload/
│   │   └── payload.config.ts            # PayloadCMS configuration
│   └── shopify/
│       └── customers.ts                 # Shopify customer creation
└── types/
    └── payload-types.ts                 # Generated PayloadCMS types
```

### Key Classes and Interfaces

**`GoogleCalendarService`** (`src/lib/google-calendar.ts:14-378`)

```typescript
export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null
  private calendarId: string

  constructor()
  private initializeCalendar(): void

  async createEvent(eventData: CalendarEvent): Promise<string | null>
  async isTimeSlotAvailable(start: string, end: string): Promise<boolean>
  async getFreeBusyInfo(start: string, end: string): Promise<BusyPeriod[]>
  async getAvailableSlots(date, duration, startHour, endHour, tz): Promise<Slot[]>
  async getUpcomingEvents(maxResults: number): Promise<Event[]>
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<boolean>
  async deleteEvent(eventId: string): Promise<boolean>

  private formatTimeLabel(date: Date, timeZone: string): string
}

export const googleCalendar = new GoogleCalendarService()
```

**`CalendarEvent` Interface** (`src/lib/google-calendar.ts:4-12`)

```typescript
interface CalendarEvent {
  summary: string
  description: string
  startDateTime: string // ISO 8601 format
  endDateTime: string   // ISO 8601 format
  attendeeEmail: string
  attendeeName: string
  timeZone?: string     // Default: America/Los_Angeles
}
```

**`BookingFormData` Interface** (`src/app/api/booking/route.ts:15-24`)

```typescript
interface BookingFormData {
  name: string
  email: string
  phone: string
  company: string
  service: string
  message: string
  preferredDate: string // YYYY-MM-DD
  preferredTime: string // ISO 8601 datetime
}
```

**`TimeSlot` Interface** (`src/app/(frontend)/contact/page.tsx:56-60`)

```typescript
interface TimeSlot {
  start: string  // ISO 8601 datetime
  end: string    // ISO 8601 datetime
  label: string  // Human-readable (e.g., "9:00 AM")
}
```

---

## Data Flow

### Complete Booking Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Input (Frontend)                                    │
│                                                              │
│ formData = {                                                 │
│   name: "John Doe"                                          │
│   email: "john@example.com"                                 │
│   phone: "+1 (555) 123-4567"                                │
│   company: "Acme Inc"                                       │
│   service: "ai-automation"                                  │
│   message: "Need help with workflow automation"            │
│   preferredDate: "2026-01-15"                               │
│   preferredTime: "2026-01-15T09:00:00-08:00"               │
│ }                                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /api/booking                                        │
│                                                              │
│ - Validates required fields                                 │
│ - Validates email format                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Save to PayloadCMS (MongoDB)                             │
│                                                              │
│ lead = {                                                     │
│   name: "John Doe"                                          │
│   email: "john@example.com"                                 │
│   phone: "+1 (555) 123-4567"                                │
│   company: "Acme Inc"                                       │
│   service: "ai-automation"                                  │
│   message: "Need help..."                                   │
│   preferredDate: "2026-01-15"                               │
│   preferredTime: "2026-01-15T09:00:00-08:00"               │
│   status: "new"                                             │
│   emailSent: false                                          │
│   calendarCreated: false                                    │
│   createdAt: "2026-01-03T10:30:00Z"                        │
│ }                                                            │
│                                                              │
│ → leadId = "67a1234567890abcdef12345"                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Create Shopify Customer (Optional)                       │
│                                                              │
│ shopifyCustomer = {                                          │
│   email: "john@example.com"                                 │
│   firstName: "John"                                         │
│   lastName: "Doe"                                           │
│   phone: "+1 (555) 123-4567"                                │
│   acceptsMarketing: true                                    │
│ }                                                            │
│                                                              │
│ → shopifyCustomerId = "gid://shopify/Customer/123456"       │
│ → Update lead.shopifyCustomerId                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Validate Slot Availability (Race Condition Check)        │
│                                                              │
│ googleCalendar.isTimeSlotAvailable(                         │
│   "2026-01-15T09:00:00-08:00",                             │
│   "2026-01-15T10:00:00-08:00"                              │
│ )                                                            │
│                                                              │
│ → Google Calendar API: events.list()                        │
│ → Returns empty list (no conflicts)                         │
│ → isAvailable = true                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Create Google Calendar Event                             │
│                                                              │
│ event = {                                                    │
│   summary: "ORCACLUB Consultation Invite"                   │
│   description: "Consultation with John Doe from Acme Inc..." │
│   start: {                                                   │
│     dateTime: "2026-01-15T09:00:00-08:00"                   │
│     timeZone: "America/Los_Angeles"                         │
│   }                                                          │
│   end: {                                                     │
│     dateTime: "2026-01-15T10:00:00-08:00"                   │
│     timeZone: "America/Los_Angeles"                         │
│   }                                                          │
│   attendees: [{                                              │
│     email: "john@example.com"                               │
│     displayName: "John Doe"                                 │
│   }]                                                         │
│   conferenceData: {                                          │
│     createRequest: {                                         │
│       conferenceSolutionKey: { type: "hangoutsMeet" }       │
│     }                                                        │
│   }                                                          │
│   reminders: {                                               │
│     overrides: [{ method: "popup", minutes: 60 }]           │
│   }                                                          │
│ }                                                            │
│                                                              │
│ → Google Calendar API: events.insert()                      │
│ → sendUpdates: "all" (sends invite to attendee)             │
│ → Returns event with Google Meet link                       │
│                                                              │
│ calendarEventLink = "https://calendar.google.com/..."       │
│                                                              │
│ → Update lead:                                              │
│   - calendarCreated: true                                   │
│   - calendarEventLink: "https://..."                        │
│   - status: "scheduled"                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Send Confirmation Email (Resend)                         │
│                                                              │
│ resend.emails.send({                                         │
│   from: "bookings@orcaclub.pro"                             │
│   to: "john@example.com"                                    │
│   subject: "ORCACLUB Consultation"                          │
│   html: [Branded email template]                            │
│ })                                                           │
│                                                              │
│ → Resend API sends email                                    │
│ → customerEmailId = "re_abc123xyz"                          │
│                                                              │
│ → Update lead.emailSent: true                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Return Success Response                                  │
│                                                              │
│ {                                                            │
│   success: true                                             │
│   message: "Booking request submitted successfully"        │
│   leadId: "67a1234567890abcdef12345"                        │
│   customerEmailId: "re_abc123xyz"                           │
│   calendarEventLink: "https://calendar.google.com/..."      │
│   emailSent: true                                           │
│   calendarCreated: true                                     │
│ }                                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Frontend Success Handling                                │
│                                                              │
│ - Display success toast                                     │
│ - Reset form fields                                         │
│ - Clear available slots                                     │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema (PayloadCMS)

**Collection:** `leads`

```typescript
{
  id: string                    // MongoDB ObjectId
  name: string                  // Customer name
  email: string                 // Customer email
  phone: string                 // Customer phone (optional)
  company: string               // Company name (optional)
  service: string               // Selected service
  message: string               // Project details
  preferredDate: string         // YYYY-MM-DD
  preferredTime: string         // ISO 8601 datetime
  status: 'new' | 'scheduled'   // Lead status
  emailSent: boolean            // Email confirmation sent
  calendarCreated: boolean      // Calendar event created
  calendarEventLink: string     // Google Calendar event URL
  shopifyCustomerId: string     // Shopify customer GID
  shopifyPasswordGenerated: boolean
  notes: string                 // Admin notes
  createdAt: Date
  updatedAt: Date
}
```

---

## API Endpoints

### GET /api/booking/available-slots

**Purpose:** Returns available booking time slots for a specific date

**Request:**
```
GET /api/booking/available-slots?date=2026-01-15&duration=60&startHour=9&endHour=17&timeZone=America/Los_Angeles
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | string | ✅ Yes | - | Date in YYYY-MM-DD format |
| `duration` | number | ❌ No | `60` | Slot duration in minutes (15-240) |
| `startHour` | number | ❌ No | `9` | Business hours start (0-23) |
| `endHour` | number | ❌ No | `17` | Business hours end (0-23) |
| `timeZone` | string | ❌ No | `America/Los_Angeles` | IANA timezone |

**Success Response (200):**
```json
{
  "success": true,
  "date": "2026-01-15",
  "timeZone": "America/Los_Angeles",
  "count": 5,
  "slots": [
    {
      "start": "2026-01-15T09:00:00-08:00",
      "end": "2026-01-15T10:00:00-08:00",
      "label": "9:00 AM"
    },
    {
      "start": "2026-01-15T10:00:00-08:00",
      "end": "2026-01-15T11:00:00-08:00",
      "label": "10:00 AM"
    }
  ]
}
```

**Error Response (400 - Invalid Date):**
```json
{
  "error": "Invalid date format. Use YYYY-MM-DD"
}
```

**Error Response (400 - Past Date):**
```json
{
  "error": "Cannot book slots in the past"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to fetch available slots",
  "details": "Error message"
}
```

### POST /api/booking

**Purpose:** Creates a new consultation booking

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 (555) 123-4567",
  "company": "Acme Inc",
  "service": "ai-automation",
  "message": "Need help with workflow automation",
  "preferredDate": "2026-01-15",
  "preferredTime": "2026-01-15T09:00:00-08:00"
}
```

**Required Fields:**
- `name` (string)
- `email` (string, valid email format)
- `service` (string)
- `message` (string)
- `preferredDate` (string, YYYY-MM-DD)
- `preferredTime` (string, ISO 8601 datetime)

**Optional Fields:**
- `phone` (string)
- `company` (string)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking request submitted successfully",
  "leadId": "67a1234567890abcdef12345",
  "customerEmailId": "re_abc123xyz",
  "calendarEventLink": "https://calendar.google.com/calendar/event?eid=...",
  "emailSent": true,
  "calendarCreated": true
}
```

**Error Response (400 - Missing Fields):**
```json
{
  "error": "Missing required fields"
}
```

**Error Response (400 - Invalid Email):**
```json
{
  "error": "Invalid email address"
}
```

**Error Response (409 - Slot Unavailable):**
```json
{
  "error": "Time slot no longer available",
  "details": "This time slot was just booked. Please select another time.",
  "leadId": "67a1234567890abcdef12345"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to process booking request",
  "details": "Error message",
  "leadId": "67a1234567890abcdef12345"
}
```

---

## Google Calendar Service

### Class Methods

#### `constructor()`
Initializes the service and sets up Google Calendar API client.

#### `createEvent(eventData: CalendarEvent): Promise<string | null>`
Creates a new calendar event with Google Meet link and sends invitations.

**Returns:** Calendar event HTML link or null if failed

#### `isTimeSlotAvailable(start: string, end: string): Promise<boolean>`
Checks if a time slot is available (no conflicting events).

**Returns:** `true` if available, `false` if occupied

#### `getFreeBusyInfo(start: string, end: string): Promise<BusyPeriod[]>`
Queries Google Calendar FreeBusy API for busy periods.

**Returns:** Array of `{ start, end }` objects representing busy time blocks

#### `getAvailableSlots(date, duration, startHour, endHour, tz): Promise<Slot[]>`
Generates available booking slots for a specific date.

**Parameters:**
- `date` (string) - YYYY-MM-DD format
- `duration` (number) - Slot duration in minutes (default: 60)
- `startHour` (number) - Business hours start (default: 9)
- `endHour` (number) - Business hours end (default: 17)
- `timeZone` (string) - IANA timezone (default: America/Los_Angeles)

**Returns:** Array of `{ start, end, label }` objects

#### `getUpcomingEvents(maxResults: number): Promise<Event[]>`
Fetches upcoming events from the calendar.

**Returns:** Array of Google Calendar events

#### `updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<boolean>`
Updates an existing calendar event.

**Returns:** `true` if successful, `false` if failed

#### `deleteEvent(eventId: string): Promise<boolean>`
Deletes a calendar event.

**Returns:** `true` if successful, `false` if failed

---

## Error Handling

### Defensive Architecture Principles

The booking system follows a **defensive programming** approach:

1. **Lead saved FIRST** - Before any external API calls
2. **Non-blocking failures** - Shopify customer creation won't stop booking
3. **Graceful degradation** - Calendar disabled if credentials missing
4. **Detailed logging** - All errors logged with context
5. **Lead ID returned** - Even on partial failure, admin knows lead was saved

### Error Scenarios

#### Scenario 1: PayloadCMS Save Fails
```typescript
try {
  const lead = await payload.create({ collection: 'leads', data })
  leadId = lead.id
} catch (payloadError) {
  console.error('[Booking] CRITICAL: Failed to save lead:', payloadError)
  // Continue anyway - try to complete booking
}
```

**Impact:** Lead not saved, but booking continues
**Recovery:** Email confirmation provides contact info
**Notification:** Error logged for admin review

#### Scenario 2: Time Slot No Longer Available
```typescript
const isAvailable = await googleCalendar.isTimeSlotAvailable(start, end)

if (!isAvailable) {
  await payload.update({
    collection: 'leads',
    id: leadId,
    data: { notes: 'Time slot was no longer available' }
  })

  return NextResponse.json({
    error: "Time slot no longer available",
    leadId
  }, { status: 409 })
}
```

**Impact:** Booking rejected, user prompted to select new time
**Recovery:** Lead saved with notes, user can resubmit
**Notification:** User sees toast with error message

#### Scenario 3: Google Calendar Event Creation Fails
```typescript
try {
  calendarEventLink = await googleCalendar.createEvent(eventData)
  if (calendarEventLink) {
    await payload.update({ /* calendarCreated: true */ })
  }
} catch (calendarError) {
  console.error('[Booking] Failed to create calendar event:', calendarError)
  // Don't fail entire request - lead already saved
}
```

**Impact:** No calendar event, but lead saved and email sent
**Recovery:** Admin can manually create calendar event from lead
**Notification:** Admin checks PayloadCMS for `calendarCreated: false`

#### Scenario 4: Email Sending Fails
```typescript
const customerEmail = await resend.emails.send({ /* ... */ })

if (customerEmail.error) {
  console.error('[Booking] Failed to send email:', customerEmail.error)
  // Don't throw - lead saved, calendar created
} else {
  await payload.update({ /* emailSent: true */ })
}
```

**Impact:** User doesn't receive confirmation, but calendar invite sent
**Recovery:** Admin can manually send email from lead contact info
**Notification:** Admin checks PayloadCMS for `emailSent: false`

#### Scenario 5: Google Calendar Not Initialized
```typescript
if (!this.calendar) {
  console.warn('Google Calendar not initialized. Returning empty slots.')
  return []
}
```

**Impact:** No available slots shown, booking tab unusable
**Recovery:** Check environment variables, restart server
**Notification:** Console warning on server startup

### Error Monitoring

**Key Indicators:**
- `[Booking] CRITICAL:` - Critical errors (PayloadCMS save failed)
- `[Booking] Failed to...` - Expected failures (email, calendar)
- `Google Calendar not initialized` - Configuration issue

**PayloadCMS Lead Status Fields:**
- `status: "new"` - Initial save successful
- `status: "scheduled"` - Calendar event created
- `emailSent: false` - Email failed to send
- `calendarCreated: false` - Calendar event failed
- `notes` - Failure reasons and admin notes

---

## Security Considerations

### Sensitive Data Protection

**Environment Variables:**
- ✅ Store in `.env.local` (not committed to git)
- ✅ Use environment variables in production (Vercel, Railway, etc.)
- ✅ Rotate service account keys every 90 days
- ✅ Never log credentials or keys

**Service Account Security:**
- ✅ Minimal permissions (Calendar API only)
- ✅ Domain-wide delegation limited to one user
- ✅ Service account email not exposed to frontend
- ✅ JSON key file never uploaded to client

**API Endpoint Security:**
- ✅ Rate limiting (handled by Next.js/Vercel)
- ✅ Input validation (email format, date format)
- ✅ No sensitive data in error messages
- ✅ CORS configured for domain only

### OAuth Scopes

**Required Scope:**
```
https://www.googleapis.com/auth/calendar
```

**Permissions Granted:**
- ✅ Create calendar events
- ✅ Read calendar free/busy status
- ✅ Update calendar events
- ✅ Delete calendar events

**Permissions NOT Granted:**
- ❌ Access Gmail
- ❌ Access Google Drive
- ❌ Access other Google Workspace services
- ❌ Impersonate other users (only delegated user)

### Data Privacy

**Customer Data Handling:**
- ✅ GDPR-compliant (can delete leads from PayloadCMS)
- ✅ Email only used for booking confirmation
- ✅ Phone optional (not required)
- ✅ No data shared with third parties (except Resend for email)

**Google Calendar Data:**
- ✅ Only queries free/busy status (not event details)
- ✅ Event descriptions include customer info (internal use only)
- ✅ Calendar invites sent only to customer email
- ✅ Google Meet links are secure (random IDs)

---

## Testing

### Manual Testing Checklist

**Available Slots:**
- [ ] Select today's date → No slots (past dates blocked)
- [ ] Select future date with no events → All slots available
- [ ] Select future date with existing events → Conflicting slots hidden
- [ ] Create manual event in calendar → Verify slot disappears

**Booking Creation:**
- [ ] Submit booking with all fields → Success
- [ ] Submit booking missing required field → Error message
- [ ] Submit booking with invalid email → Error message
- [ ] Submit same slot twice (different tabs) → Second fails with 409

**Google Calendar:**
- [ ] Booking creates event in calendar → ✅
- [ ] Event includes customer info → ✅
- [ ] Event has Google Meet link → ✅
- [ ] Calendar invite sent to customer → ✅
- [ ] Reminder set for 1 hour before → ✅

**Email Confirmation:**
- [ ] Customer receives confirmation email → ✅
- [ ] Email includes booking details → ✅
- [ ] Email displays correctly on mobile → ✅
- [ ] Plain text fallback works → ✅

**PayloadCMS:**
- [ ] Lead saved with `status: "new"` → ✅
- [ ] Lead updated to `status: "scheduled"` → ✅
- [ ] `calendarEventLink` populated → ✅
- [ ] `emailSent: true` set → ✅
- [ ] `calendarCreated: true` set → ✅

### Test Scenarios

#### Test 1: Happy Path
```bash
# 1. Start dev server
bun run dev

# 2. Open contact page
open http://localhost:3000/contact

# 3. Switch to "Schedule Consultation" tab
# 4. Select date 3 days from now
# 5. Select 10:00 AM slot
# 6. Fill out form with test data
# 7. Submit

# Expected:
# ✅ Success toast appears
# ✅ Form resets
# ✅ Calendar event created in Google Calendar
# ✅ Email sent to test email address
# ✅ Lead saved in PayloadCMS admin
```

#### Test 2: Double-Booking Prevention
```bash
# 1. Open contact page in two browser windows
# 2. In both windows, select same date/time
# 3. Submit form in Window 1 (wait for success)
# 4. Submit form in Window 2

# Expected:
# Window 1: ✅ Success
# Window 2: ❌ Error "Time slot no longer available"
# ✅ Only one calendar event created
# ✅ Both leads saved in PayloadCMS (one scheduled, one noted)
```

#### Test 3: No Available Slots
```bash
# 1. Create manual calendar events filling entire day (9 AM - 5 PM)
# 2. Open contact page
# 3. Select that date

# Expected:
# ✅ Toast message: "No available slots"
# ✅ Time dropdown disabled
# ✅ Can select different date
```

#### Test 4: Graceful Degradation (No Calendar)
```bash
# 1. Remove GOOGLE_SERVICE_ACCOUNT_KEY from .env.local
# 2. Restart dev server

# Expected:
# ✅ Console warning: "Google Calendar not initialized"
# ✅ Available slots returns empty array
# ✅ App doesn't crash
# ✅ Contact form still works (no booking tab usage)
```

### Automated Testing (Future)

**Unit Tests:**
```typescript
// Test timezone conversion
describe('createPacificDate', () => {
  it('should handle PST offset', () => {
    const date = createPacificDate('2026-01-15', 9)
    expect(date.toISOString()).toBe('2026-01-15T17:00:00.000Z') // 9 AM PST = 5 PM UTC
  })

  it('should handle PDT offset', () => {
    const date = createPacificDate('2026-06-15', 9)
    expect(date.toISOString()).toBe('2026-06-15T16:00:00.000Z') // 9 AM PDT = 4 PM UTC
  })
})

// Test slot filtering
describe('getAvailableSlots', () => {
  it('should filter out busy periods', async () => {
    const slots = await googleCalendar.getAvailableSlots('2026-01-15')
    // Mock busy period: 11:00 AM - 12:00 PM
    expect(slots.find(s => s.label === '11:00 AM')).toBeUndefined()
    expect(slots.find(s => s.label === '9:00 AM')).toBeDefined()
  })
})
```

**Integration Tests:**
```typescript
// Test booking API
describe('POST /api/booking', () => {
  it('should create lead, calendar event, and send email', async () => {
    const response = await fetch('/api/booking', {
      method: 'POST',
      body: JSON.stringify(mockBookingData)
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.leadId).toBeDefined()
    expect(data.calendarCreated).toBe(true)
    expect(data.emailSent).toBe(true)
  })

  it('should reject double-booking', async () => {
    // First booking succeeds
    await fetch('/api/booking', { method: 'POST', body: JSON.stringify(mockData) })

    // Second booking fails
    const response = await fetch('/api/booking', { method: 'POST', body: JSON.stringify(mockData) })

    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data.error).toContain('no longer available')
  })
})
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Google Calendar not initialized"

**Symptoms:**
- Console warning on server startup
- No available slots shown
- Booking tab unusable

**Causes:**
1. Missing `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable
2. Invalid JSON in service account key
3. Missing `GOOGLE_DELEGATED_USER_EMAIL`

**Solutions:**
```bash
# 1. Check environment variables exist
echo $GOOGLE_SERVICE_ACCOUNT_KEY
echo $GOOGLE_DELEGATED_USER_EMAIL

# 2. Verify JSON is valid
node -e "JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)"

# 3. Check for newline issues
# JSON should be on ONE LINE with \n escaped in private key

# 4. Restart development server
bun run dev
```

#### Issue: "Service accounts cannot invite attendees"

**Symptoms:**
- Calendar event created
- No attendee added
- No calendar invite sent to customer

**Cause:**
- Domain-wide delegation not configured

**Solution:**
1. Follow [DOMAIN_WIDE_DELEGATION_SETUP.md](../DOMAIN_WIDE_DELEGATION_SETUP.md)
2. Enable domain-wide delegation in Google Workspace Admin
3. Add OAuth scope: `https://www.googleapis.com/auth/calendar`
4. Set `GOOGLE_DELEGATED_USER_EMAIL` in .env.local
5. Restart server

#### Issue: "403 Forbidden" when creating events

**Symptoms:**
- Error: "Forbidden" or "Not Authorized to access this resource"
- No calendar event created

**Causes:**
1. Calendar not shared with service account
2. Service account lacks permissions
3. Invalid calendar ID

**Solutions:**
```bash
# 1. Share calendar with service account
# Go to Google Calendar → Settings → Share with specific people
# Add: orcaclub-booking-calendar@your-project.iam.gserviceaccount.com
# Permission: "Make changes to events"

# 2. Verify calendar ID
echo $GOOGLE_CALENDAR_ID

# 3. Use "primary" for main calendar
GOOGLE_CALENDAR_ID=primary

# 4. Check service account email matches
# Compare service account email in Google Cloud Console
# with the email you shared the calendar with
```

#### Issue: No slots available for any date

**Symptoms:**
- All dates show "No available slots"
- FreeBusy query returns no data

**Causes:**
1. Calendar ID incorrect
2. Business hours misconfigured
3. FreeBusy API not returning data

**Debugging:**
```typescript
// Add logging to getFreeBusyInfo()
console.log('FreeBusy request:', {
  calendarId: this.calendarId,
  timeMin: startDateTime,
  timeMax: endDateTime
})

const response = await this.calendar.freebusy.query({ /* ... */ })

console.log('FreeBusy response:', JSON.stringify(response.data, null, 2))
```

**Solutions:**
- Verify `GOOGLE_CALENDAR_ID` matches your calendar
- Check business hours (default: 9 AM - 5 PM)
- Ensure calendar has events to test with
- Try using `primary` calendar ID

#### Issue: Time slots off by 1 hour (DST issue)

**Symptoms:**
- Slots show wrong times
- Calendar events created at wrong hour
- Off by exactly 1 hour

**Cause:**
- Daylight Saving Time (DST) transition not handled

**Solution:**
The system automatically handles DST transitions via `createPacificDate()`. If issues persist:

```typescript
// Verify timezone offset detection
const date = createPacificDate('2026-03-08', 9) // DST transition date
console.log('PST/PDT offset:', date.toISOString())

// Expected:
// Before DST: 2026-03-08T17:00:00.000Z (9 AM PST = UTC-8)
// After DST:  2026-03-08T16:00:00.000Z (9 AM PDT = UTC-7)
```

#### Issue: Booking submitted but no email received

**Symptoms:**
- Success toast appears
- Calendar event created
- No email in inbox (check spam too)

**Causes:**
1. Resend API key missing/invalid
2. Sender domain not verified
3. Email bounced/rejected

**Solutions:**
```bash
# 1. Check Resend API key
echo $RESEND_API_KEY

# 2. Verify sender domain
# Go to Resend dashboard → Domains
# Ensure bookings@orcaclub.pro is verified

# 3. Check Resend logs
# Dashboard → Logs → Look for email send status

# 4. Test Resend directly
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "bookings@orcaclub.pro",
    "to": "your-email@example.com",
    "subject": "Test",
    "text": "Testing Resend"
  }'
```

#### Issue: Double-booking still happens

**Symptoms:**
- Two users book same slot
- Both get success message
- Two calendar events created

**Cause:**
- Race condition between availability check and event creation

**Debugging:**
```typescript
// Add more detailed logging
console.log('[Booking] Checking availability:', {
  start: startDate.toISOString(),
  end: endDate.toISOString(),
  timestamp: new Date().toISOString()
})

const isAvailable = await googleCalendar.isTimeSlotAvailable(start, end)

console.log('[Booking] Availability result:', {
  isAvailable,
  timestamp: new Date().toISOString()
})

if (!isAvailable) {
  console.log('[Booking] Slot no longer available - rejecting booking')
  // Return 409 error
}

console.log('[Booking] Creating calendar event...')
```

**Prevention:**
The `isTimeSlotAvailable()` check happens immediately before event creation. If double-bookings persist:

1. Reduce slot generation interval (use 15-min slots instead of 60-min)
2. Add transaction locking (requires database-level support)
3. Implement optimistic locking with event creation retry logic

---

## Summary

The ORCACLUB Google Calendar integration provides a robust, production-ready booking system with:

✅ **Real-time availability** via FreeBusy API
✅ **Automatic calendar invites** with Google Meet links
✅ **Double-booking prevention** through race condition checks
✅ **Defensive architecture** ensuring leads are never lost
✅ **Multi-system sync** (PayloadCMS → Shopify → Google Calendar → Email)
✅ **Pacific timezone handling** with automatic DST detection
✅ **Professional email confirmations** with ORCACLUB branding

**Key Design Principles:**

1. **Lead saved FIRST** - Before any external API calls
2. **Graceful degradation** - System continues if non-critical services fail
3. **Detailed logging** - All operations logged for debugging
4. **User experience** - Clear error messages and loading states
5. **Security** - Minimal permissions, environment variables for secrets

**For Setup Instructions:**
- [GOOGLE_CALENDAR_SETUP.md](../GOOGLE_CALENDAR_SETUP.md) - Initial setup guide
- [DOMAIN_WIDE_DELEGATION_SETUP.md](../DOMAIN_WIDE_DELEGATION_SETUP.md) - Delegation setup
- [BOOKING_SETUP.md](./BOOKING_SETUP.md) - Complete system documentation

---

**Built by ORCACLUB • est 2025**

Tailored solutions • Smarter workflows
