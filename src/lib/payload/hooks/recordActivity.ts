/**
 * Activity logging — the writers behind the `activity` collection.
 *
 * ─── The transaction rule (read this before changing anything here) ──────────
 * In this codebase a *caught* error inside a hook still rolls back the write
 * that opened the transaction: once a nested Local API call that was handed the
 * parent `req` fails, the MongoDB session is aborted, and swallowing the error
 * in JS does not un-abort it. So the usual house rule — "always pass `req` to
 * nested operations in hooks" — is exactly what we must NOT do here. That rule
 * exists so a nested write is atomic *with* the parent write; activity logging
 * is the opposite case: it is bookkeeping that must never be able to take the
 * parent down with it.
 *
 * Therefore every write in this file:
 *   1. omits `req` — it runs in its own transaction, so a failure is isolated;
 *   2. runs inside `setImmediate` — the parent operation returns without paying
 *      for the log, matching the non-blocking pattern in sendClientWelcomeEmail;
 *   3. is wrapped in try/catch and only ever reaches `payload.logger`.
 *
 * The trade-off is that an activity row is written even if the parent write is
 * subsequently rolled back. For an advisory feed that is the right side to err
 * on: a missing event is invisible, a poisoned invoice is not.
 *
 * `context.skipActivityLog` is honoured so a caller can suppress logging for
 * bulk/backfill writes, and is set on our own create so nothing can re-enter.
 */

import type {
  CollectionAfterChangeHook,
  Payload,
  PayloadRequest,
} from 'payload'

// ─── Row input ───────────────────────────────────────────────────────────────

export type ActivityKind =
  | 'order-created'
  | 'project-created'
  | 'project-updated'
  | 'retainer-log'
  | 'email-sent'

export interface ActivityInput {
  kind: ActivityKind
  title: string
  summary?: string | null
  /** Portal-relative, WITHOUT the /u/<username> prefix — e.g. `/projects/<id>`. */
  href?: string | null
  status?: string | null
  amount?: number | null
  recipient?: string | null
  actor?: string | null
  actorName?: string | null
  clientAccount?: string | null
  project?: string | null
  order?: string | null
  retainer?: string | null
  changes?: Array<{ field: string; from?: string | null; to?: string | null }>
}

/** Relationship value → id string. Handles populated docs, bare ids and null. */
const relId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'id' in (value as any)) return String((value as any).id)
  return null
}

const personName = (u: any): string | null => {
  if (!u || typeof u !== 'object') return null
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  return full || u.name || u.email || null
}

const actorFrom = (req?: PayloadRequest): Pick<ActivityInput, 'actor' | 'actorName'> => ({
  actor: relId(req?.user) ?? null,
  actorName: personName(req?.user) ?? null,
})

/**
 * Write one activity row. Deliberately fire-and-forget and deliberately
 * `req`-less — see the transaction note at the top of this file.
 */
export function logActivity(payload: Payload, input: ActivityInput): void {
  setImmediate(async () => {
    try {
      await payload.create({
        collection: 'activity',
        data: {
          occurredAt: new Date().toISOString(),
          ...input,
        } as any,
        // No `req`: a separate transaction, so a failure here cannot roll back
        // the write that triggered it.
        context: { skipActivityLog: true },
      })
    } catch (error) {
      payload.logger.error(`[Activity] Failed to record ${input.kind}: ${error}`)
    }
  })
}

// ─── Name resolution ─────────────────────────────────────────────────────────
// Relationship fields arrive either populated or as bare ids depending on the
// depth of the operation that fired the hook. Resolving lazily inside the
// deferred closure keeps the parent operation free of the extra read.

const clientLabel = (ca: any): string | null =>
  (ca && (ca.company || ca.name || ca.firstName || ca.email)) || null

async function resolveClientName(payload: Payload, ref: unknown): Promise<string | null> {
  if (!ref) return null
  if (typeof ref === 'object') return clientLabel(ref)
  try {
    const doc = await payload.findByID({
      collection: 'client-accounts',
      id: String(ref),
      depth: 0,
      select: { name: true, company: true, firstName: true, email: true } as any,
    })
    return clientLabel(doc)
  } catch {
    return null
  }
}

/** Same fire-and-forget contract as logActivity, with a name lookup first. */
function logActivityWithClientName(
  payload: Payload,
  clientRef: unknown,
  build: (clientName: string | null) => ActivityInput,
): void {
  setImmediate(async () => {
    try {
      const clientName = await resolveClientName(payload, clientRef)
      await payload.create({
        collection: 'activity',
        data: { occurredAt: new Date().toISOString(), ...build(clientName) } as any,
        context: { skipActivityLog: true },
      })
    } catch (error) {
      payload.logger.error(`[Activity] Failed to record event: ${error}`)
    }
  })
}

