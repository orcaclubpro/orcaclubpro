import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Project } from '@/types/payload-types'

// Layout, page, and generateMetadata all need the project in the same
// request — cache() collapses their three findByID calls into one.
// Returns null on missing/invalid id; callers decide notFound() vs fallback.
export const getProjectDetail = cache(
  async (projectId: string): Promise<Project | null> => {
    try {
      const payload = await getPayload({ config })
      return await payload.findByID({
        collection: 'projects',
        id: projectId,
        depth: 2,
      })
    } catch {
      return null
    }
  },
)

// Layout (sidebar counts) and page (tabs) both list the project's tasks —
// one shared depth-1 fetch per request instead of two.
export const getProjectTasks = cache(async (projectId: string) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'tasks',
    where: { project: { equals: projectId } },
    depth: 1,
    sort: '-createdAt',
    limit: 200,
  })
  return docs
})

/**
 * The proposals raised against this project.
 *
 * The link lives on the package (`packages.projectRef`, indexed), so a project
 * reaches its packages by the inverse — and can have more than one: a build
 * proposal and a retainer are two packages against the same project.
 *
 * Shared by the layout (the sidebar's quick link) and the Packages tab, so the
 * cache() collapses their two queries into one per request.
 */
export const getProjectPackages = cache(async (projectId: string): Promise<any[]> => {
  const payload = await getPayload({ config })
  const { docs } = await payload
    .find({
      collection: 'packages',
      where: { projectRef: { equals: projectId } },
      depth: 0,
      sort: '-createdAt',
      limit: 50,
    })
    .catch(() => ({ docs: [] as any[] }))
  return docs
})

/** Orders raised against any of these packages — drives the invoiced/paid bars. */
export const getPackagesOrders = cache(async (packageIds: string): Promise<any[]> => {
  const ids = packageIds ? packageIds.split(',') : []
  if (ids.length === 0) return []
  const payload = await getPayload({ config })
  const { docs } = await payload
    .find({
      collection: 'orders',
      where: { packageRef: { in: ids } },
      depth: 0,
      sort: '-createdAt',
      limit: 200,
    })
    .catch(() => ({ docs: [] as any[] }))
  return docs
})

/**
 * Every proposal belonging to this project's client.
 *
 * `projectRef` is set by hand and almost never is: at the time this was written
 * 25 of 26 proposals carried a client but no project, so a Packages tab that
 * only queried the link came up empty on nine projects out of ten. The client is
 * always set, so the tab lists these as candidates and offers to make the link
 * in one click — the tab is useful immediately, and the data heals as it is used.
 */
export const getClientPackages = cache(async (clientId: string): Promise<any[]> => {
  if (!clientId) return []
  const payload = await getPayload({ config })
  const { docs } = await payload
    .find({
      collection: 'packages',
      where: { clientAccount: { equals: clientId }, type: { equals: 'proposal' } },
      depth: 0,
      sort: '-createdAt',
      limit: 50,
    })
    .catch(() => ({ docs: [] as any[] }))
  return docs
})
