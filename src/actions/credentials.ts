'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

interface SecretInput {
  key: string
  value: string
}

interface CredentialInput {
  projectId: string
  title: string
  website?: string
  username?: string
  password?: string
  secrets?: SecretInput[]
}

export async function createCredential(data: CredentialInput) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Access denied' }

    const payload = await getPayload({ config })

    const credential = await payload.create({
      collection: 'credentials',
      data: {
        title: data.title,
        project: data.projectId,
        website: data.website || undefined,
        username: data.username || undefined,
        password: data.password || undefined,
        secrets: data.secrets || [],
      },
    })

    return { success: true, credential }
  } catch (error) {
    console.error('[createCredential]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create credential',
    }
  }
}

export async function updateCredential(id: string, data: Partial<CredentialInput>) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Access denied' }

    const payload = await getPayload({ config })

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.website !== undefined) updateData.website = data.website
    if (data.username !== undefined) updateData.username = data.username
    if (data.password !== undefined) updateData.password = data.password
    if (data.secrets !== undefined) updateData.secrets = data.secrets

    const credential = await payload.update({
      collection: 'credentials',
      id,
      data: updateData as any,
    })

    return { success: true, credential }
  } catch (error) {
    console.error('[updateCredential]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update credential',
    }
  }
}

export async function deleteCredential(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Access denied' }

    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'credentials',
      id,
    })

    return { success: true }
  } catch (error) {
    console.error('[deleteCredential]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete credential',
    }
  }
}
