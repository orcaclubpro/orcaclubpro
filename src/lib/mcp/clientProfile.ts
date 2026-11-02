/**
 * Shapes for the MCP `get_client_profile` tool (plan step 5, feature #9).
 *
 * Everything here is an allowlist: a key that is not named below never reaches
 * a bot. In particular the billing block carries hours and cycle state only.
 * No dollar amounts (`overageAmount`, pitch pricing), no Stripe/Shopify ids and
 * no payment config ever leave, even though the sources hold them.
 *
 * `profile` reads the `ClientAccounts.profile` group (facts, rules, Drive folder,
 * billing notes). That group is a schema change that waits on Chance. Until it
 * lands, `profileBlock` returns null and the tool says so in `profileStatus`.
 */
import type { RetainerPortfolioRow } from '@/actions/retainers'

export type ClientBasics = {
  id: string
  name: string | null
  company: string | null
  contactName: string | null
  email: string | null
}

export type ClientProfileBlock = {
  facts: string | null
  rules: string | null
  driveFolderUrl: string | null
  billingNotes: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export type ClientBillingBlock = {
  retainerId: string
  tier: string
  health: RetainerPortfolioRow['health']
  cycleLabel: string
  usedHours: number
  capHours: number
  remainingHours: number
  overageHours: number
  pctUsed: number
  daysLeft: number
  deactivateOn: string | null
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)

export function clientBasics(account: Record<string, unknown>): ClientBasics {
  const contactName = [str(account.firstName), str(account.lastName)].filter(Boolean).join(' ')
  return {
    id: String(account.id),
    name: str(account.name),
    company: str(account.company),
    contactName: contactName || null,
    email: str(account.email),
  }
}

/** The stored profile group, or null when the field does not exist yet or is empty. */
export function profileBlock(account: Record<string, unknown>): ClientProfileBlock | null {
  const p = account.profile
  if (!p || typeof p !== 'object') return null
  const g = p as Record<string, unknown>
  const block: ClientProfileBlock = {
    facts: str(g.facts),
    rules: str(g.rules),
    driveFolderUrl: str(g.driveFolderUrl),
    billingNotes: str(g.billingNotes),
    updatedAt: str(g.updatedAt),
    updatedBy: str(g.updatedBy),
  }
  return Object.values(block).some((v) => v !== null) ? block : null
}

/** Hours-only view of a portfolio row. Never copies a money field. */
export function billingBlock(row: RetainerPortfolioRow): ClientBillingBlock {
  return {
    retainerId: row.retainerId,
    tier: row.tier,
    health: row.health,
    cycleLabel: row.cycleLabel,
    usedHours: row.used,
    capHours: row.cap,
    remainingHours: row.remaining,
    overageHours: row.overageHours,
    pctUsed: row.pct,
    daysLeft: row.daysLeft,
    deactivateOn: row.deactivateOn,
  }
}

export const PROFILE_PENDING_NOTE =
  'needs-chance: the ClientAccounts.profile group (facts, rules, driveFolderUrl, billingNotes) is not in the ' +
  'schema yet. Until Chance adds it, propose profile facts as a task on the internal project for Chance.'
