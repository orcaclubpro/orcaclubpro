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
 * Generate HTML email template for 2FA code
 */
export function generateTwoFactorEmailHTML(code: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account - ORCACLUB</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #000000;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border-radius: 12px;
            border: 1px solid #67e8f9;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(45deg, #67e8f9, #3b82f6, #1e40af, #67e8f9);
            background-size: 300% 300%;
            padding: 40px 20px;
            text-align: center;
            color: white;
          }
          .brand {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
          }
          .brand-club {
            background: linear-gradient(45deg, #67e8f9, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .content {
            padding: 40px 30px;
            color: #e5e5e5;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #ffffff;
          }
          .code-container {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            border: 2px solid #67e8f9;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #67e8f9;
            font-family: 'Courier New', monospace;
            text-shadow: 0 0 10px rgba(103, 232, 249, 0.5);
          }
          .code-label {
            font-size: 14px;
            color: #a5f3fc;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .message {
            font-size: 16px;
            line-height: 1.8;
            margin: 20px 0;
            color: #d1d5db;
          }
          .warning {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #fca5a5;
          }
          .footer {
            background: #0a0a0a;
            padding: 30px;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
            border-top: 1px solid #374151;
          }
          .footer-link {
            color: #67e8f9;
            text-decoration: none;
          }
          .tagline {
            font-size: 12px;
            color: #6b7280;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand">
              ORCA<span class="brand-club">CLUB</span>
            </h1>
            <p class="tagline" style="color: #a5f3fc; margin: 5px 0 0 0;">est 2025</p>
          </div>

          <div class="content">
            <p class="greeting">Hello ${userName},</p>

            <p class="message">
              Welcome to <strong>ORCACLUB</strong>! To complete your account setup and ensure the security of your account, please verify your email address with the code below.
            </p>

            <div class="code-container">
              <div class="code">${code}</div>
              <div class="code-label">Verification Code</div>
            </div>

            <p class="message">
              Enter this code in the verification form to activate your account. This code will expire in <strong>10 minutes</strong>.
            </p>

            <div class="warning">
              ⚠️ <strong>Security Notice:</strong> If you didn't create an ORCACLUB account, please ignore this email. Someone may have entered your email address by mistake.
            </div>

            <p class="message">
              If you have any questions or need assistance, feel free to contact our team at <a href="mailto:chance@orcaclub.pro" class="footer-link">chance@orcaclub.pro</a>.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              <strong style="color: #ffffff;">ORCA<span style="color: #67e8f9;">CLUB</span></strong> - Technical Operations Development Studio
            </p>
            <p style="margin: 5px 0;">
              <a href="https://orcaclub.pro" class="footer-link">orcaclub.pro</a>
            </p>
            <p style="margin: 15px 0 5px 0; font-size: 12px;">
              © 2025 ORCACLUB. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
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
      from: process.env.EMAIL_FROM || 'chance@orcaclub.pro',
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
