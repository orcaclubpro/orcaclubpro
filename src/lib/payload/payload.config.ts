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
    },
    // Stripe Integration Fields
    {
      name: 'stripeCustomerId',
      type: 'text',
      admin: {
        description: 'Stripe customer ID',
      },
    },
    {
      name: 'stripeSubscriptionId',
      type: 'text',
      admin: {
        description: 'Current active subscription ID',
      },
    },
    {
      name: 'subscriptionStatus',
      type: 'select',
      defaultValue: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Active', value: 'active' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Incomplete', value: 'incomplete' },
      ],
      admin: {
        description: 'Current subscription status',
      },
    },
    {
      name: 'subscriptionTier',
      type: 'select',
      defaultValue: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Basic', value: 'basic' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      admin: {
        description: 'Subscription tier level',
      },
    },
    {
      name: 'billingEmail',
      type: 'email',
      admin: {
        description: 'Email address for billing purposes',
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

// Subscriptions collection - tracks Stripe subscriptions
const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'stripeSubscriptionId',
    defaultColumns: ['user', 'status', 'stripePriceId', 'currentPeriodEnd'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  indexes: [
    {
      fields: ['stripeSubscriptionId'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        description: 'User associated with this subscription',
      },
    },
    {
      name: 'stripeSubscriptionId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Stripe subscription ID',
      },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      required: true,
      admin: {
        description: 'Stripe customer ID',
      },
    },
    {
      name: 'stripePriceId',
      type: 'text',
      required: true,
      admin: {
        description: 'Stripe price ID for this subscription',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Incomplete', value: 'incomplete' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Paused', value: 'paused' },
      ],
      admin: {
        description: 'Current subscription status',
      },
    },
    {
      name: 'currentPeriodStart',
      type: 'date',
      admin: {
        description: 'Start of the current billing period',
      },
    },
    {
      name: 'currentPeriodEnd',
      type: 'date',
      admin: {
        description: 'End of the current billing period',
      },
    },
    {
      name: 'cancelAtPeriodEnd',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether subscription will be canceled at period end',
      },
    },
    {
      name: 'canceledAt',
      type: 'date',
      admin: {
        description: 'Date when subscription was canceled',
      },
    },
    {
      name: 'trialStart',
      type: 'date',
      admin: {
        description: 'Trial period start date',
      },
    },
    {
      name: 'trialEnd',
      type: 'date',
      admin: {
        description: 'Trial period end date',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional metadata from Stripe',
      },
    },
  ],
}

// Invoices collection - tracks Stripe invoices
const Invoices: CollectionConfig = {
  slug: 'invoices',
  admin: {
    useAsTitle: 'stripeInvoiceId',
    defaultColumns: ['user', 'amount', 'status', 'paid', 'dueDate'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  indexes: [
    {
      fields: ['stripeInvoiceId'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        description: 'User associated with this invoice',
      },
    },
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions' as any,
      hasMany: false,
      admin: {
        description: 'Subscription associated with this invoice (if any)',
      },
    },
    {
      name: 'stripeInvoiceId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Stripe invoice ID',
      },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      required: true,
      admin: {
        description: 'Stripe customer ID',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: {
        description: 'Amount in cents',
      },
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'usd',
      admin: {
        description: 'Currency code (e.g., usd, eur)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Open', value: 'open' },
        { label: 'Paid', value: 'paid' },
        { label: 'Void', value: 'void' },
        { label: 'Uncollectible', value: 'uncollectible' },
      ],
      admin: {
        description: 'Invoice status',
      },
    },
    {
      name: 'paid',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the invoice has been paid',
      },
    },
    {
      name: 'invoiceUrl',
      type: 'text',
      admin: {
        description: 'URL to view the invoice in Stripe',
      },
    },
    {
      name: 'pdfUrl',
      type: 'text',
      admin: {
        description: 'URL to download invoice PDF',
      },
    },
    {
      name: 'dueDate',
      type: 'date',
      admin: {
        description: 'Invoice due date',
      },
    },
    {
      name: 'paidAt',
      type: 'date',
      admin: {
        description: 'Date when invoice was paid',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional metadata from Stripe',
      },
    },
  ],
}

export default buildConfig({
  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor(),

  // Define and configure your collections in this array
  collections: [Users, Subscriptions, Invoices, KaijuActivities, TripConfigs],

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
  // If you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // This is optional - if you don't need to do these things,
  // you don't need it!
  sharp,
})
