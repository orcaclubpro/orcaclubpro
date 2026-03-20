import puppeteer from 'puppeteer'
import type { Timeline } from '@/types/payload-types'

type TimelinePhase = NonNullable<Timeline['phases']>[number]
type PhaseBlock     = Extract<TimelinePhase, { blockType: 'phase' }>
type ChecklistBlock = Extract<TimelinePhase, { blockType: 'checklist' }>
type LaunchBlock    = Extract<TimelinePhase, { blockType: 'launch' }>

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Color maps ────────────────────────────────────────────────────────────────

const TAG_COLOR: Record<string, string> = {
  build:     '#4A8C7A',
  integrate: '#7B6AAA',
  touchup:   '#B07840',
  prep:      '#A05858',
}

// ── Block HTML builders ───────────────────────────────────────────────────────

function phaseCardHtml(block: PhaseBlock): string {
  const color = TAG_COLOR[block.tagColor ?? 'build'] ?? TAG_COLOR.build

  const items = (block.items ?? []).map(item =>
    `<li style="display:flex;gap:8px;align-items:flex-start;margin-bottom:4px;">
       <span style="color:${esc(color)};flex-shrink:0;font-size:10px;margin-top:1px;">–</span>
       <span style="font-size:11px;color:#555;line-height:1.5;">${esc(item.text ?? '')}</span>
     </li>`
  ).join('')

  const dealerPill = block.dealerPill?.enabled && block.dealerPill.text
    ? `<div style="margin-top:10px;display:flex;align-items:center;gap:6px;
                   background:#f0f4f8;border:1px solid #c8daea;padding:5px 8px;border-radius:4px;">
         <div style="width:5px;height:5px;border-radius:50%;background:#6B9FD4;flex-shrink:0;"></div>
         <span style="font-size:9px;color:#5580a0;">${esc(block.dealerPill.text)}</span>
       </div>`
    : ''

  return `
    <div style="break-inside:avoid;page-break-inside:avoid;">
      ${block.dateRange
        ? `<div style="display:inline-block;margin-bottom:8px;padding:3px 10px;
                        border:1px solid ${esc(color)}55;background:${esc(color)}10;
                        font-size:9px;letter-spacing:0.1em;color:${esc(color)};font-weight:600;">
             ${esc(block.dateRange)}
           </div>`
        : ''}
      <div style="border:1px solid #e2e2e2;border-top:2px solid ${esc(color)};
                  padding:12px 14px;background:#fafafa;border-radius:0 0 4px 4px;">
        ${block.tag
          ? `<div style="display:inline-block;margin-bottom:6px;padding:2px 7px;
                          border:1px solid ${esc(color)}88;color:${esc(color)};
                          font-size:8px;letter-spacing:0.18em;text-transform:uppercase;">
               ${esc(block.tag)}
             </div>`
          : ''}
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;
                    font-weight:400;color:#1a1a1a;margin-bottom:${items ? '8px' : '0'};line-height:1.3;">
          ${esc(block.title ?? '')}
        </div>
        ${items ? `<ul style="list-style:none;padding:0;margin:0;">${items}</ul>` : ''}
        ${dealerPill}
      </div>
    </div>`
}

function checklistCardHtml(block: ChecklistBlock): string {
  const items = (block.items ?? []).map(item =>
    `<li style="display:flex;gap:10px;align-items:flex-start;margin-bottom:7px;">
       <div style="width:11px;height:11px;border:1.5px solid #6B9FD4;flex-shrink:0;
                   margin-top:1px;border-radius:2px;"></div>
       <div>
         <span style="font-size:11px;color:#555;line-height:1.5;">${esc(item.text ?? '')}</span>
         ${item.note
           ? `<span style="display:block;font-size:9px;color:#9a7a40;margin-top:2px;">${esc(item.note)}</span>`
           : ''}
       </div>
     </li>`
  ).join('')

  return `
    <div style="break-inside:avoid;page-break-inside:avoid;">
      ${block.dateLabel
        ? `<div style="display:inline-block;margin-bottom:8px;padding:3px 10px;
                        border:1px solid #6B9FD455;background:#6B9FD410;
                        font-size:9px;letter-spacing:0.1em;color:#4a7aa0;font-weight:600;">
             ${esc(block.dateLabel)}
           </div>`
        : ''}
      <div style="border:1px solid #e2e2e2;border-top:2px solid #6B9FD4;
                  padding:12px 14px;background:#f8fafc;border-radius:0 0 4px 4px;">
        ${block.tag
          ? `<div style="display:inline-block;margin-bottom:6px;padding:2px 7px;
                          border:1px solid #6B9FD488;color:#4a7aa0;
                          font-size:8px;letter-spacing:0.18em;text-transform:uppercase;">
               ${esc(block.tag)}
             </div>`
          : ''}
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;
                    font-weight:400;color:#1a1a1a;margin-bottom:${items ? '10px' : '0'};line-height:1.3;">
          ${esc(block.title ?? '')}
        </div>
        ${items ? `<ul style="list-style:none;padding:0;margin:0;">${items}</ul>` : ''}
      </div>
    </div>`
}

