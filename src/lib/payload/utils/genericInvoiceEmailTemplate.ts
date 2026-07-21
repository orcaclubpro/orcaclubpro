/**
 * Generic Invoice Email Template
 * Structured dark email with Bill To block, invoice type label, due date, cyan total, and Stripe CTA.
 */

import type { Payload } from 'payload'
import { EMAIL_LIGHT_MODE_STYLES } from '@/lib/email/templates/base'
import { buildPackagePdf } from '@/lib/pdf-generators'

interface OrderLineItem {
  title: string
  quantity: number
  price: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

export interface GenericInvoiceEmailData {
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
  proposalPrintUrl?: string
}

export interface EmailAttachment {
  filename: string
  content: string
  encoding: 'base64'
  contentType: string
}

interface PaymentScheduleEntry {
  label: string
  amount: number
  dueDate?: string | null
}

interface PaymentScheduleEmailData {
  customerName?: string
  customerEmail: string
  packageName: string
  packageDescription?: string
  entries: PaymentScheduleEntry[]
  totalAmount: number
  proposalPrintUrl?: string
}

interface ProposalEmailData {
  recipientName?: string
  recipientEmail: string
  packageName: string
  packageDescription?: string
  coverMessage?: string
  lineItems: Array<{ name: string; price: number; quantity?: number; isRecurring?: boolean; recurringInterval?: string }>
  totalOneTime: number
  totalMonthly: number
  totalAnnual: number
  paymentSchedule?: PaymentScheduleEntry[]
  proposalPrintUrl?: string
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
  const typeLabel = invoiceTypeLabel(order.invoiceType)

  // Subline under the heading: "Deposit Invoice · Package: Scale · Due Aug 1, 2026"
  const subline = [
    typeLabel !== 'Invoice' ? typeLabel : null,
    order.packageName ? `Package: ${order.packageName}` : null,
    order.dueDate ? `Due ${fmtDueDate(order.dueDate)}` : null,
  ].filter(Boolean).join(' &nbsp;·&nbsp; ')

  const billToLines = [
    order.customerCompany,
    order.customerAddress?.line1,
    order.customerAddress?.line2,
    [order.customerAddress?.city, order.customerAddress?.state, order.customerAddress?.zip].filter(Boolean).join(', ') || null,
    order.customerPhone,
  ].filter(Boolean) as string[]

  const billToHtml = [
    order.customerName ? `<div class="oc-bill-name" style="font-size:13px;font-weight:700;color:#cccccc;line-height:1.6;">${order.customerName}</div>` : '',
    ...billToLines.map(line => `<div class="oc-detail-val" style="font-size:12px;color:#555555;line-height:1.6;">${line}</div>`),
    `<div class="oc-detail-val" style="font-size:12px;line-height:1.6;"><a href="mailto:${order.customerEmail}" style="color:#3a5a5e;text-decoration:none;">${order.customerEmail}</a></div>`,
  ].filter(Boolean).join('\n            ')

  const lineItemsHtml = order.lineItems
    .map(item => {
      const per = item.isRecurring ? `<span class="oc-detail-key" style="color:#3a3a3a;font-size:11px;font-weight:400;">/${item.recurringInterval}</span>` : ''
      return `
                <tr>
                  <td class="oc-item-divider" style="padding:12px 0;border-bottom:1px solid #1a1a1a;">
                    <div class="oc-item-name" style="color:#cccccc;font-size:13px;">${item.title}</div>
                    ${item.isRecurring ? `<div class="oc-detail-key" style="color:#3a3a3a;font-size:11px;margin-top:3px;">Recurring (${item.recurringInterval}ly)</div>` : ''}
                  </td>
                  <td class="oc-item-divider oc-detail-val" style="padding:12px 0;border-bottom:1px solid #1a1a1a;text-align:center;color:#555555;font-size:13px;width:50px;">${item.quantity}</td>
                  <td class="oc-item-divider oc-detail-val" style="padding:12px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#555555;font-size:13px;width:80px;">${fmtUsd(item.price)}${per}</td>
                  <td class="oc-item-divider oc-item-total" style="padding:12px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#cccccc;font-size:13px;font-weight:600;width:90px;">${fmtUsd(item.price * item.quantity)}${per}</td>
                </tr>`
    })
    .join('')

