import type { CollectionConfig } from 'payload'
import { adminOnly, adminOrAssigned, adminOrUser } from '../access'

/**
 * Projects Collection
 *
 * Represents projects in the spac4es project management system.
 * Features:
 * - One-to-many relationship with ClientAccounts
 * - Team member assignments
 * - Timeline tracking (start, projected end, actual end dates)
 * - Milestone tracking with completion status
 * - Budget management with currency support
 * - Role-based access control (admins see all, users see assigned projects)
 */
export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'client', 'assignedTo', 'startDate', 'projectedEndDate'],
    group: 'Project Management',
    description: 'Manage projects with clients, timelines, and milestones',
  },
  access: {
    create: adminOrUser, // Only admin/user can create projects
    read: adminOrAssigned, // Admins see all, users see assigned projects
    update: adminOrAssigned, // Admins can update all, users can update assigned projects
    delete: adminOnly, // Only admins can delete projects
  },
  fields: [
    // ============================================================================
    // BASIC INFORMATION
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          index: true,
          admin: {
            description: 'Project name',
            width: '70%',
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          index: true,
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in-progress' },
            { label: 'On Hold', value: 'on-hold' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: {
            description: 'Current project status',
            width: '30%',
          },
        },
      ],
    },

    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Detailed project description and objectives',
      },
    },

    // ============================================================================
    // RELATIONSHIPS
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'client',
          type: 'relationship',
          relationTo: 'client-accounts',
          required: true,
          index: true,
          admin: {
            description: 'Client account for this project',
            width: '50%',
          },
        },
        {
          name: 'assignedTo',
          type: 'relationship',
          relationTo: 'users',
          hasMany: true,
          admin: {
            description: 'Team members assigned to this project',
            width: '50%',
          },
        },
      ],
    },

    // ============================================================================
    // TIMELINE
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          admin: {
            description: 'Project start date',
            width: '33%',
          },
        },
        {
          name: 'projectedEndDate',
          type: 'date',
          admin: {
            description: 'Expected completion date',
            width: '33%',
          },
        },
        {
          name: 'actualEndDate',
          type: 'date',
          admin: {
            description: 'Actual completion date (when status = completed)',
            width: '34%',
          },
        },
      ],
    },

    // ============================================================================
    // MILESTONES
    // ============================================================================

    {
      name: 'milestones',
      type: 'array',
      labels: {
        singular: 'Milestone',
        plural: 'Milestones',
      },
      admin: {
        description: 'Project milestones and key deliverables',
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              admin: {
                description: 'Milestone title',
                width: '60%',
              },
            },
            {
              name: 'date',
              type: 'date',
              required: true,
              admin: {
                description: 'Milestone target date',
                width: '30%',
              },
            },
            {
              name: 'completed',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Mark as complete',
                width: '10%',
              },
            },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Milestone details and deliverables',
          },
        },
      ],
    },

    // ============================================================================
    // BUDGET
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'budgetAmount',
          type: 'number',
          min: 0,
          admin: {
            description: 'Total project budget',
            width: '70%',
          },
        },
        {
          name: 'currency',
          type: 'select',
          defaultValue: 'USD',
          options: [
            { label: 'USD', value: 'USD' },
            { label: 'EUR', value: 'EUR' },
            { label: 'GBP', value: 'GBP' },
          ],
          admin: {
            description: 'Budget currency',
            width: '30%',
          },
        },
      ],
    },
  ],
}

export default Projects
