/**
 * Write guard for MCP tools: the shared MCP account is read-only on prices,
 * Stripe ids, and payment links.
 *
 * Three checks, applied before any write tool reaches its action:
 *
 * 1. Field allowlist. Every write tool declares the exact input keys it accepts
 *    (`WRITE_TOOL_FIELDS`). Any other key is rejected rather than silently dropped,
 *    so a bot learns that a price field is off-limits instead of believing it
 *    was saved.
 * 2. Money/Stripe key scan. Any key anywhere in the input whose name looks like
 *    price, Stripe, payment link, amount, rate, or fee is rejected, even inside
 *    free-form records. This is the backstop if an allowlist entry is ever widened
 *    by mistake.
 * 3. SOW money diff. `save_sow` round-trips a whole document that legitimately
 *    contains prices it was given by `get_sow_draft`. Those values may come back
 *    unchanged; any change to a money field is rejected (`sowMoneyChanges`).
 *
 * Billing stays out of MCP: Stripe is the source of prices (plan step 5).
 */

/** Keys every write tool accepts in addition to its own fields. */
const COMMON_WRITE_FIELDS = ['actor'] as const

/**
 * The input keys each MCP write tool accepts. A tool not listed here is treated
 * as read-only by `run`, and is not given an actor or an audit row.
 */
export const WRITE_TOOL_FIELDS: Record<string, readonly string[]> = {
  save_recap_draft: ['clientAccountId', 'ref', 'recap'],
  log_work: ['retainerId', 'clientAccountId', 'date', 'hours', 'category', 'priority', 'description'],
  create_draft_entry: ['retainerId', 'clientAccountId', 'date', 'description', 'category', 'priority', 'hours'],
  update_time_entry: ['id', 'date', 'hours', 'category', 'priority', 'completion', 'description'],
  create_package: ['name', 'description', 'coverMessage', 'notes', 'lineItems'],
  save_sow: ['packageId', 'sowData'],
  create_milestone: ['projectId', 'title', 'date', 'description'],
  update_milestone: ['projectId', 'milestoneIndex', 'title', 'date', 'description', 'completed'],
  toggle_milestone: ['projectId', 'milestoneIndex'],
}

export const isWriteTool = (tool: string): boolean => Object.hasOwn(WRITE_TOOL_FIELDS, tool)

/**
 * Key names that carry money or billing identity. Matched case-insensitively
 * against every key at every depth. `hours` is deliberately absent: hours are
 * work, not price, and the actions own the cap math.
 */
const MONEY_KEY =
  /(price|stripe|payment_?link|paymentlink|payment_?config|amount|rate$|^rate|fee$|^fee|invoice|cost|budget|total|balance|discount)/i

/**
 * Keys inside `save_sow.sowData` that are allowed to carry money because the SOW
 * shape itself holds them. They are not rejected by the key scan; instead
 * `sowMoneyChanges` rejects any change to their values.
 */
export const SOW_MONEY_FIELDS = [
  'pricingType',
  'projectItems',
  'retainerItems',
  'paymentSchedule',
  'billingCycle',
  'hourlyRate',
  'revisionRate',
  'lateFee',
  'reactivationFee',
  'liabilityFloor',
] as const

/** Keys whose subtree is exempt from the key scan (checked by value diff instead). */
const SCAN_EXEMPT: Record<string, readonly string[]> = {
  save_sow: ['sowData'],
}

export type GuardResult = { ok: true } | { ok: false; error: string }

/** Every key path in `value` whose key name looks like money/Stripe. */
export function findMoneyKeys(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => findMoneyKeys(v, `${path}[${i}]`))
  if (!value || typeof value !== 'object') return []
  const hits: string[] = []
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const here = path ? `${path}.${key}` : key
    if (MONEY_KEY.test(key)) hits.push(here)
    hits.push(...findMoneyKeys(child, here))
  }
  return hits
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
  const unknown = Object.keys(record).filter((k) => !accepted.has(k))
  if (unknown.length > 0) {
    return { ok: false, error: `${tool}: field(s) not allowed via MCP: ${unknown.join(', ')}` }
  }

  const exempt = new Set(SCAN_EXEMPT[tool] ?? [])
  const scanned = Object.fromEntries(Object.entries(record).filter(([k]) => !exempt.has(k)))
  const money = findMoneyKeys(scanned)
  if (money.length > 0) {
    return {
      ok: false,
      error:
        `${tool}: price/Stripe/payment fields are read-only over MCP (${money.join(', ')}). ` +
        'Prices are set by staff in the portal; Stripe is the source.',
    }
  }
  return { ok: true }
}

/** Stable JSON for value comparison (key order independent). */
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

/**
 * SOW money fields whose value in `incoming` differs from `current` (the draft
 * `get_sow_draft` returns). A field missing from `incoming` is not a change
 * here: the package-owned ones are re-derived from the package on every read.
 * Other money keys anywhere in sowData that are not SOW fields are reported too.
 */
export function sowMoneyChanges(current: Record<string, unknown>, incoming: Record<string, unknown>): string[] {
  const changed: string[] = SOW_MONEY_FIELDS.filter(
    (f) => f in incoming && stable(incoming[f]) !== stable(current[f]),
  )
  const known = new Set<string>(SOW_MONEY_FIELDS)
  const stray = findMoneyKeys(
    Object.fromEntries(Object.entries(incoming).filter(([k]) => !known.has(k))),
  ).filter((p) => !(p in current))
  return [...changed, ...stray]
}
