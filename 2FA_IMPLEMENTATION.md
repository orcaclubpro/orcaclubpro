# 2FA Email Verification Implementation

## Overview

This document describes the 2FA (Two-Factor Authentication) email verification system implemented for new user accounts in the ORCACLUB application. When a user creates a new account, they receive a 6-digit verification code via email that must be entered to activate their account.

## Features

- **Automatic Email Sending**: 6-digit OTP code sent automatically when new users register
- **Code Expiry**: Codes expire after 10 minutes for security
- **Resend Capability**: Users can request a new code if needed
- **Branded Email Template**: Professional HTML email with ORCACLUB branding
- **Type-Safe**: Full TypeScript support with generated Payload types
- **Secure**: Uses nodemailer via PayloadCMS email adapter

## Architecture

### Database Schema (`src/lib/payload/payload.config.ts:635-666`)

Added three new fields to the Users collection:

```typescript
{
  name: 'twoFactorCode',
  type: 'text',
  // Stores the 6-digit verification code
}

{
  name: 'twoFactorExpiry',
  type: 'date',
  // ISO 8601 timestamp when code expires (10 minutes)
}

{
  name: 'twoFactorVerified',
  type: 'checkbox',
  defaultValue: false,
  // Boolean flag indicating if user has verified their account
}
```

### Utilities (`src/lib/payload/utils/twoFactor.ts`)

Core utility functions for 2FA operations:

- **`generateTwoFactorCode()`** - Generates random 6-digit code
- **`getTwoFactorExpiry()`** - Returns Date object 10 minutes in future
- **`generateTwoFactorEmailHTML(code, userName)`** - Creates branded HTML email
- **`generateTwoFactorEmailText(code, userName)`** - Plain text email fallback
- **`sendTwoFactorEmail(payload, email, name, code)`** - Sends verification email
- **`verifyTwoFactorCode(payload, userId, code)`** - Validates submitted code

### Hooks (`src/lib/payload/hooks/sendTwoFactorEmail.ts`)

PayloadCMS `afterChange` hook that:
1. Triggers only on user creation (`operation === 'create'`)
2. Generates 6-digit code and expiry timestamp
3. Updates user record with code and expiry
4. Sends branded email with verification code
5. Logs all operations for debugging

Attached to Users collection at `src/lib/payload/payload.config.ts:607-609`.

### API Endpoints

#### POST `/api/verify-2fa`

Verifies a user's 2FA code.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account verified successfully!"
}
```

**Error Responses:**
- `400` - Invalid code format, expired code, or incorrect code
- `404` - User not found
- `500` - Server error

#### POST `/api/resend-2fa`

Generates and resends a new verification code.

**Request Body:**
```json
{
  "userId": "user_id_here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code has been resent to your email"
}
```

**Error Responses:**
- `400` - User already verified or invalid request
- `404` - User not found
- `500` - Server error

## Email Template

The 2FA email includes:
- **ORCACLUB branding** with gradient logo and "est 2025" tagline
- **Large, readable code** (48px, monospace, cyan glow effect)
- **Clear instructions** with 10-minute expiry warning
- **Security notice** if email was received by mistake
- **Professional footer** with contact info and branding
- **Responsive design** works on all devices
- **Plain text fallback** for email clients without HTML support

Preview: Dark theme with cyan/blue gradients matching ORCACLUB brand.

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# SMTP Email Configuration (for PayloadCMS Nodemailer - 2FA emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=ORCACLUB
```

### Gmail App Password Setup

If using Gmail SMTP:

1. Go to Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password at https://myaccount.google.com/apppasswords
4. Use the generated password for `SMTP_PASS`

### PayloadCMS Configuration

Email adapter is already configured in `src/lib/payload/payload.config.ts:654-666`:

```typescript
email: nodemailerAdapter({
  defaultFromAddress: process.env.EMAIL_FROM || 'chance@orcaclub.pro',
  defaultFromName: process.env.EMAIL_FROM_NAME || 'ORCACLUB',
  transportOptions: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // Use TLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
}),
```