// ─── Orders: new invoice ─────────────────────────────────────────────────────

const money = (n: unknown): string =>
  typeof n === 'number'
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n)
    : ''

export const trackOrderActivity: CollectionAfterChangeHook = ({
  doc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'create') return doc
  if (context?.skipActivityLog) return doc

  const { payload } = req
  const clientRef = doc.clientAccount
  const who = actorFrom(req)
  const clientId = relId(clientRef)

  logActivityWithClientName(payload, clientRef, (clientName) => ({
    kind: 'order-created',
    title: doc.orderNumber ? `Invoice ${doc.orderNumber}` : 'New invoice',
    summary: [clientName, money(doc.amount)].filter(Boolean).join(' · ') || null,
    href: clientId ? `/clients/${clientId}` : null,
    status: doc.status ?? null,
    amount: typeof doc.amount === 'number' ? doc.amount : null,
    clientAccount: clientId,
    order: relId(doc),
    project: relId(doc.project),
    ...who,
  }))

  return doc
}

// ─── Projects: created, and meaningfully updated ─────────────────────────────

const dateLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const fmtDate = (v: unknown): string | null => {
  if (!v) return null
  const d = new Date(v as string)
  return Number.isNaN(d.getTime()) ? null : dateLabel.format(d)
}

const fmtText = (v: unknown): string | null => (v == null || v === '' ? null : String(v))

const fmtMoney = (v: unknown): string | null => (typeof v === 'number' ? money(v) : null)

/**
 * The fields worth a feed row. Everything else on a project — description,
 * notes, arbitrary text — changes constantly and is noise here.
 */
const TRACKED_PROJECT_FIELDS: Array<{
  name: string
  label: string
  format: (v: unknown) => string | null
}> = [
  { name: 'name', label: 'Name', format: fmtText },
  { name: 'status', label: 'Status', format: fmtText },
  { name: 'startDate', label: 'Start date', format: fmtDate },
  { name: 'projectedEndDate', label: 'Projected end', format: fmtDate },
  { name: 'actualEndDate', label: 'Actual end', format: fmtDate },
  { name: 'budgetAmount', label: 'Budget', format: fmtMoney },
  { name: 'currency', label: 'Currency', format: fmtText },
]

const milestoneSummary = (milestones: unknown): string | null => {
  if (!Array.isArray(milestones)) return null
  const done = milestones.filter((m: any) => m?.completed).length
  return `${milestones.length} · ${done} done`
}

function diffProject(doc: any, previousDoc: any): ActivityInput['changes'] {
  const changes: NonNullable<ActivityInput['changes']> = []

  for (const field of TRACKED_PROJECT_FIELDS) {
    const before = field.format(previousDoc?.[field.name])
    const after = field.format(doc?.[field.name])
    if (before !== after) changes.push({ field: field.label, from: before, to: after })
  }

  // Milestones are an array — a per-element diff would be noise, so the row
  // records the shape change (how many, how many done) instead.
  const beforeMs = milestoneSummary(previousDoc?.milestones)
  const afterMs = milestoneSummary(doc?.milestones)
  if (beforeMs !== afterMs) changes.push({ field: 'Milestones', from: beforeMs, to: afterMs })

  return changes
}

export const trackProjectActivity: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (context?.skipActivityLog) return doc

  const { payload } = req
  const who = actorFrom(req)
  const clientRef = doc.client
  const clientId = relId(clientRef)
  const projectId = relId(doc)

  if (operation === 'create') {
    logActivityWithClientName(payload, clientRef, (clientName) => ({
      kind: 'project-created',
      title: doc.name || 'New project',
      summary: clientName,
      href: projectId ? `/projects/${projectId}` : null,
      status: doc.status ?? null,
      clientAccount: clientId,
      project: projectId,
      ...who,
    }))
    return doc
  }

  const changes = diffProject(doc, previousDoc)
  // Nothing meaningful moved — a description tweak or a touched updatedAt.
  if (!changes || changes.length === 0) return doc

  logActivity(payload, {
    kind: 'project-updated',
    title: doc.name || 'Project updated',
    summary: changes.map((c) => c.field).join(', '),
    href: projectId ? `/projects/${projectId}` : null,
    status: doc.status ?? null,
    clientAccount: clientId,
    project: projectId,
    changes,
    ...who,
  })

  return doc
}

