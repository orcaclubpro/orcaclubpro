/**
 * Money fields are read-only for MCP requests, at the Payload level.
 *
 * The MCP tool layer (src/lib/mcp/writeGuard.ts) already rejects price/Stripe
 * input, but that only covers the tool surface. This file makes Payload itself
 * refuse the write, so a new tool, a future action, or a hook running inside an
 * MCP request cannot change money either.
 *
 * ── Marking an MCP request ──────────────────────────────────────────────────
 * The MCP tools call server actions, and those call the Local API without a
 * `user` or `context`. So the marker travels on an AsyncLocalStorage that the
 * MCP route and every tool run inside (`runAsMcp`). A request also counts as MCP
 * when:
 * - `req.context.viaMcp === true` (explicit, for direct Local API calls); or
 * - the user was authenticated by the OAuth bearer or API-key strategy. Those
 *   credentials exist for MCP clients and scripts. Chance's OAuth token resolves
 *   to his admin user, so the role alone cannot tell "Chance in the browser"
 *   from "a bot on Chance's token".
 *
 * ── Two layers ───────────────────────────────────────────────────────────────
 * 1. `moneyFieldAccess` (field access, create/update): only `role: admin` with a
 *    normal (browser/session) login. It binds REST, GraphQL, the admin panel and
 *    any `overrideAccess: false` call. On an update, Payload drops a denied field
 *    silently.
 * 2. `rejectMcpMoneyWrites` (collection beforeChange): field access is skipped
 *    under `overrideAccess: true`, which every server action uses. So this hook
 *    throws (403) on any MCP-marked write that changes a money field, whatever
 *    the access mode. Non-MCP server code is unaffected.
 */
import { AsyncLocalStorage } from 'node:async_hooks'
import { APIError } from 'payload'
import type { CollectionBeforeChangeHook, FieldAccess, PayloadRequest } from 'payload'

const mcpStore = new AsyncLocalStorage<{ viaMcp: true }>()

/** Run `fn` (and every Payload call it makes) as an MCP request. */
export function runAsMcp<T>(fn: () => T): T {
  return mcpStore.run({ viaMcp: true }, fn)
}

/** Auth strategies whose callers are MCP clients or scripts, never a browser login. */
const MCP_STRATEGIES = new Set(['oauth-access-token', 'api-key'])

export function isMcpRequest(req: Partial<PayloadRequest> | null | undefined): boolean {
  if (mcpStore.getStore()?.viaMcp) return true
  if ((req?.context as Record<string, unknown> | undefined)?.viaMcp === true) return true
  const strategy = (req?.user as { _strategy?: unknown } | null | undefined)?._strategy
  return typeof strategy === 'string' && MCP_STRATEGIES.has(strategy)
}

/** Field access for money fields: admin role, normal login, not MCP. */
export const moneyFieldAccess: FieldAccess = ({ req }) => req?.user?.role === 'admin' && !isMcpRequest(req)

/** Field-level `access` block for a money field. */
export const MONEY_FIELD_ACCESS = { create: moneyFieldAccess, update: moneyFieldAccess } as const

// ── Value comparison ──────────────────────────────────────────────────────────

export interface MoneySpec {
  /** Top-level money fields. */
  fields: readonly string[]
  /** Array fields → the money subfields of each row. Rows are matched by `id`. */
  arrays?: Record<string, readonly string[]>
  /** Group fields → the money subfields inside. */
  groups?: Record<string, readonly string[]>
  /** Values a money field may take on an MCP create (e.g. `status: 'draft'`). */
  createDefaults?: Record<string, unknown>
}

/** Empty money: unset, blank, or zero. */
const isEmpty = (v: unknown) => v === undefined || v === null || v === '' || v === 0

const norm = (v: unknown) => (isEmpty(v) ? null : typeof v === 'object' ? JSON.stringify(v) : String(v))

type Doc = Record<string, any>

/** Every money path → normalised value. Array rows are keyed by row id (or index). */
export function moneyProjection(doc: Doc | null | undefined, spec: MoneySpec): Map<string, string | null> {
  const out = new Map<string, string | null>()
  if (!doc) return out
  for (const f of spec.fields) out.set(f, norm(doc[f]))
  for (const [group, subs] of Object.entries(spec.groups ?? {})) {
    for (const s of subs) out.set(`${group}.${s}`, norm(doc[group]?.[s]))
  }
  for (const [arr, subs] of Object.entries(spec.arrays ?? {})) {
    const rows: Doc[] = Array.isArray(doc[arr]) ? doc[arr] : []
    rows.forEach((row, i) => {
      const key = row?.id ? String(row.id) : `#${i}`
      for (const s of subs) {
        const v = norm(row?.[s])
        if (v !== null) out.set(`${arr}[${key}].${s}`, v)
      }
    })
  }
  return out
}

/**
 * Money paths that differ between `before` and `after`. A path missing on one
 * side counts as empty, so adding a priced row or removing one is a change.
 */
export function moneyDiff(before: Doc | null | undefined, after: Doc, spec: MoneySpec): string[] {
  const a = moneyProjection(before, spec)
  const b = moneyProjection(after, spec)
  const keys = new Set([...a.keys(), ...b.keys()])
  return [...keys].filter((k) => (a.get(k) ?? null) !== (b.get(k) ?? null)).sort()
}

/** Money fields an MCP create sets beyond empty or the allowed defaults. */
export function moneyOnCreate(data: Doc, spec: MoneySpec): string[] {
  const defaults = spec.createDefaults ?? {}
  const baseline: Doc = { ...defaults }
  return moneyDiff(baseline, { ...defaults, ...data }, spec)
}

/**
 * beforeChange: throw 403 when an MCP-marked request changes a money field.
 * Update data is partial at the top level, so it is overlaid on the original.
 */
export function rejectMcpMoneyWrites(slug: string, spec: MoneySpec): CollectionBeforeChangeHook {
  return ({ data, operation, originalDoc, req }) => {
    if (!data || !isMcpRequest(req)) return data
    const changed =
      operation === 'create'
        ? moneyOnCreate(data, spec)
        : moneyDiff(originalDoc as Doc, { ...(originalDoc as Doc), ...data }, spec)
    if (changed.length > 0) {
      throw new APIError(
        `${slug}: money fields are read-only for MCP requests (${changed.join(', ')}). ` +
          'Only an admin with a normal login can change prices, fees, status or Stripe fields.',
        403,
      )
    }
    return data
  }
}

// ── Per-collection money specs ────────────────────────────────────────────────

export const PACKAGE_MONEY: MoneySpec = {
  fields: ['hourlyRate', 'status'],
  arrays: {
    lineItems: ['price', 'adjustedPrice', 'stripePriceId'],
    paymentSchedule: ['amount', 'orderId', 'invoicedAt'],
  },
  createDefaults: { status: 'draft' },
}

export const RETAINER_MONEY: MoneySpec = {
  fields: [
    'monthlyFee',
    'overageRate',
    'proposedMonthlyFee',
    'proposedOverageRate',
    'pendingMonthlyFee',
    'pendingOverageRate',
  ],
}

export const ORDER_MONEY: MoneySpec = {
  fields: [
    'amount',
    'status',
    'balanceSnapshot',
    'stripeInvoiceId',
    'stripeInvoiceUrl',
    'stripeCustomerId',
    'stripePaymentIntentId',
    'stripePaymentConfig',
    'stripePaymentConfigName',
  ],
  arrays: { lineItems: ['price', 'stripePriceId'] },
}

export const CLIENT_ACCOUNT_MONEY: MoneySpec = {
  fields: ['stripeCustomerId'],
}
