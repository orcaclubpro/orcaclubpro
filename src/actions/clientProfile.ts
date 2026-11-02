'use server'

/**
 * Client profile for bots and staff: who the client is, their profile notes,
 * and a read-only, hours-only billing view of their retainer. Wrapped by the
 * MCP tool get_client_profile (src/lib/mcp/tools.ts).
 *
 * Read-only. The account is read as the caller with `overrideAccess: false`;
 * the billing view reuses getRetainerPortfolio so cycle and cap math stay in
 * one place. Money (amounts, Stripe ids) is dropped by the allowlists in
 * src/lib/mcp/clientProfile.ts.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

import { getCurrentUser } from '@/actions/auth'
import { getRetainerPortfolio } from '@/actions/retainers'
import {
  billingBlock,
  clientBasics,
  profileBlock,
  PROFILE_PENDING_NOTE,
  type ClientBasics,
  type ClientBillingBlock,
  type ClientProfileBlock,
} from '@/lib/mcp/clientProfile'

type Fail = { success: false; error: string }

export async function getClientProfile(clientAccountId: string): Promise<
  | {
      success: true
      client: ClientBasics
      profile: ClientProfileBlock | null
      profileStatus: string | null
      billing: ClientBillingBlock | null
    }
  | Fail
> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'user')) return { success: false, error: 'Unauthorized' }
    const id = clientAccountId.trim()
    if (!id) return { success: false, error: 'clientAccountId is required' }

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'client-accounts',
      where: { id: { equals: id } },
      depth: 0,
      limit: 1,
      user,
      overrideAccess: false,
    })
    const account = docs[0] as unknown as Record<string, unknown> | undefined
    if (!account) return { success: false, error: `Client account ${id} not found (it does not exist or you cannot access it)` }

    const portfolio = await getRetainerPortfolio()
    if (!portfolio.success) return { success: false, error: portfolio.error ?? 'Could not load retainer billing' }
    const row = portfolio.rows.find((r) => r.clientAccountId === id) ?? null

    const hasProfileField = 'profile' in account
    return {
      success: true,
      client: clientBasics(account),
      profile: profileBlock(account),
      profileStatus: hasProfileField ? null : PROFILE_PENDING_NOTE,
      billing: row ? billingBlock(row) : null,
    }
  } catch (error) {
    console.error('[getClientProfile]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to load client profile' }
  }
}
