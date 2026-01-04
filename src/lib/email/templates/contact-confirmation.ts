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
          <!-- Greeting -->
          <tr>
            <td style="padding: 0 0 20px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #000000;">
                Hi ${firstName},
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 0 0 20px 0;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #404040;">
                We've received your inquiry. Our team will review your request and get back to you within 24 hours.
              </p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding: 20px; background-color: #f5f5f5; border-left: 3px solid #000000; border-radius: 4px;">
              <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">Your Inquiry</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373;">Service</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #000000; text-align: right;">${service}</td>
                </tr>
                ${company ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373;">Company</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #000000; text-align: right;">${company}</td>
                </tr>
                ` : ''}
                ${phone ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373;">Phone</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #000000; text-align: right;">${phone}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Footer Note -->
          <tr>
            <td style="padding: 24px 0 0 0;">
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #737373;">
                Questions? Reply to this email or contact <a href="mailto:${adminEmail}" style="color: #000000; text-decoration: underline;">${adminEmail}</a>
              </p>
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
