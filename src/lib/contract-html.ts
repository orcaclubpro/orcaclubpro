import { SERVICE_AGREEMENT_TERMS } from './contract-terms'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Escape HTML special characters in user-supplied text. */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Format a number as USD currency. */
function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

/** Parse YYYY-MM-DD as a local date to avoid UTC-shift display issues. */
function fmtScheduleDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const parts = iso.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return '—'
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  if (!isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a complete <!DOCTYPE html> string that matches the print page layout.
 * @param pkg A fully-populated package document (depth: 1, so clientAccount is an object).
 */
export function generateContractHTML(pkg: any): string {
  // ── Extract data ────────────────────────────────────────────────────────────

  const lineItems: Array<{
    id?: string
    name: string
    description?: string | null
    price: number
    adjustedPrice?: number | null
    quantity?: number
    isRecurring?: boolean
    recurringInterval?: 'month' | 'year'
  }> = pkg.lineItems ?? []

  const paymentSchedule: Array<{
    id?: string
    label: string
    amount: number
    dueDate?: string | null
    orderId?: string | null
  }> = pkg.paymentSchedule ?? []

  const clientAccount = pkg.clientAccount
  const clientName    = clientAccount && typeof clientAccount === 'object' ? clientAccount.name    ?? '' : ''
  const clientCompany = clientAccount && typeof clientAccount === 'object' ? clientAccount.company ?? '' : ''
  const clientEmail   = clientAccount && typeof clientAccount === 'object' ? clientAccount.email   ?? '' : ''
  const clientPhone   = clientAccount && typeof clientAccount === 'object' ? clientAccount.phone   ?? '' : ''
  const clientAddress = clientAccount && typeof clientAccount === 'object' ? clientAccount.address ?? null : null

  const clientSig   = pkg.clientSignature ?? null
  const orcaclubSig = pkg.orcaclubSignature ?? null
  const isSigned    = !!clientSig?.signedAt

  const proposalDate = new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(pkg.createdAt))

  const ref = `PKG-${String(pkg.id).slice(-6).toUpperCase()}`

  // ── Totals ──────────────────────────────────────────────────────────────────

  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const qty = item.quantity ?? 1
    const total = (item.adjustedPrice ?? item.price ?? 0) * qty
    if (item.isRecurring) {
      item.recurringInterval === 'year' ? (annual += total) : (monthly += total)
    } else {
      oneTime += total
    }
  }

  // ── Section builders ────────────────────────────────────────────────────────

  // HEADER
  const headerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
      <div>
        <span class="gothic" style="font-size:18px;color:#111;letter-spacing:0.04em;">ORCACLUB</span>
        <p style="font-size:10px;color:#9ca3af;letter-spacing:0.18em;text-transform:uppercase;margin-top:3px;">
          Technical Operations Development Studio
        </p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:11px;font-weight:600;color:#6b7280;letter-spacing:0.12em;text-transform:uppercase;">Proposal</p>
        <p style="font-size:13px;color:#111;font-weight:600;margin-top:2px;">${esc(ref)}</p>
        <p style="font-size:11px;color:#9ca3af;margin-top:2px;">${esc(proposalDate)}</p>
      </div>
    </div>`

  // DIVIDER
  const dividerHTML = `<div style="height:1px;background:#e5e7eb;margin-bottom:32px;"></div>`

  // BILL TO / PACKAGE NAME
  const hasClientInfo = !!(clientName || clientCompany || clientEmail || clientPhone || clientAddress)

  const billToHTML = hasClientInfo ? `
    <div>
      <p style="font-size:10px;font-weight:600;color:#9ca3af;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:6px;">Bill To</p>
      ${clientName ? `<p style="font-size:14px;font-weight:700;color:#111;">${esc(clientName)}</p>` : ''}
      ${clientCompany ? `<p style="font-size:12px;color:#6b7280;margin-top:2px;">${esc(clientCompany)}</p>` : ''}
      ${clientAddress?.line1 ? `<p style="font-size:12px;color:#6b7280;margin-top:2px;">${esc(clientAddress.line1)}</p>` : ''}
      ${clientAddress?.line2 ? `<p style="font-size:12px;color:#6b7280;margin-top:1px;">${esc(clientAddress.line2)}</p>` : ''}
      ${(clientAddress?.city || clientAddress?.state || clientAddress?.zip) ? `<p style="font-size:12px;color:#6b7280;margin-top:1px;">${esc([clientAddress.city, clientAddress.state, clientAddress.zip].filter(Boolean).join(', '))}</p>` : ''}
      ${clientPhone ? `<p style="font-size:12px;color:#6b7280;margin-top:2px;">${esc(clientPhone)}</p>` : ''}
      ${clientEmail ? `<p style="font-size:12px;color:#6b7280;margin-top:2px;"><a href="mailto:${esc(clientEmail)}" style="color:#6b7280;text-decoration:none;">${esc(clientEmail)}</a></p>` : ''}
    </div>` : ''

  const packageNameAlign = hasClientInfo ? 'right' : 'left'
  const packageNameDescAlign = (clientName || clientCompany) ? 'right' : 'left'

  const packageNameHTML = `
    <div style="text-align:${packageNameAlign};">
      <p style="font-size:20px;font-weight:800;color:#111;letter-spacing:-0.02em;">${esc(pkg.name ?? '')}</p>
      ${pkg.description ? `<p style="font-size:12px;color:#6b7280;margin-top:4px;max-width:280px;line-height:1.5;text-align:${packageNameDescAlign};">${esc(pkg.description)}</p>` : ''}
    </div>`

  const billToSectionHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;">
      ${billToHTML}
      ${packageNameHTML}
    </div>`

  // COVER MESSAGE
  const coverMessageHTML = pkg.coverMessage ? `
    <div style="margin-bottom:32px;padding:16px 20px;background:#f9fafb;border-radius:8px;border-left:3px solid #67e8f9;">
      <p style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${esc(pkg.coverMessage)}</p>
    </div>` : ''

  // LINE ITEMS TABLE
  let lineItemsHTML = ''
  if (lineItems.length > 0) {
    const rowsHTML = lineItems.map((item, i) => {
      const qty = item.quantity ?? 1
      const baseRate = item.price ?? 0
      const unitRate = item.adjustedPrice ?? baseRate
      const total = unitRate * qty
      const baseTotal = baseRate * qty
      const isDiscounted = item.adjustedPrice != null && item.adjustedPrice !== baseRate
      const isLast = i === lineItems.length - 1

      const discountedBadge = isDiscounted ? `
        <span style="font-size:8px;font-weight:700;color:#0891b2;text-transform:uppercase;letter-spacing:0.12em;background:#cffafe;padding:2px 5px;border-radius:3px;border:1px solid #a5f3fc;">
          Discounted
        </span>` : ''

      const recurringBadge = item.isRecurring ? `
        <span style="display:inline-block;margin-top:4px;font-size:9px;font-weight:600;color:#0891b2;text-transform:uppercase;letter-spacing:0.12em;background:#ecfeff;padding:2px 6px;border-radius:4px;">
          ${item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
        </span>` : ''

      const recurringInterval = item.recurringInterval === 'year' ? 'yr' : 'mo'

      const rateStrike = isDiscounted ? `
        <p style="font-size:11px;color:#9ca3af;text-decoration:line-through;font-variant-numeric:tabular-nums;line-height:1.3;">${fmt(baseRate)}</p>` : ''

      const amountStrike = isDiscounted ? `
        <p style="font-size:11px;color:#9ca3af;text-decoration:line-through;font-variant-numeric:tabular-nums;line-height:1.3;">
          ${fmt(baseTotal)}${item.isRecurring ? `<span style="font-size:9px;">/${recurringInterval}</span>` : ''}
        </p>` : ''

      return `
        <div style="display:grid;grid-template-columns:1fr 60px 90px 90px;gap:8px;padding:12px 12px;border-bottom:${isLast ? 'none' : '1px solid #f3f4f6'};align-items:start;background:${isDiscounted ? '#f0fdff' : 'transparent'};">
          <div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <p style="font-size:13px;font-weight:600;color:#111;line-height:1.3;">${esc(item.name)}</p>
              ${discountedBadge}
            </div>
            ${item.description ? `<p style="font-size:11px;color:#6b7280;margin-top:3px;line-height:1.55;white-space:pre-line;">${esc(item.description)}</p>` : ''}
            ${recurringBadge}
          </div>
          <p style="font-size:13px;color:#6b7280;text-align:center;padding-top:1px;">${qty}</p>
          <div style="text-align:right;padding-top:1px;">
            ${rateStrike}
            <p style="font-size:13px;color:${isDiscounted ? '#0891b2' : '#6b7280'};font-variant-numeric:tabular-nums;font-weight:${isDiscounted ? '600' : '400'};">${fmt(unitRate)}</p>
          </div>
          <div style="text-align:right;padding-top:1px;">
            ${amountStrike}
            <p style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:${isDiscounted ? '#0891b2' : '#111'};">
              ${fmt(total)}${item.isRecurring ? `<span style="font-size:10px;font-weight:400;color:#9ca3af;">/${recurringInterval}</span>` : ''}
            </p>
          </div>
        </div>`
    }).join('')

    lineItemsHTML = `
      <div style="margin-bottom:28px;">
        <div style="display:grid;grid-template-columns:1fr 60px 90px 90px;gap:8px;padding:8px 12px;background:#f3f4f6;border-radius:6px 6px 0 0;">
          <p style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;">Item</p>
          <p style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;text-align:center;">Qty</p>
          <p style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;text-align:right;">Rate</p>
          <p style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;text-align:right;">Amount</p>
        </div>
        ${rowsHTML}
        <div style="height:1px;background:#e5e7eb;"></div>
      </div>`
  }

  // TOTALS
  let totalsHTML = ''
  if (oneTime > 0 || monthly > 0 || annual > 0) {
    const oneTimeRow = oneTime > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
        <span style="color:#6b7280;">Subtotal (one-time)</span>
        <span style="font-weight:600;color:#111;font-variant-numeric:tabular-nums;">${fmt(oneTime)}</span>
      </div>` : ''

    const monthlyRow = monthly > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
        <span style="color:#6b7280;">Monthly recurring</span>
        <span style="font-weight:600;color:#0891b2;font-variant-numeric:tabular-nums;">${fmt(monthly)}<span style="font-size:10px;font-weight:400;color:#9ca3af;">/mo</span></span>
      </div>` : ''

    const annualRow = annual > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
        <span style="color:#6b7280;">Annual recurring</span>
        <span style="font-weight:600;color:#0891b2;font-variant-numeric:tabular-nums;">${fmt(annual)}<span style="font-size:10px;font-weight:400;color:#9ca3af;">/yr</span></span>
      </div>` : ''

    const totalDueRow = oneTime > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:4px;border-top:1px solid #e5e7eb;font-size:14px;">
        <span style="font-weight:700;color:#111;">Total due</span>
        <span style="font-weight:800;color:#111;font-variant-numeric:tabular-nums;">${fmt(oneTime)}</span>
      </div>` : ''

    totalsHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
        <div style="width:240px;border-top:1px solid #e5e7eb;padding-top:12px;">
          ${oneTimeRow}
          ${monthlyRow}
          ${annualRow}
          ${totalDueRow}
        </div>
      </div>`
  }

  // PAYMENT SCHEDULE or SINGLE PAYMENT TERMS
  let paymentSectionHTML = ''
  if (paymentSchedule.length > 0) {
    const schedTotal = paymentSchedule.reduce((s, e) => s + (e.amount ?? 0), 0)

    const schedRowsHTML = paymentSchedule.map((entry, i) => {
      const isLast = i === paymentSchedule.length - 1
      const isInvoiced = !!entry.orderId

      const invoicedBadge = isInvoiced ? `
        <span style="font-size:9px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:0.1em;background:#ecfdf5;padding:2px 6px;border-radius:4px;border:1px solid #a7f3d0;">
          Invoiced
        </span>` : ''

      return `
        <div style="display:grid;grid-template-columns:1fr 110px 130px;gap:8px;padding:10px 12px;border-bottom:${isLast ? 'none' : '1px solid #f3f4f6'};align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <p style="font-size:13px;font-weight:500;color:#111;">${esc(entry.label)}</p>
            ${invoicedBadge}
          </div>
          <p style="font-size:13px;font-weight:600;color:#111;text-align:right;font-variant-numeric:tabular-nums;">${fmt(entry.amount)}</p>
          <p style="font-size:12px;color:${entry.dueDate ? '#6b7280' : '#d1d5db'};text-align:right;">${fmtScheduleDate(entry.dueDate)}</p>
        </div>`
    }).join('')

    paymentSectionHTML = `
      <div style="margin-bottom:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:12px;">Payment Schedule</p>
        <div style="display:grid;grid-template-columns:1fr 110px 130px;gap:8px;padding:6px 12px;background:#f3f4f6;border-radius:6px 6px 0 0;">
          <p style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;">Payment</p>
          <p style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;text-align:right;">Amount</p>
          <p style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;text-align:right;">Due Date</p>
        </div>
        ${schedRowsHTML}
        <div style="height:1px;background:#e5e7eb;margin-top:2px;"></div>
        <div style="display:flex;justify-content:space-between;padding:10px 12px 0;font-size:13px;">
          <span style="font-weight:700;color:#111;">Total</span>
          <span style="font-weight:800;color:#111;font-variant-numeric:tabular-nums;">${fmt(schedTotal)}</span>
        </div>
        <p style="font-size:11px;color:#9ca3af;margin-top:10px;line-height:1.6;">
          Each payment will be invoiced individually on or before its due date. You will receive a separate invoice link for each installment.
        </p>
      </div>`
  } else if (oneTime > 0) {
    paymentSectionHTML = `
      <div style="margin-bottom:32px;padding-top:20px;border-top:1px solid #f3f4f6;">
        <p style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:8px;">Payment Terms</p>
        <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 16px;background:#f9fafb;border-radius:8px;">
          <div>
            <p style="font-size:13px;font-weight:600;color:#111;margin-bottom:3px;">Single invoice — ${fmt(oneTime)}</p>
            <p style="font-size:12px;color:#6b7280;line-height:1.6;">
              A single invoice for the full amount will be issued upon project commencement. Payment is due within the timeframe specified on the invoice.
            </p>
          </div>
        </div>
      </div>`
  }

  // NOTES
  const notesHTML = pkg.notes ? `
    <div style="margin-bottom:32px;padding-top:20px;border-top:1px solid #f3f4f6;">
      <p style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:8px;">Notes</p>
      <p style="font-size:12px;color:#4b5563;line-height:1.7;white-space:pre-wrap;">${esc(pkg.notes)}</p>
    </div>` : ''

  // SERVICE AGREEMENT TERMS
  const termsHTML = `
    <div style="margin-bottom:32px;padding-top:20px;border-top:1px solid #f3f4f6;">
      <p style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:10px;">
        Service Agreement Terms &amp; Conditions
      </p>
      <p style="font-size:10px;color:#9ca3af;line-height:1.7;white-space:pre-line;">${esc(SERVICE_AGREEMENT_TERMS)}</p>
    </div>`

  // SIGNATURE BLOCK — Client column
  let clientSigHTML: string
  if (isSigned) {
    const signedDate = new Date(clientSig.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const signedTime = new Date(clientSig.signedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    const clientDisplayLine = esc(clientName) + (clientCompany ? ` — ${esc(clientCompany)}` : '')
    const docHashDisplay = clientSig.documentHash ? esc(String(clientSig.documentHash).slice(0, 16)) + '...' : ''

    clientSigHTML = `
      <p class="sig-font" style="font-size:26px;color:#111;border-bottom:1px solid #111;padding-bottom:4px;margin-bottom:8px;line-height:1.2;">
        ${esc(clientSig.typedName)}
      </p>
      <p style="font-size:12px;color:#374151;font-weight:600;margin-bottom:2px;">${esc(clientSig.typedName)}</p>
      <p style="font-size:11px;color:#6b7280;margin-bottom:2px;">${clientDisplayLine}</p>
      <p style="font-size:11px;color:#6b7280;margin-bottom:2px;">${esc(clientSig.signedByEmail)}</p>
      <p style="font-size:11px;color:#6b7280;margin-bottom:8px;">Signed: ${esc(signedDate)} at ${esc(signedTime)} UTC</p>
      <p style="font-size:9px;color:#9ca3af;font-family:monospace;">IP: ${esc(clientSig.ipAddress)}</p>
      <p style="font-size:9px;color:#9ca3af;font-family:monospace;">Doc hash: ${docHashDisplay}</p>
      <p style="font-size:9px;color:#9ca3af;margin-top:4px;">ESIGN Act compliant — typed name consent</p>`
  } else {
    clientSigHTML = `
      <div style="border-bottom:1px solid #9ca3af;margin-bottom:8px;height:28px;"></div>
      <p style="font-size:11px;color:#374151;font-weight:500;margin-bottom:2px;">${esc(clientName)}</p>
      ${clientCompany ? `<p style="font-size:11px;color:#6b7280;margin-bottom:2px;">${esc(clientCompany)}</p>` : ''}
      ${clientEmail ? `<p style="font-size:11px;color:#6b7280;margin-bottom:2px;">${esc(clientEmail)}</p>` : ''}
      <p style="font-size:10px;color:#d1d5db;margin-top:8px;font-style:italic;">Awaiting signature</p>`
  }

  // SIGNATURE BLOCK — ORCACLUB column
  let orcaclubSigHTML: string
  if (orcaclubSig?.authorizedAt) {
    const authDate = new Date(orcaclubSig.authorizedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    orcaclubSigHTML = `
      <p class="sig-font" style="font-size:26px;color:#111;border-bottom:1px solid #111;padding-bottom:4px;margin-bottom:8px;line-height:1.2;">
        ${esc(orcaclubSig.authorizedByName)}
      </p>
      <p style="font-size:12px;color:#374151;font-weight:600;margin-bottom:2px;">${esc(orcaclubSig.authorizedByName)}</p>
      <p style="font-size:11px;color:#6b7280;margin-bottom:2px;">ORCACLUB LLC</p>
      <p style="font-size:11px;color:#6b7280;margin-bottom:2px;">${esc(orcaclubSig.authorizedByEmail)}</p>
      <p style="font-size:11px;color:#6b7280;">Authorized: ${esc(authDate)}</p>`
  } else {
    orcaclubSigHTML = `
      <div style="border-bottom:1px solid #9ca3af;margin-bottom:8px;height:28px;"></div>
      <p style="font-size:11px;color:#374151;font-weight:500;margin-bottom:2px;">ORCACLUB LLC</p>
      <p style="font-size:11px;color:#6b7280;margin-bottom:2px;">carbon@orcaclub.pro</p>
      <p style="font-size:10px;color:#d1d5db;margin-top:8px;font-style:italic;">Awaiting authorization</p>`
  }

  const signedFooterNote = isSigned
    ? ` · Signed: ${esc(new Date(clientSig.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}`
    : ''

  const signatureBlockHTML = `
    <div style="margin-bottom:32px;padding-top:20px;border-top:2px solid #111;">
      <p style="font-size:10px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:20px;">
        Agreement Acceptance
      </p>
      <p style="font-size:11px;color:#6b7280;line-height:1.6;margin-bottom:24px;">
        By signing below, the parties agree to be bound by the terms of this Agreement.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
        <div>
          <p style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:12px;">Client</p>
          ${clientSigHTML}
        </div>
        <div>
          <p style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:12px;">ORCACLUB LLC</p>
          ${orcaclubSigHTML}
        </div>
      </div>
      <div style="margin-top:20px;padding-top:12px;border-top:1px solid #f3f4f6;">
        <p style="font-size:9px;color:#9ca3af;">
          Proposal reference: ${esc(ref)} · Created: ${esc(proposalDate)}${signedFooterNote}
        </p>
      </div>
    </div>`

  // FOOTER
  const footerHTML = `
    <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:11px;color:#9ca3af;">orcaclub.pro</span>
      <span style="font-size:11px;color:#9ca3af;">${esc(ref)} · ${esc(proposalDate)}</span>
    </div>`

  // ── Assemble full document ──────────────────────────────────────────────────

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CONTRACT - ${esc(pkg.name ?? '')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; font-family: system-ui, -apple-system, sans-serif; color: #111; }
    .gothic { font-family: 'Cinzel Decorative', serif; font-weight: 700; }
    .sig-font { font-family: 'Dancing Script', cursive; font-weight: 700; }
    @media print {
      @page { size: letter; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div style="max-width:680px;margin:0 auto;padding:56px 48px 64px;">
    ${headerHTML}
    ${dividerHTML}
    ${billToSectionHTML}
    ${coverMessageHTML}
    ${lineItemsHTML}
    ${totalsHTML}
    ${paymentSectionHTML}
    ${notesHTML}
    ${termsHTML}
    ${signatureBlockHTML}
    ${footerHTML}
  </div>
</body>
</html>`
}
