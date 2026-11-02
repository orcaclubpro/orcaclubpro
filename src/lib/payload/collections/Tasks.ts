import { APIError } from 'payload'
import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { adminOnly, adminOrAssigned, adminOrUser, staffOnlyField } from '../access'
import { botContextField, guardBotContextWrite, stripBotContext } from '../fields/botContext'
import { restoreStaffOnly, stripStaffOnly } from '../fields/staffOnlyFields'
import { isValidActor } from '@/lib/mcp/actor'

/**
 * Bot-tracking fields: internal, never shown to clients (stripped from non-staff
 * reads, restored on non-staff writes; see fields/staffOnlyFields.ts).
 */
export const TASK_TRACKING_FIELDS = ['ownerBot', 'ccqTaskId', 'qa', 'lastActor'] as const

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
    // Internal-only working context. Field access + afterRead strip keep it from clients.
    botContextField,
  ],
}

export default Tasks
