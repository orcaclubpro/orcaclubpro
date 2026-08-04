/**
 * Retainer "Hours & Recap" email — the backward-looking half of a cycle close.
 *
 * Sent alongside the next-month invoice: a short summary of the closing cycle's
 * hours with the full statement + recap deck attached as PDFs. Base-injected
 * (see docs/EMAIL_TEMPLATES.md) so it inherits the dark shell, wordmark, footer,
 * and light-mode overrides. All styles inline — Gmail strips <style>.
 */

import { baseEmailTemplate, baseTextTemplate } from '@/lib/email/templates/base'

export interface RetainerRecapEmailData {
  clientName?: string
  clientCompany?: string | null
  /** Cycle label, e.g. "Jul 10 – Aug 9, 2026". */
  periodLabel: string
  /** Month being recapped, e.g. "July". */
  monthLabel: string
  hoursUsed: number
  hoursPerMonth: number
  overageHours: number
  overageAmount: number
  itemsShipped: number
  buckets: { label: string; hours: number }[]
  /** Optional staff cover note + recap headline. */
  customMessage?: string
  headline?: string
  /** What's attached — drives the closing line. */
  hasStatement: boolean
  hasRecap: boolean
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}
function fmtHrs(n: number) {
  return String(Math.round((n ?? 0) * 100) / 100)
}

export function retainerRecapEmailSubject(d: RetainerRecapEmailData): string {
  return `${d.monthLabel} Retainer — Hours & Recap — ORCACLUB`
}

export function generateRetainerRecapEmail(d: RetainerRecapEmailData): string {
  const greetName = d.clientName ? esc(d.clientName.split(' ')[0]) : 'there'

  const attachedList = [d.hasStatement ? 'the full hour-log statement' : null, d.hasRecap ? 'your monthly recap' : null]
    .filter(Boolean)
    .join(' and ')

  // Row: a labelled stat inside the detail box.
  const statRow = (label: string, value: string, accent = false) => `
              <tr>
                <td class="oc-detail-key" style="padding:6px 0;font-size:13px;color:#3a3a3a;">${label}</td>
                <td class="oc-detail-val" style="padding:6px 0;font-size:13px;color:${accent ? '#67e8f9' : '#555555'};text-align:right;font-weight:${accent ? '600' : '400'};">${value}</td>
              </tr>`

  const bucketRows = d.buckets
    .filter((b) => b.hours > 0)
    .map((b) => statRow(esc(b.label), `${fmtHrs(b.hours)}h`))
    .join('')

  const content = `
    <tr>
      <td style="padding:0;">
        <p class="oc-eyebrow" style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">${esc(d.monthLabel)} Retainer</p>
        <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Hours &amp; recap</p>
        <p class="oc-detail-val" style="margin:8px 0 0 0;font-size:12px;color:#555555;line-height:1.6;">${esc(d.periodLabel)}</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
          <tr><td class="oc-hairline" style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:28px 0 0 0;">
        <p class="oc-body-text" style="margin:0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Hi ${greetName},</p>
        <p class="oc-body-text" style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">${
          d.customMessage?.trim()
            ? esc(d.customMessage.trim())
            : `Here&rsquo;s a recap of your ${esc(d.monthLabel)} retainer cycle.${d.headline ? ` ${esc(d.headline)}` : ''}`
        }</p>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 0 0 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box-lborder" style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;">
          <tr>
            <td style="padding:16px 20px;">
              <p class="oc-detail-label" style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">At a glance</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${statRow('Hours used', `${fmtHrs(d.hoursUsed)} / ${fmtHrs(d.hoursPerMonth)}`)}
                ${statRow('Items shipped', String(d.itemsShipped))}
                ${d.overageHours > 0 ? statRow('Overage', `${fmtHrs(d.overageHours)}h · ${fmtUsd(d.overageAmount)}`, true) : ''}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${
      bucketRows
        ? `
    <tr>
      <td style="padding:16px 0 0 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;">
          <tr>
            <td style="padding:16px 20px;">
              <p class="oc-detail-label" style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Where the hours went</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">${bucketRows}</table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
        : ''
    }

    <tr>
      <td style="padding:28px 0 8px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="oc-footer-note-td" style="border-top:1px solid #0f0f0f;padding-top:24px;">
              <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">${
                attachedList
                  ? `Attached: ${attachedList} as ${d.hasStatement && d.hasRecap ? 'PDFs' : 'a PDF'}. `
                  : ''
              }Questions? Reply to this email or contact <a href="mailto:chance@orcaclub.pro" style="color:#3a5a5e;text-decoration:none;">chance@orcaclub.pro</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`

  return baseEmailTemplate({ content })
}

export function generateRetainerRecapEmailText(d: RetainerRecapEmailData): string {
  const greetName = d.clientName ? d.clientName.split(' ')[0] : 'there'
  const buckets = d.buckets.filter((b) => b.hours > 0)
  const attachedList = [d.hasStatement ? 'the full hour-log statement' : null, d.hasRecap ? 'your monthly recap' : null]
    .filter(Boolean)
    .join(' and ')

  const content = `${d.monthLabel.toUpperCase()} RETAINER — HOURS & RECAP
${d.periodLabel}

Hi ${greetName},

${
    d.customMessage?.trim()
      ? d.customMessage.trim()
      : `Here's a recap of your ${d.monthLabel} retainer cycle.${d.headline ? ` ${d.headline}` : ''}`
  }

AT A GLANCE
━━━━━━━━━━━━━━━━━━━━
Hours used: ${fmtHrs(d.hoursUsed)} / ${fmtHrs(d.hoursPerMonth)}
Items shipped: ${d.itemsShipped}${d.overageHours > 0 ? `\nOverage: ${fmtHrs(d.overageHours)}h · ${fmtUsd(d.overageAmount)}` : ''}
${
    buckets.length
      ? `\nWHERE THE HOURS WENT\n━━━━━━━━━━━━━━━━━━━━\n${buckets.map((b) => `${b.label}: ${fmtHrs(b.hours)}h`).join('\n')}\n`
      : ''
  }
${attachedList ? `Attached: ${attachedList}.\n\n` : ''}Questions? Reply to this email or contact chance@orcaclub.pro`

  return baseTextTemplate({ content })
}
