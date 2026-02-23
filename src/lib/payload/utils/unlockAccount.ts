/**
 * Unlock Account Utility Functions
 * Generates HMAC-signed time-limited tokens and sends branded unlock emails.
 * No schema changes needed — token is embedded in the signed URL, not stored in DB.
 */

import crypto from 'crypto'
import type { Payload } from 'payload'

const EXPIRY_MS = 60 * 60 * 1000 // 1 hour

function getSecret(): string {
  return process.env.PAYLOAD_SECRET || 'your-secret-here'
}

/**
 * Generate a signed unlock token that embeds the email and timestamp.
 * Format: base64url(JSON({email, ts})).hexHmac
 * Both parts are URL-safe — no encoding required in query strings.
 */
export function generateUnlockToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email, ts: Date.now() })).toString('base64url')
  const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${payload}.${hmac}`
}

/**
 * Verify a signed unlock token.
 * Returns the embedded email if valid, null if invalid or expired.
 */
export function verifyUnlockToken(token: string): string | null {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return null

  const data = token.slice(0, dotIndex)
  const providedHmac = token.slice(dotIndex + 1)

  // Verify HMAC
  const expectedHmac = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
  try {
    const expectedBuf = Buffer.from(expectedHmac, 'hex')
    const providedBuf = Buffer.from(providedHmac, 'hex')
    if (expectedBuf.length !== providedBuf.length) return null
    if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) return null
  } catch {
    return null
  }

  // Decode payload
  let parsed: { email: string; ts: number }
  try {
    parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  // Check expiry
  if (!parsed.ts || Date.now() - parsed.ts > EXPIRY_MS) return null
  if (!parsed.email) return null

  return parsed.email
}

/**
 * Generate branded HTML email template for account unlock.
 * Follows the same design language as passwordReset.ts.
 */
export function generateUnlockAccountEmailHTML(unlockUrl: string, userName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unlock your account — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:520px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header: wordmark -->
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Account Security</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 0 40px;">

              <!-- Eyebrow label -->
              <p style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Account Unlock</p>

              <!-- Heading -->
              <p style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Unlock your account.</p>

              <!-- Cyan accent hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>

              <!-- Greeting -->
              <p style="margin:32px 0 0 0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">Hello ${userName},</p>

              <!-- Body copy -->
              <p style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Your account was temporarily locked after too many failed login attempts. Click the button below to unlock it. This link expires in <span style="color:#888888;">1 hour</span>.</p>

            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${unlockUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">Unlock Account</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <p style="margin:0 0 6px 0;font-size:11px;color:#2e2e2e;letter-spacing:0.01em;line-height:1.5;">If the button doesn't work, paste this into your browser:</p>
              <p style="margin:0;font-size:11px;color:#3a5a5e;word-break:break-all;line-height:1.6;"><a href="${unlockUrl}" style="color:#3a5a5e;text-decoration:none;">${unlockUrl}</a></p>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Didn't request this? You can safely ignore it — your account will remain locked. If you have concerns, contact us at <a href="mailto:carbon@orcaclub.pro" style="color:#2a6068;text-decoration:none;">carbon@orcaclub.pro</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer bar -->
          <tr>
            <td style="padding:18px 40px;border-top:1px solid #0a0a0a;background-color:#050505;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1f1f1f;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1a3a3e;">CLUB</span>
                  </td>
                  <td align="right">
                    <a href="https://orcaclub.pro" style="font-size:10px;color:#1f1f1f;text-decoration:none;font-weight:300;letter-spacing:0.02em;">orcaclub.pro</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

/**
 * Generate plain text version of account unlock email
 */
export function generateUnlockAccountEmailText(unlockUrl: string, userName: string): string {
  return `
Hello ${userName},

Your ORCACLUB account was temporarily locked after too many failed login attempts.

Unlock your account by visiting this link:
${unlockUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this, you can safely ignore it — your account will remain locked.
If you have concerns, contact us at carbon@orcaclub.pro.

---
ORCACLUB
orcaclub.pro
  `.trim()
}

/**
 * Send account unlock email to user
 */
export async function sendUnlockAccountEmail(
  payload: Payload,
  email: string,
  name: string,
  unlockUrl: string
): Promise<void> {
  try {
    await payload.sendEmail({
      to: email,
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
      subject: 'Unlock your Account | ORCACLUB',
      html: generateUnlockAccountEmailHTML(unlockUrl, name),
      text: generateUnlockAccountEmailText(unlockUrl, name),
    })
    payload.logger.info(`[Unlock Account] Unlock email sent to ${email}`)
  } catch (error) {
    payload.logger.error(`[Unlock Account] Failed to send unlock email to ${email}:`, error)
    throw error
  }
}