// ─── Retainers: hours logged ─────────────────────────────────────────────────
// "A log added" is a `retainer-time-entries` create. `status: 'draft'` entries
// are *planned* work with estimated hours and never count against the cap
// (see RetainerTimeEntries.ts), so they are labelled as planned in the feed
// rather than reported as time spent.

export const trackRetainerLogActivity: CollectionAfterChangeHook = ({
  doc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'create') return doc
  if (context?.skipActivityLog) return doc

  const { payload } = req
  const who = actorFrom(req)
  const clientRef = doc.clientAccount
  const clientId = relId(clientRef)
  const hours = typeof doc.hours === 'number' ? doc.hours : null
  const planned = doc.status === 'draft'

  logActivityWithClientName(payload, clientRef, (clientName) => ({
    kind: 'retainer-log',
    title: planned
      ? `${hours ?? 0}h planned`
      : `${hours ?? 0}h logged`,
    summary:
      [clientName, doc.description || doc.category].filter(Boolean).join(' · ') || null,
    href: clientId ? `/clients/${clientId}` : null,
    status: doc.status ?? null,
    amount: hours,
    clientAccount: clientId,
    retainer: relId(doc.retainer),
    // loggedBy is the truth for a retainer entry; req.user is the fallback.
    actor: relId(doc.loggedBy) ?? who.actor,
    actorName: personName(doc.loggedBy) ?? who.actorName,
  }))

  return doc
}

// ─── Emails ──────────────────────────────────────────────────────────────────
// Every send in the app goes through `payload.sendEmail()`, which is the
// initialized email adapter's `sendEmail`. Wrapping the adapter once in
// payload.config.ts therefore captures all ~30 send sites — the API routes, the
// server actions in src/actions/, the invoice/receipt templates in
// src/lib/payload/utils/, and the Users hooks — with no per-call-site edits and
// no way for a future send site to be forgotten.

const firstRecipient = (to: unknown): { address: string | null; count: number } => {
  const one = (v: any): string | null => {
    if (!v) return null
    if (typeof v === 'string') return v
    if (typeof v === 'object' && v.address) return String(v.address)
    return null
  }
  if (Array.isArray(to)) {
    const addresses = to.map(one).filter(Boolean) as string[]
    return { address: addresses[0] ?? null, count: addresses.length }
  }
  const address = one(to)
  return { address, count: address ? 1 : 0 }
}

/**
 * Best-effort "about which record": the recipient address is matched against
 * users (then client accounts) so the row can be filed under a client. Both
 * lookups are on indexed `email` fields, limit 1, and run outside any request
 * transaction.
 */
async function resolveEmailSubject(
  payload: Payload,
  address: string,
): Promise<{ clientAccount: string | null; clientName: string | null }> {
  try {
    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: address } },
      depth: 0,
      limit: 1,
      select: { clientAccount: true, firstName: true, lastName: true, email: true } as any,
    })
    const user = docs[0] as any
    if (user?.clientAccount) {
      const id = relId(user.clientAccount)
      return { clientAccount: id, clientName: await resolveClientName(payload, id) }
    }
  } catch {
    /* fall through to the client-account lookup */
  }

  try {
    const { docs } = await payload.find({
      collection: 'client-accounts',
      where: { email: { equals: address } },
      depth: 0,
      limit: 1,
      select: { name: true, company: true, firstName: true, email: true } as any,
    })
    const account = docs[0] as any
    if (account) return { clientAccount: String(account.id), clientName: clientLabel(account) }
  } catch {
    /* unresolvable — the row still records subject + recipient */
  }

  return { clientAccount: null, clientName: null }
}

/** Called by the adapter wrapper after a successful send. Never throws. */
export function recordEmailActivity(
  payload: Payload,
  message: { to?: unknown; subject?: string | null },
): void {
  setImmediate(async () => {
    try {
      const { address, count } = firstRecipient(message.to)
      if (!address) return

      const { clientAccount, clientName } = await resolveEmailSubject(payload, address)
      const others = count > 1 ? ` +${count - 1} more` : ''

      await payload.create({
        collection: 'activity',
        data: {
          occurredAt: new Date().toISOString(),
          kind: 'email-sent',
          title: message.subject || 'Email sent',
          summary: `To ${clientName ? `${clientName} · ` : ''}${address}${others}`,
          recipient: address,
          clientAccount,
        } as any,
        context: { skipActivityLog: true },
      })
    } catch (error) {
      payload.logger.error(`[Activity] Failed to record sent email: ${error}`)
    }
  })
}
