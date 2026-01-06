/**
 * Login 2FA Utility Functions
 * Generates and sends login verification codes via email
 */

import type { Payload } from 'payload'

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
 * Generate minimal branded HTML email template for login 2FA
 */
export function generateLoginCodeEmailHTML(code: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Login Code - ORCACLUB</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #e5e5e5;
            background-color: #000000;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 500px;
            margin: 40px auto;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border-radius: 12px;
            border: 1px solid #67e8f9;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(90deg, #67e8f9, #3b82f6);
            padding: 24px;
            text-align: center;
          }
          .brand {
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            margin: 0;
          }
          .content {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 16px;
            color: #ffffff;
          }
          .code-container {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            border: 2px solid #67e8f9;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #67e8f9;
            font-family: 'Courier New', monospace;
            text-shadow: 0 0 10px rgba(103, 232, 249, 0.5);
          }
          .message {
            font-size: 14px;
            line-height: 1.6;
            margin: 16px 0;
            color: #d1d5db;
          }
          .footer {
            background: #0a0a0a;
            padding: 20px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            border-top: 1px solid #374151;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand">ORCACLUB</h1>
          </div>

          <div class="content">
            <p class="greeting">Hello ${userName},</p>

            <p class="message">
              Your login verification code is:
            </p>

            <div class="code-container">
              <div class="code">${code}</div>
            </div>

            <p class="message">
              This code will expire in <strong>10 minutes</strong>.
            </p>

            <p class="message">
              If you didn't attempt to log in, please ignore this email.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">ORCACLUB est 2025</p>
          </div>
        </div>
      </body>
    </html>
  `
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
      from: process.env.EMAIL_FROM || 'chance@orcaclub.pro',
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
