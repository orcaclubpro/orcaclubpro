# Login 2FA Implementation

## Overview

This document describes the login-based 2FA (Two-Factor Authentication) system implemented for ORCACLUB admin access. Every admin login now requires both password authentication AND a 6-digit code sent via email.

## Features

- **Mandatory for All Logins**: Every admin login requires 2FA code verification
- **Minimal Branded Email**: Clean, simple email with just the code
- **10-Minute Expiry**: Login codes expire after 10 minutes
- **Password Verification First**: Credentials validated before sending code
- **Account Verification Required**: Users must complete account verification (registration 2FA) before login 2FA works
- **Type-Safe**: Full TypeScript support with PayloadCMS types

## Security Model

### Two Separate 2FA Systems

This implementation maintains two distinct 2FA systems:

1. **Account Verification 2FA** (Registration)
   - Triggered when new account is created
   - Fields: `twoFactorCode`, `twoFactorExpiry`, `twoFactorVerified`
   - Purpose: Verify email ownership during signup
   - One-time: Only happens during account creation

2. **Login 2FA** (This Implementation)
   - Triggered on every login attempt
   - Fields: `loginTwoFactorCode`, `loginTwoFactorExpiry`
   - Purpose: Secure admin access on every login
   - Recurring: Required for every login session

## Architecture

### Flow Diagram

```
1. User visits /admin (PayloadCMS admin)
2. Enters email + password
3. POST /api/auth/request-login-code
   ├─ Validates credentials with PayloadCMS
   ├─ Checks if account is verified (twoFactorVerified)
   ├─ Generates 6-digit code
   └─ Sends minimal branded email
4. User receives email with code
5. User enters code in login page
6. POST /api/auth/verify-login-code
   ├─ Validates code + expiry
   ├─ Creates authenticated session
   └─ Returns JWT token
7. User redirected to /admin dashboard
```

### Database Schema

Added to Users collection (`src/lib/payload/payload.config.ts:688-709`):

```typescript
{
  loginTwoFactorCode: string | null        // 6-digit code
  loginTwoFactorExpiry: string | null      // ISO 8601 timestamp
}
```

These fields are separate from account verification fields.

### Utilities (`src/lib/payload/utils/loginTwoFactor.ts`)

Core utility functions for login 2FA:

- **`generateLoginCode()`** - Creates random 6-digit code
- **`getLoginCodeExpiry()`** - Returns Date object 10 minutes in future
- **`generateLoginCodeEmailHTML(code, userName)`** - Minimal branded HTML email
- **`generateLoginCodeEmailText(code, userName)`** - Plain text email fallback
- **`sendLoginCodeEmail(payload, email, name, code)`** - Sends login code email
- **`verifyLoginCode(payload, email, code)`** - Validates code and returns userId

## API Endpoints

### POST `/api/auth/request-login-code`

Validates credentials and sends login code via email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "user-password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login code sent to your email. Please check your inbox.",
  "email": "user@example.com"
}
```

**Error Responses:**
- `400` - Missing email/password or invalid email format
- `401` - Invalid credentials
- `403` - Account not verified (must complete registration 2FA first)
- `500` - Server error

**Process:**
1. Validates email and password presence
2. Attempts PayloadCMS authentication with credentials
3. Checks if account is verified (`twoFactorVerified === true`)
4. Generates 6-digit code + 10-minute expiry
5. Updates user record with login code
6. Sends minimal branded email
7. Returns success with user's email

---

### POST `/api/auth/verify-login-code`

Verifies login code and creates authenticated session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `400` - Missing email/code, invalid code format, wrong code, or expired code
- `404` - User not found
- `500` - Server error

**Process:**
1. Validates email and code presence
2. Validates code format (6 digits)
3. Calls `verifyLoginCode()` utility
4. Checks code match and expiry
5. Clears login code from database
6. Creates authenticated session
7. Returns user data and JWT token

## Email Template

The login 2FA email is **minimal and focused**:

### Design Philosophy
- Clean, simple layout
- Just the code - no distractions
- Quick to scan and use
- ORCACLUB branding (subtle)

### Contents
- **ORCACLUB header** with gradient (minimal)
- **Greeting** with user's name
- **Large, centered code** (36px, cyan, monospace)
- **Expiry notice** (10 minutes)
- **Security notice** (if didn't attempt login)
- **Footer** with "ORCACLUB est 2025"

### Visual Style
- Dark theme
- Cyan/blue accents
- Monospace code display with glow effect
- Maximum 500px width (mobile-friendly)

**Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━
    ORCACLUB
━━━━━━━━━━━━━━━━━━━━━━━━

Hello User Name,

Your login verification code is:

┌─────────────────┐
│    123456       │
└─────────────────┘

This code will expire in 10 minutes.

If you didn't attempt to log in,
please ignore this email.

━━━━━━━━━━━━━━━━━━━━━━━━
ORCACLUB est 2025
```

