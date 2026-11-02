/**
 * A package line item added from the service catalog takes its price from that
 * service item's locked `defaultPrice`, filled in here on the server.
 *
 * Staff still cannot set `price` themselves: the field stays admin-only
 * (MONEY_FIELD_ACCESS) and a non-admin write carrying a price is a 403
 * (rejectDeniedMoneyWrites). This hook only copies an already-locked catalog
 * price, so a role-`user` staff member can add catalog lines without being
 * able to choose the number.
 *
 * Rules:
 * - Only new lines (no stored row with that id), or lines whose
 *   `sourceServiceItem` changed, are filled. A stored line keeps its price even
 *   if the catalog price later changes.
 * - Only an empty price is filled, so an admin's explicit price stands.
 * - A catalog-linked line never ends at $0: if a line would be filled but its
 *   service item is missing or has no positive `defaultPrice`, the write fails
 *   with a 400. Lines without `sourceServiceItem` are not touched (MCP
 *   `create_package` makes those at $0 on purpose for staff to price).
 * - Runs after the MCP money guard, which judges the caller's input, not the
 *   server-filled value.
 */
import { APIError, type CollectionBeforeChangeHook } from 'payload'

type Row = Record<string, unknown> & { id?: unknown; price?: unknown; sourceServiceItem?: unknown }

const idOf = (v: unknown): string | null =>
  v == null || v === '' ? null : typeof v === 'object' ? (String((v as { id?: unknown }).id ?? '') || null) : String(v)

const isEmptyPrice = (v: unknown) => v === undefined || v === null || v === ''

export const fillLinePriceFromServiceItem: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!data || !Array.isArray(data.lineItems)) return data

  const storedById = new Map<string, Row>()
  for (const row of (Array.isArray(originalDoc?.lineItems) ? originalDoc.lineItems : []) as Row[]) {
    if (row?.id != null) storedById.set(String(row.id), row)
  }

  type Lookup = { found: false } | { found: true; price: number | null }
  const cache = new Map<string, Lookup>()
  const catalogPrice = async (id: string): Promise<Lookup> => {
    const hit = cache.get(id)
    if (hit) return hit
    let item: { defaultPrice?: unknown } | null = null
    try {
      item = (await req.payload.db.findOne({
        collection: 'service-items',
        where: { id: { equals: id } },
        req,
      })) as { defaultPrice?: unknown } | null
    } catch {
      item = null // malformed id: treat as not found
    }
    const result: Lookup = item
      ? { found: true, price: typeof item.defaultPrice === 'number' ? item.defaultPrice : null }
      : { found: false }
    cache.set(id, result)
    return result
  }

  for (const row of data.lineItems as Row[]) {
    const source = idOf(row?.sourceServiceItem)
    if (!source || !isEmptyPrice(row.price)) continue
    const stored = row.id != null ? storedById.get(String(row.id)) : undefined
    const isNew = !stored
    const sourceChanged = stored ? idOf(stored.sourceServiceItem) !== source : false
    if (!isNew && !sourceChanged) continue
    const lookup = await catalogPrice(source)
    const label = typeof row.name === 'string' && row.name ? `"${row.name}"` : '(unnamed)'
    if (!lookup.found) {
      throw new APIError(`Line item ${label}: service item ${source} does not exist.`, 400, undefined, true)
    }
    if (lookup.price == null || !Number.isFinite(lookup.price) || lookup.price <= 0) {
      throw new APIError(
        `Line item ${label}: catalog item ${source} has no price set (defaultPrice must be greater than 0).`,
        400,
        undefined,
        true,
      )
    }
    row.price = lookup.price
  }
  return data
}
