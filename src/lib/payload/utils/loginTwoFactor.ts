/**
 * Login 2FA Utility Functions
 * Generates and sends login verification codes via email
 */

import type { Payload } from 'payload'
import { EMAIL_LIGHT_MODE_STYLES } from '@/lib/email/templates/base'

/**
 * Generate a random 6-digit login verification code
 */
export function generateLoginCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Get expiry time for login code (10 minutes from now)
 */
export function getLoginCodeExpiry(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 10)
  return expiry
}

/**
 * Generate minimal branded HTML email template for login 2FA.
 *
 * All styles are fully inlined — no <style> blocks — for maximum email client
 * compatibility (Gmail strips class-based styles entirely).
 */
export function generateLoginCodeEmailHTML(code: string, userName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Code — ORCACLUB</title>
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

          <!-- Header: wordmark -->
          <tr>
            <td class="oc-header-td" style="padding:32px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Secure Login</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 0 40px;">

              <!-- Eyebrow label -->
              <p class="oc-eyebrow" style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Login Verification</p>

              <!-- Heading -->
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Your login code.</p>

              <!-- Cyan accent hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>

              <!-- Greeting -->
              <p class="oc-body-text" style="margin:32px 0 0 0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">Hello ${userName},</p>

              <!-- Body copy -->
              <p class="oc-body-text" style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Use the code below to complete your login. It expires in <span style="color:#888888;">10 minutes</span>.</p>

            </td>
          </tr>

          <!-- Code box -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-code-box" style="background-color:#111111;border:1px solid #67e8f9;padding:24px 40px;text-align:center;">
                    <p class="oc-code" style="margin:0;font-size:36px;font-weight:700;letter-spacing:8px;color:#67e8f9;font-family:'Courier New',monospace;">${code}</p>
                    <p class="oc-code-label" style="margin:8px 0 0 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;">Login Code</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">If you didn't attempt to log in, you can safely ignore this email. Your account remains secure.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer bar -->
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
 * Generate plain text version of login 2FA email
 */
export function generateLoginCodeEmailText(code: string, userName: string): string {
  return `
Hello ${userName},

Your ORCACLUB login verification code is: ${code}

This code will expire in 10 minutes.

If you didn't attempt to log in, please ignore this email.

---
ORCACLUB est 2025
  `.trim()
}

/**
 * Send login 2FA code email to user
 */
export async function sendLoginCodeEmail(
  payload: Payload,
  email: string,
  name: string,
  code: string
): Promise<void> {
  try {
    await payload.sendEmail({
      to: email,
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
      subject: `${code} - Your ORCACLUB login code`,
      html: generateLoginCodeEmailHTML(code, name),
      text: generateLoginCodeEmailText(code, name),
    })

    payload.logger.info(`[Login 2FA] Login code sent to ${email}`)
  } catch (error) {
    payload.logger.error(`[Login 2FA] Failed to send login code to ${email}:`, error)
    throw error
  }
}

/**
 * Verify login 2FA code for a user
 */
export async function verifyLoginCode(
  payload: Payload,
  email: string,
  code: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Find user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email.toLowerCase(),
        },
      },
      limit: 1,
    })

    if (!users.docs || users.docs.length === 0) {
      return { success: false, message: 'User not found' }
    }

    const user = users.docs[0]

    // Check if code exists
    if (!user.loginTwoFactorCode) {
      return { success: false, message: 'No login code found. Please request a new code.' }
    }

    // Check if code matches
    if (user.loginTwoFactorCode !== code) {
      return { success: false, message: 'Invalid verification code' }
    }

    // Check if code has expired
    if (user.loginTwoFactorExpiry && new Date(user.loginTwoFactorExpiry) < new Date()) {
      return { success: false, message: 'Verification code has expired. Please request a new code.' }
    }

    // Clear the code after successful verification
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        loginTwoFactorCode: null,
        loginTwoFactorExpiry: null,
      },
    })

    payload.logger.info(`[Login 2FA] User ${email} successfully verified login code`)
    return { success: true, message: 'Code verified successfully', userId: user.id }
  } catch (error) {
    payload.logger.error(`[Login 2FA] Verification error for ${email}:`, error)
    return { success: false, message: 'An error occurred during verification' }
  }
}
