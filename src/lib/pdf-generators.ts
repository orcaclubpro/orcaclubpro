import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { NdaFormData, SowFormData } from './document-generators'
import { CINZEL_DECORATIVE_BOLD_BASE64 } from './fonts/cinzel-decorative-bold'

// ── Color palette ──────────────────────────────────────────────────────────────

const C = {
  navy:  rgb(0.102, 0.196, 0.400),
  black: rgb(0.10,  0.10,  0.10),
  dark:  rgb(0.24,  0.24,  0.24),
  mid:   rgb(0.42,  0.42,  0.42),
  light: rgb(0.60,  0.60,  0.60),
  rule:  rgb(0.78,  0.80,  0.85),
  bgAlt: rgb(0.952, 0.955, 0.961),
  white: rgb(1,     1,     1),
}

// Brand palette shared by the invoice/proposal/SOW documents
// (matches packages/[package]/print/page.tsx).
const BRAND = {
  ink:    rgb(0.067, 0.067, 0.067), // #111
  gray6:  rgb(0.420, 0.447, 0.502), // #6b7280
  gray4:  rgb(0.612, 0.639, 0.686), // #9ca3af
  rule:   rgb(0.898, 0.906, 0.922), // #e5e7eb
  ruleLt: rgb(0.953, 0.957, 0.965), // #f3f4f6
  headBg: rgb(0.953, 0.957, 0.965), // #f3f4f6
  boxBg:  rgb(0.976, 0.980, 0.984), // #f9fafb
  cyan:   rgb(0.031, 0.569, 0.698), // #0891b2
  navy:   rgb(0.118, 0.227, 0.431), // #1E3A6E
}

/** Width of a letter-spaced (tracked) run. */
function trackedWidth(text: string, size: number, font: PDFFont, spacing: number): number {
  return [...text].reduce((w, ch) => w + font.widthOfTextAtSize(ch, size) + spacing, 0) - spacing
}

