import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import type { CollectionConfig } from 'payload'

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
    }
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

export default buildConfig({
  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor(),

  // Define and configure your collections in this array
  collections: [Users, KaijuActivities],

  // Your Payload secret - should be a complex and secure string, unguessable
  secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
  // Using MongoDB adapter
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb+srv://chance:ara9YRAkRe7blAqF@orcapod.f5yp3f7.mongodb.net/orcapod',
  }),
  // If you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // This is optional - if you don't need to do these things,
  // you don't need it!
  sharp,
})
