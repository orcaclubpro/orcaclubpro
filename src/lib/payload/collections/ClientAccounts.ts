import type { CollectionConfig } from 'payload'
import { createShopifyCustomerHook } from '../hooks/createShopifyCustomer'
import { createStripeCustomerHook } from '../hooks/createStripeCustomer'

const ClientAccounts: CollectionConfig = {
  slug: 'client-accounts',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'shopifyCustomerId', 'stripeCustomerId', 'accountBalance', 'totalOrders', 'createdAt'],
    group: 'Clients',
  },
  hooks: {
    beforeChange: [createShopifyCustomerHook, createStripeCustomerHook],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
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
                defaultColumns: ['orderNumber', 'orderType', 'amount', 'status', 'createdAt'],
              },
            },
          ],
        },
      ],
    },
  ],
}

export default ClientAccounts
