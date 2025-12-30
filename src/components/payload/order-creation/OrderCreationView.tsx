import type { AdminViewServerProps } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import OrderCreationClient from './OrderCreationClient'

/**
 * Server Component wrapper for Order Creation View
 * This is registered as a custom view in PayloadCMS config
 * Ensures user is authenticated before rendering the order creation interface
 */
export async function OrderCreationView(props: AdminViewServerProps) {
  // Get request headers for authentication
  const headers = await getHeaders()

  // Initialize Payload instance
  const payload = await getPayload({ config: configPromise })

  // Check if user is authenticated
  const { user, permissions } = await payload.auth({ headers })

  // Redirect to login if not authenticated
  if (!user) {
    redirect(
      `/admin/login?error=${encodeURIComponent('You must be logged in to create orders.')}&redirect=/admin/order`
    )
  }

  // Optionally: Check if user has specific permissions
  // You can add role-based checks here if needed
  // if (user.role !== 'admin') {
  //   redirect('/admin?error=' + encodeURIComponent('Insufficient permissions'))
  // }

  return <OrderCreationClient />
}
