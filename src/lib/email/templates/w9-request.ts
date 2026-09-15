import { baseEmailTemplate, baseTextTemplate } from './base'
import { BRAND_NAME, BRAND_SIGNOFF } from '@/lib/brand'

// ─── W-9 request ──────────────────────────────────────────────────────────────
// The counterpart to `w9-delivery`. That one sends ORCACLUB's completed form to
// a client who asked for it; this one sends a BLANK, fillable form to someone
// ORCACLUB has to pay — a contractor, affiliate, or referral partner — who has
// to furnish theirs before a payment or a 1099 can go out.
//
// The note has to do one job the delivery note does not: tell a person who has
// never filled a W-9 what to do with the attachment. Hence the numbered steps.
//
// It asks for the completed form by reply. Nothing about a returned W-9 is
// stored — no upload link, no portal page, no collection — so the reply-to on
// the send is the staff member who asked, and the form lives in their inbox.
// A taxpayer identification number never belongs in an email body either way,
// so the copy explicitly steers it into the attachment.

export interface W9RequestEmailData {
  /** Who has to complete it. */
  recipientName: string
  /** Where the completed form should come back to — the sender's address. */
  replyTo: string
  /** Optional note from the sender. Plain text; rendered escaped. */
  message?: string
  /** The attached filename, so the body and the attachment agree. */
  filename: string
  /** Line 7 as it was pre-filled, when there is one — the engagement reference. */
  reference?: string
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function w9RequestSubject(): string {
  return `Form W-9 requested by ${BRAND_NAME}`
}

const STEPS = [
  'Open the attached PDF in Preview, Acrobat Reader, or any PDF app.',
  'Fill in your name, tax classification, address, and TIN. The boxes are live — you can type straight into them.',
  'Type your name and the date on the “Sign Here” line at the bottom of page 1.',
  'Save it and reply to this email with the completed form attached.',
]

export function w9RequestHTML(data: W9RequestEmailData): string {
  const steps = STEPS.map(
    (step, i) => `
          <tr>
            <td width="24" valign="top" style="padding:0 10px 10px 0;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#67e8f9;line-height:1.6;">${i + 1}.</p>
            </td>
            <td valign="top" style="padding:0 0 10px 0;">
              <p class="oc-body" style="margin:0;font-size:14px;line-height:1.6;color:#555555;">${step}</p>
            </td>
          </tr>`,
  ).join('')

  const content = `
    <tr>
      <td style="padding:32px 40px 8px 40px;">
        <p class="oc-eyebrow" style="margin:0 0 10px 0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#4a4a4a;">Tax document</p>
        <h1 class="oc-heading" style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">We need your Form W-9</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0 40px;">
        <p class="oc-body" style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#555555;">
          Hi ${escape(data.recipientName)}, before ${BRAND_NAME} can pay you we need a completed
          Form W-9 on file. A blank one is attached, already filled in with our details as the
          requester — everything else is yours to complete.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 24px 40px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${steps}
        </table>
      </td>
    </tr>
    ${data.reference?.trim() ? `
    <tr>
      <td style="padding:0 40px 24px 40px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="oc-detail-box-lborder" style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;border-radius:6px;padding:14px 16px;">
              <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#3a3a3a;">Already on line 7</p>
              <p class="oc-body" style="margin:0 0 12px 0;font-size:14px;color:#888888;">${escape(data.reference.trim())}</p>
              <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#3a3a3a;">Attached</p>
              <p class="oc-body" style="margin:0;font-size:14px;color:#888888;">${escape(data.filename)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : `
    <tr>
      <td style="padding:0 40px 24px 40px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="oc-detail-box-lborder" style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;border-radius:6px;padding:14px 16px;">
              <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#3a3a3a;">Attached</p>
              <p class="oc-body" style="margin:0;font-size:14px;color:#888888;">${escape(data.filename)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`}
    ${data.message?.trim() ? `
    <tr>
      <td style="padding:0 40px 24px 40px;">
        <p class="oc-body" style="margin:0;font-size:14px;line-height:1.6;color:#555555;white-space:pre-line;">${escape(data.message.trim())}</p>
      </td>
    </tr>` : ''}
    <tr>
      <td style="padding:0 40px 32px 40px;">
        <p class="oc-body" style="margin:0;font-size:13px;line-height:1.6;color:#2e2e2e;">
          Please send the number on the form itself rather than typing it into an email —
          replies get forwarded and quoted. Anything unclear, reply to
          ${escape(data.replyTo)} and we will walk you through it.
        </p>
      </td>
    </tr>
  `
  return baseEmailTemplate({ content })
}

export function w9RequestText(data: W9RequestEmailData): string {
  const content = [
    `Hi ${data.recipientName}, before ${BRAND_NAME} can pay you we need a completed Form W-9`,
    'on file. A blank one is attached, already filled in with our details as the',
    'requester — everything else is yours to complete.',
    '',
    ...STEPS.map((step, i) => `${i + 1}. ${step}`),
    '',
    ...(data.reference?.trim() ? [`Already on line 7: ${data.reference.trim()}`] : []),
    `Attached: ${data.filename}`,
    ...(data.message?.trim() ? ['', data.message.trim()] : []),
    '',
    'Please send the number on the form itself rather than typing it into an email —',
    `replies get forwarded and quoted. Anything unclear, reply to ${data.replyTo}`,
    'and we will walk you through it.',
    '',
    BRAND_SIGNOFF,
  ].join('\n')
  return baseTextTemplate({ content })
}
