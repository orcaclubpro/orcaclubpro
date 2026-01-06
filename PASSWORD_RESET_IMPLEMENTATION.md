# Password Reset Implementation

## Overview

This document describes the complete password reset system implemented for ORCACLUB. Users can request password resets via email, receive branded reset instructions, and securely set a new password through a custom UI.

## Features

- **Secure Token Generation**: 64-character cryptographically secure tokens
- **Time-Limited Links**: Reset links expire after 1 hour
- **Branded Email Template**: Professional HTML email with ORCACLUB branding
- **Password Strength Validation**: Real-time feedback on password requirements
- **Custom UI Pages**: Dedicated pages for password reset request and confirmation
- **Email Enumeration Protection**: Same response whether email exists or not
- **Type-Safe**: Full TypeScript support with PayloadCMS types

## Architecture

### Flow Diagram

```
1. User visits /forgot-password
2. Enters email address
3. Backend generates secure token (32 bytes = 64 hex chars)
4. Token + expiry saved to user record
5. Branded email sent with reset link
6. User clicks link → /reset-password?token=xyz
7. User enters new password (validated in real-time)
8. Backend validates token, expiry, password strength
9. Password updated, token cleared
10. User redirected to /admin (login)
```

### Database Schema

PayloadCMS Users collection already includes password reset fields:

```typescript
{
  resetPasswordToken: string | null
  resetPasswordExpiration: string | null  // ISO 8601 timestamp
}
```

These fields are automatically managed by PayloadCMS and our custom API.

### Utilities (`src/lib/payload/utils/passwordReset.ts`)

Core utility functions for password reset operations:

- **`generateResetToken()`** - Creates cryptographically secure 64-char token
- **`getResetTokenExpiry()`** - Returns Date object 1 hour in future
- **`generatePasswordResetEmailHTML(resetUrl, userName)`** - Branded HTML email
- **`generatePasswordResetEmailText(resetUrl, userName)`** - Plain text fallback
- **`sendPasswordResetEmail(payload, email, name, resetUrl)`** - Sends reset email
- **`validatePassword(password)`** - Validates password strength requirements

### Password Requirements

Enforced both client-side (real-time) and server-side:

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ Passwords must match (confirmation)

## API Endpoints

### POST `/api/auth/forgot-password`

