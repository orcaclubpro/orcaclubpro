import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFBool, PDFDict, PDFDocument, PDFName, StandardFonts, TextAlignment, rgb } from 'pdf-lib'
import {
  digitsOnly,
  validateW9,
  validateW9Request,
  type W9Classification,
  type W9FormData,
  type W9RequestData,
} from './w9-types'

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
export { W9_REVISION, formatTin, validateW9, validateW9Request, digitsOnly } from './w9-types'
export type { W9Classification, W9FormData, W9RequestData } from './w9-types'

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

// ─── Requesting a W-9 ─────────────────────────────────────────────────────────
// The other direction, and a different document. When ORCACLUB is the payer —
// a contractor, affiliate, or referral partner has to furnish a W-9 before they
// can be paid — what goes out is the blank IRS form with only the requester box
// and line 7 filled in, left FILLABLE so the recipient can complete and sign it
// in whatever PDF reader they have.
//
// Two things this deliberately does not do, which `fillW9Pdf` above does:
//
//   1. It does not flatten. Flattening draws the values into the page and drops
//      the fields, which is right for a form we have already completed and wrong
//      for one someone else still has to fill in.
//   2. It keeps all six pages. Pages 2–6 are the IRS's line-by-line instructions
//      — dead weight in a completed form, and the first thing a recipient asks
//      for when they have to complete one.

/**
 * The two rules in Part II, as widget rectangles.
 *
 * The IRS gives Part II no form field at all — it is ruled space to sign by
 * hand. A form emailed out and emailed back is never going to be signed by hand,
 * so a text field is laid over each rule: a typed name is what an electronic
 * signature on a W-9 actually is, and unlike a digital-certificate signature
 * field it works in Preview, Acrobat Reader, and a phone's mail client. Anyone
 * who does hold a certificate can still sign over the top with Fill & Sign.
 *
 * Derived from the same label positions as SIGN_LINE / DATE_LINE, widened to the
 * height of the band between the certification rule and the General Instructions
 * heading.
 */
const SIGN_FIELD = { x: 131, y: 191, width: 249, height: 19 }
const DATE_FIELD = { x: 409, y: 191, width: 167, height: 19 }

/** Field names for the two added widgets. Flat — a dot would nest them. */
const SIGN_FIELD_NAME = 'orcaclub_w9_signature'
const DATE_FIELD_NAME = 'orcaclub_w9_signature_date'

/**
 * Build a blank, fillable Form W-9 to send to someone who has to furnish one.
 *
 * The requester box and line 7 are filled and locked; everything else — name,
 * classification, address, TIN, signature — is left for the recipient. The
 * result is not flattened and carries all six IRS pages.
 */
export async function buildW9RequestPdf(data: W9RequestData): Promise<Uint8Array> {
  const problems = validateW9Request(data)
  if (problems.length > 0) throw new Error(problems.join(' '))

  const doc = await PDFDocument.load(await readFile(FW9_PATH))
  const form = doc.getForm()
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)

  // Ours, and locked — the recipient should not be able to retype who asked, and
  // line 7 is the reference the returned form is matched against.
  const requester = form.getTextField(FIELD.requester)
  requester.setText(data.requester.trim())
  requester.enableReadOnly()

  if (data.accountNumbers?.trim()) {
    const accounts = form.getTextField(FIELD.line7Accounts)
    accounts.setAlignment(TextAlignment.Left)
    accounts.setText(data.accountNumbers.trim())
    accounts.enableReadOnly()
  }

  // Theirs, and editable — a prefilled line 1 is a starting point, not a claim
  // about what is on their tax return.
  if (data.name?.trim()) form.getTextField(FIELD.line1Name).setText(data.name.trim())

  // Part II, laid over the ruled space the IRS leaves blank.
  const signature = form.createTextField(SIGN_FIELD_NAME)
  signature.addToPage(doc.getPage(0), { ...SIGN_FIELD, font: helvetica, borderWidth: 0 })

  const signedOn = form.createTextField(DATE_FIELD_NAME)
  signedOn.addToPage(doc.getPage(0), { ...DATE_FIELD, font: helvetica, borderWidth: 0 })

  // Sized after the widget exists — the font size lives in the field's default
  // appearance string, which `addToPage` is what writes.
  signature.setFontSize(11)
  signedOn.setFontSize(11)

  // pdf-lib paints a new widget's background white unless told otherwise, and
  // there is no option for "none" — a white box would hide the rule the field
  // sits on. Dropping /BG from the appearance characteristics leaves it clear.
  for (const field of [signature, signedOn]) {
    for (const widget of field.acroField.getWidgets()) {
      widget.MK()?.delete(PDFName.of('BG'))
    }
  }

  form.updateFieldAppearances(helvetica)

  // `updateFieldAppearances` rewrites every field's default appearance to name
  // the font it was handed — "/Helvetica" — but the IRS's resource dictionary
  // only declares /Helv, /HelveticaLTStd-Bold and /ZaDb. `fillW9Pdf` gets away
  // with the mismatch because flattening bakes the text into the page; a form
  // still carrying live fields does not, and a reader that cannot resolve the
  // font draws nothing. Declaring the embedded font under the name the appearance
  // strings use is what makes the fields render.
  const resources = form.acroForm.dict.lookupMaybe(PDFName.of('DR'), PDFDict)
  const fonts = resources?.lookupMaybe(PDFName.of('Font'), PDFDict)
  if (!fonts) throw new Error('The IRS form is missing its font resources — the blank may be corrupt.')
  fonts.set(PDFName.of(helvetica.name), helvetica.ref)

  // The recipient's reader has to draw the text they type. Without this the
  // fields accept input and render empty in several viewers, Preview included.
  form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True)

  return doc.save()
}
