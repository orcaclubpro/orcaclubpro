/**
 * Write guard for MCP tools: the shared MCP account is read-only on prices,
 * Stripe ids, and payment links.
 *
 * This is the tool-layer half. Payload itself also refuses money writes from
 * MCP-marked requests (src/lib/payload/access/mcpMoney.ts), so a tool that slips
 * past this file still cannot change a price.
 *
 * Checks, applied before any write tool reaches its action:
 *
 * 1. Field allowlist. Every write tool declares the exact input keys it accepts
 *    (`WRITE_TOOL_FIELDS`). Any other key is rejected rather than silently dropped,
 *    so a bot learns a price field is off-limits instead of believing it saved.
 * 2. Money key scan. Any key, at any depth, that is a real money field name
 *    (`MONEY_KEYS`) or a `stripe…` field is rejected. That includes inside
 *    `save_sow.sowData`, apart from the SOW's own money fields.
 * 2b. Chance-only key scan. Any key, at any depth, in `CHANCE_ONLY_KEYS` (the
 *    approved-hours budget) is rejected: only Chance sets it, in the portal.
 * 3. SOW money diff + carry-forward (`prepareSowSave`). `save_sow` round-trips a
 *    whole document that legitimately contains the prices `get_sow_draft` gave
 *    it. Those may come back unchanged or be left out (then the stored value is
 *    kept); any change is rejected.
 *
 * Billing stays out of MCP: Stripe is the source of prices (plan step 5).
 */

/** Keys every write tool accepts in addition to its own fields. */
const COMMON_WRITE_FIELDS = ['actor'] as const

/**
 * The input keys each MCP write tool accepts. A tool not listed here is treated
 * as read-only and gets no actor or audit row.
 */
export const WRITE_TOOL_FIELDS: Record<string, readonly string[]> = {
  save_recap_draft: ['clientAccountId', 'ref', 'recap'],
  log_work: ['retainerId', 'clientAccountId', 'date', 'hours', 'category', 'priority', 'description'],
  create_draft_entry: ['retainerId', 'clientAccountId', 'date', 'description', 'category', 'priority', 'hours'],
  update_time_entry: ['id', 'date', 'hours', 'category', 'priority', 'completion', 'description'],
  create_package: ['name', 'description', 'coverMessage', 'notes', 'lineItems'],
  save_sow: ['packageId', 'sowData'],
  // No budget/currency: a project's budget is set by a human in the portal.
  project_create: ['name', 'description', 'clientAccountId', 'startDate', 'projectedEndDate'],
  create_milestone: ['projectId', 'title', 'date', 'description'],
  update_milestone: ['projectId', 'milestoneIndex', 'title', 'date', 'description', 'completed'],
  toggle_milestone: ['projectId', 'milestoneIndex'],
  task_create: [
    'title',
    'description',
    'packageId',
    'projectId',
    'clientAccountId',
    'status',
    'priority',
    'dueDate',
    'ownerBot',
    'ccqTaskId',
    'qa',
    'actualHours',
  ],
  task_update: [
    'id',
    'title',
    'description',
    'packageId',
    'projectId',
    'clientAccountId',
    'status',
    'priority',
    'dueDate',
    'ownerBot',
    'ccqTaskId',
    'qa',
    'actualHours',
  ],
}

export const isWriteTool = (tool: string): boolean => Object.hasOwn(WRITE_TOOL_FIELDS, tool)

/**
 * Exact key names that carry money or billing identity: the real money fields of
 * Packages, Retainers, Orders, ClientAccounts and the SOW. Any `stripe…` field
 * also counts (every one is a Stripe id, URL or config). Generic words such as
 * total, cost, budget or rate are deliberately NOT matched: they are not stored
 * money fields, and blocking them rejects harmless input. `hours` is work, not
 * price.
 */
