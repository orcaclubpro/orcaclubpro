import type { CollectionConfig } from 'payload'
import { createShopifyCustomerHook } from '../hooks/createShopifyCustomer'
import { createStripeCustomerHook } from '../hooks/createStripeCustomer'
import { syncClientAccountToUser } from '../hooks/syncClientAccountToUser'

const ClientAccounts: CollectionConfig = {
  slug: 'client-accounts',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'shopifyCustomerId', 'stripeCustomerId', 'accountBalance', 'totalOrders', 'createdAt'],
    group: 'Clients',
  },
  hooks: {
    beforeChange: [createShopifyCustomerHook, createStripeCustomerHook],
    afterChange: [syncClientAccountToUser],
  },
  access: {
    read: ({ req: { user } }) => {
      // Public/unauthenticated cannot read
      if (!user) return false

      // Admins can read all
      if (user.role === 'admin') return true

      // Client users can only read their own account
      if (user.role === 'client' && user.clientAccount) {
        return {
          id: { equals: user.clientAccount },
        }
      }

      // Regular users can read all
      return true
    },
    create: ({ req: { user } }) => {
      // Only authenticated users can create
      if (!user) return false
      // Clients cannot create new accounts manually
      if (user.role === 'client') return false
      return true
    },
    update: ({ req: { user } }) => {
      if (!user) return false

      // Admins can update all
      if (user.role === 'admin') return true

      // Client users can only update their own account
      if (user.role === 'client' && user.clientAccount) {
        return {
          id: { equals: user.clientAccount },
        }
      }

      // Regular users can update all
      return true
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Details',
          description: 'Client account information and settings',
          fields: [
            // BASIC INFO
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'Client full name',
              },
            },
            {
              name: 'email',
              type: 'email',
              required: true,
              unique: true,
              index: true,
              admin: {
                description: 'Client email address',
              },
            },
            {
              name: 'firstName',
              type: 'text',
              required: true,
              admin: {
                description: 'Client first name',
              },
            },
            {
              name: 'lastName',
              type: 'text',
              required: true,
              admin: {
                description: 'Client last name',
              },
            },
            {
              name: 'company',
              type: 'text',
              admin: {
                description: 'Client company name',
              },
            },

            // SHOPIFY INTEGRATION
            {
              name: 'shopifyCustomerId',
              type: 'text',
              unique: true,
              index: true,
              admin: {
                description: 'Shopify customer GID (e.g., gid://shopify/Customer/123)',
                position: 'sidebar',
              },
            },

            // STRIPE INTEGRATION
            {
              name: 'stripeCustomerId',
              type: 'text',
              unique: true,
              index: true,
              admin: {
                description: 'Stripe customer ID (e.g., cus_xxxxx) - auto-created on first Stripe order',
                position: 'sidebar',
              },
            },

            // FINANCIAL TRACKING (Auto-calculated via hooks)
            {
              name: 'accountBalance',
              type: 'number',
              defaultValue: 0,
              admin: {
                description: 'Outstanding balance from PENDING orders (what client owes) - auto-updated',
                readOnly: true,
                position: 'sidebar',
              },
            },
            {
              name: 'totalOrders',
              type: 'number',
              defaultValue: 0,
              admin: {
                description: 'Total number of ALL orders (all statuses) - auto-calculated',
                readOnly: true,
                position: 'sidebar',
              },
            },

            // RELATIONSHIP TO USER
            {
              name: 'assignedTo',
              type: 'relationship',
              relationTo: 'users',
              admin: {
                description: 'User responsible for this client account',
                position: 'sidebar',
              },
              hooks: {
                beforeValidate: [
                  async ({ value, req }) => {
                    // If no value provided, find chance@orcaclub.pro
                    if (!value) {
                      const defaultUser = await req.payload.find({
                        collection: 'users',
                        where: { email: { equals: 'chance@orcaclub.pro' } },
                        limit: 1,
                      })

                      return defaultUser.docs[0]?.id || null
                    }
                    return value
                  },
                ],
              },
            },
          ],
        },
        {
          label: 'Orders',
          description: 'All orders for this client account',
          fields: [
            {
              name: 'orders',
              type: 'join',
              collection: 'orders',
              on: 'clientAccount',
              admin: {
                allowCreate: false,
                description: 'Orders linked to this client account',
                defaultColumns: ['orderNumber', 'amount', 'status', 'createdAt'],
              },
            },
          ],
        },
        {
          label: 'Projects',
          description: 'Manage projects for this client',
          fields: [
            {
              name: 'projects',
              type: 'array',
              labels: {
                singular: 'Project',
                plural: 'Projects',
              },
              admin: {
                initCollapsed: true,
                description: 'Client projects with linked orders',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      required: true,
                      admin: {
                        description: 'Project name',
                        width: '60%',
                      },
                    },
                    {
                      name: 'status',
                      type: 'select',
                      required: true,
                      defaultValue: 'active',
                      options: [
                        { label: 'Active', value: 'active' },
                        { label: 'On Hold', value: 'on-hold' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' },
                      ],
                      admin: {
                        description: 'Project status',
                        width: '40%',
                      },
                    },
                  ],
                },
                {
                  name: 'description',
                  type: 'textarea',
                  admin: {
                    description: 'Project description and notes',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'startDate',
                      type: 'date',
                      admin: {
                        description: 'Project start date',
                        width: '50%',
                      },
                    },
                    {
                      name: 'endDate',
                      type: 'date',
                      admin: {
                        description: 'Project end date',
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  name: 'budget',
                  type: 'number',
                  min: 0,
                  admin: {
                    description: 'Project budget (USD)',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default ClientAccounts
