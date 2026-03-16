import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
import type { NdaFormData, SowFormData } from './document-generators'

// ── Color palette ──────────────────────────────────────────────────────────────

const C = {
  navy:  rgb(0.122, 0.306, 0.475),
  black: rgb(0.1,   0.1,   0.1),
  grey:  rgb(0.35,  0.35,  0.35),
  lgrey: rgb(0.6,   0.6,   0.6),
  line:  rgb(0.69,  0.77,  0.85),
  lblue: rgb(0.84,  0.89,  0.94),
  bg:    rgb(0.972, 0.976, 0.98),
  field: rgb(0.95,  0.97,  1.0),
  white: rgb(1,     1,     1),
  cyan:  rgb(0.404, 0.91,  0.976),
  dark:  rgb(0.051, 0.051, 0.051),
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(val: string): string {
  if (!val) return '______________________________'
  const d = new Date(val + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function blank(val: string, fallback = '______________________________'): string {
  return val.trim() || fallback
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (font.widthOfTextAtSize(test, size) <= maxW) {
      cur = test
    } else {
      if (cur) lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['']
}

// ── DocWriter ─────────────────────────────────────────────────────────────────

class DocWriter {
  doc: PDFDocument
  page!: PDFPage
  bold!: PDFFont
  normal!: PDFFont
  x: number
  y: number
  ml: number
  mr: number
  mt: number
  mb: number
  pw: number
  ph: number
  innerW: number
  prefix: string

  constructor(doc: PDFDocument, bold: PDFFont, normal: PDFFont, prefix = '') {
    this.doc    = doc
    this.bold   = bold
    this.normal = normal
    this.x      = 0
    this.y      = 0
    this.ml     = 72
    this.mr     = 72
    this.mt     = 72
    this.mb     = 72
    this.pw     = 612
    this.ph     = 792
    this.innerW = this.pw - this.ml - this.mr
    this.prefix = prefix
    this._np()
  }

  setFonts(bold: PDFFont, normal: PDFFont) {
    this.bold   = bold
    this.normal = normal
  }

  _np() {
    this.page = this.doc.addPage([this.pw, this.ph])
    this.y    = this.ph - this.mt
    this.x    = this.ml
  }

  need(n: number) {
    if (this.y - n < this.mb) this._np()
  }

  sp(n = 6) {
    this.y -= n
  }

  hr(color = C.navy, thick = 1) {
    this.need(8)
    this.page.drawLine({
      start: { x: this.ml, y: this.y },
      end:   { x: this.pw - this.mr, y: this.y },
      thickness: thick,
      color,
    })
    this.y -= 8
  }

  thr() { this.hr(C.navy, 2) }

  ctr(text: string, size = 10, color = C.grey, bold = false) {
    this.need(size + 6)
    const font  = bold ? this.bold : this.normal
    const tw    = font.widthOfTextAtSize(text, size)
    this.page.drawText(text, { x: (this.pw - tw) / 2, y: this.y, size, font, color })
    this.y -= size + 6
  }

  title(text: string) {
    this.need(22)
    const size = 16
    const tw   = this.bold.widthOfTextAtSize(text, size)
    this.page.drawText(text, { x: (this.pw - tw) / 2, y: this.y, size, font: this.bold, color: C.navy })
    this.y -= size + 8
  }

  subtitle(text: string) {
    this.need(14)
    const size = 9
    const tw   = this.normal.widthOfTextAtSize(text, size)
    this.page.drawText(text, { x: (this.pw - tw) / 2, y: this.y, size, font: this.normal, color: C.lgrey })
    this.y -= size + 8
  }

  section(text: string) {
    this.need(20)
    this.sp(4)
    const size = 11
    this.page.drawText(text.toUpperCase(), { x: this.x, y: this.y, size, font: this.bold, color: C.navy })
    this.y -= size + 6
  }

  sub(text: string) {
    this.need(16)
    const size = 9.5
    this.page.drawText(text, { x: this.x, y: this.y, size, font: this.bold, color: C.navy })
    this.y -= size + 5
  }

  body(text: string, size = 10, color = C.black) {
    const lines = wrap(text, this.normal, size, this.innerW)
    for (const line of lines) {
      this.need(size + 5)
      this.page.drawText(line, { x: this.x, y: this.y, size, font: this.normal, color })
      this.y -= size + 5
    }
  }

  mixed(segments: Array<{ text: string; bold?: boolean }>, size = 10) {
    // Renders a line with mixed bold/normal segments, wrapping as a whole
    const fullText = segments.map(s => s.text).join('')
    const lines = wrap(fullText, this.normal, size, this.innerW)
    // Rebuild segments per line (simple approach: render full line, bold via overlay)
    // For simplicity, render the assembled text normally then re-draw bold segments
    for (const line of lines) {
      this.need(size + 5)
      this.page.drawText(line, { x: this.x, y: this.y, size, font: this.normal, color: C.black })
      // Bold overlay: walk segments that appear in this line
      let cx = this.x
      for (const seg of segments) {
        if (!seg.bold) {
          cx += this.normal.widthOfTextAtSize(seg.text, size)
          continue
        }
        const idx = line.indexOf(seg.text)
        if (idx >= 0) {
          const prefix2 = line.slice(0, idx)
          const ox = this.x + this.normal.widthOfTextAtSize(prefix2, size)
          this.page.drawText(seg.text, { x: ox, y: this.y, size, font: this.bold, color: C.black })
        }
        cx += this.normal.widthOfTextAtSize(seg.text, size)
      }
      this.y -= size + 5
    }
  }

  bullet(text: string, size = 10, indent = 12) {
    const maxW   = this.innerW - indent
    const lines  = wrap(text, this.normal, size, maxW)
    const dotX   = this.x + indent - 8
    this.need(size + 5)
    this.page.drawText('•', { x: dotX, y: this.y, size, font: this.normal, color: C.black })
    for (let i = 0; i < lines.length; i++) {
      this.need(size + 5)
      this.page.drawText(lines[i], { x: this.x + indent, y: this.y, size, font: this.normal, color: C.black })
      this.y -= size + 5
    }
  }

  row(cols: string[], widths: number[], size = 9.5, bg?: { r: number; g: number; b: number }) {
    // Measure max height needed for this row
    let maxLines = 1
    for (let ci = 0; ci < cols.length; ci++) {
      const lines = wrap(cols[ci], this.normal, size, widths[ci] - 8)
      maxLines = Math.max(maxLines, lines.length)
    }
    const rowH = maxLines * (size + 4) + 6
    this.need(rowH + 2)

    const rowY = this.y - rowH
    let cx = this.x
    for (let ci = 0; ci < cols.length; ci++) {
      if (bg) {
        this.page.drawRectangle({ x: cx, y: rowY, width: widths[ci], height: rowH, color: rgb(bg.r, bg.g, bg.b) })
      }
      const lines = wrap(cols[ci], this.normal, size, widths[ci] - 8)
      let ty = this.y - size - 3
      for (const line of lines) {
        this.page.drawText(line, { x: cx + 4, y: ty, size, font: this.normal, color: C.black })
        ty -= size + 4
      }
      cx += widths[ci]
    }
    // Bottom border
    this.page.drawLine({
      start: { x: this.ml, y: rowY },
      end:   { x: this.pw - this.mr, y: rowY },
      thickness: 0.5, color: C.line,
    })
    this.y -= rowH + 2
  }

  partyBox(tag: string, lines: string[]) {
    const boxH = 12 + lines.length * 14 + 10
    this.need(boxH + 4)
    this.page.drawRectangle({ x: this.x, y: this.y - boxH, width: this.innerW, height: boxH, color: C.bg })
    this.page.drawRectangle({ x: this.x, y: this.y - boxH, width: 3, height: boxH, color: C.navy })
    let ty = this.y - 12
    this.page.drawText(tag.toUpperCase(), { x: this.x + 8, y: ty, size: 8, font: this.bold, color: C.navy })
    ty -= 14
    for (const ln of lines) {
      const lns = wrap(ln, this.normal, 10, this.innerW - 16)
      for (const l of lns) {
        this.page.drawText(l, { x: this.x + 8, y: ty, size: 10, font: this.normal, color: C.black })
        ty -= 14
      }
    }
    this.y -= boxH + 4
  }

  noteBox(lines: string[]) {
    const boxH = lines.length * 13 + 14
    this.need(boxH + 4)
    this.page.drawRectangle({ x: this.x, y: this.y - boxH, width: this.innerW, height: boxH, color: rgb(0.94, 0.96, 0.98) })
    this.page.drawRectangle({ x: this.x, y: this.y - boxH, width: 2, height: boxH, color: C.line })
    let ty = this.y - 12
    for (const ln of lines) {
      const lns = wrap(ln, this.normal, 9.5, this.innerW - 16)
      for (const l of lns) {
        this.page.drawText(l, { x: this.x + 8, y: ty, size: 9.5, font: this.normal, color: C.grey })
        ty -= 13
      }
    }
    this.y -= boxH + 4
  }

  table(headers: string[], widths: number[], rows: string[][], size = 9.5) {
    // Header row
    let cx = this.x
    const hRowH = (size + 4) + 6
    this.need(hRowH + 2)
    for (let ci = 0; ci < headers.length; ci++) {
      this.page.drawRectangle({ x: cx, y: this.y - hRowH, width: widths[ci], height: hRowH, color: C.lblue })
      this.page.drawText(headers[ci], { x: cx + 4, y: this.y - size - 3, size, font: this.bold, color: C.navy })
      cx += widths[ci]
    }
    this.y -= hRowH + 2

    for (let ri = 0; ri < rows.length; ri++) {
      const bg = ri % 2 === 0 ? undefined : { r: 0.972, g: 0.976, b: 0.98 }
      this.row(rows[ri], widths, size, bg)
    }
  }

  totalRow(label: string, amount: string, widths: number[]) {
    const size = 10
    const totalW = widths.reduce((a, b) => a + b, 0)
    const rowH = size + 10
    this.need(rowH + 2)
    this.page.drawRectangle({ x: this.x, y: this.y - rowH, width: totalW, height: rowH, color: rgb(0.96, 0.97, 0.99) })
    this.page.drawLine({
      start: { x: this.ml, y: this.y - rowH },
      end:   { x: this.pw - this.mr, y: this.y - rowH },
      thickness: 1, color: C.line,
    })
    this.page.drawText(label, { x: this.x + 4, y: this.y - size - 3, size, font: this.bold, color: C.black })
    const amtW = this.normal.widthOfTextAtSize(amount, size)
    this.page.drawText(amount, { x: this.pw - this.mr - amtW - 4, y: this.y - size - 3, size, font: this.bold, color: C.black })
    this.y -= rowH + 2
  }

  footer(text: string) {
    const size = 7.5
    const tw   = this.normal.widthOfTextAtSize(text, size)
    this.page.drawLine({
      start: { x: this.ml, y: this.mb + 14 },
      end:   { x: this.pw - this.mr, y: this.mb + 14 },
      thickness: 0.5, color: C.line,
    })
    this.page.drawText(text, { x: (this.pw - tw) / 2, y: this.mb + 4, size, font: this.normal, color: C.lgrey })
  }

  sigBlock(
    sp_label: string, sp_name: string, sp_title: string,
    cl_label: string, cl_name: string,
  ) {
    this.need(160)
    this.sp(12)
    const form   = this.doc.getForm()
    const colW   = this.innerW / 2 - 10
    const leftX  = this.x
    const rightX = this.x + colW + 20

    const mkField = (name: string, x: number, y: number, w: number, h: number) => {
      const f = form.createTextField(`${this.prefix}${name}`)
      f.addToPage(this.page, { x, y: y - h, width: w, height: h, borderWidth: 0, backgroundColor: C.field })
      f.setFontSize(10)
    }

    // Left column (Service Provider)
    this.page.drawText(sp_label.toUpperCase(), { x: leftX, y: this.y, size: 8, font: this.bold, color: C.lgrey })
    this.y -= 14
    // Sig line
    this.page.drawLine({
      start: { x: leftX, y: this.y }, end: { x: leftX + colW, y: this.y },
      thickness: 1, color: C.grey,
    })
    mkField('sp_sig', leftX, this.y, colW, 20)
    this.y -= 4
    this.page.drawText(sp_name, { x: leftX, y: this.y - 12, size: 11, font: this.bold, color: C.black })
    this.y -= 26
    this.page.drawText(sp_title, { x: leftX, y: this.y - 10, size: 9, font: this.normal, color: C.grey })
    this.y -= 22
    this.page.drawText('Date:', { x: leftX, y: this.y - 10, size: 9, font: this.normal, color: C.grey })
    mkField('sp_date', leftX + 32, this.y - 2, colW - 32, 16)
    this.y -= 24

    // Right column (Client)
    const sigY = this.y + 80 // reset to top of sig block
    const baseY = sigY + 14
    this.page.drawText(cl_label.toUpperCase(), { x: rightX, y: baseY, size: 8, font: this.bold, color: C.lgrey })
    this.page.drawLine({
      start: { x: rightX, y: baseY - 14 }, end: { x: rightX + colW, y: baseY - 14 },
      thickness: 1, color: C.grey,
    })
    mkField('cl_sig', rightX, baseY - 14, colW, 20)
    this.page.drawText('Printed Name:', { x: rightX, y: baseY - 42, size: 9, font: this.normal, color: C.grey })
    mkField('cl_name', rightX + 78, baseY - 34, colW - 78, 16)
    this.page.drawText('Title:', { x: rightX, y: baseY - 64, size: 9, font: this.normal, color: C.grey })
    mkField('cl_title', rightX + 28, baseY - 56, colW - 28, 16)
    this.page.drawText('Date:', { x: rightX, y: baseY - 86, size: 9, font: this.normal, color: C.grey })
    mkField('cl_date', rightX + 32, baseY - 78, colW - 32, 16)
  }
}

// ── NDA sections helpers ───────────────────────────────────────────────────────

function writeNdaCommonSections(w: DocWriter, forOrcaclub: boolean) {
  const sp   = forOrcaclub ? 'ORCACLUB' : 'Service Provider'
  const name = forOrcaclub ? 'ORCACLUB' : 'Chance Noonan'

  w.section('2. Definition of Confidential Information')
  w.body('Confidential Information means any non-public information disclosed by one Party (the Disclosing Party) to the other Party (the Receiving Party), whether disclosed orally, in writing, electronically, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential. Confidential Information includes, without limitation:')
  w.bullet('Business strategies, marketing plans, pricing structures, and financial data')
  w.bullet('Client lists, vendor relationships, and partnership details')
  w.bullet(forOrcaclub
    ? 'Source code, proprietary tools, systems architecture, and technical workflows'
    : 'Website code, proprietary tools, workflows, and technical systems')
  w.bullet(forOrcaclub
    ? 'Performance data, analytics, creative assets, and campaign information'
    : 'Campaign data, creative assets, ad performance data, and analytics')
  w.bullet('Proposals, contracts, scopes of work, and project deliverables')
  w.bullet('Any other information that a reasonable person in the industry would consider proprietary or sensitive')
  w.sp(4)
  w.sub('2.1 Exclusions')
  w.body('Confidential Information does not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully known to the Receiving Party prior to disclosure; (c) is independently developed by the Receiving Party without reference to the Disclosing Party\'s information; or (d) is required to be disclosed by law or court order, provided prompt written notice is given.')
  w.hr()
}

function writeNdaPortfolioSection(w: DocWriter, spName: string, sectionNum: number) {
  w.section(`${sectionNum}. Portfolio & Public Work`)
  w.bullet(`${spName} may identify Client by name and display or reference any publicly published work product (including live websites, advertisements, social media content, and marketing materials) in ${spName}'s portfolio, case studies, or promotional materials without prior written consent from Client.`)
  w.bullet(`The portfolio right established in this section applies only to work that is publicly visible and accessible; any non-public or confidential work remains subject to the confidentiality obligations of this Agreement.`)
  w.bullet(`Client may, at any time, submit a written request that ${spName} refrain from referencing Client's name or non-public project details in future promotional materials. Such a request is not retroactive and does not apply to publicly accessible work already in ${spName}'s portfolio.`)
  w.hr()
}

// ── SOW payment schedule helper ────────────────────────────────────────────────

function writeSowPaymentSchedule(w: DocWriter, d: SowFormData, accentColor: { r: number; g: number; b: number }) {
  const baseTotal = d.pricingType === 'retainer'
    ? d.retainerItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    : d.projectItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  const entries = d.paymentSchedule || []
  if (entries.length === 0) return

  const colW = [w.innerW * 0.28, w.innerW * 0.1, w.innerW * 0.18, w.innerW * 0.44]
  const rows = entries.map(e => {
    const pct = parseFloat(e.pct) || 0
    const amt = (baseTotal * pct / 100).toFixed(2)
    return [e.label || '—', `${pct}%`, `$${amt}`, e.note || '—']
  })
  w.table(['Payment', '%', 'Amount', 'Trigger / Note'], colW, rows)
  w.sp(4)
}

// ── SOW IP & Termination helpers ───────────────────────────────────────────────

function writeSowIpSection(w: DocWriter, spName: string) {
  w.section('9. Intellectual Property & Ownership')
  w.bullet('All deliverables become the property of Client upon receipt of full payment.')
  w.bullet(`Until full payment is received, all work product remains the intellectual property of ${spName}.`)
  w.bullet(`${spName} retains the right to display or reference any publicly visible work product in portfolio materials, case studies, or promotional content without prior written consent.`)
  w.bullet('The portfolio right applies only to publicly visible and accessible work; non-public work remains confidential under any applicable agreement.')
  w.bullet(`Client may request in writing that ${spName} refrain from referencing Client's name or non-public project details in future materials. Such a request is not retroactive and does not apply to publicly accessible work already displayed.`)
  w.bullet('Third-party tools or assets incorporated into deliverables remain subject to their respective licenses.')
  w.hr()
}

function writeSowTerminationSection(w: DocWriter) {
  w.section('10. Termination')
  w.bullet('Either party may terminate this Agreement with 14 days written notice.')
  w.bullet('Client is responsible for payment of all work completed up to the termination date.')
  w.bullet('Deposits are non-refundable once work has commenced.')
  w.bullet('Service Provider reserves the right to terminate immediately if payment obligations are not met.')
  w.hr()
}

// ── SOW sections 11–12 ─────────────────────────────────────────────────────────

function writeSowTailSections(w: DocWriter, spName: string) {
  w.section('11. Limitation of Liability')
  w.body(`${spName}'s total liability shall not exceed the total fees paid by Client in the 30 days preceding the event giving rise to the claim. ${spName} is not liable for indirect, incidental, or consequential damages.`)
  w.hr()
  w.section('12. Independent Contractor')
  w.body(`${spName} is acting as an independent contractor. Nothing in this Agreement creates an employment, partnership, or agency relationship. ${spName} is solely responsible for applicable taxes on fees received.`)
  w.sp(6)
}

// ── Pricing section (SOW) ──────────────────────────────────────────────────────

function writeSowPricingSection(w: DocWriter, d: SowFormData) {
  const projTotal = d.projectItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const retTotal  = d.retainerItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  if (d.pricingType === 'project' || d.pricingType === 'both') {
    w.sub('Option A — Project-Based (One-Time Fee)')
    const colW = [w.innerW - 100, 100]
    const rows = d.projectItems
      .filter(i => i.desc.trim())
      .map(i => [i.desc, `$${(parseFloat(i.amount) || 0).toFixed(2)}`])
    if (rows.length === 0) rows.push(['No items added', ''])
    w.table(['Description', 'Amount'], colW, rows)
    w.totalRow('Total', `$${projTotal.toFixed(2)}`, colW)
    w.sp(8)
  }

  if (d.pricingType === 'retainer' || d.pricingType === 'both') {
    w.sub('Option B — Monthly Retainer')
    const colW = [w.innerW - 120, 120]
    const rows = d.retainerItems
      .filter(i => i.desc.trim())
      .map(i => [i.desc, `$${(parseFloat(i.amount) || 0).toFixed(2)}`])
    if (rows.length === 0) rows.push(['No items added', ''])
    w.table(['Description', 'Monthly Rate'], colW, rows)
    w.totalRow('Monthly Total', `$${retTotal.toFixed(2)}`, colW)
    w.sp(6)
    w.body(`Billing Cycle: ${d.billingCycle || '—'}    Contract Term: ${d.contractTerm || '—'}`)
    w.sp(4)
  }
}

// ── Personal NDA PDF ───────────────────────────────────────────────────────────

export async function buildPersonalNdaPdf(d: NdaFormData): Promise<Uint8Array> {
  const doc    = await PDFDocument.create()
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const w      = new DocWriter(doc, bold, normal, 'nda_')

  const client = blank(d.clientName)
  const ctype  = d.clientType === 'company' ? 'a company' : 'an individual'

  w.title('Mutual Non-Disclosure Agreement')
  w.subtitle('with Independent Contractor Acknowledgment & Employer Information Firewall')
  w.thr()
  w.sp(4)
  w.body(`Effective Date: ${fmtDate(d.effectiveDate)}`)
  w.sp(4)
  w.body('This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the Effective Date above by and between:')
  w.sp(6)
  w.partyBox('Party 1 — Service Provider', [
    'Chance Noonan, an individual doing business as an independent freelance consultant',
    '("Service Provider"), located in the State of California.',
  ])
  w.noteBox([
    'Note: Service Provider is currently employed full-time by Kawai America Corporation ("Kawai") in a',
    'separate capacity. The services rendered under this Agreement are performed exclusively in Service',
    'Provider\'s independent freelance capacity as Chance Noonan and are in no way affiliated with,',
    'authorized by, or performed on behalf of Kawai.',
  ])
  w.partyBox(`Party 2 — Client`, [
    `${client}, ${ctype}, located at: ${blank(d.clientAddress)}.`,
  ])
  w.body('Each Party is referred to individually as a "Party" and collectively as the "Parties."')
  w.hr()

  w.section('1. Purpose')
  w.body('The Parties intend to explore and/or engage in a business relationship in which Service Provider provides digital marketing, web development, and/or consulting services to Client in Service Provider\'s independent freelance capacity (the "Business Purpose"). In connection with this Business Purpose, each Party may disclose certain Confidential Information to the other.')
  w.hr()

  writeNdaCommonSections(w, false)

  w.section('3. Employer Information Firewall — Kawai America Corporation')
  w.sub('3.1 What Service Provider Will NOT Disclose to Client')
  w.body('Service Provider shall not disclose to Client any Confidential Information belonging to or concerning Kawai, including: proprietary product information; internal pricing or dealer agreements; marketing budgets, campaign strategies, or performance data; customer or dealer lists; trade secrets, intellectual property, or proprietary systems; or any information accessed or handled in Service Provider\'s capacity as a Kawai employee.')
  w.sp(4)
  w.sub('3.2 What Client Will NOT Request')
  w.body('Client acknowledges Service Provider\'s existing confidentiality obligations to Kawai and agrees not to solicit, request, or encourage Service Provider to disclose any Kawai-protected information. Client will not use this engagement to obtain competitive intelligence about Kawai.')
  w.sp(4)
  w.sub('3.3 What Service Provider CAN Provide')
  w.body('Service Provider may apply the following in performing services for Client: general professional knowledge and industry expertise; skills and frameworks developed independently by Service Provider; publicly available industry data and platform documentation; and all creative work, code, and deliverables specifically developed for Client under this engagement.')
  w.sp(4)
  w.sub('3.4 No Agency or Affiliation')
  w.body('Nothing herein creates any agency, partnership, or affiliation between Client and Kawai. Client agrees not to represent to any third party that services rendered under this Agreement are authorized by or connected to Kawai.')
  w.hr()

  w.section('4. Mutual Confidentiality Obligations')
  w.body('Each Party agrees to: hold Confidential Information in strict confidence using no less than reasonable care; not use it for any purpose other than the Business Purpose; not disclose it to any third party without prior written consent; limit access to those with a legitimate need to know who are bound by equivalent obligations; and promptly notify the Disclosing Party of any unauthorized use or disclosure.')
  w.hr()

  w.section('5. Client Confidential Information — Service Provider Obligations')
  w.body('All Confidential Information received from Client shall: be kept strictly confidential and not disclosed to Kawai or its agents; not be used in any work performed for Kawai; not be incorporated into any Kawai-owned systems or deliverables; and be stored separately from any systems used in Service Provider\'s Kawai employment.')
  w.hr()

  w.section('6. Term and Duration')
  w.body('This Agreement shall remain in effect for three (3) years from the Effective Date, unless earlier terminated by mutual written consent. Confidentiality obligations survive termination with respect to any information disclosed during the term.')
  w.hr()

  w.section('7. Return or Destruction of Confidential Information')
  w.body('Upon written request or upon termination, the Receiving Party shall promptly return or destroy all tangible materials containing Confidential Information and certify such return or destruction in writing.')
  w.hr()

  w.section('8. No License; No Warranty')
  w.body('Nothing in this Agreement grants any right, license, or interest in any intellectual property of the other Party. All Confidential Information is provided AS IS without warranty of any kind.')
  w.hr()

  writeNdaPortfolioSection(w, 'Service Provider', 9)

  w.section('10. Remedies')
  w.body('Each Party acknowledges that a breach may cause irreparable harm and that the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.')
  w.hr()

  w.section('11. General Provisions')
  w.body('Governing Law: State of California. Severability: Invalid provisions shall be severed; remaining provisions continue in full force. No Waiver: Failure to enforce shall not constitute waiver. Electronic Signatures: Valid and binding to the same extent as original signatures. Independent Contractor: Nothing herein creates an employment, partnership, or agency relationship.')
  w.sp(8)

  w._np()
  w.thr()
  w.ctr('SIGNATURES', 11, C.navy, true)
  w.ctr('IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date first written above.', 9)
  w.sp(8)
  w.sigBlock(
    'Party 1 — Service Provider', 'Chance Noonan', 'Independent Freelance Consultant',
    'Party 2 — Client', client,
  )
  w.sp(12)
  w.footer('Prepared by Chance Noonan for independent use. Does not constitute legal advice. Consult qualified legal counsel before execution.')

  return doc.save()
}

// ── ORCACLUB NDA PDF ───────────────────────────────────────────────────────────

export async function buildOrcaclubNdaPdf(d: NdaFormData): Promise<Uint8Array> {
  const doc    = await PDFDocument.create()
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const w      = new DocWriter(doc, bold, normal, 'nda_')

  const client = blank(d.clientName)
  const ctype  = d.clientType === 'company' ? 'a company' : 'an individual'

  w.title('Mutual Non-Disclosure Agreement')
  w.subtitle('Confidentiality & Non-Disclosure')
  w.thr()
  w.sp(4)
  w.body(`Effective Date: ${fmtDate(d.effectiveDate)}`)
  w.sp(4)
  w.body('This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the Effective Date above by and between:')
  w.sp(6)
  w.partyBox('Party 1 — Service Provider', [
    'ORCACLUB, a Technical Operations Development Studio ("Service Provider"),',
    'operating as ORCACLUB at orcaclub.pro.',
  ])
  w.partyBox('Party 2 — Client', [
    `${client}, ${ctype}, located at: ${blank(d.clientAddress)}.`,
  ])
  w.body('Each Party is referred to individually as a "Party" and collectively as the "Parties."')
  w.hr()

  w.section('1. Purpose')
  w.body('The Parties intend to explore and/or engage in a business relationship in which Service Provider provides technical operations, development, and/or consulting services to Client (the "Business Purpose"). In connection with this Business Purpose, each Party may disclose certain Confidential Information to the other. This Agreement establishes the obligations of each Party with respect to that information.')
  w.hr()

  writeNdaCommonSections(w, true)

  w.section('3. Mutual Confidentiality Obligations')
  w.body('Each Party agrees to: hold Confidential Information in strict confidence using no less than reasonable care; not use it for any purpose other than the Business Purpose; not disclose it to any third party without prior written consent; limit access to those with a legitimate need to know who are bound by equivalent obligations; and promptly notify the Disclosing Party of any unauthorized use or disclosure.')
  w.hr()

  w.section('4. Term and Duration')
  w.body('This Agreement shall remain in effect for three (3) years from the Effective Date, unless earlier terminated by mutual written consent. Confidentiality obligations survive termination with respect to any information disclosed during the term.')
  w.hr()

  w.section('5. Return or Destruction of Confidential Information')
  w.body('Upon written request or upon termination, the Receiving Party shall promptly return or destroy all tangible materials containing Confidential Information and certify such return or destruction in writing.')
  w.hr()

  w.section('6. No License; No Warranty')
  w.body('Nothing in this Agreement grants any right, license, or interest in any intellectual property of the other Party. All Confidential Information is provided AS IS without warranty of any kind.')
  w.hr()

  writeNdaPortfolioSection(w, 'ORCACLUB', 7)

  w.section('8. Remedies')
  w.body('Each Party acknowledges that a breach may cause irreparable harm and that the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.')
  w.hr()

  w.section('9. General Provisions')
  w.body('Governing Law: State of California. Severability: Invalid provisions shall be severed; remaining provisions continue in full force. No Waiver: Failure to enforce shall not constitute waiver. Electronic Signatures: Valid and binding to the same extent as original signatures. Independent Contractor: Nothing herein creates an employment, partnership, or agency relationship.')
  w.sp(8)

  w._np()
  w.thr()
  w.ctr('SIGNATURES', 11, C.navy, true)
  w.ctr('IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date first written above.', 9)
  w.sp(8)
  w.sigBlock(
    'Party 1 — Service Provider', 'ORCACLUB', 'Authorized Representative',
    'Party 2 — Client', client,
  )
  w.sp(12)
  w.footer('Prepared by ORCACLUB Technical Operations Development Studio · orcaclub.pro · Does not constitute legal advice.')

  return doc.save()
}

// ── SOW shared body ────────────────────────────────────────────────────────────

async function buildSowPdfCore(d: SowFormData, brand: 'personal' | 'orcaclub'): Promise<Uint8Array> {
  const doc    = await PDFDocument.create()
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const w      = new DocWriter(doc, bold, normal, 'sow_')

  const spName  = brand === 'orcaclub' ? 'ORCACLUB Technical Operations Development Studio' : 'Chance Noonan'
  const spShort = brand === 'orcaclub' ? 'ORCACLUB' : 'Chance Noonan'
  const spTitle = brand === 'orcaclub' ? 'Authorized Representative' : 'Independent Freelance Consultant'
  const footer  = brand === 'orcaclub'
    ? 'Prepared by ORCACLUB Technical Operations Development Studio · orcaclub.pro · Does not constitute legal advice.'
    : 'Prepared by Chance Noonan for independent use. Does not constitute legal advice. Consult qualified legal counsel before execution.'

  w.title('Scope of Work')
  w.subtitle(brand === 'orcaclub' ? 'Technical Services Agreement' : 'Independent Contractor Agreement')
  w.thr()

  // Section 1 — Parties table
  w.section('1. Parties')
  const pColW = [w.innerW * 0.28, w.innerW * 0.72]
  w.table([], pColW, [
    ['Service Provider', `${spName}${d.providerContact ? '  ·  ' + d.providerContact : ''}`],
    ['Client',           `${blank(d.clientName)}${d.clientContact ? '  ·  ' + d.clientContact : ''}`],
    ['Effective Date',   fmtDate(d.effectiveDate)],
    ['Project Name',     blank(d.projectName)],
  ])
  w.sp(4)
  w.hr()

  // Section 2 — Overview
  w.section('2. Project Overview')
  w.body(d.projectOverview || '(Not provided.)')
  w.hr()

  // Section 3 — Scope
  w.section('3. Scope of Work')
  const scope = d.scopeItems.filter(i => i.trim())
  if (scope.length > 0) {
    for (const item of scope) w.bullet(item)
  } else {
    w.body('No scope items defined.')
  }
  w.sp(4)
  w.body('Out of Scope: Any work not explicitly listed above requires a written Change Order and may be subject to additional fees.')
  w.hr()

  // Section 4 — Milestones
  w.section('4. Timeline & Milestones')
  const miles = d.milestones.filter(m => m.name.trim())
  if (miles.length > 0) {
    const mColW = [w.innerW * 0.4, w.innerW * 0.2, w.innerW * 0.4]
    const mRows = miles.map(m => {
      const mdt = m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
      return [m.name, mdt, m.notes || '—']
    })
    w.table(['Milestone / Phase', 'Due Date', 'Notes'], mColW, mRows)
  } else {
    w.body('No milestones defined.')
  }
  w.sp(4)
  w.body('Timeline Note: Timelines are contingent on Client providing required materials, access, and feedback within 48 hours of request. Delays caused by Client may shift delivery dates accordingly.')
  w.hr()

  // Section 5 — Pricing
  w.section('5. Pricing & Payment')
  writeSowPricingSection(w, d)
  w.hr()

  // Section 6 — Payment Terms
  w.section('6. Payment Terms')
  writeSowPaymentSchedule(w, d, { r: 0.122, g: 0.306, b: 0.475 })
  w.bullet(`Invoices are due within ${d.netDays || '30'} days of issue.`)
  w.bullet(`Late payments are subject to a ${d.lateFee || '1.5'}% monthly fee after the due date.`)
  w.bullet('Work may be paused or withheld if an invoice remains unpaid beyond 14 days past due.')
  w.hr()

  // Section 7 — Client Responsibilities
  w.section('7. Client Responsibilities')
  w.bullet('Access to required platforms, accounts, and tools')
  w.bullet('Brand assets, copy, and content as requested')
  w.bullet('Timely review and feedback within 48-72 hours of delivery')
  w.bullet('A designated point of contact for approvals and communications')
  w.hr()

  // Section 8 — Revisions
  w.section('8. Revisions')
  w.body(`Included: Up to ${d.revisionRounds || '2'} rounds of revisions per deliverable are included in the quoted price.`)
  w.sp(4)
  w.body(`Additional: Revisions beyond the included rounds will be billed at ${d.revisionRate ? '$' + d.revisionRate + '/hr' : '[rate TBD]'} or as agreed in a Change Order.`)
  w.hr()

  // Section 9 — IP
  writeSowIpSection(w, spShort)

  // Section 10 — Termination
  writeSowTerminationSection(w)

  // Sections 11–12
  writeSowTailSections(w, spShort)

  // Signature page
  w._np()
  w.thr()
  w.ctr('Agreement & Signatures', 11, C.navy, true)
  w.ctr('By signing below, both parties agree to the terms outlined in this Scope of Work.', 9)
  w.sp(8)
  w.sigBlock(
    'Service Provider', spShort, spTitle,
    'Client', blank(d.clientName),
  )
  w.sp(12)
  w.footer(footer)

  return doc.save()
}

export async function buildPersonalSowPdf(d: SowFormData): Promise<Uint8Array> {
  return buildSowPdfCore(d, 'personal')
}

export async function buildOrcaclubSowPdf(d: SowFormData): Promise<Uint8Array> {
  return buildSowPdfCore(d, 'orcaclub')
}
