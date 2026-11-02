import { describe, expect, test } from 'bun:test'
import { PDFDocument } from 'pdf-lib'

import { draftFilename, stampDraftPdf } from './draftStamp'

async function blankPdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pages; i++) doc.addPage([612, 792])
  return doc.save()
}

describe('stampDraftPdf', () => {
  test('keeps every page and marks the document as a draft', async () => {
    const out = await stampDraftPdf(await blankPdf(3), new Date('2026-11-02T12:00:00Z'))
    const doc = await PDFDocument.load(out)
    expect(doc.getPageCount()).toBe(3)
    expect(doc.getSubject()).toBe('DRAFT, not sent')
    expect(doc.getKeywords()).toContain('draft')
  })

  test('adds content to each page', async () => {
    const input = await blankPdf(1)
    const out = await stampDraftPdf(input)
    expect(out.length).toBeGreaterThan(input.length)
  })
})

describe('draftFilename', () => {
  test('suffixes once', () => {
    expect(draftFilename('SOW_Acme.pdf')).toBe('SOW_Acme_DRAFT.pdf')
    expect(draftFilename('SOW_Acme_DRAFT.pdf')).toBe('SOW_Acme_DRAFT.pdf')
    expect(draftFilename('Invoice_PKG-ABC123')).toBe('Invoice_PKG-ABC123_DRAFT.pdf')
  })
})
