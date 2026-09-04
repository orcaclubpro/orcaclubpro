import type { SowFormData, SowScopeItem } from '@/lib/document-generators'

/**
 * The Scope of Work's standard text, as data.
 *
 * Every fixed paragraph in the agreement lives here instead of inside the PDF
 * builder. That buys two things: staff can override any clause's wording per
 * document (`clauseOverrides`) or drop a clause entirely (`clauseDisabled`),
 * and section numbers stay correct automatically because they are derived from
 * position rather than typed into the text.
 */

// ── Block model ────────────────────────────────────────────────────────────────

/** Tables and computed sections the PDF layer draws; never overridable as text. */
export type SowRenderKey =
  | 'partiesTable'
  | 'scopeTable'
  | 'deliverablesTable'
  | 'exclusionList'
  | 'milestoneTable'
  | 'pricing'
  | 'paymentTable'

export type SowBlock =
  | { t: 'body'; text: string }
  | { t: 'bullet'; text: string }
  /** Bold, auto-numbered sub-heading (13.2, 13.3 …). */
  | { t: 'sub'; text: string }
  /** Conspicuous all-caps text — used for the warranty disclaimer. */
  | { t: 'caps'; text: string }
  | { t: 'space'; h?: number }
  | { t: 'render'; key: SowRenderKey }

export interface SowClause {
  id: string
  heading: string
  /** Structural clauses the agreement cannot stand without — never disableable. */
  required?: boolean
  /** One-line explanation shown beside the clause in the editor. */
  note?: string
  blocks: (d: SowFormData) => SowBlock[]
}

// ── Value helpers ──────────────────────────────────────────────────────────────

const t = (v?: string | null) => (v ?? '').trim()

/** A dollar figure with the $ and thousands separator, or a fallback phrase. */
function money(v: string | undefined, fallback: string): string {
  const n = parseFloat(t(v).replace(/[^0-9.]/g, ''))
  if (!isFinite(n) || n <= 0) return fallback
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const num = (v: string | undefined, fallback: string) => t(v) || fallback

/** The provider's short name, matching how the PDF header brands the document. */
export function providerShortName(d: SowFormData): string {
  return t(d.providerName) || 'ORCACLUB'
}

/**
 * §8.2 and the bug-support overage both bill at this rate. Stating a number is
 * the point — "standard hourly rate" appears nowhere else in the agreement and
 * is unenforceable as written.
 */
export function hourlyRatePhrase(d: SowFormData): string {
  const rate = t(d.hourlyRate) || t(d.revisionRate)
  return rate
    ? `$${rate} per hour`
    : "Service Provider's standard hourly rate, as quoted in writing before the work begins"
}

/**
 * Read a scope / deliverables / exclusions list. Documents saved before these
 * carried descriptions hold plain strings, so both shapes are accepted and an
 * item with no title is dropped.
 */
export function normalizeSowItems(value: unknown): SowScopeItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map(entry => {
      if (typeof entry === 'string') return { title: entry.trim(), description: '' }
      const title = t((entry as SowScopeItem)?.title)
      const description = t((entry as SowScopeItem)?.description)
      return { title, description }
    })
    .filter(item => item.title.length > 0)
}

/** The out-of-scope exclusions. Negative-only definitions lose arguments. */
export const STANDARD_EXCLUSIONS: SowScopeItem[] = [
  { title: 'Hosting, domains, and infrastructure fees', description: 'Server, CDN, domain registration, and any recurring platform cost, contracted and paid by Client.' },
  { title: 'Third-party subscriptions, licenses, and API usage', description: 'Including per-seat software, paid fonts, stock media, and metered API calls.' },
  { title: 'Ongoing maintenance, monitoring, and patching', description: 'No uptime management, alerting, dependency updates, or incident response after handoff.' },
  { title: 'Security audits, penetration testing, and compliance certification', description: '' },
  { title: 'Accessibility (ADA / WCAG) auditing and remediation', description: 'No conformance level is promised, tested, or certified.' },
  { title: 'Search engine optimization, advertising, and content strategy', description: '' },
  { title: 'Copywriting, photography, video, and content creation', description: 'Client supplies all copy and media unless a line item says otherwise.' },
  { title: 'Data migration from existing systems', description: 'Beyond any migration explicitly listed as a deliverable.' },
  { title: 'Staff training and end-user support', description: 'Documentation is limited to handoff notes.' },
  { title: 'Legal, tax, accounting, or regulatory advice', description: '' },
]