Initiates password reset process.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive password reset instructions."
}
```

**Security Note**: Always returns success to prevent email enumeration attacks.

**Error Responses:**
- `400` - Invalid email format or missing email
- `500` - Server error

**Process:**
1. Validates email format
2. Searches for user by email (case-insensitive)
3. Generates secure token + 1-hour expiry
4. Updates user record with token
5. Sends branded email with reset link
6. Returns generic success message

---

### POST `/api/auth/reset-password`

Confirms password reset with token and new password.

**Request Body:**
```json
{
  "token": "64-character-hex-token",
  "password": "NewSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

**Error Responses:**
- `400` - Missing token/password, invalid token, expired token, or weak password
- `500` - Server error

**Process:**
1. Validates token and password presence
2. Validates password strength (8+ chars, uppercase, lowercase, number)
3. Finds user by token
4. Checks token expiry
5. Updates password (PayloadCMS auto-hashes)
6. Clears reset token fields
7. Returns success

## Frontend Pages

### `/forgot-password` - Password Reset Request

Features:
- Email input with validation
- Loading states and animations
- Success/error messaging
- Link back to login
- Security notice about link expiry
- ORCACLUB branding with AnimatedBackground

**User Experience:**
1. User enters email address
2. Clicks "Send Reset Link"
3. Sees success message (even if email doesn't exist)
4. Receives email within seconds

**File**: `src/app/(frontend)/forgot-password/page.tsx`

---

### `/reset-password?token=xyz` - Password Reset Confirmation

Features:
- Token validation from URL params
- Dual password inputs (password + confirm)
- Show/hide password toggles
- Real-time password strength indicators
- Visual checkmarks for requirements met
- Submit button disabled until all requirements met
- Loading states and animations
- Success message with auto-redirect (3 seconds)
- Error handling with helpful messages
- ORCACLUB branding

**Password Requirements UI:**
```
✅ At least 8 characters
✅ One uppercase letter (A-Z)
✅ One lowercase letter (a-z)
✅ One number (0-9)
✅ Passwords match
```

**User Experience:**
1. User clicks link from email
2. Token extracted from URL
3. Enters new password (sees live validation)
4. Confirms password
5. Clicks "Reset Password"
6. Sees success message
7. Auto-redirected to login after 3 seconds

**File**: `src/app/(frontend)/reset-password/page.tsx`

## Email Template

The password reset email includes:

- **ORCACLUB branding** with gradient logo and "est 2025" tagline
- **Clear call-to-action** button with hover effects
- **Alternative link** for copy/paste if button doesn't work
- **Expiry notice** - 1 hour time limit prominently displayed
- **Security alert** - Instructions if user didn't request reset
- **Security recommendations** - Strong password best practices
- **Professional footer** with contact info
- **Responsive design** works on all devices and email clients
- **Plain text fallback** for email clients without HTML support

**Visual Design:**
- Dark theme matching ORCACLUB brand
- Cyan/blue gradient accents
- Clear hierarchy and spacing
- High-contrast text for readability

## Security Features

### 1. Token Security
- **Cryptographically secure**: Uses Node.js `crypto.randomBytes(32)`
- **64 characters long**: Hex encoding provides 256 bits of entropy
- **Single-use**: Token cleared after successful reset
- **Time-limited**: 1-hour expiry enforced server-side

### 2. Email Enumeration Protection
- API always returns success message
- No indication whether email exists in database
- Prevents attackers from discovering valid accounts

### 3. Password Validation
- **Client-side**: Real-time feedback, better UX
- **Server-side**: Final validation, security guarantee
- **Strength requirements**: Enforced on both sides

### 4. HTTPS/TLS
- Reset links use HTTPS in production
- Email transport uses TLS (port 587)

### 5. Rate Limiting (Recommended)
Consider adding rate limiting to prevent abuse:
- Limit requests per IP address
- Limit requests per email address
- Use packages like `express-rate-limit` or Vercel rate limiting

## Configuration

### Environment Variables

Already configured in `.env.example`:

```bash
# SMTP Email Configuration (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=ORCACLUB

# Server URL (for reset links)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000  # Change in production
```

### PayloadCMS Configuration

The Users collection now includes custom email template:

**File**: `src/lib/payload/payload.config.ts:596-613`

```typescript
auth: {
  forgotPassword: {
    generateEmailHTML: ({ token, user }) => {
      const resetUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}`
      // Returns branded HTML template
    },
  },
}
```

**Note**: This is a fallback for PayloadCMS's built-in forgot password endpoint. Our custom API (`/api/auth/forgot-password`) uses the more elaborate branded template from `passwordReset.ts`.

## Usage Flow

### Standard Password Reset

1. **User forgets password**
   - Visits `/forgot-password`
   - Enters email address

2. **Email sent**
   - User receives branded email
   - Email contains reset link with token
   - Link format: `https://orcaclub.pro/reset-password?token=abc123...`

3. **User resets password**
   - Clicks link (or copies URL)
   - Enters new password
   - Sees real-time validation
   - Confirms password matches
   - Submits form

4. **Password updated**
   - Success message displayed
   - Auto-redirected to login
   - User logs in with new password

### Error Scenarios

**Expired Token:**
- Error: "Reset token has expired. Please request a new password reset."
- Action: User clicks "Request a new reset link" → Back to `/forgot-password`

**Invalid Token:**
- Error: "Invalid or expired reset token"
- Action: User requests new reset

**Weak Password:**
- Error: "Password must contain at least one uppercase letter"
- Action: User fixes password, sees live validation

**Email Not Found:**
- Response: "If an account exists..." (same as success)
- No email sent (silent failure for security)

## Testing

