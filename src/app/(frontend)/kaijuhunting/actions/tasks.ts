'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface KaijuHuntingTask {
  id?: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  kaijuType: string
  location: string
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  estimatedDuration?: number
  requiredEquipment?: string
  rewards?: number
  dueDate?: string
  assignedHunter?: string | any
  category: 'reconnaissance' | 'capture' | 'elimination' | 'rescue' | 'research'
  createdAt?: string
  updatedAt?: string
}

export interface TaskFormData {
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  kaijuType: string
  location: string
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  estimatedDuration?: number
  requiredEquipment?: string
  rewards?: number
  dueDate?: string
  assignedHunter?: string
  category: 'reconnaissance' | 'capture' | 'elimination' | 'rescue' | 'research'
}

// Get all kaiju hunting tasks
export async function getTasks(): Promise<KaijuHuntingTask[]> {
  try {
    const payload = await getPayload({ config })
    
    const result = await payload.find({
      collection: 'kaiju-hunting-tasks',
      sort: '-createdAt',
      limit: 100,
    })

    return result.docs as KaijuHuntingTask[]
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

// Get tasks by status
export async function getTasksByStatus(status: string): Promise<KaijuHuntingTask[]> {
  try {
    const payload = await getPayload({ config })
    
    const result = await payload.find({
      collection: 'kaiju-hunting-tasks',
      where: {
        status: {
          equals: status,
        },
      },
      sort: '-createdAt',
      limit: 100,
    })

    return result.docs as KaijuHuntingTask[]
  } catch (error) {
    console.error('Error fetching tasks by status:', error)
    return []
  }
}

// Create a new task
export async function createTask(data: TaskFormData): Promise<{ success: boolean; task?: KaijuHuntingTask; error?: string }> {
  try {
    const payload = await getPayload({ config })
    
    const result = await payload.create({
      collection: 'kaiju-hunting-tasks',
      data,
    })

    revalidatePath('/kaijuhunting')
    return { success: true, task: result as KaijuHuntingTask }
  } catch (error) {
    console.error('Error creating task:', error)
    return { success: false, error: 'Failed to create task' }
  }
}

// Update an existing task
export async function updateTask(id: string, data: Partial<TaskFormData>): Promise<{ success: boolean; task?: KaijuHuntingTask; error?: string }> {
  try {
    const payload = await getPayload({ config })
    
    const result = await payload.update({
      collection: 'kaiju-hunting-tasks',
      id,
      data,
    })

    revalidatePath('/kaijuhunting')
    return { success: true, task: result as KaijuHuntingTask }
  } catch (error) {
    console.error('Error updating task:', error)
    return { success: false, error: 'Failed to update task' }
  }
}

// Delete a task
export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })
    
    await payload.delete({
      collection: 'kaiju-hunting-tasks',
      id,
    })

    revalidatePath('/kaijuhunting')
    return { success: true }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: 'Failed to delete task' }
  }
}

// Get task statistics
export async function getTaskStats(): Promise<{
  total: number
  pending: number
  in_progress: number
  completed: number
  failed: number
}> {
  try {
    const payload = await getPayload({ config })
    
    const [total, pending, inProgress, completed, failed] = await Promise.all([
      payload.count({ collection: 'kaiju-hunting-tasks' }),
      payload.count({ 
        collection: 'kaiju-hunting-tasks',
        where: { status: { equals: 'pending' } }
      }),
      payload.count({ 
        collection: 'kaiju-hunting-tasks',
        where: { status: { equals: 'in_progress' } }
      }),
      payload.count({ 
        collection: 'kaiju-hunting-tasks',
        where: { status: { equals: 'completed' } }
      }),
      payload.count({ 
        collection: 'kaiju-hunting-tasks',
        where: { status: { equals: 'failed' } }
      }),
    ])

    return {
      total: total.totalDocs,
      pending: pending.totalDocs,
      in_progress: inProgress.totalDocs,
      completed: completed.totalDocs,
      failed: failed.totalDocs,
    }
  } catch (error) {
    console.error('Error fetching task stats:', error)
    return {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
    }
  }
}