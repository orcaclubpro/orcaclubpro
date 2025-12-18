import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Media collection for uploads (logos, images, etc.)
const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
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
      relationTo: 'media',
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

// Services collection - for service offerings
const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'displayOrder'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Service title (e.g., "Elegant Web Design")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Brief service description',
      },
    },
    {
      name: 'icon',
      type: 'select',
      required: true,
      defaultValue: 'Code2',
      options: [
        { label: 'Code', value: 'Code2' },
        { label: 'Lightning', value: 'Zap' },
        { label: 'Target', value: 'Target' },
        { label: 'Brain', value: 'Brain' },
        { label: 'Sparkles', value: 'Sparkles' },
        { label: 'Rocket', value: 'Rocket' },
        { label: 'Search', value: 'Search' },
      ],
      admin: {
        description: 'Icon to display with the service',
      },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'development',
      options: [
        { label: 'Development', value: 'development' },
        { label: 'Design', value: 'design' },
        { label: 'Automation', value: 'automation' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'AI', value: 'ai' },
      ],
      admin: {
        description: 'Service category',
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


// KaijuActivities collection - simplified with ONLY dayIndex for day-aware activities
const KaijuActivities: CollectionConfig = {
  slug: 'kaiju-activities',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'dayIndex', 'category', 'hasTime', 'time'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  // Add indexes for optimal day-based querying
  indexes: [
    {
      fields: ['dayIndex'],
      unique: false,
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Activity title (e.g., "Explore Shibuya Crossing")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description of the activity',
      },
    },
    {
      name: 'time',
      type: 'text',
      admin: {
        description: 'Time in HH:MM format (e.g., "14:30")',
        placeholder: '14:30',
      },
    },
    {
      name: 'hasTime',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this activity has a specific time',
      },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'cultural',
      options: [
        { label: 'Cultural', value: 'cultural' },
        { label: 'Food', value: 'food' },
        { label: 'Nature', value: 'nature' },
        { label: 'Shopping', value: 'shopping' },
        { label: 'Entertainment', value: 'entertainment' },
        { label: 'Transport', value: 'transport' },
      ],
    },
    // ONLY dayIndex field for day-aware activities - simplified integration
    {
      name: 'dayIndex',
      type: 'number',
      required: true,
      admin: {
        description: 'Day index (0-15) for 16-day trip',
        position: 'sidebar',
      },
      validate: (value: any) => {
        if (typeof value !== 'number' || value < 0 || value > 15) {
          return 'Day index must be between 0 and 15'
        }
        return true
      },
    },
  ],
}

// TripConfigs collection - stores trip configuration and structure
const TripConfigs: CollectionConfig = {
  slug: 'trip-configs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'numberOfDays'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Trip title (e.g., "Japan Adventure 2024")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional trip description',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Trip start date',
      },
    },
    {
      name: 'numberOfDays',
      type: 'number',
      required: true,
      admin: {
        description: 'Total number of days in the trip',
      },
      validate: (value: any) => {
        if (typeof value !== 'number' || value < 1 || value > 365) {
          return 'Number of days must be between 1 and 365'
        }
        return true
      },
    },
    {
      name: 'days',
      type: 'array',
      required: true,
      admin: {
        description: 'Day-by-day trip configuration',
      },
      fields: [
        {
          name: 'location',
          type: 'text',
          required: true,
          admin: {
            description: 'Location name (e.g., "Tokyo", "Shibuya District")',
          },
        },
        {
          name: 'city',
          type: 'select',
          required: true,
          defaultValue: 'tokyo',
          options: [
            { label: 'Tokyo', value: 'tokyo' },
            { label: 'Kyoto', value: 'kyoto' },
            { label: 'Osaka', value: 'osaka' },
            { label: 'Mt. Fuji', value: 'fuji' },
            { label: 'Custom Location', value: 'custom' },
          ],
          admin: {
            description: 'City category for styling and grouping',
          },
        },
        {
          name: 'phase',
          type: 'text',
          required: true,
          admin: {
            description: 'Phase description (e.g., "Arrival & First Exploration")',
          },
        },
        {
          name: 'customCityName',
          type: 'text',
          admin: {
            description: 'Custom city name (required when city is "custom")',
            condition: (data: any, siblingData: any) => {
              return siblingData?.city === 'custom'
            },
          },
        },
      ],
    },
  ],
}

export default buildConfig({
  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor(),

  // Define and configure your collections in this array
  collections: [Media, Clients, Services, Users, KaijuActivities, TripConfigs],

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
