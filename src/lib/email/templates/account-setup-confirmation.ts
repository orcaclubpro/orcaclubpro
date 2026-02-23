/**
 * Account Setup Confirmation — Client
 * Sent to the client after they successfully complete their first-time account setup.
 * Subject: You're all set | ORCACLUB
 */

import { baseEmailTemplate, baseTextTemplate } from './base'

export interface AccountSetupConfirmationData {
  name: string
  dashboardUrl: string
}

export function accountSetupConfirmationSubject(): string {
  return "You're all set | ORCACLUB"
}

export function accountSetupConfirmationHTML({
  name,
  dashboardUrl,
}: AccountSetupConfirmationData): string {
  const content = `
          <!-- Eyebrow label -->
          <tr>
            <td style="padding:0 0 14px 0;">
              <p style="margin:0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Account Active</p>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding:0 0 0 0;">
              <p style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">You're all set, ${name}.</p>
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

          <!-- Body -->
          <tr>
            <td style="padding:32px 0 0 0;">
              <p style="margin:0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Your ORCACLUB Spaces account is now fully active. You're signed in and your workspace is ready — projects, invoices, and everything in between are waiting for you.</p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:32px 0 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">Open Your Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td style="padding:20px 0 0 0;">
              <p style="margin:0 0 6px 0;font-size:11px;color:#2e2e2e;letter-spacing:0.01em;line-height:1.5;">If the button doesn't work, paste this into your browser:</p>
              <p style="margin:0;font-size:11px;color:#3a5a5e;word-break:break-all;line-height:1.6;"><a href="${dashboardUrl}" style="color:#3a5a5e;text-decoration:none;">${dashboardUrl}</a></p>
            </td>
          </tr>

          <!-- Footer note -->
          <tr>
            <td style="padding:28px 0 40px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">If you didn't create this account, contact us immediately at <a href="mailto:chance@orcaclub.pro" style="color:#2a6068;text-decoration:none;">chance@orcaclub.pro</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  `

  return baseEmailTemplate({ content })
}

export function accountSetupConfirmationText({
  name,
  dashboardUrl,
}: AccountSetupConfirmationData): string {
  const content = `You're all set, ${name}.

Your ORCACLUB Spaces account is now fully active. You're signed in and your workspace is ready.

OPEN YOUR DASHBOARD
${dashboardUrl}

If you didn't create this account, contact us immediately at chance@orcaclub.pro.`

  return baseTextTemplate({ content })
}
