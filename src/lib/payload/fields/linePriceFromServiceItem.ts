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
 * - Price math lives in catalogLinePrice.ts: an hourly item with a locked
 *   `defaultRate` is priced rate × line `hours` (hours required, > 0); any
 *   other item takes its `defaultPrice`.
 * - Only new lines (no stored row with that id), lines whose
 *   `sourceServiceItem` changed, and hourly-rate lines whose `hours` changed
 *   are filled. A stored line keeps its price even if the catalog price later
 *   changes.
 * - Only an empty price is filled, so an admin's explicit price stands.
 * - A catalog-linked line never ends at $0: if a line would be filled but its
 *   service item is missing or has no positive `defaultPrice`, the write fails
 *   with a 400. Lines without `sourceServiceItem` are not touched here (staff
 *   and MCP cannot create them: see requireCatalogLines.ts).
 * - Runs after the MCP money guard, which judges the caller's input, not the
 *   server-filled value.
 */
import { APIError, type CollectionBeforeChangeHook } from 'payload'
import { isHourlyRateItem, priceCatalogLine, type CatalogItem } from './catalogLinePrice'

type Row = Record<string, unknown> & { id?: unknown; price?: unknown; hours?: unknown; sourceServiceItem?: unknown }

const idOf = (v: unknown): string | null =>
  v == null || v === '' ? null : typeof v === 'object' ? (String((v as { id?: unknown }).id ?? '') || null) : String(v)

const isEmptyPrice = (v: unknown) => v === undefined || v === null || v === ''

export const fillLinePriceFromServiceItem: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!data || !Array.isArray(data.lineItems)) return data

  const storedById = new Map<string, Row>()
  for (const row of (Array.isArray(originalDoc?.lineItems) ? originalDoc.lineItems : []) as Row[]) {
    if (row?.id != null) storedById.set(String(row.id), row)
  }

  const cache = new Map<string, CatalogItem | null>()
  const findItem = async (id: string): Promise<CatalogItem | null> => {
    if (cache.has(id)) return cache.get(id) ?? null
    let item: CatalogItem | null = null
    try {
      item = (await req.payload.db.findOne({
        collection: 'service-items',
        where: { id: { equals: id } },
        req,
      })) as CatalogItem | null
    } catch {
      item = null // malformed id: treat as not found
    }
    cache.set(id, item)
    return item
  }

  for (const row of data.lineItems as Row[]) {
    if (!row || typeof row !== 'object') continue
    const stored = row.id != null ? storedById.get(String(row.id)) : undefined
    const source = idOf('sourceServiceItem' in row ? row.sourceServiceItem : stored?.sourceServiceItem)
    if (!source) continue
    const isNew = !stored
    const sourceChanged = stored ? idOf(stored.sourceServiceItem) !== source : false
    const hours = 'hours' in row ? row.hours : stored?.hours
    const hoursChanged = stored ? (hours ?? null) !== (stored.hours ?? null) : false
    const label = typeof row.name === 'string' && row.name ? row.name : '(unnamed)'

    if (isNew || sourceChanged) {
      // An admin's explicit price stands.
      if (!isEmptyPrice(row.price)) continue
    } else if (hoursChanged) {
      // Same item, new hours: re-price an hourly-rate line unless an admin typed a new price.
      if (!isEmptyPrice(row.price) && row.price !== stored?.price) continue
    } else {
      continue
    }

    const item = await findItem(source)
    if (!item) {
      throw new APIError(`Line item '${label}': service item ${source} does not exist.`, 400, undefined, true)
    }
    if (!isNew && !sourceChanged && !isHourlyRateItem(item)) continue
    const priced = priceCatalogLine(item, hours, label, source)
    if (!priced.ok) throw new APIError(priced.error, 400, undefined, true)
    row.price = priced.price
    if (priced.hourly) row.billingType = 'hourly'
  }
  return data
}
