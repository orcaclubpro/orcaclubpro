/**
 * Generic Invoice Email Template
 * Generates a clean, branded HTML email for any order type (Shopify/Stripe/Manual)
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
  orderType: 'shopify' | 'stripe'
  customerName?: string
  customerEmail: string
  lineItems: OrderLineItem[]
  totalAmount: number
  // Optional payment URLs based on order type
  shopifyInvoiceUrl?: string
  stripeInvoiceUrl?: string
}

/**
 * Generate HTML email template for generic invoice
 */
export function generateGenericInvoiceEmail(order: GenericInvoiceEmailData): string {
  // Calculate subtotal from line items
  const subtotal = order.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Determine payment URL and CTA text based on order type
  let paymentUrl = '#'
  let ctaText = 'View Order Details'

  if (order.orderType === 'shopify' && order.shopifyInvoiceUrl) {
    paymentUrl = order.shopifyInvoiceUrl
    ctaText = 'View Invoice & Pay'
  } else if (order.orderType === 'stripe' && order.stripeInvoiceUrl) {
    paymentUrl = order.stripeInvoiceUrl
    ctaText = 'View Invoice & Pay'
  }

  const lineItemsHtml = order.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151;">
        <div style="color: #f3f4f6; font-weight: 500;">${item.title}</div>
        ${
          item.isRecurring
            ? `<div style="color: #c084fc; font-size: 12px; margin-top: 6px;">
                 Recurring (${item.recurringInterval}ly)
               </div>`
            : ''
        }
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151; text-align: center; color: #d1d5db;">
        ${item.quantity}
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151; text-align: right; color: #f3f4f6; font-weight: 500;">
        $${item.price.toFixed(2)}${item.isRecurring ? `<span style="color: #c084fc; font-size: 12px;">/${item.recurringInterval}</span>` : ''}
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151; text-align: right; color: #f3f4f6; font-weight: 600;">
        $${(item.price * item.quantity).toFixed(2)}${item.isRecurring ? `<span style="color: #c084fc; font-size: 12px;">/${item.recurringInterval}</span>` : ''}
      </td>
    </tr>
  `
    )
    .join('')

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ORCACLUB</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" style="max-width: 600px;" cellpadding="0" cellspacing="0">

          <!-- Header with ORCACLUB Branding -->
          <tr>
            <td style="text-align: center; padding-bottom: 40px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">
                <span style="color: #ffffff;">ORCA</span><span style="background: linear-gradient(45deg, #67e8f9, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">CLUB</span>
              </h1>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px; font-weight: 300;">est 2025</p>
            </td>
          </tr>

          <!-- Invoice Message -->
          <tr>
            <td style="padding-bottom: 32px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: -0.01em;">
                Invoice for Order #${order.orderNumber}
              </h2>
              <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.6; font-weight: 300;">
                Thank you for your business${order.customerName ? `, ${order.customerName}` : ''}. Your invoice is ready${paymentUrl !== '#' ? ' for payment' : ''}.
              </p>
            </td>
          </tr>

          <!-- Order Number Badge -->
          <tr>
            <td style="padding-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(to right, rgba(37, 99, 235, 0.2), rgba(6, 182, 212, 0.2)); border: 1px solid rgba(103, 232, 249, 0.3); border-radius: 9999px; padding: 12px 24px;">
                <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Order Number</span>
                <span style="color: #67e8f9; font-size: 18px; font-weight: 600; margin-left: 12px;">${order.orderNumber}</span>
              </div>
            </td>
          </tr>

          <!-- Order Details Card -->
          <tr>
            <td style="background-color: #1f2937; border-radius: 12px; padding: 32px; margin-bottom: 24px;">

              <!-- Line Items Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <thead>
                  <tr>
                    <th style="text-align: left; color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 16px;">Item</th>
                    <th style="text-align: center; color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 16px; width: 60px;">Qty</th>
                    <th style="text-align: right; color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 16px; width: 100px;">Price</th>
                    <th style="text-align: right; color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 16px; width: 100px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHtml}
                </tbody>
              </table>

              <!-- Order Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; border-top: 2px solid #374151; padding-top: 16px;">
                <tr>
                  <td style="color: #ffffff; font-size: 20px; font-weight: 600; padding: 0;">Total Amount</td>
                  <td style="color: #67e8f9; font-size: 24px; font-weight: 700; text-align: right; padding: 0;">
                    $${order.totalAmount.toFixed(2)} USD
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
            <td align="center" style="padding: 40px 0;">
              <a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(to right, #2563eb, #06b6d4); color: #ffffff; padding: 16px 48px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s;">
                ${ctaText} →
              </a>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding-top: 40px; border-top: 1px solid #1f2937;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px; font-weight: 300;">
                Questions? Reply to this email or visit
                <a href="https://orcaclub.pro" style="color: #67e8f9; text-decoration: none;">orcaclub.pro</a>
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: 300;">
                © 2025 ORCACLUB. Technical Operations Development Studio.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
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

  // Determine payment URL based on order type
  let paymentUrl = ''
  if (order.orderType === 'shopify' && order.shopifyInvoiceUrl) {
    paymentUrl = order.shopifyInvoiceUrl
  } else if (order.orderType === 'stripe' && order.stripeInvoiceUrl) {
    paymentUrl = order.stripeInvoiceUrl
  }

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
      orderType: order.orderType as 'shopify' | 'stripe',
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
      shopifyInvoiceUrl: order.shopifyInvoiceUrl || undefined,
      stripeInvoiceUrl: order.stripeInvoiceUrl || undefined,
    }

    // Send email
    await payload.sendEmail({
      to: clientAccount.email,
      from: process.env.EMAIL_FROM || 'chance@orcaclub.pro',
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
