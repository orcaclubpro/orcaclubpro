'use server'

import { getPayload } from 'payload'
import config from '@/lib/payload/payload.config'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type LoginResult = {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
    name?: string
    role?: string
  }
}

export type RegisterResult = {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
    name?: string
  }
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  try {
    const payload = await getPayload({ config })
    
    const result = await payload.login({
      collection: 'users',
      data: {
        email,
        password,
      },
    })

    if (result.user) {
      // Set the authentication cookie
      const cookieStore = await cookies()
      cookieStore.set('payload-token', result.token || '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return {
        success: true,
        user: {
          id: String(result.user.id),
          email: result.user.email,
          name: result.user.name as string,
          role: result.user.role as string,
        }
      }
    } else {
      return {
        success: false,
        error: 'Invalid credentials'
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Login failed. Please try again.'
    }
  }
}

export async function registerUser(
  email: string, 
  password: string, 
  name: string
): Promise<RegisterResult> {
  try {
    const payload = await getPayload({ config })
    
    const result = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        name,
        role: 'user',
        workspace: email.split('@')[0], // Generate workspace from email
      },
    })

    if (result.id) {
      return {
        success: true,
        user: {
          id: result.id as string,
          email: result.email,
          name: result.name as string,
        }
      }
    } else {
      return {
        success: false,
        error: 'Registration failed'
      }
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Handle duplicate email error
    if (error.message?.includes('duplicate') || error.code === 11000) {
      return {
        success: false,
        error: 'An account with this email already exists'
      }
    }
    
    return {
      success: false,
      error: 'Registration failed. Please try again.'
    }
  }
}

export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    const payload = await getPayload({ config })
    const cookieStore = await cookies()
    
    // Get the current token
    const token = cookieStore.get('payload-token')?.value
    
    // Clear the authentication cookie
    cookieStore.delete('payload-token')
    
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    // Even if logout fails on the server, clear the local cookie
    const cookieStore = await cookies()
    cookieStore.delete('payload-token')
    return { success: true }
  }
}

export async function getCurrentUser(): Promise<LoginResult['user'] | null> {
  try {
    const payload = await getPayload({ config })
    const cookieStore = await cookies()
    
    const token = cookieStore.get('payload-token')?.value
    
    if (!token) {
      return null
    }

    const user = await payload.auth({
      headers: new Headers({
        'Authorization': `JWT ${token}`,
      }),
    })

    if (user.user) {
      return {
        id: user.user.id as string,
        email: user.user.email,
        name: user.user.name as string,
        role: user.user.role as string,
      }
    }
    
    return null
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function createDemoUser(): Promise<LoginResult> {
  try {
    const payload = await getPayload({ config })
    
    // Check if demo user already exists
    const existing = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: 'demo@orcaclub.pro'
        }
      }
    })

    let user
    if (existing.docs.length > 0) {
      user = existing.docs[0]
    } else {
      // Create demo user
      user = await payload.create({
        collection: 'users',
        data: {
          email: 'demo@orcaclub.pro',
          password: 'demo123',
          name: 'Demo User',
          role: 'user',
          workspace: 'demo',
        },
      })
    }

    // Log in as demo user
    return await loginUser('demo@orcaclub.pro', 'demo123')
  } catch (error) {
    console.error('Create demo user error:', error)
    return {
      success: false,
      error: 'Failed to create demo user'
    }
  }
}