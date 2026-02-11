import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { adminOnly, adminOrAssigned, adminOrUser } from '../access'

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
    beforeChange: [setCompletedAtOnCompletion],
  },
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
  ],
}

export default Tasks
