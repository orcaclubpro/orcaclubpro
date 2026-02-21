import { baseEmailTemplate, baseTextTemplate } from './base'

export interface ContactAdminNotificationData {
  name: string
  email: string
  service: string
  message: string
  company?: string
  phone?: string
}

export function contactAdminNotificationHTML(data: ContactAdminNotificationData): string {
  const { name, email, service, message, company, phone } = data
  const firstName = name.split(' ')[0]
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  const content = `
          <!-- Eyebrow label -->
          <tr>
            <td style="padding: 0 0 14px 0;">
              <p style="margin: 0; font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase; color: #3a3a3a; font-weight: 400;">Inbound Lead</p>
            </td>
          </tr>

          <!-- Alert Badge + Heading -->
          <tr>
            <td style="padding: 0 0 4px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: #67e8f9; padding: 4px 10px; vertical-align: middle;">
                    <span style="font-size: 10px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.12em;">New Lead</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Lead Name -->
          <tr>
            <td style="padding: 12px 0 4px 0;">
              <p style="margin: 0; font-size: 22px; font-weight: 200; color: #ffffff; letter-spacing: 0.01em; line-height: 1.3;">${name}</p>
            </td>
          </tr>

          <!-- Service label -->
          <tr>
            <td style="padding: 0 0 4px 0;">
              <p style="margin: 0; font-size: 13px; color: #555555; font-weight: 300;">${service}</p>
            </td>
          </tr>

          <!-- Cyan accent hairline -->
          <tr>
            <td style="padding: 0 0 28px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact Details -->
          <tr>
            <td style="padding: 16px 20px; background-color: #111111; border: 1px solid #1a1a1a; border-left: 3px solid #67e8f9;">
              <p style="margin: 0 0 12px 0; font-size: 10px; font-weight: 600; color: #3a3a3a; text-transform: uppercase; letter-spacing: 0.35em;">Contact Information</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a; width: 30%;">Name</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #555555; text-align: right;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a;">Email</td>
                  <td style="padding: 6px 0; text-align: right;">
                    <a href="mailto:${email}" style="font-size: 13px; color: #555555; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a;">Phone</td>
                  <td style="padding: 6px 0; text-align: right;">
                    <a href="tel:${phone}" style="font-size: 13px; color: #555555; text-decoration: none;">${phone}</a>
                  </td>
                </tr>
                ` : ''}
                ${company ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a;">Company</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #555555; text-align: right;">${company}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a;">Service</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #555555; text-align: right;">${service}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a;">Submitted</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #555555; text-align: right;">${timestamp} PST</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr>
            <td style="padding: 12px 0;"></td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 16px 20px; background-color: #111111; border: 1px solid #1a1a1a;">
              <p style="margin: 0 0 12px 0; font-size: 10px; font-weight: 600; color: #3a3a3a; text-transform: uppercase; letter-spacing: 0.35em;">Their Message</p>
              <p style="margin: 0; font-size: 13px; line-height: 1.8; color: #555555; white-space: pre-wrap; font-weight: 300;">${message}</p>
            </td>
          </tr>

          <!-- Quick Action -->
          <tr>
            <td style="padding: 28px 0 40px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #0f0f0f; padding-top: 24px;">
                    <p style="margin: 0; font-size: 11px; color: #2e2e2e; line-height: 1.7; font-weight: 300;"><span style="color: #555555; font-weight: 400;">Quick Action:</span> Reply to this email to contact ${firstName} directly at <a href="mailto:${email}" style="color: #2a6068; text-decoration: none;">${email}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  `

  return baseEmailTemplate({ content })
}

export function contactAdminNotificationText(data: ContactAdminNotificationData): string {
  const { name, email, service, message, company, phone } = data
  const firstName = name.split(' ')[0]
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  const content = `🔔 NEW LEAD

${name}
${service}

CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}
Service: ${service}
Submitted: ${timestamp} PST

THEIR MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick Action: Reply to this email to contact ${firstName} directly at ${email}`

  return baseTextTemplate({ content })
}

export function contactAdminNotificationSubject(name: string): string {
  return `ORCACLUB | New Lead - ${name}`
}
