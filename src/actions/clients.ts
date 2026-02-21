'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { clientWelcome } from '@/lib/email/templates'

/**
 * Create a new client account with Stripe customer, or update the Stripe ID
 * on an existing account if one already exists with the same email.
 *
 * Flow:
 * 1. Find or create a Stripe customer for the email (search-first pattern)
 * 2. If a ClientAccount already exists with that email → update its stripeCustomerId
 * 3. Otherwise → create a new ClientAccount with stripeCustomerId pre-set
 *
 * The createStripeCustomerHook on the collection will verify (not re-create)
 * the Stripe customer since stripeCustomerId is already populated.
 */
export async function createOrUpdateClientAccount({
  name,
  email,
  firstName,
  lastName,
  company,
}: {
  name: string
  email: string
  firstName: string
  lastName: string
  company?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Clients cannot create accounts' }

    const stripe = getStripe()
    const payload = await getPayload({ config })

    // Step 1: Find or create Stripe customer (search-first pattern)
    const existingStripeCustomers = await stripe.customers.list({ email, limit: 1 })

    let stripeCustomerId: string

    if (existingStripeCustomers.data.length > 0) {
      const existing = existingStripeCustomers.data[0]
      stripeCustomerId = existing.id

      // Update name in Stripe if it differs
      if (name && existing.name !== name) {
        await stripe.customers.update(stripeCustomerId, { name })
      }
    } else {
      const newCustomer = await stripe.customers.create({
        email,
        name,
        metadata: {
          created_via: 'orcaclub_dashboard',
          source: 'new_client_modal',
          created_at: new Date().toISOString(),
        },
      })
      stripeCustomerId = newCustomer.id
    }

    // Step 2: Check if a ClientAccount already exists with this email
    const { docs: existingAccounts } = await payload.find({
      collection: 'client-accounts',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
    })

    if (existingAccounts.length > 0) {
      // Update existing account's Stripe ID
      const existingAccount = existingAccounts[0]
      await payload.update({
        collection: 'client-accounts',
        id: existingAccount.id,
        data: { stripeCustomerId },
      })

      payload.logger.info(`[createOrUpdateClientAccount] Existing account updated — calling createClientUserAndSendWelcome for ${email}`)
      const emailSent = await createClientUserAndSendWelcome({
        payload,
        email,
        firstName,
        lastName,
        company,
      })

      if (user.username) revalidatePath(`/u/${user.username}/clients`)

      return {
        success: true,
        id: existingAccount.id,
        action: 'updated' as const,
        message: 'Existing client account found and linked to Stripe customer.',
        emailSent,
      }
    }

    // Step 3: Create new ClientAccount — hook will verify stripeCustomerId, not re-create
    const newAccount = await payload.create({
      collection: 'client-accounts',
      data: {
        name,
        email,
        firstName,
        lastName,
        ...(company ? { company } : {}),
        stripeCustomerId,
      },
    })

    payload.logger.info(`[createOrUpdateClientAccount] New account created — calling createClientUserAndSendWelcome for ${email}`)
    const emailSent = await createClientUserAndSendWelcome({
      payload,
      email,
      firstName,
      lastName,
      company,
    })

    if (user.username) revalidatePath(`/u/${user.username}/clients`)

    return {
      success: true,
      id: newAccount.id,
      action: 'created' as const,
      message: 'Client account created and linked to Stripe.',
      emailSent,
    }
  } catch (error) {
    console.error('[createOrUpdateClientAccount]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create client account',
    }
  }
}

/**
 * Permanently delete a ClientAccount and its corresponding Stripe customer.
 * Stripe deletion is attempted first; if it fails (e.g. already deleted) we
 * log and continue so the Payload record is always cleaned up.
 */
