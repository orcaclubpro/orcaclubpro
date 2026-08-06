import type { CollectionConfig } from 'payload'
import { adminOrUser, adminOnly } from '../access/index'

/**
 * PackageWorkEntries Collection
 *
 * The work log for fixed-price proposal packages — the milestone counterpart to
 * `retainer-time-entries`. Each entry is either PLANNED future work ("what's left")
 * or LOGGED completed work.
 *
 * Attribution is consume-on-invoice: a logged entry is *pending* until a scheduled
 * payment's invoice consumes it, at which point `billedOrderId` is stamped with the
 * Order that carried it as a $0 line. There is no billing-term snapshot — a milestone
 * payment's price is fixed on the package's `paymentSchedule` entry, and `hours` here
 * are informational only and never billed.
 *
 * `clientAccount` is denormalized from the package so a client's whole log can be
 * queried in one go (see src/actions/packageWork.ts).
 */
const PackageWorkEntries: CollectionConfig = {
  slug: 'package-work-entries',
  admin: {
    useAsTitle: 'description',
    group: 'Clients',
    defaultColumns: ['date', 'status', 'category', 'package', 'billedOrderId'],
    description: 'Planned and completed work logged against a proposal package, consumed by scheduled-payment invoices.',
  },
  access: {
    create: adminOrUser,
    read: adminOrUser,
    update: adminOrUser,
    delete: adminOnly,
  },
  indexes: [
    { fields: ['package', 'date'] },
    { fields: ['package', 'billedOrderId'] },
  ],
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          index: true,
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'hours',
          type: 'number',
          min: 0,
          admin: {
            width: '50%',
            description: 'Optional — informational only. Never billed.',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'logged',
      required: true,
      index: true,
      options: [
        { label: 'Planned', value: 'planned' },
        { label: 'Logged', value: 'logged' },
      ],
      admin: { description: 'Planned = future work ("what\'s left"); Logged = work done, eligible for the next invoice.' },
    },
    {
      name: 'completion',
      type: 'select',
      defaultValue: 'incomplete',
      options: [
        { label: 'Incomplete', value: 'incomplete' },
        { label: 'Complete', value: 'complete' },
      ],
      admin: { description: 'Meaningful on planned entries — flipped to complete when the planned work is logged as a separate entry.' },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'work',
      options: [
        { label: 'Work', value: 'work' },
        { label: 'Design', value: 'design' },
        { label: 'Revision', value: 'revision' },
        { label: 'Meeting', value: 'meeting' },
      ],
      admin: { description: 'Recap bucket this entry rolls up into.' },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'package',
      type: 'relationship',
      relationTo: 'packages',
      required: true,
      index: true,
      admin: { description: 'Must be a proposal package — enforced in src/actions/packageWork.ts.' },
    },
    {
      name: 'clientAccount',
      type: 'relationship',
      relationTo: 'client-accounts',
      required: true,
      index: true,
    },
    {
      name: 'billedOrderId',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description: 'Set when a scheduled-payment invoice consumes this entry. Empty = pending.',
      },
    },
    {
      name: 'loggedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, description: 'Staff member who logged this entry' },
    },
  ],
}

export default PackageWorkEntries
