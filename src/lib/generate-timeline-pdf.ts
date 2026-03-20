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
  build:     '#7BAE9A',
  integrate: '#A88FD4',
  touchup:   '#D4A06B',
  prep:      '#C97A7A',
}

// ── Block HTML builders ───────────────────────────────────────────────────────

function phaseEntryHtml(block: PhaseBlock, index: number): string {
  const color = TAG_COLOR[block.tagColor ?? 'build'] ?? TAG_COLOR.build
  const num = String(index + 1).padStart(2, '0')

  const items = (block.items ?? []).map(item =>
    `<li style="display:flex;align-items:baseline;gap:8px;margin-bottom:5px;">
       <span style="color:${esc(color)};flex-shrink:0;font-size:14px;line-height:1;">•</span>
       <span style="font-size:11px;color:#4a4540;line-height:1.55;font-family:'DM Sans',system-ui,sans-serif;">${esc(item.text ?? '')}</span>
     </li>`
  ).join('')

  const dealerPill = block.dealerPill?.enabled && block.dealerPill.text
    ? `<div style="margin-top:10px;padding:8px 12px;background:${esc(color)}14;border:1px solid ${esc(color)}40;border-radius:4px;font-size:11px;color:${esc(color)};font-weight:500;font-family:'DM Sans',system-ui,sans-serif;">
         ${esc(block.dealerPill.text)}
       </div>`
    : ''

  return `
    <div style="display:flex;align-items:flex-start;margin-bottom:32px;break-inside:avoid;page-break-inside:avoid;">
      <!-- Dot column -->
      <div style="width:48px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;padding-top:18px;position:relative;">
        <div style="width:12px;height:12px;border-radius:50%;background:${esc(color)};border:2.5px solid #FAFAF8;box-shadow:0 0 0 2px ${esc(color)};z-index:1;flex-shrink:0;"></div>
      </div>

      <!-- Content -->
      <div style="flex:1;min-width:0;">
        ${block.dateRange
          ? `<div style="font-size:10px;font-weight:500;color:#b5afa6;letter-spacing:0.07em;font-family:'DM Sans',system-ui,sans-serif;margin-bottom:6px;">${esc(block.dateRange)}</div>`
          : ''}

        <div style="background:#ffffff;border-left:4px solid ${esc(color)};border-radius:0 6px 6px 0;box-shadow:0 1px 6px rgba(0,0,0,0.06);padding:16px 18px 16px 16px;position:relative;overflow:hidden;">
          <!-- Ghost number -->
          <div style="position:absolute;top:-6px;right:12px;font-size:56px;font-weight:700;font-family:'Playfair Display',Georgia,serif;color:rgba(0,0,0,0.04);line-height:1;pointer-events:none;user-select:none;">${num}</div>

          ${block.tag
            ? `<div style="display:inline-block;font-size:9px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:${esc(color)};margin-bottom:6px;font-family:'DM Sans',system-ui,sans-serif;">${esc(block.tag)}</div>`
            : ''}

          <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;color:#1a1814;margin:0 0 10px 0;line-height:1.25;">${esc(block.title ?? '')}</h3>

          ${items ? `<ul style="list-style:none;padding:0;margin:0;">${items}</ul>` : ''}
          ${dealerPill}
        </div>
      </div>
    </div>`
}

function checklistEntryHtml(block: ChecklistBlock, index: number): string {
  const color = '#6B9FD4'

  const items = (block.items ?? []).map(item =>
    `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:9px;">
       <div style="width:13px;height:13px;flex-shrink:0;border:1.5px solid ${color};border-radius:2px;margin-top:1px;"></div>
       <div>
         <span style="font-size:11px;color:#4a4540;line-height:1.55;font-family:'DM Sans',system-ui,sans-serif;">${esc(item.text ?? '')}</span>
         ${item.note
           ? `<span style="display:block;font-size:9px;color:#C9A84C;margin-top:2px;font-weight:500;font-family:'DM Sans',system-ui,sans-serif;">⚠ ${esc(item.note)}</span>`
           : ''}
       </div>
     </div>`
  ).join('')

  return `
    <div style="display:flex;align-items:flex-start;margin-bottom:32px;break-inside:avoid;page-break-inside:avoid;">
      <!-- Square dot -->
      <div style="width:48px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;padding-top:18px;">
        <div style="width:12px;height:12px;border-radius:2px;background:${color};border:2.5px solid #FAFAF8;box-shadow:0 0 0 2px ${color};z-index:1;flex-shrink:0;"></div>
      </div>

      <!-- Content -->
      <div style="flex:1;min-width:0;">
        ${block.dateLabel
          ? `<div style="font-size:10px;font-weight:500;color:#b5afa6;letter-spacing:0.07em;font-family:'DM Sans',system-ui,sans-serif;margin-bottom:6px;">${esc(block.dateLabel)}</div>`
          : ''}

        <div style="background:rgba(107,159,212,0.05);border:1px solid rgba(107,159,212,0.22);border-radius:6px;box-shadow:0 1px 6px rgba(0,0,0,0.04);padding:16px 18px;">
          ${block.tag
            ? `<div style="font-size:9px;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;color:${color};margin-bottom:6px;font-family:'DM Sans',system-ui,sans-serif;">${esc(block.tag)}</div>`
            : ''}

          <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;color:#1a1814;margin:0 0 12px 0;line-height:1.25;">${esc(block.title ?? '')}</h3>

          ${items}
        </div>
      </div>
    </div>`
}

