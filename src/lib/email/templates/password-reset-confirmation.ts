/**
 * Password Reset Confirmation — Client
 * Sent to the client after they successfully reset their password.
 * Subject: Password Updated | ORCACLUB
 */

import { baseEmailTemplate, baseTextTemplate } from './base'

export interface PasswordResetConfirmationData {
  name: string
}

export function passwordResetConfirmationSubject(): string {
  return 'Password Updated | ORCACLUB'
}

export function passwordResetConfirmationHTML({ name }: PasswordResetConfirmationData): string {
  const LOGIN_URL = 'https://orcaclub.pro/login'

  const content = `
          <!-- Eyebrow label -->
          <tr>
            <td style="padding:0 0 14px 0;">
              <p class="oc-eyebrow" style="margin:0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Security Update</p>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding:0 0 0 0;">
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Password updated.</p>
            </td>
          </tr>

          <!-- Cyan accent hairline -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting + Body -->
          <tr>
            <td style="padding:32px 0 0 0;">
              <p class="oc-body-text" style="margin:0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">Hello ${name},</p>
              <p class="oc-body-text" style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Your ORCACLUB password was successfully changed. You can sign in to your Spaces dashboard using your new password.</p>
            </td>
          </tr>

          <!-- Security warning -->
          <tr>
            <td style="padding:24px 0 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                     class="oc-warn-box" style="background-color:#1a0a0a;border:1px solid #3a1515;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p class="oc-warn-text" style="margin:0;font-size:11px;color:#7a3a3a;line-height:1.7;font-weight:300;">If you didn't make this change, contact us immediately at <a href="mailto:chance@orcaclub.pro" style="color:#7a3a3a;text-decoration:underline;">chance@orcaclub.pro</a> — your account may be compromised.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:32px 0 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${LOGIN_URL}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">Sign In to Spaces</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer note -->
          <tr>
            <td style="padding:28px 0 40px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Questions? Reply to this email or reach us at <a href="mailto:chance@orcaclub.pro" style="color:#2a6068;text-decoration:none;">chance@orcaclub.pro</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  `

  return baseEmailTemplate({ content })
}

export function passwordResetConfirmationText({ name }: PasswordResetConfirmationData): string {
  const LOGIN_URL = 'https://orcaclub.pro/login'

  const content = `Hello ${name},

Your ORCACLUB password was successfully changed. You can sign in to your Spaces dashboard using your new password.

SIGN IN TO SPACES
${LOGIN_URL}

SECURITY NOTICE
━━━━━━━━━━━━━━━━━━━━
If you didn't make this change, contact us immediately at chance@orcaclub.pro — your account may be compromised.`

  return baseTextTemplate({ content })
}
