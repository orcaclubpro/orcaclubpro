// ── Document form data ─────────────────────────────────────────────────────────
// Shapes only. Every generated document is built in `pdf-generators.ts`, and
// these interfaces are what a saved `files.documentData` holds — so a field
// added here must stay optional, or documents saved before it existed stop
// regenerating.


export interface NdaFormData {
  effectiveDate: string
  clientName: string
  clientType: 'individual' | 'company'
  clientAddress: string

  // ── Party detail ───────────────────────────────────────────────────────────
  // All optional so NDAs saved before these existed still render — every
  // builder falls back to the standing default rather than printing a blank.

  /**
   * The Client's legal description, e.g. "a Delaware corporation" or "a
   * California limited liability company". Falls back to the bare
   * company/individual wording derived from `clientType`.
   */
  clientEntity?: string
  /** Who signs for the Client. Prints under the Client signature line. */
  clientSignerName?: string
  clientSignerTitle?: string
  /** Client notice address for Section "Notices". */
  clientEmail?: string
  /**
   * Service Provider's legal description — the entity actually bound by the
   * agreement, e.g. "a California limited liability company" or "a sole
   * proprietorship of Chance Noonan doing business as ORCACLUB".
   */
  providerEntity?: string
  /** Service Provider notice address. Default carbon@orcaclub.pro. */
  providerEmail?: string

  // ── Terms with a stated number ─────────────────────────────────────────────

  /** Length of the confidentiality term, in years. Default 3. */
  termYears?: string
  /** Hours to notify the other Party of a security incident. Default 72. */
  breachNoticeHours?: string
  /** Days to hand back access and purge credentials after the work ends. Default 10. */
  offboardDays?: string
  /** Governing law. Default California. */
  governingState?: string
  /** County named for venue. Default Orange. */
  venueCounty?: string

  // ── Optional sections ──────────────────────────────────────────────────────
  // Undefined means "on" for everything except `includeNonSolicit`, so a
  // document saved before the sections existed regenerates with them.

  /** Access to systems, accounts, and assets. The credential-handling promises. */
  includeAccessSection?: boolean
  /** Personal-data handling — the CCPA/CPRA service-provider undertakings. */
  includePersonalData?: boolean
  /** No Confidential Information into public/consumer AI tools. */
  includeAiClause?: boolean
  /** DTSA §1833(b) whistleblower-immunity notice. Off = forfeits fees/exemplary damages. */
  includeDtsaNotice?: boolean
  /** Mutual no-poach of each other's personnel. Off by default — narrow in California. */
  includeNonSolicit?: boolean
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
  /**
   * Exact dollar amount for this installment. Set when the schedule comes from
   * a package, where the amounts are authoritative — the document then prints
   * these rather than recomputing them from `pct`, which rounds.
   */
  amount?: string
}

/**
 * One line of the scope, the deliverables, or the exclusions: a short title with
 * an optional sentence expanding it. Both print on the contract.
 *
 * Documents saved before this existed hold plain strings in these fields; read
 * them through `normalizeSowItems` rather than trusting the type.
 */
export interface SowScopeItem {
  title: string
  description?: string
}

export interface SowFormData {
  providerName: string
  providerContact: string
  clientName: string
  clientContact: string
  effectiveDate: string
  projectName: string
  projectOverview: string
  /** The services performed. */
  scopeItems: SowScopeItem[]
  /** The artifacts handed over. Absent on documents saved before the split. */
  deliverables?: SowScopeItem[]
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

  // ── Terms with a stated number ────────────────────────────────────────────
  // All optional so documents saved before these existed still render — the
  // clause registry substitutes the default wording when they are absent.

  /** Stated hourly rate for extra revisions and post-warranty work. */
  hourlyRate?: string
  /** Length of the express warranty, in days. Default 30. */
  warrantyDays?: string
  /** Optional cap on free bug-support hours. Blank = no separate allowance. */
  bugSupportHours?: string
  /** Review window before a Deliverable is deemed accepted. Default 7. */
  acceptanceDays?: string
  /** Days of Client silence before the project is deemed complete. Default 30. */
  stallDays?: string
  /** Fee to restart a project deemed complete for inactivity. Default 500. */
  reactivationFee?: string
  /** Floor on the liability cap, so it never resolves to $0. Default 1000. */
  liabilityFloor?: string
  /** County named for venue in General Provisions. Default Orange County. */
  venueCounty?: string
  /** Explicit out-of-scope list. Empty = the standard exclusions. */
  exclusions?: SowScopeItem[]

  // ── Standard-text control ─────────────────────────────────────────────────

  /** clause id → replacement wording for that clause. */
  clauseOverrides?: Record<string, string>
  /** clause ids switched off for this document (required clauses ignore this). */
  clauseDisabled?: string[]
}
