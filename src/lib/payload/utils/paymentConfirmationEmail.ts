/**
 * Payment Confirmation Email Templates
 *
 * Sent when a Stripe invoice.paid webhook is received:
 *   - Client: receipt confirming their payment was received
 *   - Admin:  internal notification with order + client details
 */

import type { Payload } from 'payload'
import { EMAIL_LIGHT_MODE_STYLES } from '@/lib/email/templates/base'

interface PaymentConfirmationData {
  orderNumber: string
  customerName?: string
  customerEmail: string
  lineItems: Array<{
    title: string
    quantity: number
    price: number
  }>
  totalAmount: number
  portalUrl?: string
  adminOrderUrl?: string
}

function fmtUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n)
}

// ─── Client receipt ────────────────────────────────────────────────────────────

export function generatePaymentConfirmationClientHTML(data: PaymentConfirmationData): string {
  const lineItemsHtml = data.lineItems
    .map(
      item => `
    <tr>
      <td class="oc-item-divider" style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
        <div class="oc-item-name" style="color:#cccccc;font-size:13px;font-weight:400;">${item.title}</div>
      </td>
      <td class="oc-item-divider oc-detail-val" style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:center;color:#555555;font-size:13px;width:50px;">${item.quantity}</td>
      <td class="oc-item-divider oc-item-total" style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#cccccc;font-size:13px;font-weight:600;width:90px;">${fmtUsd(item.price * item.quantity)}</td>
    </tr>`,
    )
    .join('')

  const firstName = data.customerName ? data.customerName.split(' ')[0] : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
  ${EMAIL_LIGHT_MODE_STYLES}
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" class="oc-card" style="max-width:520px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header -->
          <tr>
            <td class="oc-header-td" style="padding:28px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Receipt</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <p class="oc-eyebrow" style="margin:0 0 10px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Payment Confirmed</p>
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Thank you${firstName ? `, ${firstName}` : ''}.
              </p>
              <!-- Cyan hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>
              <p class="oc-body-text" style="margin:24px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Your payment for order <span style="color:#888888;">#${data.orderNumber}</span> has been received. We'll be in touch shortly as we get started on your project.</p>
            </td>
          </tr>

          <!-- Line Items -->
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;">
                <tr>
                  <td style="padding:20px 20px 0 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <thead>
                        <tr>
                          <th style="text-align:left;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;">Item</th>
                          <th style="text-align:center;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:50px;">Qty</th>
                          <th style="text-align:right;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:90px;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lineItemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>
                <!-- Total -->
                <tr>
                  <td class="oc-footer-note-td" style="padding:16px 20px;border-top:1px solid #1a1a1a;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="oc-total-label" style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Amount Paid</td>
                        <td style="text-align:right;font-size:18px;font-weight:700;color:#67e8f9;">${fmtUsd(data.totalAmount)} <span style="font-size:11px;font-weight:400;color:#3a3a3a;">USD</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            data.portalUrl
              ? `
          <!-- Portal CTA -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${data.portalUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">View Your Portal</a>
                  </td>
                </tr>
              </table>
              <p class="oc-muted" style="margin:10px 0 0 0;font-size:11px;color:#2e2e2e;word-break:break-all;">${data.portalUrl}</p>
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
                  <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Questions about your order? Reply to this email or contact <a href="mailto:chance@orcaclub.pro" style="color:#2a6068;text-decoration:none;">chance@orcaclub.pro</a></p>
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

export function generatePaymentConfirmationClientText(data: PaymentConfirmationData): string {
  const lineItemsText = data.lineItems
    .map(
      item =>
        `  - ${item.title}\n    Qty: ${item.quantity} × ${fmtUsd(item.price)} = ${fmtUsd(item.price * item.quantity)}`,
    )
    .join('\n\n')

  return `ORCACLUB — Payment Receipt

Hello${data.customerName ? ` ${data.customerName}` : ''},

Your payment for order #${data.orderNumber} has been received. Thank you — we'll be in touch shortly as we get started on your project.

ITEMS:
${lineItemsText}

AMOUNT PAID: ${fmtUsd(data.totalAmount)} USD

---
${data.portalUrl ? `View your client portal:\n${data.portalUrl}\n\n` : ''}Questions? Reply to this email or contact chance@orcaclub.pro

---
ORCACLUB
orcaclub.pro`.trim()
}

// ─── Admin notification ────────────────────────────────────────────────────────

export function generatePaymentConfirmationAdminHTML(data: PaymentConfirmationData): string {
  const lineItemsHtml = data.lineItems
    .map(
      item => `
    <tr>
      <td class="oc-item-divider" style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
        <div class="oc-item-name" style="color:#cccccc;font-size:13px;font-weight:400;">${item.title}</div>
      </td>
      <td class="oc-item-divider oc-detail-val" style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:center;color:#555555;font-size:13px;width:50px;">${item.quantity}</td>
      <td class="oc-item-divider oc-item-total" style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#cccccc;font-size:13px;font-weight:600;width:90px;">${fmtUsd(item.price * item.quantity)}</td>
    </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received — ORCACLUB Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
  ${EMAIL_LIGHT_MODE_STYLES}
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" class="oc-card" style="max-width:520px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header -->
          <tr>
            <td class="oc-header-td" style="padding:28px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Admin</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <!-- Alert badge -->
              <div style="display:inline-block;background-color:#67e8f9;color:#000000;padding:6px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:20px;">Payment Received</div>
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">${data.customerName ?? data.customerEmail}</p>
              <!-- Cyan hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order detail box -->
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box-lborder" style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 12px 0;font-size:10px;font-weight:600;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.5px;">Order Details</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td class="oc-detail-key" style="padding:5px 0;font-size:12px;color:#3a3a3a;">Client</td>
                        <td class="oc-detail-val" style="padding:5px 0;font-size:12px;color:#555555;text-align:right;">${data.customerName ?? '—'}</td>
                      </tr>
                      <tr>
                        <td class="oc-detail-key" style="padding:5px 0;font-size:12px;color:#3a3a3a;">Email</td>
                        <td style="padding:5px 0;font-size:12px;text-align:right;"><a href="mailto:${data.customerEmail}" style="color:#2a6068;text-decoration:none;">${data.customerEmail}</a></td>
                      </tr>
                      <tr>
                        <td class="oc-detail-key" style="padding:5px 0;font-size:12px;color:#3a3a3a;">Order</td>
                        <td class="oc-detail-val" style="padding:5px 0;font-size:12px;color:#555555;text-align:right;">#${data.orderNumber}</td>
                      </tr>
                      <tr>
                        <td class="oc-detail-key" style="padding:5px 0;font-size:12px;color:#3a3a3a;">Amount</td>
                        <td style="padding:5px 0;font-size:15px;font-weight:700;color:#67e8f9;text-align:right;">${fmtUsd(data.totalAmount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line Items -->
          <tr>
            <td style="padding:12px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;">
                <tr>
                  <td style="padding:20px 20px 0 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <thead>
                        <tr>
                          <th style="text-align:left;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;">Item</th>
                          <th style="text-align:center;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:50px;">Qty</th>
                          <th style="text-align:right;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:90px;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lineItemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="oc-footer-note-td" style="padding:16px 20px;border-top:1px solid #1a1a1a;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="oc-total-label" style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Total Received</td>
                        <td style="text-align:right;font-size:18px;font-weight:700;color:#67e8f9;">${fmtUsd(data.totalAmount)} <span style="font-size:11px;font-weight:400;color:#3a3a3a;">USD</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            data.adminOrderUrl
              ? `
          <!-- Admin CTA -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${data.adminOrderUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">View Order</a>
                  </td>
                </tr>
              </table>
              <p class="oc-muted" style="margin:10px 0 0 0;font-size:11px;color:#2e2e2e;word-break:break-all;">${data.adminOrderUrl}</p>
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
                  <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Order #${data.orderNumber} has been marked as paid. The client's balance has been updated automatically.</p>
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

export function generatePaymentConfirmationAdminText(data: PaymentConfirmationData): string {
  const lineItemsText = data.lineItems
    .map(
      item =>
        `  - ${item.title}\n    Qty: ${item.quantity} × ${fmtUsd(item.price)} = ${fmtUsd(item.price * item.quantity)}`,
    )
    .join('\n\n')

  return `ORCACLUB — Payment Received

[PAYMENT RECEIVED]

Client: ${data.customerName ?? '—'}
Email: ${data.customerEmail}
Order: #${data.orderNumber}
Amount: ${fmtUsd(data.totalAmount)} USD

ITEMS:
${lineItemsText}

TOTAL RECEIVED: ${fmtUsd(data.totalAmount)} USD

---
${data.adminOrderUrl ? `View order in admin:\n${data.adminOrderUrl}\n\n` : ''}Order #${data.orderNumber} has been marked as paid. The client's balance has been updated automatically.

---
ORCACLUB
orcaclub.pro`.trim()
}

// ─── Send both emails ──────────────────────────────────────────────────────────

/**
 * Send payment confirmation emails to both the client and the admin.
 * Non-blocking: errors are caught and logged — the webhook must still return 200.
 */
export async function sendPaymentConfirmationEmails(
  payload: Payload,
  orderId: string,
): Promise<void> {
  try {
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 2,
    })

    if (!order) {
      payload.logger.warn(`[PaymentConfirmation] Order not found: ${orderId}`)
      return
    }

    const clientAccount = order.clientAccount as any
    if (!clientAccount?.email) {
      payload.logger.warn(`[PaymentConfirmation] No client email for order: ${orderId}`)
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'
    const username = clientAccount.user?.username as string | undefined

    const emailData: PaymentConfirmationData = {
      orderNumber: order.orderNumber,
      customerName: clientAccount.name || undefined,
      customerEmail: clientAccount.email,
      lineItems: (order.lineItems || []).map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: order.amount,
      portalUrl: username ? `${baseUrl}/u/${username}` : undefined,
      adminOrderUrl: `${baseUrl}/admin/collections/orders/${orderId}`,
    }

    const from = process.env.EMAIL_FROM || 'carbon@orcaclub.pro'
    const adminEmail = 'chance@orcaclub.pro'

    // Client receipt
    await payload.sendEmail({
      to: clientAccount.email,
      from,
      subject: `Payment Received — Order #${order.orderNumber} | ORCACLUB`,
      html: generatePaymentConfirmationClientHTML(emailData),
      text: generatePaymentConfirmationClientText(emailData),
    })
    payload.logger.info(
      `[PaymentConfirmation] Client receipt sent to ${clientAccount.email} for order ${order.orderNumber}`,
    )

    // Admin notification
    await payload.sendEmail({
      to: adminEmail,
      from,
      subject: `Payment Received: ${clientAccount.name ?? clientAccount.email} — #${order.orderNumber}`,
      html: generatePaymentConfirmationAdminHTML(emailData),
      text: generatePaymentConfirmationAdminText(emailData),
    })
    payload.logger.info(
      `[PaymentConfirmation] Admin notification sent to ${adminEmail} for order ${order.orderNumber}`,
    )
  } catch (error) {
    // Non-blocking — log but don't rethrow so the webhook still returns 200
    payload.logger.error(
      `[PaymentConfirmation] Failed to send emails for order ${orderId}:`,
      error,
    )
  }
}
