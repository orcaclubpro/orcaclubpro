import { baseEmailTemplate, baseTextTemplate } from './base'
import { BRAND_NAME, BRAND_SIGNOFF } from '@/lib/brand'

// ─── W-9 delivery ─────────────────────────────────────────────────────────────
// Sent to a client who has asked for ORCACLUB's W-9 before they can pay an
// invoice or file a 1099. The form rides along as a PDF attachment; this note
// only says what arrived and who it is from.
//
// It carries no taxpayer identification number, no download link, and no
// account detail. A TIN belongs in the attachment a requester asked for — never
// in the body of an email, which is forwarded, quoted, and indexed.

export interface W9DeliveryData {
  /** Who asked — the client account or contact name. */
  recipientName: string
  /** Legal name on line 1, so the requester can match it to their vendor record. */
  legalName: string
  /** Optional note from the sender. Plain text; rendered escaped. */
  message?: string
  /** The attached filename, named so the body and the attachment agree. */
  filename: string
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function w9DeliverySubject(): string {
  return `Form W-9 from ${BRAND_NAME}`
}

export function w9DeliveryHTML(data: W9DeliveryData): string {
  const content = `
    <tr>
      <td style="padding:32px 40px 8px 40px;">
        <p class="oc-eyebrow" style="margin:0 0 10px 0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#4a4a4a;">Tax document</p>
        <h1 class="oc-heading" style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Form W-9</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0 40px;">
        <p class="oc-body" style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#555555;">
          Hi ${escape(data.recipientName)}, our completed Form W-9 is attached for your records.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 24px 40px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="oc-detail-box-lborder" style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;border-radius:6px;padding:14px 16px;">
              <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#3a3a3a;">Name on line 1</p>
              <p class="oc-body" style="margin:0 0 12px 0;font-size:14px;color:#888888;">${escape(data.legalName)}</p>
              <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#3a3a3a;">Attached</p>
              <p class="oc-body" style="margin:0;font-size:14px;color:#888888;">${escape(data.filename)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${data.message?.trim() ? `
    <tr>
      <td style="padding:0 40px 24px 40px;">
        <p class="oc-body" style="margin:0;font-size:14px;line-height:1.6;color:#555555;white-space:pre-line;">${escape(data.message.trim())}</p>
      </td>
    </tr>` : ''}
    <tr>
      <td style="padding:0 40px 32px 40px;">
        <p class="oc-body" style="margin:0;font-size:13px;line-height:1.6;color:#2e2e2e;">
          The form carries a taxpayer identification number. Please store it somewhere your
          accounts team controls, and reply here if you need anything corrected.
        </p>
      </td>
    </tr>
  `
  return baseEmailTemplate({ content })
}

export function w9DeliveryText(data: W9DeliveryData): string {
  const content = [
    `Hi ${data.recipientName}, our completed Form W-9 is attached for your records.`,
    '',
    `Name on line 1: ${data.legalName}`,
    `Attached: ${data.filename}`,
    ...(data.message?.trim() ? ['', data.message.trim()] : []),
    '',
    'The form carries a taxpayer identification number. Please store it somewhere your',
    'accounts team controls, and reply here if you need anything corrected.',
    '',
    BRAND_SIGNOFF,
  ].join('\n')
  return baseTextTemplate({ content })
}
