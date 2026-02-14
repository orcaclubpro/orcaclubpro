'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function createTask({
  projectId,
  title,
  description,
  priority,
  dueDate,
  sprintId,
}: {
  projectId: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  sprintId?: string
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

    const task = await payload.create({
      collection: 'tasks',
      data: {
        title,
        description: description
          ? {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [
                      {
                        type: 'text',
                        version: 1,
                        text: description,
                      },
                    ],
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                version: 1,
              },
            }
          : undefined,
        priority,
        dueDate: dueDate || undefined,
        project: projectId,
        assignedTo: user.id,
        status: 'pending',
        sprint: sprintId || null,
      },
    })

    return { success: true, task }
  } catch (error) {
    console.error('[createTask]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    }
  }
}

export async function updateTaskStatus({
  taskId,
  status,
}: {
  taskId: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })

    // Get task to verify access
    const task = await payload.findByID({
      collection: 'tasks',
      id: taskId,
      depth: 1,
    })

    // Check if user has access (admin, or assigned to project)
    if (user.role !== 'admin') {
      const project = typeof task.project === 'object' ? task.project : null
      if (project) {
        const assignedUserIds = Array.isArray(project.assignedTo)
          ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
          : []
        if (!assignedUserIds.includes(user.id)) {
          return { success: false, error: 'Access denied' }
        }
      }
    }

    const updatedTask = await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
      },
    })

    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('[updateTaskStatus]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    }
  }
}
