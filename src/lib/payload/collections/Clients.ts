import type { CollectionConfig } from 'payload'

/**
 * Clients Collection - Portfolio/Logo Display
 *
 * This collection stores client logos and brands for display on the homepage.
 * This is separate from ClientAccounts (which handles billing/project management).
 *
 * Purpose: Showcase client portfolio on the homepage "Our Work" section
 */
export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'logo', 'website', 'displayOrder'],
    group: 'Content',
    description: 'Client logos and brands for homepage portfolio display',
  },
  access: {
    read: () => true, // Public - displayed on homepage
    create: ({ req: { user } }) => Boolean(user), // Authenticated users can create
    update: ({ req: { user } }) => Boolean(user), // Authenticated users can update
    delete: ({ req: { user } }) => user?.role === 'admin', // Only admins can delete
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Client or brand name',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Client logo image (preferably transparent PNG)',
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Client website URL (optional)',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Order in which to display on homepage (lower numbers appear first)',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Feature this client prominently on the homepage',
      },
    },
  ],
}
