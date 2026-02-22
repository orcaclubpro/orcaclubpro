'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Project } from '@/types/payload-types'

export async function createProject({
  name,
  description,
  clientId,
  startDate,
  projectedEndDate,
  budget,
  currency,
}: {
  name: string
  description?: string
  clientId?: string
  startDate?: string
  projectedEndDate?: string
  budget?: number
  currency?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only admin and user roles can create projects
    if (user.role === 'client') {
      return { success: false, error: 'Clients cannot create projects' }
    }

    const payload = await getPayload({ config })

    const projectData: any = {
      name,
      status: 'pending',
      assignedTo: [user.id],
    }

    if (description) projectData.description = description
    if (clientId) projectData.client = clientId
    if (startDate) projectData.startDate = startDate
    if (projectedEndDate) projectData.projectedEndDate = projectedEndDate
    if (budget && budget > 0) {
      projectData.budgetAmount = budget
      if (currency) projectData.budgetCurrency = currency
    }

    const project = await payload.create({
      collection: 'projects',
      data: projectData,
    })

    // Revalidate the projects page
    revalidatePath(`/u/${user.username}/projects`)

    return { success: true, project }
  } catch (error) {
    console.error('[createProject]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    }
  }
}

export async function createMilestone({
  projectId,
  title,
  date,
  description,
}: {
  projectId: string
  title: string
  date: string
  description?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })

    // Get project and verify access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
    })

    // Check if user has access (admin or assigned to project)
    if (user.role !== 'admin') {
      const assignedUserIds = Array.isArray(project.assignedTo)
        ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
        : []
      if (!assignedUserIds.includes(user.id)) {
        return { success: false, error: 'Access denied' }
      }
    }

    // Append new milestone to array
    const updatedMilestones = [
      ...(project.milestones || []),
      {
        title,
        date,
        description: description || null,
        completed: false,
      },
    ]

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { milestones: updatedMilestones },
    })

    return { success: true }
  } catch (error) {
    console.error('[createMilestone]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create milestone',
    }
  }
}

export async function toggleMilestoneCompletion({
  projectId,
  milestoneIndex,
}: {
  projectId: string
  milestoneIndex: number
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })

    // Get project and verify access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
    })

    // Check if user has access (admin or assigned to project)
    if (user.role !== 'admin') {
      const assignedUserIds = Array.isArray(project.assignedTo)
        ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
        : []
      if (!assignedUserIds.includes(user.id)) {
        return { success: false, error: 'Access denied' }
      }
    }

    if (!project.milestones || !project.milestones[milestoneIndex]) {
      return { success: false, error: 'Milestone not found' }
    }

    // Toggle completion status
    const updatedMilestones = project.milestones.map((milestone, index) => {
      if (index === milestoneIndex) {
        return { ...milestone, completed: !milestone.completed }
      }
      return milestone
    })

    await payload.update({
      collection: 'projects',
      id: projectId,
      data: { milestones: updatedMilestones },
    })

    return { success: true }
  } catch (error) {
    console.error('[toggleMilestoneCompletion]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle milestone',
    }
  }
}

export async function updateMilestone({
  projectId,
  milestoneIndex,
  title,
  date,
  description,
  completed,
}: {
  projectId: string
  milestoneIndex: number
  title: string
  date: string
  description?: string
  completed?: boolean
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Clients cannot edit milestones' }

    const payload = await getPayload({ config })
    const project = await payload.findByID({ collection: 'projects', id: projectId, depth: 0 })

    if (user.role !== 'admin') {
      const assignedUserIds = Array.isArray(project.assignedTo)
        ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
        : []
      if (!assignedUserIds.includes(user.id)) return { success: false, error: 'Access denied' }
    }

    const milestones = [...(project.milestones || [])]
    if (milestoneIndex < 0 || milestoneIndex >= milestones.length) {
      return { success: false, error: 'Milestone not found' }
    }

    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      title,
      date,
      description: description || null,
      completed: completed ?? milestones[milestoneIndex].completed ?? false,
    }

    await payload.update({ collection: 'projects', id: projectId, data: { milestones } })
    return { success: true }
  } catch (error) {
    console.error('[updateMilestone]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update milestone' }
  }
}

export async function deleteMilestone({
  projectId,
  milestoneIndex,
}: {
  projectId: string
  milestoneIndex: number
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Clients cannot delete milestones' }

    const payload = await getPayload({ config })
    const project = await payload.findByID({ collection: 'projects', id: projectId, depth: 0 })

    if (user.role !== 'admin') {
      const assignedUserIds = Array.isArray(project.assignedTo)
        ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
        : []
      if (!assignedUserIds.includes(user.id)) return { success: false, error: 'Access denied' }
    }

    const milestones = [...(project.milestones || [])]
    if (milestoneIndex < 0 || milestoneIndex >= milestones.length) {
      return { success: false, error: 'Milestone not found' }
    }

    milestones.splice(milestoneIndex, 1)
    await payload.update({ collection: 'projects', id: projectId, data: { milestones } })
    return { success: true }
  } catch (error) {
    console.error('[deleteMilestone]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete milestone' }
  }
}

export async function deleteProject({ projectId }: { projectId: string }) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role !== 'admin') return { success: false, error: 'Only admins can delete projects' }

    const payload = await getPayload({ config })
    await payload.delete({ collection: 'projects', id: projectId })

    if (user.username) revalidatePath(`/u/${user.username}/projects`)
    return { success: true }
  } catch (error) {
    console.error('[deleteProject]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    }
  }
}

export async function updateProject({
  projectId,
  data,
}: {
  projectId: string
  data: Partial<Project>
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })

    // Get project and verify access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
    })

    // Check if user has access (admin or assigned to project)
    if (user.role !== 'admin') {
      const assignedUserIds = Array.isArray(project.assignedTo)
        ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
        : []
      if (!assignedUserIds.includes(user.id)) {
        return { success: false, error: 'Access denied' }
      }
    }

    // Update project
    await payload.update({
      collection: 'projects',
      id: projectId,
      data,
    })

    return { success: true }
  } catch (error) {
    console.error('[updateProject]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    }
  }
}