/** The services performed. */
export function scopeItemsFor(d: SowFormData): SowScopeItem[] {
  return normalizeSowItems(d.scopeItems)
}

/** The artifacts handed over. Falls back to the scope when none are listed. */
export function deliverablesFor(d: SowFormData): SowScopeItem[] {
  const items = normalizeSowItems(d.deliverables)
  return items.length ? items : scopeItemsFor(d)
}

export function exclusionsFor(d: SowFormData): SowScopeItem[] {
  const custom = normalizeSowItems(d.exclusions)
  return custom.length ? custom : STANDARD_EXCLUSIONS
}

/**
 * §2 must never be blank — it is the first section a mediator reads to work out
 * what was agreed. When staff leave it empty, derive a plain-language overview
 * from the project name and scope items rather than printing "(Not provided.)".
 */
export function projectOverviewText(d: SowFormData): string {
  const written = t(d.projectOverview)
  if (written) return written

  const project = t(d.projectName) || 'the project described in this Agreement'
  const scope = scopeItemsFor(d).map(i => i.title)
  const client = t(d.clientName) || 'Client'

  if (scope.length === 0) {
    return `Service Provider will design, build, and deliver ${project} for ${client}, as further described in the Deliverables listed in this Agreement. The Deliverables in Section 3 define the complete extent of the engagement; anything not listed there is outside its scope.`
  }
  const list = scope.length === 1
    ? scope[0]
    : `${scope.slice(0, -1).join('; ')}; and ${scope[scope.length - 1]}`
  return `Service Provider will design, build, and deliver ${project} for ${client}. The engagement comprises: ${list}. The Deliverables listed in Section 3 define the complete extent of the work; anything not listed there is outside its scope and is handled through a written Change Order.`
}

/**
 * Every payment needs a stated trigger. A blank trigger lets the client argue
 * the balance is due whenever they decide the work is "finished", so derive one
 * from the entry's position when staff leave the note empty.
 */
export function paymentTriggerText(
  entry: { label: string; note: string },
  index: number,
  total: number,
): string {
  const note = t(entry.note)
  if (note) return note
  if (index === 0) return 'Due upon execution of this Agreement, before work begins'
  if (index === total - 1) return 'Due upon Acceptance or Deemed Acceptance of the final Deliverable'
  return 'Due upon completion of the corresponding milestone'
}

// ── The registry ───────────────────────────────────────────────────────────────

