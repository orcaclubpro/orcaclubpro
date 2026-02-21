import { baseEmailTemplate, baseTextTemplate } from './base'

export interface ContactConfirmationData {
  name: string
  service: string
  company?: string
  phone?: string
  adminEmail: string
}

export function contactConfirmationHTML(data: ContactConfirmationData): string {
  const { name, service, company, phone, adminEmail } = data
  const firstName = name.split(' ')[0]

  const content = `
          <!-- Eyebrow label -->
          <tr>
            <td style="padding: 0 0 14px 0;">
              <p style="margin: 0; font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase; color: #3a3a3a; font-weight: 400;">Inquiry Received</p>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding: 0 0 4px 0;">
              <p style="margin: 0; font-size: 22px; font-weight: 200; color: #ffffff; letter-spacing: 0.01em; line-height: 1.3;">We've got your message.</p>
            </td>
          </tr>

          <!-- Cyan accent hairline -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 0 12px 0;">
              <p style="margin: 0; font-size: 13px; color: #555555; line-height: 1.7; font-weight: 300;">Hi ${firstName},</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <p style="margin: 0; font-size: 13px; line-height: 1.8; color: #555555; font-weight: 300;">
                We've received your inquiry. Our team will review your request and get back to you within 24 hours.
              </p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding: 16px 20px; background-color: #111111; border: 1px solid #1a1a1a; border-left: 3px solid #67e8f9;">
              <p style="margin: 0 0 12px 0; font-size: 10px; font-weight: 600; color: #3a3a3a; text-transform: uppercase; letter-spacing: 0.35em;">Your Inquiry</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a;">Service</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #555555; text-align: right;">${service}</td>
                </tr>
                ${company ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a;">Company</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #555555; text-align: right;">${company}</td>
                </tr>
                ` : ''}
                ${phone ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a;">Phone</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #555555; text-align: right;">${phone}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Footer Note -->
          <tr>
            <td style="padding: 28px 0 40px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #0f0f0f; padding-top: 24px;">
                    <p style="margin: 0; font-size: 11px; color: #2e2e2e; line-height: 1.7; font-weight: 300;">Questions? Reply to this email or contact <a href="mailto:${adminEmail}" style="color: #2a6068; text-decoration: none;">${adminEmail}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  `

  return baseEmailTemplate({ content })
}

export function contactConfirmationText(data: ContactConfirmationData): string {
  const { name, service, company, phone, adminEmail } = data
  const firstName = name.split(' ')[0]

  const content = `Hi ${firstName},

We've received your inquiry. Our team will review your request and get back to you within 24 hours.

YOUR INQUIRY
━━━━━━━━━━━━━━━━━━━━
Service: ${service}
${company ? `Company: ${company}` : ''}
${phone ? `Phone: ${phone}` : ''}

Questions? Reply to this email or contact ${adminEmail}`

  return baseTextTemplate({ content })
}

export function contactConfirmationSubject(service: string): string {
  return `ORCACLUB | ${service} Inquiry`
}
