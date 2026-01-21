'use server'

import { login, logout } from '@payloadcms/next/auth'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

/**
 * Client login action - authenticates client users and redirects to their dashboard
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

    // Verify this is a client user
    if (result.user?.role !== 'client') {
      // Logout the non-client user
      await logout({ config })
      throw new Error('Only client users can login here. Admins and staff should use the admin panel at /admin.')
    }

    // Get the username for redirect
    const username = result.user.username

    if (!username) {
      throw new Error('Client account does not have a username. Please contact support.')
    }

    return {
      success: true,
      username,
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
