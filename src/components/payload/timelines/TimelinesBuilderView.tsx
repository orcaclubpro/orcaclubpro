import type { AdminViewServerProps } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TimelinesBuilderClient } from './TimelinesBuilderClient'

/**
 * Server Component wrapper for Timelines Builder View
 * Registered as a custom root-level admin view in PayloadCMS config
 * Authenticates the user and fetches all timelines before rendering the client UI
 */
export async function TimelinesBuilderView(props: AdminViewServerProps) {
  const headers = await getHeaders()

  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/admin/login')
  }

  if (user.role !== 'admin' && user.role !== 'user') {
    redirect('/admin')
  }

  const { docs } = await payload.find({
    collection: 'timelines',
    limit: 100,
    sort: '-updatedAt',
  })

  return <TimelinesBuilderClient initialTimelines={docs} user={user} />
}