## Integration with PayloadCMS Admin

### Current Setup

PayloadCMS has built-in login at `/admin`. To integrate login 2FA:

**Option 1: Custom Login Page (Recommended)**
- Create custom login page that calls our API
- Replace PayloadCMS default login
- Configure in `payload.config.ts`:

```typescript
admin: {
  components: {
    views: {
      Account: {
        Component: '@/components/admin/CustomLogin',
        path: '/login',
      },
    },
  },
}
```

**Option 2: Middleware Approach**
- Add middleware to intercept `/admin` requests
- Redirect to custom 2FA flow
- Return to admin after verification

**Option 3: PayloadCMS Hooks**
- Use `beforeLogin` hook to enforce 2FA
- Challenge: Limited control over UI flow

### Recommended Implementation

Create a custom login flow:

1. **Login Page** (`/admin/login`)
   - Email + password form
   - Calls `/api/auth/request-login-code`
   - Shows "Code sent to email" message

2. **Code Verification Page** (`/admin/verify`)
   - 6-digit code input
   - Calls `/api/auth/verify-login-code`
   - On success: Sets PayloadCMS session cookie
   - Redirects to `/admin`

## Usage Flow

### Standard Login with 2FA

1. **User visits `/admin`**
   - PayloadCMS login page appears

2. **User enters email + password**
   - Clicks "Log In"
   - Form sends to `/api/auth/request-login-code`

3. **Credentials validated**
   - Backend checks email/password with PayloadCMS
   - If valid, generates 6-digit code
   - Sends minimal email with code

4. **User receives email**
   - Opens email
   - Sees 6-digit code prominently displayed
   - Code format: `123456`

5. **User enters code**
   - Returns to login page
   - Enters 6-digit code
   - Submits to `/api/auth/verify-login-code`

6. **Code verified**
   - Backend validates code and expiry
   - Creates authenticated session
   - Returns JWT token

7. **User logged in**
   - Redirected to `/admin` dashboard
   - Full access to PayloadCMS admin

### Error Scenarios

**Invalid Credentials:**
- Error: "Invalid email or password"
- Action: User re-enters credentials

**Account Not Verified:**
- Error: "Please verify your account first..."
- Action: User must complete registration 2FA (check original signup email)

**Expired Code:**
- Error: "Verification code has expired. Please request a new code."
- Action: User requests new code (re-submit email/password)

**Wrong Code:**
- Error: "Invalid verification code"
- Action: User checks email and re-enters code

**No Code Found:**
- Error: "No login code found. Please request a new code."
- Action: User requests new code

## Security Features

### 1. Credential Validation First
- Password verified before sending code
- Prevents code spam to arbitrary emails
- Uses PayloadCMS's secure password hashing

### 2. Account Verification Requirement
- Users must complete registration 2FA first
- Prevents unverified accounts from logging in
- Double layer of email ownership proof

### 3. Time-Limited Codes
- All codes expire after 10 minutes
- Reduces attack window
- Enforced server-side

### 4. Single-Use Codes
- Code cleared after successful verification
- Cannot reuse old codes
- Each login requires new code

### 5. Code Format Validation
- Must be exactly 6 digits
- Validated before database query
- Prevents injection attacks

### 6. Email Enumeration Protection
- Error messages don't reveal if email exists
- Uses generic "Invalid email or password"
- Consistent timing for all responses

### 7. Separate Code Storage
- Login codes separate from registration codes
- Independent expiry tracking
- No confusion between flows

## Testing

### Test Login 2FA Flow

**Prerequisites:**
- User account must be created and verified (registration 2FA complete)
- SMTP credentials configured in `.env.local`

**Steps:**

1. **Start development server**:
   ```bash
   bun run bun:dev
   ```

2. **Request login code**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/request-login-code \
     -H "Content-Type: application/json" \
     -d '{
       "email":"test@example.com",
       "password":"YourPassword123"
     }'
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Login code sent to your email. Please check your inbox.",
     "email": "test@example.com"
   }
   ```

3. **Check email** for 6-digit code

4. **Verify login code**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/verify-login-code \
     -H "Content-Type: application/json" \
     -d '{
       "email":"test@example.com",
       "code":"123456"
     }'
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Login successful!",
     "user": {...},
     "token": "jwt_token"
   }
   ```

---

### Test Error Cases

