import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { buildConfig } from 'payload'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { revalidateHomepage, revalidateHomepageOnDelete, createMultiPathRevalidate, createMultiPathRevalidateOnDelete } from './hooks/revalidate'
import { sendTwoFactorEmailHook } from './hooks/sendTwoFactorEmail'
import { beforeLoginHook } from './hooks/beforeLogin'
import ClientAccounts from './collections/ClientAccounts'
import Orders from './collections/Orders'

// Helper function to format strings as URL-friendly slugs
const formatSlug = (val: string): string =>
  val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()

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
      required: false, // Optional - only for booking consultations
      admin: {
        description: 'Customer preferred consultation date (optional - for bookings only)',
      },
    },
    {
      name: 'preferredTime',
      type: 'text',
      required: false, // Optional - only for booking consultations
      admin: {
        description: 'Customer preferred time (ISO 8601 format, optional - for bookings only)',
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
    {
      name: 'shopifyCustomerId',
      type: 'text',
      admin: {
        description: 'Shopify customer ID (auto-populated)',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'shopifyPasswordGenerated',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether a Shopify password was generated',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'convertToClient',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/payload/ConvertToClientButton',
        },
      },
    },
  ],
}

// Categories collection - taxonomy for blog posts
const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
    group: 'Blog',
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
      index: true,
      admin: {
        description: 'Category name',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL-friendly identifier (auto-generated from name)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (typeof value === 'string') {
              return formatSlug(value)
            }
            if (data?.name) {
              return formatSlug(data.name as string)
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of this category',
      },
    },
  ],
}

// Tags collection - flexible keywords for blog posts
const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
    group: 'Blog',
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
      unique: true,
      index: true,
      admin: {
        description: 'Tag name',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL-friendly identifier (auto-generated from name)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (typeof value === 'string') {
              return formatSlug(value)
            }
            if (data?.name) {
              return formatSlug(data.name as string)
            }
            return value
          },
        ],
      },
    },
  ],
}

// Posts collection - blog posts with drafts, versioning, and full content management
const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'category', '_status', 'publishedDate'],
    group: 'Blog',
  },
  access: {
    read: ({ req: { user } }) => {
      // Authenticated users see all posts (including drafts)
      if (user) return true

      // Public users only see published posts
      return {
        _status: {
          equals: 'published',
        },
      }
    },
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
      validate: false, // Don't validate drafts - allows saving incomplete content
    },
    maxPerDoc: 50, // Keep last 50 versions per post
  },
  hooks: {
    afterChange: [
      // Revalidate blog listing pages
      createMultiPathRevalidate(['/', '/sonar']),
      // Revalidate individual post page
      async ({ doc, req: { payload, context } }) => {
        if (!context.disableRevalidate && doc.slug) {
          setImmediate(() => {
            try {
              payload.logger.info(`[Revalidation] Post page /sonar/${doc.slug} revalidated`)
              revalidatePath(`/sonar/${doc.slug}`, 'page')
            } catch (error) {
              payload.logger.error(`[Revalidation] Error revalidating post page: ${error}`)
            }
          })
        }
        return doc
      },
    ],
    afterDelete: [
      createMultiPathRevalidateOnDelete(['/', '/sonar']),
      // Revalidate deleted post page
      async ({ doc, req: { payload, context } }) => {
        if (!context.disableRevalidate && doc.slug) {
          setImmediate(() => {
            try {
              payload.logger.info(`[Revalidation] Deleted post page /sonar/${doc.slug} revalidated`)
              revalidatePath(`/sonar/${doc.slug}`, 'page')
            } catch (error) {
              payload.logger.error(`[Revalidation] Error revalidating deleted post: ${error}`)
            }
          })
        }
        return doc
      },
    ],
    beforeChange: [
      // Auto-set publishedDate when post is published
      ({ data, operation, originalDoc }) => {
        // Only set publishedDate if transitioning to published status and no date is set
        if (data._status === 'published' && !data.publishedDate) {
          data.publishedDate = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Post title',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL-friendly identifier (auto-generated from title)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (typeof value === 'string') {
              return formatSlug(value)
            }
            if (data?.title) {
              return formatSlug(data.title as string)
            }
            return value
          },
        ],
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 200,
      admin: {
        description: 'Brief excerpt for SEO and previews (max 200 characters)',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Main post content',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media' as any,
      filterOptions: {
        mimeType: { contains: 'image' },
      },
      admin: {
        description: 'Featured image for the post',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users' as any,
      required: true,
      maxDepth: 2,
      admin: {
        description: 'Post author',
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories' as any,
      hasMany: false,
      admin: {
        description: 'Primary category for this post',
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags' as any,
      hasMany: true,
      admin: {
        description: 'Tags for this post',
        position: 'sidebar',
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        description: 'Date when the post was published (auto-set on first publish)',
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'readTime',
      type: 'number',
      admin: {
        description: 'Estimated read time in minutes',
        position: 'sidebar',
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
    forgotPassword: {
      generateEmailHTML: (args) => {
        // This custom template is handled by our API endpoint
        // But PayloadCMS requires a function here for the built-in endpoint
        const token = args?.token || ''
        const user = args?.user || { name: 'User' }
        const resetUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}`
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password. Click the link below to choose a new password:</p>
            <p><a href="${resetUrl}" style="color: #67e8f9;">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Thanks,<br/>ORCACLUB Team</p>
          </div>
        `
      },
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'twoFactorVerified'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    afterChange: [sendTwoFactorEmailHook],
    beforeLogin: [beforeLoginHook],
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
    // 2FA fields (account verification)
    {
      name: 'twoFactorCode',
      type: 'text',
      admin: {
        description: '6-digit 2FA verification code (account setup)',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'twoFactorExpiry',
      type: 'date',
      admin: {
        description: 'Expiry time for 2FA code (account setup)',
        position: 'sidebar',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'twoFactorVerified',
      type: 'checkbox',
      defaultValue: true, // Auto-verify all users (first user gets immediate access)
      admin: {
        description: 'Whether user has verified their account',
        position: 'sidebar',
      },
    },
    // Login 2FA fields
    {
      name: 'loginTwoFactorCode',
      type: 'text',
      admin: {
        description: '6-digit login verification code',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'loginTwoFactorExpiry',
      type: 'date',
      admin: {
        description: 'Expiry time for login code',
        position: 'sidebar',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}



export default buildConfig({
  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor(),

  // Define and configure your collections in this array
  collections: [Media, Clients, Leads, Categories, Tags, Posts, Users, ClientAccounts, Orders],

  // Your Payload secret - should be a complex and secure string, unguessable
  secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
  // Using MongoDB adapter
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb+srv://chance:ara9YRAkRe7blAqF@orcapod.f5yp3f7.mongodb.net/orcapod',
  }),
  // Email configuration using Gmail SMTP via nodemailer
  email: nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_FROM || 'chance@orcaclub.pro',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'ORCACLUB',
    transportOptions: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
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
      // Custom admin actions (floating action button)
      actions: ['@/components/payload/actions/CreateOrderButton'],
      // Custom views
      views: {
        order: {
          Component: '@/components/payload/order-creation/OrderCreationView#OrderCreationView',
          path: '/order',
        },
        login: {
          Component: '@/components/payload/CustomLogin',
        },
        account: {
          Component: '@/components/payload/CustomAccount',
        },
      },
    },
  },
  // If you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // This is optional - if you don't need to do these things,
  // you don't need it!
  sharp,
})
