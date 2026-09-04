import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { NdaFormData, SowFormData } from './document-generators'
import {
  clauseBlocks,
  deliverablesFor,
  exclusionsFor,
  paymentTriggerText,
  scopeItemsFor,
  resolveSowClauses,
  type SowRenderKey,
} from './sow/clauses'
import type { RecapData } from './retainers/recap'
import type { PackageRecapData } from './packages/recap'
import type { ScopeRecapData } from './retainers/scopeRecap'
import { CINZEL_DECORATIVE_BOLD_BASE64 } from './fonts/cinzel-decorative-bold'
import { NEWSREADER_REGULAR_BASE64 } from './fonts/newsreader-regular'
import { NEWSREADER_LIGHT_BASE64 } from './fonts/newsreader-light'
import { POPPINS_LIGHT_BASE64 } from './fonts/poppins-light'
import { POPPINS_REGULAR_BASE64 } from './fonts/poppins-regular'
import { IBM_PLEX_MONO_REGULAR_BASE64 } from './fonts/ibm-plex-mono-regular'
import { ORCA_MARK_BLACK_PNG_BASE64 } from './fonts/orca-mark-black'

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

/**
 * Break a single token that is wider than the column. Without this a URL, a
 * hash, or a long identifier pasted into a scope line runs straight off the
 * page — the text is measured, never clipped, so it simply prints past the
 * margin.
 */
