import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@payload-config"
import type { Lead } from "@/types/payload-types"
import { createCustomerSafely } from "@/lib/shopify/customers"
import { contactConfirmation, contactAdminNotification } from "@/lib/email/templates"

// Admin email to receive notifications
const ADMIN_EMAIL = "chance@orcaclub.pro"
const FROM_EMAIL = `"ORCACLUB" <${process.env.EMAIL_FROM || "chance@orcaclub.pro"}>`

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
          console.log(`[Contact] Shopify customer created: ${shopifyCustomerId}`)

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
            console.error('[Contact] Failed to update lead with Shopify customer ID:', updateError)
          }
        } else if (shopifyResult.isDuplicate) {
          // Customer already exists - this is fine, just log it
          console.log(`[Contact] Shopify customer already exists for ${email}`)

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
            console.error('[Contact] Failed to update lead notes:', updateError)
          }
        } else {
          // Creation failed - log but don't fail the request
          console.error('[Contact] Shopify customer creation failed:', shopifyResult.error)

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
            console.error('[Contact] Failed to update lead notes:', updateError)
          }
        }
      } catch (shopifyError) {
        // Catch any unexpected errors - don't fail the request
        console.error('[Contact] Unexpected Shopify error:', shopifyError)
      }
    }

    // ==========================================
    // STEP 2: SEND CONFIRMATION EMAIL TO CUSTOMER
    // ==========================================
    const payload = await getPayload({ config })

    try {
      const customerEmailTemplate = contactConfirmation({
        name,
        service,
        company,
        phone,
        adminEmail: ADMIN_EMAIL,
      })

      await payload.sendEmail({
        from: FROM_EMAIL,
        to: email,
        subject: customerEmailTemplate.subject,
        html: customerEmailTemplate.html,
        text: customerEmailTemplate.text,
      })

      // Email sent successfully
      console.log('[Contact] Customer confirmation email sent successfully')

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
    } catch (emailError) {
      console.error("[Contact] Failed to send customer email:", emailError)
      // Don't throw - we already saved the lead
    }

    // ==========================================
    // STEP 3: SEND ADMIN NOTIFICATION EMAIL
    // ==========================================
    // Send branded notification to admin about new contact inquiry
    try {
      const payload = await getPayload({ config })
      const adminEmailTemplate = contactAdminNotification({
        name,
        email,
        service,
        message,
        company,
        phone,
      })

      await payload.sendEmail({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        replyTo: email, // Allow admin to reply directly to customer
        subject: adminEmailTemplate.subject,
        html: adminEmailTemplate.html,
        text: adminEmailTemplate.text,
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
