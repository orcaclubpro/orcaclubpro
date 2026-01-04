# Google OAuth Integration Setup

Complete guide for setting up Gmail and Google Calendar integration using OAuth 2.0 with **secure database storage**.

## Overview

This integration allows your ORCACLUB application to:
- ✉️ Send emails via Gmail API
- 📅 Create and manage calendar events
- 🕐 Check calendar availability for bookings

### Storage Approach

Credentials are **securely stored in MongoDB** with AES-256-GCM encryption:
- ✅ **Persists across deployments** - No lost tokens on restart
- ✅ **Auto-refresh** - New access tokens saved automatically
- ✅ **Encrypted at rest** - AES-256-GCM encryption
- ✅ **Admin UI** - Manage credentials via PayloadCMS
- ✅ **Multi-server ready** - Shared via database

> **Note:** For detailed information about the credential storage system, see [API Credentials System Documentation](./API_CREDENTIALS_SYSTEM.md)

## Prerequisites

1. **Google Cloud Project** with Gmail and Calendar APIs enabled
2. **OAuth 2.0 Credentials** (Client ID and Client Secret)
3. **MongoDB database** configured (already set up with PayloadCMS)
4. **Environment variables** configured

---

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Required APIs

1. Navigate to **APIs & Services** > **Library**
2. Search for and enable:
   - **Gmail API**
   - **Google Calendar API**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Configure the OAuth consent screen if prompted:
   - **User Type**: External (for testing) or Internal (for workspace)
   - **App name**: ORCACLUB
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **Scopes**: Add Gmail and Calendar scopes (the setup script will request these)
4. Create OAuth Client ID:
   - **Application type**: Web application
   - **Name**: ORCACLUB OAuth Client
   - **Authorized redirect URIs**: Add `http://localhost:3000/api/auth/google/callback`
5. Click **CREATE**
6. Copy your **Client ID** and **Client Secret**

---

## Step 2: Environment Configuration

### 2.1 Add OAuth Credentials to `.env.local`

```bash
# Required: PayloadCMS secret (used for credential encryption)
PAYLOAD_SECRET=your-super-secret-key-32-chars-minimum

# Required: MongoDB connection (already configured)
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Required: Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Optional: Email configuration
GOOGLE_EMAIL_FROM=noreply@yourdomain.com
GOOGLE_CALENDAR_ID=primary
```

**Important:**
- Never commit these values to version control!
- `PAYLOAD_SECRET` is used to encrypt tokens - keep it secure
- OAuth tokens will be stored **encrypted in MongoDB**, not in `.env.local`

### 2.2 Run Database Migration

Before running the OAuth setup, ensure the database collection is created:

```bash
bun run payload:generate
bun run payload:migrate
```

This creates the `api-credentials` collection in MongoDB.

---

## Step 3: OAuth Setup (Two Methods)

You can set up Google OAuth credentials using either the **web-based UI** (recommended) or the **terminal script**.

### Method A: Web-Based Setup (Recommended)

This is the easiest method - a user-friendly web interface that handles the entire OAuth flow.

#### 1. Start your development server

```bash
bun run bun:dev
```

#### 2. Visit the OAuth setup page

Navigate to: **`http://localhost:3000/admin/oauth-setup`**

#### 3. Follow the on-screen instructions

The page will:
- Check if credentials already exist in the database
- Display current credential status (if any)
- Provide a button to start the OAuth flow
- Automatically redirect you to Google's consent screen
- Handle the callback and save encrypted credentials
- Show success/error messages

#### 4. Click "Start OAuth Setup"

You'll be redirected to Google where you:
1. Sign in with your Google account
2. Review and grant permissions (Gmail + Calendar)
3. Get redirected back to the setup page
4. See confirmation that credentials were saved

**That's it!** Your credentials are now encrypted and stored in MongoDB. The services will automatically use them.

### Method B: Terminal Script

Alternatively, you can use the command-line setup script:

#### 3.1 Execute the Setup Script

```bash
bun run scripts/google-oauth-setup.ts
```

### 3.2 Follow the Interactive Prompts

1. The script will generate an authorization URL
2. **Copy the URL** and open it in your browser
3. Sign in with the Google account you want to use
4. **Grant permissions** for Gmail and Calendar access
5. You'll be redirected to a URL like:
   ```
   http://localhost:3000/api/auth/google/callback?code=4/0AeaYSHABC123...
   ```
6. **Copy the entire `code` parameter value** (after `code=`)
7. **Paste it into the terminal** when prompted

### 3.3 Tokens Saved Automatically

The script will **automatically save encrypted tokens to MongoDB**:

