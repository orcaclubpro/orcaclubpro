/**
 * Password Reset Utility Functions
 * Generates secure tokens and sends branded reset emails
 */

import type { Payload } from 'payload'
import crypto from 'crypto'

/**
 * Generate a secure password reset token (32 bytes = 64 hex characters)
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get expiry time for reset token (1 hour from now)
 */
export function getResetTokenExpiry(): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 1)
  return expiry
}

/**
 * Generate branded HTML email template for password reset
 */
export function generatePasswordResetEmailHTML(resetUrl: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - ORCACLUB</title>
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
          .message {
            font-size: 16px;
            line-height: 1.8;
            margin: 20px 0;
            color: #d1d5db;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .reset-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            border: 2px solid #67e8f9;
            border-radius: 8px;
            color: #ffffff;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 0 20px rgba(103, 232, 249, 0.3);
            transition: all 0.3s ease;
          }
          .reset-button:hover {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            box-shadow: 0 0 30px rgba(103, 232, 249, 0.5);
          }
          .alternative-link {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 15px;
            margin: 25px 0;
            word-break: break-all;
          }
          .alternative-link p {
            margin: 5px 0;
            font-size: 14px;
            color: #9ca3af;
          }
          .alternative-link a {
            color: #67e8f9;
            text-decoration: none;
            font-size: 13px;
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
          .info {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #93c5fd;
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
              We received a request to reset your password for your <strong>ORCACLUB</strong> account. If you made this request, click the button below to choose a new password.
            </p>

            <div class="button-container">
              <a href="${resetUrl}" class="reset-button">Reset Password</a>
            </div>

            <div class="info">
              ⏰ <strong>Expiry Notice:</strong> This password reset link will expire in <strong>1 hour</strong> for security reasons. If the link expires, you'll need to request a new one.
            </div>

            <div class="alternative-link">
              <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
              <a href="${resetUrl}">${resetUrl}</a>
            </div>

            <div class="warning">
              ⚠️ <strong>Security Alert:</strong> If you didn't request a password reset, please ignore this email or contact us immediately at <a href="mailto:chance@orcaclub.pro" style="color: #fca5a5;">chance@orcaclub.pro</a>. Your password will remain unchanged.
            </div>

            <p class="message" style="margin-top: 30px;">
              For your security, we recommend:
            </p>
            <ul style="color: #d1d5db; line-height: 1.8;">
              <li>Using a strong, unique password</li>
              <li>Not reusing passwords from other accounts</li>
              <li>Enabling two-factor authentication (if available)</li>
            </ul>

            <p class="message">
              If you need assistance, feel free to contact our team at <a href="mailto:chance@orcaclub.pro" class="footer-link">chance@orcaclub.pro</a>.
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
      from: process.env.EMAIL_FROM || 'chance@orcaclub.pro',
      subject: 'Reset your ORCACLUB password',
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
