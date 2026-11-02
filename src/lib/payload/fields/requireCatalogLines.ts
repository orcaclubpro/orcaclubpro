/**
 * Staff and MCP callers may only add package line items from the service
 * catalog, and only from a catalog item with a set price.
 *
 * Who is checked ("staff/MCP caller"):
 * - an MCP-marked request (`isMcpRequest`), in any access mode; or
 * - an access-checked call (`overrideAccess: false`) by a non-admin user
 *   (role `user`): REST, GraphQL, the admin panel.
 * Admins on a normal login and trusted server code (`overrideAccess: true`,
 * not MCP) are not affected.
 *
 * What is checked: a line that is NEW (no stored row with that id), or whose
 * `sourceServiceItem` changed, must link a `sourceServiceItem` that exists and
 * has a positive `defaultPrice`. An hourly item with only `defaultRate` does not
 * qualify. Stored, unchanged lines are never re-validated, so legacy custom
 * lines survive a round-trip.
 *
 * Runs as beforeOperation because `overrideAccess` is only visible there. The
 * price itself is then filled server-side by `fillLinePriceFromServiceItem`.
 */
import { APIError } from 'payload'
import type { CollectionBeforeOperationHook, PayloadRequest } from 'payload'
import { isMcpRequest } from '../access/mcpMoney'

type Row = Record<string, unknown> & { id?: unknown; name?: unknown; sourceServiceItem?: unknown }

const idOf = (v: unknown): string | null =>
  v == null || v === '' ? null : typeof v === 'object' ? (String((v as { id?: unknown }).id ?? '') || null) : String(v)

const lineName = (name: unknown) => (typeof name === 'string' && name ? name : '(unnamed)')

/** The 400s, one per reason, so the caller knows what to fix. */
const noServiceItem = (name: unknown) =>
  new APIError(
    `Line item '${lineName(name)}' needs a service item with a fixed defaultPrice; ` +
      'freeform lines are not allowed for staff or MCP.',
    400,
  )
const noDefaultPrice = (name: unknown, id: string) =>
  new APIError(
    `Line item '${lineName(name)}' needs a service item with a fixed defaultPrice; ` +
      `hourly/freeform lines are not allowed for staff or MCP (service item ${id} has no defaultPrice).`,
    400,
  )
const serviceItemNotFound = (name: unknown, id: string) =>
  new APIError(`Line item '${lineName(name)}': service item ${id} not found.`, 400)

async function findServiceItem(req: PayloadRequest, id: string): Promise<{ defaultPrice?: unknown } | null> {
  try {
    return (await req.payload.db.findOne({
      collection: 'service-items',
      where: { id: { equals: id } },
      req,
    })) as { defaultPrice?: unknown } | null
  } catch {
    // A malformed id is the same as a missing item.
    return null
  }
}

export const requireCatalogLines: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return args
  const data = (args as { data?: unknown }).data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return args
  const lineItems = (data as { lineItems?: unknown }).lineItems
  if (!Array.isArray(lineItems) || lineItems.length === 0) return args

  const mcp = isMcpRequest(req)
  const accessChecked = (args as { overrideAccess?: boolean }).overrideAccess === false
  const nonAdminStaff = accessChecked && req?.user?.role !== 'admin'
  if (!mcp && !nonAdminStaff) return args

  // Stored rows, by id. A bulk update by `where` has no single original, so
  // every row it carries is checked as new.
  const storedById = new Map<string, Row>()
  if (operation === 'update') {
    const id = (args as { id?: unknown }).id
    if (id != null) {
      const stored = (await req.payload.db.findOne({
        collection: 'packages',
        where: { id: { equals: id } },
        req,
      })) as { lineItems?: unknown } | null
      for (const row of (Array.isArray(stored?.lineItems) ? stored.lineItems : []) as Row[]) {
        if (row?.id != null) storedById.set(String(row.id), row)
      }
    }
  }

  const priceCache = new Map<string, { defaultPrice?: unknown } | null>()
  for (const row of lineItems as Row[]) {
    if (!row || typeof row !== 'object') continue
    const stored = row.id != null ? storedById.get(String(row.id)) : undefined
    if (stored) {
      // An omitted subfield keeps its stored value, so it is not a change.
      if (!('sourceServiceItem' in row)) continue
      if (idOf(row.sourceServiceItem) === idOf(stored.sourceServiceItem)) continue
    }

    const source = idOf(row.sourceServiceItem)
    if (!source) throw noServiceItem(row.name)
    if (!priceCache.has(source)) priceCache.set(source, await findServiceItem(req, source))
    const item = priceCache.get(source)
    if (!item) throw serviceItemNotFound(row.name, source)
    if (!(typeof item.defaultPrice === 'number' && item.defaultPrice > 0)) {
      throw noDefaultPrice(row.name, source)
    }
  }
  return args
}
