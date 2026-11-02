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
 * `payload.auth({ headers })`, which reads the inbound `Authorization` header (OAuth Bearer or
 * `users API-Key`). So they authenticate the agent exactly as they
 * authenticate a logged-in staff member in the browser, with no separate code path.
 *
 * ── What is deliberately NOT here ────────────────────────────────────────────────
 * Nothing that moves money or reaches a client. No order creation, no Stripe call, no
 * invoice, no email send. The shared MCP account is read-only on prices, Stripe ids, and
 * payment links: every write tool goes through `guardedWrite` (field allowlist + money
 * scan + required `actor`, see writeGuard.ts / actor.ts) and leaves an `agent-write`
 * activity row. The agent drafts; a human opens the composer, reads it, and
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
import {
  createTrackedTask,
  updateTrackedTask,
  listTrackedTasks,
  getPackageOverview,
  getProjectProgress,
} from '@/actions/taskTracking'
import type { SowFormData } from '@/lib/document-generators'
import { ACTOR } from '@/lib/mcp/actor'
import { checkWriteInput, prepareSowSave } from '@/lib/mcp/writeGuard'
import { runAsMcp } from '@/lib/payload/access/mcpMoney'
import { recordAgentWrite, targetIdOf } from '@/lib/mcp/audit'

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
    // Every Payload call the action makes is marked as an MCP request, so the
    // Payload-level money guard (access/mcpMoney.ts) applies to it.
    const res = await runAsMcp(fn)
    if (!res?.success) return text({ error: res?.error ?? 'Action failed' }, true)
    return text(res)
  } catch (error) {
    return text({ error: error instanceof Error ? error.message : 'Unexpected error' }, true)
  }
}

/**
 * Wrap a write tool: require `actor`, enforce the field allowlist and the
 * price/Stripe read-only rule (see writeGuard.ts), run the action without
 * `actor`, and record one `agent-write` activity row either way.
 */
function guardedWrite<I extends Record<string, unknown>>(
  tool: string,
  handler: (input: I, actor: string) => Promise<ToolResult>,
): (input: I & { actor: string }) => Promise<ToolResult> {
  return (input) => runAsMcp(async () => {
    const { actor, ...rest } = input
    const check = checkWriteInput(tool, input)
    if (!check.ok) {
      await recordAgentWrite({ actor, tool, ok: false, targetId: targetIdOf(rest), error: check.error })
      return text({ error: check.error }, true)
    }
    const res = await handler(rest as unknown as I, actor)
    await recordAgentWrite({
      actor,
      tool,
      ok: !res.isError,
      targetId: targetIdOf(rest),
      error: res.isError ? res.content[0]?.text : null,
    })
    return res
  })
}

