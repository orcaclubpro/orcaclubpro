/**
 * MCP tool surface for ORCACLUB staff operations.
 *
 * Every tool here is a thin wrapper over an existing server action in `src/actions/`.
 * That is deliberate: the actions already carry the auth checks, the hook-safe Payload
 * calls, and the business rules (cap math, cycle anchoring, closed-retainer guards).
 * Re-implementing any of it against the Local API would mean maintaining two versions
 * of the same rule and eventually disagreeing with the app.
 *
 * The actions resolve their own caller via `getCurrentUser()` →
 * `payload.auth({ headers })`, which reads the `Authorization: users API-Key <key>`
 * header on the inbound MCP request. So they authenticate the agent exactly as they
 * authenticate a logged-in staff member in the browser, with no separate code path.
 *
 * ── What is deliberately NOT here ────────────────────────────────────────────────
 * Nothing that moves money or reaches a client. No order creation, no Stripe call, no
 * invoice, no email send. The agent drafts; a human opens the composer, reads it, and
 * sends. `save_recap_draft` writes narrative to a review queue — it is not a send.
 */
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import {
  getRetainerPortfolio,
  getRetainerSummary,
  getRecapModel,
  getScopeRecapModel,
  saveRecapDraft,
  logHours,
  createDraft,
  updateTimeEntry,
} from '@/actions/retainers'
import type { RecapData } from '@/lib/retainers/recap'
import {
  getClientAccountsList,
  getPackages,
  createPackage,
  getPackageSowDraft,
  savePackageSowDocument,
} from '@/actions/packages'
import { createMilestone, updateMilestone, toggleMilestoneCompletion } from '@/actions/projects'
import type { SowFormData } from '@/lib/document-generators'

// ── Result plumbing ─────────────────────────────────────────────────────────────

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

/** JSON-encode a value as MCP text content. */
function text(value: unknown, isError = false): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    ...(isError ? { isError: true } : {}),
  }
}

/**
 * Adapt an action's `{ success, ... }` envelope to an MCP result. A failed action is
 * surfaced as `isError` with its own message rather than thrown, so the agent can read
 * the reason ("No active retainer cycle to recap") and choose a different move instead
 * of seeing an opaque transport failure.
 */
async function run<T extends { success: boolean; error?: string }>(fn: () => Promise<T>): Promise<ToolResult> {
  try {
    const res = await fn()
    if (!res?.success) return text({ error: res?.error ?? 'Action failed' }, true)
    return text(res)
  } catch (error) {
    return text({ error: error instanceof Error ? error.message : 'Unexpected error' }, true)
  }
}

// ── Shared shapes ───────────────────────────────────────────────────────────────

const CATEGORY = z.enum(['work', 'meeting', 'revision', 'reporting'])
const PRIORITY = z.enum(['low', 'medium', 'high'])

/**
 * The narrative half of a recap — exactly the fields `deriveRecapDefaults` leaves blank
 * for a human to write, and the only fields `saveRecapDraft` persists. Every number
 * (hours used/unused, items shipped, per-bucket hours, plan terms) is absent on purpose:
 * `mergeRecap` re-derives those from the cycle and is authoritative on them, so there is
 * no field here through which a wrong number could reach a client.
 */
const RECAP_NARRATIVE = z.object({
  headline: z.string().optional().describe('One-line summary of the month, client-facing.'),
  bucketsHeadline: z.string().optional().describe('Lead-in above the "where the hours went" breakdown.'),
  siteHealth: z
    .object({ label: z.string(), note: z.string() })
    .optional()
    .describe('Site health verdict, e.g. label "Healthy" plus a sentence of evidence.'),
  openRequests: z
    .object({ count: z.number(), note: z.string() })
    .optional()
    .describe('Count of outstanding client requests and a note on their status.'),
  buckets: z
    .array(z.object({ label: z.string(), note: z.string() }))
    .optional()
    .describe(
      'Per-category narrative, in the SAME ORDER as the buckets returned by get_recap_draft — ' +
        'they are zipped by index onto server-authoritative hours. Do not add, drop, or reorder rows.',
    ),
  showCampaigns: z.boolean().optional(),
  campaigns: z
    .array(z.object({ channel: z.string(), title: z.string(), note: z.string() }))
    .optional()
    .describe('Growth/Enterprise tiers only — campaign work shipped this cycle.'),
  recommendations: z
    .array(z.object({ title: z.string(), note: z.string() }))
    .optional()
    .describe('What the client should do next, and why. Usually three.'),
  notesDecided: z.array(z.string()).optional().describe('Decisions reached this cycle.'),
  notesOpen: z.array(z.string()).optional().describe('Questions still open.'),
  nextMonthPriorities: z.array(z.string()).optional().describe('What next cycle leads with.'),
  asksFromClient: z.array(z.string()).optional().describe('What is needed from the client to proceed.'),
  nextCallLabel: z.string().optional().describe('When the next check-in is, e.g. "Week of Oct 6".'),
})

