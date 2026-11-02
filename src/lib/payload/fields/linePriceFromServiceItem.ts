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
 * - Runs after the MCP money guard, which judges the caller's input, not the
 *   server-filled value.
 */
import type { CollectionBeforeChangeHook } from 'payload'

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

  const cache = new Map<string, number | null>()
  const catalogPrice = async (id: string): Promise<number | null> => {
    if (!cache.has(id)) {
      const item = (await req.payload.db.findOne({
        collection: 'service-items',
        where: { id: { equals: id } },
        req,
      })) as { defaultPrice?: unknown } | null
      const price = typeof item?.defaultPrice === 'number' ? item.defaultPrice : null
      cache.set(id, price)
    }
    return cache.get(id) ?? null
  }

  for (const row of data.lineItems as Row[]) {
    const source = idOf(row?.sourceServiceItem)
    if (!source || !isEmptyPrice(row.price)) continue
    const stored = row.id != null ? storedById.get(String(row.id)) : undefined
    const isNew = !stored
    const sourceChanged = stored ? idOf(stored.sourceServiceItem) !== source : false
    if (!isNew && !sourceChanged) continue
    const price = await catalogPrice(source)
    if (price != null) row.price = price
  }
  return data
}
