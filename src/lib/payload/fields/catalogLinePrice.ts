/**
 * How a package line from the service catalog is priced. Shared by
 * `requireCatalogLines` (rejects bad lines before anything runs) and
 * `fillLinePriceFromServiceItem` (writes the price), so the two never disagree.
 *
 * - Hourly item with a locked `defaultRate` > 0: price = defaultRate × the
 *   line's `hours`, rounded to cents. `hours` is required and must be > 0.
 * - Any other item: price = its locked `defaultPrice`, which must be > 0.
 *   (An hourly item with no rate but a defaultPrice keeps this path.)
 *
 * The caller never supplies the number: price stays admin-only
 * (MONEY_FIELD_ACCESS) and is computed here on the server.
 */

/** The 400 for a staff/MCP line with no service item (Finn's ruling, Nov 2 2026). */
export const CUSTOM_LINE_BLOCKED = 'Price comes from the service item. Pick one, or ask Chance for a custom line.'

export type CatalogItem = { billingType?: unknown; defaultPrice?: unknown; defaultRate?: unknown }

const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0

/** True when the item is priced per hour from its locked rate. */
export function isHourlyRateItem(item: CatalogItem | null | undefined): boolean {
  return item?.billingType === 'hourly' && positive(item.defaultRate)
}

export type CatalogPrice =
  | { ok: true; price: number; hourly: boolean }
  | { ok: false; error: string }

/**
 * Price one line from its catalog item. `label` names the line and `id` the
 * service item in the error, so the caller knows what to fix.
 */
export function priceCatalogLine(
  item: CatalogItem,
  hours: unknown,
  label: string,
  id: string,
): CatalogPrice {
  if (isHourlyRateItem(item)) {
    if (!positive(hours)) {
      return {
        ok: false,
        error: `Line item '${label}': hourly service item ${id} needs hours greater than 0 (price = rate × hours).`,
      }
    }
    return { ok: true, price: Math.round((item.defaultRate as number) * hours * 100) / 100, hourly: true }
  }
  if (positive(item.defaultPrice)) return { ok: true, price: item.defaultPrice, hourly: false }
  return {
    ok: false,
    error:
      `Line item '${label}': service item ${id} has no locked price ` +
      '(needs a defaultPrice, or an hourly defaultRate, greater than 0).',
  }
}