  const thStyle = 'font-size:10px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:10px;border-bottom:1px solid #1a1a1a;'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${order.orderNumber} — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
  ${EMAIL_LIGHT_MODE_STYLES}
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" class="oc-card" style="max-width:560px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header: wordmark + label -->
          <tr>
            <td class="oc-header-td" style="padding:28px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span class="oc-header-label" style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Invoice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Invoice #${order.orderNumber}</p>
              ${subline ? `<p class="oc-detail-val" style="margin:8px 0 0 0;font-size:12px;color:#555555;line-height:1.6;">${subline}</p>` : ''}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td class="oc-hairline" style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bill To -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box-lborder" style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p class="oc-detail-label" style="margin:0 0 10px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Bill To</p>
                    ${billToHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line items -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th class="oc-item-divider" style="text-align:left;${thStyle}">Item</th>
                    <th class="oc-item-divider" style="text-align:center;width:50px;${thStyle}">Qty</th>
                    <th class="oc-item-divider" style="text-align:right;width:80px;${thStyle}">Price</th>
                    <th class="oc-item-divider" style="text-align:right;width:90px;${thStyle}">Amount</th>
                  </tr>
                </thead>
                <tbody>${lineItemsHtml}
                  <tr>
                    <td colspan="3" class="oc-total-label" style="padding:16px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;">Total Due</td>
                    <td style="padding:16px 0;text-align:right;font-size:18px;font-weight:700;color:#67e8f9;white-space:nowrap;">${fmtUsd(order.totalAmount)} <span class="oc-total-label" style="font-size:11px;font-weight:400;color:#3a3a3a;">USD</span></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          ${order.invoiceNote ? `
          <!-- Note -->
          <tr>
            <td style="padding:4px 40px 0 40px;">
              <p class="oc-body-text" style="margin:0;font-size:12px;color:#555555;line-height:1.7;font-weight:300;">${order.invoiceNote}</p>
            </td>
          </tr>
          ` : ''}

          ${paymentUrl ? `
          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${paymentUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">Pay Now</a>
                  </td>
                </tr>
              </table>
              <p class="oc-muted" style="margin:12px 0 0 0;font-size:11px;color:#2e2e2e;line-height:1.6;word-break:break-all;">Or paste this into your browser: <a href="${paymentUrl}" class="oc-url-text" style="color:#3a5a5e;text-decoration:none;">${paymentUrl}</a></p>
            </td>
          </tr>
          ` : ''}

          <!-- Footer note -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">${order.proposalPrintUrl ? `<a href="${order.proposalPrintUrl}" style="color:#3a5a5e;text-decoration:none;">Download a copy of this invoice</a> &nbsp;·&nbsp; ` : ''}Questions? Reply to this email or contact <a href="mailto:chance@orcaclub.pro" style="color:#3a5a5e;text-decoration:none;">chance@orcaclub.pro</a></p>
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

export function generateGenericInvoiceEmailText(order: GenericInvoiceEmailData): string {
  const typeLabel = invoiceTypeLabel(order.invoiceType)
  const lineItemsText = order.lineItems
    .map(item => {
      const recurring = item.isRecurring ? ` (recurring, ${item.recurringInterval}ly)` : ''
      return `- ${item.title}${recurring}\n  Qty: ${item.quantity} × ${fmtUsd(item.price)} = ${fmtUsd(item.price * item.quantity)}`
    })
    .join('\n\n')

  const billToLines = [
    order.customerName,
    order.customerCompany,
    order.customerAddress?.line1,
    order.customerAddress?.line2,
    [order.customerAddress?.city, order.customerAddress?.state, order.customerAddress?.zip].filter(Boolean).join(', '),
    order.customerPhone,
    order.customerEmail,
  ].filter(Boolean).join('\n')

  return `
ORCACLUB — ${typeLabel} #${order.orderNumber}
${order.packageName ? `Package: ${order.packageName}\n` : ''}${order.dueDate ? `Due: ${fmtDueDate(order.dueDate)}\n` : ''}
BILL TO
━━━━━━━━━━━━━━━━━━━━
${billToLines}

ITEMS
━━━━━━━━━━━━━━━━━━━━
${lineItemsText}
━━━━━━━━━━━━━━━━━━━━
TOTAL DUE: ${fmtUsd(order.totalAmount)} USD
${order.invoiceNote ? `\n${order.invoiceNote}\n` : ''}
${order.stripeInvoiceUrl ? `Pay online:\n${order.stripeInvoiceUrl}\n\n` : ''}${order.proposalPrintUrl ? `Download a copy of this invoice:\n${order.proposalPrintUrl}\n\n` : ''}Questions? Reply to this email or contact chance@orcaclub.pro

---
ORCACLUB
orcaclub.pro
  `.trim()
}

export async function sendGenericInvoiceEmail(
  payload: Payload,
  orderId: string,
  userId: string,
  proposalPrintUrl?: string
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
      proposalPrintUrl: proposalPrintUrl || undefined,
    }

    // PDF attachment — non-blocking, the email still sends without it
    let attachments: EmailAttachment[] | undefined
    try {
      const bytes = await buildPackagePdf({
        sendAs: 'invoice',
        ref: `#${emailData.orderNumber}`,
        packageName: emailData.packageName ?? 'ORCACLUB',
        dateLabel: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()),
        clientLines: [
          emailData.customerName,
          emailData.customerCompany,
          emailData.customerAddress?.line1,
          emailData.customerAddress?.line2,
          [emailData.customerAddress?.city, emailData.customerAddress?.state, emailData.customerAddress?.zip].filter(Boolean).join(', ') || null,
          emailData.customerEmail,
        ].filter(Boolean) as string[],
        lineItems: emailData.lineItems.map(item => ({
          name: item.title,
          quantity: item.quantity,
          rate: item.price,
          isRecurring: item.isRecurring,
          recurringInterval: item.recurringInterval,
        })),
        paymentSchedule: [],
      })
      attachments = [{
        filename: `Invoice_${emailData.orderNumber}.pdf`,
        content: Buffer.from(bytes).toString('base64'),
        encoding: 'base64',
        contentType: 'application/pdf',
      }]
    } catch (err) {
      payload.logger.error(`[Invoice] PDF generation failed — sending without attachment:`, err)
    }

