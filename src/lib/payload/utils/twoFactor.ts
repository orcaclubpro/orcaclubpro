/**
 * 2FA Utility Functions for User Authentication
 * Generates and sends verification codes via email
 */

import type { Payload } from 'payload'

/**
 * Generate a random 6-digit verification code
 */
export function generateTwoFactorCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Get expiry time for 2FA code (10 minutes from now)
 */
export function getTwoFactorExpiry(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 10)
  return expiry
}

/**
 * Generate HTML email template for 2FA code.
 *
 * All styles are fully inlined — no <style> blocks — for maximum email client
 * compatibility (Gmail strips class-based styles entirely).
 */
export function generateTwoFactorEmailHTML(code: string, userName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account — ORCACLUB</title>
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
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Account Setup</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 0 40px;">

              <!-- Eyebrow label -->
              <p style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Email Verification</p>

              <!-- Heading -->
              <p style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Verify your account.</p>

              <!-- Cyan accent hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>

              <!-- Greeting -->
              <p style="margin:32px 0 0 0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">Hello ${userName},</p>

              <!-- Body copy -->
              <p style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Welcome to ORCACLUB. To complete your account setup, please verify your email address using the code below. This code expires in <span style="color:#888888;">10 minutes</span>.</p>

            </td>
          </tr>

          <!-- Code box -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color:#111111;border:1px solid #67e8f9;padding:24px 40px;text-align:center;">
                    <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:8px;color:#67e8f9;font-family:'Courier New',monospace;">${code}</p>
                    <p style="margin:8px 0 0 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;">Verification Code</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security warning -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color:#1a0a0a;border:1px solid #3a1515;padding:16px 20px;">
                    <p style="margin:0;font-size:11px;color:#7a3a3a;line-height:1.7;font-weight:300;">If you didn't create an ORCACLUB account, please ignore this email. Someone may have entered your address by mistake.</p>
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
                  <td style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Questions? Contact us at <a href="mailto:chance@orcaclub.pro" style="color:#2a6068;text-decoration:none;">chance@orcaclub.pro</a>.</p>
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
 * Generate plain text version of 2FA email
 */
export function generateTwoFactorEmailText(code: string, userName: string): string {
  return `
Hello ${userName},

Welcome to ORCACLUB! To complete your account setup, please verify your email address with the code below.

Verification Code: ${code}

Enter this code in the verification form to activate your account. This code will expire in 10 minutes.

SECURITY NOTICE: If you didn't create an ORCACLUB account, please ignore this email.

If you have any questions, contact us at chance@orcaclub.pro.

---
ORCACLUB - Technical Operations Development Studio
https://orcaclub.pro
© 2025 ORCACLUB. All rights reserved.
  `.trim()
}

/**
 * Send 2FA verification email to user
 */
export async function sendTwoFactorEmail(
  payload: Payload,
  email: string,
  name: string,
  code: string
): Promise<void> {
  try {
    await payload.sendEmail({
      to: email,
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
      subject: `${code} is your ORCACLUB verification code`,
      html: generateTwoFactorEmailHTML(code, name),
      text: generateTwoFactorEmailText(code, name),
    })

    payload.logger.info(`[2FA] Verification email sent to ${email}`)
  } catch (error) {
    payload.logger.error(`[2FA] Failed to send verification email to ${email}:`, error)
    throw error
  }
}

/**
 * Verify 2FA code for a user
 */
export async function verifyTwoFactorCode(
  payload: Payload,
  userId: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Fetch user with 2FA data
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    // Check if already verified
    if (user.twoFactorVerified) {
      return { success: false, message: 'Account already verified' }
    }

    // Check if code exists
    if (!user.twoFactorCode) {
      return { success: false, message: 'No verification code found. Please request a new code.' }
    }

    // Check if code matches
    if (user.twoFactorCode !== code) {
      return { success: false, message: 'Invalid verification code' }
    }

    // Check if code has expired
    if (user.twoFactorExpiry && new Date(user.twoFactorExpiry) < new Date()) {
      return { success: false, message: 'Verification code has expired. Please request a new code.' }
    }

    // Update user to mark as verified
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        twoFactorVerified: true,
        twoFactorCode: null,
        twoFactorExpiry: null,
      },
    })

    payload.logger.info(`[2FA] User ${userId} successfully verified`)
    return { success: true, message: 'Account verified successfully!' }
  } catch (error) {
    payload.logger.error(`[2FA] Verification error for user ${userId}:`, error)
    return { success: false, message: 'An error occurred during verification' }
  }
}
