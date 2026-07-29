import type { CollectionConfig } from 'payload'
import { adminOrUser, adminOnly } from '../access/index'

/**
 * Retainers Collection
 *
 * A monthly retainer agreement for a client account — the tier, fee, and the
 * monthly hour cap staff log work against. One ACTIVE retainer per client at a
 * time (enforced in src/actions/retainers.ts). Hours live in the separate
 * `retainer-time-entries` collection and are summed per calendar month against
 * `hoursPerMonth` — there is no rollover.
 *
 * Payment/Stripe is intentionally out of scope: overage is displayed, not charged.
 */
const Retainers: CollectionConfig = {
  slug: 'retainers',
  admin: {
    useAsTitle: 'tier',
    group: 'Clients',
    defaultColumns: ['clientAccount', 'tier', 'monthlyFee', 'hoursPerMonth', 'status'],
    description: 'Monthly retainer agreements — one active per client. Hours are logged as retainer-time-entries.',
  },
  access: {
    create: adminOrUser,
    read: adminOrUser,
    update: adminOrUser,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'clientAccount',
      type: 'relationship',
      relationTo: 'client-accounts',
      required: true,
      index: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'tier',
          type: 'select',
          required: true,
          defaultValue: 'basic',
          options: [
            { label: 'Basic', value: 'basic' },
            { label: 'Growth', value: 'growth' },
            { label: 'Enterprise', value: 'enterprise' },
          ],
          admin: { width: '34%', description: 'Playbook tier — drives preset fee/hours in the builder.' },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'active',
          index: true,
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Paused', value: 'paused' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'startDate',
          type: 'date',
          admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'monthlyFee',
          type: 'number',
          min: 0,
          admin: { width: '34%', description: 'USD per month' },
        },
        {
          name: 'hoursPerMonth',
          type: 'number',
          min: 0,
          admin: { width: '33%', description: 'Monthly hour cap (no rollover)' },
        },
        {
          name: 'overageRate',
          type: 'number',
          min: 0,
          defaultValue: 65,
          admin: { width: '33%', description: 'USD/hr charged past the cap (displayed only for now)' },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal notes' },
    },
  ],
}

export default Retainers