// ── Registration ────────────────────────────────────────────────────────────────

export function registerOrcaclubTools(server: McpServer): void {
  // ── Context ───────────────────────────────────────────────────────────────────

  server.registerTool(
    'list_clients',
    {
      title: 'List client accounts',
      description: 'Every client account with its id, name, and company. Start here to resolve a name to an id.',
      inputSchema: z.object({}),
    },
    async () => run(() => getClientAccountsList()),
  )

  server.registerTool(
    'get_retainer_portfolio',
    {
      title: 'Retainer portfolio',
      description:
        'All retainers with their tier, cycle, hours used against cap, and health ' +
        '(healthy | warning | over | open | scoping). The fastest way to see which clients need a recap.',
      inputSchema: z.object({}),
    },
    async () => run(() => getRetainerPortfolio()),
  )

  server.registerTool(
    'get_retainer_summary',
    {
      title: 'Retainer cycle detail',
      description:
        'One retainer for one cycle: plan terms, the cycle window, every logged and draft time entry, ' +
        'and hour totals by category. This is the raw material a recap is written from.',
      inputSchema: z.object({
        clientAccountId: z.string(),
        ref: z
          .string()
          .optional()
          .describe('Any ISO date inside the cycle you want. Omit for the cycle happening now.'),
      }),
    },
    async ({ clientAccountId, ref }) => run(() => getRetainerSummary(clientAccountId, ref)),
  )

  // ── Reporting ─────────────────────────────────────────────────────────────────

  server.registerTool(
    'get_recap_draft',
    {
      title: 'Get recap draft',
      description:
        "A cycle's recap: all numbers already derived (hours used/unused, items shipped, per-bucket hours, " +
        'plan terms) plus the narrative fields, which arrive blank or lightly seeded from logged descriptions. ' +
        'Writing those narrative fields is the job. If a draft was saved earlier it is merged in and `draft` ' +
        'reports when and by what. Read the entries via get_retainer_summary first — the seeded bucket notes ' +
        'are raw joined descriptions, not prose.',
      inputSchema: z.object({
        clientAccountId: z.string(),
        ref: z.string().optional().describe('Any ISO date inside the cycle to recap. Omit for the current cycle.'),
      }),
    },
    async ({ clientAccountId, ref }) => run(() => getRecapModel(clientAccountId, ref)),
  )

  server.registerTool(
    'save_recap_draft',
    {
      title: 'Save recap draft',
      description:
        'Save recap narrative for staff review. This does NOT send anything — it fills the recap composer so ' +
        'a human can read, edit, and send it. Only narrative is stored; every number is re-derived from the ' +
        'cycle on read, so nothing here can alter an hour or a fee. Re-saving a cycle replaces its draft.',
      inputSchema: z.object({
        clientAccountId: z.string(),
        ref: z.string().optional().describe('Any ISO date inside the cycle being recapped.'),
        recap: RECAP_NARRATIVE,
      }),
    },
    async ({ clientAccountId, ref, recap }) =>
      run(() =>
        saveRecapDraft({
          clientAccountId,
          ref,
          recap: recap as Partial<RecapData>,
          source: 'agent',
        }),
      ),
  )

  server.registerTool(
    'get_scope_recap',
    {
      title: 'Get scope recap',
      description:
        'The scoping-stage recap for a retainer being pitched: planned work and evidence gathered so far, ' +
        'before a plan exists. Use for engagements with status `scoping`, which have no billing cycle yet.',
      inputSchema: z.object({ retainerId: z.string() }),
    },
    async ({ retainerId }) => run(() => getScopeRecapModel(retainerId)),
  )

  // ── Work logs ─────────────────────────────────────────────────────────────────

  server.registerTool(
    'log_work',
    {
      title: 'Log completed hours',
      description:
        'Record work already done. Logged hours count against the monthly cap. Write the description the way ' +
        'the client should read it — every recap seeds its bucket notes from these strings, so a terse entry ' +
        'costs you twice.',
      inputSchema: z.object({
        retainerId: z.string(),
        clientAccountId: z.string(),
        date: z.string().describe('ISO date the work happened.'),
        hours: z.number().positive(),
        category: CATEGORY.optional(),
        priority: PRIORITY.optional(),
        description: z.string().optional(),
      }),
    },
    async (input) => run(() => logHours(input)),
  )

  server.registerTool(
    'create_draft_entry',
    {
      title: 'Plan work (draft entry)',
      description:
        'Add planned, not-yet-done work. Drafts carry an hour estimate but never count against the cap, and ' +
        "they seed the next cycle's priorities in its recap.",
      inputSchema: z.object({
        retainerId: z.string(),
        clientAccountId: z.string(),
        date: z.string().describe('ISO date the work is planned for.'),
        description: z.string(),
        category: CATEGORY.optional(),
        priority: PRIORITY.optional(),
        hours: z.number().optional().describe('Estimated hours.'),
      }),
    },
    async (input) => run(() => createDraft(input)),
  )

  server.registerTool(
    'update_time_entry',
    {
      title: 'Edit a time entry',
      description:
        'Amend an existing entry — most usefully, rewrite a terse description into something client-readable, ' +
        'which improves this recap and every future one. Entries on a closed retainer are billed history and ' +
        'are rejected.',
      inputSchema: z.object({
        id: z.string(),
        date: z.string().optional(),
        hours: z.number().optional(),
        category: CATEGORY.optional(),
        priority: PRIORITY.optional(),
        completion: z.enum(['incomplete', 'complete']).optional(),
        description: z.string().optional(),
      }),
    },
    async (input) => run(() => updateTimeEntry(input)),
  )

  // ── Packages & SOW ────────────────────────────────────────────────────────────

  server.registerTool(
    'list_packages',
    {
      title: 'List packages',
      description: 'All packages and proposals with their status and line items.',
      inputSchema: z.object({}),
    },
    async () => run(() => getPackages()),
  )

  server.registerTool(
    'create_package',
    {
      title: 'Create a package template',
      description:
        'Create a draft package template with itemized lines. Created as type `template`, status `draft` — ' +
        'it is not assigned to a client and nothing is billed. Pricing is in dollars.',
      inputSchema: z.object({
        name: z.string(),
        description: z.string().optional(),
        coverMessage: z.string().optional(),
        notes: z.string().optional().describe('Internal notes — not client-facing.'),
        lineItems: z.array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            price: z.number().describe('USD.'),
            quantity: z.number().optional(),
            isRecurring: z.boolean().optional(),
            recurringInterval: z.enum(['month', 'year']).optional(),
          }),
        ),
      }),
    },
    async (input) => run(() => createPackage(input)),
  )

  server.registerTool(
    'get_sow_draft',
    {
      title: 'Get SOW draft',
      description:
        "A package's statement of work — scope items, deliverables, milestones, pricing, and terms. Returns the " +
        'saved document if one exists, otherwise a draft derived from the package. Always call this before ' +
        'save_sow and edit what comes back: save_sow replaces the whole document, so a partial payload drops fields.',
      inputSchema: z.object({ packageId: z.string() }),
    },
    async ({ packageId }) => run(() => getPackageSowDraft(packageId)),
  )

  server.registerTool(
    'save_sow',
    {
      title: 'Save SOW',
      description:
        'Write a package SOW. Pass the COMPLETE document from get_sow_draft with your edits applied — this is a ' +
        'whole-document replace, not a merge. Saving does not send it to anyone.',
      inputSchema: z.object({
        packageId: z.string(),
        sowData: z
          .record(z.string(), z.unknown())
          .describe('The full SowFormData object, shaped exactly as get_sow_draft returned it.'),
      }),
    },
    async ({ packageId, sowData }) =>
      run(() => savePackageSowDocument(packageId, sowData as unknown as SowFormData)),
  )

  // ── Milestones ────────────────────────────────────────────────────────────────

  server.registerTool(
    'create_milestone',
    {
      title: 'Create a project milestone',
      description: 'Add a milestone to a project.',
      inputSchema: z.object({
        projectId: z.string(),
        title: z.string(),
        date: z.string().describe('ISO target date.'),
        description: z.string().optional(),
      }),
    },
    async (input) => run(() => createMilestone(input) as Promise<{ success: boolean; error?: string }>),
  )

  server.registerTool(
    'update_milestone',
    {
      title: 'Update a project milestone',
      description:
        'Replace a milestone by its index in the project. `title` and `date` are required — this overwrites the ' +
        'row, so carry forward any value you are not changing.',
      inputSchema: z.object({
        projectId: z.string(),
        milestoneIndex: z.number().int().min(0),
        title: z.string(),
        date: z.string(),
        description: z.string().optional(),
        completed: z.boolean().optional(),
      }),
    },
    async (input) => run(() => updateMilestone(input) as Promise<{ success: boolean; error?: string }>),
  )

  server.registerTool(
    'toggle_milestone',
    {
      title: 'Toggle milestone completion',
      description: 'Flip a milestone between complete and incomplete by its index.',
      inputSchema: z.object({
        projectId: z.string(),
        milestoneIndex: z.number().int().min(0),
      }),
    },
    async (input) =>
      run(() => toggleMilestoneCompletion(input) as Promise<{ success: boolean; error?: string }>),
  )
}
