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
          <!-- Eyebrow label -->
          <tr>
            <td style="padding: 0 0 14px 0;">
              <p style="margin: 0; font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase; color: #3a3a3a; font-weight: 400;">Consultation Request</p>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding: 0 0 4px 0;">
              <p style="margin: 0; font-size: 22px; font-weight: 200; color: #ffffff; letter-spacing: 0.01em; line-height: 1.3;">Request received.</p>
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
                Your consultation request has been received. We'll reach out within 24 hours to confirm your appointment and send calendar details.
              </p>
            </td>
          </tr>

          <!-- Booking Details -->
          <tr>
            <td style="padding: 16px 20px; background-color: #111111; border: 1px solid #1a1a1a; border-left: 3px solid #67e8f9;">
              <p style="margin: 0 0 12px 0; font-size: 10px; font-weight: 600; color: #3a3a3a; text-transform: uppercase; letter-spacing: 0.35em;">Your Request</p>
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
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #3a3a3a;">Requested Time</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #555555; text-align: right;">${formattedDate} at ${formattedTime}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 24px 0 0 0;">
              <p style="margin: 0 0 12px 0; font-size: 10px; font-weight: 600; color: #3a3a3a; text-transform: uppercase; letter-spacing: 0.35em;">What Happens Next</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 4px 0;">
                    <p style="margin: 0; font-size: 13px; color: #555555; font-weight: 300;">• We review your project requirements</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <p style="margin: 0; font-size: 13px; color: #555555; font-weight: 300;">• Confirm your appointment within 24 hours</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <p style="margin: 0; font-size: 13px; color: #555555; font-weight: 300;">• Send calendar invite with meeting link</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <p style="margin: 0; font-size: 13px; color: #555555; font-weight: 300;">• Connect to discuss your project</p>
                  </td>
                </tr>
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
