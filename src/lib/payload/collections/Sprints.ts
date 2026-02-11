import type { CollectionConfig } from 'payload'
import { adminOrUser, authenticated, adminOrProjectMember, adminOnly } from '../access'

/**
 * Sprints Collection
 *
 * Represents sprints within projects in the spac4es project management system.
 * Features:
 * - Groups tasks within a project with defined timeframe
 * - Status tracking (pending, in-progress, delayed, finished)
 * - Sprint goals and descriptions
 * - Task relationship with automatic count tracking
 * - Role-based access control (admins see all, users see sprints from assigned projects)
 */
export const Sprints: CollectionConfig = {
  slug: 'sprints',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'project', 'status', 'startDate', 'endDate'],
    group: 'Project Management',
    description: 'Manage project sprints with tasks and timeframes',
  },
  access: {
    create: adminOrUser, // Only admin/user can create sprints
    read: adminOrProjectMember, // Admins see all, users see sprints from projects they're assigned to
    update: adminOrUser, // Only admin/user can update sprints
    delete: adminOnly, // Only admins can delete sprints
  },
  fields: [
    // ============================================================================
    // BASIC INFORMATION
    // ============================================================================

    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Sprint name (e.g., "Sprint 1", "Q1 2026")',
      },
    },

    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Sprint description and objectives',
      },
    },

    // ============================================================================
    // PROJECT RELATIONSHIP
    // ============================================================================

    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      index: true,
      admin: {
        description: 'Project this sprint belongs to',
      },
    },

    // ============================================================================
    // STATUS
    // ============================================================================

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Delayed', value: 'delayed' },
        { label: 'Finished', value: 'finished' },
      ],
      admin: {
        description: 'Current sprint status',
      },
    },

    // ============================================================================
    // TIMEFRAME
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            description: 'Sprint start date',
            width: '50%',
          },
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          validate: (value, { data }) => {
            const typedData = data as any
            if (typedData.startDate && value && new Date(value) <= new Date(typedData.startDate)) {
              return 'End date must be after start date'
            }
            return true
          },
          admin: {
            description: 'Sprint end date',
            width: '50%',
          },
        },
      ],
    },

    // ============================================================================
    // SPRINT GOALS
    // ============================================================================

    {
      name: 'goalDescription',
      type: 'textarea',
      admin: {
        description: 'What should be accomplished in this sprint',
      },
    },

    // ============================================================================
    // TASKS RELATIONSHIP
    // ============================================================================

    {
      name: 'tasks',
      type: 'relationship',
      relationTo: 'tasks',
      hasMany: true,
      admin: {
        description: 'Tasks included in this sprint',
      },
    },

    // ============================================================================
    // PROGRESS TRACKING
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'completedTasksCount',
          type: 'number',
          defaultValue: 0,
          min: 0,
          access: {
            read: ({ req: { user } }) => Boolean(user),
            update: () => false,
          },
          admin: {
            description: 'Number of completed tasks (auto-calculated)',
            readOnly: true,
            width: '50%',
          },
        },
        {
          name: 'totalTasksCount',
          type: 'number',
          defaultValue: 0,
          min: 0,
          access: {
            read: ({ req: { user } }) => Boolean(user),
            update: () => false,
          },
          admin: {
            description: 'Total number of tasks (auto-calculated)',
            readOnly: true,
            width: '50%',
          },
        },
      ],
    },
  ],
}

export default Sprints
