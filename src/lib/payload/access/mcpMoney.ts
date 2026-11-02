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
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  CollectionSlug,
  FieldAccess,
  PayloadRequest,
} from 'payload'

const mcpStore = new AsyncLocalStorage<{ viaMcp: true }>()

/** Run `fn` (and every Payload call it makes) as an MCP request. */
export function runAsMcp<T>(fn: () => T): T {
  return mcpStore.run({ viaMcp: true }, fn)
}

/**
 * Run `fn` outside any MCP marker. Only for system bookkeeping that derives money
 * purely from values already stored, never from caller input — e.g. a retainer's
 * scheduled term change being promoted on read (`settleRetainer`). A request
 * authenticated by an MCP strategy or carrying `context.viaMcp` stays MCP; this
 * only lifts the AsyncLocalStorage marker for calls made with no user.
 */
export function runOutsideMcp<T>(fn: () => T): T {
  return mcpStore.exit(fn)
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

/** The 403 every money rejection uses; it names the fields. */
export function moneyError(slug: string, fields: string[], who: 'MCP requests' | 'non-admin users' = 'MCP requests'): APIError {
  return new APIError(
    `${slug}: money fields are read-only for ${who} (${fields.join(', ')}). ` +
      'Only an admin with a normal login can change prices, fees, status or Stripe fields.',
    403,
  )
}

/**
 * Overlay update data on the stored doc. Array rows in `data` that match a stored
 * row by id inherit the subfields they leave out: non-staff readers never see
 * some subfields (e.g. lineItems[].stripePriceId), and the restore hooks keep the
 * stored value, so an omitted subfield is not a change.
 */
function overlay(stored: Doc, data: Doc, spec: MoneySpec): Doc {
  const merged: Doc = { ...stored, ...data }
  for (const arr of Object.keys(spec.arrays ?? {})) {
    if (!Array.isArray(data[arr]) || !Array.isArray(stored[arr])) continue
    const byId = new Map((stored[arr] as Doc[]).filter((r) => r?.id != null).map((r) => [String(r.id), r]))
    merged[arr] = (data[arr] as Doc[]).map((row) => {
      const prev = row?.id != null ? byId.get(String(row.id)) : undefined
      return prev ? { ...prev, ...row } : row
    })
  }
  return merged
}

/**
 * beforeOperation: refuse, with a 403 that names the fields, any create/update
 * that would change a money field when the caller may not:
 * - an MCP-marked request (any access mode); or
 * - a non-admin caller on an access-checked call (`overrideAccess: false`: REST,
 *   GraphQL, admin panel), where field access would otherwise drop the fields
 *   silently and report success.
 * Trusted server code (`overrideAccess: true`, not MCP) is unaffected.
 * Unchanged money values (a full-document round-trip) pass.
 */
export function rejectDeniedMoneyWrites(
  slug: CollectionSlug,
  spec: MoneySpec,
  opts: { skipMcpCreate?: boolean } = {},
): CollectionBeforeOperationHook {
  return async ({ args, operation, req }) => {
    if (operation !== 'create' && operation !== 'update') return args
    const data = (args as { data?: unknown }).data
    if (!data || typeof data !== 'object' || Array.isArray(data)) return args

    const mcp = isMcpRequest(req)
    if (mcp && operation === 'create' && opts.skipMcpCreate) return args
    const accessChecked = (args as { overrideAccess?: boolean }).overrideAccess === false
    if (!mcp && (!accessChecked || req?.user?.role === 'admin')) return args
    const who = mcp ? 'MCP requests' : 'non-admin users'

    let changed: string[]
    if (operation === 'create') {
      changed = moneyOnCreate(data as Doc, spec)
    } else {
      const id = (args as { id?: unknown }).id
      if (id != null) {
        const stored = (await req.payload.db.findOne({ collection: slug, where: { id: { equals: id } }, req })) as Doc | null
        changed = moneyDiff(stored, overlay(stored ?? {}, data as Doc, spec), spec)
      } else {
        // Bulk update by `where`: no single original to compare, so any money
        // value in the data counts.
        changed = [...moneyProjection(data as Doc, spec).entries()]
          .filter(([path, v]) => v !== null || path.split(/[.[]/)[0]! in (data as Doc))
          .map(([path]) => path)
      }
    }
    if (changed.length > 0) throw moneyError(slug, changed, who)
    return args
  }
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
    if (changed.length > 0) throw moneyError(slug, changed)
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

export const SERVICE_ITEM_MONEY: MoneySpec = {
  fields: ['defaultPrice', 'defaultRate'],
}

/** Retainer time-entry snapshots of the terms in force when the hours were logged. */
export const TIME_ENTRY_MONEY: MoneySpec = {
  fields: ['overageRateAtLog', 'feeAtLog'],
}

/**
 * Time entries: an MCP `log_work` legitimately writes `overageRateAtLog` and
 * `feeAtLog` on create, but only as a snapshot of the retainer's stored terms
 * (current or pending). So under MCP a create may carry a snapshot only when it
 * equals one of those stored values; anything else, and any change on update,
 * is a 403.
 */
export const rejectMcpTimeEntryMoneyWrites: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data || !isMcpRequest(req)) return data

  if (operation !== 'create') {
    const changed = moneyDiff(originalDoc as Doc, { ...(originalDoc as Doc), ...data }, TIME_ENTRY_MONEY)
    if (changed.length > 0) throw moneyError('retainer-time-entries', changed)
    return data
  }

  const retainerId = typeof data.retainer === 'object' ? data.retainer?.id : data.retainer
  const retainer = retainerId
    ? ((await req.payload.db.findOne({
        collection: 'retainers',
        where: { id: { equals: retainerId } },
        req,
      })) as Doc | null)
    : null
  const allowed: Record<string, unknown[]> = {
    overageRateAtLog: [retainer?.overageRate ?? 65, retainer?.pendingOverageRate],
    feeAtLog: [retainer?.monthlyFee ?? 0, retainer?.pendingMonthlyFee],
  }
  const bad = Object.entries(allowed)
    .filter(([f, ok]) => !isEmpty(data[f]) && !ok.some((v) => !isEmpty(v) && Number(v) === Number(data[f])))
    .map(([f]) => f)
  if (bad.length > 0) throw moneyError('retainer-time-entries', bad)
  return data
}
