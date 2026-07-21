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
