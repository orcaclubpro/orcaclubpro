import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

// The page and generateMetadata both need this document in the same request —
// cache() collapses their findByID calls into one.
// Returns null on missing/invalid id; callers decide notFound() vs fallback.
export const getPackageDetail = cache(async (packageId: string): Promise<any | null> => {
  try {
    const payload = await getPayload({ config })
    return await payload.findByID({ collection: 'packages', id: packageId, depth: 0 })
  } catch {
    return null
  }
})

/** Orders raised against this package — drives the invoiced/paid progress bar
 *  and the Stripe links on invoiced schedule rows. */
export const getPackageOrders = cache(async (packageId: string): Promise<any[]> => {
  const payload = await getPayload({ config })
  const { docs } = await payload
    .find({
      collection: 'orders',
      where: { packageRef: { equals: packageId } },
      depth: 0,
      sort: '-createdAt',
      limit: 100,
    })
    .catch(() => ({ docs: [] as any[] }))
  return docs
})
