/**
 * Stripe Payment Link Email Template
 * Generates a clean, branded HTML email for Stripe payment links
 * Follows ORCACLUB email template patterns with dark theme and gradient branding
 */

import type { Payload } from 'payload'
import { EMAIL_LIGHT_MODE_STYLES } from '@/lib/email/templates/base'

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
      <td class="oc-item-divider" style="padding: 10px 0; border-bottom: 1px solid #1a1a1a;">
        <div class="oc-item-name" style="color: #555555; font-size: 13px; font-weight: 300;">${item.title}</div>
        ${item.description ? `<div class="oc-detail-key" style="color: #3a3a3a; font-size: 12px; margin-top: 3px; font-weight: 300;">${item.description}</div>` : ''}
        ${
          item.isRecurring
            ? `<div class="oc-detail-key" style="color: #3a3a3a; font-size: 11px; margin-top: 4px; font-weight: 300; letter-spacing: 0.02em;">Recurring (${item.recurringInterval}ly)</div>`
            : ''
        }
      </td>
      <td class="oc-item-divider oc-detail-key" style="padding: 10px 0; border-bottom: 1px solid #1a1a1a; text-align: center; color: #3a3a3a; font-size: 13px;">
        ${item.quantity}
      </td>
      <td class="oc-item-divider oc-item-name" style="padding: 10px 0; border-bottom: 1px solid #1a1a1a; text-align: right; color: #555555; font-size: 13px; font-weight: 300;">
        $${item.unitPrice.toFixed(2)}${item.isRecurring ? `<span class="oc-detail-key" style="color: #3a3a3a; font-size: 11px;">/${item.recurringInterval}</span>` : ''}
      </td>
      <td class="oc-item-divider oc-item-total" style="padding: 10px 0; border-bottom: 1px solid #1a1a1a; text-align: right; color: #555555; font-size: 13px; font-weight: 300;">
        $${(item.unitPrice * item.quantity).toFixed(2)}${item.isRecurring ? `<span class="oc-detail-key" style="color: #3a3a3a; font-size: 11px;">/${item.recurringInterval}</span>` : ''}
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
  <title>Payment Link Ready — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
  ${EMAIL_LIGHT_MODE_STYLES}
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" class="oc-card" style="max-width:560px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header: wordmark -->
          <tr>
            <td class="oc-header-td" style="padding:32px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Payment Link</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 0 40px;">

              <!-- Eyebrow label -->
              <p class="oc-eyebrow" style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Order Ready</p>

              <!-- Heading -->
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Your payment link is ready.</p>

              <!-- Cyan accent hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>

              <!-- Body copy -->
              <p class="oc-body-text" style="margin:32px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Thank you${order.customerName ? `, ${order.customerName}` : ''}. Your custom order has been prepared and is ready for secure payment through Stripe.</p>

              <!-- Order number detail box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;">
                <tr>
                  <td class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;padding:16px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td class="oc-detail-label" style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Order Number</td>
                        <td style="text-align:right;font-size:13px;color:#67e8f9;font-weight:600;letter-spacing:0.05em;">${order.orderNumber}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          ${
            hasRecurring
              ? `
          <!-- Recurring Subscription Notice -->
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #555555;padding:16px 20px;">
                    <p class="oc-detail-label" style="margin:0 0 6px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Subscription Items Included</p>
                    <p class="oc-body-text" style="margin:0;font-size:12px;color:#555555;line-height:1.7;font-weight:300;">This order includes recurring subscription items. You'll be charged automatically at each billing interval until you cancel.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Order Details Card -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;">
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
                  <td class="oc-footer-note-td" style="padding:16px 20px;border-top:1px solid #1a1a1a;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="oc-total-label" style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Total Amount</td>
                        <td style="text-align:right;font-size:18px;font-weight:700;color:#67e8f9;">${'$'}${order.totalAmount.toFixed(2)} <span style="font-size:11px;font-weight:400;color:#3a3a3a;">USD</span></td>
                      </tr>
                      ${
                        hasRecurring
                          ? `
                      <tr>
                        <td colspan="2" style="padding-top:6px;">
                          <p style="margin:0;font-size:11px;color:#3a3a3a;text-align:right;font-weight:300;">* Includes recurring charges</p>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${order.paymentLinkUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">Complete Secure Payment</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security notice -->
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;padding:16px 20px;">
                    <p class="oc-detail-label" style="margin:0 0 4px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Secure Payment Processing</p>
                    <p class="oc-body-text" style="margin:0;font-size:12px;color:#555555;line-height:1.7;font-weight:300;">Your payment is processed securely by Stripe. We never see or store your payment information. This link will remain active and you can return to it at any time.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer note -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Questions about your order? Reply to this email or visit <a href="https://orcaclub.pro" style="color:#2a6068;text-decoration:none;">orcaclub.pro</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer bar -->
          <tr>
            <td class="oc-footer-bar" style="padding:18px 40px;border-top:1px solid #0a0a0a;background-color:#050505;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span class="oc-footer-orca" style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1f1f1f;">ORCA</span><span class="oc-footer-club" style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1a3a3e;">CLUB</span>
                  </td>
                  <td align="right">
                    <a href="https://orcaclub.pro" class="oc-footer-link" style="font-size:10px;color:#1f1f1f;text-decoration:none;font-weight:300;letter-spacing:0.02em;">orcaclub.pro</a>
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
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
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