    await payload.sendEmail({
      to: clientAccount.email,
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
      subject: `Invoice #${order.orderNumber} — ORCACLUB`,
      html: generateGenericInvoiceEmail(emailData),
      text: generateGenericInvoiceEmailText(emailData),
      ...(attachments?.length ? { attachments } : {}),
    } as any)

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

/**
 * Send an invoice-styled copy of a package to arbitrary addresses.
 * Unlike sendGenericInvoiceEmail this creates no Order and needs no Stripe
 * invoice — it's just the invoice rendering of the data, sent as a copy.
 */
export async function sendInvoiceCopyToAddresses(
  payload: Payload,
  data: GenericInvoiceEmailData,
  emails: string[],
  attachments?: EmailAttachment[],
): Promise<{ success: boolean; sent: number; errors: string[] }> {
  const errors: string[] = []
  let sent = 0
  for (const email of emails) {
    const recipient = email.trim()
    if (!recipient) continue
    try {
      await payload.sendEmail({
        to: recipient,
        from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
        subject: `Invoice #${data.orderNumber} — ORCACLUB`,
        html: generateGenericInvoiceEmail(data),
        text: generateGenericInvoiceEmailText(data),
        ...(attachments?.length ? { attachments } : {}),
      } as any)
      sent++
      payload.logger.info(`[InvoiceCopy] Sent to ${recipient} for ${data.orderNumber}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`${recipient}: ${msg}`)
      payload.logger.error(`[InvoiceCopy] Failed to send to ${recipient}:`, error)
    }
  }
  return { success: sent > 0, sent, errors }
}

// ─── Payment Schedule Email ────────────────────────────────────────────────────

export function generatePaymentScheduleEmail(data: PaymentScheduleEmailData): string {
  const scheduleRows = data.entries.map((e, i) => `
    <tr>
      <td class="oc-item-divider" style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
        <div class="oc-item-name" style="color:#cccccc;font-size:13px;font-weight:400;">${e.label}</div>
        <div class="oc-detail-key" style="color:#3a3a3a;font-size:11px;margin-top:2px;">Payment ${i + 1} of ${data.entries.length}</div>
      </td>
      <td class="oc-item-divider oc-item-total" style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#cccccc;font-size:13px;font-weight:600;width:110px;">${fmtUsd(e.amount)}</td>
      <td class="oc-item-divider oc-detail-val" style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#555555;font-size:12px;width:120px;">${e.dueDate ? fmtDueDate(e.dueDate) : '—'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Schedule — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
  ${EMAIL_LIGHT_MODE_STYLES}
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" class="oc-card" style="max-width:560px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header -->
          <tr>
            <td class="oc-header-td" style="padding:28px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Payment Schedule</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <p class="oc-eyebrow" style="margin:0 0 10px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Your Package</p>
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Package: ${data.packageName}</p>
              ${data.packageDescription ? `<p class="oc-body-text" style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">${data.packageDescription}</p>` : ''}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Schedule table -->
          <tr>
            <td style="padding:16px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;">
                <tr>
                  <td style="padding:20px 20px 0 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <thead>
                        <tr>
                          <th style="text-align:left;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;">Payment</th>
                          <th style="text-align:right;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:110px;">Amount</th>
                          <th style="text-align:right;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:120px;">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>${scheduleRows}</tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="oc-footer-note-td" style="padding:16px 20px;border-top:1px solid #1a1a1a;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="oc-total-label" style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Total</td>
                        <td style="text-align:right;font-size:18px;font-weight:700;color:#67e8f9;">${fmtUsd(data.totalAmount)} <span class="oc-total-label" style="font-size:11px;font-weight:400;color:#3a3a3a;">USD</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${data.proposalPrintUrl ? `
          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${data.proposalPrintUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">View Package &amp; Schedule</a>
                  </td>
                </tr>
              </table>
              <p class="oc-muted" style="margin:10px 0 0 0;font-size:11px;color:#2e2e2e;word-break:break-all;">${data.proposalPrintUrl}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Footer note -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Questions about your payment schedule? Reply to this email or contact <a href="mailto:chance@orcaclub.pro" style="color:#2a6068;text-decoration:none;">chance@orcaclub.pro</a></p>
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

export function generatePaymentScheduleEmailText(data: PaymentScheduleEmailData): string {
  const scheduleText = data.entries.map((e, i) =>
    `  ${i + 1}. ${e.label} — ${fmtUsd(e.amount)}${e.dueDate ? ` — Due ${fmtDueDate(e.dueDate)}` : ''}`
  ).join('\n')

  return `
ORCACLUB — Payment Schedule
${data.packageName}

Hello${data.customerName ? ` ${data.customerName}` : ''},

Your payment schedule for Package: ${data.packageName} has been created.

PAYMENT SCHEDULE:
${scheduleText}

TOTAL: ${fmtUsd(data.totalAmount)} USD

---
${data.proposalPrintUrl ? `View your proposal and payment schedule:\n${data.proposalPrintUrl}\n\n` : ''}Questions? Reply to this email or contact chance@orcaclub.pro

---
© 2025 ORCACLUB. Technical Operations Development Studio.
  `.trim()
}

export async function sendPaymentScheduleEmail(
  payload: Payload,
  data: PaymentScheduleEmailData,
): Promise<void> {
  try {
    await payload.sendEmail({
      to: data.customerEmail,
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
      subject: `Payment Schedule | ORCACLUB`,
      html: generatePaymentScheduleEmail(data),
      text: generatePaymentScheduleEmailText(data),
    })
    payload.logger.info(`[PaymentSchedule] Sent to ${data.customerEmail} for ${data.packageName}`)
  } catch (error) {
    payload.logger.error(`[PaymentSchedule] Failed to send:`, error)
  }
}

// ─── Proposal Email ────────────────────────────────────────────────────────────

export function generateProposalEmail(data: ProposalEmailData): string {
  const lineItemRows = data.lineItems.map(item => {
    const qty = item.quantity ?? 1
    const total = item.price * qty
    const recurringLabel = item.isRecurring ? `<div class="oc-detail-key" style="color:#3a3a3a;font-size:11px;margin-top:2px;">per ${item.recurringInterval ?? 'month'}</div>` : ''
    return `
    <tr>
      <td class="oc-item-divider" style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
        <div class="oc-item-name" style="color:#cccccc;font-size:13px;font-weight:400;">${item.name}</div>
        ${recurringLabel}
      </td>
      <td class="oc-item-divider oc-item-total" style="padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#cccccc;font-size:13px;font-weight:600;width:100px;">${fmtUsd(total)}${item.isRecurring ? `<span class="oc-detail-key" style="color:#3a3a3a;font-size:11px;font-weight:400;">/${item.recurringInterval ?? 'mo'}</span>` : ''}</td>
    </tr>`
  }).join('')

  const totalsHtml = [
    data.totalOneTime > 0 ? `<div class="oc-detail-val" style="font-size:12px;color:#555555;margin-bottom:4px;">One-time: <span class="oc-item-total" style="color:#cccccc;font-weight:600;">${fmtUsd(data.totalOneTime)}</span></div>` : '',
    data.totalMonthly > 0 ? `<div class="oc-detail-val" style="font-size:12px;color:#555555;margin-bottom:4px;">Monthly: <span class="oc-item-total" style="color:#cccccc;font-weight:600;">${fmtUsd(data.totalMonthly)}/mo</span></div>` : '',
    data.totalAnnual > 0 ? `<div class="oc-detail-val" style="font-size:12px;color:#555555;margin-bottom:4px;">Annual: <span class="oc-item-total" style="color:#cccccc;font-weight:600;">${fmtUsd(data.totalAnnual)}/yr</span></div>` : '',
  ].filter(Boolean).join('')

  const scheduleHtml = data.paymentSchedule && data.paymentSchedule.length > 0 ? `
  <!-- Payment Schedule -->
  <tr>
    <td style="padding:16px 40px 0 40px;">
      <p class="oc-eyebrow" style="margin:0 0 10px 0;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Payment Schedule</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;">
        <tr>
          <td style="padding:16px 20px;">
            ${data.paymentSchedule.map((e, i) => {
              const dueStr = e.dueDate ? fmtDueDate(e.dueDate) : null
              return `<div style="display:flex;justify-content:space-between;padding:8px 0;${i > 0 ? 'border-top:1px solid #1a1a1a;' : ''}">
                <div class="oc-detail-val" style="font-size:12px;color:#888888;">${e.label}${dueStr ? `<span class="oc-detail-key" style="color:#444444;font-size:11px;"> · ${dueStr}</span>` : ''}</div>
                <div class="oc-item-total" style="font-size:12px;color:#cccccc;font-weight:600;">${fmtUsd(e.amount)}</div>
              </div>`
            }).join('')}
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposal — ${data.packageName} — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
  ${EMAIL_LIGHT_MODE_STYLES}
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" class="oc-card" style="max-width:560px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header -->
          <tr>
            <td class="oc-header-td" style="padding:28px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Proposal</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <p class="oc-eyebrow" style="margin:0 0 10px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Proposal</p>
              <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">${data.packageName}</p>
              ${data.coverMessage ? `<p class="oc-body-text" style="margin:14px 0 0 0;font-size:13px;color:#666666;line-height:1.8;font-weight:300;font-style:italic;">&ldquo;${data.coverMessage}&rdquo;</p>` : data.packageDescription ? `<p class="oc-body-text" style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">${data.packageDescription}</p>` : ''}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line Items -->
          <tr>
            <td style="padding:16px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;">
                <tr>
                  <td style="padding:20px 20px 0 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <thead>
                        <tr>
                          <th style="text-align:left;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;">Service</th>
                          <th style="text-align:right;font-size:9px;font-weight:400;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.35em;padding-bottom:12px;width:100px;">Total</th>
                        </tr>
                      </thead>
                      <tbody>${lineItemRows}</tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="oc-footer-note-td" style="padding:16px 20px;border-top:1px solid #1a1a1a;">
                    ${totalsHtml}
                    ${data.totalOneTime > 0 ? `<div style="margin-top:8px;font-size:18px;font-weight:700;color:#67e8f9;">${fmtUsd(data.totalOneTime)} <span class="oc-total-label" style="font-size:11px;font-weight:400;color:#3a3a3a;">USD</span></div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${scheduleHtml}

          ${data.proposalPrintUrl ? `
          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${data.proposalPrintUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">View Proposal</a>
                  </td>
                </tr>
              </table>
              <p class="oc-muted" style="margin:10px 0 0 0;font-size:11px;color:#2e2e2e;word-break:break-all;">${data.proposalPrintUrl}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Footer note -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Questions about this proposal? Reply to this email or contact <a href="mailto:chance@orcaclub.pro" style="color:#2a6068;text-decoration:none;">chance@orcaclub.pro</a></p>
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

export function generateProposalEmailText(data: ProposalEmailData): string {
  const lineItemsText = data.lineItems.map(item => {
    const qty = item.quantity ?? 1
    const recurring = item.isRecurring ? ` (per ${item.recurringInterval ?? 'month'})` : ''
    return `  - ${item.name}${recurring}: ${fmtUsd(item.price * qty)}`
  }).join('\n')

  const scheduleText = data.paymentSchedule && data.paymentSchedule.length > 0
    ? `\nPAYMENT SCHEDULE:\n${data.paymentSchedule.map((e, i) => {
        const dueStr = e.dueDate ? fmtDueDate(e.dueDate) : null
        return `  ${i + 1}. ${e.label} — ${fmtUsd(e.amount)}${dueStr ? ` — Due ${dueStr}` : ''}`
      }).join('\n')}\n`
    : ''

  return `
ORCACLUB — Proposal
${data.packageName}

Hello${data.recipientName ? ` ${data.recipientName}` : ''},

${data.coverMessage ? `"${data.coverMessage}"\n\n` : data.packageDescription ? `${data.packageDescription}\n\n` : ''}WHAT'S INCLUDED:
${lineItemsText}
${data.totalOneTime > 0 ? `\nOne-time Total: ${fmtUsd(data.totalOneTime)} USD` : ''}${data.totalMonthly > 0 ? `\nMonthly: ${fmtUsd(data.totalMonthly)}/mo` : ''}${data.totalAnnual > 0 ? `\nAnnual: ${fmtUsd(data.totalAnnual)}/yr` : ''}
${scheduleText}
---
${data.proposalPrintUrl ? `View your full proposal:\n${data.proposalPrintUrl}\n\n` : ''}Questions? Reply to this email or contact chance@orcaclub.pro

---
© 2025 ORCACLUB. Technical Operations Development Studio.
  `.trim()
}

export async function sendProposalEmailToAddresses(
  payload: Payload,
  data: ProposalEmailData,
  emails: string[],
  attachments?: EmailAttachment[],
): Promise<{ success: boolean; sent: number; errors: string[] }> {
  const errors: string[] = []
  let sent = 0
  for (const email of emails) {
    const recipient = email.trim()
    if (!recipient) continue
    try {
      await payload.sendEmail({
        to: recipient,
        from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
        subject: `Proposal: ${data.packageName} — ORCACLUB`,
        html: generateProposalEmail({ ...data, recipientEmail: recipient }),
        text: generateProposalEmailText({ ...data, recipientEmail: recipient }),
        ...(attachments?.length ? { attachments } : {}),
      } as any)
      sent++
      payload.logger.info(`[Proposal] Sent to ${recipient} for ${data.packageName}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`${recipient}: ${msg}`)
      payload.logger.error(`[Proposal] Failed to send to ${recipient}:`, error)
    }
  }
  return { success: sent > 0, sent, errors }
}
