import sharp from 'sharp'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { stripePlugin } from '@payloadcms/plugin-stripe'
import {
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleInvoiceVoided,
} from '@/lib/stripe/webhook-handlers'
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
import { createClientAccountHook } from './hooks/createClientAccount'
import { syncUserToClientAccount } from './hooks/syncUserToClientAccount'
import { sendClientWelcomeEmailHook } from './hooks/sendClientWelcomeEmail'
import ClientAccounts from './collections/ClientAccounts'
import Orders from './collections/Orders'
import { WebhookEvents } from './collections/WebhookEvents'
import { Clients } from './collections/Clients'
import Projects from './collections/Projects'
import { Tasks } from './collections/Tasks'
import Sprints from './collections/Sprints'
import Files from './collections/Files'
import Packages from './collections/Packages'
import Credentials from './collections/Credentials'
import { Timelines } from './collections/Timelines'
import Solutions from './collections/Solutions'
import { Pages } from './collections/Pages'
import { anyone, authenticated, authenticatedOrPublished, adminOnly, adminOrSelf } from './access'

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
    mimeTypes: ['image/*', 'application/pdf'],
  },
  access: {
    // SECURITY: restrict REST API metadata listing to authenticated users.
    // Static files under /public/media/ are still served directly by Next.js
    // and remain publicly accessible for the website frontend.
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
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
    read: authenticated,
    create: anyone, // Public contact/booking forms create leads
    update: authenticated,
    delete: adminOnly,
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
      // SECURITY: public form submissions must not be able to set status
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        description: 'Lead status for tracking',
        position: 'sidebar',
      },
    },
    {
      name: 'emailSent',
      type: 'checkbox',
      defaultValue: false,
      // SECURITY: internal tracking field — not writable by public
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        description: 'Whether confirmation email was sent',
        position: 'sidebar',
      },
    },
    {
      name: 'calendarCreated',
      type: 'checkbox',
      defaultValue: false,
      // SECURITY: internal tracking field — not writable by public
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        description: 'Whether calendar event was created',
        position: 'sidebar',
      },
    },
    {
      name: 'calendarEventLink',
      type: 'text',
      // SECURITY: internal tracking field — not writable by public
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        description: 'Google Calendar event link',
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      // SECURITY: internal staff field — not writable by public
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        description: 'Internal notes about this lead',
      },
    },
    {
      name: 'shopifyCustomerId',
      type: 'text',
      // SECURITY: auto-populated by hook — not writable by anyone via API
      access: {
        create: () => false,
        update: () => false,
      },
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
      // SECURITY: auto-populated by hook — not writable by anyone via API
      access: {
        create: () => false,
        update: () => false,
      },
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
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
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
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
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
    create: authenticated,
    update: authenticated,
    delete: authenticated,
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
    // Email verification disabled - we use custom 2FA for admin users, clients don't need verification
    // verify: false, (commented out - this is the default)
    forgotPassword: {
      generateEmailSubject: () => 'Password Reset | ORCACLUB',
      generateEmailHTML: (args) => {
        // This custom template is handled by our API endpoint
        // But PayloadCMS requires a function here for the built-in endpoint
        const token = args?.token || ''
        const user = args?.user || { name: 'User' }
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'
        const resetUrl = `${baseUrl}/reset-password?token=${token}`
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
    read: adminOrSelf,
    create: adminOnly,
    update: adminOrSelf,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [createClientAccountHook], // Must run BEFORE afterChange
    afterChange: [sendTwoFactorEmailHook, syncUserToClientAccount, sendClientWelcomeEmailHook],
    beforeLogin: [beforeLoginHook],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        condition: (data) => data.role !== 'client',
        description: 'User full name (not used for client role)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data, originalDoc, req }) => {
            // Skip validation for internal operations that don't involve the name field
            // (e.g. setting a reset token on a user record)
            if (req?.context?.skipNameValidation) return value
            // Fall back to originalDoc.role when role isn't part of this update
            const effectiveRole = data?.role ?? originalDoc?.role
            if (effectiveRole !== 'client' && !value) {
              throw new Error('Name is required for admin and user roles')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        condition: (data) => data.role !== 'client',
        description: 'Custom title shown to clients on team views (e.g. "Lead Developer", "UI Designer")',
      },
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
        {
          label: 'Client',
          value: 'client',
        },
      ]
    },
    // Client-specific fields (shown only for client role)
    {
      name: 'firstName',
      type: 'text',
      admin: {
        condition: (data) => data.role === 'client',
        description: 'Client first name',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Make required for client role only
            if (data?.role === 'client' && !value) {
              throw new Error('First name is required for client users')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'lastName',
      type: 'text',
      admin: {
        condition: (data) => data.role === 'client',
        description: 'Client last name',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Make required for client role only
            if (data?.role === 'client' && !value) {
              throw new Error('Last name is required for client users')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'company',
      type: 'text',
      admin: {
        condition: (data) => data.role === 'client',
        description: 'Client company name',
      },
    },
    {
      name: 'username',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        condition: () => true,
        description: 'Unique username for dashboard access (auto-generated)',
        readOnly: true,
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          async ({ value, data, req, operation }) => {
            // If username already exists and we're not changing relevant fields, keep it
            if (value && operation === 'update') return value

            // Generate username based on role
            if (data?.role === 'client') {
              // Generate from firstName + lastName, falling back to email prefix
              const firstName = data?.firstName || ''
              const lastName = data?.lastName || ''

              let baseUsername: string
              if (firstName && lastName) {
                baseUsername = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '')
              } else if (data?.email) {
                baseUsername = (data.email as string).split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'
              } else {
                return value
              }

              // Check if username exists
              let username = baseUsername
              let counter = 1
              let isUnique = false

              while (!isUnique) {
                const existing = await req.payload.find({
                  collection: 'users',
                  where: {
                    username: { equals: username },
                  },
                  limit: 1,
                })

                if (existing.docs.length === 0) {
                  isUnique = true
                } else {
                  // If we're updating and found our own username, that's fine
                  if (operation === 'update' && existing.docs[0].id === data?.id) {
                    isUnique = true
                  } else {
                    // Add number suffix and try again
                    username = `${baseUsername}${counter}`
                    counter++
                }
              }
            }

              return username
            } else if (data?.role === 'admin' || data?.role === 'user') {
              // Generate from name field (e.g., "John Doe" -> "johndoe")
              const name = data?.name || ''
              if (!name) return value // Skip if no name

              let baseUsername = name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')

              // Ensure uniqueness
              let username = baseUsername
              let counter = 1

              while (true) {
                const existing = await req.payload.find({
                  collection: 'users',
                  where: { username: { equals: username } },
                  limit: 1,
                })

                if (existing.docs.length === 0) break

                // If we're updating and found our own username, that's fine
                if (operation === 'update' && existing.docs[0].id === data?.id) break

                username = `${baseUsername}${counter}`
                counter++
              }

              return username
            }

            return value
          },
        ],
      },
    },
    {
      name: 'clientAccount',
      type: 'relationship',
      relationTo: 'client-accounts',
      hasMany: false,
      admin: {
        condition: (data) => data.role === 'client',
        description: 'Linked client account (auto-created on user creation)',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'workspace',
      type: 'text',
      admin: {
        description: 'User workspace identifier',
        condition: (data) => data.role !== 'client',
      },
    },
    // 2FA fields (account verification) - hidden for client role
    {
      name: 'twoFactorCode',
      type: 'text',
      admin: {
        condition: (data) => data.role !== 'client',
        description: '6-digit 2FA verification code (account setup)',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'twoFactorExpiry',
      type: 'date',
      admin: {
        condition: (data) => data.role !== 'client',
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
        condition: (data) => data.role !== 'client',
        description: 'Whether user has verified their account',
        position: 'sidebar',
      },
    },
    // Login 2FA fields - hidden for client role
    {
      name: 'loginTwoFactorCode',
      type: 'text',
      admin: {
        condition: (data) => data.role !== 'client',
        description: '6-digit login verification code',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'loginTwoFactorExpiry',
      type: 'date',
      admin: {
        condition: (data) => data.role !== 'client',
        description: 'Expiry time for login code',
        position: 'sidebar',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'showTips',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        condition: (data) => data.role === 'client',
        description: 'Show the welcome tips banner in the client portal. Disabled when the client dismisses it.',
        position: 'sidebar',
      },
    },
    {
      name: 'dashboardTheme',
      type: 'select',
      defaultValue: 'void',
      options: [
        { label: 'Void (Default)', value: 'void' },
        { label: 'Arctic', value: 'arctic' },
        { label: 'Ember', value: 'ember' },
        { label: 'Emerald', value: 'emerald' },
        { label: 'Dusk', value: 'dusk' },
        { label: 'Chrome', value: 'chrome' },
      ],
      admin: {
        description: 'Dashboard color preset',
        position: 'sidebar',
      },
    },
  ],
}



export default buildConfig({
  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor(),

  // Define and configure your collections in this array
  collections: [Media, Clients, Leads, Categories, Tags, Posts, Solutions, Pages, Users, ClientAccounts, Orders, Packages, WebhookEvents, Projects, Tasks, Sprints, Files, Credentials, Timelines],

  // Your Payload secret - should be a complex and secure string, unguessable
  secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
  // Using MongoDB adapter
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb+srv://chance:ara9YRAkRe7blAqF@orcapod.f5yp3f7.mongodb.net/orcapod',
  }),
  // Email configuration using Gmail SMTP via nodemailer
  //
  // SENDER ADDRESS: SMTP_USER must equal EMAIL_FROM.
  // Gmail rewrites the From header to the authenticated user, so we authenticate
  // directly as carbon@orcaclub.pro (the desired sender). Set the app password
  // in SMTP_PASS — see .env.example for setup steps.
  email: nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
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
      // Custom admin actions (floating action button)
      actions: ['@/components/payload/actions/CreateOrderButton'],
      // Nav links injected after the built-in Payload nav links
      afterNavLinks: ['@/components/payload/timelines/TimelinesNavLink'],
      // Custom views
      views: {
        order: {
          Component: '@/components/payload/order-creation/OrderCreationView#OrderCreationView',
          path: '/order',
        },
        timelinesBuilder: {
          Component: '@/components/payload/timelines/TimelinesBuilderView#TimelinesBuilderView',
          path: '/timelines-builder',
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
  plugins: [
    seoPlugin({
      // 'pages' SEO fields are handled manually via the named 'meta' tab
      // in the Pages collection — so we only auto-inject for posts here.
      collections: ['posts'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }: { doc: any }) => `ORCACLUB — ${doc?.title ?? ''}`,
      generateDescription: ({ doc }: { doc: any }) => doc?.excerpt ?? '',
      generateURL: ({ doc }: { doc: any }) =>
        doc?.slug ? `https://orcaclub.pro/sonar/${doc.slug}` : 'https://orcaclub.pro',
    }),
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
      webhooks: {
        'invoice.paid': (args) => handleInvoicePaid(args as any),
        'invoice.payment_failed': (args) => handleInvoicePaymentFailed(args as any),
        'invoice.voided': (args) => handleInvoiceVoided(args as any),
        'invoice.marked_uncollectible': (args) => handleInvoiceVoided(args as any),
      },
    }),
  ],
})
