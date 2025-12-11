import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { googleCalendar } from "@/lib/google-calendar"

const resend = new Resend(process.env.RESEND_API_KEY)

// Admin email to receive notifications
const ADMIN_EMAIL = "chance@orcaclub.pro"
const FROM_EMAIL = "bookings@orcaclub.pro" // You'll need to verify this domain in Resend

interface BookingFormData {
  name: string
  email: string
  phone: string
  company: string
  service: string
  message: string
  preferredDate: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingFormData = await request.json()

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

    const { name, email, phone, company, service, message, preferredDate } = body

    // Format the preferred date for display
    const formattedDate = preferredDate
      ? new Date(preferredDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not specified"

    // Send confirmation email to the customer
    const customerEmail = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your Consultation Request - ORCACLUB",
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
                          Thank you, ${name.split(' ')[0]}
                        </h2>

                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #e2e8f0; font-weight: 300;">
                          We've received your consultation request and our team is excited to learn more about your project.
                        </p>

                        <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #e2e8f0; font-weight: 300;">
                          You'll hear from us within <strong style="color: #67e8f9; font-weight: 400;">24 hours</strong> to discuss how we can craft a tailored solution for your needs.
                        </p>

                        <!-- Booking Details Card -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0; background: rgba(0, 0, 0, 0.4); border-left: 3px solid #67e8f9; border-radius: 8px;">
                          <tr>
                            <td style="padding: 24px;">
                              <p style="margin: 0 0 16px; font-size: 14px; font-weight: 500; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.1em;">Your Request Details</p>

                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400; width: 35%;">Service</td>
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
                                <tr>
                                  <td style="padding: 8px 0; font-size: 14px; color: #94a3b8; font-weight: 400;">Preferred Date</td>
                                  <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 400;">${formattedDate}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- Next Steps -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0; background: rgba(103, 232, 249, 0.05); border-radius: 8px;">
                          <tr>
                            <td style="padding: 24px;">
                              <p style="margin: 0 0 16px; font-size: 14px; font-weight: 500; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.1em;">What Happens Next</p>

                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="padding: 6px 0;">
                                    <span style="display: inline-block; width: 6px; height: 6px; background-color: #67e8f9; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                    <span style="font-size: 14px; color: #e2e8f0; font-weight: 300;">Our team reviews your project requirements</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0;">
                                    <span style="display: inline-block; width: 6px; height: 6px; background-color: #67e8f9; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                    <span style="font-size: 14px; color: #e2e8f0; font-weight: 300;">We reach out within 24 hours to connect</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0;">
                                    <span style="display: inline-block; width: 6px; height: 6px; background-color: #67e8f9; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                    <span style="font-size: 14px; color: #e2e8f0; font-weight: 300;">Schedule a detailed consultation call</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0;">
                                    <span style="display: inline-block; width: 6px; height: 6px; background-color: #67e8f9; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                    <span style="font-size: 14px; color: #e2e8f0; font-weight: 300;">Begin crafting your tailored solution</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- Contact Note -->
                        <p style="margin: 32px 0 0; font-size: 14px; line-height: 1.6; color: #94a3b8; font-weight: 300;">
                          Have urgent questions? Simply reply to this email or reach us at
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
      text: `ORCACLUB est 2025 - Consultation Request Confirmation

Hi ${name},

Thank you for reaching out to ORCACLUB!

We've received your consultation request and our team is excited to learn more about your project. You'll hear from us within 24 hours to discuss how we can craft a tailored solution for your needs.

YOUR REQUEST DETAILS
━━━━━━━━━━━━━━━━━━━━━━
Service: ${service}
${company ? `Company: ${company}` : ''}
${phone ? `Phone: ${phone}` : ''}
Preferred Date: ${formattedDate}

WHAT HAPPENS NEXT
━━━━━━━━━━━━━━━━━━━━━━
• Our team reviews your project requirements
• We reach out within 24 hours to connect
• Schedule a detailed consultation call
• Begin crafting your tailored solution

━━━━━━━━━━━━━━━━━━━━━━

Have urgent questions? Simply reply to this email or reach us at ${ADMIN_EMAIL}

The ORCACLUB Team
Tailored solutions • Smarter workflows

━━━━━━━━━━━━━━━━━━━━━━
© ${new Date().getFullYear()} ORCACLUB est 2025. All rights reserved.
Visit us: https://orcaclub.pro
`,
    })

    // Admin notification email - DISABLED (you'll see bookings in calendar instead)
    // Uncomment below if you want to receive email notifications for each booking
    /*
    const adminEmail = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: email, // Allow admin to reply directly to the customer
      subject: `New Consultation Request - ${name} - ${service}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="x-apple-disable-message-reformatting">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; background-color: #f8fafc; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

            <!-- Main Container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 650px; margin: 0 auto; background-color: #f8fafc;">

              <!-- Header -->
              <tr>
                <td style="padding: 40px 32px 24px; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
                  <div style="display: inline-block; padding: 12px 24px; background: rgba(103, 232, 249, 0.1); border: 1px solid rgba(103, 232, 249, 0.3); border-radius: 8px;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: 500; letter-spacing: 0.05em; color: #67e8f9; text-transform: uppercase;">
                      New Lead
                    </h1>
                  </div>
                </td>
              </tr>

              <!-- Content Container -->
              <tr>
                <td style="padding: 0 32px 40px; background-color: #f8fafc;">

                  <!-- Alert Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; background: linear-gradient(135deg, #67e8f9 0%, #3b82f6 100%); border-radius: 12px;">
                    <tr>
                      <td style="padding: 20px 24px; text-align: center;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.01em;">
                          ${name}
                        </h2>
                        <p style="margin: 8px 0 0; font-size: 16px; font-weight: 500; color: #0f172a;">
                          ${service}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Contact Card -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                    <tr>
                      <td style="padding: 24px;">
                        <p style="margin: 0 0 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Contact Details</p>

                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 10px 0; font-size: 14px; color: #64748b; font-weight: 500; width: 30%;">Name</td>
                            <td style="padding: 10px 0; font-size: 15px; color: #0f172a; font-weight: 600;">${name}</td>
                          </tr>
                          <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="padding: 10px 0; font-size: 14px; color: #64748b; font-weight: 500;">Email</td>
                            <td style="padding: 10px 0;">
                              <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none; font-size: 15px; font-weight: 500;">${email}</a>
                            </td>
                          </tr>
                          ${phone ? `
                          <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="padding: 10px 0; font-size: 14px; color: #64748b; font-weight: 500;">Phone</td>
                            <td style="padding: 10px 0;">
                              <a href="tel:${phone}" style="color: #3b82f6; text-decoration: none; font-size: 15px; font-weight: 500;">${phone}</a>
                            </td>
                          </tr>
                          ` : ''}
                          ${company ? `
                          <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="padding: 10px 0; font-size: 14px; color: #64748b; font-weight: 500;">Company</td>
                            <td style="padding: 10px 0; font-size: 15px; color: #0f172a; font-weight: 600;">${company}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Project Details Card -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                    <tr>
                      <td style="padding: 24px;">
                        <p style="margin: 0 0 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Project Information</p>

                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 10px 0; font-size: 14px; color: #64748b; font-weight: 500; width: 30%;">Service</td>
                            <td style="padding: 10px 0;">
                              <span style="display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, #67e8f9 0%, #3b82f6 100%); color: #000000; font-size: 13px; font-weight: 600; border-radius: 6px;">${service}</span>
                            </td>
                          </tr>
                          <tr style="border-top: 1px solid #f1f5f9;">
                            <td style="padding: 10px 0; font-size: 14px; color: #64748b; font-weight: 500;">Timeline</td>
                            <td style="padding: 10px 0; font-size: 15px; color: #0f172a; font-weight: 500;">${formattedDate}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Message Card -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                    <tr>
                      <td style="padding: 24px;">
                        <p style="margin: 0 0 12px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Their Message</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #334155; font-weight: 400; white-space: pre-wrap;">${message}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Action Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px;">
                    <tr>
                      <td style="padding: 24px; text-align: center;">
                        <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8; font-weight: 400;">
                          Quick Action
                        </p>
                        <p style="margin: 0; font-size: 15px; color: #67e8f9; font-weight: 500;">
                          Reply directly to this email to reach ${name.split(' ')[0]}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Metadata -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 16px 0; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 400;">
                          Submitted ${new Date().toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })} at ${new Date().toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                        <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e1; font-weight: 300;">
                          ORCACLUB est 2025 • Booking System
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
      text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW CONSULTATION REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}

PROJECT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service: ${service}
Timeline: ${formattedDate}

THEIR MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK ACTION
Reply directly to this email to reach ${name.split(' ')[0]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted: ${new Date().toLocaleString("en-US", {
  dateStyle: "full",
  timeStyle: "short",
})}
`,
    })
    */

    // Check if email was sent successfully
    if (customerEmail.error) {
      console.error("Failed to send customer email:", customerEmail.error)
      throw new Error("Failed to send confirmation email")
    }

    // Create Google Calendar event if preferred date is provided
    let calendarEventLink: string | null = null
    if (preferredDate) {
      try {
        // Parse the preferred date and create start/end times
        const startDate = new Date(preferredDate)

        // Default meeting time: 10:00 AM - 11:00 AM on the selected date
        startDate.setHours(10, 0, 0, 0)
        const endDate = new Date(startDate)
        endDate.setHours(11, 0, 0, 0)

        // Create calendar event with Google Meet link
        calendarEventLink = await googleCalendar.createEvent({
          summary: `ORCACLUB Consultation - ${name}`,
          description: `
Consultation with ${name}${company ? ` from ${company}` : ''}

Service: ${service}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

Project Details:
${message}

---
Booked via ORCACLUB Booking System
          `.trim(),
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          attendeeEmail: email,
          attendeeName: name,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })

        if (calendarEventLink) {
          console.log('Calendar event created successfully:', calendarEventLink)
        }
      } catch (calendarError) {
        console.error('Failed to create calendar event:', calendarError)
        // Don't fail the entire request if calendar creation fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking request submitted successfully",
        customerEmailId: customerEmail.data?.id,
        calendarEventLink,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Booking API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process booking request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
