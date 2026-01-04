# API Credentials Management System

Complete guide for the secure, database-backed API credentials system in ORCACLUB.

## 📋 Overview

The API Credentials system provides a **simple, secure, and maintainable** way to store OAuth2 tokens, API keys, and other sensitive credentials in your MongoDB database with automatic encryption.

### Key Features

✅ **Encrypted Storage** - AES-256-GCM encryption using `PAYLOAD_SECRET`
✅ **Auto-Refresh** - OAuth tokens refresh automatically
✅ **Database-Backed** - Persists across server restarts
✅ **Admin UI** - Manage credentials via PayloadCMS admin panel
✅ **Type-Safe** - Full TypeScript support
✅ **Multi-Provider** - Support for Google, Stripe, Shopify, etc.

---

## 🏗️ Architecture

### Components

1. **`api-credentials` Collection** (`src/lib/payload/payload.config.ts`)
   - PayloadCMS collection for storing credentials
   - Encrypted `accessToken` and `refreshToken` fields
   - Auto-updates status based on expiration

2. **Encryption Utilities** (`src/lib/encryption.ts`)
   - AES-256-GCM encryption/decryption
   - Uses `PAYLOAD_SECRET` for key derivation
   - Salt + IV + AuthTag for security

3. **Helper Functions** (`src/lib/api-credentials.ts`)
   - `getCredentials(provider)` - Retrieve and decrypt
   - `saveCredentials(provider, data)` - Save/update
   - `updateAccessToken(provider, token, expiry)` - Refresh
   - `isExpired(provider)` - Check expiration
   - `deleteCredentials(provider)` - Remove

4. **OAuth Services** (`src/lib/google/`)
   - `gmail-service.ts` - Gmail API wrapper
   - `oauth-calendar-service.ts` - Calendar API wrapper
   - Auto-load credentials from database
   - Auto-save refreshed tokens

---

## 🔐 Security Features

### Encryption

**Algorithm:** AES-256-GCM (Authenticated Encryption)
**Key Derivation:** PBKDF2 with 100,000 iterations
**Storage Format:** `salt:iv:encrypted:authTag` (all in hex)

```typescript
// Tokens are encrypted before saving
const encrypted = encrypt('ya29.a0AfH6SMBqX...')
// Returns: "a1b2c3...d4e5:f6g7h8...i9j0:k1l2m3...n4o5:p6q7r8...s9t0"

// Tokens are decrypted when retrieved
const decrypted = decrypt(encrypted)
// Returns: "ya29.a0AfH6SMBqX..."
```

### Admin Panel Protection

- Tokens **never displayed** in admin UI (shows `••••••••••••`)
- Field components hidden for sensitive data
- Server-side only access control
- Encrypted at rest in database

### Best Practices

1. ✅ **Never log raw tokens** - Use masked versions
2. ✅ **Rotate PAYLOAD_SECRET carefully** - Re-encrypt all credentials
3. ✅ **Use environment variables** for OAuth client credentials
4. ✅ **Monitor access** - Check admin audit logs
5. ✅ **Backup encrypted data** - Separate from PAYLOAD_SECRET

---

## 🚀 Setup Guide

### Step 1: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Gmail API** and **Google Calendar API**
3. Create **OAuth 2.0 Client ID**
4. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret

### Step 2: Environment Variables

Add to `.env.local`:

```bash
# Required: PayloadCMS secret (used for encryption)
PAYLOAD_SECRET=your-super-secret-key-32-chars-min

# Required: Google OAuth credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Optional: Email configuration
GOOGLE_EMAIL_FROM=noreply@yourdomain.com
GOOGLE_CALENDAR_ID=primary
```

### Step 3: Run Database Migration

Generate TypeScript types and run migrations:

```bash
bun run payload:generate
bun run payload:migrate
```

This creates the `api-credentials` collection in MongoDB.

### Step 4: Run OAuth Setup Script

```bash
bun run scripts/google-oauth-setup.ts
```

