import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, StandardFonts, TextAlignment, rgb } from 'pdf-lib'
import { digitsOnly, validateW9, type W9Classification, type W9FormData } from './w9-types'

// ─── Form W-9 ─────────────────────────────────────────────────────────────────
// Fills the genuine IRS form rather than drawing a lookalike.
//
// A W-9 is furnished by the PAYEE to the PAYER. Clients pay ORCACLUB, so this is
// ORCACLUB's own W-9, produced for a client who has asked for one before they
// can pay an invoice or issue a 1099. Nothing on it is read from the client
// record except the optional "Requester's name and address" box — the legal
// name, entity classification, address and TIN are all the studio's own.
//
// The blank alongside this file is the IRS's published fw9.pdf (Rev. March 2024,
// Cat. No. 10231X), downloaded from https://www.irs.gov/pub/irs-pdf/fw9.pdf. It
// is kept as a real PDF, not a base64 blob, precisely so it can be opened and
// confirmed to be the authentic form — and replaced by re-downloading when the
// IRS revises it. A revision renumbers the AcroForm fields, so FIELD below must
// be re-derived against any new file (the field names carry no labels; they were
// mapped by widget position against the printed form).
//
// Everything the form needs is passed in per call. Nothing here reads or writes
// a TIN to the database, and nothing persists the filled document.

// Re-exported so server callers have one import for the whole feature.
export { W9_REVISION, formatTin, validateW9, digitsOnly } from './w9-types'
export type { W9Classification, W9FormData } from './w9-types'

const FW9_PATH = path.join(process.cwd(), 'src/lib/forms/fw9.pdf')

const P1 = 'topmostSubform[0].Page1[0]'
const BOXES = `${P1}.Boxes3a-b_ReadOrder[0]`

/**
 * AcroForm field names, by the line they print on. The IRS ships XFA-generated
 * names with no tooltips, so these were mapped from each widget's rectangle
 * against the printed layout — see the block comment above before changing one.
 */
const FIELD = {
  line1Name: `${P1}.f1_01[0]`,
  line2BusinessName: `${P1}.f1_02[0]`,
  /** Line 3a, in printed order. */
  classIndividual: `${BOXES}.c1_1[0]`,
  classCCorp: `${BOXES}.c1_1[1]`,
  classSCorp: `${BOXES}.c1_1[2]`,
  classPartnership: `${BOXES}.c1_1[3]`,
  classTrustEstate: `${BOXES}.c1_1[4]`,
  classLlc: `${BOXES}.c1_1[5]`,
  llcTaxClass: `${BOXES}.f1_03[0]`,
  classOther: `${BOXES}.c1_1[6]`,
  otherDescription: `${BOXES}.f1_04[0]`,
  /** Line 3b — foreign partners, owners or beneficiaries. */
  foreignPartners: `${BOXES}.c1_2[0]`,
  exemptPayeeCode: `${P1}.f1_05[0]`,
  fatcaCode: `${P1}.f1_06[0]`,
  line5Address: `${P1}.Address_ReadOrder[0].f1_07[0]`,
  line6CityStateZip: `${P1}.Address_ReadOrder[0].f1_08[0]`,
  requester: `${P1}.f1_09[0]`,
  line7Accounts: `${P1}.f1_10[0]`,
  /** Part I — the SSN boxes are 3-2-4, the EIN boxes 2-7. */
  ssn1: `${P1}.f1_11[0]`,
  ssn2: `${P1}.f1_12[0]`,
  ssn3: `${P1}.f1_13[0]`,
  ein1: `${P1}.f1_14[0]`,
  ein2: `${P1}.f1_15[0]`,
} as const

/**
 * Part II has no form field — the IRS leaves it as ruled space to sign. These
 * are the baseline and left edge of the two rules, in PDF points, taken from
 * the position of the "Signature of U.S. person" and "Date" labels on page 1.
 */
const SIGN_LINE = { x: 132, y: 197 }
const DATE_LINE = { x: 412, y: 197 }

const signatureDate = new Intl.DateTimeFormat('en-US', {
  month: 'numeric', day: 'numeric', year: 'numeric',
})

/**
 * Fill and flatten page 1 of Form W-9.
 *
 * Only page 1 is returned: pages 2–6 of the IRS file are filler instructions,
 * which the requester has no use for and which triple the size of the email.
 *
 * The result is flattened, so the values are drawn into the page rather than
 * left as editable form fields.
 */
export async function fillW9Pdf(data: W9FormData): Promise<Uint8Array> {
  const problems = validateW9(data)
  if (problems.length > 0) throw new Error(problems.join(' '))

  const doc = await PDFDocument.load(await readFile(FW9_PATH))
  const form = doc.getForm()

  const text = (field: string, value?: string | null) => {
    if (!value) return
    form.getTextField(field).setText(value)
  }

  text(FIELD.line1Name, data.name.trim())
  text(FIELD.line2BusinessName, data.businessName?.trim())

  const checkbox: Record<W9Classification, string> = {
    individual: FIELD.classIndividual,
    'c-corp': FIELD.classCCorp,
    's-corp': FIELD.classSCorp,
    partnership: FIELD.classPartnership,
    'trust-estate': FIELD.classTrustEstate,
    llc: FIELD.classLlc,
    other: FIELD.classOther,
  }
  form.getCheckBox(checkbox[data.classification]).check()
  if (data.classification === 'llc') text(FIELD.llcTaxClass, data.llcTaxClass)
  if (data.classification === 'other') text(FIELD.otherDescription, data.otherDescription?.trim())
  if (data.foreignPartners) form.getCheckBox(FIELD.foreignPartners).check()

  text(FIELD.exemptPayeeCode, data.exemptPayeeCode?.trim())
  text(FIELD.fatcaCode, data.fatcaCode?.trim())
  text(FIELD.line5Address, data.address.trim())
  text(FIELD.line6CityStateZip, data.cityStateZip.trim())
  text(FIELD.requester, data.requester?.trim())
  if (data.accountNumbers?.trim()) {
    const accounts = form.getTextField(FIELD.line7Accounts)
    // The IRS ships this one centred, which reads as a caption rather than an
    // entry once it holds an invoice number.
    accounts.setAlignment(TextAlignment.Left)
    accounts.setText(data.accountNumbers.trim())
  }

  const tin = digitsOnly(data.tin)
  if (data.tinType === 'ein') {
    text(FIELD.ein1, tin.slice(0, 2))
    text(FIELD.ein2, tin.slice(2))
  } else {
    text(FIELD.ssn1, tin.slice(0, 3))
    text(FIELD.ssn2, tin.slice(3, 5))
    text(FIELD.ssn3, tin.slice(5))
  }

  // Draw the values into the page so the delivered form cannot be edited. Done
  // before the signature so the signature is never a form field either.
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)
  form.updateFieldAppearances(helvetica)
  form.flatten()

  if (data.signature) {
    // The signatory's name set plainly on the rule — a typed electronic
    // signature, which is what this is. No script face: imitating handwriting
    // would misrepresent how the form was signed.
    const page = doc.getPage(0)
    page.drawText(data.signature.name.trim(), {
      x: SIGN_LINE.x, y: SIGN_LINE.y, size: 11, font: helvetica, color: rgb(0, 0, 0),
    })
    page.drawText(signatureDate.format(data.signature.date), {
      x: DATE_LINE.x, y: DATE_LINE.y, size: 11, font: helvetica, color: rgb(0, 0, 0),
    })
  }

  // Page 1 only — the rest of the IRS file is instructions for whoever fills it.
  for (let i = doc.getPageCount() - 1; i >= 1; i--) doc.removePage(i)

  return doc.save()
}