## Usage Flow

### 1. User Registration

When a new user account is created (via PayloadCMS admin or API):

```typescript
// Automatic - handled by afterChange hook
// User fills out registration form → Creates account → Hook triggers
```

### 2. Email Sent Automatically

The `sendTwoFactorEmailHook` executes:

```typescript
// Generated code: "682451"
// Expiry: 10 minutes from now
// Email sent to: user@example.com
```

### 3. User Receives Email

User receives branded email with:
- 6-digit verification code
- 10-minute expiry warning
- Instructions to complete verification

### 4. Frontend Verification Form

Create a verification form that calls `/api/verify-2fa`:

```typescript
const response = await fetch('/api/verify-2fa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_id_from_registration',
    code: '123456' // User-entered code
  })
})

const result = await response.json()
if (result.success) {
  // Redirect to dashboard or login
} else {
  // Show error: result.message
}
```

### 5. Resend Code (Optional)

If user doesn't receive email or code expires:

```typescript
const response = await fetch('/api/resend-2fa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_id_from_registration'
  })
})
```

## Security Features

1. **Code Expiry**: All codes expire after 10 minutes
2. **Single-Use**: Code is cleared after successful verification
3. **Format Validation**: API validates 6-digit format before processing
4. **Rate Limiting**: Consider adding rate limits to resend endpoint (future)
5. **Secure Transport**: Uses TLS (port 587) for email sending
6. **No Code Storage in URLs**: Code never appears in URLs or logs

## Testing

### Test New User Creation

1. Create a new user in PayloadCMS admin (`/admin/collections/users`)
2. Check email for 6-digit code
3. Verify code was saved to database:
   - `twoFactorCode`: Should have 6-digit string
   - `twoFactorExpiry`: Should be ~10 minutes in future
   - `twoFactorVerified`: Should be `false`

### Test Verification API

```bash
# Verify code
curl -X POST http://localhost:3000/api/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","code":"123456"}'

# Resend code
curl -X POST http://localhost:3000/api/resend-2fa \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID"}'
```

### Check Logs

Server logs will show:
```
[2FA Hook] Generated code for user user@example.com
[2FA] Verification email sent to user@example.com
[2FA Hook] Successfully sent verification email to user@example.com
```

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials** in `.env.local`
2. **Verify Gmail App Password** (not regular password)
3. **Check server logs** for nodemailer errors
4. **Test SMTP connection** manually

### Code Not Being Generated

1. **Check hook is attached** to Users collection
2. **Verify operation type** is `create`
3. **Check for context flag** `skipTwoFactorEmail`

### Verification Failing

1. **Check code expiry** - Must be within 10 minutes
2. **Verify exact match** - Code is case-sensitive (numbers only)
3. **Check user ID** - Must be valid MongoDB ObjectID
4. **Ensure code exists** in database

## Future Enhancements

- [ ] Rate limiting on resend endpoint (prevent abuse)
- [ ] SMS 2FA option (Twilio integration)
- [ ] Backup codes for account recovery
- [ ] Admin override to manually verify users
- [ ] Analytics dashboard for 2FA metrics
- [ ] Customizable code length and expiry
- [ ] Multi-language email templates
- [ ] Email deliverability monitoring

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/payload/payload.config.ts` | Users collection schema + hook registration |
| `src/lib/payload/utils/twoFactor.ts` | Core 2FA utility functions |
| `src/lib/payload/hooks/sendTwoFactorEmail.ts` | Hook to send email on user creation |
| `src/app/api/verify-2fa/route.ts` | API endpoint to verify codes |
| `src/app/api/resend-2fa/route.ts` | API endpoint to resend codes |
| `src/types/payload-types.ts` | Generated TypeScript types |
| `.env.example` | Environment variable template |

## Support

For issues or questions about this implementation, contact:
- **Email**: chance@orcaclub.pro
- **Website**: https://orcaclub.pro

---

**ORCACLUB est 2025** - Technical Operations Development Studio
