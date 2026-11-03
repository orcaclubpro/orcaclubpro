import { APIError } from 'payload'
import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { adminOnly, adminOrAssigned, adminOrUser, staffOnlyField } from '../access'
import { botContextField, guardBotContextWrite, stripBotContext } from '../fields/botContext'
import { restoreStaffOnly, stripStaffOnly } from '../fields/staffOnlyFields'
import { isValidActor } from '@/lib/mcp/actor'
import { closeGateMissing } from '@/lib/tasks/structure'

/**
 * Bot-tracking fields: internal, never shown to clients (stripped from non-staff
 * reads, restored on non-staff writes; see fields/staffOnlyFields.ts).
 */
export const TASK_TRACKING_FIELDS = [
  'ownerBot',
  'ccqTaskId',
  'qa',
  'lastActor',
  'claimedBy',
  'claimedAt',
  'leaseExpiresAt',
  // Structured task fields (board 6aea1fd4): internal working context, staff only.
  'ask',
  'lead',
  'askUpdates',
  'deliverables',
  'checklist',
  'changes',
  'screens',
  'version',
] as const

const STAFF_ONLY = { read: staffOnlyField, create: staffOnlyField, update: staffOnlyField }

/**
 * A tracked dev task (one with a `ccqTaskId`) can only be completed once QA has
 * passed it on a recorded commit. Ordinary portal tasks are unaffected.
 */
export const requireQaPassToComplete: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data
  const merged = { ...(originalDoc ?? {}), ...data } as Record<string, any>
  const completing = data.status === 'completed' && originalDoc?.status !== 'completed'
  if (completing && merged.ccqTaskId) {
    const qa = (merged.qa ?? {}) as { status?: string; commit?: string }
    if (qa.status !== 'pass' || !qa.commit) {
      throw new APIError(
        `Task ${merged.ccqTaskId} cannot be completed: qa.status must be "pass" with qa.commit set ` +
          `(got status "${qa.status ?? 'none'}", commit "${qa.commit ?? ''}").`,
        400,
      )
    }
  }
  return data
}

/**
 * `ask` is the request in the asker's words, locked once set: a later ask is a
 * new row in changes[], never an edit. Setting it on a task that has none (the
 * backfill, or the first structured write on an old task) is allowed. Scripts
 * that must correct one pass `context: { unlockAsk: true }`.
 */
export const lockAsk: CollectionBeforeChangeHook = ({ data, originalDoc, context }) => {
  if (!data || data.ask === undefined || context?.unlockAsk) return data
  const before = typeof originalDoc?.ask === 'string' ? originalDoc.ask.trim() : ''
  const after = typeof data.ask === 'string' ? data.ask.trim() : ''
  if (before && after !== before) {
    throw new APIError('The ask is locked once set; add the new request to changes[] (task_add_items) instead.', 400)
  }
  return data
}

/**
 * askUpdates[] and changes[] are append-only: an update must keep every existing
 * row (same id, same order) at the front. Scripts that must repair one pass
 * `context: { unlockNotes: true }`.
 */
export const appendOnlyNotes: CollectionBeforeChangeHook = ({ data, originalDoc, context }) => {
  if (!data || !originalDoc || context?.unlockNotes) return data
  for (const key of ['askUpdates', 'changes'] as const) {
    if (data[key] === undefined) continue
    const before: { id?: string }[] = Array.isArray(originalDoc[key]) ? originalDoc[key] : []
    const after: { id?: string }[] = Array.isArray(data[key]) ? data[key] : []
    const kept = before.every((row, i) => after[i] && String(after[i].id) === String(row.id))
    if (!kept) throw new APIError(`${key} is append-only; add rows with task_add_items.`, 400)
  }
  return data
}

/**
 * Close gate (board 6aea1fd4): a task completes only when every non-dropped
 * deliverable and checklist item is done (all lanes: dev, cm, fin, bots), and a
 * task touching prices, terms, hours, invoices or tax carries a [fin] money check
 * item. Legacy tasks with no structured items are not gated here.
 */
