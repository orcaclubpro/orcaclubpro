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
 * has a locked price (see catalogLinePrice.ts): a positive `defaultPrice`, or
 * for an hourly item a positive `defaultRate` plus line `hours` > 0. A line with
 * no service item gets CUSTOM_LINE_BLOCKED. A stored hourly-rate line whose
 * `hours` changed is re-checked (it will be re-priced). Other stored, unchanged
 * lines are never re-validated, so legacy custom lines survive a round-trip.
 *
 * Runs as beforeOperation because `overrideAccess` is only visible there. The
 * price itself is then filled server-side by `fillLinePriceFromServiceItem`.
 */
import { APIError } from 'payload'
import type { CollectionBeforeOperationHook, PayloadRequest } from 'payload'
import { isMcpRequest } from '../access/mcpMoney'
import { CUSTOM_LINE_BLOCKED, isHourlyRateItem, priceCatalogLine, type CatalogItem } from './catalogLinePrice'

type Row = Record<string, unknown> & { id?: unknown; name?: unknown; sourceServiceItem?: unknown; hours?: unknown }

const idOf = (v: unknown): string | null =>
  v == null || v === '' ? null : typeof v === 'object' ? (String((v as { id?: unknown }).id ?? '') || null) : String(v)

const lineName = (name: unknown) => (typeof name === 'string' && name ? name : '(unnamed)')

/** The 400s, one per reason, so the caller knows what to fix. */
const noServiceItem = () => new APIError(CUSTOM_LINE_BLOCKED, 400)
const serviceItemNotFound = (name: unknown, id: string) =>
  new APIError(`Line item '${lineName(name)}': service item ${id} not found.`, 400)

async function findServiceItem(req: PayloadRequest, id: string): Promise<CatalogItem | null> {
  try {
    return (await req.payload.db.findOne({
      collection: 'service-items',
      where: { id: { equals: id } },
      req,
    })) as CatalogItem | null
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

  const itemCache = new Map<string, CatalogItem | null>()
  const lookup = async (id: string) => {
    if (!itemCache.has(id)) itemCache.set(id, await findServiceItem(req, id))
    return itemCache.get(id) ?? null
  }

  for (const row of lineItems as Row[]) {
    if (!row || typeof row !== 'object') continue
    const stored = row.id != null ? storedById.get(String(row.id)) : undefined
    if (stored) {
      // An omitted subfield keeps its stored value, so it is not a change.
      const sourceChanged = 'sourceServiceItem' in row && idOf(row.sourceServiceItem) !== idOf(stored.sourceServiceItem)
      const hoursChanged = 'hours' in row && (row.hours ?? null) !== (stored.hours ?? null)
      if (!sourceChanged && !hoursChanged) continue
      if (!sourceChanged) {
        // Same item, new hours: only an hourly-rate line is re-priced, so only it is re-checked.
        const source = idOf(stored.sourceServiceItem)
        const item = source ? await lookup(source) : null
        if (!source || !item || !isHourlyRateItem(item)) continue
        const priced = priceCatalogLine(item, row.hours, lineName(row.name ?? stored.name), source)
        if (!priced.ok) throw new APIError(priced.error, 400)
        continue
      }
    }

    const source = idOf(row.sourceServiceItem)
    if (!source) throw noServiceItem()
    const item = await lookup(source)
    if (!item) throw serviceItemNotFound(row.name, source)
    const hours = 'hours' in row ? row.hours : stored?.hours
    const priced = priceCatalogLine(item, hours, lineName(row.name), source)
    if (!priced.ok) throw new APIError(priced.error, 400)
  }
  return args
}
