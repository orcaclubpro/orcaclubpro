// ─── Form W-9, the parts a browser may hold ───────────────────────────────────
// Split from `w9.ts` because the composer is a client component: importing a
// value out of the filler would pull `node:fs` and pdf-lib into the browser
// bundle, which fails silently at build time and loudly at runtime. Types erase,
// but constants and functions do not — so anything both sides need lives here.
//
// No secrets, no I/O, no form file. Just the shape of a W-9 and the rules for a
// complete one.

/** The IRS revision `w9.ts` maps its field names against. */
export const W9_REVISION = 'Rev. March 2024'

export type W9Classification =
  | 'individual'
  | 'c-corp'
  | 's-corp'
  | 'partnership'
  | 'trust-estate'
  | 'llc'
  | 'other'

export interface W9FormData {
  /** Line 1 — the name on the entity's income tax return. Required. */
  name: string
  /** Line 2 — business, trade, or disregarded entity name, if different. */
  businessName?: string
  /** Line 3a. */
  classification: W9Classification
  /** Required when `classification` is 'llc': C, S, or P. */
  llcTaxClass?: 'C' | 'S' | 'P'
  /** Required when `classification` is 'other'. */
  otherDescription?: string
  /** Line 3b — a flow-through entity with foreign partners/owners/beneficiaries. */
  foreignPartners?: boolean
  exemptPayeeCode?: string
  fatcaCode?: string
  /** Line 5 — number, street, and apt or suite no. */
  address: string
  /** Line 6 — city, state, and ZIP code. */
  cityStateZip: string
  /** The optional requester box — who asked for the form. */
  requester?: string
  /** Line 7 — account numbers, optional. */
  accountNumbers?: string
  tinType: 'ein' | 'ssn'
  /** Nine digits. Punctuation is stripped before it is split across the boxes. */
  tin: string
  /**
   * Part II. Typing a name here signs the form electronically and stamps the
   * date; omit it to produce an otherwise-complete form to sign by hand.
   */
  signature?: { name: string; date: Date } | null
}

/** A TIN as the form stores it: nine digits, no punctuation. */
export const digitsOnly = (s: string) => (s || '').replace(/\D/g, '')

/** Human-readable TIN for display and filenames — never logged. */
export function formatTin(tin: string, type: 'ein' | 'ssn'): string {
  const d = digitsOnly(tin)
  if (d.length !== 9) return tin
  return type === 'ein' ? `${d.slice(0, 2)}-${d.slice(2)}` : `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

/**
 * Everything the form will not accept, as messages a person can act on.
 * Returns an empty array when the data is complete.
 */
export function validateW9(data: W9FormData): string[] {
  const problems: string[] = []
  if (!data.name?.trim()) problems.push('Line 1 needs the name on your income tax return.')
  if (!data.address?.trim()) problems.push('Line 5 needs a street address.')
  if (!data.cityStateZip?.trim()) problems.push('Line 6 needs a city, state, and ZIP.')
  if (data.classification === 'llc' && !data.llcTaxClass) {
    problems.push('An LLC has to state its tax classification — C, S, or P.')
  }
  if (data.classification === 'other' && !data.otherDescription?.trim()) {
    problems.push('"Other" needs the classification written out.')
  }
  if (digitsOnly(data.tin).length !== 9) {
    problems.push(`A ${data.tinType === 'ein' ? 'EIN' : 'SSN'} is nine digits.`)
  }
  if (data.signature && !data.signature.name.trim()) {
    problems.push('A signature needs the name of the person signing.')
  }
  return problems
}
