'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function createSprint({
  projectId,
  name,
  description,
  startDate,
  endDate,
  goalDescription,
}: {
  projectId: string
  name: string
  description?: string
  startDate: string
  endDate: string
  goalDescription?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })

    // Verify user has access to the project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
    })

    // Check if user is assigned to project (or is admin)
    if (user.role !== 'admin') {
      const assignedUserIds = Array.isArray(project.assignedTo)
        ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
        : []
      if (!assignedUserIds.includes(user.id)) {
        return { success: false, error: 'Access denied' }
      }
    }

    const sprint = await payload.create({
      collection: 'sprints',
      data: {
        name,
        description: description || null,
        project: projectId,
        status: 'pending',
        startDate,
        endDate,
        goalDescription: goalDescription || null,
      },
    })

    return { success: true, sprint }
  } catch (error) {
    console.error('[createSprint]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sprint',
    }
  }
}
