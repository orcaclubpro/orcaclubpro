import type { CollectionConfig } from 'payload'
import { updateClientBalance, revertClientBalance } from '../hooks/updateClientBalance'

const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'orderType', 'clientAccount', 'amount', 'status', 'createdAt'],
    group: 'Clients',
  },
  hooks: {
    afterChange: [updateClientBalance],
    afterDelete: [revertClientBalance],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    // ROW 1: Order Number + Status (side by side)
    {
      type: 'row',
      fields: [
        {
          name: 'orderNumber',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: {
            description: 'Order number from Shopify or Stripe (e.g., #1001)',
            width: '50%',
          },
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Pending Payment', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          defaultValue: 'pending',
          required: true,
          index: true,
          admin: {
            description: 'Current order status',
            width: '50%',
          },
        },
      ],
    },

    // ORDER TYPE (Sidebar)
    {
      name: 'orderType',
      type: 'select',
      options: [
        { label: 'Shopify Order', value: 'shopify' },
        { label: 'Stripe Payment', value: 'stripe' },
      ],
      defaultValue: 'shopify',
      required: true,
      index: true,
      admin: {
        description: 'Type of order (Shopify or Stripe)',
        position: 'sidebar',
      },
    },

    // ROW 2: Client Account + Amount (side by side)
    {
      type: 'row',
      fields: [
        {
          name: 'clientAccount',
          type: 'relationship',
          relationTo: 'client-accounts',
          required: true,
          index: true,
          admin: {
            description: 'Client account for this order',
            width: '60%',
          },
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Order total amount (USD)',
            width: '40%',
          },
        },
      ],
    },

    // BALANCE SNAPSHOT (Sidebar)
    {
      name: 'balanceSnapshot',
      type: 'number',
      admin: {
        description: 'Client balance after this order (audit trail)',
        readOnly: true,
        position: 'sidebar',
      },
    },

    // SHOPIFY INTEGRATION
    {
      name: 'shopifyDraftOrderId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Shopify draft order GID',
        position: 'sidebar',
        condition: (data) => data.orderType === 'shopify',
      },
    },
    {
      name: 'shopifyInvoiceUrl',
      type: 'text',
      admin: {
        description: 'Shopify invoice payment URL',
        position: 'sidebar',
        condition: (data) => data.orderType === 'shopify',
        style: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      },
    },

    // STRIPE INTEGRATION
    {
      name: 'stripeInvoiceId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Stripe Invoice ID',
        position: 'sidebar',
        condition: (data) => data.orderType === 'stripe',
      },
    },
    {
      name: 'stripeInvoiceUrl',
      type: 'text',
      admin: {
        description: 'Stripe hosted invoice URL (sent to customer)',
        position: 'sidebar',
        condition: (data) => data.orderType === 'stripe',
        style: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      index: true,
      admin: {
        description: 'Stripe Customer ID',
        position: 'sidebar',
        condition: (data) => data.orderType === 'stripe',
      },
    },
    {
      name: 'stripePaymentIntentId',
      type: 'text',
      admin: {
        description: 'Stripe Payment Intent ID (after payment)',
        position: 'sidebar',
        condition: (data) => data.orderType === 'stripe',
      },
    },

    // LINE ITEMS (Nested array for order details)
    {
      name: 'lineItems',
      type: 'array',
      admin: {
        description: 'Order line items',
        initCollapsed: false,
      },
      fields: [
        // Product/Service Title (full width)
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: 'Product or service name',
          },
        },

        // Row: Quantity + Price (side by side)
        {
          type: 'row',
          fields: [
            {
              name: 'quantity',
              type: 'number',
              required: true,
              min: 1,
              defaultValue: 1,
              admin: {
                description: 'Quantity ordered',
                width: '30%',
              },
            },
            {
              name: 'price',
              type: 'number',
              required: true,
              min: 0,
              admin: {
                description: 'Price per unit (USD)',
                width: '70%',
              },
            },
          ],
        },

        // Row: Recurring + Interval (side by side)
        {
          type: 'row',
          fields: [
            {
              name: 'isRecurring',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Recurring subscription item?',
                width: '50%',
              },
            },
            {
              name: 'recurringInterval',
              type: 'select',
              options: [
                { label: 'Monthly', value: 'month' },
                { label: 'Yearly', value: 'year' },
              ],
              admin: {
                description: 'Billing interval',
                condition: (data, siblingData) => siblingData?.isRecurring === true,
                width: '50%',
              },
            },
          ],
        },

        // Technical IDs (collapsed by default)
        {
          name: 'shopifyVariantId',
          type: 'text',
          admin: {
            description: 'Shopify product variant ID (if applicable)',
          },
        },
        {
          name: 'stripePriceId',
          type: 'text',
          admin: {
            description: 'Stripe Price ID (for subscriptions)',
          },
        },
      ],
    },

    // INVOICES (Email history tracking)
    {
      name: 'invoices',
      type: 'array',
      admin: {
        description: 'Invoice email history (audit trail of all sent invoices)',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'sentAt',
          type: 'date',
          required: true,
          admin: {
            description: 'When the invoice was sent',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'sentTo',
          type: 'email',
          required: true,
          admin: {
            description: 'Email address invoice was sent to',
          },
        },
        {
          name: 'sentBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'User who sent the invoice',
          },
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Sent', value: 'sent' },
            { label: 'Failed', value: 'failed' },
          ],
          defaultValue: 'sent',
          required: true,
          admin: {
            description: 'Invoice send status',
          },
        },
      ],
    },

    // SEND INVOICE BUTTON (UI Component in Sidebar)
    {
      name: 'sendInvoice',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/payload/SendInvoiceButton',
        },
      },
    },
  ],
}

export default Orders
