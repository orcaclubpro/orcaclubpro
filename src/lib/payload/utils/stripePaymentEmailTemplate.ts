/**
 * Stripe Payment Link Email Template
 * Generates a clean, branded HTML email for Stripe payment links
 * Follows ORCACLUB email template patterns with dark theme and gradient branding
 */

import type { Payload } from 'payload'

interface StripeLineItem {
  title: string
  description?: string
  quantity: number
  unitPrice: number
  isRecurring: boolean
  recurringInterval?: 'month' | 'year'
}

interface StripePaymentEmailData {
  orderNumber: string
  customerName?: string
  customerEmail: string
  paymentLinkUrl: string
  totalAmount: number
  lineItems: StripeLineItem[]
}

/**
 * Generate HTML email template for Stripe payment link
 */
export function generateStripePaymentEmail(order: StripePaymentEmailData): string {
  const hasRecurring = order.lineItems.some((item) => item.isRecurring)

  const lineItemsHtml = order.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151;">
        <div style="color: #f3f4f6; font-weight: 500;">${item.title}</div>
        ${item.description ? `<div style="color: #9ca3af; font-size: 14px; margin-top: 4px;">${item.description}</div>` : ''}
        ${
          item.isRecurring
            ? `<div style="color: #c084fc; font-size: 12px; margin-top: 6px; display: inline-flex; align-items: center; gap: 4px;">
                 <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: linear-gradient(45deg, #a855f7, #ec4899); margin-right: 4px;"></span>
                 Recurring Subscription (${item.recurringInterval}ly)
               </div>`
            : ''
        }
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151; text-align: center; color: #d1d5db;">
        ${item.quantity}
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151; text-align: right; color: #f3f4f6; font-weight: 500;">
        $${item.unitPrice.toFixed(2)}${item.isRecurring ? `<span style="color: #c084fc; font-size: 12px;">/${item.recurringInterval}</span>` : ''}
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151; text-align: right; color: #f3f4f6; font-weight: 600;">
        $${(item.unitPrice * item.quantity).toFixed(2)}${item.isRecurring ? `<span style="color: #c084fc; font-size: 12px;">/${item.recurringInterval}</span>` : ''}
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
  <title>Payment Link Ready - ORCACLUB</title>
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

          <!-- Payment Link Ready Message -->
          <tr>
            <td style="padding-bottom: 32px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: -0.01em;">
                Your Payment Link is Ready
              </h2>
              <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.6; font-weight: 300;">
                Thank you${order.customerName ? `, ${order.customerName}` : ''}. Your custom order has been prepared and is ready for secure payment through Stripe.
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

          ${
            hasRecurring
              ? `
          <!-- Recurring Subscription Notice -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="background: linear-gradient(to right, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15)); border: 1px solid rgba(192, 132, 252, 0.3); border-radius: 8px; padding: 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 40px; vertical-align: top;">
                      <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(45deg, #a855f7, #ec4899); display: flex; align-items: center; justify-content: center;">
                        <span style="color: #ffffff; font-size: 18px; font-weight: 600;">↻</span>
                      </div>
                    </td>
                    <td style="vertical-align: top;">
                      <p style="margin: 0 0 6px 0; color: #e9d5ff; font-size: 14px; font-weight: 600;">
                        Subscription Items Included
                      </p>
                      <p style="margin: 0; color: #d8b4fe; font-size: 13px; line-height: 1.5; font-weight: 300;">
                        This order includes recurring subscription items. You'll be charged automatically at each billing interval until you cancel.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          `
              : ''
          }

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
                ${
                  hasRecurring
                    ? `
                <tr>
                  <td colspan="2" style="padding-top: 8px;">
                    <p style="margin: 0; color: #c084fc; font-size: 12px; text-align: right; font-style: italic;">
                      * Includes recurring charges
                    </p>
                  </td>
                </tr>
                `
                    : ''
                }
              </table>

            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 40px 0;">
              <a href="${order.paymentLinkUrl}" style="display: inline-block; background: linear-gradient(to right, #2563eb, #06b6d4); color: #ffffff; padding: 16px 48px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                Complete Secure Payment →
              </a>
            </td>
          </tr>

          <!-- Payment Security Notice -->
          <tr>
            <td style="background: linear-gradient(to right, rgba(20, 184, 166, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(20, 184, 166, 0.2); border-radius: 8px; padding: 20px; margin-top: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(45deg, #14b8a6, #3b82f6); display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 18px; font-weight: 600;">🔒</span>
                    </div>
                  </td>
                  <td style="vertical-align: top;">
                    <p style="margin: 0 0 6px 0; color: #5eead4; font-size: 14px; font-weight: 600;">
                      Secure Payment Processing
                    </p>
                    <p style="margin: 0; color: #99f6e4; font-size: 13px; line-height: 1.5; font-weight: 300;">
                      Your payment is processed securely by Stripe. We never see or store your payment information. This link will remain active and you can return to it at any time.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding-top: 40px; border-top: 1px solid #1f2937;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px; font-weight: 300;">
                Questions about your order? Reply to this email or visit
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
 * Generate plain text version of Stripe payment email
 */
export function generateStripePaymentEmailText(order: StripePaymentEmailData): string {
  const lineItemsText = order.lineItems
    .map((item) => {
      const recurringLabel = item.isRecurring ? ` (${item.recurringInterval}ly subscription)` : ''
      const itemTotal = item.unitPrice * item.quantity
      return `  - ${item.title}${item.description ? ` - ${item.description}` : ''}\n    Quantity: ${item.quantity} × $${item.unitPrice.toFixed(2)}${recurringLabel} = $${itemTotal.toFixed(2)}`
    })
    .join('\n\n')

  const hasRecurring = order.lineItems.some((item) => item.isRecurring)

  return `
ORCACLUB - Your Payment Link is Ready

Hello${order.customerName ? ` ${order.customerName}` : ''},

Your custom order has been prepared and is ready for secure payment through Stripe.

Order Number: ${order.orderNumber}

${hasRecurring ? '⚠️ This order includes recurring subscription items. You\'ll be charged automatically at each billing interval.\n' : ''}
ORDER DETAILS:
${lineItemsText}

TOTAL: $${order.totalAmount.toFixed(2)} USD
${hasRecurring ? '* Includes recurring charges\n' : ''}
---

Complete your secure payment:
${order.paymentLinkUrl}

🔒 SECURE PAYMENT
Your payment is processed securely by Stripe. We never see or store your payment information. This link will remain active and you can return to it at any time.

Questions? Reply to this email or visit https://orcaclub.pro

---
© 2025 ORCACLUB. Technical Operations Development Studio.
  `.trim()
}

/**
 * Send Stripe payment link email to customer
 */
export async function sendStripePaymentEmail(
  payload: Payload,
  orderData: StripePaymentEmailData
): Promise<void> {
  try {
    await payload.sendEmail({
      to: orderData.customerEmail,
      from: process.env.EMAIL_FROM || 'chance@orcaclub.pro',
      subject: `Your Payment Link #${orderData.orderNumber} - ORCACLUB`,
      html: generateStripePaymentEmail(orderData),
      text: generateStripePaymentEmailText(orderData),
    })

    payload.logger.info(`[Stripe Payment Email] Sent to ${orderData.customerEmail} for order ${orderData.orderNumber}`)
  } catch (error) {
    payload.logger.error(`[Stripe Payment Email] Failed to send to ${orderData.customerEmail}:`, error)
    throw error
  }
}
