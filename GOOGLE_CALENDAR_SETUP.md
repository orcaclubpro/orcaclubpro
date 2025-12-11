# Google Calendar Integration Setup Guide

## Overview

This guide will walk you through setting up Google Calendar integration for the ORCACLUB booking system. When customers select a preferred date, the system will automatically:

1. ✅ Create a Google Calendar event on your calendar
2. ✅ Generate a Google Meet link for the meeting
3. ✅ Send calendar invitations to the customer
4. ✅ Set reminders (1 day before + 1 hour before)
5. ✅ Include all booking details in the event

---

## 📋 What You Need from Google Workspace

### **Step 1: Create a Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** dropdown → **New Project**
3. Fill in details:
   - **Project name**: `ORCACLUB Booking System`
   - **Location**: Your organization (if applicable)
4. Click **Create**
5. Wait for the project to be created (takes ~30 seconds)

---

### **Step 2: Enable Google Calendar API**

1. In the Google Cloud Console, select your new project
2. Go to **APIs & Services** → **Library**
3. Search for "Google Calendar API"
4. Click on **Google Calendar API**
5. Click **Enable**
6. Wait for enablement to complete

---

### **Step 3: Create Service Account**

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **Service Account**
3. Fill in Service Account details:
   - **Service account name**: `orcaclub-booking-calendar`
   - **Service account ID**: Will auto-generate (e.g., `orcaclub-booking-calendar@project-id.iam.gserviceaccount.com`)
   - **Service account description**: "Service account for ORCACLUB booking system to manage calendar events"
4. Click **Create and Continue**
5. **Grant this service account access to project** (Optional):
   - Select Role: **Editor** or **Owner**
   - Click **Continue**
6. **Grant users access to this service account** (Optional):
   - Skip this step → Click **Done**

---

### **Step 4: Create & Download Service Account Key (CRITICAL)**

1. In **APIs & Services** → **Credentials**, find your service account
2. Click on the service account email (e.g., `orcaclub-booking-calendar@...`)
3. Go to the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON** format
6. Click **Create**
7. **A JSON file will download automatically** - **SAVE THIS FILE SECURELY!**
8. Rename it to something memorable: `google-calendar-credentials.json`

**⚠️ IMPORTANT SECURITY NOTES:**
- This file contains sensitive credentials
- **NEVER** commit this file to git/version control
- **NEVER** share this file publicly
- Store it in a secure password manager or secrets vault
- If compromised, delete the key and create a new one

---

### **Step 5: Copy the Service Account Email**

1. In the service account details page, you'll see the email address
2. It looks like: `orcaclub-booking-calendar@your-project-id.iam.gserviceaccount.com`
3. **Copy this email** - you'll need it in the next step

---

### **Step 6: Share Your Google Calendar with Service Account**

This is crucial! The service account needs permission to create events on your calendar.