export const closeGate: CollectionBeforeChangeHook = ({ data, originalDoc, context }) => {
  if (!data || data.status !== 'completed' || originalDoc?.status === 'completed' || context?.skipCloseGate) return data
  const merged = { ...(originalDoc ?? {}), ...data }
  const missing = closeGateMissing(merged)
  if (missing.length) {
    throw new APIError(`Task can't complete yet; still open: ${missing.slice(0, 10).join('; ')}${missing.length > 10 ? ` (+${missing.length - 10} more)` : ''}`, 400)
  }
  return data
}

/**
 * A task sent back to `pending` is free again: drop its claim and lease so the
 * next task_claim sees a clean task. The claim itself is set only by task_claim
 * (src/lib/tasks/claim.ts), with a conditional update that skips these hooks.
 */
export const clearClaimOnRelease: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data
  if (data.status === 'pending' && originalDoc && originalDoc.status !== 'pending') {
    data.claimedBy = null
    data.claimedAt = null
    data.leaseExpiresAt = null
  }
  return data
}

/**
 * Tasks Collection
 *
 * Represents tasks in the spac4es project management system.
 * Features:
 * - Tasks belong to a project and are assigned to a user
 * - Status tracking (pending, in-progress, completed, cancelled)
 * - Priority levels (low, medium, high, urgent)
 * - Optional sprint assignment
 * - Time tracking (estimated and actual hours)
 * - Automatic completedAt timestamp when task is marked complete
 * - Role-based access control (admins see all, users see assigned tasks)
 */

/**
 * Hook: Automatically set completedAt when status changes to 'completed'
 */