export const SOW_CLAUSES: SowClause[] = [
  {
    id: 'parties',
    heading: 'Parties and Project Identification',
    required: true,
    blocks: () => [{ t: 'render', key: 'partiesTable' }],
  },

  {
    id: 'overview',
    heading: 'Project Overview',
    required: true,
    note: 'Never left blank — derived from the project name and scope when unwritten.',
    blocks: d => [{ t: 'body', text: projectOverviewText(d) }],
  },

  {
    id: 'scope',
    heading: 'Scope of Work',
    required: true,
    note: 'The services performed. Edited as a list, with an optional description per line.',
    blocks: () => [
      { t: 'body', text: 'Service Provider shall perform the following services (the "Services"):' },
      { t: 'space', h: 4 },
      { t: 'render', key: 'scopeTable' },
    ],
  },

  {
    id: 'deliverables',
    heading: 'Deliverables',
    required: true,
    note: 'What is actually handed over. Separate from the Services, so acceptance has something concrete to attach to.',
    blocks: () => [
      { t: 'body', text: 'Service Provider shall deliver the following items (the "Deliverables"). Each is subject to the delivery and acceptance process set out in this Agreement:' },
      { t: 'space', h: 4 },
      { t: 'render', key: 'deliverablesTable' },
    ],
  },

  {
    id: 'outOfScope',
    heading: 'Out of Scope',
    required: true,
    note: 'The exclusion list. Defining out-of-scope only as "anything not listed" loses arguments.',
    blocks: () => [
      { t: 'body', text: 'Work not expressly listed in the Scope of Work or Deliverables is outside this Agreement. Without limiting that, the following are excluded and are the Client\'s responsibility unless added by written Change Order:' },
      // The exclusions are form data, not prose — rendered like a table so the
      // Out of Scope list stays their single editor even when this clause's
      // wording is overridden.
      { t: 'render', key: 'exclusionList' },
      { t: 'body', text: 'Any additional request is addressed through a written Change Order — outlining the work, timeline impact, and cost — agreed upon by both Parties before work begins.' },
    ],
  },

  {
    id: 'timeline',
    heading: 'Timeline and Milestones',
    required: true,
    note: 'Includes the stall clause — an unresponsive client cannot park an unpaid balance indefinitely.',
    blocks: d => [
      { t: 'render', key: 'milestoneTable' },
      { t: 'space', h: 4 },
      { t: 'body', text: "Timelines are contingent on both Parties' timely participation. When materials, access, or feedback are requested, a response within 48 hours keeps the project on track. If delays occur on either side, target dates adjust accordingly to protect the quality of the work." },
      { t: 'space', h: 4 },
      { t: 'sub', text: 'Client Inactivity' },
      {
        t: 'body',
        text: `If Client fails to provide materials, access, feedback, or approvals reasonably required to continue the work, and remains unresponsive for ${num(d.stallDays, '30')} consecutive days after written notice, the engagement is deemed complete as of that date: all Deliverables produced to that point are deemed accepted, all remaining fees under this Agreement become immediately due and payable, and Service Provider has no further obligation to perform. Resuming work after that point requires a written reactivation agreement and a reactivation fee of ${money(d.reactivationFee, '$500')}, plus any change in rates or availability.`,
      },
    ],
  },

  {
    id: 'fees',
    heading: 'Fees and Pricing',
    required: true,
    blocks: () => [{ t: 'render', key: 'pricing' }],
  },

  {
    id: 'payment',
    heading: 'Payment Terms and Schedule',
    required: true,
    blocks: d => [
      { t: 'render', key: 'paymentTable' },
      { t: 'bullet', text: `Invoices are due within ${num(d.netDays, '30')} days of the invoice date. Each invoice will be itemized and sent promptly upon the applicable milestone or billing period.` },
      { t: 'bullet', text: `Balances not settled by the due date may accrue a late fee of ${num(d.lateFee, '1.5')}% per month on the outstanding amount. Service Provider will notify Client before any fees are applied.` },
      { t: 'bullet', text: 'If an invoice remains materially past due, Service Provider may pause active work until the outstanding balance is resolved. Service Provider will communicate before taking this step.' },
      { t: 'bullet', text: 'Deposits and advance payments are non-refundable once work has commenced, as they represent resources and time already committed to the project.' },
      { t: 'bullet', text: 'All fees are exclusive of taxes and of any third-party costs described in this Agreement, which are billed at cost or paid directly by Client.' },
    ],
  },

  {
    id: 'clientResponsibilities',
    heading: 'Client Responsibilities',
    blocks: () => [
      { t: 'body', text: "Successful delivery depends on both Parties' active participation. Client agrees to:" },
      { t: 'bullet', text: 'Provide access to relevant platforms, accounts, tools, and credentials as reasonably required' },
      { t: 'bullet', text: 'Supply brand assets, copy, content, and supporting materials in a timely manner' },
      { t: 'bullet', text: 'Review deliverables and provide consolidated written feedback within 48–72 hours of delivery' },
      { t: 'bullet', text: 'Maintain a consistent point of contact with authority to approve decisions and communications' },
      { t: 'bullet', text: 'Communicate changes to project requirements, stakeholders, or direction as early as possible' },
      { t: 'body', text: 'If any of the above is delayed, both Parties will communicate promptly to assess the impact on timeline and scope.' },
    ],
  },

  {
    id: 'clientMaterials',
    heading: 'Client-Supplied Materials',
    note: 'The client warrants they own what they hand over — logos, copy, data, fonts.',
    blocks: () => [
      { t: 'body', text: 'Client represents and warrants that it owns, or holds all licenses and permissions necessary to use and to authorize Service Provider to use, every item of content, data, imagery, logo, trademark, font, code, or other material Client supplies or directs Service Provider to use ("Client Materials"), and that Service Provider\'s use of the Client Materials as contemplated by this Agreement will not infringe or misappropriate the rights of any third party or violate any law.' },
      { t: 'body', text: 'Client retains all right, title, and interest in the Client Materials and grants Service Provider a non-exclusive license to use them for the purpose of performing this Agreement. Service Provider has no obligation to verify ownership of, clear rights in, or investigate the provenance of any Client Materials.' },
    ],
  },

  {
    id: 'acceptance',
    heading: 'Delivery and Acceptance',
    note: 'Deemed acceptance — without it, nothing is ever formally "done" and the balance never comes due.',
    blocks: d => {
      const days = num(d.acceptanceDays, '7')
      return [
        { t: 'body', text: `Service Provider will notify Client in writing when a Deliverable is delivered. Client shall have ${days} days from delivery to review it and to provide a single, consolidated written notice describing any material failure to conform to the description of that Deliverable in this Agreement.` },
        { t: 'body', text: `If Client does not deliver such a notice within ${days} days, or uses the Deliverable in production, the Deliverable is deemed accepted ("Deemed Acceptance"). Upon Acceptance or Deemed Acceptance: the warranty period for that Deliverable begins, any payment tied to that Deliverable becomes due, and further changes are handled as revisions or a Change Order.` },
        { t: 'body', text: 'Where Client gives timely notice of a material nonconformity, Service Provider will correct it and re-deliver, and the review period begins again as to the corrected Deliverable. Cosmetic preferences, new requirements, and changes of direction are not nonconformities; they are revisions under this Agreement.' },
      ]
    },
  },

  {
    id: 'revisions',
    heading: 'Revisions and Change Orders',
    blocks: d => [
      { t: 'sub', text: 'Included Revisions' },
      { t: 'body', text: `This Agreement includes up to ${num(d.revisionRounds, '2')} round(s) of revisions per deliverable. A revision round consists of one consolidated set of feedback submitted after delivery. Batching feedback into a single round keeps the process efficient and well-documented for both Parties.` },
      { t: 'space', h: 4 },
      { t: 'sub', text: 'Additional Revisions' },
      { t: 'body', text: `Revisions beyond the included rounds, or requests that materially alter the original direction, are billed at ${hourlyRatePhrase(d)}. Service Provider will confirm the estimated cost before proceeding.` },
      { t: 'space', h: 4 },
      { t: 'sub', text: 'Change Orders' },
      { t: 'body', text: 'Requests for work outside the defined scope are handled through a written Change Order that details the additional work, timeline impact, and associated cost. Work on any change begins only after both Parties have agreed to the Change Order in writing.' },
    ],
  },

  {
    id: 'ip',
    heading: 'Intellectual Property and Ownership',
    required: true,
    note: 'Includes the open-source carve-out — third-party code cannot be assigned.',
    blocks: d => [
      { t: 'sub', text: 'Assignment of Deliverables' },
      { t: 'body', text: 'Upon receipt of full payment for all amounts due under this Agreement, Service Provider hereby assigns to Client all right, title, and interest in and to the Deliverables, including all applicable intellectual property rights therein. No assignment shall be deemed made until full payment is received.' },
      { t: 'space', h: 4 },
      { t: 'sub', text: 'Third-Party and Open-Source Components' },
      { t: 'body', text: 'The Deliverables incorporate third-party, open-source, and commercially licensed components that Service Provider did not author and cannot assign. Those components are licensed to Client directly by their respective licensors under their own terms, are excluded from the assignment above, and remain subject to their licenses. Client is responsible for complying with those licenses and for any fees they carry.' },
      { t: 'space', h: 4 },
      { t: 'sub', text: 'Background IP' },
      { t: 'body', text: 'Service Provider retains all right, title, and interest in and to any pre-existing tools, methodologies, code libraries, frameworks, processes, or know-how ("Background IP") used in performing the services. To the extent any Background IP is incorporated into the Deliverables, Service Provider grants Client a non-exclusive, royalty-free, perpetual license to use such Background IP solely as part of the Deliverables.' },
      { t: 'space', h: 4 },
      { t: 'sub', text: 'Portfolio Rights' },
      { t: 'body', text: `${providerShortName(d)} may identify Client by name and reference publicly visible Deliverables in ${providerShortName(d)}'s portfolio, case studies, and promotional materials. This right applies only to publicly accessible work; non-public Deliverables remain confidential. Client may request in writing that ${providerShortName(d)} cease future references to Client's name; such request is not retroactive.` },
    ],
  },

  {
    id: 'confidentiality',
    heading: 'Confidentiality',
    blocks: () => [
      { t: 'body', text: 'Each Party agrees to hold in confidence all non-public information disclosed by the other Party in connection with this Agreement ("Confidential Information"), using at least the same degree of care as it uses to protect its own confidential information. Neither Party shall disclose the other\'s Confidential Information to any third party without prior written consent, except as required by law. This obligation shall survive termination of this Agreement for a period of three (3) years. If the Parties have executed a separate Non-Disclosure Agreement, its terms shall govern and supplement this Section.' },
    ],
  },

  {
    id: 'warranty',
    heading: 'Warranty, Bug Support, and Disclaimer',
    required: true,
    note: 'Defines what counts as a bug, when the clock starts, and disclaims implied warranties.',
    blocks: d => {
      const days = num(d.warrantyDays, '30')
      const hours = t(d.bugSupportHours)
      const cap = hours
        ? `Bug support is limited to ${hours} hours in total; work beyond that, and work of any kind after the warranty period, is quoted and billed as new work at ${hourlyRatePhrase(d)}.`
        : `Work of any kind after the warranty period, and any request that is not a Bug, is quoted and billed as new work at ${hourlyRatePhrase(d)}.`
      return [
        { t: 'sub', text: 'Limited Warranty' },
        { t: 'body', text: `Service Provider warrants that each Deliverable will perform materially as described in this Agreement for ${days} days following Acceptance or Deemed Acceptance of that Deliverable. Service Provider will correct any failure to do so at no additional charge within that period, which is Client's sole and exclusive remedy under this warranty.` },
        { t: 'space', h: 4 },
        { t: 'sub', text: 'What Counts as a Bug' },
        { t: 'body', text: `A "Bug" means a reproducible failure of a Deliverable to perform materially as described in the Scope of Work section of this Agreement. The following are not Bugs: changes to requirements, preferences, or design direction; content or data errors; issues caused by Client's or a third party's modifications, configuration, or misuse; changes in or outages of third-party platforms, APIs, browsers, or hosting; and any request for functionality not described in this Agreement. ${cap}` },
        { t: 'body', text: `Where the Deliverables list includes a bug-support period, that period runs concurrently with — not in addition to — the ${days}-day warranty period and begins on Acceptance or Deemed Acceptance, unless this Agreement states otherwise in writing.` },
        { t: 'space', h: 4 },
        { t: 'sub', text: 'Disclaimer of Other Warranties' },
        { t: 'caps', text: 'EXCEPT FOR THE LIMITED WARRANTY EXPRESSLY STATED IN THIS SECTION, THE DELIVERABLES AND ALL SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTY OF ANY KIND. SERVICE PROVIDER DISCLAIMS ALL OTHER WARRANTIES, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. SERVICE PROVIDER DOES NOT WARRANT THAT THE DELIVERABLES WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR THAT THEY WILL MEET ANY REGULATORY, ACCESSIBILITY, OR CERTIFICATION STANDARD.' },
      ]
    },
  },

  {
    id: 'hosting',
    heading: 'Hosting, Third-Party Services, and Availability',
    note: 'No uptime guarantee, no monitoring, third-party accounts are the client\'s.',
    blocks: () => [
      { t: 'sub', text: 'Third-Party Services' },
      { t: 'body', text: 'Deliverables may depend on third-party services — including hosting, cloud infrastructure, domain registration, email, payment processing, analytics, and APIs. Except where this Agreement expressly says otherwise, those services are contracted in Client\'s own name, at Client\'s own cost, and are governed by those vendors\' terms. Client is responsible for maintaining those accounts and paying those fees.' },
      { t: 'space', h: 4 },
      { t: 'sub', text: 'No Availability Commitment' },
      { t: 'body', text: 'Service Provider does not guarantee uptime, availability, or performance, and does not monitor the Deliverables or any third-party service unless a separate written monitoring or maintenance agreement is in effect. Service Provider is not responsible for outages, degradation, data loss, deprecation, price changes, suspension, or termination caused by any third-party provider or by Client\'s own accounts.' },
      { t: 'space', h: 4 },
      { t: 'sub', text: 'Business Losses' },
      { t: 'body', text: 'Service Provider carries no insurance for, and accepts no responsibility for, Client\'s business interruption, lost revenue, or lost opportunity arising from downtime or third-party behavior. Client is responsible for arranging any insurance, redundancy, or service-level protection its business requires.' },
    ],
  },

  {
    id: 'dataSecurity',
    heading: 'Data, Security, and Backups',
    note: 'Personal data means CCPA exposure — this puts ownership and breach duties on the client.',
    blocks: () => [
      { t: 'body', text: 'As between the Parties, Client owns and controls all data processed or stored by the Deliverables, including any personal information of Client\'s employees, customers, or end users ("Client Data"). Client is the controller and business of record for that data.' },
      { t: 'bullet', text: 'Client is responsible for its own privacy policy, terms of service, cookie and consent notices, and for all disclosures and rights requests required by applicable privacy law, including the CCPA/CPRA' },
      { t: 'bullet', text: 'Client is responsible for determining what data may lawfully be collected, for obtaining any required consents, and for instructing Service Provider accordingly' },
      { t: 'bullet', text: 'Client is responsible for breach notification to regulators and affected individuals, and for maintaining its own backups and retention schedule' },
      { t: 'bullet', text: 'Service Provider will implement the security measures described in the Deliverables and will use reasonable care, but does not guarantee that any system is secure against compromise' },
      { t: 'body', text: 'Service Provider is not liable for any security incident, breach, or loss of data arising from third-party infrastructure or services, from Client\'s own accounts, credentials, or personnel, or from changes made to the Deliverables after Acceptance by anyone other than Service Provider.' },
    ],
  },

  {
    id: 'noOngoing',
    heading: 'No Ongoing Obligation',
    note: 'Says plainly what §Warranty only implies.',
    blocks: d => [
      { t: 'body', text: `After final delivery and expiry of the ${num(d.warrantyDays, '30')}-day warranty period, Service Provider has no obligation to host, monitor, patch, update, secure, back up, respond to incidents, provide support, or maintain the Deliverables or any related system in any way. Any such work requires a separate written agreement and is quoted as new work. Nothing in this Agreement creates a retainer, service level, response time, or support commitment unless expressly stated in it.` },
    ],
  },

  {
    id: 'indemnification',
    heading: 'Indemnification',
    required: true,
    note: 'The client pushes back claims arising from their data, content, and end users.',
    blocks: () => [
      { t: 'body', text: 'Client shall defend, indemnify, and hold harmless Service Provider and its owners, employees, and subcontractors from and against any claim, demand, action, proceeding, loss, liability, damage, fine, penalty, cost, and expense (including reasonable attorneys\' fees) arising out of or relating to:' },
      { t: 'bullet', text: 'The Client Materials, including any claim that they infringe or misappropriate a third party\'s intellectual property, publicity, or privacy rights' },
      { t: 'bullet', text: 'Client Data and Client\'s collection, use, storage, disclosure, or retention of it, including any privacy, data-protection, or consumer-protection claim' },
      { t: 'bullet', text: 'Client\'s use, operation, modification, resale, or commercialization of the Deliverables after delivery' },
      { t: 'bullet', text: 'Claims brought by Client\'s customers, users, employees, or other end users of the Deliverables' },
      { t: 'bullet', text: 'Client\'s breach of this Agreement, and Client\'s violation of any law or regulation, including accessibility, advertising, licensing, and industry-specific requirements' },
      { t: 'body', text: 'Service Provider shall defend and indemnify Client against any third-party claim that a Deliverable authored solely by Service Provider, used as delivered and in accordance with this Agreement, infringes a United States copyright, subject to the limitation of liability in this Agreement. This does not apply to Client Materials, third-party or open-source components, or any modification made by anyone other than Service Provider.' },
      { t: 'body', text: 'The Party seeking indemnity shall give prompt written notice of the claim, allow the indemnifying Party to control the defense, and provide reasonable cooperation at the indemnifying Party\'s expense. No settlement imposing an obligation on the indemnified Party may be made without its consent.' },
    ],
  },

  {
    id: 'termination',
    heading: 'Termination',
    blocks: () => [
      { t: 'body', text: 'Either Party may terminate this Agreement with 14 days\' written notice. Upon termination:' },
      { t: 'bullet', text: 'Client is responsible for payment of all work completed and expenses incurred through the termination date, billed on a pro-rata basis' },
      { t: 'bullet', text: 'Deposits and payments applied to work already underway are non-refundable' },
      { t: 'bullet', text: 'Service Provider will deliver all completed Deliverables and meaningful work-in-progress upon receipt of final payment' },
      { t: 'bullet', text: 'Client shall, within 14 days, assume or replace any third-party account, hosting environment, domain, or subscription opened in Service Provider\'s name for the project, at Client\'s cost; if Client does not, Service Provider may cancel it without liability for the resulting loss of service or data' },
      { t: 'bullet', text: 'Service Provider will return or destroy Client\'s credentials and, upon written request made within 30 days, provide a copy of Client Data in its possession; after that window Service Provider may delete it and has no obligation to retain copies' },
      { t: 'bullet', text: 'Partially completed infrastructure and deployments are delivered as-is, in whatever state they are in at the termination date, with no obligation to complete, migrate, or decommission them' },
      { t: 'body', text: 'Both Parties are encouraged to raise concerns in writing early, so that issues can be addressed before termination becomes necessary.' },
    ],
  },

  {
    id: 'liability',
    heading: 'Limitation of Liability',
    required: true,
    note: 'Cap is total fees paid under this agreement with a floor — a rolling 3-month formula reads as $0 on a one-off.',
    blocks: d => [
      { t: 'body', text: 'Neither Party shall be liable to the other for indirect, incidental, special, punitive, or consequential damages — including lost revenue, lost profits, lost data, business interruption, or loss of business opportunity — arising from or related to this Agreement, even if advised of the possibility of such damages.' },
      { t: 'body', text: `Service Provider's total aggregate liability arising out of or related to this Agreement, whether in contract, tort, or otherwise, shall not exceed the greater of (a) the total fees actually paid by Client to Service Provider under this Agreement, or (b) ${money(d.liabilityFloor, '$1,000')}. These limitations reflect a reasonable and negotiated allocation of risk, apply regardless of the form of action, and survive any failure of essential purpose of a limited remedy. They do not limit liability for fraud, willful misconduct, or any liability that cannot be limited by law.` },
    ],
  },

  {
    id: 'independentContractor',
    heading: 'Independent Contractor, Subcontractors, and Tooling',
    blocks: d => [
      { t: 'body', text: `${providerShortName(d)} performs services under this Agreement as an independent contractor, not as an employee or agent of Client. Service Provider is solely responsible for its own taxes, benefits, and business obligations. Service Provider may engage with other clients during this Agreement, provided those engagements do not interfere with the commitments made herein.` },
      { t: 'body', text: 'Service Provider may perform the services through employees, subcontractors, and automated or AI-assisted tooling of its choosing, and remains responsible for the Deliverables regardless of how they are produced. Client is engaging Service Provider as a firm, not any particular individual.' },
    ],
  },

  {
    id: 'general',
    heading: 'General Provisions',
    required: true,
    blocks: d => {
      const county = t(d.venueCounty) || 'Orange County'
      const provider = t(d.providerContact) || 'the address stated in Section 1'
      const client = t(d.clientContact) || 'the address stated in Section 1'
      return [
        { t: 'body', text: `Governing Law, Venue, and Fees. This Agreement is governed by the laws of the State of California, without regard to its conflict-of-law rules. The Parties consent to exclusive jurisdiction and venue in the state and federal courts located in ${county}, California. In any action to enforce or interpret this Agreement, the prevailing Party is entitled to recover its reasonable attorneys' fees, expert fees, and costs.` },
        { t: 'space', h: 4 },
        { t: 'body', text: `Notices. Notices under this Agreement must be in writing and are effective when sent by email with confirmation of delivery, to Service Provider at ${provider} and to Client at ${client}, or to any other address a Party designates in writing. Email constitutes written notice for every purpose under this Agreement, including notices of termination, acceptance, and inactivity.` },
        { t: 'space', h: 4 },
        { t: 'body', text: 'Survival. The following survive expiration or termination of this Agreement: accrued payment obligations; intellectual property and ownership; confidentiality; warranty disclaimers; hosting, availability, and data provisions; indemnification; limitation of liability; and these General Provisions.' },
        { t: 'space', h: 4 },
        { t: 'body', text: 'Assignment. Neither Party may assign this Agreement, in whole or in part, without the other Party\'s prior written consent, which shall not be unreasonably withheld; any attempted assignment without consent is void. Service Provider may use subcontractors as described in this Agreement without such consent.' },
        { t: 'space', h: 4 },
        { t: 'body', text: 'Entire Agreement. This document, together with any executed Change Orders, constitutes the complete agreement between the Parties for this engagement and supersedes any prior discussions or informal understandings on the same subject.' },
        { t: 'space', h: 4 },
        { t: 'body', text: 'Severability and Amendments. If any provision of this Agreement is found unenforceable, it shall be enforced to the maximum extent permitted and the remaining terms continue in full effect. Any provision may be amended only by written agreement signed by both Parties.' },
        { t: 'space', h: 4 },
        { t: 'body', text: 'Force Majeure. Neither Party is liable for delays caused by circumstances outside their reasonable control. In such cases, both Parties will communicate promptly and agree on a reasonable path forward.' },
        { t: 'space', h: 4 },
        { t: 'body', text: 'Electronic Signatures. Signatures obtained electronically are valid and enforceable under the ESIGN Act and applicable state law, with the same legal effect as original ink signatures.' },
      ]
    },
  },
]

