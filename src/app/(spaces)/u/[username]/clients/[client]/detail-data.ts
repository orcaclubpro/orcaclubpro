import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { ClientAccount } from '@/types/payload-types'

// Layout, page, and generateMetadata all need this document in the same
// request — cache() collapses their three findByID calls into one.
// Returns null on missing/invalid id; callers decide notFound() vs fallback.
export const getClientAccountDetail = cache(
  async (clientId: string): Promise<ClientAccount | null> => {
    try {
      const payload = await getPayload({ config })
      return await payload.findByID({
        collection: 'client-accounts',
        id: clientId,
        depth: 2,
      })
    } catch {
      return null
    }
  },
)
