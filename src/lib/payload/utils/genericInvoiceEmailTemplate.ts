/**
 * Generic Invoice Email Template
 * Generates a clean, branded HTML email for Stripe invoices
 * Follows ORCACLUB email template patterns with dark theme and gradient branding
 */

import type { Payload } from 'payload'

interface OrderLineItem {
  title: string
  quantity: number
  price: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

interface GenericInvoiceEmailData {
  orderNumber: string
  customerName?: string
  customerEmail: string
  lineItems: OrderLineItem[]
  totalAmount: number
  // Optional Stripe payment URL
  stripeInvoiceUrl?: string
}

/**
 * Generate HTML email template for generic invoice
 */
export function generateGenericInvoiceEmail(order: GenericInvoiceEmailData): string {
  // Calculate subtotal from line items
  const subtotal = order.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Determine payment URL and CTA text
  const paymentUrl = order.stripeInvoiceUrl || '#'
  const ctaText = order.stripeInvoiceUrl ? 'View Invoice & Pay' : 'View Order Details'

  const lineItemsHtml = order.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #1a1a1a;">
        <div style="color: #555555; font-size: 13px; font-weight: 300;">${item.title}</div>
        ${
          item.isRecurring
            ? `<div style="color: #3a3a3a; font-size: 11px; margin-top: 4px; font-weight: 300; letter-spacing: 0.02em;">Recurring (${item.recurringInterval}ly)</div>`
            : ''
        }
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #1a1a1a; text-align: center; color: #3a3a3a; font-size: 13px;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #1a1a1a; text-align: right; color: #555555; font-size: 13px; font-weight: 300;">
        $${item.price.toFixed(2)}${item.isRecurring ? `<span style="color: #3a3a3a; font-size: 11px;">/${item.recurringInterval}</span>` : ''}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #1a1a1a; text-align: right; color: #555555; font-size: 13px; font-weight: 300;">
        $${(item.price * item.quantity).toFixed(2)}${item.isRecurring ? `<span style="color: #3a3a3a; font-size: 11px;">/${item.recurringInterval}</span>` : ''}
      </td>
    </tr>
  `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:560px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header: wordmark -->
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Invoice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 0 40px;">

              <!-- Eyebrow label -->
              <p style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Order Invoice</p>

              <!-- Heading -->
              <p style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Invoice for Order #${order.orderNumber}</p>

              <!-- Cyan accent hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>

              <!-- Body copy -->
              <p style="margin:32px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Thank you for your business${order.customerName ? `, ${order.customerName}` : ''}. Your invoice is ready${paymentUrl !== '#' ? ' for payment' : ''}.</p>

              <!-- Order number detail box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;">
                <tr>
                  <td style="background-color:#111111;border:1px solid #1a1a1a;padding:16px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Order Number</td>
                        <td style="text-align:right;font-size:13px;color:#67e8f9;font-weight:600;letter-spacing:0.05em;">${order.orderNumber}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Order Details Card -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#111111;border:1px solid #1a1a1a;">
                <tr>
                  <td style="padding:20px 20px 0 20px;">

                    <!-- Line Items Table -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                      <thead>
                        <tr>
                          <th style="text-align:left;font-size:10px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;">Item</th>
                          <th style="text-align:center;font-size:10px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:50px;">Qty</th>
                          <th style="text-align:right;font-size:10px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:80px;">Price</th>
                          <th style="text-align:right;font-size:10px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:80px;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lineItemsHtml}
                      </tbody>
                    </table>

                  </td>
                </tr>

                <!-- Order Total row -->
                <tr>
                  <td style="padding:16px 20px;border-top:1px solid #1a1a1a;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Total Amount</td>
                        <td style="text-align:right;font-size:18px;font-weight:700;color:#67e8f9;">${'$'}${order.totalAmount.toFixed(2)} <span style="font-size:11px;font-weight:400;color:#3a3a3a;">USD</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- CTA Button (only if payment URL exists) -->
          ${
            paymentUrl !== '#'
              ? `
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${paymentUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">${ctaText}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Footer note -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Questions about your invoice? Reply to this email or visit <a href="https://orcaclub.pro" style="color:#2a6068;text-decoration:none;">orcaclub.pro</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer bar -->
          <tr>
            <td style="padding:18px 40px;border-top:1px solid #0a0a0a;background-color:#050505;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1f1f1f;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1a3a3e;">CLUB</span>
                  </td>
                  <td align="right">
                    <a href="https://orcaclub.pro" style="font-size:10px;color:#1f1f1f;text-decoration:none;font-weight:300;letter-spacing:0.02em;">orcaclub.pro</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

/**
 * Generate plain text version of invoice email
 */
export function generateGenericInvoiceEmailText(order: GenericInvoiceEmailData): string {
  const lineItemsText = order.lineItems
    .map((item) => {
      const recurringLabel = item.isRecurring ? ` (${item.recurringInterval}ly subscription)` : ''
      const itemTotal = item.price * item.quantity
      return `  - ${item.title}${recurringLabel}\n    Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${itemTotal.toFixed(2)}`
    })
    .join('\n\n')

  // Get payment URL
  const paymentUrl = order.stripeInvoiceUrl || ''

  return `
ORCACLUB - Invoice for Order #${order.orderNumber}

Hello${order.customerName ? ` ${order.customerName}` : ''},

Thank you for your business. Your invoice is ready${paymentUrl ? ' for payment' : ''}.

Order Number: ${order.orderNumber}

ORDER DETAILS:
${lineItemsText}

TOTAL: $${order.totalAmount.toFixed(2)} USD

---
${paymentUrl ? `\nComplete your payment:\n${paymentUrl}\n\n` : ''}
Questions? Reply to this email or visit https://orcaclub.pro

---
© 2025 ORCACLUB. Technical Operations Development Studio.
  `.trim()
}

/**
 * Send generic invoice email to customer
 * Fetches order data, generates email, and sends via PayloadCMS email adapter
 */
export async function sendGenericInvoiceEmail(
  payload: Payload,
  orderId: string,
  userId: string
): Promise<{ success: boolean; message: string; invoice?: any }> {
  try {
    // Fetch order data
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 2, // Include client account relationship
    })

    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      }
    }