export const SOW_CLAUSE_BY_ID: Record<string, SowClause> = Object.fromEntries(
  SOW_CLAUSES.map(c => [c.id, c]),
)

// ── Overrides ──────────────────────────────────────────────────────────────────

/** Is this clause part of the document as configured? */
export function isClauseEnabled(clause: SowClause, d: SowFormData): boolean {
  if (clause.required) return true
  return !(d.clauseDisabled ?? []).includes(clause.id)
}

/** Has staff replaced this clause's standard wording? */
export function isClauseOverridden(clause: SowClause, d: SowFormData): boolean {
  return Boolean((d.clauseOverrides ?? {})[clause.id]?.trim())
}

/** One override paragraph → a block. "- " marks a bullet, "## " a sub-heading. */
function paragraphToBlock(p: string): SowBlock {
  const line = p.trim()
  if (line.startsWith('## ')) return { t: 'sub', text: line.slice(3).trim() }
  if (/^[-•]\s+/.test(line)) return { t: 'bullet', text: line.replace(/^[-•]\s+/, '') }
  return { t: 'body', text: line }
}

/**
 * The blocks a clause actually renders. An override replaces every text block
 * with the staff-written paragraphs, inserted where the first text block was —
 * `render` blocks (tables, the pricing section) always stay, because their
 * content is computed from the form rather than written.
 */
