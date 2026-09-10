'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/actions/auth'
import { fillW9Pdf, validateW9 } from '@/lib/forms/w9'
import type { W9FormData } from '@/lib/forms/w9-types'
import { w9Delivery } from '@/lib/email/templates'
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
