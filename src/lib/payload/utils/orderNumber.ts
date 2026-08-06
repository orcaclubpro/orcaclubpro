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
  const { docs } = await payload.find({
    collection: 'orders',
    sort: '-orderNumber',
    limit: 10,
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
