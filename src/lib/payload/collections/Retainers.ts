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
          admin: { width: '25%', description: 'Playbook tier — drives preset fee/hours in the builder.' },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'active',
          index: true,
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
          admin: { width: '25%', description: 'Inactive retainers are hidden from the dashboard; their logged hours are kept.' },
        },
        {
          name: 'startDate',
          type: 'date',
          admin: { width: '25%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'activatedAt',
          type: 'date',
          admin: {
            width: '25%',
            readOnly: true,
            date: { pickerAppearance: 'dayOnly' },
            description: 'Auto-set when activated — the billing-cycle anchor day.',
          },
          hooks: {
            beforeChange: [
              ({ siblingData, value }) => {
                // Stamp the first time it goes active; preserve the anchor thereafter.
                if (siblingData?.status === 'active' && !value) return new Date()
                return value
              },
            ],
          },
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
      name: 'deactivateOn',
      type: 'date',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayOnly' },
        description: 'Scheduled deactivation — retainer stays active until this date, then flips inactive.',
        condition: (data) => Boolean(data?.deactivateOn),
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal notes' },
    },
    // ── Scheduled plan change (next cycle) ──────────────────────────────────────
    // One pending change written/read by server actions (not hand-edited), applied
    // at the next billing cycle. Hidden in admin until a change is scheduled.
    {
      type: 'collapsible',
      label: 'Scheduled change (next cycle)',
      admin: { condition: (data) => Boolean(data?.pendingEffectiveFrom) },
      fields: [
        {
          name: 'pendingTier',
          type: 'select',
          options: [
            { label: 'Basic', value: 'basic' },
            { label: 'Growth', value: 'growth' },
            { label: 'Enterprise', value: 'enterprise' },
          ],
          admin: { readOnly: true, condition: (data) => Boolean(data?.pendingEffectiveFrom) },
        },
        {
          name: 'pendingMonthlyFee',
          type: 'number',
          min: 0,
          admin: { readOnly: true, condition: (data) => Boolean(data?.pendingEffectiveFrom) },
        },
        {
          name: 'pendingHoursPerMonth',
          type: 'number',
          min: 0,
          admin: { readOnly: true, condition: (data) => Boolean(data?.pendingEffectiveFrom) },
        },
        {
          name: 'pendingOverageRate',
          type: 'number',
          min: 0,
          admin: { readOnly: true, condition: (data) => Boolean(data?.pendingEffectiveFrom) },
        },
        {
          name: 'pendingEffectiveFrom',
          type: 'date',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayOnly' },
            description: 'When the scheduled change takes effect.',
            condition: (data) => Boolean(data?.pendingEffectiveFrom),
          },
        },
      ],
    },
  ],
}

export default Retainers