1. Open [Google Calendar](https://calendar.google.com/)
2. On the left sidebar, find **My calendars**
3. Hover over your calendar → Click the three dots (⋮)
4. Click **Settings and sharing**
5. Scroll down to **Share with specific people or groups**
6. Click **+ Add people and groups**
7. **Paste the service account email** from Step 5
8. Set permissions to **Make changes to events**
9. Click **Send**

**✅ You should see the service account listed under "Share with specific people"**

---

## 💻 Configure Your Application

### **Step 1: Convert JSON Key to Single-Line String**

The Google service account JSON key needs to be on a single line for the .env file.

**Option A: Using Command Line (Mac/Linux)**
```bash
cat google-calendar-credentials.json | jq -c '.' | pbcopy
```

**Option B: Manual Method**
1. Open `google-calendar-credentials.json`
2. Copy the entire contents
3. Remove all line breaks and extra spaces
4. Result should look like: `{"type":"service_account","project_id":"...",...}`

---

### **Step 2: Add to .env.local**

1. Open `/Users/chancenoonan/dev/code/orcaclubpro/.env.local`
2. Uncomment and update the Google Calendar variables:

```bash
# Google Calendar Configuration
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"orcaclub-booking-calendar@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
GOOGLE_CALENDAR_ID=primary
```

**Important:**
- Replace the entire JSON object with your actual credentials
- Make sure it's on **ONE LINE**
- Keep `GOOGLE_CALENDAR_ID=primary` unless you want to use a specific calendar

---

### **Step 3: Optional - Use a Specific Calendar**

If you want bookings to go to a specific calendar (not your primary):

1. Go to [Google Calendar](https://calendar.google.com/)
2. Create a new calendar or select an existing one
3. Go to calendar **Settings and sharing**
4. Scroll to **Integrate calendar**
5. Copy the **Calendar ID** (looks like: `abc123@group.calendar.google.com`)
6. Update `.env.local`:
   ```bash
   GOOGLE_CALENDAR_ID=abc123@group.calendar.google.com
   ```
7. **Important:** Share this calendar with the service account (repeat Step 6 above)

---

## 🎯 How It Works

### When a Customer Books:

1. **Customer fills out booking form** with preferred date
2. **System creates calendar event:**
   - Title: `ORCACLUB Consultation - [Customer Name]`
   - Time: **10:00 AM - 11:00 AM** on selected date (default)
   - Location: **Google Meet** (auto-generated link)
   - Attendees: Customer email + your email
   - Description: All booking details (service, message, contact info)
3. **Google sends calendar invitation** to customer's email
4. **Customer receives:**
   - Email invitation with .ics file
   - Google Meet link
   - Option to accept/decline

### Event Details Included:

```
Title: ORCACLUB Consultation - John Doe

Description:
Consultation with John Doe from Acme Inc

Service: AI & Automation
Email: john@acme.com
Phone: +1 (555) 123-4567

Project Details:
We need help automating our workflow...

---
Booked via ORCACLUB Booking System

Time: 10:00 AM - 11:00 AM (1 hour)
Location: Google Meet (link provided)
Reminders: 1 day before + 1 hour before
```

---

## 🧪 Testing

### Test the Integration:

1. **Start development server:**
   ```bash
   bun run dev
   ```

2. **Open the booking modal:**
   - Go to `http://localhost:3000`
   - Click "Book a Call" button

3. **Fill out the form:**
   - Enter test data
   - **Select a preferred date**
   - Submit the form

4. **Check Results:**
   - ✅ Toast notification shows success
   - ✅ Check your Google Calendar - event should appear
   - ✅ Check the test email inbox - calendar invitation sent
   - ✅ Check your email (admin) - notification received
   - ✅ Check terminal logs - should show "Calendar event created"

### Expected Console Output:

```
Google Calendar service initialized successfully
Calendar event created: https://calendar.google.com/calendar/event?eid=...
```

---

## 🛠️ Customization Options

### Change Default Meeting Time

Edit `src/app/api/booking/route.ts`:

```typescript
// Current: 10:00 AM - 11:00 AM
startDate.setHours(10, 0, 0, 0)
const endDate = new Date(startDate)
endDate.setHours(11, 0, 0, 0)

// Change to 2:00 PM - 3:00 PM
startDate.setHours(14, 0, 0, 0)
const endDate = new Date(startDate)
endDate.setHours(15, 0, 0, 0)
```

### Change Meeting Duration

```typescript
// 30-minute meeting
endDate.setMinutes(startDate.getMinutes() + 30)

// 2-hour meeting
endDate.setHours(startDate.getHours() + 2)
```

### Customize Reminders

Edit `src/lib/google-calendar.ts`:

```typescript
reminders: {
  useDefault: false,
  overrides: [
    { method: 'email', minutes: 24 * 60 }, // 1 day before
    { method: 'popup', minutes: 60 },      // 1 hour before
    { method: 'email', minutes: 15 },      // 15 mins before (add this)
  ],
}
```

### Disable Google Meet Links

Edit `src/lib/google-calendar.ts`:

```typescript
// Remove or comment out the conferenceData section
// conferenceData: {
//   createRequest: {
//     requestId: `booking-${Date.now()}`,
//     conferenceSolutionKey: {
//       type: 'hangoutsMeet',
//     },
//   },
// },
```

---

## 🔧 Troubleshooting

### "Google Calendar not initialized"

**Cause:** Missing or invalid service account credentials

**Fix:**
1. Check `.env.local` has `GOOGLE_SERVICE_ACCOUNT_KEY`
2. Verify JSON is valid (no syntax errors)
3. Ensure it's on ONE LINE
4. Restart development server

### "Calendar event not created"

**Possible causes:**

1. **Service account not shared with calendar**
   - Revisit Step 6 - make sure service account has "Make changes to events" permission

2. **Invalid Calendar ID**
   - Check `GOOGLE_CALENDAR_ID` in `.env.local`
   - Use `primary` for main calendar
   - Or verify the calendar ID is correct

3. **API not enabled**
   - Go to Google Cloud Console
   - Verify Google Calendar API is enabled

### "403 Forbidden" Error

**Cause:** Service account doesn't have permission

**Fix:**
- Ensure calendar is shared with service account email
- Check permission level is "Make changes to events"
- Try deleting and re-adding the share

### "Invalid credentials" Error

**Cause:** Malformed JSON key

**Fix:**
1. Re-download the JSON key from Google Cloud Console
2. Ensure proper escaping of special characters (especially `\n` in private key)
3. Verify no extra spaces or line breaks in .env.local

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env.local` to git** (already in .gitignore)
2. ✅ **Never commit the JSON key file**
3. ✅ **Use environment variables for all credentials**
4. ✅ **Rotate keys periodically** (every 90 days)
5. ✅ **Monitor service account activity** in Google Cloud Console
6. ✅ **Use minimal permissions** (only Calendar API scope)
7. ✅ **Delete unused keys** immediately

---

## 📊 Monitoring & Logs

### View Calendar API Usage:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Dashboard**
3. Click on **Google Calendar API**
4. View metrics, quotas, and usage

### Check Service Account Activity:

1. Go to **IAM & Admin** → **Service Accounts**
2. Click on your service account
3. View activity logs and key usage

---

## 🚀 Production Deployment

### Vercel Environment Variables:

1. Go to your Vercel project
2. **Settings** → **Environment Variables**
3. Add both variables:
   - `GOOGLE_SERVICE_ACCOUNT_KEY` = your JSON key (one line)
   - `GOOGLE_CALENDAR_ID` = `primary` or your calendar ID
4. Redeploy your application

### Railway/Render/Other Platforms:

Same process - add environment variables to your hosting platform's settings.

**Important:** Most platforms support multi-line secrets, but it's safer to use the single-line JSON format.

---

## 🆘 Support Resources

- **Google Calendar API Docs**: https://developers.google.com/calendar/api/guides/overview
- **Service Accounts Guide**: https://cloud.google.com/iam/docs/service-accounts
- **googleapis npm package**: https://www.npmjs.com/package/googleapis

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Google Cloud Project created
- [ ] Google Calendar API enabled
- [ ] Service account created
- [ ] JSON key downloaded and secured
- [ ] Calendar shared with service account email
- [ ] Environment variables added to `.env.local`
- [ ] Development server tested successfully
- [ ] Calendar event appears in Google Calendar
- [ ] Customer receives calendar invitation email
- [ ] Google Meet link generated
- [ ] Production environment variables configured

---

**Built by ORCACLUB • est 2025**

Tailored solutions • Smarter workflows
