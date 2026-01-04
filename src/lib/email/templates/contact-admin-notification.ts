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
          <!-- Alert Badge -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <div style="display: inline-block; background-color: #000000; color: #ffffff; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                New Lead
              </div>
            </td>
          </tr>

          <!-- Lead Name -->
          <tr>
            <td style="padding: 0 0 20px 0;">
              <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #000000;">
                ${name}
              </h2>
              <p style="margin: 4px 0 0 0; font-size: 15px; color: #404040;">${service}</p>
            </td>
          </tr>

          <!-- Contact Details -->
          <tr>
            <td style="padding: 20px; background-color: #f5f5f5; border-left: 3px solid #000000; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">Contact Information</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373; width: 30%;">Name</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #000000; text-align: right;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373;">Email</td>
                  <td style="padding: 6px 0; text-align: right;">
                    <a href="mailto:${email}" style="font-size: 14px; color: #000000; text-decoration: underline;">${email}</a>
                  </td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373;">Phone</td>
                  <td style="padding: 6px 0; text-align: right;">
                    <a href="tel:${phone}" style="font-size: 14px; color: #000000; text-decoration: underline;">${phone}</a>
                  </td>
                </tr>
                ` : ''}
                ${company ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373;">Company</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #000000; text-align: right;">${company}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373;">Service</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #000000; text-align: right;">${service}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373;">Submitted</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #000000; text-align: right;">${timestamp} PST</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr>
            <td style="padding: 8px 0;"></td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 20px; background-color: #f5f5f5; border-radius: 4px;">
              <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">Their Message</p>
              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #404040; white-space: pre-wrap;">${message}</p>
            </td>
          </tr>

          <!-- Quick Action -->
          <tr>
            <td style="padding: 24px 0 0 0;">
              <p style="margin: 0; padding: 16px; background-color: #f5f5f5; border-radius: 4px; font-size: 14px; color: #404040;">
                <strong style="color: #000000;">Quick Action:</strong> Reply to this email to contact ${firstName} directly at <a href="mailto:${email}" style="color: #000000; text-decoration: underline;">${email}</a>
              </p>
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
