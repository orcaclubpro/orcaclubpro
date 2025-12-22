import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { revalidateHomepage, revalidateHomepageOnDelete } from './hooks/revalidate'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Media collection for uploads (logos, images, etc.)
const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'public/media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 768,
        position: 'centre',
      },
      {
        name: 'logo',
        width: 200,
        height: 200,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alt text for accessibility',
      },
    },
  ],
}

// Clients collection - for client logos/brands
const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'logo', 'displayOrder'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    afterChange: [revalidateHomepage],
    afterDelete: [revalidateHomepageOnDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Client/Brand name',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media' as any,
      required: true,
      filterOptions: {
        mimeType: { contains: 'image' },
      },
      admin: {
        description: 'Client logo image',
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Optional client website URL',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order in which to display (lower numbers first)',
      },
    },
  ],
}

// Leads collection - stores booking/consultation requests
const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'service', 'preferredDate', 'status', 'createdAt'],
    group: 'Content',
    description: 'Consultation booking requests from the website',
  },
  access: {
    read: () => true,
    create: () => true, // Allow API to create leads
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Customer full name',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        description: 'Customer email address',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Customer phone number (optional)',
      },
    },
    {
      name: 'company',
      type: 'text',
      admin: {
        description: 'Customer company name (optional)',
      },
    },
    {
      name: 'service',
      type: 'select',
      required: true,
      options: [
        { label: 'Web Design', value: 'web-design' },
        { label: 'AI & Automation', value: 'ai-automation' },
        { label: 'Custom Software Development', value: 'custom-software' },
        { label: 'SEO Services', value: 'seo-services' },
        { label: 'Consulting', value: 'consulting' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Service the customer is interested in',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Project details and customer message',
      },
    },
    {
      name: 'preferredDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Customer preferred consultation date',
      },
    },
    {
      name: 'preferredTime',
      type: 'text',
      required: true,
      admin: {
        description: 'Customer preferred time (ISO 8601 format)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        description: 'Lead status for tracking',
        position: 'sidebar',
      },
    },
    {
      name: 'emailSent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether confirmation email was sent',
        position: 'sidebar',
      },
    },
    {
      name: 'calendarCreated',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether calendar event was created',
        position: 'sidebar',
      },
    },
    {
      name: 'calendarEventLink',
      type: 'text',
      admin: {
        description: 'Google Calendar event link',
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this lead',
      },
    },
  ],
}

// Users collection for authentication
const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    verify: {
      generateEmailHTML: ({ token }) => {
        return `<div>Click <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}">here</a> to verify your email.</div>`
      },
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'User',
          value: 'user',
        },
      ]
    },
    {
      name: 'workspace',
      type: 'text',
      admin: {
        description: 'User workspace identifier',
      },
    },
  ],
}



export default buildConfig({
  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor(),

  // Define and configure your collections in this array
  collections: [Media, Clients, Leads, Users],

  // Your Payload secret - should be a complex and secure string, unguessable
  secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
  // Using MongoDB adapter
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb+srv://chance:ara9YRAkRe7blAqF@orcapod.f5yp3f7.mongodb.net/orcapod',
  }),
  // TypeScript configuration
  typescript: {
    outputFile: './src/types/payload-types.ts',
  },
  // Admin panel customization - ORCACLUB Branding
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, '../../'),
    },
    components: {
      // Custom branding graphics
      graphics: {
        Logo: '@/components/payload/Logo',
        Icon: '@/components/payload/Icon',
      },
      // Custom login page elements
      beforeLogin: ['@/components/payload/BeforeLogin'],
      // Custom CSS provider for ORCACLUB theme
      providers: ['@/components/payload/PayloadStyleProvider#PayloadStyleProvider'],
    },
  },
  // If you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // This is optional - if you don't need to do these things,
  // you don't need it!
  sharp,
})
