'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/actions/auth'
import { buildW9RequestPdf, fillW9Pdf, validateW9, validateW9Request } from '@/lib/forms/w9'
import type { W9FormData, W9RequestData } from '@/lib/forms/w9-types'
import { w9Delivery, w9Request } from '@/lib/email/templates'
import { BRAND_NAME } from '@/lib/brand'

// ─── Form W-9 ─────────────────────────────────────────────────────────────────
// Two ways out of the composer: save the PDF, or send it. Both build the form in
// memory from what the caller passed.
//
// Nothing here writes to the database. A W-9 carries a taxpayer identification
// number, and the two things that would normally happen to a generated document
// — filing it in `files`, logging what was produced — would both put that number
// somewhere it does not need to be. `files` stores the source data and rebuilds
// the PDF on demand, so filing a W-9 there would persist the TIN indefinitely.
// The form is therefore built, handed over, and forgotten.
//
// For the same reason nothing below logs the form data. The console lines carry
// the recipient and the outcome, never the payload.

/** Never let a TIN reach a log line, an error message, or a filename. */
const safeName = (s: string) => (s || 'ORCACLUB').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '')

function w9Filename(data: W9FormData): string {
  return `W-9_${safeName(data.businessName?.trim() || data.name)}.pdf`
}

export interface GenerateW9Result {
  success: boolean
  /** Base64 PDF for the browser to save. Present only on success. */
  pdfBase64?: string
  filename?: string
  error?: string
}

/**
 * Build the form and hand it back for the browser to save.
 *
 * Staff only — a client must never be able to render the studio's TIN, and the
 * composer that calls this is on a staff-only route.
 */
export async function generateW9(data: W9FormData): Promise<GenerateW9Result> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const problems = validateW9(data)
    if (problems.length > 0) return { success: false, error: problems.join(' ') }

    const bytes = await fillW9Pdf(data)
    const filename = w9Filename(data)
    console.log(`[generateW9] built ${filename} (${bytes.byteLength} bytes) for ${user.email}`)

    return {
      success: true,
      pdfBase64: Buffer.from(bytes).toString('base64'),
      filename,
    }
  } catch (error) {
    console.error('[generateW9]', error instanceof Error ? error.message : 'unknown error')
    return { success: false, error: error instanceof Error ? error.message : 'Failed to build the form' }
  }
}

export interface SendW9Result {
  success: boolean
  sent?: number
  filename?: string
  error?: string
}

/**
 * Email the form to the people who asked for it, as an attachment.
 *
 * The recipients come from the caller, which offers the client account's own
 * users — a W-9 goes to the requester, not to an address typed from a message.
 * A partial failure is reported honestly: `sent` is how many actually went.
 */
export async function sendW9(
  data: W9FormData,
  recipients: { email: string; name?: string }[],
  message?: string,
): Promise<SendW9Result> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }
    if (!recipients.length) return { success: false, error: 'Choose at least one recipient.' }

    const problems = validateW9(data)
    if (problems.length > 0) return { success: false, error: problems.join(' ') }

    const payload = await getPayload({ config })
    const bytes = await fillW9Pdf(data)
    const filename = w9Filename(data)
    const pdfBase64 = Buffer.from(bytes).toString('base64')

    let sent = 0
    const failures: string[] = []
    for (const recipient of recipients) {
      try {
        const email = w9Delivery({
          recipientName: recipient.name || recipient.email,
          legalName: data.name.trim(),
          message,
          filename,
        })
        await payload.sendEmail({
          to: recipient.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
          attachments: [
            { filename, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' },
          ],
        } as any)
        sent++
        console.log(`[sendW9] ${BRAND_NAME} W-9 sent to ${recipient.email}`)
      } catch (err) {
        failures.push(recipient.email)
        console.error(`[sendW9] failed for ${recipient.email}:`, err instanceof Error ? err.message : err)
      }
    }

    if (sent === 0) return { success: false, error: 'The form could not be sent. Nothing left the server.' }
    return {
      success: true,
      sent,
      filename,
      ...(failures.length > 0
        ? { error: `Sent to ${sent}, but not to ${failures.join(', ')}.` }
        : {}),
    }
  } catch (error) {
    console.error('[sendW9]', error instanceof Error ? error.message : 'unknown error')
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send the form' }
  }
}

