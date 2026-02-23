'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

/**
 * Update the current user's display profile: name and email.
 * Restricted to admin and user (developer) roles only.
 * Does not touch the user's role field.
 */
export async function updateUserProfile({
  name,
  email,
  title,
}: {
  name: string
  email: string
  title?: string
}) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, error: 'Unauthorized' }
    if (currentUser.role === 'client') return { success: false, error: 'Not allowed' }
    if (!name.trim()) return { success: false, error: 'Name is required' }
    if (!email.trim()) return { success: false, error: 'Email is required' }

    const payload = await getPayload({ config })

    await payload.update({
      collection: 'users',
      id: currentUser.id,
      data: {
        name: name.trim(),
        email: email.trim(),
        title: title?.trim() || null,
      },
      overrideAccess: true,
      context: { skipClientAccountSync: true, skipNameValidation: false },
    })

    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    console.error('[updateUserProfile]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    }
  }
}

/**
 * Dismiss the welcome tips banner for the current client.
 * Sets showTips: false on the user record so the banner is not shown again.
 */
export async function dismissTips() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'client') return { success: false }

    const payload = await getPayload({ config })

    await payload.update({
      collection: 'users',
      id: currentUser.id,
      data: { showTips: false } as any,
      overrideAccess: true,
      context: { skipClientAccountSync: true, skipNameValidation: true, skipClientWelcomeEmail: true },
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('[dismissTips]', error)
    return { success: false }
  }
}

/**
 * Change the current user's password.
 * Verifies the current password before allowing the change.
 */
export async function changeUserPassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, error: 'Unauthorized' }
    if (currentUser.role === 'client') return { success: false, error: 'Not allowed' }
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters' }
    }
    if (!currentPassword) return { success: false, error: 'Current password is required' }

    const payload = await getPayload({ config })

    // Verify current password via login
    try {
      await payload.login({
        collection: 'users',
        data: { email: currentUser.email!, password: currentPassword },
      })
    } catch {
      return { success: false, error: 'Current password is incorrect' }
    }

    await payload.update({
      collection: 'users',
      id: currentUser.id,
      data: { password: newPassword } as any,
      overrideAccess: true,
      context: { skipClientAccountSync: true, skipNameValidation: true },
    })

    return { success: true }
  } catch (error) {
    console.error('[changeUserPassword]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password',
    }
  }
}
