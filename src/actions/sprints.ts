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
  startDate?: string
  endDate?: string
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

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC
    const status = startDate && startDate <= today ? 'in-progress' : 'pending'

    const sprint = await payload.create({
      collection: 'sprints',
      data: {
        name,
        description: description || null,
        project: projectId,
        status,
        startDate: startDate || null,
        endDate: endDate || null,
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

export async function updateSprint({
  sprintId,
  name,
  description,
  startDate,
  endDate,
  goalDescription,
}: {
  sprintId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  goalDescription?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Access denied' }

    const payload = await getPayload({ config })

    const sprint = await payload.findByID({ collection: 'sprints', id: sprintId, depth: 1 })

    if (user.role !== 'admin') {
      const project = typeof sprint.project === 'object' ? sprint.project : null
      if (project) {
        const assignedUserIds = Array.isArray(project.assignedTo)
          ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
          : []
        if (!assignedUserIds.includes(user.id)) {
          return { success: false, error: 'Access denied' }
        }
      }
    }

    const updated = await payload.update({
      collection: 'sprints',
      id: sprintId,
      data: {
        name,
        description: description || null,
        ...(startDate !== undefined ? { startDate } : {}),
        endDate: endDate || null,
        goalDescription: goalDescription || null,
      },
    })

    return { success: true, sprint: updated }
  } catch (error) {
    console.error('[updateSprint]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update sprint' }
  }
}

export async function addSprintNote({ sprintId, text }: { sprintId: string; text: string }) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Access denied' }

    const payload = await getPayload({ config })

    const sprint = await payload.findByID({ collection: 'sprints', id: sprintId, depth: 0 })
    const existing = Array.isArray(sprint.notes) ? sprint.notes : []

    await payload.update({
      collection: 'sprints',
      id: sprintId,
      data: {
        notes: [...existing, { text, createdAt: new Date().toISOString() }],
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[addSprintNote]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add note' }
  }
}

export async function deleteSprint({ sprintId }: { sprintId: string }) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Access denied' }

    const payload = await getPayload({ config })

    const sprint = await payload.findByID({ collection: 'sprints', id: sprintId, depth: 1 })

    if (user.role !== 'admin') {
      const project = typeof sprint.project === 'object' ? sprint.project : null
      if (project) {
        const assignedUserIds = Array.isArray(project.assignedTo)
          ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
          : []
        if (!assignedUserIds.includes(user.id)) {
          return { success: false, error: 'Access denied' }
        }
      }
    }

    // Unlink tasks that belong to this sprint before deleting
    const { docs: sprintTasks } = await payload.find({
      collection: 'tasks',
      where: { sprint: { equals: sprintId } },
      depth: 0,
      limit: 500,
    })

    await Promise.all(
      sprintTasks.map((task) =>
        payload.update({ collection: 'tasks', id: task.id, data: { sprint: null } })
      )
    )

    await payload.delete({ collection: 'sprints', id: sprintId })

    return { success: true }
  } catch (error) {
    console.error('[deleteSprint]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete sprint' }
  }
}

export async function updateSprintStatus({
  sprintId,
  status,
}: {
  sprintId: string
  status: 'pending' | 'in-progress' | 'delayed' | 'finished'
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Access denied' }

    const payload = await getPayload({ config })

    const sprint = await payload.findByID({ collection: 'sprints', id: sprintId, depth: 1 })

    if (user.role !== 'admin') {
      const project = typeof sprint.project === 'object' ? sprint.project : null
      if (project) {
        const assignedUserIds = Array.isArray(project.assignedTo)
          ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
          : []
        if (!assignedUserIds.includes(user.id)) {
          return { success: false, error: 'Access denied' }
        }
      }
    }

    // Re-pass existing dates so Payload's built-in date validator has valid
    // values during the partial update — omitting them causes Payload to
    // validate the full merged document and reject stored null/invalid dates.
    const data: Record<string, unknown> = { status }
    if (status === 'in-progress' && !sprint.startDate) {
      data.startDate = new Date().toISOString()
    } else if (sprint.startDate) {
      data.startDate = sprint.startDate
    }
    if (sprint.endDate) data.endDate = sprint.endDate

    const updated = await payload.update({
      collection: 'sprints',
      id: sprintId,
      data,
    })

    return { success: true, sprint: updated }
  } catch (error) {
    console.error('[updateSprintStatus]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update sprint' }
  }
}
