import type { CollectionConfig } from 'payload'
import { updateClientBalance, revertClientBalance } from '../hooks/updateClientBalance'

const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'clientAccount', 'amount', 'status', 'createdAt'],
    group: 'Clients',
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation }) => {
        // Validate line items exist and amount > 0
        if (!data) return data

        if (operation === 'create' || operation === 'update') {
          if (!data.lineItems || data.lineItems.length === 0) {
            throw new Error('Orders must have at least one line item')
          }

          if (data.amount !== undefined && data.amount <= 0) {
            throw new Error('Order amount must be greater than $0')
          }

          // Calculate expected amount from line items
          const calculatedAmount = data.lineItems.reduce(
            (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
            0
          )

          // Warn if amount doesn't match line items (allow small rounding differences)
          if (data.amount !== undefined && Math.abs(data.amount - calculatedAmount) > 0.01) {
            console.warn(
              `[Order Validation] Amount mismatch: expected ${calculatedAmount}, got ${data.amount}`
            )
          }
        }

        return data
      },
    ],
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
            description: 'Order number from Stripe (e.g., #1001)',
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

    // ROW 2: Client Account + Project + Amount (side by side)
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
            width: '30%',
          },
        },
        {
          name: 'project',
          type: 'text',
          admin: {
            description: 'Project name from client account (optional)',
            width: '40%',
            placeholder: 'Select from client projects',
          },
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
          min: 0.01, // ✅ Prevent $0 orders (minimum 1 cent)
          admin: {
            description: 'Order total amount (USD)',
            width: '30%',
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

    // STRIPE INTEGRATION
    {
      name: 'stripeInvoiceId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Stripe Invoice ID',
        position: 'sidebar',
      },
    },
    {
      name: 'stripeInvoiceUrl',
      type: 'text',
      admin: {
        description: 'Stripe hosted invoice URL (sent to customer)',
        position: 'sidebar',
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
      },
    },
    {
      name: 'stripePaymentIntentId',
      type: 'text',
      admin: {
        description: 'Stripe Payment Intent ID (after payment)',
        position: 'sidebar',
      },
    },

    // LINE ITEMS (Nested array for order details)
    {
      name: 'lineItems',
      type: 'array',
      minRows: 1, // ✅ Require at least one line item
      required: true, // ✅ Field must be present
      admin: {
        description: 'Order line items',
        initCollapsed: false,
      },
      labels: {
        singular: 'Line Item',
        plural: 'Line Items',
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
