import { createHash } from 'crypto'

// ── ESIGN Disclosure ───────────────────────────────────────────────────────────
// This exact text is stored alongside every signature record.
// Do NOT change this string without versioning — existing signatures reference it.

export const ESIGN_CONSENT_TEXT = `ELECTRONIC SIGNATURE DISCLOSURE AND CONSENT

By signing this Agreement electronically, you agree to the following:

1. CONSENT TO ELECTRONIC RECORDS: You consent to receive this Agreement and all related notices electronically. You may request a paper copy at any time by emailing carbon@orcaclub.pro.

2. WITHDRAWAL OF CONSENT: You may withdraw your consent to electronic records at any time without penalty by contacting us at carbon@orcaclub.pro. Withdrawal applies to future records only and does not affect the validity of this Agreement once signed.

3. ELECTRONIC SIGNATURE: Typing your full legal name below and clicking "Sign Agreement" constitutes your legal signature on this document. This signature is legally equivalent to a handwritten signature under the Electronic Signatures in Global and National Commerce Act (ESIGN) and the Uniform Electronic Transactions Act (UETA).

4. SYSTEM REQUIREMENTS: To access this agreement electronically you need a modern web browser (Chrome, Firefox, Safari, Edge) and an active internet connection.

5. RECORD KEEPING: A copy of this signed agreement will be available in your ORCACLUB client portal. We recommend downloading or printing a copy for your records.`

// ── Service Agreement Terms ────────────────────────────────────────────────────

export const SERVICE_AGREEMENT_TERMS = `SERVICE AGREEMENT TERMS AND CONDITIONS

These Terms and Conditions ("Agreement") govern the delivery of services described in this Proposal between ORCACLUB LLC ("Service Provider") and the Client identified above.

1. SCOPE OF WORK
ORCACLUB will deliver the specific services and deliverables listed in this Proposal. Services not listed are outside the scope of this Agreement and require a separate Change Order with additional fees.

2. PAYMENT TERMS
Payment is due per the schedule set forth in this Proposal. Invoices are due within 30 days of issuance. The deposit is non-refundable. ORCACLUB reserves the right to pause work if any invoice remains unpaid beyond its due date.

3. LATE PAYMENT
Invoices not paid within 30 days of the due date will accrue a late fee of 1.5% per month (18% APR), or the maximum rate permitted by applicable law, on the outstanding balance. ORCACLUB may suspend services until all past-due amounts are resolved.

4. INTELLECTUAL PROPERTY
Upon receipt of all payments due under this Agreement, ORCACLUB assigns to Client all right, title, and interest in the custom Deliverables. ORCACLUB retains ownership of all pre-existing frameworks, tools, and methodologies ("Background IP") and grants Client a perpetual, non-exclusive license to use Background IP as incorporated in the Deliverables. Third-party assets are subject to their respective license terms.

5. REVISIONS
This Agreement includes up to two (2) rounds of consolidated revisions per phase. Additional revisions will be billed at standard hourly rates. Changes to the agreed scope require a written Change Order.

6. LIMITATION OF LIABILITY
IN NO EVENT SHALL ORCACLUB BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, LOSS OF DATA, OR BUSINESS INTERRUPTION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. ORCACLUB'S TOTAL CUMULATIVE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE TOTAL FEES PAID BY CLIENT IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

7. WARRANTY
ORCACLUB warrants that Deliverables will perform materially as described for 30 days following final delivery ("Warranty Period"). ORCACLUB's sole obligation is to correct non-conforming Deliverables at no additional charge. EXCEPT AS STATED HERE, ALL WARRANTIES EXPRESS OR IMPLIED (INCLUDING WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.

8. CONFIDENTIALITY
Each party agrees to keep confidential any non-public information disclosed by the other party and not to disclose it to third parties without prior written consent. This obligation survives termination for three (3) years. ORCACLUB may reference Client as a portfolio client unless Client opts out in writing.

9. TERMINATION
Either party may terminate this Agreement with 15 days written notice. Upon termination, Client shall pay for all work completed through the termination date. Deposits are non-refundable. ORCACLUB will deliver all completed work product within 5 business days of final payment.

10. GOVERNING LAW
This Agreement is governed by the laws of the State of Florida, without regard to conflict of law principles. Disputes shall first be resolved by good-faith negotiation, then non-binding mediation, then binding arbitration under AAA Commercial Rules.

11. ENTIRE AGREEMENT
This Proposal and these Terms constitute the entire agreement between the parties and supersede all prior discussions. Modifications require written consent from both parties.`

// ── Document Hashing ──────────────────────────────────────────────────────────

interface HashablePackage {
  id: string
  name: string
  description?: string | null
  coverMessage?: string | null
  notes?: string | null
  lineItems?: Array<{
    name: string
    description?: string | null
    price: number
    adjustedPrice?: number | null
    quantity?: number
    isRecurring?: boolean
    recurringInterval?: string | null
  }>
  paymentSchedule?: Array<{
    label: string
    amount: number
    dueDate?: string | null
  }>
  updatedAt?: string
}

/** Compute a deterministic SHA-256 hash of the proposal's legally operative content. */
export function hashProposalDocument(pkg: HashablePackage): string {
  const canonical = {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description ?? null,
    coverMessage: pkg.coverMessage ?? null,
    notes: pkg.notes ?? null,
    lineItems: (pkg.lineItems ?? []).map(item => ({
      name: item.name,
      description: item.description ?? null,
      price: item.price,
      adjustedPrice: item.adjustedPrice ?? null,
      quantity: item.quantity ?? 1,
      isRecurring: item.isRecurring ?? false,
      recurringInterval: item.recurringInterval ?? null,
    })),
    paymentSchedule: (pkg.paymentSchedule ?? []).map(entry => ({
      label: entry.label,
      amount: entry.amount,
      dueDate: entry.dueDate ?? null,
    })),
    terms: SERVICE_AGREEMENT_TERMS,
    updatedAt: pkg.updatedAt ?? null,
  }

  return createHash('sha256')
    .update(JSON.stringify(canonical), 'utf8')
    .digest('hex')
}

/** Build the tamper-evident signing certificate JSON and its hash. */
export function buildSigningCertificate(params: {
  packageId: string
  typedName: string
  signedByEmail: string
  signedAt: string
  ipAddress: string
  userAgent: string
  documentHash: string
}): { signingCertificate: string; certificateHash: string } {
  const signingCertificate = JSON.stringify({
    packageId: params.packageId,
    typedName: params.typedName,
    signedByEmail: params.signedByEmail,
    signedAt: params.signedAt,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    documentHash: params.documentHash,
    consentVersion: '2026-02-23',
  })

  const certificateHash = createHash('sha256')
    .update(signingCertificate, 'utf8')
    .digest('hex')

  return { signingCertificate, certificateHash }
}
