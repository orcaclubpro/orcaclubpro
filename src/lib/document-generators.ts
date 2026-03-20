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

export interface SowPaymentEntry {
  label: string
  pct: string
  note: string
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
  paymentSchedule: SowPaymentEntry[]
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
<h2>9. Portfolio &amp; Public Work</h2>
<ul>
<li>Service Provider may identify Client by name and display or reference any publicly published work product (including live websites, advertisements, social media content, and marketing materials) in Service Provider's portfolio, case studies, or promotional materials without prior written consent from Client.</li>
<li>The portfolio right established in this section applies only to work that is publicly visible and accessible; any non-public or confidential work remains subject to the confidentiality obligations of this Agreement.</li>
<li>Client may, at any time, submit a written request that Service Provider refrain from referencing Client's name or non-public project details in future promotional materials. Such a request is not retroactive and does not apply to publicly accessible work already in Service Provider's portfolio.</li>
</ul>
<hr class="thin">
<h2>10. Remedies</h2>
<p>Each Party acknowledges that a breach may cause irreparable harm and that the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.</p>
<hr class="thin">
<h2>11. General Provisions</h2>
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
<h2>7. Portfolio &amp; Public Work</h2>
<ul>
<li>ORCACLUB may identify Client by name and display or reference any publicly published work product (including live websites, advertisements, social media content, and marketing materials) in ORCACLUB's portfolio, case studies, or promotional materials without prior written consent from Client.</li>
<li>The portfolio right established in this section applies only to work that is publicly visible and accessible; any non-public or confidential work remains subject to the confidentiality obligations of this Agreement.</li>
<li>Client may, at any time, submit a written request that ORCACLUB refrain from referencing Client's name or non-public project details in future promotional materials. Such a request is not retroactive and does not apply to publicly accessible work already in ORCACLUB's portfolio.</li>
</ul>
<hr class="thin">
<h2>8. Remedies</h2>
<p>Each Party acknowledges that a breach may cause irreparable harm and that the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.</p>
<hr class="thin">
<h2>9. General Provisions</h2>
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