function breakToken(word: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = []
  let cur = ''
  for (const ch of word) {
    if (cur && font.widthOfTextAtSize(cur + ch, size) > maxW) {
      out.push(cur)
      cur = ch
    } else {
      cur += ch
    }
  }
  if (cur) out.push(cur)
  return out.length ? out : ['']
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (font.widthOfTextAtSize(test, size) <= maxW) {
      cur = test
      continue
    }
    if (cur) { lines.push(cur); cur = '' }
    if (font.widthOfTextAtSize(w, size) > maxW) {
      const pieces = breakToken(w, font, size, maxW)
      lines.push(...pieces.slice(0, -1))
      cur = pieces[pieces.length - 1]
    } else {
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['']
}

/**
 * `wrap` for text that carries its own line breaks. A work-log block is one entry per
 * line, so those newlines are meaning, not formatting slop — collapsing them with the
 * rest of the whitespace (as a plain `wrap` does) runs the whole log into one
 * paragraph. Each authored line is wrapped to the column on its own; blank lines
 * survive as paragraph breaks.
 */
function wrapBlock(text: string, font: PDFFont, size: number, maxW: number): string[] {
  return text.split('\n').flatMap((seg) => {
    const t = seg.replace(/[ \t]+/g, ' ').trim()
    return t ? wrap(t, font, size, maxW) : ['']
  })
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

  /**
   * A section heading, kept with the start of its content — a heading stranded
   * at the foot of a page with its clause overleaf is the classic contract
   * typesetting failure.
   */
  section(text: string, keepWithNext = 46) {
    const size = 8.5
    this.need(26 + keepWithNext)
    this.sp(16)
    this.y -= size
    this.page.drawRectangle({
      x: this.ml - 9, y: this.y - 1,
      width: 2.5, height: size + 1,
      color: this.cNavy,
    })
    drawTracked(this.page, text.toUpperCase(), this.x, this.y, size, this.bold, this.cNavy, 0.9)
    this.y -= 9
    this.page.drawLine({
      start: { x: this.ml, y: this.y },
      end:   { x: this.pw - this.mr, y: this.y },
      thickness: 0.5, color: this.cRule,
    })
    this.y -= 6
  }

  // ── Subsection ───────────────────────────────────────────────────────────────

  sub(text: string) {
    this.need(20 + 34)
    this.sp(6)
    this.y -= 9
    this.page.drawText(text, {
      x: this.x, y: this.y, size: 9, font: this.bold, color: this.branded ? BRAND.ink : C.dark,
    })
    this.y -= 5
  }

  // ── Body text ────────────────────────────────────────────────────────────────

  /**
   * `this.y` marks the TOP of the next block everywhere else in this writer, so
   * text has to drop by its ascent before the first baseline. Drawing the
   * baseline at `y` let glyphs ride up into whatever sat above — which is how a
   * paragraph came to overlap the table it followed.
   */
  body(text: string, size = 9.5, color = C.black) {
    const lines = wrapBlock(text, this.normal, size, this.innerW)
    this.y -= size
    for (const line of lines) {
      this.need(size + 5)
      if (line) this.page.drawText(line, { x: this.x, y: this.y, size, font: this.normal, color })
      this.y -= size + 4.5
    }
    this.y += 4.5
  }

  /**
   * Conspicuous text — bold and set apart, for the disclaimer of implied
   * warranties. "Conspicuous" is a legal requirement there, not a style choice.
   */
  capsBody(text: string, size = 8.5) {
    this.sp(2)
    const lines = wrap(text, this.bold, size, this.innerW)
    for (const line of lines) {
      this.need(size + 5)
      this.page.drawText(line, { x: this.x, y: this.y, size, font: this.bold, color: C.black })
      this.y -= size + 4.5
    }
    this.sp(2)
  }

  // ── Bullet ───────────────────────────────────────────────────────────────────

  bullet(text: string, size = 9.5, indent = 14) {
    const maxW = this.innerW - indent
    const lines = wrap(text, this.normal, size, maxW)
    // A bullet is never worth splitting off its first line.
    this.need(size * 2 + 10)
    this.y -= size
    this.page.drawText('•', { x: this.x + 3, y: this.y, size: size - 1, font: this.normal, color: C.mid })
    for (let i = 0; i < lines.length; i++) {
      this.need(size + 5)
      this.page.drawText(lines[i], { x: this.x + indent, y: this.y, size, font: this.normal, color: C.black })
      this.y -= size + 4.5
    }
    this.y += 4.5
    this.y -= 5
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

  /** Draws a table's header bar at the current y. Reused when a table spans pages. */
  private _tableHead(headers: string[], widths: number[], size: number) {
    const hRowH = size + 13
    if (this.branded) {
      const totalW = widths.reduce((a, b) => a + b, 0)
      this.page.drawRectangle({ x: this.ml, y: this.y - hRowH, width: totalW, height: hRowH, color: BRAND.headBg })
      let cx = this.ml
      for (let ci = 0; ci < headers.length; ci++) {
        if (headers[ci]) drawTracked(this.page, headers[ci].toUpperCase(), cx + 8, this.y - size - 4, size - 2, this.bold, BRAND.gray6, 0.9)
        cx += widths[ci]
      }
    } else {
      let cx = this.ml
      for (let ci = 0; ci < headers.length; ci++) {
        this.page.drawRectangle({ x: cx, y: this.y - hRowH, width: widths[ci], height: hRowH, color: C.navy })
        if (headers[ci]) this.page.drawText(headers[ci], { x: cx + 8, y: this.y - size - 4, size: size - 0.5, font: this.bold, color: C.white })
        cx += widths[ci]
      }
    }
    this.y -= hRowH
  }

  /**
   * A data table. Rows are atomic — one never splits across a page — and the
   * header repeats on every page the table continues onto, so a row is never
   * left stranded without the columns that name it.
   */
  table(headers: string[], widths: number[], rows: string[][], size = 9) {
    const rowText = this.branded ? BRAND.ink : C.dark
    if (headers.length > 0) {
      this.need(size + 13 + 26)
      this._tableHead(headers, widths, size)
    }

    for (let ri = 0; ri < rows.length; ri++) {
      let maxLines = 1
      for (let ci = 0; ci < rows[ri].length; ci++) {
        maxLines = Math.max(maxLines, wrap(rows[ri][ci], this.normal, size, widths[ci] - 16).length)
      }
      const rowH = maxLines * (size + 3.5) + 12

      // Break before the row, not through it, and carry the header over.
      if (this.y - rowH < this.mb + 24) {
        this._drawFooter()
        this._np()
        if (headers.length > 0) this._tableHead(headers, widths, size)
      }

      let cx = this.ml
      for (let ci = 0; ci < rows[ri].length; ci++) {
        const lns = wrap(rows[ri][ci], this.normal, size, widths[ci] - 16)
        let ty = this.y - size - 6
        for (const l of lns) {
          this.page.drawText(l, { x: cx + 8, y: ty, size, font: this.normal, color: rowText })
          ty -= size + 3.5
        }
        cx += widths[ci]
      }
      this.page.drawLine({
        start: { x: this.ml, y: this.y - rowH },
        end:   { x: this.pw - this.mr, y: this.y - rowH },
        thickness: 0.3, color: this.cRule,
      })
      this.y -= rowH
    }
    this.sp(10)
  }

  /**
   * A numbered list of scope / deliverable / exclusion lines: the title in bold
   * with its optional description wrapped underneath. Plain `table` cells use a
   * single font, and a contract's scope reads better when the thing being
   * promised is visually separate from the sentence qualifying it.
   *
   * Like `table`, an entry is atomic and the header repeats across pages — a
   * deliverable split over a page break reads as two different promises.
   */
  itemTable(header: string, items: Array<{ title: string; description?: string }>, opts?: { numbered?: boolean }) {
    const size = 9
    const numbered = opts?.numbered !== false
    const numW = numbered ? 26 : 0
    const textW = this.innerW - numW - 16

    if (items.length === 0) {
      this.body('(To be defined by written amendment.)')
      return
    }

    const drawHead = () => this._tableHead(numbered ? ['', header] : [header], numbered ? [numW, this.innerW - numW] : [this.innerW], size)

    this.need(size + 13 + 30)
    drawHead()

    const rowText = this.branded ? BRAND.ink : C.dark
    for (let i = 0; i < items.length; i++) {
      const titleLines = wrap(items[i].title, this.bold, size, textW)
      const desc = items[i].description?.trim()
      const descLines = desc ? wrapBlock(desc, this.normal, size - 0.5, textW) : []
      const rowH = titleLines.length * (size + 3.5) + descLines.length * (size + 2) + (descLines.length ? 3 : 0) + 12

      if (this.y - rowH < this.mb + 24) {
        this._drawFooter()
        this._np()
        drawHead()
      }

      let ty = this.y - size - 6
      if (numbered) {
        this.page.drawText(`${i + 1}`, { x: this.ml + 8, y: ty, size: size - 0.5, font: this.normal, color: this.cLabel })
      }
      for (const line of titleLines) {
        this.page.drawText(line, { x: this.ml + numW + 8, y: ty, size, font: this.bold, color: rowText })
        ty -= size + 3.5
      }
      if (descLines.length) {
        ty -= 1
        for (const line of descLines) {
          this.page.drawText(line, { x: this.ml + numW + 8, y: ty, size: size - 0.5, font: this.normal, color: this.branded ? BRAND.gray6 : C.mid })
          ty -= size + 2
        }
      }

      this.page.drawLine({
        start: { x: this.ml, y: this.y - rowH },
        end:   { x: this.pw - this.mr, y: this.y - rowH },
        thickness: 0.3, color: this.cRule,
      })
      this.y -= rowH
    }
    this.sp(10)
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

// ── SOW helper — the computed sections a clause can reference ─────────────────

/**
 * Tables and totals are derived from the form, not written, so a clause names
 * one with a `render` block and the drawing happens here. These survive a
 * clause override — overriding replaces prose, never the numbers.
 */
function writeSowRender(w: DocWriter, d: SowFormData, key: SowRenderKey) {
  switch (key) {
    case 'partiesTable': {
      const colW = [w.innerW * 0.30, w.innerW * 0.70]
      const spFull = d.providerName?.trim() || 'ORCACLUB Technical Operations Development Studio'
      w.table([], colW, [
        ['Service Provider', `${spFull}${d.providerContact ? '  ·  ' + d.providerContact : ''}`],
        ['Client',           `${blank(d.clientName)}${d.clientContact ? '  ·  ' + d.clientContact : ''}`],
        ['Effective Date',   fmtDate(d.effectiveDate)],
        ['Project Name',     blank(d.projectName)],
      ])
      break
    }

    case 'scopeTable':
      w.itemTable('Service', scopeItemsFor(d))
      break

    case 'deliverablesTable':
      w.itemTable('Deliverable', deliverablesFor(d))
      break

    case 'exclusionList':
      w.itemTable("Excluded — Client's responsibility", exclusionsFor(d), { numbered: false })
      break

    case 'milestoneTable': {
      const miles = d.milestones.filter(m => m.name.trim())
      if (miles.length > 0) {
        const colW = [w.innerW * 0.38, w.innerW * 0.20, w.innerW * 0.42]
        w.table(['Milestone / Phase', 'Target Date', 'Notes'], colW, miles.map(m => {
          const dt = m.date
            ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'TBD'
          return [m.name, dt, m.notes || '—']
        }))
      } else {
        w.body('Milestone schedule to be agreed upon in writing following execution of this Agreement. The Client Inactivity provision below applies regardless of whether milestone dates are set.')
      }
      break
    }

    case 'pricing':
      writeSowPricingSection(w, d)
      break

    case 'paymentTable':
      writeSowPaymentSchedule(w, d)
      break
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
  // Every row states when the money is due. A blank trigger lets the Client
  // argue the balance falls due whenever they decide the work is "finished",
  // so an unwritten one is derived from the entry's position instead.
  //
  // Amounts: a schedule that came from a package carries the exact figure the
  // client was quoted, and that is what prints. Only a hand-built schedule
  // computes its amount from the percentage.
  const rows = entries.map((e, i) => {
    const exact = e.amount != null && e.amount !== '' ? parseFloat(e.amount) : NaN
    const hasExact = isFinite(exact)
    const amt = hasExact ? exact : baseTotal * (parseFloat(e.pct) || 0) / 100
    const pct = hasExact
      ? (baseTotal > 0 ? Math.round((exact / baseTotal) * 100) : 0)
      : (parseFloat(e.pct) || 0)
    return [
      e.label || `Payment ${i + 1}`,
      `${pct}%`,
      `$${amt.toFixed(2)}`,
      paymentTriggerText(e, i, entries.length),
    ]
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
  // No "does not constitute legal advice" line — this is an executed agreement,
  // not an informational document, and the disclaimer reads oddly on one.
  const footNote = isOrcaclub
    ? 'ORCACLUB · Web Design and Marketing Automation · orcaclub.pro'
    : `Prepared by ${spName} · Independent Freelance Consultant`

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

  // ── Body ─────────────────────────────────────────────────────────────────────
  // Sections come from the clause registry rather than being written out here,
  // so staff can override any clause's wording or switch a clause off and the
  // numbering still comes out right.
  const clauses = resolveSowClauses(d)

  for (const { n, clause } of clauses) {
    const blocks = clauseBlocks(clause, d)
    // A section that opens with a table needs room for the table's head and a
    // first row too, or the heading and its lead-in strand at the page foot.
    const keep = blocks.some(b => b.t === 'render') ? 132 : 46
    w.section(`${n}. ${clause.heading}`, keep)

    let subIndex = 0
    for (const block of blocks) {
      switch (block.t) {
        case 'body':
          w.body(block.text)
          break
        case 'bullet':
          w.bullet(block.text)
          break
        case 'sub':
          subIndex += 1
          w.sub(`${n}.${subIndex}  ${block.text}`)
          break
        case 'caps':
          w.capsBody(block.text)
          break
        case 'space':
          w.sp(block.h ?? 4)
          break
        case 'render':
          writeSowRender(w, d, block.key)
          break
      }
    }

    // No divider between clauses — each section heading already carries its own
    // rule, and a second one turns the page into a grid of boxes.
  }

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
  /**
   * An optional extra the client can request. Rendered in its own section BELOW the
   * total and excluded from every subtotal — an option the client has not taken must
   * never read as money they owe.
   */
  isAddOn?: boolean
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
  // Add-ons are quoted, not charged: they get their own table after the total.
  const priced = d.lineItems.filter((it) => !it.isAddOn)
  const addOns = d.lineItems.filter((it) => it.isAddOn)

  let oneTime = 0, monthly = 0, annual = 0
  for (const item of priced) {
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

  const drawItemsTable = (items: PackagePdfLineItem[]) => {
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
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const per = item.isRecurring ? (item.recurringInterval === 'year' ? '/yr' : '/mo') : ''
      const nameLines = wrap(item.name.replace(/\s+/g, ' '), bold, 9.5, colName - 24)
      const descLines = item.description ? wrapBlock(item.description, normal, 8, colName - 24) : []
      const tagH = item.isRecurring ? 12 : 0
      const rowH = 12 + nameLines.length * 13 + descLines.length * 11 + tagH + 10
      ensure(rowH)

      let ty = y - 12 - 9.5 + 2
      for (const ln of nameLines) {
        page.drawText(ln, { x: ML + 12, y: ty, size: 9.5, font: bold, color: P.ink })
        ty -= 13
      }
      for (const ln of descLines) {
        if (ln) page.drawText(ln, { x: ML + 12, y: ty, size: 8, font: normal, color: P.gray6 })
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
      if (i < items.length - 1) {
        page.drawLine({ start: { x: ML, y }, end: { x: PW - MR, y }, thickness: 0.5, color: P.ruleLt })
      }
    }
  }

  drawItemsTable(priced)
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

  // ── Optional add-ons — quoted below the total so they never read as owed ─────
  if (addOns.length > 0) {
    ensure(80)
    hr(P.ruleLt)
    y -= 20
    tracked('OPTIONAL ADD-ONS', ML, y, 7, bold, P.gray4, 1.6)
    y -= 12
    for (const ln of wrap('Not included in the total above. Let us know if you would like any of these added.', normal, 8, innerW)) {
      ensure(12)
      page.drawText(ln, { x: ML, y, size: 8, font: normal, color: P.gray4 })
      y -= 11
    }
    y -= 6
    drawItemsTable(addOns)
    hr()
    y -= 18
  }

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

// ── Retainer Hours Statement PDF ───────────────────────────────────────────────

export interface RetainerStatementData {
  clientName: string
  clientCompany?: string | null
  tierLabel: string          // e.g. "Growth"
  periodLabel: string        // e.g. "Jul 10 – Aug 9, 2026"
  monthlyFee: number         // USD/mo
  hoursPerMonth: number      // the monthly cap
  overageRate: number        // USD/hr
  entries: Array<{ date: string; description: string; category: string; hours: number; priority?: string }>
  planned?: Array<{ date: string; description: string; category: string; priority?: string; completion?: string }>  // draft / projected work — no hours yet
  totals: { used: number; remaining: number; overageHours: number; overageAmount: number }
  generatedOn: string        // ISO date string
}

/** Format a numeric hours value trimmed to at most 2 decimals (e.g. 2, 2.5, 2.25). */
function fmtHours(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** Format an entry date as short month/day (e.g. "Jul 12"), falling back to the raw string. */
function fmtShortDate(val: string): string {
  if (!val) return '—'
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(val)
  const dt = new Date(iso ? val + 'T00:00:00' : val)
  return isNaN(dt.getTime())
    ? val
    : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Format an ISO date as a full long date (e.g. "July 29, 2026"), falling back to the raw string. */
function fmtLongDate(val: string): string {
  if (!val) return '—'
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(val)
  const dt = new Date(iso ? val + 'T00:00:00' : val)
  return isNaN(dt.getTime())
    ? val
    : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function buildRetainerStatementPdf(d: RetainerStatementData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const gothic = await doc.embedFont(Buffer.from(CINZEL_DECORATIVE_BOLD_BASE64, 'base64'), { subset: true })

  const genLabel = fmtLongDate(d.generatedOn)

  const w = new DocWriter(
    doc, bold, normal,
    'ret_',
    `RETAINER HOURS STATEMENT — ${blank(d.clientCompany || d.clientName, 'CLIENT')}`,
    'ORCACLUB · Web Design and Marketing Automation · orcaclub.pro',
    { gothic, branded: true },
  )

  // ── Header + title (matches invoice / proposal / SOW) ────────────────────────
  w.brandHeader('Retainer Statement', genLabel)
  w.brandTitle('RETAINER HOURS STATEMENT', `${d.tierLabel} Retainer`)

  // ── Meta block ───────────────────────────────────────────────────────────────
  const metaColW = [w.innerW * 0.26, w.innerW * 0.74]
  const clientVal = d.clientCompany
    ? `${d.clientName}  ·  ${d.clientCompany}`
    : d.clientName
  w.table([], metaColW, [
    ['Client',         clientVal],
    ['Tier',           d.tierLabel],
    ['Billing Period', d.periodLabel],
    ['Generated',      genLabel],
  ])
  w.sp(6)

  // ── Plan terms box ───────────────────────────────────────────────────────────
  {
    const planLine = `${d.tierLabel} · ${money(d.monthlyFee)}/mo · ${d.hoursPerMonth} hrs/mo · overage ${money(d.overageRate)}/hr`
    const boxH = 26
    w.need(boxH + 12)
    w.page.drawRectangle({ x: w.ml, y: w.y - boxH, width: w.innerW, height: boxH, color: BRAND.boxBg })
    w.page.drawRectangle({ x: w.ml, y: w.y - boxH, width: 3, height: boxH, color: BRAND.navy })
    w.page.drawText(planLine, { x: w.ml + 14, y: w.y - 17, size: 9.5, font: w.bold, color: BRAND.ink })
    w.y -= boxH + 14
  }

  const size = 9
  const planned = d.planned ?? []
  // Priority label for the PDF — Medium is the neutral default and left blank (matches
  // the dashboard, which only badges High/Low). High is emphasized in bold below.
  const priText = (p?: string): string => (p === 'high' ? 'High' : p === 'low' ? 'Low' : '')

  // ── Hours logged table ───────────────────────────────────────────────────────
  // Only render the table when hours have actually been logged. With nothing logged
  // we skip it entirely (no empty "No hours logged" table) — the totals block below
  // still reports 0 / cap remaining.
  if (d.entries.length > 0) {
    w.section('Hours Logged')

    const cDate = 58, cPri = 50, cCat = 84, cHours = 52
    const cDesc = w.innerW - cDate - cPri - cCat - cHours
    const xDate  = w.ml
    const xDesc  = xDate + cDate
    const xPri   = xDesc + cDesc
    const xCat   = xPri + cPri
    const xHours = xCat + cCat // right edge = xHours + cHours = ml + innerW

    // Header bar — light gray with tracked uppercase labels (branded style)
    const hRowH = 20
    w.need(hRowH + 2)
    w.page.drawRectangle({ x: w.ml, y: w.y - hRowH, width: w.innerW, height: hRowH, color: BRAND.headBg })
    const hy = w.y - 13
    drawTracked(w.page, 'DATE',        xDate + 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'DESCRIPTION', xDesc + 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'PRIORITY',    xPri + 6,  hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'CATEGORY',    xCat + 6,  hy, 6.5, w.bold, BRAND.gray6, 0.8)
    const hoursHdrW = trackedWidth('HOURS', 6.5, w.bold, 0.8)
    drawTracked(w.page, 'HOURS', xHours + cHours - hoursHdrW - 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    w.y -= hRowH + 1

    for (let ri = 0; ri < d.entries.length; ri++) {
      const e = d.entries[ri]
      const descLines = wrap(e.description.replace(/\s+/g, ' '), w.normal, size, cDesc - 12)
      const rowH = descLines.length * (size + 3) + 10
      w.need(rowH + 1)

      const bg = ri % 2 === 1 ? BRAND.ruleLt : C.white
      w.page.drawRectangle({ x: w.ml, y: w.y - rowH, width: w.innerW, height: rowH, color: bg })

      const ty0 = w.y - size - 5
      w.page.drawText(fmtShortDate(e.date), { x: xDate + 6, y: ty0, size, font: w.normal, color: BRAND.ink })
      let ty = ty0
      for (const ln of descLines) {
        w.page.drawText(ln, { x: xDesc + 6, y: ty, size, font: w.normal, color: BRAND.ink })
        ty -= size + 3
      }
      const pri = priText(e.priority)
      if (pri) w.page.drawText(pri, { x: xPri + 6, y: ty0, size, font: e.priority === 'high' ? w.bold : w.normal, color: e.priority === 'high' ? BRAND.ink : BRAND.gray6 })
      w.page.drawText(e.category, { x: xCat + 6, y: ty0, size, font: w.normal, color: BRAND.gray6 })
      const hStr = fmtHours(e.hours)
      const hStrW = w.normal.widthOfTextAtSize(hStr, size)
      w.page.drawText(hStr, { x: xHours + cHours - hStrW - 6, y: ty0, size, font: w.normal, color: BRAND.ink })

      w.page.drawLine({
        start: { x: w.ml, y: w.y - rowH },
        end:   { x: w.pw - w.mr, y: w.y - rowH },
        thickness: 0.3, color: BRAND.rule,
      })
      w.y -= rowH + 1
    }
    w.sp(6)
  }

  // ── Planned work table (draft entries) ───────────────────────────────────────
  // Projected work — DATE / DESCRIPTION / PRIORITY / CATEGORY / STATUS, no HOURS. Status
  // tracks whether the planned task has been completed (hours logged against it).
  if (planned.length > 0) {
    w.section('Planned Work')

    const pDate = 52, pPri = 44, pCat = 72, pStatus = 64
    const pDesc = w.innerW - pDate - pPri - pCat - pStatus
    const xDate   = w.ml
    const xDesc   = xDate + pDate
    const xPri    = xDesc + pDesc
    const xCat    = xPri + pPri
    const xStatus = xCat + pCat

    const hRowH = 20
    w.need(hRowH + 2)
    w.page.drawRectangle({ x: w.ml, y: w.y - hRowH, width: w.innerW, height: hRowH, color: BRAND.headBg })
    const hy = w.y - 13
    drawTracked(w.page, 'DATE',        xDate + 6,   hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'DESCRIPTION', xDesc + 6,   hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'PRIORITY',    xPri + 6,    hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'CATEGORY',    xCat + 6,    hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'STATUS',      xStatus + 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    w.y -= hRowH + 1

    for (let ri = 0; ri < planned.length; ri++) {
      const e = planned[ri]
      const descLines = wrap(e.description.replace(/\s+/g, ' '), w.normal, size, pDesc - 12)
      const rowH = descLines.length * (size + 3) + 10
      w.need(rowH + 1)

      const bg = ri % 2 === 1 ? BRAND.ruleLt : C.white
      w.page.drawRectangle({ x: w.ml, y: w.y - rowH, width: w.innerW, height: rowH, color: bg })

      const ty0 = w.y - size - 5
      w.page.drawText(fmtShortDate(e.date), { x: xDate + 6, y: ty0, size, font: w.normal, color: BRAND.gray6 })
      let ty = ty0
      for (const ln of descLines) {
        w.page.drawText(ln, { x: xDesc + 6, y: ty, size, font: w.normal, color: BRAND.ink })
        ty -= size + 3
      }
      const pri = priText(e.priority)
      if (pri) w.page.drawText(pri, { x: xPri + 6, y: ty0, size, font: e.priority === 'high' ? w.bold : w.normal, color: e.priority === 'high' ? BRAND.ink : BRAND.gray6 })
      w.page.drawText(e.category, { x: xCat + 6, y: ty0, size, font: w.normal, color: BRAND.gray6 })
      const done = e.completion === 'complete'
      w.page.drawText(done ? 'Complete' : 'Incomplete', { x: xStatus + 6, y: ty0, size, font: done ? w.bold : w.normal, color: done ? BRAND.navy : BRAND.gray6 })

      w.page.drawLine({
        start: { x: w.ml, y: w.y - rowH },
        end:   { x: w.pw - w.mr, y: w.y - rowH },
        thickness: 0.3, color: BRAND.rule,
      })
      w.y -= rowH + 1
    }
    w.sp(6)
  }

  // ── Totals summary (right-aligned block, like the invoice) ───────────────────
  const totX = w.pw - w.mr - 230
  const totRow = (
    labelTxt: string, valueTxt: string,
    opts?: { strong?: boolean; size?: number; color?: ReturnType<typeof rgb> },
  ) => {
    w.need(18)
    const s = opts?.size ?? 9.5
    w.page.drawText(labelTxt, {
      x: totX, y: w.y, size: s,
      font: opts?.strong ? w.bold : w.normal,
      color: opts?.strong ? BRAND.ink : BRAND.gray6,
    })
    const vw = w.bold.widthOfTextAtSize(valueTxt, s)
    w.page.drawText(valueTxt, { x: w.pw - w.mr - vw, y: w.y, size: s, font: w.bold, color: opts?.color ?? BRAND.ink })
    w.y -= s + 8
  }

  w.need(40)
  w.page.drawLine({ start: { x: totX, y: w.y + 4 }, end: { x: w.pw - w.mr, y: w.y + 4 }, thickness: 0.6, color: BRAND.rule })
  w.y -= 8
  totRow('Hours used', `${fmtHours(d.totals.used)} / ${fmtHours(d.hoursPerMonth)}`, { strong: true, size: 11 })
  totRow('Remaining', `${fmtHours(d.totals.remaining)} hrs`)
  if (d.totals.overageHours > 0) {
    totRow('Overage', `${fmtHours(d.totals.overageHours)} hrs · ${money(d.totals.overageAmount)}`, { color: BRAND.cyan })
  }

  w.sp(12)
  w.body(
    'This statement summarizes hours logged against your monthly retainer for the period shown. Unused hours do not roll over unless otherwise agreed in writing.',
    8, BRAND.gray6,
  )

  w._drawFooter()
  return doc.save()
}

// ── Retainer Proposal PDF — the priced offer, sent before activation ───────────
// Built from the scoping record: what has already been delivered, what is planned
// each month, and the plan being proposed for it. Deliberately mirrors the statement
// document so a client who accepts sees the same shape again every cycle.

export interface RetainerProposalData {
  clientName: string
  clientCompany?: string | null
  tierLabel: string
  monthlyFee: number
  hoursPerMonth: number
  overageRate: number
  /** Proposed first-cycle start, long-form (e.g. "September 1, 2026"), or null. */
  startLabel?: string | null
  /** The pitch headline — what the retainer covers. */
  scopeSummary?: string | null
  /** Staff cover note, printed above the tables. */
  note?: string | null
  /** Work already delivered during scoping. */
  completed: Array<{ date: string; description: string; category: string; hours: number }>
  /** Recurring work proposed each month, with estimates. */
  planned: Array<{ description: string; category: string; priority?: string; hours: number }>
  /** Present delivered work as bundled in at no charge. */
  includesCompletedWork?: boolean
  generatedOn: string
}

export async function buildRetainerProposalPdf(d: RetainerProposalData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const gothic = await doc.embedFont(Buffer.from(CINZEL_DECORATIVE_BOLD_BASE64, 'base64'), { subset: true })

  const genLabel = fmtLongDate(d.generatedOn)
  const completedHours = d.completed.reduce((t, e) => t + (e.hours || 0), 0)
  const plannedHours   = d.planned.reduce((t, e) => t + (e.hours || 0), 0)
  const effRate = d.hoursPerMonth > 0 ? d.monthlyFee / d.hoursPerMonth : 0

  const w = new DocWriter(
    doc, bold, normal,
    'prop_',
    `RETAINER PROPOSAL — ${blank(d.clientCompany || d.clientName, 'CLIENT')}`,
    'ORCACLUB · Web Design and Marketing Automation · orcaclub.pro',
    { gothic, branded: true },
  )

  w.brandHeader('Retainer Proposal', genLabel)
  w.brandTitle('RETAINER PROPOSAL', `${d.tierLabel} Retainer`)

  // ── Meta block ───────────────────────────────────────────────────────────────
  const metaColW = [w.innerW * 0.26, w.innerW * 0.74]
  const clientVal = d.clientCompany ? `${d.clientName}  ·  ${d.clientCompany}` : d.clientName
  w.table([], metaColW, [
    ['Client',   clientVal],
    ['Prepared', genLabel],
    ...(d.startLabel ? [['Proposed Start', d.startLabel]] : []),
  ])
  w.sp(6)

  // ── Proposed plan box ────────────────────────────────────────────────────────
  {
    const planLine = `${d.tierLabel} · ${money(d.monthlyFee)}/mo · ${fmtHours(d.hoursPerMonth)} hrs/mo · overage ${money(d.overageRate)}/hr`
    const boxH = 26
    w.need(boxH + 12)
    w.page.drawRectangle({ x: w.ml, y: w.y - boxH, width: w.innerW, height: boxH, color: BRAND.boxBg })
    w.page.drawRectangle({ x: w.ml, y: w.y - boxH, width: 3, height: boxH, color: BRAND.navy })
    w.page.drawText(planLine, { x: w.ml + 14, y: w.y - 17, size: 9.5, font: w.bold, color: BRAND.ink })
    w.y -= boxH + 14
  }

  if (d.scopeSummary?.trim()) {
    w.section('Scope')
    w.body(d.scopeSummary.trim(), 9.5, BRAND.ink)
    w.sp(4)
  }

  if (d.note?.trim()) {
    w.body(d.note.trim(), 9, BRAND.gray6)
    w.sp(4)
  }

  const size = 9
  const priText = (p?: string): string => (p === 'high' ? 'High' : p === 'low' ? 'Low' : '')

  // ── What it costs ────────────────────────────────────────────────────────────
  // Placed directly under the scope, ahead of the supporting tables: the offer is
  // what the client opened this for, and leading with it keeps the money on page one
  // no matter how much work is itemized below.
  w.section('Investment')
  const totX = w.pw - w.mr - 240
  const totRow = (
    labelTxt: string, valueTxt: string,
    opts?: { strong?: boolean; size?: number; color?: ReturnType<typeof rgb> },
  ) => {
    const sz = opts?.size ?? 9.5
    w.page.drawText(labelTxt, {
      x: totX, y: w.y, size: sz,
      font: opts?.strong ? w.bold : w.normal,
      color: opts?.strong ? BRAND.ink : BRAND.gray6,
    })
    const vw = w.bold.widthOfTextAtSize(valueTxt, sz)
    w.page.drawText(valueTxt, { x: w.pw - w.mr - vw, y: w.y, size: sz, font: w.bold, color: opts?.color ?? BRAND.ink })
    w.y -= sz + 8
  }

  // Reserve the WHOLE block up front so it can never split across a page boundary.
  const priceRows = (11 + 8) + (9.5 + 8) * (effRate > 0 ? 3 : 2)
  w.need(12 + priceRows)
  w.page.drawLine({ start: { x: totX, y: w.y + 4 }, end: { x: w.pw - w.mr, y: w.y + 4 }, thickness: 0.6, color: BRAND.rule })
  w.y -= 8
  totRow('Monthly retainer', `${money(d.monthlyFee)}/mo`, { strong: true, size: 11 })
  totRow('Included hours', `${fmtHours(d.hoursPerMonth)} hrs/mo`)
  if (effRate > 0) totRow('Effective rate', `${money(Math.round(effRate))}/hr`)
  totRow('Additional hours', `${money(d.overageRate)}/hr`)
  w.sp(6)

  // ── Work already delivered ───────────────────────────────────────────────────
  if (d.completed.length > 0) {
    w.section('Work Completed To Date')
    const cDate = 58, cCat = 84, cHours = 52
    const cDesc = w.innerW - cDate - cCat - cHours
    w.table(
      ['Date', 'Description', 'Category', 'Hours'],
      [cDate, cDesc, cCat, cHours],
      d.completed.map((e) => [
        fmtShortDate(e.date),
        e.description || '—',
        e.category,
        fmtHours(e.hours),
      ]),
      size,
    )
    w.totalRow(
      d.includesCompletedWork ? 'Delivered to date — included' : 'Delivered to date',
      `${fmtHours(completedHours)} hrs`,
      [cDate, cDesc, cCat, cHours],
    )
    w.sp(4)
  }

  // ── Planned recurring work ───────────────────────────────────────────────────
  if (d.planned.length > 0) {
    w.section('Planned Monthly Work')
    const pPri = 50, pCat = 84, pHours = 52
    const pDesc = w.innerW - pPri - pCat - pHours
    w.table(
      ['Description', 'Priority', 'Category', 'Est. Hours'],
      [pDesc, pPri, pCat, pHours],
      d.planned.map((e) => [
        e.description || '—',
        priText(e.priority),
        e.category,
        e.hours > 0 ? fmtHours(e.hours) : '—',
      ]),
      size,
    )
    w.totalRow('Estimated per month', `${fmtHours(plannedHours)} hrs`, [pDesc, pPri, pCat, pHours])
    w.sp(4)
  }

  // ── Terms ────────────────────────────────────────────────────────────────────
  const closing = [
    `This proposal covers a monthly retainer of ${fmtHours(d.hoursPerMonth)} hours at ${money(d.monthlyFee)} per month.`,
    'Unused hours do not roll over unless otherwise agreed in writing; hours beyond the monthly allowance are billed at the rate shown above.',
    d.includesCompletedWork && completedHours > 0
      ? `The ${fmtHours(completedHours)} hours already delivered are included at no additional charge.`
      : '',
    'Billing begins on the start date above. This proposal is not an invoice.',
  ].filter(Boolean).join(' ')
  w.sp(10)
  w.need(wrap(closing, w.normal, 8, w.innerW).length * 12.5)
  w.body(closing, 8, BRAND.gray6)

  w._drawFooter()
  return doc.save()
}

// ── Retainer Monthly Recap PDF — deck slides ────────────────────────────────────
// A faithful PDF rendering of the "Monthly Recap & Insights" deck: seven landscape
// 16:9 slides in the deck's paper/teal editorial style (Newsreader / Poppins / IBM
// Plex Mono). One <section> of the template = one PDF page. All layout is expressed
// in the template's 1920×1080 px space and scaled to a 960×540pt page (S = 0.5).
// Positions are baselines measured from the template HTML rendered in Chrome at
// 1920×1080 (scratch measure.html), so text sits exactly where the deck puts it.

const S = 0.5
const DECK_W = 960 // 1920 * S
const DECK_H = 540 // 1080 * S

const DECK = {
  paper:       rgb(0.945, 0.941, 0.925), // #f1f0ec
  card:        rgb(0.969, 0.965, 0.953), // #f7f6f3
  ink:         rgb(0.086, 0.094, 0.102), // #16181a
  teal:        rgb(0.059, 0.431, 0.420), // #0f6e6b
  tealLt:      rgb(0.373, 0.741, 0.722), // #5fbdb8
  muted:       rgb(0.541, 0.541, 0.518), // #8a8a84
  desc:        rgb(0.361, 0.369, 0.373), // #5c5e5f
  descDark:    rgb(0.620, 0.631, 0.624), // #9ea19f
  placeholder: rgb(0.706, 0.706, 0.682), // #b4b4ae — empty "—" rows
  hair18:      rgb(0.80,  0.80,  0.79),  // rgba(22,24,26,0.18) on paper
  hair50:      rgb(0.55,  0.56,  0.56),  // rgba(22,24,26,0.5) on paper
  hair14:      rgb(0.84,  0.84,  0.83),  // rgba(22,24,26,0.14) on paper
  barTrack:    rgb(0.88,  0.88,  0.86),  // rgba(22,24,26,0.09) on paper
  hairDark18:  rgb(0.28,  0.29,  0.29),  // rgba(241,240,236,0.18) on ink
  hairDark20:  rgb(0.26,  0.27,  0.27),  // rgba(241,240,236,0.2) on ink
  hairDark40:  rgb(0.42,  0.42,  0.41),  // rgba(241,240,236,0.4) on ink
}

interface DeckFonts { serif: PDFFont; serifLt: PDFFont; sans: PDFFont; sansLt: PDFFont; mono: PDFFont }

/** A single slide — draws in the template's px coordinate space (top-left origin,
 * text positioned by baseline, exactly as measured from the rendered template). */
class Deck {
  page: PDFPage
  f: DeckFonts
  logo?: PDFImage
  constructor(page: PDFPage, f: DeckFonts, logo?: PDFImage) { this.page = page; this.f = f; this.logo = logo }

  bg(color: ReturnType<typeof rgb>): void {
    this.page.drawRectangle({ x: 0, y: 0, width: DECK_W, height: DECK_H, color })
  }

  /** Filled rectangle in px, positioned by its top-left corner. */
  rect(xPx: number, topPx: number, wPx: number, hPx: number, color: ReturnType<typeof rgb>): void {
    this.page.drawRectangle({ x: xPx * S, y: DECK_H - (topPx + hPx) * S, width: wPx * S, height: hPx * S, color })
  }

  img(image: PDFImage, xPx: number, topPx: number, wPx: number, hPx: number): void {
    this.page.drawImage(image, { x: xPx * S, y: DECK_H - (topPx + hPx) * S, width: wPx * S, height: hPx * S })
  }

  /** One line of text on a baseline. `xPx` is the left edge (right edge when align:'right'). */
  text(
    t: string, xPx: number, blPx: number, sizePx: number, font: PDFFont, color: ReturnType<typeof rgb>,
    opts?: { tracking?: number; align?: 'left' | 'right' },
  ): void {
    const size = sizePx * S
    const y = DECK_H - blPx * S
    if (opts?.tracking) {
      const tr = opts.tracking * S
      const x0 = opts.align === 'right' ? xPx * S - trackedWidth(t, size, font, tr) : xPx * S
      drawTracked(this.page, t, x0, y, size, font, color, tr)
      return
    }
    const x = opts?.align === 'right' ? xPx * S - font.widthOfTextAtSize(t, size) : xPx * S
    this.page.drawText(t, { x, y, size, font, color })
  }

  /** Wrapped paragraph; first line on `blPx`, subsequent lines `lineHpx` apart. Returns the line count. */
  para(
    t: string, xPx: number, blPx: number, sizePx: number, lineHpx: number,
    font: PDFFont, color: ReturnType<typeof rgb>, maxWpx: number, opts?: { tracking?: number },
  ): number {
    const lines = wrap((t || '').replace(/\s+/g, ' ').trim(), font, sizePx * S, maxWpx * S)
    lines.forEach((ln, i) => this.text(ln, xPx, blPx + i * lineHpx, sizePx, font, color, opts))
    return lines.length
  }

  /** Line count `t` will wrap to, without drawing. */
  lineCount(t: string, sizePx: number, font: PDFFont, maxWpx: number): number {
    return wrap((t || '').replace(/\s+/g, ' ').trim(), font, sizePx * S, maxWpx * S).length
  }
}

const NUMBER_WORD = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight']
function numberWord(n: number): string { return NUMBER_WORD[n] ?? String(n) }

// Layout constants shared across slides (template px).
const PADX = 110
const CONTENT_R = DECK_W / S - PADX // 1810 — right content edge
const CONTENT_W = CONTENT_R - PADX  // 1700

// Shared type scale (from the template): mono kickers 26px ls 0.2em, mono labels
// 24px ls 0.16em, section headlines 80px Newsreader ls -1.2px lh 84.8.
const KICKER = { size: 26, tracking: 26 * 0.2 }
const LABEL = { size: 24, tracking: 24 * 0.16 }
const H2 = { size: 80, tracking: -1.2, lineH: 84.8 }

/** Kicker + wrapped headline + rule; returns the top (px) of the rule. */
function deckHeader(s: Deck, kicker: string, headline: string, opts?: { dark?: boolean }): number {
  const dark = opts?.dark
  s.text(kicker.toUpperCase(), PADX, 123, KICKER.size, s.f.mono, dark ? DECK.tealLt : DECK.teal, { tracking: KICKER.tracking })
  const lines = s.para(headline, PADX, 213, H2.size, H2.lineH, s.f.serif, dark ? DECK.paper : DECK.ink, CONTENT_W, { tracking: H2.tracking })
  const ruleY = 258.8 + (lines - 1) * H2.lineH
  s.rect(PADX, ruleY, CONTENT_W, 1, dark ? DECK.hairDark40 : DECK.hair50)
  return ruleY
}

// ── Slide 1 · Cover ─────────────────────────────────────────────────────────────
function deckCover(s: Deck, d: RecapData): void {
  s.bg(DECK.paper)
  if (s.logo) s.img(s.logo, PADX, 96, 64, 68.2)
  s.text('ORCACLUB', s.logo ? 202 : PADX, 138.6, 26, s.f.sans, DECK.ink, { tracking: 26 * 0.42 })
  const kicker = `${d.clientCompany || d.clientName} · ${d.periodLabel}`
  s.text(kicker.toUpperCase(), PADX, 392.6, KICKER.size, s.f.mono, DECK.teal, { tracking: KICKER.tracking })
  s.text('Monthly recap', PADX, 544.6, 150, s.f.serif, DECK.ink, { tracking: -3 })
  s.text('& insights', PADX, 685.6, 150, s.f.serif, DECK.ink, { tracking: -3 })
  s.rect(PADX, 761.6, CONTENT_W, 1, DECK.hair18)
  const foot = `${d.tierLabel} retainer · ${fmtHours(d.hoursPerMonth)} hrs/mo`
  s.text(foot.toUpperCase(), PADX, 989, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
}

// ── Slide 2 · At a glance ─────────────────────────────────────────────────────────
function deckGlance(s: Deck, d: RecapData): void {
  s.bg(DECK.paper)
  const headline = d.headline?.trim() || `${fmtHours(d.hoursUsed)} of ${fmtHours(d.hoursPerMonth)} hours used`
  const ruleY = deckHeader(s, 'At a glance', headline)

  const cells: Array<{ label: string; big: string; unit?: string; desc?: string; small?: boolean; teal?: boolean }> = [
    { label: 'Hours used', big: fmtHours(d.hoursUsed), unit: ` / ${fmtHours(d.hoursPerMonth)}`, desc: `${fmtHours(d.hoursUnused)} hours unused`, teal: true },
    { label: 'Items shipped', big: String(d.itemsShipped), desc: 'Delivered this cycle' },
    { label: 'Site health', big: d.siteHealth.label || '—', desc: d.siteHealth.note, small: true },
    { label: 'Open requests', big: String(d.openRequests.count), desc: d.openRequests.note },
  ]
  const gridTop = ruleY + 53
  const gridBottom = 996
  const n = cells.length
  const colW = (CONTENT_W - (n - 1)) / n // 1px hairline gaps
  s.rect(PADX, gridTop, CONTENT_W, gridBottom - gridTop, DECK.hair14)
  for (let i = 0; i < n; i++) {
    const x = PADX + i * (colW + 1)
    const c = cells[i]
    s.rect(x, gridTop, colW, gridBottom - gridTop, DECK.card)
    s.text(c.label.toUpperCase(), x + 40, gridTop + 73, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
    const bigSize = c.small ? 96 : 132
    const bigBl = gridTop + (c.small ? 342.8 : 369.9)
    s.text(c.big, x + 40, bigBl, bigSize, s.f.serif, c.teal ? DECK.teal : DECK.ink)
    if (c.unit) {
      const bw = s.f.serif.widthOfTextAtSize(c.big, bigSize * S) / S
      s.text(c.unit, x + 40 + bw, bigBl, 48, s.f.serif, DECK.muted)
    }
    if (c.desc?.trim()) {
      // Bottom-anchored: the last line's baseline sits at gridTop + 625.5.
      const k = s.lineCount(c.desc, 26, s.f.sansLt, colW - 80)
      s.para(c.desc, x + 40, gridTop + 625.5 - (k - 1) * 37.7, 26, 37.7, s.f.sansLt, DECK.desc, colW - 80)
    }
  }
}

// ── Slide 3 · Where the hours went ────────────────────────────────────────────────
function deckHours(s: Deck, d: RecapData): void {
  s.bg(DECK.paper)
  const headline = d.bucketsHeadline?.trim() || 'How the retainer hours were spent'
  let rowTop = deckHeader(s, 'Where the hours went', headline) + 49

  const maxH = Math.max(...d.buckets.map((b) => b.hours), 0.0001)
  const barX = PADX + 400 + 48
  const barW = CONTENT_W - 400 - 110 - 96 // 1094 — grid: 400px label / bar / 110px value
  for (const b of d.buckets) {
    s.text(b.label, PADX, rowTop + 32, 44, s.f.serif, DECK.ink)
    s.rect(barX, rowTop + 5, barW, 34, DECK.barTrack)
    const frac = Math.max(0, Math.min(1, b.hours / maxH))
    s.rect(barX, rowTop + 5, Math.max(3, barW * frac), 34, DECK.teal)
    s.text(`${fmtHours(b.hours)}h`, CONTENT_R, rowTop + 32, 44, s.f.serif, DECK.ink, { align: 'right' })
    if (b.note?.trim()) {
      const k = s.para(b.note, PADX, rowTop + 93, 29, 43.5, s.f.sansLt, DECK.desc, 1340)
      rowTop += 62 + k * 43.5 + 36
    } else {
      rowTop += 44 + 36
    }
  }
}

// ── Slide 4 · Campaigns (Growth / Enterprise) ─────────────────────────────────────
function deckCampaigns(s: Deck, d: RecapData, items: RecapData['campaigns']): void {
  s.bg(DECK.paper)
  const ruleY = deckHeader(s, 'Campaigns', 'Campaign activity this cycle')
  const cards = items.slice(0, 4)
  const n = cards.length || 1
  const colW = (CONTENT_W - (n - 1)) / n // 1px hairline gaps
  const cardTop = ruleY + 49
  const cardBottom = 914 // 996 − footer line − 48px gap
  s.rect(PADX, cardTop, CONTENT_W, cardBottom - cardTop, DECK.hair14)
  cards.forEach((c, i) => {
    const x = PADX + i * (colW + 1)
    s.rect(x, cardTop, colW, cardBottom - cardTop, DECK.card)
    if (c.channel.trim()) s.text(c.channel.toUpperCase(), x + 40, cardTop + 69, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
    let titleLines = 0
    if (c.title.trim()) titleLines = s.para(c.title, x + 40, cardTop + 130, 44, 48.4, s.f.serif, DECK.ink, colW - 80)
    if (c.note.trim()) {
      const noteBl = titleLines > 0 ? cardTop + 130 + (titleLines - 1) * 48.4 + 63.4 : cardTop + 130
      s.para(c.note, x + 40, noteBl, 27, 40.5, s.f.sansLt, DECK.desc, colW - 80)
    }
  })
  s.text('Full metrics are in the monthly performance report.', PADX, 989, 26, s.f.mono, DECK.muted, { tracking: 2.6 })
}

// ── Slide 5 · Recommendations (dark) ──────────────────────────────────────────────
function deckRecs(s: Deck, recs: RecapData['recommendations']): void {
  s.bg(DECK.ink)
  const word = numberWord(recs.length)
  const ruleY = deckHeader(s, 'Recommendations', `${word ? word : 'A few'} thing${recs.length === 1 ? '' : 's'} to focus on next`, { dark: true })
  // Equal-height rows fill the area below the header; content vertically centered.
  const top = ruleY + 49
  const pitch = (996 - top) / recs.length
  recs.forEach((r, i) => {
    const title = r.title?.trim() || '—'
    const titleLines = s.lineCount(title, 50, s.f.serif, CONTENT_W - 154)
    const noteLines = r.note.trim() ? s.lineCount(r.note, 29, s.f.sansLt, CONTENT_W - 154) : 0
    const blockH = 50 + (titleLines - 1) * 55 + (noteLines ? 12 + noteLines * 42.05 : 0)
    const blockTop = top + i * pitch + (pitch - blockH) / 2
    s.text(String(i + 1).padStart(2, '0'), PADX, blockTop + 66, 60, s.f.serif, DECK.tealLt)
    s.para(title, PADX + 154, blockTop + 37, 50, 55, s.f.serif, DECK.paper, CONTENT_W - 154)
    if (noteLines) {
      s.para(r.note, PADX + 154, blockTop + 50 + (titleLines - 1) * 55 + 43, 29, 42.05, s.f.sansLt, DECK.descDark, CONTENT_W - 154)
    }
    s.rect(PADX, top + (i + 1) * pitch, CONTENT_W, 1, DECK.hairDark18)
  })
}

// ── Slide 6 · Notes ───────────────────────────────────────────────────────────────
function deckNotes(s: Deck, d: RecapData): void {
  s.bg(DECK.paper)
  const ruleY = deckHeader(s, 'Notes from this call', 'Decisions and open questions')
  const colW = (CONTENT_W - 90) / 2 // 805, 90px column gap
  const cols = [
    { label: 'Decided', items: d.notesDecided.filter((x) => x.trim()) },
    { label: 'Open', items: d.notesOpen.filter((x) => x.trim()) },
  ]
  cols.forEach((col, ci) => {
    const x = PADX + ci * (colW + 90)
    s.text(col.label.toUpperCase(), x, ruleY + 70, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
    let border = ruleY + 99
    for (const it of (col.items.length ? col.items : ['—'])) {
      s.rect(x, border, colW, 1, DECK.hair14)
      const empty = it === '—'
      const k = s.para(it, x, border + 53, 33, 46.2, s.f.serifLt, empty ? DECK.placeholder : DECK.ink, colW)
      border += 45 + k * 46.2
    }
  })
}

// ── Slide 7 · Next month ──────────────────────────────────────────────────────────

/** "July 2026" → "August plan"; anything unparseable → "The month ahead". */
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function nextMonthKicker(periodLabel: string): string {
  const m = periodLabel.trim().match(/^([A-Za-z]+)\s+\d{4}$/)
  const idx = m ? MONTH_NAMES.findIndex((x) => x.toLowerCase() === m[1].toLowerCase()) : -1
  return idx >= 0 ? `${MONTH_NAMES[(idx + 1) % 12]} plan` : 'The month ahead'
}

function deckNext(s: Deck, d: RecapData): void {
  s.bg(DECK.paper)
  const ruleY = deckHeader(s, nextMonthKicker(d.periodLabel), 'Next month')
  const leftW = 866.5 // grid 1.15fr / 1fr, 80px gap
  const boxX = PADX + leftW + 80
  const boxW = CONTENT_R - boxX // 753.5

  s.text('PRIORITIES', PADX, ruleY + 74, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
  let border = ruleY + 103
  const pr = d.nextMonthPriorities.filter((x) => x.trim())
  for (const p of (pr.length ? pr : ['—'])) {
    s.rect(PADX, border, leftW, 1, DECK.hair14)
    const empty = p === '—'
    const k = s.para(p, PADX, border + 53, 35, 47.25, s.f.serifLt, empty ? DECK.placeholder : DECK.ink, leftW)
    border += 41 + k * 47.25
  }

  const boxTop = ruleY + 49
  s.rect(boxX, boxTop, boxW, 996 - boxTop, DECK.ink)
  const tx = boxX + 44
  const tw = boxW - 88
  s.text('WE NEED FROM YOU', tx, boxTop + 69, LABEL.size, s.f.mono, DECK.tealLt, { tracking: LABEL.tracking })
  let rb = boxTop + 100
  const asks = d.asksFromClient.filter((x) => x.trim())
  for (const a of (asks.length ? asks : ['—'])) {
    s.rect(tx, rb, tw, 1, DECK.hairDark20)
    const k = s.para(a, tx, rb + 50, 33, 44.55, s.f.serifLt, DECK.paper, tw)
    rb += 41 + k * 44.55
  }
  if (d.nextCallLabel.trim()) {
    s.text(`Next call · ${d.nextCallLabel}`.toUpperCase(), tx, boxTop + 637.2, 26, s.f.mono, DECK.descDark, { tracking: 2.6 })
  }
}

export async function buildRetainerRecapPdf(d: RecapData & { generatedOn: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const serif = await doc.embedFont(Buffer.from(NEWSREADER_REGULAR_BASE64, 'base64'), { subset: true })
  const serifLt = await doc.embedFont(Buffer.from(NEWSREADER_LIGHT_BASE64, 'base64'), { subset: true })
  const sans = await doc.embedFont(Buffer.from(POPPINS_REGULAR_BASE64, 'base64'), { subset: true })
  const sansLt = await doc.embedFont(Buffer.from(POPPINS_LIGHT_BASE64, 'base64'), { subset: true })
  const mono = await doc.embedFont(Buffer.from(IBM_PLEX_MONO_REGULAR_BASE64, 'base64'), { subset: true })
  const logo = await doc.embedPng(Buffer.from(ORCA_MARK_BLACK_PNG_BASE64, 'base64'))
  const f: DeckFonts = { serif, serifLt, sans, sansLt, mono }
  const slide = () => new Deck(doc.addPage([DECK_W, DECK_H]), f, logo)

  deckCover(slide(), d)
  deckGlance(slide(), d)
  if (d.buckets.length > 0) deckHours(slide(), d)

  const campaigns = (d.campaigns || []).filter((c) => c.title.trim() || c.note.trim() || c.channel.trim())
  if (d.showCampaigns && campaigns.length > 0) deckCampaigns(slide(), d, campaigns)

  const recs = (d.recommendations || []).filter((r) => r.title.trim() || r.note.trim())
  if (recs.length > 0) deckRecs(slide(), recs)

  if (d.notesDecided.some((x) => x.trim()) || d.notesOpen.some((x) => x.trim())) deckNotes(slide(), d)

  if (d.nextMonthPriorities.some((x) => x.trim()) || d.asksFromClient.some((x) => x.trim()) || d.nextCallLabel.trim()) {
    deckNext(slide(), d)
  }

  return doc.save()
}

// ── Milestone Package Recap PDF — deck slides ───────────────────────────────────
// The fixed-price counterpart to buildRetainerRecapPdf: the same 960×540pt landscape
// deck, the same Deck writer, fonts, palette (DECK), margins (PADX/CONTENT_W) and
// header/footer treatment — only the sections differ. One scheduled payment gets a
// cover, an at-a-glance grid, the work it covers bucketed by category, what is still
// left, and staff notes. Lists flow across continuation slides, so a package with
// forty logged items paginates instead of running off the page.

/** Short month/day in UTC (e.g. "May 2") — day-only dates never slip a day. */
function fmtShortDateUtc(val: string | null | undefined): string {
  if (!val) return '—'
  const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(val)
  const dt = new Date(dayOnly ? `${val}T00:00:00.000Z` : val)
  return isNaN(dt.getTime())
    ? String(val)
    : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** Full long date in UTC (e.g. "June 1, 2026"). */
function fmtLongDateUtc(val: string | null | undefined): string {
  if (!val) return '—'
  const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(val)
  const dt = new Date(dayOnly ? `${val}T00:00:00.000Z` : val)
  return isNaN(dt.getTime())
    ? String(val)
    : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

/** Largest size (template px) ≤ `maxPx` at which `t` fits `maxWpx` on one line. */
function fitSize(t: string, font: PDFFont, maxPx: number, maxWpx: number, minPx = 40): number {
  let size = maxPx
  while (size > minPx && font.widthOfTextAtSize(t, size * S) > maxWpx * S) size -= 2
  return size
}

/** Truncate a tracked run with an ellipsis so it never collides with its neighbour. */
function ellipsize(t: string, font: PDFFont, sizePx: number, tracking: number, maxWpx: number): string {
  if (trackedWidth(t, sizePx * S, font, tracking * S) <= maxWpx * S) return t
  let cut = t
  while (cut.length > 1 && trackedWidth(`${cut}…`, sizePx * S, font, tracking * S) > maxWpx * S) {
    cut = cut.slice(0, -1)
  }
  return `${cut}…`
}

/** Bottom of the content area (template px) — same as the retainer deck's grids. */
const DECK_BOTTOM = 996

/**
 * A paginating cursor over deck slides: draws the section header, tracks the current
 * top (template px), and rolls onto a fresh "(cont.)" slide when the next block will
 * not fit. A block taller than a whole page is allowed to overflow rather than loop.
 */
function pkgFlow(newSlide: () => Deck, kicker: string, headline: string) {
  const open = (k: string): { s: Deck; top: number } => {
    const s = newSlide()
    s.bg(DECK.paper)
    return { s, top: deckHeader(s, k, headline) + 49 }
  }
  let cur = open(kicker)
  let start = cur.top
  return {
    get s(): Deck { return cur.s },
    get top(): number { return cur.top },
    advance(h: number): void { cur.top += h },
    ensure(h: number): void {
      if (cur.top + h <= DECK_BOTTOM || cur.top <= start) return
      cur = open(`${kicker} (cont.)`)
      start = cur.top
    },
  }
}

// ── Slide 1 · Cover ─────────────────────────────────────────────────────────────
function pkgCover(s: Deck, d: PackageRecapData & { generatedOn: string }): void {
  s.bg(DECK.paper)
  if (s.logo) s.img(s.logo, PADX, 96, 64, 68.2)
  s.text('ORCACLUB', s.logo ? 202 : PADX, 138.6, 26, s.f.sans, DECK.ink, { tracking: 26 * 0.42 })

  const kicker = `${d.clientCompany || d.clientName} · ${d.paymentPosition}`
  s.text(kicker.toUpperCase(), PADX, 392.6, KICKER.size, s.f.mono, DECK.teal, { tracking: KICKER.tracking })

  s.text('Work recap', PADX, 544.6, 150, s.f.serif, DECK.ink, { tracking: -3 })
  const label = d.paymentLabel?.trim() || 'Scheduled payment'
  s.text(label, PADX, 685.6, fitSize(label, s.f.serif, 150, CONTENT_W), s.f.serif, DECK.ink, { tracking: -3 })
  s.rect(PADX, 761.6, CONTENT_W, 1, DECK.hair18)

  // Footer rail: package + due date on the left, generation stamp on the right.
  const gen = `Generated ${fmtLongDateUtc(d.generatedOn)}`.toUpperCase()
  const genW = trackedWidth(gen, LABEL.size * S, s.f.mono, LABEL.tracking * S) / S
  const pkgName = d.packageName?.trim() || 'Package'
  const foot = (d.paymentDueDate ? `${pkgName} · due ${fmtLongDateUtc(d.paymentDueDate)}` : pkgName).toUpperCase()
  s.text(ellipsize(foot, s.f.mono, LABEL.size, LABEL.tracking, CONTENT_W - genW - 60), PADX, 989, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
  s.text(gen, CONTENT_R, 989, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking, align: 'right' })
}

// ── Slide 2 · At a glance ───────────────────────────────────────────────────────
function pkgGlance(s: Deck, d: PackageRecapData): void {
  s.bg(DECK.paper)
  const headline = d.headline?.trim() || `${d.itemsShipped} item${d.itemsShipped === 1 ? '' : 's'} delivered`
  const ruleY = deckHeader(s, 'At a glance', headline)

  const cells: Array<{ label: string; big: string; desc?: string; teal?: boolean }> = [
    { label: 'This payment', big: money(d.paymentAmount), desc: d.paymentLabel, teal: true },
    { label: 'Paid to date', big: money(d.amountPaid), desc: `of ${money(d.packageTotal)} · ${d.paymentPosition}` },
    { label: 'Remaining', big: money(d.amountRemaining), desc: 'Balance on this package' },
    { label: 'Items shipped', big: String(d.itemsShipped), desc: 'Covered by this payment' },
  ]
  // Hours are informational — a package with none logged shows no hours stat at all.
  if (d.totalHours > 0) {
    cells.push({ label: 'Hours logged', big: fmtHours(d.totalHours), desc: 'Informational only — never billed' })
  }

  const gridTop = ruleY + 53
  const n = cells.length
  const colW = (CONTENT_W - (n - 1)) / n // 1px hairline gaps

  // Currency strings are far wider than the retainer deck's hour counts, so the big
  // number shrinks to fit — one shared size across the row keeps the baselines level.
  const bigSize = Math.min(...cells.map((c) => fitSize(c.big, s.f.serif, 132, colW - 80, 34)))
  const bigBl = gridTop + 238 + bigSize

  s.rect(PADX, gridTop, CONTENT_W, DECK_BOTTOM - gridTop, DECK.hair14)
  for (let i = 0; i < n; i++) {
    const x = PADX + i * (colW + 1)
    const c = cells[i]
    s.rect(x, gridTop, colW, DECK_BOTTOM - gridTop, DECK.card)
    s.text(c.label.toUpperCase(), x + 40, gridTop + 73, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
    s.text(c.big, x + 40, bigBl, bigSize, s.f.serif, c.teal ? DECK.teal : DECK.ink)
    if (c.desc?.trim()) {
      // Bottom-anchored: the last line's baseline sits at gridTop + 625.5.
      const k = s.lineCount(c.desc, 26, s.f.sansLt, colW - 80)
      s.para(c.desc, x + 40, gridTop + 625.5 - (k - 1) * 37.7, 26, 37.7, s.f.sansLt, DECK.desc, colW - 80)
    }
  }
}

// ── Slides 3+ · Accomplished ────────────────────────────────────────────────────
// Typed against only the fields it reads, so the scope recap deck (whose buckets carry
// no category) renders through the same layout instead of forking it.
interface RecapAccomplished {
  accomplishedHeadline: string
  buckets: { label: string; hours: number; note: string; items: { date: string; description: string; hours: number | null }[] }[]
}
function pkgAccomplished(newSlide: () => Deck, d: RecapAccomplished): void {
  const fl = pkgFlow(newSlide, 'Accomplished', d.accomplishedHeadline?.trim() || 'What this payment covers')
  for (const b of d.buckets) {
    // Bucket header — label left, informational hours right (omitted when zero).
    // Reserve the header plus one row so a label never sits alone at a page bottom.
    fl.ensure(180)
    fl.s.rect(PADX, fl.top, CONTENT_W, 1, DECK.hair50)
    fl.s.text(b.label || 'Work', PADX, fl.top + 52, 44, fl.s.f.serif, DECK.ink)
    if (b.hours > 0) {
      fl.s.text(`${fmtHours(b.hours)}h`, CONTENT_R, fl.top + 52, 44, fl.s.f.serif, DECK.teal, { align: 'right' })
    }
    fl.advance(76)

    if (b.note?.trim()) {
      const k = fl.s.lineCount(b.note, 29, fl.s.f.sansLt, 1340)
      fl.ensure(k * 43.5 + 30)
      fl.s.para(b.note, PADX, fl.top + 30, 29, 43.5, fl.s.f.sansLt, DECK.desc, 1340)
      fl.advance(k * 43.5 + 24)
    }

    for (const it of b.items) {
      const hours = it.hours != null && it.hours > 0 ? `  (${fmtHours(it.hours)}h)` : ''
      const line = `${fmtShortDateUtc(it.date)} — ${it.description?.trim() || b.label || 'Work'}${hours}`
      const k = fl.s.lineCount(line, 33, fl.s.f.serifLt, CONTENT_W)
      fl.ensure(45 + k * 46.2)
      fl.s.rect(PADX, fl.top, CONTENT_W, 1, DECK.hair14)
      fl.s.para(line, PADX, fl.top + 53, 33, 46.2, fl.s.f.serifLt, DECK.ink, CONTENT_W)
      fl.advance(45 + k * 46.2)
    }
    fl.advance(36)
  }
}

// ── Slides · What's left ────────────────────────────────────────────────────────
// `kicker`/`fallback` let the scope recap reuse this list as "What's next" — its planned
// rows get the same hairline checkbox treatment.
interface RecapRemaining {
  remainingHeadline: string
  remaining: { kind: 'planned' | 'payment'; label: string; amount: number | null; dueDate: string | null }[]
}
function pkgRemaining(
  newSlide: () => Deck,
  d: RecapRemaining,
  kicker = "What's left",
  fallback = 'Still to come',
): void {
  const fl = pkgFlow(newSlide, kicker, d.remainingHeadline?.trim() || fallback)
  for (const r of d.remaining) {
    const planned = r.kind === 'planned'
    const textX = planned ? PADX + 62 : PADX
    const dateW = planned && r.dueDate ? 260 : 0
    const maxW = CONTENT_R - textX - dateW
    const line = planned
      ? r.label?.trim() || 'Planned work'
      : [
          r.label?.trim() || 'Payment',
          r.amount != null ? money(r.amount) : null,
          r.dueDate ? `due ${fmtLongDateUtc(r.dueDate)}` : null,
        ].filter(Boolean).join(' · ')

    const k = fl.s.lineCount(line, 33, fl.s.f.serifLt, maxW)
    fl.ensure(45 + k * 46.2)
    fl.s.rect(PADX, fl.top, CONTENT_W, 1, DECK.hair14)
    if (planned) {
      // Hairline checkbox — an outer square knocked out by an inner paper square.
      fl.s.rect(PADX, fl.top + 28, 30, 30, DECK.hair50)
      fl.s.rect(PADX + 2, fl.top + 30, 26, 26, DECK.paper)
    }
    fl.s.para(line, textX, fl.top + 53, 33, 46.2, fl.s.f.serifLt, DECK.ink, maxW)
    if (planned && r.dueDate) {
      fl.s.text(fmtShortDateUtc(r.dueDate).toUpperCase(), CONTENT_R, fl.top + 51, LABEL.size, fl.s.f.mono, DECK.muted, { tracking: LABEL.tracking, align: 'right' })
    }
    fl.advance(45 + k * 46.2)
  }
}

// ── Slides · Notes & next steps ─────────────────────────────────────────────────
function pkgNotes(newSlide: () => Deck, cols: Array<{ label: string; items: string[] }>): void {
  const s = newSlide()
  s.bg(DECK.paper)
  const ruleY = deckHeader(s, 'Notes & next steps', 'Where things stand')
  const n = cols.length
  const colW = (CONTENT_W - 90 * (n - 1)) / n // 90px column gap
  cols.forEach((col, ci) => {
    const x = PADX + ci * (colW + 90)
    s.text(col.label.toUpperCase(), x, ruleY + 70, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
    let border = ruleY + 99
    for (const it of col.items) {
      s.rect(x, border, colW, 1, DECK.hair14)
      const k = s.para(it, x, border + 53, 33, 46.2, s.f.serifLt, DECK.ink, colW)
      border += 45 + k * 46.2
    }
  })
}

/**
 * Render a milestone package recap for one scheduled payment. Sections that have no
 * content are skipped entirely rather than rendered empty.
 */
export async function buildPackageRecapPdf(d: PackageRecapData & { generatedOn: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const serif = await doc.embedFont(Buffer.from(NEWSREADER_REGULAR_BASE64, 'base64'), { subset: true })
  const serifLt = await doc.embedFont(Buffer.from(NEWSREADER_LIGHT_BASE64, 'base64'), { subset: true })
  const sans = await doc.embedFont(Buffer.from(POPPINS_REGULAR_BASE64, 'base64'), { subset: true })
  const sansLt = await doc.embedFont(Buffer.from(POPPINS_LIGHT_BASE64, 'base64'), { subset: true })
  const mono = await doc.embedFont(Buffer.from(IBM_PLEX_MONO_REGULAR_BASE64, 'base64'), { subset: true })
  const logo = await doc.embedPng(Buffer.from(ORCA_MARK_BLACK_PNG_BASE64, 'base64'))
  const f: DeckFonts = { serif, serifLt, sans, sansLt, mono }
  const slide = () => new Deck(doc.addPage([DECK_W, DECK_H]), f, logo)

  pkgCover(slide(), d)
  pkgGlance(slide(), d)

  if ((d.buckets || []).length > 0) pkgAccomplished(slide, d)
  if ((d.remaining || []).length > 0) pkgRemaining(slide, d)

  const noteCols = [
    { label: 'Notes', items: (d.notes || []).filter((x) => x?.trim()) },
    { label: 'Next steps', items: (d.nextSteps || []).filter((x) => x?.trim()) },
  ].filter((c) => c.items.length > 0)
  if (noteCols.length > 0) pkgNotes(slide, noteCols)

  return doc.save()
}

// ── Scope Recap PDF — deck slides ───────────────────────────────────────────────
// The pre-engagement counterpart to buildPackageRecapPdf and buildRetainerRecapPdf: the
// same 960×540pt deck, Deck writer, fonts, palette and margins, and it reuses their
// Accomplished / What's-next / Notes slides outright. Only the cover and the at-a-glance
// grid differ, because a scoping retainer has no cycle and no payment to report against
// — the pitch itself is the frame.

// ── Slide 1 · Cover ─────────────────────────────────────────────────────────────
function scopeCover(s: Deck, d: ScopeRecapData & { generatedOn: string }): void {
  s.bg(DECK.paper)
  if (s.logo) s.img(s.logo, PADX, 96, 64, 68.2)
  s.text('ORCACLUB', s.logo ? 202 : PADX, 138.6, 26, s.f.sans, DECK.ink, { tracking: 26 * 0.42 })

  const kicker = `${d.clientCompany || d.clientName} · SCOPE RECAP`
  s.text(kicker.toUpperCase(), PADX, 392.6, KICKER.size, s.f.mono, DECK.teal, { tracking: KICKER.tracking })

  s.text('Work recap', PADX, 544.6, 150, s.f.serif, DECK.ink, { tracking: -3 })
  const title = d.scopeTitle?.trim() || 'Work to date'
  s.text(title, PADX, 685.6, fitSize(title, s.f.serif, 150, CONTENT_W), s.f.serif, DECK.ink, { tracking: -3 })
  s.rect(PADX, 761.6, CONTENT_W, 1, DECK.hair18)

  // Footer rail: the period covered on the left, generation stamp on the right.
  const gen = `Generated ${fmtLongDateUtc(d.generatedOn)}`.toUpperCase()
  const genW = trackedWidth(gen, LABEL.size * S, s.f.mono, LABEL.tracking * S) / S
  const foot = d.periodLabel?.trim() || 'Work to date'
  s.text(ellipsize(foot.toUpperCase(), s.f.mono, LABEL.size, LABEL.tracking, CONTENT_W - genW - 60), PADX, 989, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
  s.text(gen, CONTENT_R, 989, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking, align: 'right' })
}

// ── Slide 2 · At a glance ───────────────────────────────────────────────────────
function scopeGlance(s: Deck, d: ScopeRecapData): void {
  s.bg(DECK.paper)
  const headline = d.headline?.trim() || `${d.itemsDelivered} item${d.itemsDelivered === 1 ? '' : 's'} delivered`
  const ruleY = deckHeader(s, 'At a glance', headline)

  // A scope with nothing delivered yet is legitimate — it reads as a pure plan, so the
  // delivered cells drop out rather than parading a pair of zeroes.
  const cells: Array<{ label: string; big: string; desc?: string; teal?: boolean }> = []
  if (d.itemsDelivered > 0 || d.itemsPlanned === 0) {
    cells.push({ label: 'Hours delivered', big: fmtHours(d.hoursDelivered), desc: d.periodLabel, teal: true })
    cells.push({ label: 'Items delivered', big: String(d.itemsDelivered), desc: 'Completed to date' })
  }
  if (d.itemsPlanned > 0) {
    cells.push({
      label: 'Planned next',
      big: String(d.itemsPlanned),
      desc: d.hoursPlanned > 0 ? `${fmtHours(d.hoursPlanned)} hrs estimated` : 'Proposed scope',
    })
  }
  if (d.proposedAmountLabel?.trim()) {
    cells.push({ label: 'Proposed', big: d.proposedAmountLabel, desc: d.proposedTermsLabel ?? undefined })
  }

  const gridTop = ruleY + 53
  const n = cells.length
  const colW = (CONTENT_W - (n - 1)) / n // 1px hairline gaps

  // A money label is far wider than an item count, so the big number shrinks to fit —
  // one shared size across the row keeps the baselines level.
  const bigSize = Math.min(...cells.map((c) => fitSize(c.big, s.f.serif, 132, colW - 80, 34)))
  const bigBl = gridTop + 238 + bigSize

  s.rect(PADX, gridTop, CONTENT_W, DECK_BOTTOM - gridTop, DECK.hair14)
  for (let i = 0; i < n; i++) {
    const x = PADX + i * (colW + 1)
    const c = cells[i]
    s.rect(x, gridTop, colW, DECK_BOTTOM - gridTop, DECK.card)
    s.text(c.label.toUpperCase(), x + 40, gridTop + 73, LABEL.size, s.f.mono, DECK.muted, { tracking: LABEL.tracking })
    s.text(c.big, x + 40, bigBl, bigSize, s.f.serif, c.teal ? DECK.teal : DECK.ink)
    if (c.desc?.trim()) {
      // Bottom-anchored: the last line's baseline sits at gridTop + 625.5.
      const k = s.lineCount(c.desc, 26, s.f.sansLt, colW - 80)
      s.para(c.desc, x + 40, gridTop + 625.5 - (k - 1) * 37.7, 26, 37.7, s.f.sansLt, DECK.desc, colW - 80)
    }
  }
}

/**
 * Render the scope recap that accompanies a proposal. Sections with no content are
 * skipped entirely rather than rendered empty, so a pitch with nothing delivered yet
 * produces a plan-only deck and a retrospective with nothing planned produces a
 * delivered-only one.
 */
export async function buildScopeRecapPdf(d: ScopeRecapData & { generatedOn: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const serif = await doc.embedFont(Buffer.from(NEWSREADER_REGULAR_BASE64, 'base64'), { subset: true })
  const serifLt = await doc.embedFont(Buffer.from(NEWSREADER_LIGHT_BASE64, 'base64'), { subset: true })
  const sans = await doc.embedFont(Buffer.from(POPPINS_REGULAR_BASE64, 'base64'), { subset: true })
  const sansLt = await doc.embedFont(Buffer.from(POPPINS_LIGHT_BASE64, 'base64'), { subset: true })
  const mono = await doc.embedFont(Buffer.from(IBM_PLEX_MONO_REGULAR_BASE64, 'base64'), { subset: true })
  const logo = await doc.embedPng(Buffer.from(ORCA_MARK_BLACK_PNG_BASE64, 'base64'))
  const f: DeckFonts = { serif, serifLt, sans, sansLt, mono }
  const slide = () => new Deck(doc.addPage([DECK_W, DECK_H]), f, logo)

  scopeCover(slide(), d)
  scopeGlance(slide(), d)

  if ((d.buckets || []).length > 0) {
    pkgAccomplished(slide, { accomplishedHeadline: d.accomplishedHeadline, buckets: d.buckets })
  }
  if ((d.remaining || []).length > 0) {
    pkgRemaining(slide, { remainingHeadline: d.remainingHeadline, remaining: d.remaining }, "What's next", 'What we propose to do')
  }

  const noteCols = [
    { label: 'Notes', items: (d.notes || []).filter((x) => x?.trim()) },
    { label: 'Next steps', items: (d.nextSteps || []).filter((x) => x?.trim()) },
  ].filter((c) => c.items.length > 0)
  if (noteCols.length > 0) pkgNotes(slide, noteCols)

  return doc.save()
}

// ── Package Work Log PDF — letter sheet ─────────────────────────────────────────
// The fixed-price counterpart to buildRetainerStatementPdf: the same DocWriter, the
// same letter page, fonts, margins, BRAND palette, header/footer treatment and row
// helpers — only the columns differ. Where the retainer statement reports hours
// against a monthly cap, this reports what has been logged against a package and
// whether each item has already been carried on an invoice. All dates are formatted
// in UTC (fmtShortDateUtc / fmtLongDateUtc) so day-only entry dates never slip.

/** Data for one package's work-log sheet — the sibling of RetainerStatementData. */
export interface PackageWorkLogData {
  clientName: string
  clientCompany: string | null
  packageName: string
  entries: Array<{
    date: string
    description: string
    hours: number | null
    category: 'work' | 'design' | 'revision' | 'meeting'
    status: 'planned' | 'logged'
    completion: 'incomplete' | 'complete'
    /** Non-empty when this entry has already been carried on an invoice. */
    billedOrderId: string | null
  }>
  schedule: Array<{ label: string; amount: number; dueDate: string | null; invoiced: boolean; paid: boolean }>
  totals: { loggedCount: number; totalHours: number; pendingCount: number; plannedOpenCount: number }
  generatedOn: string
}

/** "design" → "Design". Categories are stored lowercase; the sheet title-cases them. */
function titleCase(val: string): string {
  return val ? val.charAt(0).toUpperCase() + val.slice(1) : val
}

/**
 * Render a package's work log: everything logged (with its billed/pending state), the
 * planned work still open, and the payment schedule. Sections with no rows are skipped
 * entirely, and every table paginates through DocWriter.need().
 */
export async function buildPackageWorkLogPdf(d: PackageWorkLogData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold)
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const gothic = await doc.embedFont(Buffer.from(CINZEL_DECORATIVE_BOLD_BASE64, 'base64'), { subset: true })

  const genLabel = fmtLongDateUtc(d.generatedOn)
  const pkgName = d.packageName?.trim() || 'Package'

  const w = new DocWriter(
    doc, bold, normal,
    'pwl_',
    `PACKAGE WORK LOG — ${blank(d.clientCompany || d.clientName, 'CLIENT')}`,
    'ORCACLUB · Web Design and Marketing Automation · orcaclub.pro',
    { gothic, branded: true },
  )

  // ── Header + title (matches the retainer statement / invoice / proposal) ─────
  w.brandHeader('Work Log', genLabel)
  w.brandTitle('PACKAGE WORK LOG', pkgName)

  // ── Meta block ───────────────────────────────────────────────────────────────
  const metaColW = [w.innerW * 0.26, w.innerW * 0.74]
  const clientVal = d.clientCompany ? `${d.clientName}  ·  ${d.clientCompany}` : d.clientName
  w.table([], metaColW, [
    ['Client',    clientVal],
    ['Package',   pkgName],
    ['Generated', genLabel],
  ])
  w.sp(6)

  // ── Summary strip ────────────────────────────────────────────────────────────
  {
    const cells: Array<[string, string]> = [
      ['Entries logged', String(d.totals.loggedCount)],
      ['Hours logged',   fmtHours(d.totals.totalHours)],
      ['Unbilled',       String(d.totals.pendingCount)],
      ['Planned open',   String(d.totals.plannedOpenCount)],
    ]
    const boxH = 46
    w.need(boxH + 12)
    w.page.drawRectangle({ x: w.ml, y: w.y - boxH, width: w.innerW, height: boxH, color: BRAND.boxBg })
    w.page.drawRectangle({ x: w.ml, y: w.y - boxH, width: 3, height: boxH, color: BRAND.navy })
    const cellW = (w.innerW - 14) / cells.length
    cells.forEach(([label, value], i) => {
      const cx = w.ml + 14 + i * cellW
      drawTracked(w.page, label.toUpperCase(), cx, w.y - 17, 6.5, w.bold, BRAND.gray6, 0.8)
      w.page.drawText(value, { x: cx, y: w.y - 36, size: 13, font: w.bold, color: BRAND.ink })
    })
    w.y -= boxH + 14
  }

  const size = 9
  const logged  = d.entries.filter((e) => e.status === 'logged')
  const planned = d.entries.filter((e) => e.status === 'planned')

  // ── Logged work table ────────────────────────────────────────────────────────
  // HOURS is dropped entirely when nothing in the log carries an hour count — a
  // package billed purely on deliverables never shows an empty column.
  if (logged.length > 0) {
    w.section('Logged Work')

    const showHours = logged.some((e) => e.hours != null)
    const cDate = 58, cCat = 74, cHours = showHours ? 48 : 0, cBilled = 58
    const cDesc = w.innerW - cDate - cCat - cHours - cBilled
    const xDate   = w.ml
    const xDesc   = xDate + cDate
    const xCat    = xDesc + cDesc
    const xHours  = xCat + cCat
    const xBilled = xHours + cHours // right edge = xBilled + cBilled = ml + innerW

    const hRowH = 20
    w.need(hRowH + 2)
    w.page.drawRectangle({ x: w.ml, y: w.y - hRowH, width: w.innerW, height: hRowH, color: BRAND.headBg })
    const hy = w.y - 13
    drawTracked(w.page, 'DATE',        xDate + 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'DESCRIPTION', xDesc + 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'CATEGORY',    xCat + 6,  hy, 6.5, w.bold, BRAND.gray6, 0.8)
    if (showHours) {
      const hoursHdrW = trackedWidth('HOURS', 6.5, w.bold, 0.8)
      drawTracked(w.page, 'HOURS', xHours + cHours - hoursHdrW - 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    }
    drawTracked(w.page, 'STATUS', xBilled + 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    w.y -= hRowH + 1

    for (let ri = 0; ri < logged.length; ri++) {
      const e = logged[ri]
      const descLines = wrap((e.description || '').replace(/\s+/g, ' '), w.normal, size, cDesc - 12)
      const rowH = descLines.length * (size + 3) + 10
      w.need(rowH + 1)

      const bg = ri % 2 === 1 ? BRAND.ruleLt : C.white
      w.page.drawRectangle({ x: w.ml, y: w.y - rowH, width: w.innerW, height: rowH, color: bg })

      const ty0 = w.y - size - 5
      w.page.drawText(fmtShortDateUtc(e.date), { x: xDate + 6, y: ty0, size, font: w.normal, color: BRAND.ink })
      let ty = ty0
      for (const ln of descLines) {
        w.page.drawText(ln, { x: xDesc + 6, y: ty, size, font: w.normal, color: BRAND.ink })
        ty -= size + 3
      }
      w.page.drawText(titleCase(e.category), { x: xCat + 6, y: ty0, size, font: w.normal, color: BRAND.gray6 })
      if (showHours) {
        // An entry with no hours shows an em dash rather than a misleading 0.
        const hStr = e.hours != null ? fmtHours(e.hours) : '—'
        const hStrW = w.normal.widthOfTextAtSize(hStr, size)
        w.page.drawText(hStr, {
          x: xHours + cHours - hStrW - 6, y: ty0, size, font: w.normal,
          color: e.hours != null ? BRAND.ink : BRAND.gray4,
        })
      }
      const billed = Boolean(e.billedOrderId)
      w.page.drawText(billed ? 'Billed' : 'Pending', {
        x: xBilled + 6, y: ty0, size,
        font: billed ? w.bold : w.normal,
        color: billed ? BRAND.navy : BRAND.gray6,
      })

      w.page.drawLine({
        start: { x: w.ml, y: w.y - rowH },
        end:   { x: w.pw - w.mr, y: w.y - rowH },
        thickness: 0.3, color: BRAND.rule,
      })
      w.y -= rowH + 1
    }
    w.sp(6)
  }

  // ── Planned work table ───────────────────────────────────────────────────────
  // Open items get an empty checkbox, completed ones a filled one.
  if (planned.length > 0) {
    w.section('Planned Work')

    const cBox = 22, cDate = 56, cCat = 74, cStatus = 66
    const cDesc = w.innerW - cBox - cDate - cCat - cStatus
    const xBox    = w.ml
    const xDate   = xBox + cBox
    const xDesc   = xDate + cDate
    const xCat    = xDesc + cDesc
    const xStatus = xCat + cCat

    const hRowH = 20
    w.need(hRowH + 2)
    w.page.drawRectangle({ x: w.ml, y: w.y - hRowH, width: w.innerW, height: hRowH, color: BRAND.headBg })
    const hy = w.y - 13
    drawTracked(w.page, 'DATE',        xDate + 6,   hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'DESCRIPTION', xDesc + 6,   hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'CATEGORY',    xCat + 6,    hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'STATUS',      xStatus + 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    w.y -= hRowH + 1

    for (let ri = 0; ri < planned.length; ri++) {
      const e = planned[ri]
      const descLines = wrap((e.description || '').replace(/\s+/g, ' '), w.normal, size, cDesc - 12)
      const rowH = descLines.length * (size + 3) + 10
      w.need(rowH + 1)

      const bg = ri % 2 === 1 ? BRAND.ruleLt : C.white
      w.page.drawRectangle({ x: w.ml, y: w.y - rowH, width: w.innerW, height: rowH, color: bg })

      const ty0 = w.y - size - 5
      const done = e.completion === 'complete'

      // Checkbox: a 8.5pt square outline, knocked out by the row background when
      // open and left solid navy when the item has been completed.
      const bs = 8.5
      w.page.drawRectangle({ x: xBox + 4, y: ty0 - 1, width: bs, height: bs, color: done ? BRAND.navy : BRAND.gray4 })
      if (!done) {
        w.page.drawRectangle({ x: xBox + 5, y: ty0, width: bs - 2, height: bs - 2, color: bg })
      }

      w.page.drawText(fmtShortDateUtc(e.date), { x: xDate + 6, y: ty0, size, font: w.normal, color: BRAND.gray6 })
      let ty = ty0
      for (const ln of descLines) {
        w.page.drawText(ln, { x: xDesc + 6, y: ty, size, font: w.normal, color: BRAND.ink })
        ty -= size + 3
      }
      w.page.drawText(titleCase(e.category), { x: xCat + 6, y: ty0, size, font: w.normal, color: BRAND.gray6 })
      w.page.drawText(done ? 'Complete' : 'Open', {
        x: xStatus + 6, y: ty0, size,
        font: done ? w.bold : w.normal,
        color: done ? BRAND.navy : BRAND.gray6,
      })

      w.page.drawLine({
        start: { x: w.ml, y: w.y - rowH },
        end:   { x: w.pw - w.mr, y: w.y - rowH },
        thickness: 0.3, color: BRAND.rule,
      })
      w.y -= rowH + 1
    }
    w.sp(6)
  }

  // ── Payment schedule ─────────────────────────────────────────────────────────
  if (d.schedule.length > 0) {
    w.section('Payment Schedule')

    const cAmount = 84, cDue = 92, cState = 74
    const cLabel = w.innerW - cAmount - cDue - cState
    const xLabel  = w.ml
    const xAmount = xLabel + cLabel
    const xDue    = xAmount + cAmount
    const xState  = xDue + cDue

    const hRowH = 20
    w.need(hRowH + 2)
    w.page.drawRectangle({ x: w.ml, y: w.y - hRowH, width: w.innerW, height: hRowH, color: BRAND.headBg })
    const hy = w.y - 13
    drawTracked(w.page, 'PAYMENT', xLabel + 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    const amtHdrW = trackedWidth('AMOUNT', 6.5, w.bold, 0.8)
    drawTracked(w.page, 'AMOUNT', xAmount + cAmount - amtHdrW - 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'DUE',    xDue + 6,   hy, 6.5, w.bold, BRAND.gray6, 0.8)
    drawTracked(w.page, 'STATE',  xState + 6, hy, 6.5, w.bold, BRAND.gray6, 0.8)
    w.y -= hRowH + 1

    for (let ri = 0; ri < d.schedule.length; ri++) {
      const s = d.schedule[ri]
      const labelLines = wrap((s.label || 'Payment').replace(/\s+/g, ' '), w.normal, size, cLabel - 12)
      const rowH = labelLines.length * (size + 3) + 10
      w.need(rowH + 1)

      const bg = ri % 2 === 1 ? BRAND.ruleLt : C.white
      w.page.drawRectangle({ x: w.ml, y: w.y - rowH, width: w.innerW, height: rowH, color: bg })

      const ty0 = w.y - size - 5
      let ty = ty0
      for (const ln of labelLines) {
        w.page.drawText(ln, { x: xLabel + 6, y: ty, size, font: w.normal, color: BRAND.ink })
        ty -= size + 3
      }
      const amt = money(s.amount)
      const amtW = w.normal.widthOfTextAtSize(amt, size)
      w.page.drawText(amt, { x: xAmount + cAmount - amtW - 6, y: ty0, size, font: w.normal, color: BRAND.ink })
      w.page.drawText(s.dueDate ? fmtShortDateUtc(s.dueDate) : '—', {
        x: xDue + 6, y: ty0, size, font: w.normal, color: s.dueDate ? BRAND.gray6 : BRAND.gray4,
      })
      const state = s.paid ? 'Paid' : s.invoiced ? 'Invoiced' : 'Pending'
      w.page.drawText(state, {
        x: xState + 6, y: ty0, size,
        font: s.paid ? w.bold : w.normal,
        color: s.paid ? BRAND.navy : s.invoiced ? BRAND.cyan : BRAND.gray6,
      })

      w.page.drawLine({
        start: { x: w.ml, y: w.y - rowH },
        end:   { x: w.pw - w.mr, y: w.y - rowH },
        thickness: 0.3, color: BRAND.rule,
      })
      w.y -= rowH + 1
    }
    w.sp(6)
  }

  // ── Closing note ─────────────────────────────────────────────────────────────
  w.sp(6)
  w.body(
    `Generated ${genLabel}. This sheet lists the work logged against this package and the state of its payment schedule. Hours are recorded for transparency — fixed-price package work is billed on the schedule above, not by the hour.`,
    8, BRAND.gray6,
  )

  w._drawFooter()
  return doc.save()
}
