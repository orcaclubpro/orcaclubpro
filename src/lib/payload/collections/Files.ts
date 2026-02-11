import type { CollectionConfig } from 'payload'
import { adminOrUser, authenticated, adminOrProjectMember } from '../access'

/**
 * Files Collection
 *
 * Represents documents and files that can be linked to projects and sprints.
 * Provides centralized file management for the spac4es project management system.
 * Features:
 * - File upload with media relationship
 * - File type categorization
 * - Project and sprint associations
 * - Tag-based organization
 * - Version tracking
 * - Role-based access control
 */
export const Files: CollectionConfig = {
  slug: 'files',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'fileType', 'project', 'sprint', 'createdAt'],
    group: 'Project Management',
    description: 'Manage documents and files linked to projects and sprints',
  },
  access: {
    create: adminOrUser, // Only admin/user can upload files
    read: authenticated, // All authenticated users can view files
    update: adminOrUser, // Only admin/user can update file metadata
    delete: adminOrUser, // Only admin/user can delete files
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        // Auto-populate name from file if name is empty
        if (operation === 'create' && data && !data.name && data.file) {
          // The file name will be inherited from the media collection
          // If file is an object with name, use it; otherwise it will be populated by the relationship
          if (typeof data.file === 'object' && data.file?.filename) {
            // Remove extension for cleaner name display
            const filename = data.file.filename
            data.name = filename.split('.').slice(0, -1).join('.')
          }
        }
        return data
      },
    ],
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
            description: 'File or document name (auto-populated from filename if not provided)',
            width: '70%',
          },
        },
        {
          name: 'fileType',
          type: 'select',
          defaultValue: 'document',
          options: [
            { label: 'Document', value: 'document' },
            { label: 'Image', value: 'image' },
            { label: 'Spreadsheet', value: 'spreadsheet' },
            { label: 'Presentation', value: 'presentation' },
            { label: 'PDF', value: 'pdf' },
            { label: 'Other', value: 'other' },
          ],
          admin: {
            description: 'Type of file',
            width: '30%',
          },
        },
      ],
    },

    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Description of the file contents or purpose',
      },
    },

    // ============================================================================
    // FILE UPLOAD
    // ============================================================================

    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Upload a file or document',
      },
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
          admin: {
            description: 'Project this file belongs to (optional)',
            width: '50%',
          },
        },
        {
          name: 'sprint',
          type: 'relationship',
          relationTo: 'sprints',
          admin: {
            description: 'Sprint this file is a deliverable for (optional)',
            width: '50%',
          },
        },
      ],
    },

    // ============================================================================
    // METADATA
    // ============================================================================

    {
      type: 'row',
      fields: [
        {
          name: 'version',
          type: 'text',
          admin: {
            description: 'Version number (e.g., "1.0", "2.1")',
            width: '50%',
          },
        },
        {
          name: 'tags',
          type: 'text',
          hasMany: true,
          admin: {
            description: 'Tags for organization (e.g., "contract", "design", "invoice")',
            width: '50%',
          },
        },
      ],
    },
  ],
}

export default Files