/** Draw a letter-spaced (tracked) run; returns the end x. */
function drawTracked(
  page: PDFPage, text: string, x: number, y: number,
  size: number, font: PDFFont, color: ReturnType<typeof rgb>, spacing: number,
): number {
  let cx = x
  for (const ch of text) {
    page.drawText(ch, { x: cx, y, size, font, color })
    cx += font.widthOfTextAtSize(ch, size) + spacing
  }
  return cx - spacing
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(val: string): string {
  if (!val) return '___________________________'
  const d = new Date(val + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function blank(val: string, fallback = '___________________________'): string {
  return val?.trim() || fallback
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

// ── DocWriter ──────────────────────────────────────────────────────────────────

class DocWriter {
  doc:     PDFDocument
  page!:   PDFPage
  bold:    PDFFont
  normal:  PDFFont
  x = 0; y = 0
  ml = 68; mr = 68; mt = 72; mb = 72
  pw = 612; ph = 792
  innerW:  number
  prefix:  string
  gothic?: PDFFont
  branded  = false
  private pageNum  = 0
  private runTitle = ''
  private footNote = ''

  constructor(
    doc: PDFDocument, bold: PDFFont, normal: PDFFont,
    prefix = '', runTitle = '', footNote = '',
    opts?: { gothic?: PDFFont; branded?: boolean },
  ) {
    this.doc      = doc
    this.bold     = bold
    this.normal   = normal
    this.innerW   = this.pw - this.ml - this.mr
    this.prefix   = prefix
    this.runTitle = runTitle
    this.footNote = footNote
    this.gothic   = opts?.gothic
    this.branded  = opts?.branded ?? false
    this._np(true)
  }

  // Brand-aware chrome colors — branded docs (ORCACLUB invoice/proposal/SOW)
  // use the print-page palette; legacy docs (personal NDA/SOW) keep the old look.
  private get cNavy()  { return this.branded ? BRAND.navy   : C.navy }
  private get cRule()  { return this.branded ? BRAND.rule   : C.rule }
  private get cAlt()   { return this.branded ? BRAND.ruleLt : C.bgAlt }
  private get cLabel() { return this.branded ? BRAND.gray6  : C.light }

  /** Branded document header: Cinzel wordmark + tagline, right-aligned label + date. */
  brandHeader(rightLabel: string, dateLabel: string) {
    const g = this.gothic ?? this.bold
    this.page.drawText('ORCACLUB', { x: this.ml, y: this.y, size: 16, font: g, color: BRAND.ink })
    const lw = trackedWidth(rightLabel.toUpperCase(), 7.5, this.bold, 1.6)
    drawTracked(this.page, rightLabel.toUpperCase(), this.pw - this.mr - lw, this.y + 6, 7.5, this.bold, BRAND.gray6, 1.6)
    const dw = this.normal.widthOfTextAtSize(dateLabel, 8.5)
    this.page.drawText(dateLabel, { x: this.pw - this.mr - dw, y: this.y - 8, size: 8.5, font: this.normal, color: BRAND.gray4 })
    this.y -= 14
    drawTracked(this.page, 'WEB DESIGN AND MARKETING AUTOMATION', this.ml, this.y, 6.5, this.normal, BRAND.gray4, 1.4)
    this.y -= 22
    this.page.drawLine({ start: { x: this.ml, y: this.y }, end: { x: this.pw - this.mr, y: this.y }, thickness: 0.6, color: BRAND.rule })
    this.y -= 24
  }

  /** Branded document title: bold heading + tracked uppercase subtitle. */
  brandTitle(title: string, subtitle?: string) {
    this.page.drawText(title, { x: this.ml, y: this.y, size: 20, font: this.bold, color: BRAND.ink })
    this.y -= 26
    if (subtitle) {
      drawTracked(this.page, subtitle.toUpperCase(), this.ml, this.y, 8, this.normal, BRAND.gray4, 1.4)
      this.y -= 20
    }
  }

  // ── Pagination ───────────────────────────────────────────────────────────────

  _np(isFirst = false) {
    this.page = this.doc.addPage([this.pw, this.ph])
    this.pageNum++
    this.x = this.ml
    if (isFirst) {
      this.y = this.ph - this.mt
    } else {
      this._drawRunningHeader()
      this.y = this.ph - 52
    }
  }

  private _drawRunningHeader() {
    const y = this.ph - 33
    this.page.drawLine({
      start: { x: this.ml, y: y - 6 },
      end:   { x: this.pw - this.mr, y: y - 6 },
      thickness: 0.4, color: this.cRule,
    })
    this.page.drawText(this.runTitle, {
      x: this.ml, y, size: 7, font: this.bold, color: this.cLabel,
    })
    const pg  = `Page ${this.pageNum}`
    const pgW = this.normal.widthOfTextAtSize(pg, 7)
    this.page.drawText(pg, {
      x: this.pw - this.mr - pgW, y, size: 7, font: this.normal, color: this.cLabel,
    })
  }

  _drawFooter() {
    this.page.drawLine({
      start: { x: this.ml, y: this.mb + 12 },
      end:   { x: this.pw - this.mr, y: this.mb + 12 },
      thickness: 0.4, color: this.cRule,
    })
    if (!this.footNote) return
    const size = 6.5
    const tw = this.normal.widthOfTextAtSize(this.footNote, size)
    this.page.drawText(this.footNote, {
      x: (this.pw - tw) / 2, y: this.mb,
      size, font: this.normal, color: this.cLabel,
    })
  }

  need(n: number) {
    if (this.y - n < this.mb + 24) {
      this._drawFooter()
      this._np()
    }
  }

  sp(n = 6) { this.y -= n }

  // ── Title block (page 1) ─────────────────────────────────────────────────────

  titleBlock(title: string, subtitle?: string) {
    this.page.drawLine({
      start: { x: this.ml, y: this.y },
      end:   { x: this.pw - this.mr, y: this.y },
      thickness: 2.5, color: C.navy,
    })
    this.y -= 20

    const ts = 17
    const tw = this.bold.widthOfTextAtSize(title, ts)
    this.page.drawText(title, {
      x: (this.pw - tw) / 2, y: this.y,
      size: ts, font: this.bold, color: C.navy,
    })
    this.y -= ts + 8

    if (subtitle) {
      const ss = 8.5
      const sw = this.normal.widthOfTextAtSize(subtitle, ss)
      this.page.drawText(subtitle, {
        x: (this.pw - sw) / 2, y: this.y,
        size: ss, font: this.normal, color: C.mid,
      })
      this.y -= ss + 12
    }

    this.page.drawLine({
      start: { x: this.ml, y: this.y },
      end:   { x: this.pw - this.mr, y: this.y },
      thickness: 0.5, color: C.rule,
    })
    this.y -= 18
  }

  // ── Section heading ──────────────────────────────────────────────────────────

  section(text: string) {
    this.need(26)
    this.sp(10)
    const size = 8.5
    this.page.drawRectangle({
      x: this.ml - 9, y: this.y - (size - 1),
      width: 3, height: size + 1,
      color: this.cNavy,
    })
    this.page.drawText(text.toUpperCase(), {
      x: this.x, y: this.y, size, font: this.bold, color: this.cNavy,
    })
    this.y -= size + 5
    this.page.drawLine({
      start: { x: this.ml, y: this.y },
      end:   { x: this.pw - this.mr, y: this.y },
      thickness: 0.3, color: this.cRule,
    })
    this.y -= 7
  }

  // ── Subsection ───────────────────────────────────────────────────────────────

  sub(text: string) {
    this.need(20)
    this.sp(4)
    this.page.drawText(text, {
      x: this.x, y: this.y, size: 9, font: this.bold, color: C.dark,
    })
    this.y -= 15
  }

  // ── Body text ────────────────────────────────────────────────────────────────

  body(text: string, size = 9.5, color = C.black) {
    const lines = wrap(text, this.normal, size, this.innerW)
    for (const line of lines) {
      this.need(size + 5)
      this.page.drawText(line, { x: this.x, y: this.y, size, font: this.normal, color })
      this.y -= size + 4.5
    }
  }

  // ── Bullet ───────────────────────────────────────────────────────────────────

  bullet(text: string, size = 9.5, indent = 14) {
    const maxW = this.innerW - indent
    const lines = wrap(text, this.normal, size, maxW)
    this.need(size + 5)
    this.page.drawText('•', { x: this.x + 3, y: this.y, size: size - 1, font: this.normal, color: C.mid })
    for (let i = 0; i < lines.length; i++) {
      this.need(size + 5)
      this.page.drawText(lines[i], { x: this.x + indent, y: this.y, size, font: this.normal, color: C.black })
      this.y -= size + 4.5
    }
  }

  // ── Divider ──────────────────────────────────────────────────────────────────

  hr() {
    this.need(14)
    this.sp(6)
    this.page.drawLine({
      start: { x: this.ml, y: this.y },
      end:   { x: this.pw - this.mr, y: this.y },
      thickness: 0.4, color: C.rule,
    })
    this.y -= 8
  }

  // ── Party box ────────────────────────────────────────────────────────────────

  partyBox(tag: string, lines: string[]) {
    const lh   = 13
    const pad  = 10
    const boxH = pad + 11 + lines.length * lh + pad
    this.need(boxH + 8)

    this.page.drawRectangle({
      x: this.ml, y: this.y - boxH, width: this.innerW, height: boxH, color: C.bgAlt,
    })
    this.page.drawRectangle({
      x: this.ml, y: this.y - boxH, width: 3, height: boxH, color: C.navy,
    })

    let ty = this.y - pad
    this.page.drawText(tag.toUpperCase(), {
      x: this.ml + 10, y: ty, size: 7.5, font: this.bold, color: C.navy,
    })
    ty -= lh + 2
    for (const ln of lines) {
      const lns = wrap(ln, this.normal, 9.5, this.innerW - pad * 2 - 6)
      for (const l of lns) {
        this.page.drawText(l, { x: this.ml + 10, y: ty, size: 9.5, font: this.normal, color: C.dark })
        ty -= lh
      }
    }
    this.y -= boxH + 8
  }

  // ── Note box ─────────────────────────────────────────────────────────────────

  noteBox(lines: string[]) {
    const lh   = 12
    const pad  = 9
    const boxH = lines.length * lh + pad * 2 + 4
    this.need(boxH + 4)

    this.page.drawRectangle({
      x: this.ml, y: this.y - boxH, width: this.innerW, height: boxH,
      color: rgb(0.976, 0.974, 0.944),
    })
    this.page.drawRectangle({
      x: this.ml, y: this.y - boxH, width: 3, height: boxH,
      color: rgb(0.72, 0.62, 0.08),
    })

    let ty = this.y - pad
    for (const ln of lines) {
      const lns = wrap(ln, this.normal, 8.5, this.innerW - pad * 2 - 6)
      for (const l of lns) {
        this.page.drawText(l, { x: this.ml + 10, y: ty, size: 8.5, font: this.normal, color: C.dark })
        ty -= lh
      }
    }
    this.y -= boxH + 6
  }

  // ── Table ────────────────────────────────────────────────────────────────────

  table(headers: string[], widths: number[], rows: string[][], size = 9) {
    const rowText = this.branded ? BRAND.ink : C.dark
    if (headers.length > 0) {
      const hRowH = size + 12
      this.need(hRowH + 2)
      if (this.branded) {
        // Light-gray header bar with tracked uppercase labels (matches invoice/proposal)
        const totalW = widths.reduce((a, b) => a + b, 0)
        this.page.drawRectangle({ x: this.ml, y: this.y - hRowH, width: totalW, height: hRowH, color: BRAND.headBg })
        let cx = this.ml
        for (let ci = 0; ci < headers.length; ci++) {
          drawTracked(this.page, headers[ci].toUpperCase(), cx + 6, this.y - size - 4, size - 2, this.bold, BRAND.gray6, 0.8)
          cx += widths[ci]
        }
      } else {
        let cx = this.ml
        for (let ci = 0; ci < headers.length; ci++) {
          this.page.drawRectangle({
            x: cx, y: this.y - hRowH, width: widths[ci], height: hRowH, color: C.navy,
          })
          this.page.drawText(headers[ci], {
            x: cx + 6, y: this.y - size - 4,
            size: size - 0.5, font: this.bold, color: C.white,
          })
          cx += widths[ci]
        }
      }
      this.y -= hRowH + 1
    }

    for (let ri = 0; ri < rows.length; ri++) {
      const bg = ri % 2 === 1 ? this.cAlt : C.white
      let maxLines = 1
      for (let ci = 0; ci < rows[ri].length; ci++) {
        const lns = wrap(rows[ri][ci], this.normal, size, widths[ci] - 12)
        maxLines = Math.max(maxLines, lns.length)
      }
      const rowH = maxLines * (size + 3) + 10
      this.need(rowH + 1)

      let cx = this.ml
      for (let ci = 0; ci < rows[ri].length; ci++) {
        this.page.drawRectangle({
          x: cx, y: this.y - rowH, width: widths[ci], height: rowH, color: bg,
        })
        const lns = wrap(rows[ri][ci], this.normal, size, widths[ci] - 12)
        let ty = this.y - size - 5
        for (const l of lns) {
          this.page.drawText(l, { x: cx + 6, y: ty, size, font: this.normal, color: rowText })
          ty -= size + 3
        }
        cx += widths[ci]
      }
      this.page.drawLine({
        start: { x: this.ml, y: this.y - rowH },
        end:   { x: this.pw - this.mr, y: this.y - rowH },
        thickness: 0.3, color: this.cRule,
      })
      this.y -= rowH + 1
    }
    this.sp(4)
  }

  totalRow(label: string, amount: string, widths: number[]) {
    const size  = 9.5
    const rowH  = size + 14
    const totalW = widths.reduce((a, b) => a + b, 0)
    this.need(rowH + 2)
    this.page.drawLine({
      start: { x: this.ml, y: this.y },
      end:   { x: this.pw - this.mr, y: this.y },
      thickness: 1.2, color: this.cNavy,
    })
    this.page.drawRectangle({
      x: this.ml, y: this.y - rowH, width: totalW, height: rowH,
      color: this.branded ? BRAND.headBg : rgb(0.89, 0.92, 0.97),
    })
    this.page.drawText(label, {
      x: this.ml + 6, y: this.y - size - 5, size, font: this.bold, color: this.branded ? BRAND.ink : C.navy,
    })
    const amtW = this.bold.widthOfTextAtSize(amount, size)
    this.page.drawText(amount, {
      x: this.pw - this.mr - amtW - 6, y: this.y - size - 5, size, font: this.bold, color: this.cNavy,
    })
    this.y -= rowH + 4
  }

  // ── Signature page ───────────────────────────────────────────────────────────

  sigPage(
    sp_label: string, sp_name: string, sp_title: string,
    cl_label: string, witnessClause: string,
  ) {
    this._drawFooter()
    this._np()
    this._drawFooter()

    // Execution header
    this.page.drawLine({
      start: { x: this.ml, y: this.y },
      end:   { x: this.pw - this.mr, y: this.y },
      thickness: 2, color: this.cNavy,
    })
    this.y -= 18

    const htxt = 'AUTHORIZATION AND SIGNATURES'
    const htw  = this.bold.widthOfTextAtSize(htxt, 11)
    this.page.drawText(htxt, {
      x: (this.pw - htw) / 2, y: this.y, size: 11, font: this.bold, color: this.cNavy,
    })
    this.y -= 16

    this.page.drawLine({
      start: { x: this.ml, y: this.y },
      end:   { x: this.pw - this.mr, y: this.y },
      thickness: 0.5, color: this.cRule,
    })
    this.y -= 16

    // Witness clause
    const wcLines = wrap(witnessClause, this.normal, 9.5, this.innerW)
    for (const l of wcLines) {
      this.page.drawText(l, { x: this.ml, y: this.y, size: 9.5, font: this.normal, color: C.dark })
      this.y -= 14
    }
    this.y -= 14

    // Two-column signature block
    const form = this.doc.getForm()
    const gap  = 28
    const colW = (this.innerW - gap) / 2
    const L    = this.ml
    const R    = this.ml + colW + gap

    const mkField = (name: string, x: number, yy: number, w: number, h: number) => {
      try {
        const f = form.createTextField(`${this.prefix}${name}`)
        f.addToPage(this.page, {
          x, y: yy - h + 2, width: w, height: h,
          borderWidth: 0,
          backgroundColor: rgb(0.97, 0.97, 1.00),
        })
        f.setFontSize(10)
      } catch { /* name collision — skip */ }
    }

    const sigLine = (x: number, yy: number, w: number) => {
      this.page.drawLine({ start: { x, y: yy }, end: { x: x + w, y: yy }, thickness: 0.8, color: C.dark })
    }

    const lbl = (text: string, x: number, yy: number) => {
      this.page.drawText(text, { x, y: yy, size: 7, font: this.bold, color: this.cLabel })
    }

    const startY = this.y

    // Column headers
    if (this.branded) {
      this.page.drawRectangle({ x: L, y: startY - 14, width: colW, height: 14, color: BRAND.headBg })
      drawTracked(this.page, sp_label.toUpperCase(), L + 6, startY - 10.5, 7, this.bold, BRAND.gray6, 0.8)
      this.page.drawRectangle({ x: R, y: startY - 14, width: colW, height: 14, color: BRAND.headBg })
      drawTracked(this.page, cl_label.toUpperCase(), R + 6, startY - 10.5, 7, this.bold, BRAND.gray6, 0.8)
    } else {
      this.page.drawRectangle({ x: L, y: startY - 14, width: colW, height: 14, color: C.navy })
      this.page.drawText(sp_label.toUpperCase(), {
        x: L + 6, y: startY - 10.5, size: 7.5, font: this.bold, color: C.white,
      })
      this.page.drawRectangle({ x: R, y: startY - 14, width: colW, height: 14, color: C.navy })
      this.page.drawText(cl_label.toUpperCase(), {
        x: R + 6, y: startY - 10.5, size: 7.5, font: this.bold, color: C.white,
      })
    }

    let y = startY - 26

    // Signature
    lbl('SIGNATURE', L, y)
    lbl('SIGNATURE', R, y)
    y -= 9
    sigLine(L, y, colW)
    sigLine(R, y, colW)
    mkField('sp_sig', L, y, colW, 22)
    mkField('cl_sig', R, y, colW, 22)
    y -= 32

    // Name — SP pre-printed, Client fillable
    lbl('NAME', L, y)
    lbl('NAME', R, y)
    y -= 9
    this.page.drawText(sp_name, { x: L, y, size: 10, font: this.bold, color: C.black })
    sigLine(R, y, colW)
    mkField('cl_name', R, y, colW, 18)
    y -= 24

    // Title — SP pre-printed, Client fillable
    lbl('TITLE / POSITION', L, y)
    lbl('TITLE / POSITION', R, y)
    y -= 9
    this.page.drawText(sp_title, { x: L, y, size: 9.5, font: this.normal, color: C.dark })
    sigLine(R, y, colW)
    mkField('cl_title', R, y, colW, 18)
    y -= 24

    // Date — both fillable
    lbl('DATE', L, y)
    lbl('DATE', R, y)
    y -= 9
    sigLine(L, y, colW)
    sigLine(R, y, colW)
    mkField('sp_date', L, y, colW, 18)
    mkField('cl_date', R, y, colW, 18)
    y -= 28

    // Divider + electronic signature notice
    this.page.drawLine({
      start: { x: this.ml, y: y },
      end:   { x: this.pw - this.mr, y: y },
      thickness: 0.4, color: C.rule,
    })
    y -= 14
    const notice = 'Electronic signatures are valid and legally binding under the ESIGN Act and applicable state law. Printed, ink-signed copies are equally binding.'
    const noticeLines = wrap(notice, this.normal, 8, this.innerW)
    for (const l of noticeLines) {
      this.page.drawText(l, { x: this.ml, y, size: 8, font: this.normal, color: C.light })
      y -= 11
    }

    this.y = y
  }
}

// ── SOW helper — pricing section ───────────────────────────────────────────────

function writeSowPricingSection(w: DocWriter, d: SowFormData) {
  const projTotal = d.projectItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const retTotal  = d.retainerItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  if (d.pricingType === 'project' || d.pricingType === 'both') {
    w.sub('Project-Based Fee (One-Time)')
    const colW = [w.innerW - 100, 100]
    const rows = d.projectItems
      .filter(i => i.desc.trim())
      .map(i => [i.desc, `$${(parseFloat(i.amount) || 0).toFixed(2)}`])
    if (rows.length === 0) rows.push(['(No line items specified)', ''])
    w.table(['Description', 'Amount'], colW, rows)
    w.totalRow('Total Project Fee', `$${projTotal.toFixed(2)}`, colW)
    w.sp(8)
  }

  if (d.pricingType === 'retainer' || d.pricingType === 'both') {
    w.sub('Monthly Retainer')
    const colW = [w.innerW - 120, 120]
    const rows = d.retainerItems
      .filter(i => i.desc.trim())
      .map(i => [i.desc, `$${(parseFloat(i.amount) || 0).toFixed(2)}/mo`])
    if (rows.length === 0) rows.push(['(No line items specified)', ''])
    w.table(['Description', 'Monthly Rate'], colW, rows)
    w.totalRow('Total Monthly Retainer', `$${retTotal.toFixed(2)}/mo`, colW)
    w.sp(4)
    w.body(`Billing Cycle: ${d.billingCycle || '—'}    ·    Contract Term: ${d.contractTerm || '—'}`)
    w.sp(4)
  }
}

// ── SOW helper — payment schedule ─────────────────────────────────────────────

function writeSowPaymentSchedule(w: DocWriter, d: SowFormData) {
  const entries = d.paymentSchedule || []
  if (entries.length === 0) return

  const baseTotal = d.pricingType === 'retainer'
    ? d.retainerItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    : d.projectItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  const colW = [w.innerW * 0.30, w.innerW * 0.10, w.innerW * 0.18, w.innerW * 0.42]
  const rows = entries.map(e => {
    const pct = parseFloat(e.pct) || 0
    const amt = (baseTotal * pct / 100).toFixed(2)
    return [e.label || '—', `${pct}%`, `$${amt}`, e.note || '—']
  })
  w.table(['Payment', '%', 'Amount', 'Trigger / Condition'], colW, rows)
  w.sp(4)
}

// ── Personal NDA ───────────────────────────────────────────────────────────────

export async function buildPersonalNdaPdf(d: NdaFormData): Promise<Uint8Array> {
  const doc    = await PDFDocument.create()
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)

  const client = blank(d.clientName)
  const ctype  = d.clientType === 'company' ? 'a company' : 'an individual'

  const w = new DocWriter(
    doc, bold, normal,
    'nda_p_',
    'MUTUAL NON-DISCLOSURE AGREEMENT — CONFIDENTIAL',
    'Prepared by Chance Noonan · Independent Freelance Consultant · Does not constitute legal advice.',
  )

  // ── Title block ──────────────────────────────────────────────────────────────
  w.titleBlock(
    'Mutual Non-Disclosure Agreement',
    'with Independent Contractor Acknowledgment and Employer Information Firewall',
  )

  // ── Recitals ─────────────────────────────────────────────────────────────────
  w.body(
    `This Mutual Non-Disclosure Agreement (this "Agreement") is entered into as of ${fmtDate(d.effectiveDate)} (the "Effective Date"), by and between Chance Noonan, an independent freelance consultant ("Service Provider"), and ${client}, ${ctype} ("Client"). Service Provider and Client are each referred to herein individually as a "Party" and collectively as the "Parties."`,
  )
  w.sp(10)
  w.body('The Parties intend to explore and/or engage in a business relationship in which Service Provider provides digital marketing, web development, and/or consulting services to Client in Service Provider\'s independent freelance capacity (the "Business Purpose"). In connection with this Business Purpose, each Party may disclose certain Confidential Information to the other. This Agreement sets forth the terms and conditions governing such disclosures.')
  w.sp(8)

  // ── Employer notice ───────────────────────────────────────────────────────────
  w.noteBox([
    'IMPORTANT: Service Provider is currently employed full-time by Kawai America Corporation ("Kawai") in a separate',
    'capacity. All services rendered under this Agreement are performed exclusively in Service Provider\'s independent',
    'freelance capacity and are in no way affiliated with, authorized by, or performed on behalf of Kawai.',
    'Client agrees that this engagement creates no connection to Kawai.',
  ])

  // ── Parties ───────────────────────────────────────────────────────────────────
  w.partyBox('Party 1 — Service Provider', [
    'Chance Noonan, independent freelance consultant',
    'Operating in independent capacity, State of California',
  ])
  w.partyBox('Party 2 — Client', [
    `${client}, ${ctype}`,
    `Address: ${blank(d.clientAddress)}`,
  ])
  w.hr()

  // ── Section 1: Definitions ───────────────────────────────────────────────────
  w.section('1. Definitions')
  w.sub('1.1  Confidential Information')
  w.body('"Confidential Information" means any non-public information disclosed by one Party (the "Disclosing Party") to the other Party (the "Receiving Party"), whether orally, in writing, electronically, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure. Confidential Information includes, without limitation:')
  w.bullet('Business strategies, marketing plans, pricing structures, and financial data')
  w.bullet('Client lists, vendor relationships, and partnership details')
  w.bullet('Website code, proprietary tools, workflows, technical systems, and processes')
  w.bullet('Campaign data, creative assets, ad performance data, and analytics')
  w.bullet('Proposals, contracts, scopes of work, and project deliverables')
  w.bullet('Any other information a reasonable person in the industry would consider proprietary or sensitive')
  w.sp(6)
  w.sub('1.2  Exclusions')
  w.body('Confidential Information does not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully known to the Receiving Party before disclosure; (c) is independently developed by the Receiving Party without reference to the Disclosing Party\'s information; (d) is received from a third party without breach of any obligation of confidentiality; or (e) is required to be disclosed by applicable law or court order, provided the Receiving Party gives prompt written notice to the Disclosing Party and cooperates in seeking a protective order.')
  w.hr()

  // ── Section 2: Employer Information Firewall ─────────────────────────────────
  w.section('2. Employer Information Firewall — Kawai America Corporation')
  w.sub('2.1  Scope of Firewall')
  w.body('Service Provider\'s employment with Kawai America Corporation ("Kawai") is entirely separate from this engagement. Service Provider shall not disclose to Client any Confidential Information belonging to or concerning Kawai, including: proprietary product data; internal pricing or dealer agreements; marketing budgets, campaign strategies, or performance data; customer or dealer lists; trade secrets or proprietary systems; or any information accessed in Service Provider\'s capacity as a Kawai employee.')
  w.sp(4)
  w.sub('2.2  Client Obligations')
  w.body('Client acknowledges Service Provider\'s confidentiality obligations to Kawai and agrees not to solicit, request, or encourage Service Provider to disclose any Kawai-protected information. Client shall not use this engagement to obtain competitive intelligence concerning Kawai.')
  w.sp(4)
  w.sub('2.3  Permitted Scope of Services')
  w.body('Service Provider may apply the following in performing services for Client: general professional knowledge and industry expertise; independently developed skills, tools, and frameworks; publicly available industry data and platform documentation; and all creative work, code, and deliverables specifically developed for Client under this engagement.')
  w.sp(4)
  w.sub('2.4  No Agency or Affiliation')
  w.body('Nothing in this Agreement creates any agency, partnership, or affiliation between Client and Kawai. Client agrees not to represent to any third party that services rendered hereunder are authorized by, connected to, or performed on behalf of Kawai.')
  w.hr()

  // ── Section 3: Confidentiality Obligations ───────────────────────────────────
  w.section('3. Mutual Confidentiality Obligations')
  w.body('Each Party, as a Receiving Party, agrees to:')
  w.bullet('Hold the Disclosing Party\'s Confidential Information in strict confidence, using no less than reasonable care — and in no event less than the same degree of care used to protect its own confidential information of similar nature')
  w.bullet('Not use Confidential Information for any purpose other than evaluating or pursuing the Business Purpose')
  w.bullet('Not disclose Confidential Information to any third party without the Disclosing Party\'s prior written consent')
  w.bullet('Limit access to those employees, contractors, or agents who have a legitimate need to know and who are bound by equivalent confidentiality obligations')
  w.bullet('Promptly notify the Disclosing Party in writing upon discovering any unauthorized use, disclosure, or access to Confidential Information')
  w.sp(4)
  w.body('In addition, all Confidential Information received from Client shall: be kept strictly confidential and not disclosed to Kawai or its agents; not be used in any work performed for Kawai; and be stored separately from any systems used in Service Provider\'s Kawai employment.')
  w.hr()

  // ── Section 4: Term ───────────────────────────────────────────────────────────
  w.section('4. Term and Duration')
  w.body('This Agreement shall remain in effect for three (3) years from the Effective Date, unless earlier terminated by mutual written consent of both Parties. Confidentiality obligations under this Agreement shall survive termination or expiration with respect to any Confidential Information disclosed during the term, and shall remain in effect until such information no longer qualifies as Confidential Information under Section 1.2.')
  w.hr()

  // ── Section 5: Return / Destruction ──────────────────────────────────────────
  w.section('5. Return or Destruction of Confidential Information')
  w.body('Upon written request by the Disclosing Party, or upon termination or expiration of this Agreement, the Receiving Party shall promptly: (a) return all tangible materials containing or embodying Confidential Information; or (b) certify in writing that all such materials have been destroyed. The Receiving Party may retain one archival copy solely to demonstrate compliance with this Agreement.')
  w.hr()

  // ── Section 6: No License; No Warranty ───────────────────────────────────────
  w.section('6. No License or Warranty')
  w.body('Nothing in this Agreement grants either Party any right, license, or interest in any patent, trademark, copyright, trade secret, or other intellectual property of the other Party. All Confidential Information is provided "AS IS," without warranty of any kind, express or implied, including as to accuracy, completeness, or fitness for any particular purpose.')
  w.hr()

  // ── Section 7: Portfolio Rights ───────────────────────────────────────────────
  w.section('7. Portfolio and Public Work Rights')
  w.bullet('Service Provider may identify Client by name and display or reference any publicly published work product (including live websites, published advertisements, social media content, and marketing materials) in Service Provider\'s portfolio, case studies, or promotional materials, without prior written consent from Client.')
  w.bullet('This portfolio right applies only to work that is publicly visible and accessible. Any non-public or confidential work remains subject to the confidentiality obligations of this Agreement.')
  w.bullet('Client may, at any time, submit a written request that Service Provider refrain from referencing Client\'s name or non-public project details in future promotional materials. Such a request is not retroactive and does not apply to publicly accessible work already displayed.')
  w.hr()

  // ── Section 8: Remedies ───────────────────────────────────────────────────────
  w.section('8. Remedies')
  w.body('Both Parties agree to treat each other\'s Confidential Information with the same care they would apply to their own. In the event of a breach that causes harm, the affected Party may seek appropriate remedies, including equitable relief where necessary. Nothing in this Agreement limits the right to pursue available legal remedies.')
  w.hr()

  // ── Section 9: General Provisions ────────────────────────────────────────────
  w.section('9. General Provisions')
  w.body('Governing Law. This Agreement is governed by the laws of the State of California. Disputes not resolved through direct discussion will be addressed through the appropriate California courts.')
  w.sp(4)
  w.body('Entire Agreement. This Agreement represents the full understanding between the Parties on the subject of confidentiality and supersedes any prior discussions or informal understandings. Any amendments require written agreement from both Parties.')
  w.sp(4)
  w.body('Severability. If any provision is found unenforceable, the remaining provisions continue in full effect.')
  w.sp(4)
  w.body('Electronic Signatures. Electronic signatures are valid and legally binding under the ESIGN Act and applicable state law.')
  w.sp(4)
  w.body('Independent Contractor. This Agreement does not create an employment, partnership, or agency relationship between the Parties.')

  // ── Signature page ────────────────────────────────────────────────────────────
  w.sigPage(
    'Service Provider',
    'Chance Noonan',
    'Independent Freelance Consultant',
    'Client',
    'By signing below, both Parties confirm they have read and understood this Agreement and agree to its terms, effective as of the date noted above.',
  )

  w._drawFooter()
  return doc.save()
}

// ── ORCACLUB NDA ───────────────────────────────────────────────────────────────

export async function buildOrcaclubNdaPdf(d: NdaFormData): Promise<Uint8Array> {
  const doc    = await PDFDocument.create()
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)

  const client = blank(d.clientName)
  const ctype  = d.clientType === 'company' ? 'a company' : 'an individual'

  const w = new DocWriter(
    doc, bold, normal,
    'nda_o_',
    'MUTUAL NON-DISCLOSURE AGREEMENT — CONFIDENTIAL',
    'Prepared by ORCACLUB Technical Operations Development Studio · orcaclub.pro · Does not constitute legal advice.',
  )

  // ── Title block ──────────────────────────────────────────────────────────────
  w.titleBlock(
    'Mutual Non-Disclosure Agreement',
    'Mutual Confidentiality and Non-Disclosure',
  )

  // ── Recitals ─────────────────────────────────────────────────────────────────
  w.body(
    `This Mutual Non-Disclosure Agreement (this "Agreement") is entered into as of ${fmtDate(d.effectiveDate)} (the "Effective Date"), by and between ORCACLUB, a Technical Operations Development Studio ("Service Provider"), and ${client}, ${ctype} ("Client"). Service Provider and Client are each referred to herein individually as a "Party" and collectively as the "Parties."`,
  )
  w.sp(10)
  w.body('The Parties intend to explore and/or engage in a business relationship in which Service Provider provides technical operations, development, and/or consulting services to Client (the "Business Purpose"). In connection with this Business Purpose, each Party may disclose certain Confidential Information to the other. This Agreement sets forth the terms and conditions governing such disclosures.')
  w.sp(8)

  w.partyBox('Party 1 — Service Provider', [
    'ORCACLUB, a Technical Operations Development Studio',
    'Website: orcaclub.pro',
  ])
  w.partyBox('Party 2 — Client', [
    `${client}, ${ctype}`,
    `Address: ${blank(d.clientAddress)}`,
  ])
  w.hr()

  // ── Section 1: Definitions ───────────────────────────────────────────────────
  w.section('1. Definitions')
  w.sub('1.1  Confidential Information')
  w.body('"Confidential Information" means any non-public information disclosed by one Party (the "Disclosing Party") to the other Party (the "Receiving Party"), whether orally, in writing, electronically, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information includes, without limitation:')
  w.bullet('Business strategies, marketing plans, pricing structures, and financial data')
  w.bullet('Client lists, vendor relationships, and partnership details')
  w.bullet('Source code, proprietary tools, systems architecture, and technical workflows')
  w.bullet('Performance data, analytics, creative assets, and campaign information')
  w.bullet('Proposals, contracts, scopes of work, and project deliverables')
  w.bullet('Any other information a reasonable person in the industry would consider proprietary or sensitive')
  w.sp(6)
  w.sub('1.2  Exclusions')
  w.body('Confidential Information does not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully known to the Receiving Party before disclosure; (c) is independently developed by the Receiving Party without reference to the Disclosing Party\'s information; (d) is received from a third party without breach of any obligation of confidentiality; or (e) is required to be disclosed by applicable law or court order, provided the Receiving Party gives prompt written notice to the Disclosing Party and cooperates in seeking a protective order.')
  w.hr()

  // ── Section 2: Mutual Obligations ───────────────────────────────────────────
  w.section('2. Mutual Confidentiality Obligations')
  w.body('Each Party, as a Receiving Party, agrees to:')
  w.bullet('Hold the Disclosing Party\'s Confidential Information in strict confidence, using no less than reasonable care — and in no event less than the same degree of care used to protect its own confidential information of similar nature')
  w.bullet('Not use Confidential Information for any purpose other than evaluating or pursuing the Business Purpose')
  w.bullet('Not disclose Confidential Information to any third party without the Disclosing Party\'s prior written consent')
  w.bullet('Limit access to those employees, contractors, or agents who have a legitimate need to know and who are bound by equivalent confidentiality obligations')
  w.bullet('Promptly notify the Disclosing Party in writing upon discovering any unauthorized use, disclosure, or access to Confidential Information')
  w.hr()

  // ── Section 3: Term ───────────────────────────────────────────────────────────
  w.section('3. Term and Duration')
  w.body('This Agreement shall remain in effect for three (3) years from the Effective Date, unless earlier terminated by mutual written consent of both Parties. Confidentiality obligations shall survive termination or expiration with respect to any Confidential Information disclosed during the term, and shall remain in effect until such information no longer qualifies as Confidential Information under Section 1.2.')
  w.hr()

  // ── Section 4: Return / Destruction ──────────────────────────────────────────
  w.section('4. Return or Destruction of Confidential Information')
  w.body('Upon written request by the Disclosing Party, or upon termination or expiration of this Agreement, the Receiving Party shall promptly: (a) return all tangible materials containing or embodying Confidential Information; or (b) certify in writing that all such materials have been destroyed. The Receiving Party may retain one archival copy solely to demonstrate compliance with this Agreement.')
  w.hr()

  // ── Section 5: No License; No Warranty ───────────────────────────────────────
  w.section('5. No License or Warranty')
  w.body('Nothing in this Agreement grants either Party any right, license, or interest in any patent, trademark, copyright, trade secret, or other intellectual property of the other Party. All Confidential Information is provided "AS IS," without warranty of any kind, express or implied, including as to accuracy, completeness, or fitness for any particular purpose.')
  w.hr()

  // ── Section 6: Portfolio Rights ───────────────────────────────────────────────
  w.section('6. Portfolio and Public Work Rights')
  w.bullet('ORCACLUB may identify Client by name and display or reference any publicly published work product (including live websites, published advertisements, social media content, and marketing materials) in ORCACLUB\'s portfolio, case studies, or promotional materials, without prior written consent from Client.')
  w.bullet('This portfolio right applies only to work that is publicly visible and accessible. Any non-public or confidential work remains subject to the confidentiality obligations of this Agreement.')
  w.bullet('Client may, at any time, submit a written request that ORCACLUB refrain from referencing Client\'s name or non-public project details in future promotional materials. Such a request is not retroactive.')
  w.hr()

  // ── Section 7: Remedies ───────────────────────────────────────────────────────
  w.section('7. Remedies')
  w.body('Each Party acknowledges that unauthorized disclosure or use of Confidential Information may cause irreparable harm for which monetary damages would be an inadequate remedy. Accordingly, the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, without the requirement to post bond or prove actual damages, in addition to all other remedies available at law or in equity.')
  w.hr()

  // ── Section 8: General Provisions ────────────────────────────────────────────
  w.section('8. General Provisions')
  w.body('Governing Law and Jurisdiction. This Agreement is governed by the laws of the State of California, without regard to conflict-of-law principles. Any disputes shall be resolved in the state or federal courts of California.')
  w.sp(4)
  w.body('Entire Agreement. This Agreement is the entire agreement between the Parties regarding its subject matter and supersedes all prior negotiations, representations, and agreements, whether oral or written.')
  w.sp(4)
  w.body('Severability. If any provision is found invalid or unenforceable, the remaining provisions shall remain in full force and effect.')
  w.sp(4)
  w.body('No Waiver. No failure to exercise any right under this Agreement shall constitute a waiver of that right. Any waiver must be in writing and signed by the waiving Party.')
  w.sp(4)
  w.body('Amendments. This Agreement may be amended only by a written instrument signed by both Parties.')
  w.sp(4)
  w.body('Electronic Signatures. Electronic signatures are valid and binding under the ESIGN Act and applicable state law.')
  w.sp(4)
  w.body('Independent Contractor. Nothing in this Agreement creates an employment, partnership, joint venture, or agency relationship between the Parties.')

  // ── Signature page ────────────────────────────────────────────────────────────
  w.sigPage(
    'Service Provider',
    'ORCACLUB',
    'Authorized Representative',
    'Client',
    'By signing below, both Parties confirm they have read and understood this Agreement and agree to its terms, effective as of the date noted above.',
  )

  w._drawFooter()
  return doc.save()
}

// ── SOW core ───────────────────────────────────────────────────────────────────

async function buildSowCore(d: SowFormData, brand: 'personal' | 'orcaclub'): Promise<Uint8Array> {
  const doc    = await PDFDocument.create()
  const isOrcaclub = brand === 'orcaclub'
  if (isOrcaclub) doc.registerFontkit(fontkit)
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const gothic = isOrcaclub
    ? await doc.embedFont(Buffer.from(CINZEL_DECORATIVE_BOLD_BASE64, 'base64'), { subset: true })
    : undefined

  const spName  = d.providerName?.trim() || (isOrcaclub ? 'ORCACLUB' : 'Chance Noonan')
  const spFull  = d.providerName?.trim() || (isOrcaclub ? 'ORCACLUB Technical Operations Development Studio' : 'Chance Noonan, Independent Freelance Consultant')
  const spTitle = isOrcaclub ? 'Authorized Representative' : 'Independent Freelance Consultant'
  const subtitle = isOrcaclub ? 'Technical Services Agreement' : 'Independent Contractor Agreement'
  const footNote = isOrcaclub
    ? 'ORCACLUB · Web Design and Marketing Automation · orcaclub.pro · Does not constitute legal advice.'
    : `Prepared by ${spName} · Independent Freelance Consultant · Does not constitute legal advice.`

  const w = new DocWriter(
    doc, bold, normal,
    'sow_',
    `SCOPE OF WORK AGREEMENT — ${blank(d.projectName, 'CONFIDENTIAL')}`,
    footNote,
    { gothic, branded: isOrcaclub },
  )

  // ── Title block ──────────────────────────────────────────────────────────────
  if (isOrcaclub) {
    w.brandHeader('Scope of Work', fmtDate(d.effectiveDate))
    w.brandTitle('Scope of Work Agreement', subtitle)
  } else {
    w.titleBlock('Scope of Work Agreement', subtitle)
  }

  // ── Opening recital ──────────────────────────────────────────────────────────
  w.body(
    `This Scope of Work Agreement (this "Agreement") is entered into as of ${fmtDate(d.effectiveDate)}, by and between ${spFull} ("Service Provider") and ${blank(d.clientName)} ("Client"). This Agreement defines the scope, timeline, fees, and terms governing the engagement described below.`,
  )
  w.sp(8)

  // ── Section 1: Parties ───────────────────────────────────────────────────────
  w.section('1. Parties and Project Identification')
  const pColW = [w.innerW * 0.30, w.innerW * 0.70]
  const pRows: string[][] = [
    ['Service Provider', `${spFull}${d.providerContact ? '  ·  ' + d.providerContact : ''}`],
    ['Client',           `${blank(d.clientName)}${d.clientContact ? '  ·  ' + d.clientContact : ''}`],
    ['Effective Date',   fmtDate(d.effectiveDate)],
    ['Project Name',     blank(d.projectName)],
  ]
  w.table([], pColW, pRows)
  w.hr()

  // ── Section 2: Scope of Work ─────────────────────────────────────────────────
  w.section('2. Project Overview')
  w.body(d.projectOverview || '(Not provided.)')
  w.hr()

  // ── Section 3: Scope ─────────────────────────────────────────────────────────
  w.section('3. Scope of Work and Deliverables')
  w.body('Service Provider shall perform the following services and deliver the following items (collectively, the "Deliverables"):')
  w.sp(4)
  const scope = d.scopeItems.filter(i => i.trim())
  if (scope.length > 0) {
    const sColW = [w.innerW * 0.08, w.innerW * 0.92]
    const sRows = scope.map((item, i) => [`${i + 1}.`, item])
    w.table(['#', 'Deliverable / Service'], sColW, sRows)
  } else {
    w.body('(Scope items to be defined by written amendment.)')
  }
  w.sp(4)
  w.sub('3.1  Out of Scope')
  w.body('Work not explicitly listed above is outside the scope of this Agreement. Any additional requests will be addressed through a written Change Order — outlining the work, timeline impact, and cost — agreed upon by both Parties before work begins.')
  w.hr()

  // ── Section 4: Timeline ───────────────────────────────────────────────────────
  w.section('4. Timeline and Milestones')
  const miles = d.milestones.filter(m => m.name.trim())
  if (miles.length > 0) {
    const mColW = [w.innerW * 0.38, w.innerW * 0.20, w.innerW * 0.42]
    const mRows = miles.map(m => {
      const dt = m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'
      return [m.name, dt, m.notes || '—']
    })
    w.table(['Milestone / Phase', 'Target Date', 'Notes'], mColW, mRows)
  } else {
    w.body('Milestone schedule to be agreed upon in writing following execution of this Agreement.')
  }
  w.sp(4)
  w.body('Timelines are contingent on both Parties\' timely participation. When materials, access, or feedback are requested, a response within 48 hours keeps the project on track. If delays occur on either side, target dates adjust accordingly to protect the quality of the work.')
  w.hr()

  // ── Section 5: Pricing ───────────────────────────────────────────────────────
  w.section('5. Fees and Pricing')
  writeSowPricingSection(w, d)
  w.hr()

  // ── Section 6: Payment Terms ─────────────────────────────────────────────────
  w.section('6. Payment Terms and Schedule')
  writeSowPaymentSchedule(w, d)
  w.bullet(`Invoices are due within ${d.netDays || '30'} days of the invoice date. Each invoice will be itemized and sent promptly upon the applicable milestone or billing period.`)
  w.bullet(`Balances not settled by the due date may accrue a late fee of ${d.lateFee || '1.5'}% per month on the outstanding amount. Service Provider will notify Client before any fees are applied.`)
  w.bullet('If an invoice remains materially past due, Service Provider may pause active work until the outstanding balance is resolved. Service Provider will communicate before taking this step.')
  w.bullet('Deposits and advance payments are non-refundable once work has commenced, as they represent resources and time already committed to the project.')
  w.hr()

  // ── Section 7: Client Responsibilities ───────────────────────────────────────
  w.section('7. Client Responsibilities')
  w.body('Successful delivery depends on both Parties\' active participation. Client agrees to:')
  w.bullet('Provide access to relevant platforms, accounts, tools, and credentials as reasonably required')
  w.bullet('Supply brand assets, copy, content, and supporting materials in a timely manner')
  w.bullet('Review deliverables and provide consolidated written feedback within 48–72 hours of delivery')
  w.bullet('Maintain a consistent point of contact with authority to approve decisions and communications')
  w.bullet('Communicate changes to project requirements, stakeholders, or direction as early as possible')
  w.body('If any of the above is delayed, both Parties will communicate promptly to assess the impact on timeline and scope.')
  w.hr()

  // ── Section 8: Revisions and Change Orders ────────────────────────────────────
  w.section('8. Revisions and Change Orders')
  w.sub('8.1  Included Revisions')
  w.body(`This Agreement includes up to ${d.revisionRounds || '2'} round(s) of revisions per deliverable. A revision round consists of one consolidated set of feedback submitted after delivery. Batching feedback into a single round keeps the process efficient and well-documented for both Parties.`)
  w.sp(4)
  w.sub('8.2  Additional Revisions')
  w.body(`Revisions beyond the included rounds, or requests that materially alter the original direction, are billed at ${d.revisionRate ? '$' + d.revisionRate + '/hr' : 'Service Provider\'s standard hourly rate'}. Service Provider will confirm the estimated cost before proceeding.`)
  w.sp(4)
  w.sub('8.3  Change Orders')
  w.body('Requests for work outside the defined scope are handled through a written Change Order that details the additional work, timeline impact, and associated cost. Work on any change begins only after both Parties have signed the Change Order.')
  w.hr()

  // ── Section 9: Intellectual Property ─────────────────────────────────────────
  w.section('9. Intellectual Property and Ownership')
  w.sub('9.1  Assignment of Deliverables')
  w.body('Upon receipt of full payment for all amounts due under this Agreement, Service Provider hereby assigns to Client all right, title, and interest in and to the Deliverables, including all applicable intellectual property rights therein. No assignment shall be deemed made until full payment is received.')
  w.sp(4)
  w.sub('9.2  Background IP')
  w.body(`Service Provider retains all right, title, and interest in and to any pre-existing tools, methodologies, code libraries, frameworks, processes, or know-how ("Background IP") used in performing the services. To the extent any Background IP is incorporated into the Deliverables, Service Provider grants Client a non-exclusive, royalty-free, perpetual license to use such Background IP solely as part of the Deliverables.`)
  w.sp(4)
  w.sub('9.3  Portfolio Rights')
  w.body(`${spName} may identify Client by name and reference publicly visible Deliverables in ${spName}'s portfolio, case studies, and promotional materials. This right applies only to publicly accessible work; non-public Deliverables remain confidential. Client may request in writing that ${spName} cease future references to Client's name; such request is not retroactive.`)
  w.hr()

  // ── Section 10: Confidentiality ───────────────────────────────────────────────
  w.section('10. Confidentiality')
  w.body('Each Party agrees to hold in confidence all non-public information disclosed by the other Party in connection with this Agreement ("Confidential Information"), using at least the same degree of care as it uses to protect its own confidential information. Neither Party shall disclose the other\'s Confidential Information to any third party without prior written consent, except as required by law. This obligation shall survive termination of this Agreement for a period of three (3) years. If the Parties have executed a separate Non-Disclosure Agreement, its terms shall govern and supplement this Section.')
  w.hr()

  // ── Section 11: Limited Warranty ─────────────────────────────────────────────
  w.section('11. Quality and Warranty')
  w.body(`Service Provider warrants that Deliverables will perform materially as specified for 30 days following final delivery. Any defects originating from Service Provider's work will be corrected at no additional charge within this period. This warranty does not extend to issues resulting from Client modifications, third-party platform behavior, or changes made after final sign-off. Beyond the warranty period, additional support is scoped and billed as new work.`)
  w.hr()

  // ── Section 12: Termination ───────────────────────────────────────────────────
  w.section('12. Termination')
  w.body('Either Party may terminate this Agreement with 14 days\' written notice. Upon termination:')
  w.bullet('Client is responsible for payment of all work completed and expenses incurred through the termination date, billed on a pro-rata basis')
  w.bullet('Deposits and payments applied to work already underway are non-refundable')
  w.bullet('Service Provider will deliver all completed Deliverables and meaningful work-in-progress upon receipt of final payment')
  w.bullet('Both Parties are encouraged to raise concerns in writing early, so that issues can be addressed before termination becomes necessary')
  w.hr()

  // ── Section 13: Limitation of Liability ──────────────────────────────────────
  w.section('13. Limitation of Liability')
  w.body(`Neither Party shall be liable to the other for indirect, incidental, or consequential damages — including lost revenue, lost data, or loss of business opportunity — arising from or related to this Agreement. Service Provider's total liability shall not exceed the total fees paid by Client in the three months preceding the event giving rise to the claim. These limitations reflect a reasonable and standard allocation of risk between professional service providers and their clients.`)
  w.hr()

  // ── Section 14: Independent Contractor ────────────────────────────────────────
  w.section('14. Independent Contractor')
  w.body(`${spName} performs services under this Agreement as an independent contractor, not as an employee or agent of Client. Service Provider is solely responsible for its own taxes, benefits, and business obligations. Service Provider may engage with other clients during this Agreement, provided those engagements do not interfere with the commitments made herein.`)
  w.hr()

  // ── Section 15: General Provisions ───────────────────────────────────────────
  w.section('15. General Provisions')
  w.body('Governing Law. This Agreement is governed by the laws of the State of California. Any disputes not resolved through direct negotiation will be addressed through the appropriate courts in California.')
  w.sp(4)
  w.body('Entire Agreement. This document, together with any executed Change Orders, constitutes the complete agreement between the Parties for this engagement and supersedes any prior discussions or informal understandings on the same subject.')
  w.sp(4)
  w.body('Severability and Amendments. If any provision of this Agreement is found unenforceable, the remaining terms continue in full effect. Either provision may be amended by written agreement signed by both Parties.')
  w.sp(4)
  w.body('Force Majeure. Neither Party is liable for delays caused by circumstances outside their reasonable control. In such cases, both Parties will communicate promptly and agree on a reasonable path forward.')
  w.sp(4)
  w.body('Electronic Signatures. Signatures obtained electronically are valid and enforceable under the ESIGN Act and applicable state law, with the same legal effect as original ink signatures.')

  // ── Signature page ────────────────────────────────────────────────────────────
  w.sigPage(
    'Service Provider',
    spName,
    spTitle,
    'Client',
    'By signing below, both Parties confirm they have reviewed this Agreement, understand its terms, and agree to proceed accordingly.',
  )

  w._drawFooter()
  return doc.save()
}

export async function buildPersonalSowPdf(d: SowFormData): Promise<Uint8Array> {
  return buildSowCore(d, 'personal')
}

export async function buildOrcaclubSowPdf(d: SowFormData): Promise<Uint8Array> {
  return buildSowCore(d, 'orcaclub')
}

// ── Package Invoice / Proposal PDF ─────────────────────────────────────────────

export interface PackagePdfLineItem {
  name: string
  description?: string | null
  quantity: number
  rate: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

export interface PackagePdfData {
  sendAs: 'proposal' | 'invoice'
  ref: string
  packageName: string
  dateLabel: string
  clientLines: string[]
  description?: string | null
  coverMessage?: string | null
  lineItems: PackagePdfLineItem[]
  paymentSchedule?: Array<{ label: string; amount: number; dueDateLabel?: string | null }>
}

function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const P = BRAND

export async function buildPackagePdf(d: PackagePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const gothic = await doc.embedFont(Buffer.from(CINZEL_DECORATIVE_BOLD_BASE64, 'base64'), { subset: true })

  const isInvoice = d.sendAs === 'invoice'
  const PW = 612, PH = 792, ML = 56, MR = 56, MB = 64
  const innerW = PW - ML - MR

  let page = doc.addPage([PW, PH])
  let y = PH - 64

  const ensure = (h: number) => {
    if (y - h < MB + 20) {
      page = doc.addPage([PW, PH])
      y = PH - 64
    }
  }

  // Letter-spaced label, mirroring the print page's tracked uppercase style
  const tracked = (text: string, x: number, ty: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>, spacing: number) => {
    let cx = x
    for (const ch of text) {
      page.drawText(ch, { x: cx, y: ty, size, font, color })
      cx += font.widthOfTextAtSize(ch, size) + spacing
    }
    return cx - spacing
  }
  const trackedW = (text: string, size: number, font: PDFFont, spacing: number) =>
    [...text].reduce((w, ch) => w + font.widthOfTextAtSize(ch, size) + spacing, 0) - spacing

  const rightText = (text: string, size: number, font: PDFFont, color: ReturnType<typeof rgb>, ty: number) => {
    page.drawText(text, { x: PW - MR - font.widthOfTextAtSize(text, size), y: ty, size, font, color })
  }

  const hr = (color = P.rule, thickness = 0.6) => {
    page.drawLine({ start: { x: ML, y }, end: { x: PW - MR, y }, thickness, color })
  }

  // ── Header: wordmark + tagline | label + ref + date ─────────────────────────
  page.drawText('ORCACLUB', { x: ML, y, size: 16, font: gothic, color: P.ink })
  const label = isInvoice ? 'INVOICE' : 'PROPOSAL'
  const labelW = trackedW(label, 7.5, bold, 1.6)
  tracked(label, PW - MR - labelW, y + 6, 7.5, bold, P.gray6, 1.6)
  rightText(d.ref, 11, bold, P.ink, y - 8)
  y -= 14
  tracked('WEB DESIGN AND MARKETING AUTOMATION', ML, y, 6.5, normal, P.gray4, 1.4)
  rightText(d.dateLabel, 8.5, normal, P.gray4, y - 6)
  y -= 30
  hr()
  y -= 26

  // ── Bill To (left) | package name + description (right) ─────────────────────
  const blockTop = y
  if (d.clientLines.length > 0) {
    tracked('BILL TO', ML, y, 7, bold, P.gray4, 1.6)
    y -= 15
    d.clientLines.forEach((line, i) => {
      const font = i === 0 ? bold : normal
      const size = i === 0 ? 10.5 : 9
      page.drawText(line, { x: ML, y, size, font, color: i === 0 ? P.ink : P.gray6 })
      y -= size + 4
    })
  }
  let ry = blockTop - 2
  const nameW = 300
  for (const ln of wrap(d.packageName, bold, 14, nameW)) {
    page.drawText(ln, { x: PW - MR - bold.widthOfTextAtSize(ln, 14), y: ry, size: 14, font: bold, color: P.ink })
    ry -= 18
  }
  if (d.description) {
    ry -= 2
    for (const ln of wrap(d.description.replace(/\s+/g, ' '), normal, 8.5, 260)) {
      page.drawText(ln, { x: PW - MR - normal.widthOfTextAtSize(ln, 8.5), y: ry, size: 8.5, font: normal, color: P.gray6 })
      ry -= 12
    }
  }
  y = Math.min(y, ry) - 20

  // ── Cover message (proposal only) ───────────────────────────────────────────
  if (!isInvoice && d.coverMessage) {
    const lines = wrap(d.coverMessage.replace(/\s+/g, ' '), normal, 9, innerW - 36)
    const boxH = lines.length * 13 + 22
    ensure(boxH + 10)
    page.drawRectangle({ x: ML, y: y - boxH, width: innerW, height: boxH, color: P.boxBg })
    page.drawRectangle({ x: ML, y: y - boxH, width: 3, height: boxH, color: P.navy })
    let ty = y - 16
    for (const ln of lines) {
      page.drawText(ln, { x: ML + 18, y: ty, size: 9, font: normal, color: P.gray6 })
      ty -= 13
    }
    y -= boxH + 22
  }

  // ── Line items table ────────────────────────────────────────────────────────
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of d.lineItems) {
    const total = item.rate * item.quantity
    if (item.isRecurring) {
      if (item.recurringInterval === 'year') annual += total
      else monthly += total
    } else {
      oneTime += total
    }
  }

  const colQty = 50, colRate = 85, colAmt = 90
  const colName = innerW - colQty - colRate - colAmt
  const xQty  = ML + colName
  const xRate = xQty + colQty
  const xAmt  = xRate + colRate

  // Header row
  ensure(40)
  page.drawRectangle({ x: ML, y: y - 22, width: innerW, height: 22, color: P.headBg })
  const hy = y - 15
  tracked('ITEM', ML + 12, hy, 7, bold, P.gray6, 1.2)
  tracked('QTY', xQty + (colQty - trackedW('QTY', 7, bold, 1.2)) / 2, hy, 7, bold, P.gray6, 1.2)
  tracked('RATE', xRate + colRate - trackedW('RATE', 7, bold, 1.2) - 12, hy, 7, bold, P.gray6, 1.2)
  tracked('AMOUNT', xAmt + colAmt - trackedW('AMOUNT', 7, bold, 1.2) - 12, hy, 7, bold, P.gray6, 1.2)
  y -= 22

  // Rows
  for (let i = 0; i < d.lineItems.length; i++) {
    const item = d.lineItems[i]
    const per = item.isRecurring ? (item.recurringInterval === 'year' ? '/yr' : '/mo') : ''
    const nameLines = wrap(item.name.replace(/\s+/g, ' '), bold, 9.5, colName - 24)
    const descLines = item.description ? wrap(item.description.replace(/\s+/g, ' '), normal, 8, colName - 24) : []
    const tagH = item.isRecurring ? 12 : 0
    const rowH = 12 + nameLines.length * 13 + descLines.length * 11 + tagH + 10
    ensure(rowH)

    let ty = y - 12 - 9.5 + 2
    for (const ln of nameLines) {
      page.drawText(ln, { x: ML + 12, y: ty, size: 9.5, font: bold, color: P.ink })
      ty -= 13
    }
    for (const ln of descLines) {
      page.drawText(ln, { x: ML + 12, y: ty, size: 8, font: normal, color: P.gray6 })
      ty -= 11
    }
    if (item.isRecurring) {
      tracked(item.recurringInterval === 'year' ? 'ANNUAL' : 'MONTHLY', ML + 12, ty, 6.5, bold, P.cyan, 1.2)
    }

    const vy = y - 12 - 9.5 + 2
    const qtyStr = String(item.quantity)
    page.drawText(qtyStr, { x: xQty + (colQty - normal.widthOfTextAtSize(qtyStr, 9)) / 2, y: vy, size: 9, font: normal, color: P.gray6 })
    const rateStr = `${money(item.rate)}${per}`
    page.drawText(rateStr, { x: xRate + colRate - normal.widthOfTextAtSize(rateStr, 9) - 12, y: vy, size: 9, font: normal, color: P.gray6 })
    const amtStr = `${money(item.rate * item.quantity)}${per}`
    page.drawText(amtStr, { x: xAmt + colAmt - bold.widthOfTextAtSize(amtStr, 9) - 12, y: vy, size: 9, font: bold, color: P.ink })

    y -= rowH
    if (i < d.lineItems.length - 1) {
      page.drawLine({ start: { x: ML, y }, end: { x: PW - MR, y }, thickness: 0.5, color: P.ruleLt })
    }
  }
  hr()
  y -= 18

  // ── Totals (right-aligned block, like the print page) ───────────────────────
  const totX = PW - MR - 240
  const totRow = (labelTxt: string, valueTxt: string, opts?: { valueColor?: ReturnType<typeof rgb>; boldLabel?: boolean; size?: number }) => {
    ensure(18)
    const size = opts?.size ?? 9.5
    page.drawText(labelTxt, { x: totX, y, size, font: opts?.boldLabel ? bold : normal, color: opts?.boldLabel ? P.ink : P.gray6 })
    page.drawText(valueTxt, { x: PW - MR - bold.widthOfTextAtSize(valueTxt, size), y, size, font: bold, color: opts?.valueColor ?? P.ink })
    y -= size + 8
  }

  if (oneTime > 0 && (monthly > 0 || annual > 0)) totRow('Subtotal (one-time)', money(oneTime))
  if (monthly > 0) totRow('Monthly recurring', `${money(monthly)}/mo`, { valueColor: P.cyan })
  if (annual > 0)  totRow('Annual recurring', `${money(annual)}/yr`, { valueColor: P.cyan })
  ensure(24)
  page.drawLine({ start: { x: totX, y: y + 4 }, end: { x: PW - MR, y: y + 4 }, thickness: 0.6, color: P.rule })
  y -= 6
  totRow('Total due', money(oneTime > 0 ? oneTime : monthly + annual), { boldLabel: true, size: 11 })
  y -= 12

  // ── Payment schedule (proposal only) ────────────────────────────────────────
  if (!isInvoice && d.paymentSchedule && d.paymentSchedule.length > 0) {
    ensure(60)
    hr(P.ruleLt)
    y -= 20
    tracked('PAYMENT SCHEDULE', ML, y, 7, bold, P.gray4, 1.6)
    y -= 16

    const sAmtW = 100, sDateW = 110
    const sNameW = innerW - sAmtW - sDateW
    page.drawRectangle({ x: ML, y: y - 20, width: innerW, height: 20, color: P.headBg })
    const shy = y - 14
    tracked('PAYMENT', ML + 12, shy, 7, bold, P.gray6, 1.2)
    tracked('AMOUNT', ML + sNameW + sAmtW - trackedW('AMOUNT', 7, bold, 1.2) - 12, shy, 7, bold, P.gray6, 1.2)
    tracked('DUE DATE', ML + sNameW + sAmtW + sDateW - trackedW('DUE DATE', 7, bold, 1.2) - 12, shy, 7, bold, P.gray6, 1.2)
    y -= 20

    for (let i = 0; i < d.paymentSchedule.length; i++) {
      const e = d.paymentSchedule[i]
      ensure(24)
      const vy = y - 15
      page.drawText(e.label, { x: ML + 12, y: vy, size: 9.5, font: normal, color: P.ink })
      const amtStr = money(e.amount)
      page.drawText(amtStr, { x: ML + sNameW + sAmtW - bold.widthOfTextAtSize(amtStr, 9.5) - 12, y: vy, size: 9.5, font: bold, color: P.ink })
      const dateStr = e.dueDateLabel ?? '—'
      page.drawText(dateStr, { x: ML + sNameW + sAmtW + sDateW - normal.widthOfTextAtSize(dateStr, 9) - 12, y: vy, size: 9, font: normal, color: P.gray6 })
      y -= 24
      if (i < d.paymentSchedule.length - 1) {
        page.drawLine({ start: { x: ML, y }, end: { x: PW - MR, y }, thickness: 0.5, color: P.ruleLt })
      }
    }
    hr()
    y -= 16
    const schedTotal = money(d.paymentSchedule.reduce((s, e) => s + e.amount, 0))
    page.drawText('Total', { x: ML + 12, y, size: 9.5, font: bold, color: P.ink })
    page.drawText(schedTotal, { x: PW - MR - bold.widthOfTextAtSize(schedTotal, 9.5) - 12, y, size: 9.5, font: bold, color: P.ink })
    y -= 18
    for (const ln of wrap('Each payment will be invoiced individually on or before its due date. You will receive a separate invoice for each installment.', normal, 8, innerW)) {
      ensure(12)
      page.drawText(ln, { x: ML, y, size: 8, font: normal, color: P.gray4 })
      y -= 11
    }
  }

  // ── Footer (bottom of last page) ────────────────────────────────────────────
  page.drawLine({ start: { x: ML, y: MB - 8 }, end: { x: PW - MR, y: MB - 8 }, thickness: 0.6, color: P.rule })
  page.drawText('orcaclub.pro', { x: ML, y: MB - 24, size: 8, font: normal, color: P.gray4 })
  const footRight = `${d.ref} · ${d.dateLabel}`
  page.drawText(footRight, { x: PW - MR - normal.widthOfTextAtSize(footRight, 8), y: MB - 24, size: 8, font: normal, color: P.gray4 })

  return doc.save()
}