export const MONEY_KEYS: ReadonlySet<string> = new Set([
  // packages
  'price',
  'adjustedPrice',
  'hourlyRate',
  'amount',
  'orderId',
  'invoicedAt',
  // retainers
  'monthlyFee',
  'overageRate',
  'proposedMonthlyFee',
  'proposedOverageRate',
  'pendingMonthlyFee',
  'pendingOverageRate',
  // orders / client accounts
  'balanceSnapshot',
  'accountBalance',
  'paymentLink',
  'paymentLinkUrl',
  'paymentConfigId',
  'defaultPaymentConfig',
  // service items / time-entry snapshots
  'defaultPrice',
  'defaultRate',
  'overageRateAtLog',
  'feeAtLog',
  // SOW money terms
  'revisionRate',
  'lateFee',
  'reactivationFee',
  'liabilityFloor',
])

export const isMoneyKey = (key: string): boolean => MONEY_KEYS.has(key) || /^stripe[A-Z_]/.test(key)

/**
 * Keys inside `save_sow.sowData` that legitimately carry money because the SOW
 * shape holds them. They are excluded from the key scan; `prepareSowSave`
 * rejects any change to them and keeps the stored value when they are omitted.
 */
export const SOW_MONEY_FIELDS = [
  'pricingType',
  'projectItems',
  'retainerItems',
  'paymentSchedule',
  'billingCycle',
  'netDays',
  'hourlyRate',
  'revisionRate',
  'lateFee',
  'reactivationFee',
  'liabilityFloor',
] as const

/** SOW clauses whose wording states fees, payment terms, rates or the liability cap. */
export const SOW_MONEY_CLAUSES = ['fees', 'payment', 'revisions', 'liability'] as const

/**
 * Keys only Chance (the business owner) may set. No MCP write may carry them, at
 * any depth, whoever the caller is: a bot reads the approved hours, it never
 * approves them.
 */
export const CHANCE_ONLY_KEYS: ReadonlySet<string> = new Set([
  'approvedHours',
  'approvedHoursAt',
  'approvedHoursNote',
])

/** Every key path in `value` whose key is Chance-only. */
export function findChanceOnlyKeys(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => findChanceOnlyKeys(v, `${path}[${i}]`))
  if (!value || typeof value !== 'object') return []
  const hits: string[] = []
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const here = path ? `${path}.${key}` : key
    if (CHANCE_ONLY_KEYS.has(key)) hits.push(here)
    hits.push(...findChanceOnlyKeys(child, here))
  }
  return hits
}

export type GuardResult = { ok: true } | { ok: false; error: string }

/** Every key path in `value` whose key is a money field. */
export function findMoneyKeys(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => findMoneyKeys(v, `${path}[${i}]`))
  if (!value || typeof value !== 'object') return []
  const hits: string[] = []
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const here = path ? `${path}.${key}` : key
    if (isMoneyKey(key)) hits.push(here)
    hits.push(...findMoneyKeys(child, here))
  }
  return hits
}

type SowRecord = Record<string, unknown>

/** sowData minus the SOW's own money fields and clause controls (diffed separately). */
function sowScanView(sow: SowRecord): SowRecord {
  const skip = new Set<string>([...SOW_MONEY_FIELDS, 'clauseOverrides', 'clauseDisabled'])
  return Object.fromEntries(Object.entries(sow).filter(([k]) => !skip.has(k)))
}

/**
 * Check a write tool's raw input against its allowlist and the money scan.
 * Returns a readable rejection the bot can act on.
 */
