/**
 * Password Reset Utility Functions
 * Generates secure tokens and sends branded reset emails
 */

import type { Payload } from 'payload'
import { EMAIL_LIGHT_MODE_STYLES } from '@/lib/email/templates/base'

/**
 * Generate branded HTML email template for password reset.
 *
 * Design language mirrors the /login page:
 * - Black backgrounds (#000 outer, #080808 card)
 * - Hairline borders (#111)
 * - Cyan (#67e8f9) used only for the wordmark accent, divider, and CTA
 * - Ultra-light typography, wide tracking labels, minimal copy
 *
 * All styles are inlined — no <style> block — for maximum email client
 * compatibility (Gmail strips class-based styles entirely).
 */
export function generatePasswordResetEmailHTML(resetUrl: string, userName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
  ${EMAIL_LIGHT_MODE_STYLES}
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" class="oc-card" style="max-width:520px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- ── Header: wordmark ── -->
          <tr>
            <td class="oc-header-td" style="padding:32px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Client Portal</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:40px 40px 0 40px;">

              <!-- Label -->
              <p class="oc-eyebrow" style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Password Reset</p>

              <!-- Heading -->
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Reset your password.</p>

              <!-- Cyan accent hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>

              <!-- Greeting -->
              <p class="oc-body-text" style="margin:32px 0 0 0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">Hello ${userName},</p>

              <!-- Body copy -->
              <p class="oc-body-text" style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">We received a request to reset your ORCACLUB password. Click the button below to choose a new one. This link expires in <span style="color:#888888;">1 hour</span>.</p>

            </td>
          </tr>

          <!-- ── CTA Button ── -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">Reset Password</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Fallback URL ── -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <p class="oc-muted" style="margin:0 0 6px 0;font-size:11px;color:#2e2e2e;letter-spacing:0.01em;line-height:1.5;">If the button doesn't work, paste this into your browser:</p>
              <p class="oc-url-text" style="margin:0;font-size:11px;color:#3a5a5e;word-break:break-all;line-height:1.6;"><a href="${resetUrl}" style="color:#3a5a5e;text-decoration:none;">${resetUrl}</a></p>
            </td>
          </tr>

          <!-- ── Security note ── -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Didn't request this? You can safely ignore it — your password won't change. If you have concerns, contact us at <a href="mailto:chance@orcaclub.pro" style="color:#2a6068;text-decoration:none;">chance@orcaclub.pro</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td class="oc-footer-bar" style="padding:18px 40px;border-top:1px solid #0a0a0a;background-color:#050505;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span class="oc-footer-orca" style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1f1f1f;">ORCA</span><span class="oc-footer-club" style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1a3a3e;">CLUB</span>
                  </td>
                  <td align="right">
                    <a href="https://orcaclub.pro" class="oc-footer-link" style="font-size:10px;color:#1f1f1f;text-decoration:none;font-weight:300;letter-spacing:0.02em;">orcaclub.pro</a>
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
 * Generate plain text version of password reset email
 */
export function generatePasswordResetEmailText(resetUrl: string, userName: string): string {
  return `
Hello ${userName},

We received a request to reset your password for your ORCACLUB account.

Reset your password by visiting this link:
${resetUrl}

This link will expire in 1 hour for security reasons.

SECURITY ALERT: If you didn't request a password reset, please ignore this email or contact us at chance@orcaclub.pro. Your password will remain unchanged.

For your security, we recommend:
- Using a strong, unique password
- Not reusing passwords from other accounts
- Enabling two-factor authentication (if available)

If you need assistance, contact us at chance@orcaclub.pro.

---
ORCACLUB - Technical Operations Development Studio
https://orcaclub.pro
© 2025 ORCACLUB. All rights reserved.
  `.trim()
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
  payload: Payload,
  email: string,
  name: string,
  resetUrl: string
): Promise<void> {
  try {
    await payload.sendEmail({
      to: email,
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
      subject: 'Password Reset | ORCACLUB',
      html: generatePasswordResetEmailHTML(resetUrl, name),
      text: generatePasswordResetEmailText(resetUrl, name),
    })

    payload.logger.info(`[Password Reset] Reset email sent to ${email}`)
  } catch (error) {
    payload.logger.error(`[Password Reset] Failed to send reset email to ${email}:`, error)
    throw error
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }

  return { valid: true, message: 'Password is strong' }
}
