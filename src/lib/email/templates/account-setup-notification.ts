/**
 * Account Setup Notification — Admin
 * Sent to chance@orcaclub.pro when a client completes their first-time account setup.
 * Subject: Account Setup Notification | [client name]
 */

import { baseEmailTemplate, baseTextTemplate } from './base'

export interface AccountSetupNotificationData {
  clientName: string
  clientEmail: string
  company?: string
  timestamp: string
}

export function accountSetupNotificationSubject(clientName: string): string {
  return `Account Setup Notification | ${clientName}`
}

export function accountSetupNotificationHTML({
  clientName,
  clientEmail,
  company,
  timestamp,
}: AccountSetupNotificationData): string {
  const content = `
          <!-- Eyebrow label -->
          <tr>
            <td style="padding:0 0 14px 0;">
              <p class="oc-eyebrow" style="margin:0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">New Client Active</p>
            </td>
          </tr>

          <!-- Alert Badge -->
          <tr>
            <td style="padding:0 0 4px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;padding:4px 10px;vertical-align:middle;">
                    <span style="font-size:10px;font-weight:600;color:#000000;text-transform:uppercase;letter-spacing:0.12em;">Account Setup</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Client Name -->
          <tr>
            <td style="padding:12px 0 4px 0;">
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">${clientName}</p>
            </td>
          </tr>

          <!-- Cyan accent hairline -->
          <tr>
            <td style="padding:0 0 28px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Detail box -->
          <tr>
            <td class="oc-detail-box-lborder" style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding:16px 20px;">
                    <p class="oc-detail-label" style="margin:0 0 12px 0;font-size:10px;font-weight:600;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.5px;">Client Details</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td class="oc-detail-key" style="padding:5px 0;font-size:13px;color:#3a3a3a;width:35%;">Name</td>
                        <td class="oc-detail-val" style="padding:5px 0;font-size:13px;color:#555555;text-align:right;">${clientName}</td>
                      </tr>
                      <tr>
                        <td class="oc-detail-key" style="padding:5px 0;font-size:13px;color:#3a3a3a;">Email</td>
                        <td class="oc-detail-val" style="padding:5px 0;text-align:right;">
                          <a href="mailto:${clientEmail}" style="font-size:13px;color:#555555;text-decoration:none;">${clientEmail}</a>
                        </td>
                      </tr>
                      ${company ? `
                      <tr>
                        <td class="oc-detail-key" style="padding:5px 0;font-size:13px;color:#3a3a3a;">Company</td>
                        <td class="oc-detail-val" style="padding:5px 0;font-size:13px;color:#555555;text-align:right;">${company}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td class="oc-detail-key" style="padding:5px 0;font-size:13px;color:#3a3a3a;">Completed</td>
                        <td class="oc-detail-val" style="padding:5px 0;font-size:13px;color:#555555;text-align:right;">${timestamp}</td>
                      </tr>
                    </table>
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
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">This client has set their password and can now sign in to ORCACLUB Spaces. Reply to this email to reach them at <a href="mailto:${clientEmail}" style="color:#2a6068;text-decoration:none;">${clientEmail}</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  `

  return baseEmailTemplate({ content })
}

export function accountSetupNotificationText({
  clientName,
  clientEmail,
  company,
  timestamp,
}: AccountSetupNotificationData): string {
  const content = `ACCOUNT SETUP NOTIFICATION

${clientName} has completed their account setup.

CLIENT DETAILS
━━━━━━━━━━━━━━━━━━━━
Name: ${clientName}
Email: ${clientEmail}
${company ? `Company: ${company}\n` : ''}Completed: ${timestamp}

This client has set their password and can now sign in to ORCACLUB Spaces.
Reply to this email to reach them at ${clientEmail}.`

  return baseTextTemplate({ content })
}