const setCompletedAtOnCompletion: CollectionBeforeChangeHook = ({ data }) => {
  if (data.status === 'completed' && !data.completedAt) {
    data.completedAt = new Date()
  }

  // Clear completedAt if status reverts from 'completed'
  if (data.status !== 'completed' && data.completedAt) {
    data.completedAt = null
  }

  return data
}

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'priority', 'project', 'assignedTo', 'dueDate'],
    group: 'Project Management',
    description: 'Manage tasks within projects with status, priority, and time tracking',
  },
  access: {
    create: adminOrUser, // Only admin/user can create tasks
    read: adminOrAssigned, // Admins see all, users see assigned tasks
    update: adminOrAssigned, // Admins can update all, users can update assigned tasks
    delete: adminOnly, // Only admins can delete tasks
  },
  hooks: {
    // restoreStaffOnly first, so the QA gate sees the stored ccqTaskId/qa even on
    // a non-staff write.
    beforeChange: [
      restoreStaffOnly('tasks', TASK_TRACKING_FIELDS),
      requireQaPassToComplete,
      setCompletedAtOnCompletion,
      clearClaimOnRelease,
      lockAsk,
      appendOnlyNotes,
      closeGate,
      guardBotContextWrite,
    ],
    afterRead: [stripBotContext, stripStaffOnly(TASK_TRACKING_FIELDS)],
  },
  indexes: [
    // Dashboard queries: tasks by assignee filtered by status / sorted by due date
    { fields: ['assignedTo', 'status'] },
    { fields: ['assignedTo', 'dueDate'] },
    // MCP task_list filters: by package or project, then status.
    { fields: ['package', 'status'] },
    { fields: ['project', 'status'] },
  ],
  fields: [
    // ============================================================================
    // BASIC INFORMATION
    // ============================================================================

    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Task title or summary',
      },
    },

    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Detailed task description with formatting',
      },
    },

    // ============================================================================
    // STATUS AND PRIORITY
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          index: true,
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in-progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: {
            description: 'Current task status',
            width: '50%',
          },
        },
        {
          name: 'priority',
          type: 'select',
          defaultValue: 'medium',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Urgent', value: 'urgent' },
          ],
          admin: {
            description: 'Task priority level',
            width: '50%',
          },
        },
      ],
    },

    // ============================================================================
    // RELATIONSHIPS
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'project',
          type: 'relationship',
          relationTo: 'projects',
          required: true,
          index: true,
          admin: {
            description: 'Project this task belongs to',
            width: '50%',
          },
        },
        {
          name: 'assignedTo',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          index: true,
          admin: {
            description: 'User assigned to this task',
            width: '50%',
          },
        },
      ],
    },

    {
      name: 'package',
      type: 'relationship',
      relationTo: 'packages',
      index: true,
      admin: { description: 'Package (proposal/SOW) this work delivers, if any' },
    },

    // ============================================================================
    // BOT TRACKING (internal — staff only)
    // ============================================================================
    {
      type: 'row',
      fields: [
        {
          name: 'ownerBot',
          type: 'text',
          index: true,
          access: STAFF_ONLY,
          validate: (value: unknown) =>
            value == null || value === '' || isValidActor(value) || 'Unknown bot or ccq task id',
          admin: { width: '33%', description: 'Bot that owns this task (gojo, vegapunk, …)' },
        },
        {
          name: 'ccqTaskId',
          type: 'text',
          index: true,
          access: STAFF_ONLY,
          validate: (value: unknown) =>
            value == null || value === '' || /^T\d{6}-\d{6}$/.test(String(value)) || 'ccq task id like T261101-232341',
          admin: { width: '33%', description: 'ccq queue id. Tracked tasks need a QA pass to complete.' },
        },
        {
          name: 'lastActor',
          type: 'text',
          access: STAFF_ONLY,
          admin: { width: '34%', readOnly: true, description: 'Last bot/ccq id to write this via MCP' },
        },
      ],
    },
    // Claim + lease, written only by task_claim's atomic update (src/lib/tasks/claim.ts).
    {
      type: 'row',
      fields: [
        {
          name: 'claimedBy',
          type: 'text',
          index: true,
          access: STAFF_ONLY,
          validate: (value: unknown) =>
            value == null || value === '' || isValidActor(value) || 'Unknown bot or ccq task id',
          admin: { width: '33%', readOnly: true, description: 'Bot/ccq id that claimed this task' },
        },
        {
          name: 'claimedAt',
          type: 'date',
          access: STAFF_ONLY,
          admin: {
            width: '33%',
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Last claim or renewal',
          },
        },
        {
          name: 'leaseExpiresAt',
          type: 'date',
          access: STAFF_ONLY,
          admin: {
            width: '34%',
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime' },
            description: 'After this, another bot may reclaim the task',
          },
        },
      ],
    },
    {
      name: 'qa',
      type: 'group',
      label: 'QA',
      access: STAFF_ONLY,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'status',
              type: 'select',
              defaultValue: 'pending',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Pass', value: 'pass' },
                { label: 'Fail', value: 'fail' },
              ],
              admin: { width: '25%' },
            },
            { name: 'commit', type: 'text', admin: { width: '25%', description: 'Commit QA ran against' } },
            { name: 'date', type: 'date', admin: { width: '25%' } },
            { name: 'reportLink', type: 'text', admin: { width: '25%', description: 'QA report (Drive / #qa)' } },
          ],
        },
      ],
    },

    {
      name: 'sprint',
      type: 'relationship',
      relationTo: 'sprints',
      admin: {
        description: 'Optional: Sprint this task is part of',
      },
    },

    // ============================================================================
    // TIMELINE
    // ============================================================================

    {
      name: 'dueDate',
      type: 'date',
      index: true,
      admin: {
        description: 'When this task is due',
      },
    },

    {
      name: 'completedAt',
      type: 'date',
      admin: {
        description: 'When this task was completed (auto-set)',
        readOnly: true,
      },
    },

    // ============================================================================
    // TIME TRACKING
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'estimatedHours',
          type: 'number',
          min: 0,
          admin: {
            description: 'Estimated hours to complete',
            width: '50%',
          },
        },
        {
          name: 'actualHours',
          type: 'number',
          min: 0,
          admin: {
            description: 'Actual hours spent on task',
            width: '50%',
          },
        },
      ],
    },
    // ============================================================================
    // STRUCTURED TASK (internal — staff only; board 6aea1fd4, src/lib/tasks/structure.ts)
    // ============================================================================
    {
      type: 'collapsible',
      label: 'Ask, deliverables, checklist',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'lead',
              type: 'text',
              maxLength: 64,
              access: STAFF_ONLY,
              admin: { width: '50%', description: 'The one bot leading this task' },
            },
            {
              name: 'version',
              type: 'number',
              defaultValue: 0,
              access: STAFF_ONLY,
              admin: { width: '50%', readOnly: true, description: '+1 on every edit' },
            },
          ],
        },
        {
          name: 'ask',
          type: 'textarea',
          maxLength: 4000,
          access: STAFF_ONLY,
          admin: { description: "The request in the asker's words. Locked once set; later direction goes in Ask updates." },
        },
        {
          name: 'askUpdates',
          type: 'array',
          access: STAFF_ONLY,
          labels: { singular: 'Ask update', plural: 'Ask updates' },
          admin: { description: 'Dated direction changes in the asker\'s words (append-only)' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'at', type: 'date', required: true, admin: { width: '30%', date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'source', type: 'text', required: true, maxLength: 300, admin: { width: '45%', description: 'Who asked, where' } },
              ],
            },
            { name: 'words', type: 'textarea', required: true, maxLength: 2000 },
          ],
        },
        {
          name: 'deliverables',
          type: 'array',
          access: STAFF_ONLY,
          labels: { singular: 'Deliverable', plural: 'Deliverables' },
          admin: { description: 'End deliverables (at least 1 on new tasks)' },
          fields: [
            { name: 'text', type: 'text', required: true, maxLength: 1000 },
            {
              type: 'row',
              fields: [
                {
                  name: 'status',
                  type: 'select',
                  defaultValue: 'open',
                  options: ['open', 'done', 'dropped'],
                  admin: { width: '20%' },
                },
                { name: 'owner', type: 'text', defaultValue: 'dev', maxLength: 64, admin: { width: '20%', description: 'dev | cm | fin | <bot>' } },
                { name: 'addedBy', type: 'text', maxLength: 64, admin: { width: '20%', readOnly: true } },
                { name: 'link', type: 'text', maxLength: 2000, admin: { width: '40%', description: 'File path, URL or Discord link' } },
              ],
            },
            {
              name: 'dropReason',
              type: 'text',
              maxLength: 2000,
              admin: { condition: (_, row) => row?.status === 'dropped', description: 'Why it was dropped (dropped items stay visible)' },
            },
          ],
        },
        {
          name: 'checklist',
          type: 'array',
          access: STAFF_ONLY,
          labels: { singular: 'Checklist item', plural: 'Checklist' },
          admin: { description: 'Checklist (at least 1 on new tasks, no upper limit)' },
          fields: [
            { name: 'text', type: 'text', required: true, maxLength: 1000 },
            {
              type: 'row',
              fields: [
                {
                  name: 'status',
                  type: 'select',
                  defaultValue: 'open',
                  options: ['open', 'done', 'dropped'],
                  admin: { width: '20%' },
                },
                { name: 'owner', type: 'text', defaultValue: 'dev', maxLength: 64, admin: { width: '20%', description: 'dev | cm | fin | <bot>' } },
                { name: 'addedBy', type: 'text', maxLength: 64, admin: { width: '20%', readOnly: true } },
                { name: 'proof', type: 'text', maxLength: 2000, admin: { width: '40%', description: 'Commit, test output, path or URL' } },
              ],
            },
            {
              name: 'dropReason',
              type: 'text',
              maxLength: 2000,
              admin: { condition: (_, row) => row?.status === 'dropped', description: 'Why it was dropped (dropped items stay visible)' },
            },
          ],
        },
        {
          name: 'changes',
          type: 'array',
          access: STAFF_ONLY,
          labels: { singular: 'Change', plural: 'Changes' },
          admin: { description: 'One line per edit: when, who, what (append-only)' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'at', type: 'date', required: true, admin: { width: '30%', date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'source', type: 'text', required: true, maxLength: 300, admin: { width: '45%', description: 'Who asked, where' } },
                { name: 'by', type: 'text', admin: { width: '25%', readOnly: true } },
              ],
            },
            { name: 'words', type: 'textarea', required: true, maxLength: 2000 },
          ],
        },
        {
          name: 'screens',
          type: 'array',
          access: STAFF_ONLY,
          labels: { singular: 'Screen', plural: 'Screens' },
          admin: { description: 'Screenshots under ~/dev/orca/qa/ccrecap-shots/' },
          fields: [
            { name: 'path', type: 'text', required: true, maxLength: 2000 },
            {
              type: 'row',
              fields: [
                { name: 'caption', type: 'text', maxLength: 300, admin: { width: '40%' } },
                { name: 'discordLink', type: 'text', maxLength: 2000, admin: { width: '45%' } },
                { name: 'sentToDrive', type: 'checkbox', defaultValue: false, admin: { width: '15%' } },
              ],
            },
          ],
        },
      ],
    },
    // Internal-only working context. Field access + afterRead strip keep it from clients.
    botContextField,
  ],
}

export default Tasks
