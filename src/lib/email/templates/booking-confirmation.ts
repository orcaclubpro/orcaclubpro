import { baseEmailTemplate, baseTextTemplate } from './base'

export interface BookingConfirmationData {
  name: string
  service: string
  company?: string
  phone?: string
  formattedDate: string
  formattedTime: string
  adminEmail: string
}

export function bookingConfirmationHTML(data: BookingConfirmationData): string {
  const { name, service, company, phone, formattedDate, formattedTime, adminEmail } = data
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
                Your consultation request has been received. We'll reach out within 24 hours to confirm your appointment and send calendar details.
              </p>
            </td>
          </tr>

          <!-- Booking Details -->
          <tr>
            <td style="padding: 20px; background-color: #f5f5f5; border-left: 3px solid #000000; border-radius: 4px;">
              <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">Your Request</p>
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
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #737373;">Requested Time</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #000000; text-align: right;">${formattedDate} at ${formattedTime}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 20px 0 0 0;">
              <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">What Happens Next</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 4px 0;">
                    <p style="margin: 0; font-size: 14px; color: #404040;">• We review your project requirements</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <p style="margin: 0; font-size: 14px; color: #404040;">• Confirm your appointment within 24 hours</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <p style="margin: 0; font-size: 14px; color: #404040;">• Send calendar invite with meeting link</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <p style="margin: 0; font-size: 14px; color: #404040;">• Connect to discuss your project</p>
                  </td>
                </tr>
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

export function bookingConfirmationText(data: BookingConfirmationData): string {
  const { name, service, company, phone, formattedDate, formattedTime, adminEmail } = data
  const firstName = name.split(' ')[0]

  const content = `Hi ${firstName},

Your consultation request has been received. We'll reach out within 24 hours to confirm your appointment and send calendar details.

YOUR REQUEST
━━━━━━━━━━━━━━━━━━━━
Service: ${service}
${company ? `Company: ${company}` : ''}
${phone ? `Phone: ${phone}` : ''}
Requested Time: ${formattedDate} at ${formattedTime}

WHAT HAPPENS NEXT
━━━━━━━━━━━━━━━━━━━━
• We review your project requirements
• Confirm your appointment within 24 hours
• Send calendar invite with meeting link
• Connect to discuss your project

Questions? Reply to this email or contact ${adminEmail}`

  return baseTextTemplate({ content })
}

export function bookingConfirmationSubject(service: string): string {
  return `ORCACLUB | ${service} Consultation Request`
}
