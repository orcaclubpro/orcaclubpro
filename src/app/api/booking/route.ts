import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { googleCalendar } from "@/lib/google-calendar"
import { getPayload } from "payload"
import config from "@payload-config"
import type { Lead } from "@/types/payload-types"
import { createCustomerSafely } from "@/lib/shopify/customers"
import { bookingConfirmation } from "@/lib/email/templates"

const resend = new Resend(process.env.RESEND_API_KEY)

// Admin email to receive notifications
const ADMIN_EMAIL = "chance@orcaclub.pro"
const FROM_EMAIL = `"ORCACLUB" <${process.env.EMAIL_FROM || "chance@orcaclub.pro"}>`

interface BookingFormData {
  name: string
  email: string
  phone: string
  company: string
  service: string
  message: string
  preferredDate: string
  preferredTime: string
}

export async function POST(request: NextRequest) {
  let leadId: string | null = null

  try {
    const body: BookingFormData = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.service || !body.message || !body.preferredDate || !body.preferredTime) {
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

    const { name, email, phone, company, service, message, preferredDate, preferredTime } = body

    // ==========================================
    // STEP 1: SAVE TO PAYLOADCMS FIRST (CRITICAL)
    // ==========================================
    // This ensures we never lose a lead, even if email/calendar fails
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
          preferredDate,
          preferredTime,
          status: 'new',
          emailSent: false,
          calendarCreated: false,
        },
      })

      leadId = lead.id
      console.log(`[Booking] Lead created in PayloadCMS: ${leadId}`)
    } catch (payloadError) {
      // CRITICAL: If we can't save to Payload, we should still try to continue
      // but log the error prominently
      console.error('[Booking] CRITICAL: Failed to save lead to PayloadCMS:', payloadError)
      // We'll continue with email/calendar, but won't have a leadId to update
    }

    // ==========================================
    // STEP 1.5: CREATE SHOPIFY CUSTOMER
    // ==========================================
    // This creates a customer account in Shopify for future marketing/commerce
    let shopifyCustomerId: string | null = null
    if (leadId) {
      try {
        const shopifyResult = await createCustomerSafely({
          name,
          email,
          phone,
          acceptsMarketing: true,
        })

        if (shopifyResult.success && shopifyResult.customerId) {
          shopifyCustomerId = shopifyResult.customerId
          console.log(`[Booking] Shopify customer created: ${shopifyCustomerId}`)

          // Update PayloadCMS lead with Shopify customer ID
          try {
            const payload = await getPayload({ config })
            await payload.update({
              collection: 'leads' as any,
              id: leadId,
              data: {
                shopifyCustomerId,
                shopifyPasswordGenerated: true,
              },
            })
          } catch (updateError) {
            console.error('[Booking] Failed to update lead with Shopify customer ID:', updateError)
          }
        } else if (shopifyResult.isDuplicate) {
          // Customer already exists - this is fine, just log it
          console.log(`[Booking] Shopify customer already exists for ${email}`)

          try {
            const payload = await getPayload({ config })
            await payload.update({
              collection: 'leads' as any,
              id: leadId,
              data: {
                notes: `Shopify: Customer already exists (${email})`,
              },
            })
          } catch (updateError) {
            console.error('[Booking] Failed to update lead notes:', updateError)
          }
        } else {
          // Creation failed - log but don't fail the request
          console.error('[Booking] Shopify customer creation failed:', shopifyResult.error)

          try {
            const payload = await getPayload({ config })
            await payload.update({
              collection: 'leads' as any,
              id: leadId,
              data: {
                notes: `Shopify: Failed to create customer - ${shopifyResult.error}`,
              },
            })
          } catch (updateError) {
            console.error('[Booking] Failed to update lead notes:', updateError)
          }
        }
      } catch (shopifyError) {
        // Catch any unexpected errors - don't fail the request
        console.error('[Booking] Unexpected Shopify error:', shopifyError)
      }
    }

    // Format the preferred date and time for display
    const formattedDate = preferredDate
      ? new Date(preferredDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not specified"

    const formattedTime = preferredTime
      ? new Date(preferredTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/Los_Angeles",
        })
      : "Not specified"

    // Send confirmation email to the customer
    const bookingEmailTemplate = bookingConfirmation({
      name,
      service,
      company,
      phone,
      formattedDate,
      formattedTime,
      adminEmail: ADMIN_EMAIL,
    })

    const customerEmail = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: bookingEmailTemplate.subject,
      html: bookingEmailTemplate.html,
      text: bookingEmailTemplate.text,
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
                            <td style="padding: 10px 0; font-size: 14px; color: #64748b; font-weight: 500;">Scheduled</td>
                            <td style="padding: 10px 0; font-size: 15px; color: #0f172a; font-weight: 500;">${formattedDate} at ${formattedTime}</td>
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
Scheduled: ${formattedDate} at ${formattedTime}

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
    let emailSent = false
    if (customerEmail.error) {
      console.error("[Booking] Failed to send customer email:", customerEmail.error)
      // Don't throw - we already saved the lead, continue with calendar
    } else {
      emailSent = true
      console.log(`[Booking] Email sent successfully: ${customerEmail.data?.id}`)

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
          console.error('[Booking] Failed to update lead email status:', updateError)
        }
      }
    }

    // Create Google Calendar event with selected date and time
    let calendarEventLink: string | null = null
    let calendarCreated = false
    if (preferredDate && preferredTime) {
      try {
        // Parse the selected date and time
        const startDate = new Date(preferredTime)

        // Create end time (1 hour after start)
        const endDate = new Date(startDate)
        endDate.setHours(startDate.getHours() + 1)

        // Verify the time slot is still available (prevent double booking)
        const isAvailable = await googleCalendar.isTimeSlotAvailable(
          startDate.toISOString(),
          endDate.toISOString()
        )

        if (!isAvailable) {
          // Update lead with failure reason
          if (leadId) {
            try {
              const payload = await getPayload({ config })
              await payload.update({
                collection: 'leads' as any,
                id: leadId,
                data: {
                  notes: 'Time slot was no longer available at booking time',
                },
              })
            } catch (updateError) {
              console.error('[Booking] Failed to update lead notes:', updateError)
            }
          }

          return NextResponse.json(
            {
              error: "Time slot no longer available",
              details: "This time slot was just booked. Please select another time.",
              leadId, // Still return leadId so we know it was saved
            },
            { status: 409 }
          )
        }

        // Create calendar event with Google Meet link
        calendarEventLink = await googleCalendar.createEvent({
          summary: `ORCACLUB Consultation Invite`,
          description: `
Consultation with ${name}${company ? ` from ${company}` : ''}

Service: ${service}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

Project Details:
${message}

---
Booked via ORCACLUB Booking System
Lead ID: ${leadId || 'N/A'}
          `.trim(),
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          attendeeEmail: email,
          attendeeName: name,
          timeZone: 'America/Los_Angeles',
        })

        if (calendarEventLink) {
          calendarCreated = true
          console.log('[Booking] Calendar event created successfully:', calendarEventLink)

          // Update lead with calendar status
          if (leadId) {
            try {
              const payload = await getPayload({ config })
              await payload.update({
                collection: 'leads' as any,
                id: leadId,
                data: {
                  calendarCreated: true,
                  calendarEventLink,
                  status: 'scheduled' as any, // Update status to scheduled
                },
              })
            } catch (updateError) {
              console.error('[Booking] Failed to update lead calendar status:', updateError)
            }
          }
        }
      } catch (calendarError) {
        console.error('[Booking] Failed to create calendar event:', calendarError)
        // Don't fail the entire request if calendar creation fails
        // Lead is already saved in PayloadCMS
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking request submitted successfully",
        leadId,
        customerEmailId: customerEmail.data?.id,
        calendarEventLink,
        emailSent,
        calendarCreated,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Booking] API error:", error)

    // If we have a leadId, the lead was saved even though something else failed
    if (leadId) {
      console.log(`[Booking] Lead ${leadId} was saved to PayloadCMS despite error`)
    }

    return NextResponse.json(
      {
        error: "Failed to process booking request",
        details: error instanceof Error ? error.message : "Unknown error",
        leadId, // Include leadId so admin knows it was saved
      },
      { status: 500 }
    )
  }
}
