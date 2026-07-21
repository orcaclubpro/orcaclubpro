import type { CollectionConfig } from 'payload'
import { adminOrUser, adminOnly } from '../access/index'

const Packages: CollectionConfig = {
  slug: 'packages',
  admin: {
    useAsTitle: 'name',
    group: 'Clients',
    defaultColumns: ['name', 'type', 'clientAccount', 'status', 'createdAt'],
    listSearchableFields: ['name', 'description'],
  },
  access: {
    create: adminOrUser,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'user') return true
      if (user.role === 'client' && user.clientAccount) {
        const clientAccountId =
          typeof user.clientAccount === 'string'
            ? user.clientAccount
            : (user.clientAccount as any).id
        return {
          and: [
            { clientAccount: { equals: clientAccountId } } as any,
            { type: { equals: 'proposal' } } as any,
          ],
        } as any
      }
      return false
    },
    update: adminOrUser,
    delete: adminOnly,
  },
  indexes: [
    // Dashboard query: packages for a client account filtered by type
    { fields: ['clientAccount', 'type'] },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'coverMessage',
      type: 'textarea',
      admin: {
        description: 'Shown above line items in the proposal PDF',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal / contextual notes (also shown in PDF)',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Template', value: 'template' },
        { label: 'Proposal', value: 'proposal' },
      ],
      defaultValue: 'template',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Template: reusable library item. Proposal: frozen snapshot assigned to a client.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'clientAccount',
      type: 'relationship',
      relationTo: 'client-accounts',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Client this proposal is assigned to (proposals only)',
        condition: (data) => data.type === 'proposal',
      },
    },
    {
      name: 'sourcePackage',
      type: 'relationship',
      relationTo: 'packages',
      admin: {
        position: 'sidebar',
        description: 'Template this proposal was created from',
        readOnly: true,
        condition: (data) => data.type === 'proposal',
      },
    },
    {
      name: 'projectRef',
      type: 'relationship',
      relationTo: 'projects',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Project this proposal is linked to',
        condition: (data) => data.type === 'proposal',
      },
    },
    {
      name: 'requestedItems',
      type: 'array',
      admin: {
        description: 'Add-on items requested by the client via their portal',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'requestedAt', type: 'date' },
      ],
    },
    {
      name: 'paymentSchedule',
      type: 'array',
      admin: {
        description: 'Planned payment schedule — entries are invoiced individually when ready',
        initCollapsed: true,
      },
      labels: { singular: 'Scheduled Payment', plural: 'Scheduled Payments' },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'e.g. Deposit, Installment 1, Final Payment' },
        },
        {
          name: 'entryType',
          type: 'select',
          defaultValue: 'installment',
          options: [
            { label: 'Deposit', value: 'deposit' },
            { label: 'Installment', value: 'installment' },
            { label: 'Balance', value: 'balance' },
          ],
          admin: {
            description: 'Maps to the Order invoiceType — replaces label string-matching',
          },
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
          admin: { description: 'Dollar amount for this payment' },
        },
        {
          name: 'dueDate',
          type: 'date',
          admin: {
            description: 'When this payment is due',
            date: { pickerAppearance: 'dayOnly' },
          },
        },
        {
          name: 'orderId',
          type: 'text',
          admin: { description: 'Set when invoiced — links to the Order record', readOnly: true },
        },
        {
          name: 'invoicedAt',
          type: 'date',
          admin: { description: 'When the invoice was sent', readOnly: true },
        },
      ],
    },
    {
      name: 'lineItems',
      type: 'array',
      labels: {
        singular: 'Line Item',
        plural: 'Line Items',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'billingType',
              type: 'select',
              defaultValue: 'fixed',
              options: [
                { label: 'Fixed', value: 'fixed' },
                { label: 'Hourly', value: 'hourly' },
                { label: 'Recurring', value: 'recurring' },
              ],
              admin: {
                width: '50%',
                description: 'Authoritative billing type. isRecurring/recurringInterval are derived from this on save.',
              },
            },
            {
              name: 'hours',
              type: 'number',
              min: 0,
              admin: {
                width: '50%',
                description: 'Hours worked (hourly items) — total = hours × rate is stored in price',
                condition: (data, siblingData) => siblingData?.billingType === 'hourly',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'price',
              type: 'number',
              required: true,
              min: 0,
              admin: {
                width: '33%',
                description: 'Base price per unit (USD)',
              },
            },
            {
              name: 'adjustedPrice',
              type: 'number',
              min: 0,
              admin: {
                width: '33%',
                description: 'Override price shown on proposals (optional — leave blank to use base price)',
              },
            },
            {
              name: 'quantity',
              type: 'number',
              defaultValue: 1,
              min: 1,
              admin: {
                width: '33%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'isRecurring',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                width: '50%',
                description: 'Recurring subscription item?',
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
                width: '50%',
                description: 'Billing interval',
                condition: (data, siblingData) => siblingData?.isRecurring === true,
              },
            },
          ],
        },
        {
          name: 'contractTermMonths',
          type: 'number',
          min: 0,
          admin: {
            description: 'Contract length in months (recurring items)',
            condition: (data, siblingData) => siblingData?.billingType === 'recurring',
          },
        },
        {
          name: 'isAddOn',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Offer as an optional add-on the client can request (excluded from proposal total)',
          },
        },
        {
          name: 'sourceServiceItem',
          type: 'relationship',
          relationTo: 'service-items',
          admin: {
            description: 'Catalog item this line was created from (provenance only)',
            readOnly: true,
          },
        },
        {
          name: 'stripePriceId',
          type: 'text',
          admin: {
            description: 'Stripe Price ID (optional)',
          },
        },
      ],
    },

  ],
}

export default Packages