    // Get client account email
    const clientAccount = order.clientAccount as any
    if (!clientAccount || !clientAccount.email) {
      return {
        success: false,
        message: 'Client account or email not found',
      }
    }

    // Prepare email data
    const emailData: GenericInvoiceEmailData = {
      orderNumber: order.orderNumber,
      customerName: clientAccount.name,
      customerEmail: clientAccount.email,
      lineItems: (order.lineItems || []).map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        isRecurring: item.isRecurring || undefined,
        recurringInterval: item.recurringInterval || undefined,
      })),
      totalAmount: order.amount,
      stripeInvoiceUrl: order.stripeInvoiceUrl || undefined,
    }

    // Send email
    await payload.sendEmail({
      to: clientAccount.email,
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
      subject: `Invoice for Order #${order.orderNumber} - ORCACLUB`,
      html: generateGenericInvoiceEmail(emailData),
      text: generateGenericInvoiceEmailText(emailData),
    })

    // Update order with invoice entry
    const invoiceEntry = {
      sentAt: new Date().toISOString(),
      sentTo: clientAccount.email,
      sentBy: userId,
      status: 'sent' as const,
    }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        invoices: [...(order.invoices || []), invoiceEntry],
      },
    })

    payload.logger.info(`[Invoice] Sent to ${clientAccount.email} for order ${order.orderNumber}`)

    return {
      success: true,
      message: `Invoice sent to ${clientAccount.email}`,
      invoice: invoiceEntry,
    }
  } catch (error) {
    payload.logger.error(`[Invoice] Failed to send invoice:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send invoice',
    }
  }
}