export async function deleteClientAccount({ id }: { id: string }) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Clients cannot delete accounts' }

    const payload = await getPayload({ config })

    // Fetch the account to retrieve the Stripe customer ID
    const account = await payload.findByID({
      collection: 'client-accounts',
      id,
      depth: 0,
    })

    // Remove from Stripe if connected
    if (account.stripeCustomerId) {
      try {
        const stripe = getStripe()
        await stripe.customers.del(account.stripeCustomerId)
      } catch (stripeErr) {
        console.error('[deleteClientAccount] Stripe customer deletion failed:', stripeErr)
      }
    }

    // Remove from Payload
    await payload.delete({ collection: 'client-accounts', id })

    if (user.username) revalidatePath(`/u/${user.username}/clients`)

    return { success: true }
  } catch (error) {
    console.error('[deleteClientAccount]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete client account',
    }
  }
}

/**
 * Update editable fields on an existing ClientAccount.
 * The createStripeCustomerHook will handle email → Stripe sync automatically.
 */
export async function updateClientAccount({
  id,
  name,
  firstName,
  lastName,
  company,
}: {
  id: string
  name: string
  firstName: string
  lastName: string
  company?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Clients cannot edit accounts' }

    const payload = await getPayload({ config })

    await payload.update({
      collection: 'client-accounts',
      id,
      data: { name, firstName, lastName, ...(company !== undefined ? { company } : {}) },
    })

    if (user.username) revalidatePath(`/u/${user.username}/clients`)

    return { success: true }
  } catch (error) {
    console.error('[updateClientAccount]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update client account',
    }
  }
}

/**
 * Creates a role:'client' User for the given email if one doesn't exist,
 * then sends a welcome email with a 7-day account setup link.
 * Returns true if the email was sent, false otherwise.
 * Non-blocking: email failure is caught and logged, never thrown.
 */
async function createClientUserAndSendWelcome({
  payload,
  email,
  firstName,
  lastName,
  company,
}: {
  payload: Payload
  email: string
  firstName: string
  lastName: string
  company?: string
}): Promise<boolean> {
  payload.logger.info(`[Welcome] Checking for existing user: ${email}`)

  const { docs: existingUsers } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })

  let userId: string

  if (existingUsers.length > 0) {
    const existingUser = existingUsers[0]
    userId = String(existingUser.id)

    // Don't send a client welcome email to admin/staff accounts
    if (existingUser.role !== 'client') {
      payload.logger.warn(
        `[Welcome] User ${email} exists with role '${existingUser.role}' — skipping welcome email`
      )
      return false
    }

    payload.logger.info(`[Welcome] Client user already exists (id: ${userId}) — will still send setup email`)
  } else {
    payload.logger.info(`[Welcome] No existing user — creating client user for ${email}`)

    // Create client User — createClientAccountHook (beforeChange) will auto-link
    // to the existing ClientAccount by email match
    const tempPassword = crypto.randomBytes(32).toString('hex')

    const newUser = await payload.create({
      collection: 'users',
      data: {
        email,
        firstName,
        lastName,
        ...(company ? { company } : {}),
        role: 'client',
        password: tempPassword,
      },
    })

    userId = String(newUser.id)
    payload.logger.info(`[Welcome] User created: ${userId}`)
  }

  payload.logger.info(`[Welcome] Generating setup token for user ${userId}`)

  // Use payload.forgotPassword() so the token is stored correctly (Payload hashes
  // it internally). Manual writes to resetPasswordToken don't work with
  // payload.resetPassword() which validates against the hashed value.
  const setupToken = await payload.forgotPassword({
    collection: 'users',
    data: { email },
    disableEmail: true, // We send our own branded welcome email below
  })

  payload.logger.info(`[Welcome] Token generated — sending welcome email to ${email}`)

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const setupUrl = `${baseUrl}/reset-password?token=${setupToken}`
  const { subject, html, text } = clientWelcome({ name: firstName, setupUrl })

  try {
    await payload.sendEmail({ to: email, subject, html, text })
    payload.logger.info(`[Welcome] Email sent successfully to ${email}`)
    return true
  } catch (err) {
    payload.logger.error(`[Welcome] Email send failed for ${email}: ${err}`)
    return false
  }
}