```
✅ Credentials saved to database successfully!

─────────────────────────────────────
Provider: google-oauth
Expires: 2026-01-03T12:34:56.789Z
Scopes: https://www.googleapis.com/auth/gmail.send ...
─────────────────────────────────────

🎉 Setup complete! Your application can now:
   ✓ Send emails via Gmail
   ✓ Create calendar events
   ✓ Check calendar availability

🔒 Tokens are encrypted and stored securely in your database.
🔄 Access tokens will refresh automatically when needed.
👀 View/manage credentials at: http://localhost:3000/admin/collections/api-credentials
```

**No manual .env editing needed!** Tokens are encrypted and stored in MongoDB.

---

## Step 4: Verify Integration

### 4.1 Check Admin Panel

Visit: `http://localhost:3000/admin/collections/api-credentials`

You should see:
- **Provider:** `google-oauth`
- **Type:** `oauth2`
- **Status:** `active`
- **Expires At:** (timestamp showing when access token expires)
- **Access Token:** `••••••••••••` (encrypted, hidden for security)
- **Refresh Token:** `••••••••••••` (encrypted, hidden for security)

### 4.2 Test Gmail Service

Create a test script or use in your application:

```typescript
import { gmailService } from '@/lib/google/gmail-service'

// Service auto-loads credentials from database
await gmailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test Email from ORCACLUB',
  body: 'This is a test email!',
})
```

### 4.3 Test Calendar Service

```typescript
import { oauthCalendarService } from '@/lib/google/oauth-calendar-service'

// Service auto-loads credentials from database
await oauthCalendarService.createEvent({
  summary: 'Test Meeting',
  description: 'Testing calendar integration',
  startDateTime: '2026-01-10T10:00:00-08:00',
  endDateTime: '2026-01-10T11:00:00-08:00',
  attendeeEmail: 'client@example.com',
  attendeeName: 'Test Client',
})
```

> **Note:** Services automatically load credentials from the database. No manual token management needed!

---

## Usage Examples

### Send Booking Confirmation Email

```typescript
import { gmailService } from '@/lib/google/gmail-service'

await gmailService.sendBookingConfirmation({
  to: 'client@example.com',
  name: 'John Doe',
  date: 'January 10, 2026',
  time: '10:00 AM PST',
  meetLink: 'https://meet.google.com/abc-defg-hij',
})
```

### Create Calendar Event with Google Meet

```typescript
import { oauthCalendarService } from '@/lib/google/oauth-calendar-service'

const eventLink = await oauthCalendarService.createEvent({
  summary: 'Client Consultation - John Doe',
  description: 'Initial consultation for Launch Tier project',
  startDateTime: '2026-01-10T10:00:00-08:00',
  endDateTime: '2026-01-10T11:00:00-08:00',
  attendeeEmail: 'john@example.com',
  attendeeName: 'John Doe',
  timeZone: 'America/Los_Angeles',
})

console.log('Event created:', eventLink)
```

### Check Available Time Slots

```typescript
import { oauthCalendarService } from '@/lib/google/oauth-calendar-service'

const slots = await oauthCalendarService.getAvailableSlots(
  '2026-01-10', // Date (YYYY-MM-DD)
  60,           // Slot duration in minutes
  9,            // Business hours start (9 AM)
  17,           // Business hours end (5 PM)
  'America/Los_Angeles'
)

console.log('Available slots:', slots)
// Output: [
//   { start: '2026-01-10T09:00:00-08:00', end: '2026-01-10T10:00:00-08:00', label: '9:00 AM' },
//   { start: '2026-01-10T10:00:00-08:00', end: '2026-01-10T11:00:00-08:00', label: '10:00 AM' },
//   ...
// ]
```

---

## File Structure

```
src/
├── app/
│   ├── (frontend)/admin/oauth-setup/
│   │   └── page.tsx               # Web-based OAuth setup UI
│   └── api/auth/google/
│       ├── init/route.ts          # OAuth initialization endpoint
│       ├── callback/route.ts      # OAuth callback handler
│       └── status/route.ts        # Credential status endpoint
├── lib/
│   ├── encryption.ts              # AES-256-GCM encryption utilities
│   ├── api-credentials.ts         # Credential management helpers
│   ├── google/
│   │   ├── oauth-config.ts       # OAuth configuration and utilities
│   │   ├── gmail-service.ts      # Gmail API wrapper (database-backed)
│   │   └── oauth-calendar-service.ts  # Calendar API wrapper (database-backed)
│   └── payload/
│       └── payload.config.ts     # ApiCredentials collection

scripts/
└── google-oauth-setup.ts         # Terminal setup script (saves to database)

docs/
├── GOOGLE_OAUTH_SETUP.md         # This file
└── API_CREDENTIALS_SYSTEM.md     # Detailed credential system docs
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYLOAD_SECRET` | ✅ Yes | PayloadCMS secret (used for token encryption) |
| `DATABASE_URI` | ✅ Yes | MongoDB connection string |
| `GOOGLE_CLIENT_ID` | ✅ Yes | OAuth 2.0 Client ID from Google Console |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | OAuth 2.0 Client Secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | ✅ Yes | Redirect URI (must match Google Console) |
| `GOOGLE_EMAIL_FROM` | ❌ No | Default "from" email address |
| `GOOGLE_CALENDAR_ID` | ❌ No | Calendar ID (default: `primary`) |

