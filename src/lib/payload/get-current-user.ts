import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

// Deduplicated within a single server render — SpacesLayout, DashboardLayout,
// and page.tsx all call getCurrentUser() but this only hits the DB once.
export const getAuthenticatedUser = cache(async () => {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    return user ?? null
  } catch {
    return null
  }
})
