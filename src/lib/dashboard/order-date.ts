/**
 * One place for "what date is this order?" and "what order do orders go in?".
 *
 * An order carries two dates: `createdAt`, the untouched record of when the row was
 * written, and `issuedAt`, a staff-set override for backdating an invoice into the
 * month its work belongs to. Everything user-facing — display, month grouping,
 * sorting, and period revenue — reads the effective date through here, so setting an
 * override moves the order everywhere at once instead of only where someone
 * remembered to check the field.
 *
 * Deliberately free of UI imports so server loaders can use it too.
 */

export interface DatedOrder {
  /** Staff-set effective date. Wins over createdAt wherever an order is dated. */
  issuedAt?: string | null
  createdAt?: string | null
}

/** The date this order should be shown, grouped, sorted, and counted under. */
export const orderDate = (order: DatedOrder): string => order.issuedAt || order.createdAt || ''

/** Effective date as a timestamp. Unparseable or missing dates sort as epoch 0. */
export function orderTime(order: DatedOrder): number {
  const t = new Date(orderDate(order)).getTime()
  return Number.isFinite(t) ? t : 0
}

/** Newest effective date first — how every order list reads. */
export const byOrderDateDesc = (a: DatedOrder, b: DatedOrder) => orderTime(b) - orderTime(a)

/** Oldest effective date first. */
export const byOrderDateAsc = (a: DatedOrder, b: DatedOrder) => orderTime(a) - orderTime(b)

/**
 * Copy of `orders` in effective-date order.
 *
 * Every order query sorts by `-createdAt` at the database, because Mongo cannot fall
 * back to `createdAt` when `issuedAt` is unset — a `sort: '-issuedAt'` would bunch
 * every order without an override at one end. So the query stays a coarse fetch and
 * the real ordering happens here, once, in the loader. Call it on the way out of any
 * order fetch whose results get rendered as a list.
 */
export function sortByOrderDate<T extends DatedOrder>(orders: T[], direction: 'desc' | 'asc' = 'desc'): T[] {
  return [...orders].sort(direction === 'desc' ? byOrderDateDesc : byOrderDateAsc)
}
