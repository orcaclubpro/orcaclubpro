import { describe, expect, test } from 'bun:test'
import { PDFDocument } from 'pdf-lib'

import { buildPackageDocumentPdf } from '@/lib/packages/documents'
import { draftFilename, stampDraftPdf } from '@/lib/pdf/draftStamp'

// A package as the SOW readers load it (depth 1): client and project populated.
const pkg = {
  id: '6ae8f92eb561c9874fff2801',
  name: 'Site Rebuild',
  description: 'Rebuild of the marketing site.',
  coverMessage: '1. Design\n2. Build',
  notes: null,
  clientAccount: { id: 'c1', name: 'Test Client', company: 'Test Co', email: 'client@example.com' },
  projectRef: {
    id: 'p1',
    milestones: [{ id: 'm1', title: 'Design sign-off', date: '2026-12-01T08:00:00.000Z', description: 'Approved' }],
  },
  lineItems: [{ name: 'Design', description: 'Figma', quantity: 1, price: 1000 }],
  paymentSchedule: [{ label: 'Deposit', amount: 500 }],
}

describe('draft rendering over the real package builders', () => {
  for (const type of ['sow', 'proposal', 'invoice'] as const) {
    test(`${type}: builds, stamps, and keeps its pages`, async () => {
      const { bytes, filename } = await buildPackageDocumentPdf(pkg, type)
      const stamped = await stampDraftPdf(bytes)
      const before = await PDFDocument.load(bytes)
      const after = await PDFDocument.load(stamped)
      expect(after.getPageCount()).toBe(before.getPageCount())
      expect(after.getSubject()).toBe('DRAFT, not sent')
      expect(draftFilename(filename)).toMatch(/_DRAFT\.pdf$/)
    })
  }
})