// ─── Requesting a W-9 ─────────────────────────────────────────────────────────
// The other direction: a blank fillable form goes out, a completed one comes
// back by reply. The same no-persistence rule applies, and it matters more here,
// because the number on a returned form is somebody else's.
//
// A completed W-9 is never fetched, parsed, or filed by this codebase. It lands
// in the inbox of the staff member who asked — which is why every send below
// sets `replyTo` to their address rather than the studio's from-address.

/** The recipient of a request. Not necessarily a portal user. */
export interface W9RequestRecipient {
  email: string
  name?: string
}

/** Named for the person completing it, not for us — it lands in their downloads. */
const W9_REQUEST_FILENAME = 'Form_W-9_to_complete.pdf'

/** Enough to catch a typo before an attachment with our address on it goes out. */
const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())

/**
 * Build the blank, fillable form and hand it back for the browser to save.
 *
 * Useful on its own — some contractors want the form over a channel that is not
 * email, and this is how staff get a copy to pass along.
 */
export async function generateW9Request(data: W9RequestData): Promise<GenerateW9Result> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const problems = validateW9Request(data)
    if (problems.length > 0) return { success: false, error: problems.join(' ') }

    const bytes = await buildW9RequestPdf(data)
    console.log(`[generateW9Request] built ${W9_REQUEST_FILENAME} (${bytes.byteLength} bytes) for ${user.email}`)

    return {
      success: true,
      pdfBase64: Buffer.from(bytes).toString('base64'),
      filename: W9_REQUEST_FILENAME,
    }
  } catch (error) {
    console.error('[generateW9Request]', error instanceof Error ? error.message : 'unknown error')
    return { success: false, error: error instanceof Error ? error.message : 'Failed to build the form' }
  }
}

/**
 * Email the blank form to whoever has to complete it.
 *
 * Recipients may be portal users on the account or addresses typed in the
 * composer — a contractor or an accounts-payable desk usually is not a portal
 * user, and refusing to send to them would make the feature useless. Nothing but
 * a blank form and our own requester block leaves the server, so a typo costs a
 * wasted email rather than a disclosure.
 *
 * A partial failure is reported honestly: `sent` is how many actually went.
 */
export async function sendW9Request(
  data: W9RequestData,
  recipients: W9RequestRecipient[],
  message?: string,
): Promise<SendW9Result> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }
    if (!recipients.length) return { success: false, error: 'Choose at least one recipient.' }

    const malformed = recipients.filter(r => !looksLikeEmail(r.email))
    if (malformed.length > 0) {
      return { success: false, error: `Not an email address: ${malformed.map(r => r.email).join(', ')}.` }
    }

    const problems = validateW9Request(data)
    if (problems.length > 0) return { success: false, error: problems.join(' ') }

    // The completed form comes back to the person who asked, not to the shared
    // from-address — a returned W-9 carries a TIN and should land in one inbox.
    const replyTo = user.email
    if (!replyTo) return { success: false, error: 'Your account has no email address to receive the reply.' }

    const payload = await getPayload({ config })
    const bytes = await buildW9RequestPdf(data)
    const pdfBase64 = Buffer.from(bytes).toString('base64')

    let sent = 0
    const failures: string[] = []
    for (const recipient of recipients) {
      try {
        const email = w9Request({
          recipientName: recipient.name || recipient.email,
          replyTo,
          message,
          filename: W9_REQUEST_FILENAME,
          reference: data.accountNumbers,
        })
        await payload.sendEmail({
          to: recipient.email,
          replyTo,
          subject: email.subject,
          html: email.html,
          text: email.text,
          attachments: [
            {
              filename: W9_REQUEST_FILENAME,
              content: pdfBase64,
              encoding: 'base64',
              contentType: 'application/pdf',
            },
          ],
        } as any)
        sent++
        console.log(`[sendW9Request] blank W-9 sent to ${recipient.email}, replies to ${replyTo}`)
      } catch (err) {
        failures.push(recipient.email)
        console.error(`[sendW9Request] failed for ${recipient.email}:`, err instanceof Error ? err.message : err)
      }
    }

    if (sent === 0) return { success: false, error: 'The request could not be sent. Nothing left the server.' }
    return {
      success: true,
      sent,
      filename: W9_REQUEST_FILENAME,
      ...(failures.length > 0
        ? { error: `Sent to ${sent}, but not to ${failures.join(', ')}.` }
        : {}),
    }
  } catch (error) {
    console.error('[sendW9Request]', error instanceof Error ? error.message : 'unknown error')
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send the request' }
  }
}