**Note:** `GOOGLE_ACCESS_TOKEN` and `GOOGLE_REFRESH_TOKEN` are **NOT** stored in environment variables. They are automatically encrypted and stored in MongoDB.

---

## Troubleshooting

### "Missing required Google OAuth environment variables"

**Solution:** Make sure all required variables are in `.env.local`:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`

### "No OAuth credentials found in database. Run setup first."

**Solution:** Set up OAuth credentials using one of these methods:

**Web UI (Recommended):**
```
Visit: http://localhost:3000/admin/oauth-setup
```

**Terminal Script:**
```bash
bun run scripts/google-oauth-setup.ts
```

Verify credentials were saved at: `http://localhost:3000/admin/collections/api-credentials`

### "redirect_uri_mismatch" Error

**Solution:** The redirect URI in your `.env.local` must **exactly match** the one configured in Google Cloud Console (including protocol, port, and path).

Example:
```
http://localhost:3000/api/auth/google/callback
```

### "invalid_grant" Error

**Solution:** Your authorization code may have expired or already been used. Authorization codes are single-use and expire quickly. Run the setup script again and use a fresh code.

### Token Refresh Issues

**Solution:** The googleapis library automatically refreshes access tokens and saves them to the database. If you see refresh errors:
1. Check database connection (`DATABASE_URI`)
2. Verify `PAYLOAD_SECRET` hasn't changed (tokens become undecryptable)
3. Check credentials in admin panel: `http://localhost:3000/admin/collections/api-credentials`
4. Re-run setup script if needed to get fresh tokens

### Rate Limits

Gmail and Calendar APIs have rate limits:
- **Gmail**: 250 quota units per user per second
- **Calendar**: 1,000,000 queries per day

For production apps, implement exponential backoff and error handling.

---

## Security Best Practices

1. **Never commit credentials** to version control (`.env.local` is gitignored)
2. **Protect `PAYLOAD_SECRET`** - Used for encrypting tokens in database
3. **Database backups** - Keep `PAYLOAD_SECRET` separate from database backups
4. **Rotate tokens regularly** - Re-run setup script in production
5. **Limit OAuth scopes** - Only request permissions you need
6. **Monitor API usage** - Check Google Cloud Console regularly
7. **Admin panel access** - Restrict access to `api-credentials` collection
8. **Don't change `PAYLOAD_SECRET`** - All encrypted tokens become undecryptable

> **Important:** If you must change `PAYLOAD_SECRET`, re-run OAuth setup for all providers to re-encrypt credentials.

---

## Next Steps

1. ✅ Complete Google Cloud Console setup
2. ✅ Add OAuth credentials to `.env.local`
3. ✅ Run database migrations (`bun run payload:migrate`)
4. ✅ Run setup script (saves encrypted tokens to database)
5. ✅ Verify credentials in admin panel
6. ✅ Test Gmail and Calendar integration
7. 🚀 Integrate into your booking/contact flows

---

## Additional Resources

- **[API Credentials System Documentation](./API_CREDENTIALS_SYSTEM.md)** - Detailed guide on credential storage, encryption, and management
- **[Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)** - Official OAuth guide
- **[Gmail API Docs](https://developers.google.com/gmail/api)** - Gmail API reference
- **[Calendar API Docs](https://developers.google.com/calendar)** - Calendar API reference
- **[PayloadCMS Collections](https://payloadcms.com/docs/configuration/collections)** - Collection configuration

---

## Support

For issues or questions:
1. Check [API Credentials System Troubleshooting](./API_CREDENTIALS_SYSTEM.md#troubleshooting)
2. Review this guide's [Troubleshooting section](#troubleshooting)
3. Check Google Cloud Console for API quota and errors
4. Verify database connection and `PAYLOAD_SECRET` configuration

---

**ORCACLUB est 2025** - Technical Operations Development Studio
Built with security, simplicity, and maintainability in mind. 🔒