**The script will:**
1. Generate authorization URL
2. Prompt you to authorize in browser
3. Ask for authorization code
4. Exchange code for tokens
5. **Automatically save encrypted tokens to database** 🎉

### Step 5: Verify in Admin Panel

Visit: `http://localhost:3000/admin/collections/api-credentials`

You should see:
- Provider: `google-oauth`
- Status: `active`
- Expires At: (timestamp)
- Tokens: `••••••••••••` (encrypted, hidden)

---

## 💻 Usage Examples

### Send Email

```typescript
import { gmailService } from '@/lib/google/gmail-service'

// Service auto-loads credentials from database
await gmailService.sendEmail({
  to: 'client@example.com',
  subject: 'Your Consultation is Confirmed',
  body: 'Looking forward to speaking with you!',
})
```

### Create Calendar Event

```typescript
import { oauthCalendarService } from '@/lib/google/oauth-calendar-service'

const eventLink = await oauthCalendarService.createEvent({
  summary: 'Client Meeting - John Doe',
  description: 'Initial consultation',
  startDateTime: '2026-01-10T10:00:00-08:00',
  endDateTime: '2026-01-10T11:00:00-08:00',
  attendeeEmail: 'john@example.com',
  attendeeName: 'John Doe',
})

console.log('Event created:', eventLink)
```

### Manual Credential Management

```typescript
import { getCredentials, saveCredentials, isExpired } from '@/lib/api-credentials'

// Get credentials
const creds = await getCredentials('google-oauth')
console.log('Access token:', creds?.accessToken)
console.log('Refresh token:', creds?.refreshToken)

// Check if expired
const expired = await isExpired('google-oauth')
console.log('Is expired:', expired)

// Save new credentials (e.g., for Stripe)
await saveCredentials('stripe', {
  accessToken: 'sk_live_...',
  scopes: 'read_write',
  metadata: { environment: 'production' },
})
```

---

## 🔄 Token Refresh Flow

The system **automatically handles token refresh**:

1. **Service initializes** → Loads credentials from database
2. **Token expires** → `googleapis` detects expiration
3. **Auto-refresh** → Uses refresh token to get new access token
4. **Auto-save** → New access token saved to database
5. **Continue** → API call proceeds seamlessly

### Implementation

```typescript
// In gmail-service.ts and oauth-calendar-service.ts
const auth = createAuthenticatedClient(
  {
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: expiryDate,
  },
  // Callback fires when token refreshes
  async (newTokens) => {
    if (newTokens.access_token && newTokens.expiry_date) {
      await updateAccessToken(
        'google-oauth',
        newTokens.access_token,
        new Date(newTokens.expiry_date)
      )
    }
  }
)
```

---

## 📊 Database Schema

### `api-credentials` Collection

| Field | Type | Description |
|-------|------|-------------|
| `provider` | Select | Provider name (google-oauth, stripe, etc.) |
| `type` | Select | Credential type (oauth2, api-key, bearer, basic) |
| `accessToken` | Text | Encrypted access token |
| `refreshToken` | Text | Encrypted refresh token |
| `expiresAt` | Date | When access token expires |
| `scopes` | Textarea | OAuth scopes or permissions |
| `status` | Select | active, expired, revoked, error |
| `lastRefreshed` | Date | Last token refresh timestamp |
| `metadata` | JSON | Additional provider-specific data |
| `notes` | Textarea | Internal notes |

---

## 🛡️ Encryption Details

### How It Works

```typescript
// Encryption
const plaintext = "ya29.a0AfH6SMBqX..."
const encrypted = encrypt(plaintext)
// Format: "salt:iv:ciphertext:authTag" (hex)

// Decryption
const decrypted = decrypt(encrypted)
// Returns: "ya29.a0AfH6SMBqX..."
```

### Key Derivation

```typescript
// Derives 256-bit key from PAYLOAD_SECRET
const key = crypto.pbkdf2Sync(
  process.env.PAYLOAD_SECRET,
  salt,              // Random 64-byte salt
  100000,            // 100k iterations
  32,                // 256 bits
  'sha512'
)
```

