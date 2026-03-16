'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function createDocument({
  name,
  description,
  documentTemplate,
  documentBrand,
  documentData,
  projectId,
  sprintId,
}: {
  name: string
  description?: string
  documentTemplate: 'nda' | 'sow'
  documentBrand: 'personal' | 'orcaclub'
  documentData: object
  projectId?: string
  sprintId?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'user')) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })

    const doc = await payload.create({
      collection: 'files',
      data: {
        name,
        description,
        fileType: 'document',
        documentTemplate,
        documentBrand,
        documentData,
        ...(projectId ? { project: projectId } : {}),
        ...(sprintId ? { sprint: sprintId } : {}),
      } as any,
    })

    return { success: true, id: doc.id }
  } catch (error) {
    console.error('[createDocument]', error)
    return { success: false, error: 'Failed to save document' }
  }
}

export async function deleteFileRecord(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'user')) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })
    await payload.delete({ collection: 'files', id })
    return { success: true }
  } catch (error) {
    console.error('[deleteFileRecord]', error)
    return { success: false, error: 'Failed to delete file' }
  }
}
