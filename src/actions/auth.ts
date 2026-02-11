'use server'

import { login, logout } from '@payloadcms/next/auth'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

/**
 * Login action - authenticates users and returns their role and username
 */
export async function loginAction({
  email,
  password,
}: {
  email: string
  password: string
}) {
  try {
    // Authenticate the user
    const result = await login({
      collection: 'users',
      config,
      email,
      password,
    })

    const role = result.user?.role
    const username = result.user?.username

    // Client users MUST have a username to access dashboard
    if (role === 'client' && !username) {
      await logout({ config })
      throw new Error('Your account does not have a username. Please contact support.')
    }

    // Admin/User roles can login even without username (will use admin panel or their username)
    return {
      success: true,
      username,
      role,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed. Please check your credentials.',
    }
  }
}

/**
 * Logout action - clears session and redirects to login
 */
export async function logoutAction() {
  try {
    await logout({ config })
    redirect('/login')
  } catch (error) {
    throw new Error(
      `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Get current authenticated user (server-side)
 */
export async function getCurrentUser() {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({
      headers: await import('next/headers').then((mod) => mod.headers()),
    })

    return user
  } catch (error) {
    return null
  }
}
