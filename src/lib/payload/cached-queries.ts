import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

export const getCachedClients = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    return payload.find({
      collection: 'clients' as any,
      sort: 'displayOrder',
      limit: 12,
    })
  },
  ['clients-list'],
  { revalidate: 3600, tags: ['clients'] }
)

export const getCachedHomePage = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    return payload.find({
      collection: 'pages' as any,
      where: { slug: { equals: 'home' } },
      depth: 2,
      limit: 1,
      draft: process.env.NODE_ENV === 'development',
      overrideAccess: true, // public page
    })
  },
  ['home-page'],
  { revalidate: 3600, tags: ['pages'] }
)

export const getCachedSolutions = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    return payload.find({
      collection: 'solutions',
      limit: 100,
      overrideAccess: false,
      sort: 'createdAt',
    })
  },
  ['solutions-list'],
  { revalidate: 1800, tags: ['solutions'] }
)
