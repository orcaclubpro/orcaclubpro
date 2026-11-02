import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'

/**
 * Stamp a rendered document as an internal DRAFT.
 *
 * Every MCP-generated document passes through here (get_draft_pdf). The builders
 * themselves are untouched: this is a post-process over the bytes they return, so
 * the layout a client eventually receives is the same one staff already preview,
 * and a draft can never be mistaken for the sent copy.
 *
 * Each page gets a faint diagonal "DRAFT" watermark and a footer line saying it
 * has not been sent. The send paths (sendProposalEmail, sendRetainerRecapEmail,
 * sendDocumentEmail) build their own clean bytes and never read these.
 */
export const DRAFT_FOOTER = 'DRAFT, not sent. Internal review copy; Chance sends the final.'

export async function stampDraftPdf(bytes: Uint8Array, generatedOn: Date = new Date()): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes)
  const font = await doc.embedFont(StandardFonts.HelveticaBold)
  const footer = `${DRAFT_FOOTER} Generated ${generatedOn.toISOString().slice(0, 10)}.`

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize()

    const mark = 'DRAFT'
    const size = Math.min(width, height) / 4
    const markWidth = font.widthOfTextAtSize(mark, size)
    // Centre the rotated word on the page: start half its length back along the 45° line.
    const offset = markWidth / 2 / Math.SQRT2
    page.drawText(mark, {
      x: width / 2 - offset,
      y: height / 2 - offset,
      size,
      font,
      rotate: degrees(45),
      color: rgb(0.85, 0.1, 0.1),
      opacity: 0.12,
    })

    const footerSize = 7
    page.drawText(footer, {
      x: Math.max(12, (width - font.widthOfTextAtSize(footer, footerSize)) / 2),
      y: 10,
      size: footerSize,
      font,
      color: rgb(0.75, 0.1, 0.1),
    })
  }

  doc.setSubject('DRAFT, not sent')
  doc.setKeywords(['draft', 'not-sent'])
  return doc.save()
}

/** `SOW_Acme.pdf` → `SOW_Acme_DRAFT.pdf`. Idempotent. */
export function draftFilename(filename: string): string {
  const base = filename.replace(/\.pdf$/i, '')
  return /_DRAFT$/.test(base) ? `${base}.pdf` : `${base}_DRAFT.pdf`
}
