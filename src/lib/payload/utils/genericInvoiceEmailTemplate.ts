/**
 * Generic Invoice Email Template
 * Structured dark email with Bill To block, invoice type label, due date, cyan total, and Stripe CTA.
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
  // existing
  orderNumber: string
  customerName?: string
  customerEmail: string
  lineItems: OrderLineItem[]
  totalAmount: number
  stripeInvoiceUrl?: string
  // new
  customerCompany?: string
  customerPhone?: string
  customerAddress?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  invoiceType?: 'full' | 'deposit' | 'installment' | 'balance'
  invoiceNote?: string
  dueDate?: string
  packageName?: string
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

function fmtDueDate(iso: string): string {
  const parts = iso.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return iso
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  if (!isFinite(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function invoiceTypeLabel(type?: string): string {
  switch (type) {
    case 'deposit':     return 'Deposit Invoice'
    case 'installment': return 'Installment'
    case 'balance':     return 'Balance Payment'
    default:            return 'Invoice'
  }
}

export function generateGenericInvoiceEmail(order: GenericInvoiceEmailData): string {
  const paymentUrl = order.stripeInvoiceUrl || ''
  const eyebrow = invoiceTypeLabel(order.invoiceType)

  // Build Bill To rows (left column)
  const billToRows: string[] = []
  if (order.customerName) {
    billToRows.push(`<div style="font-size:13px;font-weight:700;color:#cccccc;line-height:1.5;">${order.customerName}</div>`)
  }
  if (order.customerCompany) {
    billToRows.push(`<div style="font-size:12px;color:#555555;line-height:1.5;">${order.customerCompany}</div>`)
  }
  if (order.customerAddress?.line1) {
    billToRows.push(`<div style="font-size:12px;color:#555555;line-height:1.5;">${order.customerAddress.line1}</div>`)
  }
  if (order.customerAddress?.line2) {
    billToRows.push(`<div style="font-size:12px;color:#555555;line-height:1.5;">${order.customerAddress.line2}</div>`)
  }
  const cityStateZip = [order.customerAddress?.city, order.customerAddress?.state, order.customerAddress?.zip].filter(Boolean).join(', ')
  if (cityStateZip) {
    billToRows.push(`<div style="font-size:12px;color:#555555;line-height:1.5;">${cityStateZip}</div>`)
  }
  if (order.customerPhone) {
    billToRows.push(`<div style="font-size:12px;color:#555555;line-height:1.5;">${order.customerPhone}</div>`)
  }
  if (order.customerEmail) {
    billToRows.push(`<div style="font-size:12px;color:#555555;line-height:1.5;"><a href="mailto:${order.customerEmail}" style="color:#2a6068;text-decoration:none;">${order.customerEmail}</a></div>`)
  }

  // Build Order Details rows (right column)
  const orderRows: string[] = []
  orderRows.push(`<div style="font-size:13px;font-weight:600;color:#cccccc;line-height:1.5;">#${order.orderNumber}</div>`)
  if (order.packageName) {
    orderRows.push(`<div style="font-size:12px;color:#555555;line-height:1.5;">${order.packageName}</div>`)
  }
  if (order.dueDate) {
    orderRows.push(`<div style="font-size:12px;color:#555555;line-height:1.5;margin-top:4px;">Due: ${fmtDueDate(order.dueDate)}</div>`)
  }

  // Line items HTML
  const lineItemsHtml = order.lineItems
    .map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
        <div style="color:#cccccc;font-size:13px;font-weight:400;">${item.title}</div>
        ${item.isRecurring ? `<div style="color:#3a3a3a;font-size:11px;margin-top:3px;letter-spacing:0.02em;">Recurring (${item.recurringInterval}ly)</div>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:center;color:#555555;font-size:13px;width:50px;">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#555555;font-size:13px;width:80px;">${fmtUsd(item.price)}${item.isRecurring ? `<span style="color:#3a3a3a;font-size:11px;">/${item.recurringInterval}</span>` : ''}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#cccccc;font-size:13px;font-weight:600;width:90px;">${fmtUsd(item.price * item.quantity)}${item.isRecurring ? `<span style="color:#3a3a3a;font-size:11px;font-weight:400;">/${item.recurringInterval}</span>` : ''}</td>
    </tr>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${order.orderNumber} — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:560px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header: wordmark + label -->
          <tr>
            <td style="padding:28px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
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
            <td style="padding:36px 40px 0 40px;">

              <!-- Eyebrow -->
              <p style="margin:0 0 10px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">${eyebrow}</p>

              <!-- Heading -->
              <p style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Invoice #${order.orderNumber}</p>

              <!-- Cyan hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Bill To + Order Details two-column box -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#111111;border:1px solid #1a1a1a;">
                <tr>
                  <!-- Bill To -->
                  <td style="padding:18px 20px;vertical-align:top;width:55%;border-right:1px solid #1a1a1a;">
                    <div style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;margin-bottom:10px;">Bill To</div>
                    ${billToRows.join('\n                    ')}
                  </td>
                  <!-- Order Details -->
                  <td style="padding:18px 20px;vertical-align:top;width:45%;">
                    <div style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;margin-bottom:10px;">Order Details</div>
                    ${orderRows.join('\n                    ')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line Items Card -->
          <tr>
            <td style="padding:16px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#111111;border:1px solid #1a1a1a;">
                <tr>
                  <td style="padding:20px 20px 0 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <thead>
                        <tr>
                          <th style="text-align:left;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;">Item</th>
                          <th style="text-align:center;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:50px;">Qty</th>
                          <th style="text-align:right;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:80px;">Price</th>
                          <th style="text-align:right;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:90px;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lineItemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Total row -->
                <tr>
                  <td style="padding:16px 20px;border-top:1px solid #1a1a1a;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Total Due</td>
                        <td style="text-align:right;font-size:18px;font-weight:700;color:#67e8f9;">${fmtUsd(order.totalAmount)} <span style="font-size:11px;font-weight:400;color:#3a3a3a;">USD</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${paymentUrl ? `
          <!-- CTA Button -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${paymentUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">View Invoice &amp; Pay</a>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0 0;font-size:11px;color:#2e2e2e;word-break:break-all;">${paymentUrl}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Footer note -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Questions about your invoice? Reply to this email or contact <a href="mailto:chance@orcaclub.pro" style="color:#2a6068;text-decoration:none;">chance@orcaclub.pro</a></p>
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

export function generateGenericInvoiceEmailText(order: GenericInvoiceEmailData): string {
  const eyebrow = invoiceTypeLabel(order.invoiceType)
  const lineItemsText = order.lineItems
    .map(item => {
      const recurring = item.isRecurring ? ` (${item.recurringInterval}ly subscription)` : ''
      return `  - ${item.title}${recurring}\n    Qty: ${item.quantity} × ${fmtUsd(item.price)} = ${fmtUsd(item.price * item.quantity)}`
    })
    .join('\n\n')

  const addressLines = [
    order.customerAddress?.line1,
    order.customerAddress?.line2,
    [order.customerAddress?.city, order.customerAddress?.state, order.customerAddress?.zip].filter(Boolean).join(', '),
  ].filter(Boolean).join('\n')

  return `
ORCACLUB — ${eyebrow} #${order.orderNumber}

Hello${order.customerName ? ` ${order.customerName}` : ''},

Thank you for your business. Your invoice is ready${order.stripeInvoiceUrl ? ' for payment' : ''}.

BILL TO:
${order.customerName ?? ''}
${order.customerCompany ? order.customerCompany + '\n' : ''}${addressLines ? addressLines + '\n' : ''}${order.customerPhone ? order.customerPhone + '\n' : ''}${order.customerEmail}

ORDER DETAILS:
Invoice: #${order.orderNumber}
${order.packageName ? `Package: ${order.packageName}\n` : ''}${order.dueDate ? `Due: ${fmtDueDate(order.dueDate)}\n` : ''}

ITEMS:
${lineItemsText}

TOTAL DUE: ${fmtUsd(order.totalAmount)} USD

---
${order.stripeInvoiceUrl ? `\nComplete your payment:\n${order.stripeInvoiceUrl}\n\n` : ''}Questions? Reply to this email or contact chance@orcaclub.pro

---
© 2025 ORCACLUB. Technical Operations Development Studio.
  `.trim()
}

export async function sendGenericInvoiceEmail(
  payload: Payload,
  orderId: string,
  userId: string
): Promise<{ success: boolean; message: string; invoice?: any }> {
  try {
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 2,
    })

    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    const clientAccount = order.clientAccount as any
    if (!clientAccount || !clientAccount.email) {
      return { success: false, message: 'Client account or email not found' }
    }

    const emailData: GenericInvoiceEmailData = {
      orderNumber: order.orderNumber,
      customerName: clientAccount.name,
      customerEmail: clientAccount.email,
      customerCompany: clientAccount.company || undefined,
      customerPhone: clientAccount.phone || undefined,
      customerAddress: clientAccount.address || undefined,
      lineItems: (order.lineItems || []).map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        isRecurring: item.isRecurring || undefined,
        recurringInterval: item.recurringInterval || undefined,
      })),
      totalAmount: order.amount,
      stripeInvoiceUrl: order.stripeInvoiceUrl || undefined,
      invoiceType: (order as any).invoiceType || undefined,
      invoiceNote: (order as any).invoiceNote || undefined,
      dueDate: (order as any).dueDate || undefined,
      packageName: (order as any).packageRef?.name || (order as any).package?.name || undefined,
    }

    await payload.sendEmail({
      to: clientAccount.email,
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
      subject: `Invoice #${order.orderNumber} — ORCACLUB`,
      html: generateGenericInvoiceEmail(emailData),
      text: generateGenericInvoiceEmailText(emailData),
    })

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