### Important Notes

⚠️ **If you change `PAYLOAD_SECRET`:**
- All encrypted credentials become undecryptable
- You must re-run OAuth setup for all providers
- Backup database before changing

⚠️ **Database backups:**
- Encrypted credentials are safe even if database is compromised
- But keep `PAYLOAD_SECRET` separate from database backups

---

## 🧪 Testing

### Test Encryption

```typescript
import { encrypt, decrypt, isEncrypted } from '@/lib/encryption'

const original = 'my-secret-token'
const encrypted = encrypt(original)
const decrypted = decrypt(encrypted)

console.log('Original:', original)
console.log('Encrypted:', encrypted)
console.log('Decrypted:', decrypted)
console.log('Is encrypted:', isEncrypted(encrypted)) // true
console.log('Match:', original === decrypted) // true
```

### Test Credentials

```typescript
import { saveCredentials, getCredentials } from '@/lib/api-credentials'

// Save test credentials
await saveCredentials('custom', {
  accessToken: 'test-token-123',
  scopes: 'read write',
  metadata: { env: 'test' },
})

// Retrieve and verify
const creds = await getCredentials('custom')
console.log('Token:', creds?.accessToken) // 'test-token-123' (decrypted)
```

---

## 🚨 Troubleshooting

### "Failed to decrypt data"

**Cause:** `PAYLOAD_SECRET` changed or corrupted data
**Solution:** Re-run OAuth setup script

### "No OAuth credentials found in database"

**Cause:** Setup script not run or credentials deleted
**Solution:** Run `bun run scripts/google-oauth-setup.ts`

### "Tokens expired immediately"

**Cause:** System clock out of sync
**Solution:** Check server time, resync NTP

### "PAYLOAD_SECRET environment variable is required"

**Cause:** Missing `PAYLOAD_SECRET` in `.env.local`
**Solution:** Add secret (minimum 32 characters)

---

## 📦 File Structure

```
src/lib/
├── encryption.ts                   # AES-256-GCM utilities
├── api-credentials.ts              # Helper functions
├── google/
│   ├── oauth-config.ts            # OAuth client config
│   ├── gmail-service.ts           # Gmail API (database-backed)
│   └── oauth-calendar-service.ts  # Calendar API (database-backed)
└── payload/
    └── payload.config.ts          # ApiCredentials collection

scripts/
└── google-oauth-setup.ts          # Setup script (saves to DB)

docs/
├── API_CREDENTIALS_SYSTEM.md      # This file
└── GOOGLE_OAUTH_SETUP.md          # Original env-var guide (legacy)
```

---

## 🔮 Future Enhancements

- [ ] Web UI for OAuth flow (no terminal needed)
- [ ] Credential rotation scheduler
- [ ] Multi-user OAuth (per-user tokens)
- [ ] Audit log for credential access
- [ ] Export/import encrypted credentials
- [ ] Key rotation tool (re-encrypt with new secret)

---

## ✅ Comparison: Database vs Environment Variables

| Feature | Database (Current) | Environment Variables (Old) |
|---------|-------------------|----------------------------|
| **Persistence** | ✅ Persists across deploys | ❌ Lost on container restart |
| **Auto-refresh** | ✅ Saves automatically | ❌ Only in memory |
| **Encryption** | ✅ AES-256-GCM | ❌ Plain text in .env |
| **Admin UI** | ✅ View/manage in CMS | ❌ No UI |
| **Multi-server** | ✅ Shared via database | ❌ Per-server .env files |
| **Security** | ✅ Encrypted at rest | ⚠️ Plain text (gitignored) |
| **Complexity** | Medium | Simple |

---

## 📚 Related Documentation

- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md) - Complete OAuth flow
- [PayloadCMS Collections](https://payloadcms.com/docs/configuration/collections)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)

---

**ORCACLUB est 2025** - Technical Operations Development Studio
Built with security and maintainability in mind. 🔒
