// ── Types ──────────────────────────────────────────────────────────────────────

export interface NdaFormData {
  effectiveDate: string
  clientName: string
  clientType: 'individual' | 'company'
  clientAddress: string
}

export interface SowMilestone {
  name: string
  date: string
  notes: string
}

export interface SowLineItem {
  desc: string
  amount: string
}

export interface SowFormData {
  providerContact: string
  clientName: string
  clientContact: string
  effectiveDate: string
  projectName: string
  projectOverview: string
  scopeItems: string[]
  milestones: SowMilestone[]
  pricingType: 'project' | 'retainer' | 'both'
  projectItems: SowLineItem[]
  retainerItems: SowLineItem[]
  billingCycle: string
  contractTerm: string
  netDays: string
  depositPct: string
  lateFee: string
  revisionRounds: string
  revisionRate: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(val: string): string {
  if (!val) return '______________________________'
  const d = new Date(val + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtAmt(v: string): number {
  return parseFloat(v) || 0
}

function blank(val: string, fallback = '______________________________'): string {
  return val.trim() || fallback
}

// ── Personal NDA (Chance Noonan — with Kawai firewall) ────────────────────────

export function buildPersonalNdaHtml(d: NdaFormData): string {
  const dt = fmtDate(d.effectiveDate)
  const client = blank(d.clientName)
  const addr = blank(d.clientAddress)
  const ctype = d.clientType === 'company' ? 'a company' : 'an individual'

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title></title>
<style>
@page{size:auto;margin:0mm}
body{font-family:Georgia,serif;font-size:11pt;line-height:1.65;color:#1a1a1a;margin:0;padding:0.75in 1in}
h1{font-family:Arial,sans-serif;font-size:15pt;color:#1F4E79;text-transform:uppercase;letter-spacing:.06em;text-align:center;margin-bottom:3pt}
.sub{font-family:Arial,sans-serif;font-size:9pt;color:#595959;font-style:italic;text-align:center;margin-bottom:10pt}
h2{font-family:Arial,sans-serif;font-size:11pt;color:#1F4E79;text-transform:uppercase;letter-spacing:.04em;margin:16pt 0 5pt}
h3{font-family:Arial,sans-serif;font-size:10pt;color:#1F4E79;margin:10pt 0 3pt}
.thick{border:none;border-bottom:2px solid #1F4E79;margin:10pt 0}
.thin{border:none;border-bottom:1px solid #B0C4D8;margin:10pt 0}
p{margin:5pt 0;text-align:justify}
ul{margin:5pt 0;padding-left:18pt}li{margin:3pt 0;text-align:justify}
.pbox{background:#f8f9fa;border-left:3pt solid #1F4E79;padding:7pt 11pt;margin:7pt 0}
.ptag{font-family:Arial,sans-serif;font-size:8.5pt;color:#1F4E79;text-transform:uppercase;font-weight:bold;margin:0 0 3pt}
.nbox{background:#f0f4f8;border:1pt solid #B0C4D8;padding:7pt 11pt;margin:7pt 0;font-style:italic;font-size:9.5pt;color:#595959}
.st{width:100%;border-collapse:collapse;margin-top:14pt}
.st td{padding:7pt 10pt;vertical-align:top;width:50%}
.sl{border-top:1pt solid #999;margin-top:44pt}
.sn{font-weight:bold;font-size:11pt;margin-top:4pt}
.si{font-size:9pt;color:#595959}
.date-line{margin-top:14pt;font-size:10pt}
.ft{font-size:8pt;color:#aaa;font-style:italic;text-align:center;margin-top:20pt}
/* ── Pagination ── */
h1,h2,h3{page-break-after:avoid;break-after:avoid}
p{orphans:3;widows:3}
li{page-break-inside:avoid;break-inside:avoid}
.pbox,.nbox{page-break-inside:avoid;break-inside:avoid}
table{page-break-inside:avoid;break-inside:avoid}
tr{page-break-inside:avoid;break-inside:avoid}
.st{page-break-inside:avoid;break-inside:avoid;page-break-before:auto}
.sig-section{page-break-inside:avoid;break-inside:avoid;page-break-before:always;break-before:page}
</style>
</head>
<body>
<h1>Mutual Non-Disclosure Agreement</h1>
<p class="sub">with Independent Contractor Acknowledgment &amp; Employer Information Firewall</p>
<hr class="thick">
<p style="font-family:Arial,sans-serif;font-size:10pt"><strong>Effective Date:</strong> ${dt}</p>
<p>This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the Effective Date above by and between:</p>
<div class="pbox"><p class="ptag">Party 1 — Service Provider</p><p style="margin:0"><strong>Chance Noonan</strong>, an individual doing business as an independent freelance consultant ("Service Provider"), located in the State of California.</p></div>
<div class="nbox"><strong>Note:</strong> Service Provider is currently employed full-time by Kawai America Corporation ("Kawai") in a separate capacity. The services rendered under this Agreement are performed exclusively in Service Provider's independent freelance capacity as Chance Noonan and are in no way affiliated with, authorized by, or performed on behalf of Kawai.</div>
<div class="pbox"><p class="ptag">Party 2 — Client</p><p style="margin:0"><strong>${client}</strong>, ${ctype}, located at: ${addr}.</p></div>
<p>Each Party is referred to individually as a "Party" and collectively as the "Parties."</p>
<hr class="thin">
<h2>1. Purpose</h2>
<p>The Parties intend to explore and/or engage in a business relationship in which Service Provider provides digital marketing, web development, and/or consulting services to Client in Service Provider's independent freelance capacity (the "Business Purpose"). In connection with this Business Purpose, each Party may disclose certain Confidential Information to the other.</p>
<h2>2. Definition of Confidential Information</h2>
<p>Confidential Information means any non-public information disclosed by one Party (the Disclosing Party) to the other Party (the Receiving Party), whether disclosed orally, in writing, electronically, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential. Confidential Information includes, without limitation:</p>
<ul>
<li>Business strategies, marketing plans, pricing structures, and financial data</li>
<li>Client lists, vendor relationships, and partnership details</li>
<li>Website code, proprietary tools, workflows, and technical systems</li>
<li>Campaign data, creative assets, ad performance data, and analytics</li>
<li>Proposals, contracts, and scopes of work</li>
<li>Any other information that a reasonable person in the industry would consider proprietary or sensitive</li>
</ul>
<h3>2.1 Exclusions</h3>
<p>Confidential Information does not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully known to the Receiving Party prior to disclosure; (c) is independently developed by the Receiving Party without reference to the Disclosing Party's information; or (d) is required to be disclosed by law or court order, provided prompt written notice is given.</p>
<hr class="thin">
<h2>3. Employer Information Firewall — Kawai America Corporation</h2>
<h3>3.1 What Service Provider Will NOT Disclose to Client</h3>
<p>Service Provider shall not disclose to Client any Confidential Information belonging to or concerning Kawai, including: proprietary product information; internal pricing or dealer agreements; marketing budgets, campaign strategies, or performance data; customer or dealer lists; trade secrets, intellectual property, or proprietary systems; or any information accessed or handled in Service Provider's capacity as a Kawai employee.</p>
<h3>3.2 What Client Will NOT Request</h3>
<p>Client acknowledges Service Provider's existing confidentiality obligations to Kawai and agrees not to solicit, request, or encourage Service Provider to disclose any Kawai-protected information. Client will not use this engagement to obtain competitive intelligence about Kawai.</p>
<h3>3.3 What Service Provider CAN Provide</h3>
<p>Service Provider may apply the following in performing services for Client: general professional knowledge and industry expertise; skills and frameworks developed independently by Service Provider; publicly available industry data and platform documentation; and all creative work, code, and deliverables specifically developed for Client under this engagement.</p>
<h3>3.4 No Agency or Affiliation</h3>
<p>Nothing herein creates any agency, partnership, or affiliation between Client and Kawai. Client agrees not to represent to any third party that services rendered under this Agreement are authorized by or connected to Kawai.</p>
<hr class="thin">
<h2>4. Mutual Confidentiality Obligations</h2>
<p>Each Party agrees to: hold Confidential Information in strict confidence using no less than reasonable care; not use it for any purpose other than the Business Purpose; not disclose it to any third party without prior written consent; limit access to those with a legitimate need to know who are bound by equivalent obligations; and promptly notify the Disclosing Party of any unauthorized use or disclosure.</p>
<hr class="thin">
<h2>5. Client Confidential Information — Service Provider Obligations</h2>
<p>All Confidential Information received from Client shall: be kept strictly confidential and not disclosed to Kawai or its agents; not be used in any work performed for Kawai; not be incorporated into any Kawai-owned systems or deliverables; and be stored separately from any systems used in Service Provider's Kawai employment.</p>
<hr class="thin">
<h2>6. Term and Duration</h2>
<p>This Agreement shall remain in effect for <strong>three (3) years</strong> from the Effective Date, unless earlier terminated by mutual written consent. Confidentiality obligations survive termination with respect to any information disclosed during the term.</p>
<hr class="thin">
<h2>7. Return or Destruction of Confidential Information</h2>
<p>Upon written request or upon termination, the Receiving Party shall promptly return or destroy all tangible materials containing Confidential Information and certify such return or destruction in writing.</p>
<hr class="thin">
<h2>8. No License; No Warranty</h2>
<p>Nothing in this Agreement grants any right, license, or interest in any intellectual property of the other Party. All Confidential Information is provided AS IS without warranty of any kind.</p>
<hr class="thin">
<h2>9. Remedies</h2>
<p>Each Party acknowledges that a breach may cause irreparable harm and that the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.</p>
<hr class="thin">
<h2>10. General Provisions</h2>
<p><strong>Governing Law:</strong> State of California. <strong>Severability:</strong> Invalid provisions shall be severed; remaining provisions continue in full force. <strong>No Waiver:</strong> Failure to enforce shall not constitute waiver. <strong>Electronic Signatures:</strong> Valid and binding to the same extent as original signatures. <strong>Independent Contractor:</strong> Nothing herein creates an employment, partnership, or agency relationship.</p>
<div class="sig-section">
<hr class="thick">
<p style="text-align:center;font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;color:#1F4E79;text-transform:uppercase;letter-spacing:.05em">Signatures</p>
<p style="text-align:center">IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date first written above.</p>
<table class="st"><tr>
<td>
  <p style="font-family:Arial,sans-serif;font-size:8.5pt;color:#595959;font-weight:bold;text-transform:uppercase;margin:0 0 3pt">Party 1 — Service Provider</p>
  <div class="sl"></div>
  <p class="sn">Chance Noonan</p>
  <p class="si">Independent Freelance Consultant</p>
  <p class="date-line">Date: ___________________</p>
</td>
<td>
  <p style="font-family:Arial,sans-serif;font-size:8.5pt;color:#595959;font-weight:bold;text-transform:uppercase;margin:0 0 3pt">Party 2 — Client</p>
  <div class="sl"></div>
  <p class="sn">${client}</p>
  <p class="si">Title / Representative: ___________________</p>
  <p class="date-line">Date: ___________________</p>
</td>
</tr></table>
<p class="ft">Prepared by Chance Noonan for independent use. Does not constitute legal advice. Parties are encouraged to consult qualified legal counsel before execution.</p>
</div>
</body>
</html>`
}

// ── ORCACLUB NDA (Studio entity — clean mutual NDA) ───────────────────────────

export function buildOrcaclubNdaHtml(d: NdaFormData): string {
  const dt = fmtDate(d.effectiveDate)
  const client = blank(d.clientName)
  const addr = blank(d.clientAddress)
  const ctype = d.clientType === 'company' ? 'a company' : 'an individual'

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title></title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap');
@page{size:auto;margin:0mm}
*{print-color-adjust:exact;-webkit-print-color-adjust:exact}
body{font-family:Georgia,serif;font-size:11pt;line-height:1.65;color:#1a1a1a;margin:0;padding:0}
.page-wrap{margin:0;padding:1in}
.orca-hdr{background:#0D0D0D;margin:-1in -1in 24pt -1in;padding:20pt 1in;display:flex;justify-content:space-between;align-items:flex-end}
.orca-wordmark{font-family:'Cinzel Decorative','Cinzel',serif;font-size:20pt;font-weight:700;color:#ffffff;letter-spacing:.06em;line-height:1}
.orca-club{color:#67e8f9}
.orca-tag{font-size:7.5pt;color:#67e8f9;text-transform:uppercase;letter-spacing:.12em;margin-top:4pt;font-family:Arial,sans-serif}
.orca-url{font-size:8pt;color:#666;font-style:italic;font-family:Arial,sans-serif}
h1{font-family:Arial,sans-serif;font-size:14pt;color:#1a1a1a;text-transform:uppercase;letter-spacing:.06em;text-align:center;margin-bottom:3pt}
.sub{font-family:Arial,sans-serif;font-size:9pt;color:#595959;font-style:italic;text-align:center;margin-bottom:10pt}
h2{font-family:Arial,sans-serif;font-size:10.5pt;color:#0D0D0D;text-transform:uppercase;letter-spacing:.04em;margin:16pt 0 5pt;padding-left:8pt;border-left:3pt solid #67e8f9}
h3{font-family:Arial,sans-serif;font-size:10pt;color:#333;margin:10pt 0 3pt;padding-left:8pt}
.thick{border:none;border-bottom:2px solid #67e8f9;margin:10pt 0}
.thin{border:none;border-bottom:1pt solid #e0e0e0;margin:10pt 0}
p{margin:5pt 0;text-align:justify}
ul{margin:5pt 0;padding-left:18pt}li{margin:3pt 0;text-align:justify}
.pbox{background:#f9f9f9;border-left:3pt solid #67e8f9;padding:8pt 11pt;margin:7pt 0}
.ptag{font-family:Arial,sans-serif;font-size:8pt;color:#67e8f9;text-transform:uppercase;font-weight:bold;letter-spacing:.06em;margin:0 0 4pt}
.st{width:100%;border-collapse:collapse;margin-top:14pt}
.st td{padding:7pt 10pt;vertical-align:top;width:50%}
.sl{border-top:1.5pt solid #999;margin-top:44pt}
.sn{font-weight:bold;font-size:11pt;margin-top:4pt}
.si{font-size:9pt;color:#595959}
.date-line{margin-top:14pt;font-size:10pt}
.ft{font-size:7.5pt;color:#aaa;font-style:italic;text-align:center;margin-top:20pt;padding-top:10pt;border-top:0.5pt solid #eee}
/* ── Pagination ── */
h1,h2,h3{page-break-after:avoid;break-after:avoid}
p{orphans:3;widows:3}
li{page-break-inside:avoid;break-inside:avoid}
.pbox{page-break-inside:avoid;break-inside:avoid}
table{page-break-inside:avoid;break-inside:avoid}
tr{page-break-inside:avoid;break-inside:avoid}
.st{page-break-inside:avoid;break-inside:avoid}
.sig-section{page-break-inside:avoid;break-inside:avoid;page-break-before:always;break-before:page}
</style>
</head>
<body>
<div class="page-wrap">
<div class="orca-hdr">
  <div>
    <div class="orca-wordmark">ORCA<span class="orca-club">CLUB</span></div>
    <div class="orca-tag">Technical Operations Development Studio</div>
  </div>
  <div class="orca-url">orcaclub.pro</div>
</div>
<h1>Mutual Non-Disclosure Agreement</h1>
<p class="sub">Confidentiality &amp; Non-Disclosure</p>
<hr class="thick">
<p style="font-family:Arial,sans-serif;font-size:10pt"><strong>Effective Date:</strong> ${dt}</p>
<p>This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the Effective Date above by and between:</p>
<div class="pbox">
  <p class="ptag">Party 1 — Service Provider</p>
  <p style="margin:0"><strong>ORCACLUB</strong>, a Technical Operations Development Studio ("Service Provider"), operating as ORCACLUB at orcaclub.pro.</p>
</div>
<div class="pbox">
  <p class="ptag">Party 2 — Client</p>
  <p style="margin:0"><strong>${client}</strong>, ${ctype}, located at: ${addr}.</p>
</div>
<p>Each Party is referred to individually as a "Party" and collectively as the "Parties."</p>
<hr class="thin">
<h2>1. Purpose</h2>
<p>The Parties intend to explore and/or engage in a business relationship in which Service Provider provides technical operations, development, and/or consulting services to Client (the "Business Purpose"). In connection with this Business Purpose, each Party may disclose certain Confidential Information to the other. This Agreement establishes the obligations of each Party with respect to that information.</p>
<h2>2. Definition of Confidential Information</h2>
<p>Confidential Information means any non-public information disclosed by one Party (the Disclosing Party) to the other Party (the Receiving Party), whether disclosed orally, in writing, electronically, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential. Confidential Information includes, without limitation:</p>
<ul>
<li>Business strategies, marketing plans, pricing structures, and financial data</li>
<li>Client lists, vendor relationships, and partnership details</li>
<li>Source code, proprietary tools, systems architecture, and technical workflows</li>
<li>Performance data, analytics, creative assets, and campaign information</li>
<li>Proposals, contracts, scopes of work, and project deliverables</li>
<li>Any other information that a reasonable person in the industry would consider proprietary or sensitive</li>
</ul>
<h3>2.1 Exclusions</h3>
<p>Confidential Information does not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully known to the Receiving Party prior to disclosure; (c) is independently developed by the Receiving Party without reference to the Disclosing Party's information; or (d) is required to be disclosed by law or court order, provided prompt written notice is given.</p>
<hr class="thin">
<h2>3. Mutual Confidentiality Obligations</h2>
<p>Each Party agrees to: hold Confidential Information in strict confidence using no less than reasonable care; not use it for any purpose other than the Business Purpose; not disclose it to any third party without prior written consent; limit access to those with a legitimate need to know who are bound by equivalent obligations; and promptly notify the Disclosing Party of any unauthorized use or disclosure.</p>
<hr class="thin">
<h2>4. Term and Duration</h2>
<p>This Agreement shall remain in effect for <strong>three (3) years</strong> from the Effective Date, unless earlier terminated by mutual written consent. Confidentiality obligations survive termination with respect to any information disclosed during the term.</p>
<hr class="thin">
<h2>5. Return or Destruction of Confidential Information</h2>
<p>Upon written request or upon termination, the Receiving Party shall promptly return or destroy all tangible materials containing Confidential Information and certify such return or destruction in writing.</p>
<hr class="thin">
<h2>6. No License; No Warranty</h2>
<p>Nothing in this Agreement grants any right, license, or interest in any intellectual property of the other Party. All Confidential Information is provided AS IS without warranty of any kind.</p>
<hr class="thin">
<h2>7. Remedies</h2>
<p>Each Party acknowledges that a breach may cause irreparable harm and that the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.</p>
<hr class="thin">
<h2>8. General Provisions</h2>
<p><strong>Governing Law:</strong> State of California. <strong>Severability:</strong> Invalid provisions shall be severed; remaining provisions continue in full force. <strong>No Waiver:</strong> Failure to enforce shall not constitute waiver. <strong>Electronic Signatures:</strong> Valid and binding to the same extent as original signatures. <strong>Independent Contractor:</strong> Nothing herein creates an employment, partnership, or agency relationship.</p>
<div class="sig-section">
<hr class="thick">
<p style="text-align:center;font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;color:#1a1a1a;text-transform:uppercase;letter-spacing:.05em">Signatures</p>
<p style="text-align:center">IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date first written above.</p>
<table class="st"><tr>
<td>
  <p style="font-family:Arial,sans-serif;font-size:8.5pt;color:#595959;font-weight:bold;text-transform:uppercase;margin:0 0 3pt">Party 1 — Service Provider</p>
  <div class="sl"></div>
  <p class="sn">ORCACLUB</p>
  <p class="si">Authorized Representative: ___________________</p>
  <p class="date-line">Date: ___________________</p>
</td>
<td>
  <p style="font-family:Arial,sans-serif;font-size:8.5pt;color:#595959;font-weight:bold;text-transform:uppercase;margin:0 0 3pt">Party 2 — Client</p>
  <div class="sl"></div>
  <p class="sn">${client}</p>
  <p class="si">Title / Representative: ___________________</p>
  <p class="date-line">Date: ___________________</p>
</td>
</tr></table>
<p class="ft">Prepared by ORCACLUB Technical Operations Development Studio · orcaclub.pro · Does not constitute legal advice. Parties are encouraged to consult qualified legal counsel before execution.</p>
</div>
</div>
</body>
</html>`
}

// ── Shared SOW helpers ─────────────────────────────────────────────────────────

function buildSowPricingSection(d: SowFormData, accentColor: string): string {
  let html = ''
  const projTotal = d.projectItems.reduce((s, i) => s + fmtAmt(i.amount), 0).toFixed(2)
  const retTotal = d.retainerItems.reduce((s, i) => s + fmtAmt(i.amount), 0).toFixed(2)

  const tableStyle = `width:100%;border-collapse:collapse;margin:6pt 0;font-size:10.5pt`
  const thStyle = `background:#f0f0f0;padding:5pt 8pt;text-align:left;font-family:Arial,sans-serif;font-size:9pt;color:${accentColor}`
  const tdStyle = `padding:5pt 8pt;border-bottom:.5pt solid #e0e0e0`
  const totStyle = `background:#fafafa;border-top:1pt solid #ccc`

  if (d.pricingType === 'project' || d.pricingType === 'both') {
    const rows = d.projectItems.filter(i => i.desc.trim()).map(i =>
      `<tr><td style="${tdStyle}">${i.desc}</td><td style="${tdStyle};text-align:right">${parseFloat(i.amount || '0').toFixed(2)}</td></tr>`
    ).join('') || `<tr><td colspan="2" style="${tdStyle};color:#aaa;font-style:italic">No items added</td></tr>`

    html += `<h3 style="font-family:Arial,sans-serif;font-size:10pt;color:${accentColor};margin:8pt 0 3pt">Option A — Project-Based (One-Time Fee)</h3>
<table style="${tableStyle}">
  <tr><th style="${thStyle}">Description</th><th style="${thStyle};text-align:right;width:100px">Amount</th></tr>
  ${rows}
  <tr style="${totStyle}"><td style="${tdStyle}"><strong>Total</strong></td><td style="${tdStyle};text-align:right"><strong>$${projTotal}</strong></td></tr>
</table>`
  }

  if (d.pricingType === 'retainer' || d.pricingType === 'both') {
    const rows = d.retainerItems.filter(i => i.desc.trim()).map(i =>
      `<tr><td style="${tdStyle}">${i.desc}</td><td style="${tdStyle};text-align:right">${parseFloat(i.amount || '0').toFixed(2)}</td></tr>`
    ).join('') || `<tr><td colspan="2" style="${tdStyle};color:#aaa;font-style:italic">No items added</td></tr>`

    html += `<h3 style="font-family:Arial,sans-serif;font-size:10pt;color:${accentColor};margin:${d.pricingType === 'both' ? '12pt' : '0'} 0 3pt">Option B — Monthly Retainer</h3>
<table style="${tableStyle}">
  <tr><th style="${thStyle}">Description</th><th style="${thStyle};text-align:right;width:100px">Monthly Rate</th></tr>
  ${rows}
  <tr style="${totStyle}"><td style="${tdStyle}"><strong>Monthly Total</strong></td><td style="${tdStyle};text-align:right"><strong>$${retTotal}</strong></td></tr>
</table>
<p style="margin-top:6pt"><strong>Billing Cycle:</strong> ${d.billingCycle || '—'} &nbsp;&nbsp; <strong>Contract Term:</strong> ${d.contractTerm || '—'}</p>`
  }

  return html
}

// ── Personal SOW (Chance Noonan) ───────────────────────────────────────────────

export function buildPersonalSowHtml(d: SowFormData): string {
  const dt = fmtDate(d.effectiveDate)
  const NAVY = '#1F4E79'

  const scopeItems = d.scopeItems.filter(i => i.trim()).map((i, n) => `<li>${i}</li>`).join('')
  const mileRows = d.milestones.filter(m => m.name.trim()).map(m => {
    const mdt = m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    return `<tr><td style="padding:5pt 8pt;border-bottom:.5pt solid #D0DDE8">${m.name}</td><td style="padding:5pt 8pt;border-bottom:.5pt solid #D0DDE8">${mdt}</td><td style="padding:5pt 8pt;border-bottom:.5pt solid #D0DDE8">${m.notes || '—'}</td></tr>`
  }).join('')

  const pricingHtml = buildSowPricingSection(d, NAVY)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title></title>
<style>
@page{size:auto;margin:0mm}
body{font-family:Georgia,serif;font-size:11pt;line-height:1.65;color:#1a1a1a;margin:0;padding:0.75in 1in}
h1{font-family:Arial,sans-serif;font-size:15pt;color:${NAVY};text-transform:uppercase;letter-spacing:.06em;text-align:center;margin-bottom:3pt}
.sub{font-family:Arial,sans-serif;font-size:9pt;color:#595959;font-style:italic;text-align:center;margin-bottom:10pt}
h2{font-family:Arial,sans-serif;font-size:11pt;color:${NAVY};text-transform:uppercase;letter-spacing:.04em;margin:16pt 0 5pt}
.thick{border:none;border-bottom:2px solid ${NAVY};margin:10pt 0}
.thin{border:none;border-bottom:1px solid #B0C4D8;margin:10pt 0}
p{margin:5pt 0}ul{margin:5pt 0;padding-left:18pt}li{margin:3pt 0}
.it{width:100%;border-collapse:collapse;margin:7pt 0}
.it td{padding:5pt 8pt;font-size:10pt;border-bottom:.5pt solid #D0DDE8}
.it td:first-child{font-weight:bold;color:${NAVY};font-family:Arial,sans-serif;font-size:8.5pt;text-transform:uppercase;width:28%;background:#EBF3FA}
.mt{width:100%;border-collapse:collapse;margin:7pt 0;font-size:10pt}
.mt th{background:#D6E4F0;color:${NAVY};font-family:Arial,sans-serif;font-size:9pt;padding:5pt 8pt;text-align:left}
.ob{background:#f8f9fa;border-left:3pt solid ${NAVY};padding:7pt 11pt;margin:7pt 0;min-height:30pt}
.st{width:100%;border-collapse:collapse;margin-top:14pt}
.st td{padding:7pt 10pt;vertical-align:top;width:50%}
.sl{border-top:1pt solid #999;margin-top:44pt}
.sn{font-weight:bold;font-size:11pt;margin-top:4pt}
.si{font-size:9pt;color:#595959}
.date-line{margin-top:14pt;font-size:10pt}
.ft{font-size:8pt;color:#aaa;font-style:italic;text-align:center;margin-top:20pt}
/* ── Pagination ── */
h1,h2,h3{page-break-after:avoid;break-after:avoid}
p{orphans:3;widows:3}
li{page-break-inside:avoid;break-inside:avoid}
.it,.mt,.ob{page-break-inside:avoid;break-inside:avoid}
table{page-break-inside:avoid;break-inside:avoid}
tr{page-break-inside:avoid;break-inside:avoid}
.st{page-break-inside:avoid;break-inside:avoid}
.sig-section{page-break-inside:avoid;break-inside:avoid;page-break-before:always;break-before:page}
</style>
</head>
<body>
<h1>Scope of Work</h1>
<p class="sub">Independent Contractor Agreement</p>
<hr class="thick">
<h2>1. Parties</h2>
<table class="it">
<tr><td>Service Provider</td><td>Chance Noonan${d.providerContact ? ' &nbsp;·&nbsp; ' + d.providerContact : ''}</td></tr>
<tr><td>Client</td><td>${blank(d.clientName)}${d.clientContact ? ' &nbsp;·&nbsp; ' + d.clientContact : ''}</td></tr>
<tr><td>Effective Date</td><td>${dt}</td></tr>
<tr><td>Project Name</td><td>${blank(d.projectName)}</td></tr>
</table>
<hr class="thin">
<h2>2. Project Overview</h2>
<div class="ob">${d.projectOverview || '<em style="color:#aaa">Not provided.</em>'}</div>
<hr class="thin">
<h2>3. Scope of Work</h2>
${scopeItems ? `<ul>${scopeItems}</ul>` : '<p style="color:#aaa;font-style:italic">No scope items defined.</p>'}
<p><strong>Out of Scope:</strong> Any work not explicitly listed above requires a written Change Order and may be subject to additional fees.</p>
<hr class="thin">
<h2>4. Timeline &amp; Milestones</h2>
${mileRows ? `<table class="mt"><tr><th>Milestone / Phase</th><th>Due Date</th><th>Notes</th></tr>${mileRows}</table>` : '<p style="color:#aaa;font-style:italic">No milestones defined.</p>'}
<p><strong>Timeline Note:</strong> Timelines are contingent on Client providing required materials, access, and feedback within 48 hours of request. Delays caused by Client may shift delivery dates accordingly.</p>
<hr class="thin">
<h2>5. Pricing &amp; Payment</h2>
${pricingHtml}
<hr class="thin">
<h2>6. Payment Terms</h2>
<ul>
<li>Invoices are due within <strong>${d.netDays || '30'}</strong> days of issue.</li>
<li>A <strong>${d.depositPct || '50'}%</strong> deposit is required before work begins on project-based engagements.</li>
<li>Late payments are subject to a <strong>${d.lateFee || '1.5'}%</strong> monthly fee after the due date.</li>
<li>Work may be paused or withheld if an invoice remains unpaid beyond 14 days past due.</li>
</ul>
<hr class="thin">
<h2>7. Client Responsibilities</h2>
<ul>
<li>Access to required platforms, accounts, and tools</li>
<li>Brand assets, copy, and content as requested</li>
<li>Timely review and feedback within 48–72 hours of delivery</li>
<li>A designated point of contact for approvals</li>
</ul>
<hr class="thin">
<h2>8. Revisions</h2>
<p><strong>Included:</strong> Up to <strong>${d.revisionRounds || '2'}</strong> rounds of revisions per deliverable are included in the quoted price.</p>
<p><strong>Additional:</strong> Revisions beyond the included rounds will be billed at <strong>${d.revisionRate ? '$' + d.revisionRate + '/hr' : '[rate TBD]'}</strong> or as agreed in a Change Order.</p>
<hr class="thin">
<h2>9. Intellectual Property &amp; Ownership</h2>
<ul>
<li>All deliverables become the property of Client upon receipt of full payment.</li>
<li>Until full payment is received, all work product remains the intellectual property of Chance Noonan.</li>
<li>Service Provider retains the right to reference this engagement in a professional portfolio unless Client requests otherwise in writing.</li>
<li>Third-party tools or assets incorporated into deliverables remain subject to their respective licenses.</li>
</ul>
<hr class="thin">
<h2>10. Termination</h2>
<ul>
<li>Either party may terminate this Agreement with 14 days written notice.</li>
<li>Client is responsible for payment of all work completed up to the termination date.</li>
<li>Deposits are non-refundable once work has commenced.</li>
<li>Service Provider reserves the right to terminate immediately if payment obligations are not met.</li>
</ul>
<hr class="thin">
<h2>11. Limitation of Liability</h2>
<p>Service Provider's total liability shall not exceed the total fees paid by Client in the 30 days preceding the event giving rise to the claim. Service Provider is not liable for indirect, incidental, or consequential damages.</p>
<hr class="thin">
<h2>12. Independent Contractor</h2>
<p>Chance Noonan is acting as an independent contractor. Nothing in this Agreement creates an employment, partnership, or agency relationship. Service Provider is solely responsible for applicable taxes on fees received.</p>
<div class="sig-section">
<hr class="thick">
<p style="text-align:center;font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;color:${NAVY};text-transform:uppercase;letter-spacing:.05em">Agreement &amp; Signatures</p>
<p style="text-align:center">By signing below, both parties agree to the terms outlined in this Scope of Work.</p>
<table class="st"><tr>
<td>
  <p style="font-family:Arial,sans-serif;font-size:8.5pt;color:#595959;font-weight:bold;text-transform:uppercase;margin:0 0 3pt">Service Provider</p>
  <div class="sl"></div>
  <p class="sn">Chance Noonan</p>
  <p class="si">Independent Freelance Consultant</p>
  <p class="date-line">Date: ___________________</p>
</td>
<td>
  <p style="font-family:Arial,sans-serif;font-size:8.5pt;color:#595959;font-weight:bold;text-transform:uppercase;margin:0 0 3pt">Client</p>
  <div class="sl"></div>
  <p class="sn">${blank(d.clientName)}</p>
  <p class="si">Title / Representative: ___________________</p>
  <p class="date-line">Date: ___________________</p>
</td>
</tr></table>
<p class="ft">Prepared by Chance Noonan for independent use. Does not constitute legal advice. Parties are encouraged to consult qualified legal counsel before execution.</p>
</div>
</body>
</html>`
}

// ── ORCACLUB SOW ───────────────────────────────────────────────────────────────

export function buildOrcaclubSowHtml(d: SowFormData): string {
  const dt = fmtDate(d.effectiveDate)
  const CYAN = '#67e8f9'

  const scopeItems = d.scopeItems.filter(i => i.trim()).map(i => `<li>${i}</li>`).join('')
  const mileRows = d.milestones.filter(m => m.name.trim()).map(m => {
    const mdt = m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    return `<tr><td style="padding:5pt 8pt;border-bottom:.5pt solid #eee">${m.name}</td><td style="padding:5pt 8pt;border-bottom:.5pt solid #eee">${mdt}</td><td style="padding:5pt 8pt;border-bottom:.5pt solid #eee">${m.notes || '—'}</td></tr>`
  }).join('')

  const pricingHtml = buildSowPricingSection(d, CYAN)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title></title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap');
@page{size:auto;margin:0mm}
*{print-color-adjust:exact;-webkit-print-color-adjust:exact}
body{font-family:Georgia,serif;font-size:11pt;line-height:1.65;color:#1a1a1a;margin:0;padding:0}
.page-wrap{margin:0;padding:1in}
.orca-hdr{background:#0D0D0D;margin:-1in -1in 24pt -1in;padding:20pt 1in;display:flex;justify-content:space-between;align-items:flex-end}
.orca-wordmark{font-family:'Cinzel Decorative','Cinzel',serif;font-size:20pt;font-weight:700;color:#ffffff;letter-spacing:.06em;line-height:1}
.orca-club{color:${CYAN}}
.orca-tag{font-size:7.5pt;color:${CYAN};text-transform:uppercase;letter-spacing:.12em;margin-top:4pt;font-family:Arial,sans-serif}
.orca-url{font-size:8pt;color:#666;font-style:italic;font-family:Arial,sans-serif}
h1{font-family:Arial,sans-serif;font-size:14pt;color:#1a1a1a;text-transform:uppercase;letter-spacing:.06em;text-align:center;margin-bottom:3pt}
.sub{font-family:Arial,sans-serif;font-size:9pt;color:#595959;font-style:italic;text-align:center;margin-bottom:10pt}
h2{font-family:Arial,sans-serif;font-size:10.5pt;color:#0D0D0D;text-transform:uppercase;letter-spacing:.04em;margin:16pt 0 5pt;padding-left:8pt;border-left:3pt solid ${CYAN}}
.thick{border:none;border-bottom:2px solid ${CYAN};margin:10pt 0}
.thin{border:none;border-bottom:1pt solid #e0e0e0;margin:10pt 0}
p{margin:5pt 0}ul{margin:5pt 0;padding-left:18pt}li{margin:3pt 0}
.it{width:100%;border-collapse:collapse;margin:7pt 0}
.it td{padding:5pt 8pt;font-size:10pt;border-bottom:.5pt solid #eee}
.it td:first-child{font-weight:bold;color:#333;font-family:Arial,sans-serif;font-size:8.5pt;text-transform:uppercase;width:28%;background:#f5f5f5}
.mt th{background:#f0f0f0;color:#333;font-family:Arial,sans-serif;font-size:9pt;padding:5pt 8pt;text-align:left}
.ob{background:#f9f9f9;border-left:3pt solid ${CYAN};padding:8pt 11pt;margin:7pt 0;min-height:30pt}
.st{width:100%;border-collapse:collapse;margin-top:14pt}
.st td{padding:7pt 10pt;vertical-align:top;width:50%}
.sl{border-top:1.5pt solid #999;margin-top:44pt}
.sn{font-weight:bold;font-size:11pt;margin-top:4pt}
.si{font-size:9pt;color:#595959}
.date-line{margin-top:14pt;font-size:10pt}
.ft{font-size:7.5pt;color:#aaa;font-style:italic;text-align:center;margin-top:20pt;padding-top:10pt;border-top:0.5pt solid #eee}
/* ── Pagination ── */
h1,h2,h3{page-break-after:avoid;break-after:avoid}
p{orphans:3;widows:3}
li{page-break-inside:avoid;break-inside:avoid}
.it,.mt,.ob{page-break-inside:avoid;break-inside:avoid}
table{page-break-inside:avoid;break-inside:avoid}
tr{page-break-inside:avoid;break-inside:avoid}
.st{page-break-inside:avoid;break-inside:avoid}
.sig-section{page-break-inside:avoid;break-inside:avoid;page-break-before:always;break-before:page}
</style>
</head>
<body>
<div class="page-wrap">
<div class="orca-hdr">
  <div>
    <div class="orca-wordmark">ORCA<span class="orca-club">CLUB</span></div>
    <div class="orca-tag">Technical Operations Development Studio</div>
  </div>
  <div class="orca-url">orcaclub.pro</div>
</div>
<h1>Scope of Work</h1>
<p class="sub">Technical Services Agreement</p>
<hr class="thick">
<h2>1. Parties</h2>
<table class="it">
<tr><td>Service Provider</td><td>ORCACLUB Technical Operations Development Studio${d.providerContact ? ' &nbsp;·&nbsp; ' + d.providerContact : ''}</td></tr>
<tr><td>Client</td><td>${blank(d.clientName)}${d.clientContact ? ' &nbsp;·&nbsp; ' + d.clientContact : ''}</td></tr>
<tr><td>Effective Date</td><td>${dt}</td></tr>
<tr><td>Project Name</td><td>${blank(d.projectName)}</td></tr>
</table>
<hr class="thin">
<h2>2. Project Overview</h2>
<div class="ob">${d.projectOverview || '<em style="color:#aaa">Not provided.</em>'}</div>
<hr class="thin">
<h2>3. Scope of Work</h2>
${scopeItems ? `<ul>${scopeItems}</ul>` : '<p style="color:#aaa;font-style:italic">No scope items defined.</p>'}
<p><strong>Out of Scope:</strong> Any work not explicitly listed above requires a written Change Order and may be subject to additional fees.</p>
<hr class="thin">
<h2>4. Timeline &amp; Milestones</h2>
${mileRows ? `<table style="width:100%;border-collapse:collapse;margin:7pt 0;font-size:10pt" class="mt"><tr><th>Milestone / Phase</th><th>Due Date</th><th>Notes</th></tr>${mileRows}</table>` : '<p style="color:#aaa;font-style:italic">No milestones defined.</p>'}
<p><strong>Timeline Note:</strong> Timelines are contingent on Client providing required materials, access, and feedback within 48 hours of request.</p>
<hr class="thin">
<h2>5. Pricing &amp; Payment</h2>
${pricingHtml}
<hr class="thin">
<h2>6. Payment Terms</h2>
<ul>
<li>Invoices are due within <strong>${d.netDays || '30'}</strong> days of issue.</li>
<li>A <strong>${d.depositPct || '50'}%</strong> deposit is required before work begins on project-based engagements.</li>
<li>Late payments are subject to a <strong>${d.lateFee || '1.5'}%</strong> monthly fee after the due date.</li>
<li>Work may be paused or withheld if an invoice remains unpaid beyond 14 days past due.</li>
</ul>
<hr class="thin">
<h2>7. Client Responsibilities</h2>
<ul>
<li>Access to required platforms, accounts, and tools</li>
<li>Brand assets, copy, and content as requested</li>
<li>Timely review and feedback within 48–72 hours of delivery</li>
<li>A designated point of contact for approvals and communications</li>
</ul>
<hr class="thin">
<h2>8. Revisions</h2>
<p><strong>Included:</strong> Up to <strong>${d.revisionRounds || '2'}</strong> rounds of revisions per deliverable are included in the quoted price.</p>
<p><strong>Additional:</strong> Revisions beyond the included rounds will be billed at <strong>${d.revisionRate ? '$' + d.revisionRate + '/hr' : '[rate TBD]'}</strong> or as agreed in a Change Order.</p>
<hr class="thin">
<h2>9. Intellectual Property &amp; Ownership</h2>
<ul>
<li>All deliverables become the property of Client upon receipt of full payment.</li>
<li>Until full payment is received, all work product remains the intellectual property of ORCACLUB.</li>
<li>ORCACLUB retains the right to reference this engagement in a professional portfolio unless Client requests otherwise in writing.</li>
<li>Third-party tools or assets incorporated into deliverables remain subject to their respective licenses.</li>
</ul>
<hr class="thin">
<h2>10. Termination</h2>
<ul>
<li>Either party may terminate this Agreement with 14 days written notice.</li>
<li>Client is responsible for payment of all work completed up to the termination date.</li>
<li>Deposits are non-refundable once work has commenced.</li>
</ul>
<hr class="thin">
<h2>11. Limitation of Liability</h2>
<p>ORCACLUB's total liability shall not exceed the total fees paid by Client in the 30 days preceding the event giving rise to the claim. ORCACLUB is not liable for indirect, incidental, or consequential damages.</p>
<hr class="thin">
<h2>12. Independent Contractor</h2>
<p>ORCACLUB is acting as an independent contractor. Nothing in this Agreement creates an employment, partnership, or agency relationship. ORCACLUB is solely responsible for applicable taxes on fees received.</p>
<div class="sig-section">
<hr class="thick">
<p style="text-align:center;font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;color:#1a1a1a;text-transform:uppercase;letter-spacing:.05em">Agreement &amp; Signatures</p>
<p style="text-align:center">By signing below, both parties agree to the terms outlined in this Scope of Work.</p>
<table class="st"><tr>
<td>
  <p style="font-family:Arial,sans-serif;font-size:8.5pt;color:#595959;font-weight:bold;text-transform:uppercase;margin:0 0 3pt">Service Provider</p>
  <div class="sl"></div>
  <p class="sn">ORCACLUB</p>
  <p class="si">Authorized Representative: ___________________</p>
  <p class="date-line">Date: ___________________</p>
</td>
<td>
  <p style="font-family:Arial,sans-serif;font-size:8.5pt;color:#595959;font-weight:bold;text-transform:uppercase;margin:0 0 3pt">Client</p>
  <div class="sl"></div>
  <p class="sn">${blank(d.clientName)}</p>
  <p class="si">Title / Representative: ___________________</p>
  <p class="date-line">Date: ___________________</p>
</td>
</tr></table>
<p class="ft">Prepared by ORCACLUB Technical Operations Development Studio · orcaclub.pro · Does not constitute legal advice. Parties are encouraged to consult qualified legal counsel before execution.</p>
</div>
</div>
</body>
</html>`
}