function launchCardHtml(block: LaunchBlock): string {
  return `
    <div style="break-inside:avoid;page-break-inside:avoid;text-align:center;max-width:360px;margin:0 auto;">
      ${block.dateLabel
        ? `<div style="display:inline-block;margin-bottom:10px;padding:4px 14px;
                        border:1px solid #b89840;background:#fbf6e9;
                        font-size:9px;letter-spacing:0.14em;color:#9a7820;font-weight:600;">
             ${esc(block.dateLabel)}
           </div>`
        : ''}
      <div style="border:1px solid #d4b84a;border-top:2px solid #C9A84C;
                  padding:20px 24px;background:linear-gradient(135deg,#fffdf5,#fdf8e8);
                  border-radius:0 0 4px 4px;">
        ${block.label
          ? `<div style="font-size:8px;letter-spacing:0.3em;color:#9a7820;
                          text-transform:uppercase;margin-bottom:6px;">
               ${esc(block.label)}
             </div>`
          : ''}
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;
                    font-weight:300;letter-spacing:0.05em;color:#1a1a1a;margin-bottom:4px;">
          ${block.title ? `<span>${esc(block.title)} </span>` : ''}
          ${block.titleEmphasis
            ? `<em style="font-style:italic;color:#9a7820;">${esc(block.titleEmphasis)}</em>`
            : ''}
        </div>
        ${block.subtitle
          ? `<div style="font-size:10px;color:#888;letter-spacing:0.12em;margin-top:4px;">
               ${esc(block.subtitle)}
             </div>`
          : ''}
      </div>
    </div>`
}

// ── HTML document ─────────────────────────────────────────────────────────────

function buildHtml(timeline: Timeline): string {
  const phases = (timeline.phases ?? []) as TimelinePhase[]

  // Group phases: launch blocks get their own full-width row; others go 2-per-row
  type Row =
    | { wide: true;  block: LaunchBlock }
    | { wide: false; blocks: TimelinePhase[] }

  const rows: Row[] = []
  let buf: TimelinePhase[] = []

  for (const phase of phases) {
    if (phase.blockType === 'launch') {
      if (buf.length) { rows.push({ wide: false, blocks: buf }); buf = [] }
      rows.push({ wide: true, block: phase as LaunchBlock })
    } else {
      buf.push(phase)
      if (buf.length === 2) { rows.push({ wide: false, blocks: buf }); buf = [] }
    }
  }
  if (buf.length) rows.push({ wide: false, blocks: buf })

  const rowsHtml = rows.map(row => {
    if (row.wide) {
      return `<div style="margin-bottom:20px;">${launchCardHtml(row.block)}</div>`
    }
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;">
        ${row.blocks.map(p => {
          if (p.blockType === 'phase')     return `<div>${phaseCardHtml(p as PhaseBlock)}</div>`
          if (p.blockType === 'checklist') return `<div>${checklistCardHtml(p as ChecklistBlock)}</div>`
          return '<div></div>'
        }).join('')}
        ${row.blocks.length === 1 ? '<div></div>' : ''}
      </div>`
  }).join('')

  const titleLine = [timeline.title, timeline.titleEmphasis]
    .filter((s): s is string => Boolean(s))
    .map(esc)
    .join(' ')

  const metaLine = [timeline.eyebrow, timeline.dateRange, timeline.metaLabel]
    .filter((s): s is string => Boolean(s))
    .map(esc)
    .join('  ·  ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page {
      size: letter;
      margin: 0.55in 0.65in;
    }
  </style>
</head>
<body>
  <div style="max-width:680px;margin:0 auto;padding:0;">

    <!-- Title block -->
    <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e5e5e5;">
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;
                  letter-spacing:0.02em;color:#1a1a1a;line-height:1.15;margin-bottom:6px;">
        ${titleLine}
      </div>
      ${metaLine
        ? `<div style="font-size:10px;color:#888;letter-spacing:0.12em;text-transform:uppercase;">
             ${metaLine}
           </div>`
        : ''}
    </div>

    <!-- Phases -->
    ${rowsHtml}

  </div>
</body>
</html>`
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Renders the timeline phases to a PDF buffer.
 * No branding — just the timeline title and phases.
 */
export async function generateTimelinePDF(timeline: Timeline): Promise<Buffer> {
  const html = buildHtml(timeline)

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=none',
      '--force-color-profile=srgb',
    ],
  })

  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(30_000)
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    )
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      waitForFonts: true,
      margin: { top: '0.55in', right: '0.65in', bottom: '0.55in', left: '0.65in' },
      timeout: 30_000,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