### Test Password Reset Request

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive password reset instructions."
}
```

**Check Email:**
- Look for email with subject "Reset your ORCACLUB password"
- Verify branded template rendered correctly
- Click reset link

---

### Test Password Reset Confirmation

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"TOKEN_FROM_EMAIL",
    "password":"NewPassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

---

### Test Password Validation

```bash
# Too short
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"xyz","password":"Pass1"}'

# Response: "Password must be at least 8 characters long"

# No uppercase
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"xyz","password":"password123"}'

# Response: "Password must contain at least one uppercase letter"
```

---

### Manual Testing Checklist

- [ ] Visit `/forgot-password` in browser
- [ ] Enter valid email, submit form
- [ ] Check email inbox for reset email
- [ ] Verify email branding and formatting
- [ ] Click "Reset Password" button in email
- [ ] Verify redirected to `/reset-password?token=...`
- [ ] Try weak password (too short)
- [ ] Try password without uppercase
- [ ] Try password without number
- [ ] Try mismatched passwords
- [ ] Enter valid password meeting all requirements
- [ ] Verify all checkmarks are green
- [ ] Submit form
- [ ] Verify success message
- [ ] Wait for auto-redirect to `/admin`
- [ ] Log in with new password
- [ ] Verify old password no longer works

---

### Database Verification

After requesting reset:

```javascript
// Check user document in MongoDB
{
  email: "user@example.com",
  resetPasswordToken: "a1b2c3d4e5f6..." // 64 chars
  resetPasswordExpiration: "2026-01-04T20:30:00.000Z" // 1 hour later
}
```

After completing reset:

```javascript
{
  email: "user@example.com",
  resetPasswordToken: null,
  resetPasswordExpiration: null,
  hash: "new-bcrypt-hash",  // Password changed
  salt: "new-salt"
}
```

## Troubleshooting

### Email Not Received

1. **Check SMTP credentials** in `.env.local`
2. **Verify Gmail App Password** (not regular password)
3. **Check spam/junk folder**
4. **View server logs** for nodemailer errors
5. **Test SMTP connection** manually

### Reset Link Not Working

1. **Check token in URL** - Should be 64 hex characters
2. **Verify expiry** - Links expire after 1 hour
3. **Check NEXT_PUBLIC_SERVER_URL** - Must match production domain
4. **Clear browser cache** - Stale page might be cached

### Password Validation Failing

1. **Check all requirements** - Min 8 chars, uppercase, lowercase, number
2. **Ensure passwords match** - Confirm field must match exactly
3. **Look at live indicators** - Green checkmarks show what's met
4. **Check browser console** - For any JavaScript errors

### Token Expired

- Request new reset via `/forgot-password`
- Tokens are single-use and expire after 1 hour
- No way to extend expired tokens (security feature)

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/payload/utils/passwordReset.ts` | Password reset utility functions and email templates |
| `src/lib/payload/payload.config.ts` | Users collection with password reset email configuration |
| `src/app/api/auth/forgot-password/route.ts` | API endpoint to request password reset |
| `src/app/api/auth/reset-password/route.ts` | API endpoint to confirm password reset |
| `src/app/(frontend)/forgot-password/page.tsx` | Password reset request page UI |
| `src/app/(frontend)/reset-password/page.tsx` | Password reset confirmation page UI |
| `src/types/payload-types.ts` | Generated TypeScript types |

## Future Enhancements

- [ ] Rate limiting on forgot-password endpoint
- [ ] Password reset history tracking
- [ ] Email notification when password is changed
- [ ] Support for SMS-based password reset
- [ ] Admin ability to force password reset
- [ ] Password strength meter visualization
- [ ] Remember device / trusted device feature
- [ ] Multi-factor authentication integration
- [ ] Account lockout after failed attempts
- [ ] CAPTCHA for password reset requests

## Support

For issues or questions about this implementation, contact:
- **Email**: chance@orcaclub.pro
- **Website**: https://orcaclub.pro

---

**ORCACLUB est 2025** - Technical Operations Development Studio
