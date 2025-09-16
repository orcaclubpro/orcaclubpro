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

// KaijuHuntingTasks collection for kaiju hunting task management
const KaijuHuntingTasks: CollectionConfig = {
  slug: 'kaiju-hunting-tasks',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'priority', 'kaijuType', 'location'],
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
        description: 'The name of the kaiju hunting task',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Detailed description of the hunting task',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
    },
    {
      name: 'kaijuType',
      type: 'text',
      required: true,
      admin: {
        description: 'Type of kaiju (e.g., Godzilla, Mothra, King Ghidorah)',
      },
    },
    {
      name: 'location',
      type: 'text',
      required: true,
      admin: {
        description: 'Location where the kaiju was spotted',
      },
    },
    {
      name: 'difficulty',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Medium', value: 'medium' },
        { label: 'Hard', value: 'hard' },
        { label: 'Legendary', value: 'legendary' },
      ],
    },
    {
      name: 'estimatedDuration',
      type: 'number',
      admin: {
        description: 'Estimated duration in hours',
      },
    },
    {
      name: 'requiredEquipment',
      type: 'textarea',
      admin: {
        description: 'Equipment needed for the hunt',
      },
    },
    {
      name: 'rewards',
      type: 'number',
      admin: {
        description: 'Points or credits awarded for completion',
      },
    },
    {
      name: 'dueDate',
      type: 'date',
      admin: {
        description: 'When the task must be completed',
      },
    },
    {
      name: 'assignedHunter',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Hunter assigned to this task',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'reconnaissance',
      options: [
        { label: 'Reconnaissance', value: 'reconnaissance' },
        { label: 'Capture', value: 'capture' },
        { label: 'Elimination', value: 'elimination' },
        { label: 'Rescue', value: 'rescue' },
        { label: 'Research', value: 'research' },
      ],
    },
  ],
}

export default buildConfig({
  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor(),

  // Define and configure your collections in this array
  collections: [Users, KaijuHuntingTasks],

  // Your Payload secret - should be a complex and secure string, unguessable
  secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
  // Using MongoDB adapter 
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb+srv://chance:ara9YRAkRe7blAqF@orcapod.f5yp3f7.mongodb.net/ORCACLUB',
  }),
  // If you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // This is optional - if you don't need to do these things,
  // you don't need it!
  sharp,
})
