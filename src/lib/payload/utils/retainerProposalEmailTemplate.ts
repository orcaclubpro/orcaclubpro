/**
 * Retainer "Proposal" email — the priced offer, sent BEFORE the retainer starts.
 *
 * Pairs with the proposal PDF (buildRetainerProposalPdf): the email states the plan
 * and what it is based on, the attachment carries the itemized work. Base-injected
 * (see docs/EMAIL_TEMPLATES.md) so it inherits the dark shell, wordmark, footer, and
 * light-mode overrides. All styles inline — Gmail strips <style>.
 */

import { baseEmailTemplate, baseTextTemplate } from '@/lib/email/templates/base'

export interface RetainerProposalEmailData {
  clientName?: string
  clientCompany?: string | null
  /** Tier display label, e.g. "Growth". */
  tierLabel: string
  monthlyFee: number
  hoursPerMonth: number
  overageRate: number
  /** Long-form proposed start, e.g. "September 1, 2026", or null if undecided. */
  startLabel?: string | null
  scopeSummary?: string | null
  /** Hours already delivered during scoping, and the recurring monthly estimate. */
  completedHours: number
  plannedHours: number
  includesCompletedWork?: boolean
  /** Staff cover note replacing the default intro line. */
  customMessage?: string
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

export function retainerProposalEmailSubject(d: RetainerProposalEmailData): string {
  return `Your ${d.tierLabel} Retainer Proposal — ORCACLUB`
}

export function generateRetainerProposalEmail(d: RetainerProposalEmailData): string {
  const greetName = d.clientName ? esc(d.clientName.split(' ')[0]) : 'there'

  const statRow = (label: string, value: string, accent = false) => `
              <tr>
                <td class="oc-detail-key" style="padding:6px 0;font-size:13px;color:#3a3a3a;">${label}</td>
                <td class="oc-detail-val" style="padding:6px 0;font-size:13px;color:${accent ? '#67e8f9' : '#555555'};text-align:right;font-weight:${accent ? '600' : '400'};">${value}</td>
              </tr>`

  const intro = d.customMessage?.trim()
    ? esc(d.customMessage.trim())
    : `Here&rsquo;s the retainer proposal we put together${
        d.completedHours > 0 ? ', based on the work we&rsquo;ve already done together' : ''
      }. The full breakdown is attached as a PDF.`

  const content = `
    <tr>
      <td style="padding:0;">
        <p class="oc-eyebrow" style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Retainer Proposal</p>
        <p class="oc-heading" style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">${esc(d.tierLabel)} retainer</p>
        <p class="oc-detail-val" style="margin:8px 0 0 0;font-size:12px;color:#555555;line-height:1.6;">${fmtUsd(d.monthlyFee)}/mo &middot; ${fmtHrs(d.hoursPerMonth)} hrs per month</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
          <tr><td class="oc-hairline" style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:28px 0 0 0;">
        <p class="oc-body-text" style="margin:0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Hi ${greetName},</p>
        <p class="oc-body-text" style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">${intro}</p>
      </td>
    </tr>

    ${
      d.scopeSummary?.trim()
        ? `
    <tr>
      <td style="padding:20px 0 0 0;">
        <p class="oc-body-text" style="margin:0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">${esc(d.scopeSummary.trim())}</p>
      </td>
    </tr>`
        : ''
    }

    <tr>
      <td style="padding:24px 0 0 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box-lborder" style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;">
          <tr>
            <td style="padding:16px 20px;">
              <p class="oc-detail-label" style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">The plan</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${statRow('Monthly retainer', `${fmtUsd(d.monthlyFee)}/mo`, true)}
                ${statRow('Included hours', `${fmtHrs(d.hoursPerMonth)} hrs/mo`)}
                ${statRow('Additional hours', `${fmtUsd(d.overageRate)}/hr`)}
                ${d.startLabel ? statRow('Proposed start', esc(d.startLabel)) : ''}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${
      d.completedHours > 0 || d.plannedHours > 0
        ? `
    <tr>
      <td style="padding:16px 0 0 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="oc-detail-box" style="background-color:#111111;border:1px solid #1a1a1a;">
          <tr>
            <td style="padding:16px 20px;">
              <p class="oc-detail-label" style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">What this is based on</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${d.completedHours > 0 ? statRow(d.includesCompletedWork ? 'Delivered so far (included)' : 'Delivered so far', `${fmtHrs(d.completedHours)}h`) : ''}
                ${d.plannedHours > 0 ? statRow('Planned each month', `${fmtHrs(d.plannedHours)}h`) : ''}
              </table>
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
              <p class="oc-muted" style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">The full proposal is attached as a PDF. This is a proposal, not an invoice &mdash; nothing is billed until you confirm. Questions or changes? Reply to this email or contact <a href="mailto:chance@orcaclub.pro" style="color:#3a5a5e;text-decoration:none;">chance@orcaclub.pro</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`

  return baseEmailTemplate({ content })
}

export function generateRetainerProposalEmailText(d: RetainerProposalEmailData): string {
  const greetName = d.clientName ? d.clientName.split(' ')[0] : 'there'
  const intro = d.customMessage?.trim()
    ? d.customMessage.trim()
    : `Here's the retainer proposal we put together${
        d.completedHours > 0 ? ", based on the work we've already done together" : ''
      }. The full breakdown is attached as a PDF.`

  const basis = [
    d.completedHours > 0
      ? `${d.includesCompletedWork ? 'Delivered so far (included)' : 'Delivered so far'}: ${fmtHrs(d.completedHours)}h`
      : '',
    d.plannedHours > 0 ? `Planned each month: ${fmtHrs(d.plannedHours)}h` : '',
  ].filter(Boolean)

  const content = `RETAINER PROPOSAL — ${d.tierLabel.toUpperCase()}
${fmtUsd(d.monthlyFee)}/mo · ${fmtHrs(d.hoursPerMonth)} hrs per month

Hi ${greetName},

${intro}
${d.scopeSummary?.trim() ? `\n${d.scopeSummary.trim()}\n` : ''}
THE PLAN
━━━━━━━━━━━━━━━━━━━━
Monthly retainer: ${fmtUsd(d.monthlyFee)}/mo
Included hours: ${fmtHrs(d.hoursPerMonth)} hrs/mo
Additional hours: ${fmtUsd(d.overageRate)}/hr${d.startLabel ? `\nProposed start: ${d.startLabel}` : ''}
${basis.length ? `\nWHAT THIS IS BASED ON\n━━━━━━━━━━━━━━━━━━━━\n${basis.join('\n')}\n` : ''}
The full proposal is attached as a PDF. This is a proposal, not an invoice — nothing is billed until you confirm.

Questions or changes? Reply to this email or contact chance@orcaclub.pro`

  return baseTextTemplate({ content })
}
