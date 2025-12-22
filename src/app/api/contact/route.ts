import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getPayload } from "payload"
import config from "@payload-config"
import type { Lead } from "@/types/payload-types"

const resend = new Resend(process.env.RESEND_API_KEY)

// Admin email to receive notifications
const ADMIN_EMAIL = "chance@orcaclub.pro"
const FROM_EMAIL = "bookings@orcaclub.pro" // You'll need to verify this domain in Resend

interface ContactFormData {
  name: string
  email: string
  phone?: string
  company?: string
  service: string
  message: string
}

export async function POST(request: NextRequest) {
  let leadId: string | null = null

  try {
    const body: ContactFormData = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.service || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    const { name, email, phone, company, service, message } = body

    // ==========================================
    // STEP 1: SAVE TO PAYLOADCMS FIRST (CRITICAL)
    // ==========================================
    // This ensures we never lose a lead, even if email fails
    try {
      const payload = await getPayload({ config })

      const lead = await payload.create({
        collection: 'leads' as any,
        data: {
          name,
          email,
          phone: phone || '',
          company: company || '',
          service,
          message,
          status: 'new',
          emailSent: false,
          calendarCreated: false,
        },
      })

      leadId = lead.id
      console.log(`[Contact] Lead created in PayloadCMS: ${leadId}`)
    } catch (payloadError) {
      // CRITICAL: If we can't save to Payload, we should still try to continue
      // but log the error prominently
      console.error('[Contact] CRITICAL: Failed to save lead to PayloadCMS:', payloadError)
      // We'll continue with email, but won't have a leadId to update
    }

    // ==========================================
    // STEP 2: SEND CONFIRMATION EMAIL TO CUSTOMER
    // ==========================================
    const customerEmail = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "We've Received Your Message - ORCACLUB",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="x-apple-disable-message-reformatting">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #000000; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

            <!-- Main Container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #000000;">

              <!-- Header -->
              <tr>
                <td style="padding: 48px 32px 32px; text-align: center; background: linear-gradient(135deg, #000000 0%, #0f172a 100%);">
                  <h1 style="margin: 0; font-size: 36px; font-weight: 300; letter-spacing: 0.05em; color: #ffffff;">
                    ORCA<span style="background: linear-gradient(45deg, #67e8f9, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 400;">CLUB</span>
                  </h1>
                  <p style="margin: 8px 0 0; font-size: 12px; font-weight: 400; letter-spacing: 0.15em; color: #64748b; text-transform: uppercase;">est 2025</p>
                  <div style="margin-top: 16px; height: 1px; width: 60px; background: linear-gradient(90deg, transparent, #67e8f9, transparent); margin-left: auto; margin-right: auto;"></div>
                </td>
              </tr>

              <!-- Content Container -->
              <tr>
                <td style="padding: 0 32px 48px; background-color: #000000;">

                  <!-- Main Content Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(103, 232, 249, 0.15); border-radius: 12px; backdrop-filter: blur(20px);">
                    <tr>
                      <td style="padding: 40px 32px;">

                        <!-- Greeting -->
                        <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 300; color: #ffffff; letter-spacing: -0.01em;">
                          Thanks for reaching out, ${name.split(' ')[0]}
                        </h2>

                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #e2e8f0; font-weight: 300;">
                          We've received your message and appreciate you taking the time to connect with us.
                        </p>

                        <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #e2e8f0; font-weight: 300;">
                          Our team will review your inquiry and get back to you within <strong style="color: #67e8f9; font-weight: 400;">24 hours</strong> to discuss how we can help.
                        </p>

                        <!-- Contact Details Card -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0; background: rgba(0, 0, 0, 0.4); border-left: 3px solid #67e8f9; border-radius: 8px;">
                          <tr>
                            <td style="padding: 24px;">
                              <p style="margin: 0 0 16px; font-size: 14px; font-weight: 500; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.1em;">Your Inquiry Details</p>

                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400; width: 35%;">Service Interest</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 400;">${service}</td>
                                </tr>
                                ${company ? `
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400;">Company</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 400;">${company}</td>
                                </tr>
                                ` : ''}
                                ${phone ? `
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400;">Phone</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 400;">${phone}</td>
                                </tr>
                                ` : ''}
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- What Happens Next -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0; background: rgba(103, 232, 249, 0.05); border-radius: 8px;">
                          <tr>
                            <td style="padding: 24px;">
                              <p style="margin: 0 0 16px; font-size: 14px; font-weight: 500; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.1em;">What Happens Next</p>

                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="padding: 6px 0;">
                                    <span style="display: inline-block; width: 6px; height: 6px; background-color: #67e8f9; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                    <span style="font-size: 14px; color: #e2e8f0; font-weight: 300;">Our team reviews your inquiry</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0;">
                                    <span style="display: inline-block; width: 6px; height: 6px; background-color: #67e8f9; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                    <span style="font-size: 14px; color: #e2e8f0; font-weight: 300;">We reach out within 24 hours</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0;">
                                    <span style="display: inline-block; width: 6px; height: 6px; background-color: #67e8f9; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                    <span style="font-size: 14px; color: #e2e8f0; font-weight: 300;">Schedule a call if it's a good fit</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0;">
                                    <span style="display: inline-block; width: 6px; height: 6px; background-color: #67e8f9; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                    <span style="font-size: 14px; color: #e2e8f0; font-weight: 300;">Start crafting your solution</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- Contact Note -->
                        <p style="margin: 32px 0 0; font-size: 14px; line-height: 1.6; color: #94a3b8; font-weight: 300;">
                          Need to add more details? Simply reply to this email or reach us directly at
                          <a href="mailto:${ADMIN_EMAIL}" style="color: #67e8f9; text-decoration: none; font-weight: 400;">${ADMIN_EMAIL}</a>
                        </p>

                        <!-- Signature -->
                        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(103, 232, 249, 0.1);">
                          <p style="margin: 0 0 4px; font-size: 15px; color: #e2e8f0; font-weight: 300;">
                            The ORCACLUB Team
                          </p>
                          <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 300; font-style: italic;">
                            Tailored solutions • Smarter workflows
                          </p>
                        </div>

                      </td>
                    </tr>
                  </table>

                  <!-- Footer -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                    <tr>
                      <td style="text-align: center; padding: 24px 0;">
                        <p style="margin: 0 0 12px; font-size: 13px; color: #475569; font-weight: 300;">
                          © ${new Date().getFullYear()} ORCACLUB est 2025. All rights reserved.
                        </p>
                        <p style="margin: 0;">
                          <a href="https://orcaclub.pro" style="color: #67e8f9; text-decoration: none; font-size: 13px; font-weight: 300;">orcaclub.pro</a>
                          <span style="color: #334155; margin: 0 8px;">•</span>
                          <a href="https://orcaclub.pro/services" style="color: #67e8f9; text-decoration: none; font-size: 13px; font-weight: 300;">Our Services</a>
                          <span style="color: #334155; margin: 0 8px;">•</span>
                          <a href="https://orcaclub.pro/portfolio" style="color: #67e8f9; text-decoration: none; font-size: 13px; font-weight: 300;">Portfolio</a>
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

          </body>
        </html>
      `,
      text: `ORCACLUB est 2025 - Contact Form Confirmation

Hi ${name},

Thank you for reaching out to ORCACLUB!

We've received your message and appreciate you taking the time to connect with us. Our team will review your inquiry and get back to you within 24 hours to discuss how we can help.

YOUR INQUIRY DETAILS
━━━━━━━━━━━━━━━━━━━━━━
Service Interest: ${service}
${company ? `Company: ${company}` : ''}
${phone ? `Phone: ${phone}` : ''}

WHAT HAPPENS NEXT
━━━━━━━━━━━━━━━━━━━━━━
• Our team reviews your inquiry
• We reach out within 24 hours
• Schedule a call if it's a good fit
• Start crafting your solution

━━━━━━━━━━━━━━━━━━━━━━

Need to add more details? Simply reply to this email or reach us directly at ${ADMIN_EMAIL}

The ORCACLUB Team
Tailored solutions • Smarter workflows

━━━━━━━━━━━━━━━━━━━━━━
© ${new Date().getFullYear()} ORCACLUB est 2025. All rights reserved.
Visit us: https://orcaclub.pro
`,
    })

    // Check if email was sent successfully
    let emailSent = false
    if (customerEmail.error) {
      console.error("[Contact] Failed to send customer email:", customerEmail.error)
      // Don't throw - we already saved the lead
    } else {
      emailSent = true
      console.log(`[Contact] Email sent successfully: ${customerEmail.data?.id}`)

      // Update lead with email status
      if (leadId) {
        try {
          const payload = await getPayload({ config })
          await payload.update({
            collection: 'leads' as any,
            id: leadId,
            data: {
              emailSent: true,
            },
          })
        } catch (updateError) {
          console.error('[Contact] Failed to update lead email status:', updateError)
        }
      }
    }

    // ==========================================
    // STEP 3: SEND ADMIN NOTIFICATION EMAIL
    // ==========================================
    // Send branded notification to admin about new contact inquiry
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        replyTo: email, // Allow admin to reply directly to customer
        subject: `New Contact Inquiry - ${name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta name="x-apple-disable-message-reformatting">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #000000; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

              <!-- Main Container -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #000000;">

                <!-- Header -->
                <tr>
                  <td style="padding: 48px 32px 32px; text-align: center; background: linear-gradient(135deg, #000000 0%, #0f172a 100%);">
                    <h1 style="margin: 0; font-size: 36px; font-weight: 300; letter-spacing: 0.05em; color: #ffffff;">
                      ORCA<span style="background: linear-gradient(45deg, #67e8f9, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 400;">CLUB</span>
                    </h1>
                    <p style="margin: 8px 0 0; font-size: 12px; font-weight: 400; letter-spacing: 0.15em; color: #64748b; text-transform: uppercase;">est 2025</p>
                    <div style="margin-top: 16px; height: 1px; width: 60px; background: linear-gradient(90deg, transparent, #67e8f9, transparent); margin-left: auto; margin-right: auto;"></div>
                  </td>
                </tr>

                <!-- Content Container -->
                <tr>
                  <td style="padding: 0 32px 48px; background-color: #000000;">

                    <!-- Main Content Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(103, 232, 249, 0.15); border-radius: 12px; backdrop-filter: blur(20px);">
                      <tr>
                        <td style="padding: 40px 32px;">

                          <!-- Alert Badge -->
                          <div style="display: inline-block; background: linear-gradient(135deg, #67e8f9 0%, #3b82f6 100%); padding: 8px 16px; border-radius: 20px; margin-bottom: 24px;">
                            <p style="margin: 0; font-size: 13px; font-weight: 500; color: #000000; text-transform: uppercase; letter-spacing: 0.1em;">🔔 New Contact Inquiry</p>
                          </div>

                          <!-- Greeting -->
                          <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 300; color: #ffffff; letter-spacing: -0.01em;">
                            New inquiry from ${name}
                          </h2>

                          <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #e2e8f0; font-weight: 300;">
                            A potential client has reached out through the contact form. Review their details below and respond within 24 hours.
                          </p>

                          <!-- Contact Details Card -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0; background: rgba(0, 0, 0, 0.4); border-left: 3px solid #67e8f9; border-radius: 8px;">
                            <tr>
                              <td style="padding: 24px;">
                                <p style="margin: 0 0 16px; font-size: 14px; font-weight: 500; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.1em;">Contact Information</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                  <tr>
                                    <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400; width: 35%;">Name</td>
                                    <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 400;">${name}</td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400;">Email</td>
                                    <td style="padding: 8px 0;">
                                      <a href="mailto:${email}" style="font-size: 14px; color: #67e8f9; text-decoration: none; font-weight: 400;">${email}</a>
                                    </td>
                                  </tr>
                                  ${phone ? `
                                  <tr>
                                    <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400;">Phone</td>
                                    <td style="padding: 8px 0;">
                                      <a href="tel:${phone}" style="font-size: 14px; color: #67e8f9; text-decoration: none; font-weight: 400;">${phone}</a>
                                    </td>
                                  </tr>
                                  ` : ''}
                                  ${company ? `
                                  <tr>
                                    <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400;">Company</td>
                                    <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 400;">${company}</td>
                                  </tr>
                                  ` : ''}
                                  <tr>
                                    <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400;">Service Interest</td>
                                    <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 400;">${service}</td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400;">Submitted</td>
                                    <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 400;">${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })} PST</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Message Card -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0; background: rgba(103, 232, 249, 0.05); border-radius: 8px; border: 1px solid rgba(103, 232, 249, 0.1);">
                            <tr>
                              <td style="padding: 24px;">
                                <p style="margin: 0 0 16px; font-size: 14px; font-weight: 500; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.1em;">Their Message</p>
                                <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #e2e8f0; font-weight: 300; white-space: pre-wrap;">${message}</p>
                              </td>
                            </tr>
                          </table>

                          <!-- Quick Action -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0; background: rgba(103, 232, 249, 0.08); border-radius: 8px;">
                            <tr>
                              <td style="padding: 20px 24px;">
                                <p style="margin: 0; font-size: 14px; color: #e2e8f0; font-weight: 300;">
                                  <span style="font-weight: 500; color: #67e8f9;">💡 Quick Action:</span> Simply reply to this email to contact ${name.split(' ')[0]} directly. Your response will be sent to <span style="color: #67e8f9;">${email}</span>
                                </p>
                              </td>
                            </tr>
                          </table>

                          <!-- Signature -->
                          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(103, 232, 249, 0.1);">
                            <p style="margin: 0 0 4px; font-size: 15px; color: #e2e8f0; font-weight: 300;">
                              Admin Notification System
                            </p>
                            <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 300; font-style: italic;">
                              Automated notification • Respond promptly
                            </p>
                          </div>

                        </td>
                      </tr>
                    </table>

                    <!-- Footer -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                      <tr>
                        <td style="text-align: center; padding: 24px 0;">
                          <p style="margin: 0 0 12px; font-size: 13px; color: #475569; font-weight: 300;">
                            © ${new Date().getFullYear()} ORCACLUB est 2025. All rights reserved.
                          </p>
                          <p style="margin: 0;">
                            <a href="https://orcaclub.pro/admin" style="color: #67e8f9; text-decoration: none; font-size: 13px; font-weight: 300;">Admin Dashboard</a>
                            <span style="color: #334155; margin: 0 8px;">•</span>
                            <a href="https://orcaclub.pro" style="color: #67e8f9; text-decoration: none; font-size: 13px; font-weight: 300;">Visit Site</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </body>
          </html>
        `,
        text: `ORCACLUB est 2025 - Admin Notification

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 NEW CONTACT INQUIRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A potential client has reached out through the contact form. Review their details below and respond within 24 hours.

CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}
Service Interest: ${service}
Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })} PST

THEIR MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Quick Action: Simply reply to this email to contact ${name.split(' ')[0]} directly. Your response will be sent to ${email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin Notification System
Automated notification • Respond promptly

© ${new Date().getFullYear()} ORCACLUB est 2025. All rights reserved.
`,
      })

      console.log(`[Contact] Admin notification sent to ${ADMIN_EMAIL}`)
    } catch (adminEmailError) {
      // Don't fail the request if admin email fails
      console.error('[Contact] Failed to send admin notification:', adminEmailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Contact form submitted successfully",
        leadId,
        customerEmailId: customerEmail.data?.id,
        emailSent,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Contact] API error:", error)

    // If we have a leadId, the lead was saved even though something else failed
    if (leadId) {
      console.log(`[Contact] Lead ${leadId} was saved to PayloadCMS despite error`)
    }

    return NextResponse.json(
      {
        error: "Failed to process contact form",
        details: error instanceof Error ? error.message : "Unknown error",
        leadId, // Include leadId so admin knows it was saved
      },
      { status: 500 }
    )
  }
}