export function checkWriteInput(tool: string, input: unknown): GuardResult {
  const allowed = WRITE_TOOL_FIELDS[tool]
  if (!allowed) return { ok: false, error: `${tool} is not an allowlisted MCP write tool` }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: `${tool}: input must be an object` }
  }

  const record = input as Record<string, unknown>
  const accepted = new Set<string>([...COMMON_WRITE_FIELDS, ...allowed])
  // Before the allowlist message, so the bot learns why rather than "not allowed".
  const chanceOnly = findChanceOnlyKeys(record)
  if (chanceOnly.length > 0) {
    return {
      ok: false,
      error:
        `${tool}: approved hours are set by Chance only and are read-only over MCP (${chanceOnly.join(', ')}). ` +
        'Read them with get_project_progress; ask Chance to change them.',
    }
  }

  const unknown = Object.keys(record).filter((k) => !accepted.has(k))
  if (unknown.length > 0) {
    return { ok: false, error: `${tool}: field(s) not allowed via MCP: ${unknown.join(', ')}` }
  }

  const scanned =
    tool === 'save_sow' && record.sowData && typeof record.sowData === 'object' && !Array.isArray(record.sowData)
      ? { ...record, sowData: sowScanView(record.sowData as SowRecord) }
      : record
  const money = findMoneyKeys(scanned)
  if (money.length > 0) {
    return {
      ok: false,
      error:
        `${tool}: price/Stripe/payment fields are read-only over MCP (${money.join(', ')}). ` +
        'Prices are set by an admin in the portal; Stripe is the source.',
    }
  }
  return { ok: true }
}

/** Stable JSON for value comparison (key order independent, undefined ignored). */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

const overridesOf = (sow: SowRecord) => (sow.clauseOverrides ?? {}) as Record<string, string>
const disabledOf = (sow: SowRecord) => (Array.isArray(sow.clauseDisabled) ? (sow.clauseDisabled as string[]) : [])

/**
 * Validate and complete a `save_sow` document against the current draft
 * (`get_sow_draft`). `save_sow` is a whole-document replace, so:
 *
 * - a money field, or money clause wording/on-off, that is **present** must equal
 *   the current value, or the save is rejected;
 * - one that is **omitted** keeps its current value. Leaving a field out must
 *   never reset a rate or fee to the template default;
 * - any other money key anywhere in sowData is rejected (the key scan).
 */
export function prepareSowSave(
  current: SowRecord,
  incoming: SowRecord,
): { ok: true; sowData: SowRecord } | { ok: false; error: string } {
  const stray = findMoneyKeys(sowScanView(incoming), 'sowData')
  if (stray.length > 0) {
    return { ok: false, error: `save_sow: money fields are read-only over MCP (${stray.join(', ')})` }
  }

  const changed: string[] = SOW_MONEY_FIELDS.filter(
    (f) => f in incoming && stable(incoming[f]) !== stable(current[f]),
  )
  if ('clauseOverrides' in incoming) {
    for (const id of SOW_MONEY_CLAUSES) {
      if ((overridesOf(incoming)[id] ?? null) !== (overridesOf(current)[id] ?? null)) {
        changed.push(`clauseOverrides.${id}`)
      }
    }
  }
  if ('clauseDisabled' in incoming) {
    for (const id of SOW_MONEY_CLAUSES) {
      if (disabledOf(incoming).includes(id) !== disabledOf(current).includes(id)) changed.push(`clauseDisabled.${id}`)
    }
  }
  if (changed.length > 0) {
    return {
      ok: false,
      error:
        `save_sow: price/payment fields are read-only over MCP and were changed: ${changed.join(', ')}. ` +
        'Send them back exactly as get_sow_draft returned them, or leave them out.',
    }
  }

  // Keep every omitted money value from the current document.
  const sowData: SowRecord = { ...incoming }
  for (const f of SOW_MONEY_FIELDS) {
    if (!(f in incoming) && f in current) sowData[f] = current[f]
  }
  const overrides: Record<string, string> = { ...overridesOf(incoming) }
  for (const id of SOW_MONEY_CLAUSES) {
    const stored = overridesOf(current)[id]
    if (stored !== undefined) overrides[id] = stored
    else delete overrides[id]
  }
  if ('clauseOverrides' in incoming || 'clauseOverrides' in current) sowData.clauseOverrides = overrides
  const moneyClauses: readonly string[] = SOW_MONEY_CLAUSES
  const disabled = [
    ...disabledOf(incoming).filter((id) => !moneyClauses.includes(id)),
    ...disabledOf(current).filter((id) => moneyClauses.includes(id)),
  ]
  if ('clauseDisabled' in incoming || 'clauseDisabled' in current) sowData.clauseDisabled = disabled

  return { ok: true, sowData }
}
