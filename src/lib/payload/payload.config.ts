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

// Activities collection for trip activities
const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'hasTime', 'time'],
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
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'time',
      type: 'text',
      admin: {
        description: 'Time in HH:MM format',
      },
    },
    {
      name: 'hasTime',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Cultural', value: 'cultural' },
        { label: 'Food', value: 'food' },
        { label: 'Nature', value: 'nature' },
        { label: 'Shopping', value: 'shopping' },
        { label: 'Entertainment', value: 'entertainment' },
        { label: 'Transport', value: 'transport' },
      ],
      defaultValue: 'cultural',
    },
  ],
}

// TripDays collection for daily itineraries
const TripDays: CollectionConfig = {
  slug: 'trip-days',
  admin: {
    useAsTitle: 'location',
    defaultColumns: ['location', 'city', 'phase'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'city',
      type: 'select',
      required: true,
      options: [
        { label: 'Tokyo', value: 'tokyo' },
        { label: 'Kyoto', value: 'kyoto' },
        { label: 'Osaka', value: 'osaka' },
        { label: 'Mt. Fuji', value: 'fuji' },
      ],
    },
    {
      name: 'phase',
      type: 'text',
      required: true,
    },
    {
      name: 'activities',
      type: 'relationship',
      relationTo: 'activities',
      hasMany: true,
    },
  ],
}

// Trips collection for overall trip metadata
const Trips: CollectionConfig = {
  slug: 'trips',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate'],
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
      defaultValue: 'Japan Trip 2024',
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'days',
      type: 'relationship',
      relationTo: 'trip-days',
      hasMany: true,
    },
  ],
}

// KaijuActivities collection - simplified to mirror Activity interface exactly
const KaijuActivities: CollectionConfig = {
  slug: 'kaiju-activities',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'location', 'hasTime', 'time'],
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
    // Organization fields for trip structure
    {
      name: 'location',
      type: 'text',
      required: true,
      admin: {
        description: 'Location (e.g., "Tokyo", "Kyoto", "Osaka", "Mt. Fuji")',
      },
    },
    {
      name: 'city',
      type: 'select',
      required: true,
      options: [
        { label: 'Tokyo', value: 'tokyo' },
        { label: 'Kyoto', value: 'kyoto' },
        { label: 'Osaka', value: 'osaka' },
        { label: 'Mt. Fuji', value: 'fuji' },
      ],
    },
    {
      name: 'phase',
      type: 'text',
      required: true,
      admin: {
        description: 'Trip phase (e.g., "Arrival & First Exploration")',
      },
    },
  ],
}

export default buildConfig({
  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor(),

  // Define and configure your collections in this array
  collections: [Users, Activities, TripDays, Trips, KaijuActivities],

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
