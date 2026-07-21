import type { CollectionConfig } from 'payload'
import { adminOrUser, adminOnly } from '../access/index'

/**
 * ServiceItems Collection
 *
 * A curated catalog of reusable services that staff pick from when building
 * packages, instead of re-typing the same line items by hand each time.
 *
 * When an item is added to a package, its values are SNAPSHOTTED into the
 * package's lineItems array — later edits to the catalog item never mutate
 * placed line items (same copy model as template → proposal → order → invoice).
 */
const ServiceItems: CollectionConfig = {
  slug: 'service-items',
  admin: {
    useAsTitle: 'name',
    group: 'Clients',
    defaultColumns: ['name', 'billingType', 'defaultPrice', 'usageCount', 'archived'],
    listSearchableFields: ['name', 'description'],
    description: 'Reusable service catalog — staff pick from these when building packages.',
  },
  access: {
    create: adminOrUser,
    read: adminOrUser,
    update: adminOrUser,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
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
          required: true,
          defaultValue: 'fixed',
          options: [
            { label: 'Fixed', value: 'fixed' },
            { label: 'Hourly', value: 'hourly' },
            { label: 'Recurring', value: 'recurring' },
          ],
          admin: {
            width: '34%',
            description: 'Fixed: flat price. Hourly: hours × rate. Recurring: per-interval subscription.',
          },
        },
        {
          name: 'defaultPrice',
          type: 'number',
          min: 0,
          admin: {
            width: '33%',
            description: 'Fixed: total price. Recurring: amount per interval. (Hourly uses rate below.)',
          },
        },
        {
          name: 'defaultRate',
          type: 'number',
          min: 0,
          defaultValue: 40,
          admin: {
            width: '33%',
            description: 'Hourly rate (USD/hr)',
            condition: (data, siblingData) => siblingData?.billingType === 'hourly',
          },
        },
      ],
    },
    {
      name: 'defaultInterval',
      type: 'select',
      options: [
        { label: 'Monthly', value: 'month' },
        { label: 'Yearly', value: 'year' },
      ],
      defaultValue: 'month',
      admin: {
        description: 'Billing interval for recurring items',
        condition: (data, siblingData) => siblingData?.billingType === 'recurring',
      },
    },
    {
      name: 'starred',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Prioritized — starred items render first in the builder catalog',
      },
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Hidden from the builder catalog when checked',
      },
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'How many times this item has been added to a package',
      },
    },
  ],
}

export default ServiceItems