/** Input schema for a write tool: its own fields plus a required `actor`; unknown keys are rejected. */
const writeSchema = <S extends z.ZodRawShape>(shape: S) => z.object({ ...shape, actor: ACTOR }).strict()

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
      inputSchema: writeSchema({
        clientAccountId: z.string(),
        ref: z.string().optional().describe('Any ISO date inside the cycle being recapped.'),
        recap: RECAP_NARRATIVE,
      }),
    },
    guardedWrite('save_recap_draft', async ({ clientAccountId, ref, recap }) =>
      run(() =>
        saveRecapDraft({
          clientAccountId,
          ref,
          recap: recap as Partial<RecapData>,
          source: 'agent',
        }),
      ),
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
      inputSchema: writeSchema({
        retainerId: z.string(),
        clientAccountId: z.string(),
        date: z.string().describe('ISO date the work happened.'),
        hours: z.number().positive(),
        category: CATEGORY.optional(),
        priority: PRIORITY.optional(),
        description: z.string().optional(),
      }),
    },
    guardedWrite('log_work', async (input) => run(() => logHours(input))),
  )

  server.registerTool(
    'create_draft_entry',
    {
      title: 'Plan work (draft entry)',
      description:
        'Add planned, not-yet-done work. Drafts carry an hour estimate but never count against the cap, and ' +
        "they seed the next cycle's priorities in its recap.",
      inputSchema: writeSchema({
        retainerId: z.string(),
        clientAccountId: z.string(),
        date: z.string().describe('ISO date the work is planned for.'),
        description: z.string(),
        category: CATEGORY.optional(),
        priority: PRIORITY.optional(),
        hours: z.number().optional().describe('Estimated hours.'),
      }),
    },
    guardedWrite('create_draft_entry', async (input) => run(() => createDraft(input))),
  )

  server.registerTool(
    'update_time_entry',
    {
      title: 'Edit a time entry',
      description:
        'Amend an existing entry — most usefully, rewrite a terse description into something client-readable, ' +
        'which improves this recap and every future one. Entries on a closed retainer are billed history and ' +
        'are rejected.',
      inputSchema: writeSchema({
        id: z.string(),
        date: z.string().optional(),
        hours: z.number().optional(),
        category: CATEGORY.optional(),
        priority: PRIORITY.optional(),
        completion: z.enum(['incomplete', 'complete']).optional(),
        description: z.string().optional(),
      }),
    },
    guardedWrite('update_time_entry', async (input) => run(() => updateTimeEntry(input))),
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
        'it is not assigned to a client and nothing is billed. Prices are read-only over MCP: every line is ' +
        'created at $0 and staff set prices in the portal. Sending a price is rejected.',
      inputSchema: writeSchema({
        name: z.string(),
        description: z.string().optional(),
        coverMessage: z.string().optional(),
        notes: z.string().optional().describe('Internal notes — not client-facing.'),
        lineItems: z.array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            quantity: z.number().optional(),
            isRecurring: z.boolean().optional(),
            recurringInterval: z.enum(['month', 'year']).optional(),
          })
          // strict: a `price`/`stripePriceId` on a line is rejected, not silently dropped.
          .strict(),
        ),
      }),
    },
    guardedWrite('create_package', async ({ lineItems, ...rest }) =>
      // Prices are not writable over MCP: every line starts at $0 for staff to price.
      run(() => createPackage({ ...rest, lineItems: lineItems.map((item) => ({ ...item, price: 0 })) })),
    ),
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
        'whole-document replace, not a merge. Saving does not send it to anyone. Money fields (line items, payment ' +
        'schedule, rates, fees, money clauses) are read-only: send them back unchanged or leave them out.',
      inputSchema: writeSchema({
        packageId: z.string(),
        sowData: z
          .record(z.string(), z.unknown())
          .describe('The full SowFormData object, shaped exactly as get_sow_draft returned it.'),
      }),
    },
    guardedWrite('save_sow', async ({ packageId, sowData }) => {
      // The SOW carries prices it was handed by get_sow_draft. They may come back
      // unchanged or be left out (the stored value is kept); any change is
      // rejected (writeGuard.ts prepareSowSave).
      const current = await getPackageSowDraft(packageId)
      if (!current.success) return text({ error: current.error ?? 'Package not found' }, true)
      const prepared = prepareSowSave(current.sowData as unknown as Record<string, unknown>, sowData)
      if (!prepared.ok) return text({ error: prepared.error }, true)
      return run(() => savePackageSowDocument(packageId, prepared.sowData as unknown as SowFormData))
    }),
  )

  // ── Milestones ────────────────────────────────────────────────────────────────

  server.registerTool(
    'create_milestone',
    {
      title: 'Create a project milestone',
      description: 'Add a milestone to a project.',
      inputSchema: writeSchema({
        projectId: z.string(),
        title: z.string(),
        date: z.string().describe('ISO target date.'),
        description: z.string().optional(),
      }),
    },
    guardedWrite('create_milestone', async (input) =>
      run(() => createMilestone(input) as Promise<{ success: boolean; error?: string }>),
    ),
  )

  server.registerTool(
    'update_milestone',
    {
      title: 'Update a project milestone',
      description:
        'Replace a milestone by its index in the project. `title` and `date` are required — this overwrites the ' +
        'row, so carry forward any value you are not changing.',
      inputSchema: writeSchema({
        projectId: z.string(),
        milestoneIndex: z.number().int().min(0),
        title: z.string(),
        date: z.string(),
        description: z.string().optional(),
        completed: z.boolean().optional(),
      }),
    },
    guardedWrite('update_milestone', async (input) =>
      run(() => updateMilestone(input) as Promise<{ success: boolean; error?: string }>),
    ),
  )

  server.registerTool(
    'toggle_milestone',
    {
      title: 'Toggle milestone completion',
      description: 'Flip a milestone between complete and incomplete by its index.',
      inputSchema: writeSchema({
        projectId: z.string(),
        milestoneIndex: z.number().int().min(0),
      }),
    },
    guardedWrite('toggle_milestone', async (input) =>
      run(() => toggleMilestoneCompletion(input) as Promise<{ success: boolean; error?: string }>),
    ),
  )

  // ── Tasks & progress (plan step 2) ─────────────────────────────────────────────

  const TASK_STATUS = z.enum(['pending', 'in-progress', 'completed', 'cancelled'])
  const TASK_PRIORITY = z.enum(['low', 'medium', 'high', 'urgent'])
  const QA = z
    .object({
      status: z.enum(['pending', 'pass', 'fail']).optional(),
      commit: z.string().optional().describe('Full commit hash QA ran against.'),
      date: z.string().optional().describe('ISO date of the QA verdict.'),
      reportLink: z.string().optional().describe('Link to the QA report (Drive Team/QA/<branch> or #qa post).'),
    })
    .strict()
  const OWNER_BOT = ACTOR.describe('Bot (or ccq task id) that owns this task.')
  const CCQ_ID = z.string().regex(/^T\d{6}-\d{6}$/).describe('ccq queue id, e.g. T261101-232341.')

  server.registerTool(
    'task_create',
    {
      title: 'Create a task',
      description:
        'Create a work item on a package and/or project. Pass packageId to file it under a package; the project is ' +
        "taken from the package's linked project, or pass projectId. A task with a ccqTaskId is a tracked dev task: " +
        'it can only be completed once qa.status is "pass" with qa.commit set.',
      inputSchema: writeSchema({
        title: z.string().min(1),
        description: z.string().optional().describe('Plain text; one paragraph per line.'),
        packageId: z.string().optional(),
        projectId: z.string().optional(),
        status: TASK_STATUS.optional(),
        priority: TASK_PRIORITY.optional(),
        dueDate: z.string().optional().describe('ISO date.'),
        ownerBot: OWNER_BOT.optional(),
        ccqTaskId: CCQ_ID.optional(),
        qa: QA.optional(),
      }),
    },
    guardedWrite('task_create', async (input, actor) => run(() => createTrackedTask({ ...input, actor }))),
  )

  server.registerTool(
    'task_update',
    {
      title: 'Update a task',
      description:
        'Change a task: status, owner, links, QA record. Only the fields you pass change; `qa` is merged into the ' +
        'existing QA record. Completing a tracked task (one with a ccqTaskId) needs qa.status "pass" and qa.commit.',
      inputSchema: writeSchema({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        packageId: z.string().nullable().optional(),
        projectId: z.string().optional(),
        status: TASK_STATUS.optional(),
        priority: TASK_PRIORITY.optional(),
        dueDate: z.string().nullable().optional(),
        ownerBot: OWNER_BOT.nullable().optional(),
        ccqTaskId: CCQ_ID.nullable().optional(),
        qa: QA.optional(),
      }),
    },
    guardedWrite('task_update', async (input, actor) => run(() => updateTrackedTask({ ...input, actor }))),
  )

  server.registerTool(
    'task_list',
    {
      title: 'List tasks',
      description:
        'Tasks, newest-updated first, filtered by package, project, client account, status (one or several), owner ' +
        'bot or ccq id. Paged: limit (default 25, max 100) and page.',
      inputSchema: z
        .object({
          packageId: z.string().optional(),
          projectId: z.string().optional(),
          clientAccountId: z.string().optional(),
          status: z.union([TASK_STATUS, z.array(TASK_STATUS)]).optional(),
          ownerBot: z.string().optional(),
          ccqTaskId: z.string().optional(),
          limit: z.number().int().min(1).max(100).optional(),
          page: z.number().int().min(1).optional(),
        })
        .strict(),
    },
    async (input) => run(() => listTrackedTasks(input)),
  )

  server.registerTool(
    'get_package',
    {
      title: 'Get package progress',
      description:
        "One package with its tasks, its project's milestones, and progress (tasks and milestones done/total, " +
        'percent). Line items are listed by name and quantity only; no prices.',
      inputSchema: z.object({ packageId: z.string() }).strict(),
    },
    async ({ packageId }) => run(() => getPackageOverview(packageId)),
  )

  server.registerTool(
    'get_project_progress',
    {
      title: 'Get project progress',
      description:
        'One project: milestones, open tasks, task counts by status, and progress percent (tasks + milestones).',
      inputSchema: z.object({ projectId: z.string() }).strict(),
    },
    async ({ projectId }) => run(() => getProjectProgress(projectId)),
  )
}