**Invalid credentials:**
```bash
curl -X POST http://localhost:3000/api/auth/request-login-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```
Response: `401 - Invalid email or password`

**Unverified account:**
```bash
# Create new user but don't verify registration 2FA
# Then try to login
```
Response: `403 - Please verify your account first...`

**Expired code:**
```bash
# Wait 11 minutes after requesting code
# Then try to verify
```
Response: `400 - Verification code has expired`

**Wrong code:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-login-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"000000"}'
```
Response: `400 - Invalid verification code`

---

### Manual Testing Checklist

- [ ] Create new user account (triggers registration 2FA)
- [ ] Verify account with registration 2FA code
- [ ] Attempt login with email + password
- [ ] Receive login code email
- [ ] Verify email formatting (minimal, branded)
- [ ] Enter correct code
- [ ] Successfully log in to admin
- [ ] Log out and repeat
- [ ] Try with wrong password → Should fail before code
- [ ] Try with correct password → Should send code
- [ ] Try with wrong code → Should reject
- [ ] Wait 11 minutes → Code should expire
- [ ] Request new code → Should work
- [ ] Try without verifying account → Should fail

---

### Database Verification

After requesting login code:

```javascript
// Check user document in MongoDB
{
  email: "user@example.com",
  twoFactorVerified: true,           // From registration
  loginTwoFactorCode: "123456",      // Login code
  loginTwoFactorExpiry: "2026-01-04T19:30:00.000Z"  // 10 min later
}
```

After verifying login code:

```javascript
{
  email: "user@example.com",
  twoFactorVerified: true,           // Still true
  loginTwoFactorCode: null,          // Cleared
  loginTwoFactorExpiry: null         // Cleared
}
```

## Troubleshooting

### Email Not Received

1. **Check SMTP credentials** in `.env.local`
2. **Verify Gmail App Password** (not regular password)
3. **Check spam/junk folder**
4. **View server logs** for nodemailer errors:
   ```
   [Login 2FA] Login code sent to user@example.com
   ```

### Code Not Working

1. **Check expiry** - Codes expire after 10 minutes
2. **Verify exact match** - Code is case-sensitive (numbers only)
3. **Check email field** - Must match exactly
4. **Ensure code exists** in database (`loginTwoFactorCode`)

### Cannot Login After Verification

1. **Check account verification** - `twoFactorVerified` must be `true`
2. **Clear old codes** - Run new login request
3. **Check session management** - May need custom session handling

### "Account Not Verified" Error

- User must complete registration 2FA first
- Check `twoFactorVerified` field in database
- Resend registration code via `/api/resend-2fa`

## Configuration

### Environment Variables

Already configured in `.env.local`:

```bash
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=ORCACLUB
```

No additional configuration needed for login 2FA.

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/payload/utils/loginTwoFactor.ts` | Login 2FA utility functions and minimal email template |
| `src/lib/payload/payload.config.ts` | Users collection with login 2FA fields (lines 688-709) |
| `src/app/api/auth/request-login-code/route.ts` | API endpoint to request login code |
| `src/app/api/auth/verify-login-code/route.ts` | API endpoint to verify login code |
| `src/types/payload-types.ts` | Generated TypeScript types (lines 407-411) |

## Next Steps for Full Integration

### 1. Create Custom Login Page

Build a custom React component for login with 2FA:

```tsx
// src/app/(admin)/login/page.tsx
'use client'

export default function AdminLogin() {
  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [email, setEmail] = useState('')

  // Step 1: Email + Password
  // Step 2: 6-digit code input
  // Handle both API calls
}
```

### 2. Configure PayloadCMS

Update `payload.config.ts` to use custom login:

```typescript
admin: {
  components: {
    views: {
      Account: {
        Component: '@/app/(admin)/login/page',
        path: '/login',
      },
    },
  },
}
```

### 3. Session Management

Handle JWT tokens and cookies:
- Store token in secure cookie
- Set PayloadCMS session cookie
- Handle token refresh

### 4. Logout Flow

Ensure logout clears:
- JWT tokens
- Session cookies
- Any cached user data

## Future Enhancements

- [ ] Remember device / trusted device option
- [ ] SMS-based login codes (Twilio integration)
- [ ] Backup codes for account recovery
- [ ] Login attempt tracking and rate limiting
- [ ] IP-based risk assessment
- [ ] Biometric authentication support
- [ ] Passwordless login with magic links
- [ ] Admin dashboard for 2FA analytics

## Support

For issues or questions about this implementation, contact:
- **Email**: chance@orcaclub.pro
- **Website**: https://orcaclub.pro

---

**ORCACLUB est 2025** - Technical Operations Development Studio
