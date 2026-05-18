'use server'

import { login, logout } from '@payloadcms/next/auth'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/payload/get-current-user'

const SESSION_COOKIE = 'orcaclub-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days — matches payload-token JWT expiry

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
    let username = result.user?.username

    // Client users must have a username to access /u/[username].
    // If one was never generated (e.g. account created before the hook existed, or
    // created without firstName/lastName), generate and persist one now.
    if (role === 'client' && !username) {
      const payload = await getPayload({ config })
      const email = result.user?.email ?? ''
      const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'

      // Ensure uniqueness
      let candidate = emailPrefix
      let counter = 1
      while (true) {
        const existing = await payload.find({
          collection: 'users',
          where: { username: { equals: candidate } },
          limit: 1,
        })
        if (existing.docs.length === 0) break
        // It's already their own username (shouldn't happen here, but be safe)
        if (String(existing.docs[0].id) === String(result.user?.id)) break
        candidate = `${emailPrefix}${counter}`
        counter++
      }

      await payload.update({
        collection: 'users',
        id: result.user!.id,
        data: { username: candidate },
        overrideAccess: true,
        context: { skipNameValidation: true },
      })

      username = candidate
    }

    // Admin/User roles can login even without username (they use /admin or their username)
    // Set a short-lived session cookie so the home page can smart-redirect returning visitors
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, JSON.stringify({ username, role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })

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
  } catch (error) {
    throw new Error(
      `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete('orcaclub-vault-session')
  redirect('/login')
}

/**
 * Get current authenticated user (server-side).
 * Delegates to a React-cached function so the DB is only hit once per render,
 * even when called from SpacesLayout, DashboardLayout, and page.tsx in the same request.
 */
export async function getCurrentUser() {
  return getAuthenticatedUser()
}
