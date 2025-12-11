# Domain-Wide Delegation Setup Guide

## What is Domain-Wide Delegation?

Domain-Wide Delegation allows a service account to **impersonate** a user in your Google Workspace organization. This is **required** to:
- ✅ Send calendar invitations to external attendees
- ✅ Add attendees to calendar events
- ✅ Send emails on behalf of a user

Without it, you'll get the error:
```
Service accounts cannot invite attendees without Domain-Wide Delegation of Authority
```

---

## Prerequisites

⚠️ **You MUST be a Google Workspace Super Admin** to set this up.

If you're using a personal Gmail account (not Google Workspace), you **cannot** use domain-wide delegation. You'll need to use OAuth2 instead (different setup).

---

## Step-by-Step Setup

### **Step 1: Get Your Service Account's Client ID**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (`iron-handler-474005-n1`)
3. Go to **IAM & Admin** → **Service Accounts**
4. Click on your service account: `orcaclub-booking-calendar@...`
5. You'll see **"Unique ID"** or **"OAuth 2 Client ID"** - **Copy this number**
   - It looks like: `102327456661073266334`
   - This is your **Client ID**

**Save this Client ID - you'll need it in Step 2!**

---

### **Step 2: Enable Domain-Wide Delegation in Google Workspace Admin**

⚠️ **This requires Google Workspace Super Admin access**

1. Go to [Google Workspace Admin Console](https://admin.google.com/)
2. Sign in with your **Super Admin account**
3. Navigate to **Security** → **Access and data control** → **API controls**
4. Scroll down to **Domain-wide delegation**
5. Click **Manage Domain Wide Delegation**
6. Click **Add new**
7. Fill in the form:
   - **Client ID**: Paste the Client ID from Step 1 (`102327456661073266334`)
   - **OAuth Scopes**:
     ```
     https://www.googleapis.com/auth/calendar
     ```
   - **Description** (optional): `ORCACLUB Booking Calendar`
8. Click **Authorize**

**✅ Domain-wide delegation is now enabled!**

---

### **Step 3: Verify Your Email in .env.local**

Make sure you've added your Google Workspace email to `.env.local`:

```bash
GOOGLE_DELEGATED_USER_EMAIL=chance@orcaclub.pro
```

**Important:**
- This MUST be a Google Workspace email in your domain
- This is the user the service account will impersonate
- Calendar invitations will appear to come from this user

---

### **Step 4: Test the Integration**

1. **Restart your dev server:**
   ```bash
   bun run dev
   ```

2. **Check the console for:**
   ```
   Google Calendar service initialized successfully (impersonating chance@orcaclub.pro)
   ```

3. **Submit a test booking:**
   - Go to `http://localhost:3000`
   - Click "Book a Call"
   - Fill out the form
   - **Select a preferred date**
   - Submit

4. **Expected results:**
   - ✅ Toast shows success
   - ✅ Calendar event created in your Google Calendar
   - ✅ Google Meet link generated
   - ✅ **Attendee receives calendar invitation**
   - ✅ Attendee can accept/decline
   - ✅ Console shows: "Calendar event created successfully"

---

## Troubleshooting

### "Not Authorized to access this resource/api"

**Cause:** Domain-wide delegation not properly configured

**Fix:**
1. Double-check the Client ID is correct
2. Verify OAuth scope is exactly: `https://www.googleapis.com/auth/calendar`
3. Wait 5-10 minutes for changes to propagate
4. Restart your development server

### "Invalid impersonation priv missing or invalid"

**Cause:** Service account doesn't have permission to impersonate the user

**Fix:**
1. Ensure `GOOGLE_DELEGATED_USER_EMAIL` is a valid Google Workspace email
2. Verify domain-wide delegation is enabled (Step 2)
3. Check that you're using the correct Client ID

### "Calendar event created but no invitation sent"

**Cause:** Service account is creating the event but not sending invites

**Fix:**
1. Verify `sendUpdates: 'all'` is in the code (it is by default)
2. Check that domain-wide delegation is enabled
3. Ensure the delegated user has calendar permissions

### "You don't have Google Workspace"

If you're using a personal Gmail account, you **cannot** use domain-wide delegation.

**Alternative solutions:**
1. **Use OAuth2** - Users authenticate and grant access (more complex)
2. **Don't add attendees** - Just create the event on your calendar and share the Google Meet link via email
3. **Upgrade to Google Workspace** - Get domain-wide delegation capabilities

---

## Security Considerations

### What Access Does This Give?

The service account can now:
- ✅ Create calendar events on behalf of `chance@orcaclub.pro`
- ✅ Invite attendees to events
- ✅ Read/modify events on this user's calendar

The service account **CANNOT:**
- ❌ Access other Google Workspace services (Gmail, Drive, etc.) - only Calendar
- ❌ Impersonate other users (only the specified email)
- ❌ Access data outside the specified scope

### Best Practices

1. ✅ **Limit scope** - Only grant `calendar` scope (already done)
2. ✅ **Use a service account** - Designate a specific email for bookings
3. ✅ **Monitor usage** - Check Google Workspace Admin logs regularly
4. ✅ **Rotate keys** - Generate new service account keys every 90 days
5. ✅ **Document access** - Keep track of which service accounts have delegation

---

## Alternative: Using a Dedicated Booking Calendar

If you want bookings to go to a separate calendar:

1. **Create a new calendar** in Google Calendar
2. **Name it** "ORCACLUB Bookings" (or similar)
3. **Get the Calendar ID:**
   - Calendar Settings → Integrate calendar
   - Copy the **Calendar ID** (looks like: `abc123@group.calendar.google.com`)
4. **Update .env.local:**
   ```bash
   GOOGLE_CALENDAR_ID=abc123@group.calendar.google.com
   ```
5. **Share this calendar** with your team

This keeps booking events separate from your personal calendar.

---

## Quick Reference

### Environment Variables Needed

```bash
# Service account credentials (JSON on one line)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Which calendar to use (primary or specific calendar ID)
GOOGLE_CALENDAR_ID=primary

# Google Workspace email to impersonate (REQUIRED for attendees)
GOOGLE_DELEGATED_USER_EMAIL=chance@orcaclub.pro
```

### OAuth Scopes Required

```
https://www.googleapis.com/auth/calendar
```

### Service Account Client ID

```
102327456661073266334
```

---

## Next Steps

Once domain-wide delegation is set up:

1. ✅ Calendar events will include attendees
2. ✅ Google Meet links will be generated
3. ✅ Attendees will receive email invitations
4. ✅ Attendees can accept/decline from email
5. ✅ Calendar will sync across devices

**No further configuration needed!**

---

## Support Resources

- [Google Workspace Admin Help](https://support.google.com/a/answer/162106)
- [Domain-Wide Delegation Guide](https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority)
- [Calendar API Scopes](https://developers.google.com/calendar/api/auth)

---

**Built by ORCACLUB • est 2025**

Tailored solutions • Smarter workflows