export function clauseBlocks(clause: SowClause, d: SowFormData): SowBlock[] {
  const standard = clause.blocks(d)
  const override = (d.clauseOverrides ?? {})[clause.id]
  if (!override?.trim()) return standard

  const written = override
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(paragraphToBlock)

  const out: SowBlock[] = []
  let inserted = false
  for (const b of standard) {
    if (b.t === 'render') { out.push(b); continue }
    if (!inserted) { out.push(...written); inserted = true }
  }
  if (!inserted) out.push(...written)
  return out
}

/**
 * The standard wording as editable plain text — what the editor shows and what
 * it seeds the textarea with. Round-trips through `paragraphToBlock`.
 */
export function clauseStandardText(clause: SowClause, d: SowFormData): string {
  return clause
    .blocks(d)
    .map(b => {
      switch (b.t) {
        case 'body':
        case 'caps': return b.text
        case 'bullet': return `- ${b.text}`
        case 'sub': return `## ${b.text}`
        default: return null
      }
    })
    .filter(Boolean)
    .join('\n\n')
}

/** Does this clause draw a table or computed section the editor cannot change? */
export function clauseHasRenderBlocks(clause: SowClause, d: SowFormData): boolean {
  return clause.blocks(d).some(b => b.t === 'render')
}

/** The clauses that make up the document, in order, with their section numbers. */
export function resolveSowClauses(d: SowFormData): Array<{ n: number; clause: SowClause }> {
  return SOW_CLAUSES
    .filter(c => isClauseEnabled(c, d))
    .map((clause, i) => ({ n: i + 1, clause }))
}
