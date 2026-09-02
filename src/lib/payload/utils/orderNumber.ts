import type { getPayload } from 'payload'

/**
 * Legacy INV-NNNN generator. Now used ONLY for placeholder orders that are NOT
 * backed by a Stripe invoice (see linkScheduleEntriesToOrders). Every real
 * invoiced order takes its number from the finalized Stripe invoice
 * (`invoice.number`) instead, so those two never share a numbering scheme.
 */
export async function nextOrderNumber(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<string> {
  // Filter to INV- numbers first. Stripe-numbered orders share this column and sort
  // above/below INV- arbitrarily, so an unfiltered top-N can miss every INV- row and
  // hand back INV-0001 again — which the unique index then rejects.
  const { docs } = await payload.find({
    collection: 'orders',
    where: { orderNumber: { like: 'INV-' } },
    sort: '-orderNumber',
    limit: 50,
    depth: 0,
  })
  let max = 0
  for (const o of docs) {
    const m = (o.orderNumber ?? '').match(/^INV-(\d+)$/)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > max) max = n
    }
  }
  return `INV-${String(max + 1).padStart(4, '0')}`
}