function launchEntryHtml(block: LaunchBlock): string {
  return `
    <div style="display:flex;align-items:flex-start;margin-bottom:32px;break-inside:avoid;page-break-inside:avoid;">
      <!-- Gold dot (larger) -->
      <div style="width:48px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;padding-top:20px;">
        <div style="width:18px;height:18px;border-radius:50%;background:#C9A84C;border:3px solid #FAFAF8;box-shadow:0 0 0 2.5px #C9A84C,0 0 12px rgba(201,168,76,0.4);z-index:1;flex-shrink:0;margin-left:-3px;"></div>
      </div>

      <!-- Content -->
      <div style="flex:1;min-width:0;">
        ${block.dateLabel
          ? `<div style="font-size:10px;font-weight:500;color:#b5afa6;letter-spacing:0.07em;font-family:'DM Sans',system-ui,sans-serif;margin-bottom:6px;">${esc(block.dateLabel)}</div>`
          : ''}

        <div style="background:linear-gradient(135deg,#C9A84C 0%,#E8C97A 50%,#C9A84C 100%);border-radius:8px;padding:28px 36px;text-align:center;box-shadow:0 4px 24px rgba(201,168,76,0.25);">
          ${block.label
            ? `<div style="font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:10px;font-family:'DM Sans',system-ui,sans-serif;">${esc(block.label)}</div>`
            : ''}

          <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#fff;margin:0;line-height:1.2;">
            ${block.title ? esc(block.title) : ''}
            ${block.titleEmphasis ? `<em style="font-style:italic;font-weight:400;display:block;">${esc(block.titleEmphasis)}</em>` : ''}
          </h2>

          ${block.subtitle
            ? `<p style="margin-top:10px;font-size:13px;color:rgba(255,255,255,0.8);font-family:'DM Sans',system-ui,sans-serif;font-weight:400;">${esc(block.subtitle)}</p>`
            : ''}
        </div>
      </div>
    </div>`
}

// ── HTML document ─────────────────────────────────────────────────────────────

function buildHtml(timeline: Timeline): string {
  const phases = (timeline.phases ?? []) as TimelinePhase[]

  const entriesHtml = phases.map((block, i) => {
    if (block.blockType === 'phase')     return phaseEntryHtml(block as PhaseBlock, i)
    if (block.blockType === 'checklist') return checklistEntryHtml(block as ChecklistBlock, i)
    if (block.blockType === 'launch')    return launchEntryHtml(block as LaunchBlock)
    return ''
  }).join('')

  const titleLine = timeline.title ?? ''
  const titleEmphasis = timeline.titleEmphasis ?? ''
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
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 13px;
      color: #1a1814;
      background: #FAFAF8;
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
  <!-- ── Title block ── -->
  <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #E8E4DC;">
    <div style="font-size:10px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#7a756c;margin-bottom:10px;font-family:'DM Sans',system-ui,sans-serif;">
      ${metaLine || '&nbsp;'}
    </div>
    <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:700;color:#1a1814;line-height:1.15;margin:0;">
      ${esc(titleLine)}${titleEmphasis
        ? ` <em style="font-style:italic;font-weight:400;color:#C9A84C;">${esc(titleEmphasis)}</em>`
        : ''}
    </h1>
    <div style="width:40px;height:2px;background:#C9A84C;margin-top:14px;"></div>
  </div>

  <!-- ── Timeline body ── -->
  <div style="position:relative;">
    <!-- Vertical spine -->
    <div style="position:absolute;left:23px;top:18px;bottom:0;width:2px;background:#E8E4DC;"></div>

    <!-- Entries -->
    ${entriesHtml}
  </div>
</body>
</html>`
}

// ── Main export ───────────────────────────────────────────────────────────────

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
