import type { CollectionConfig } from 'payload'
import { adminOrUser, adminOnly } from '../access/index'

/**
 * RetainerTimeEntries Collection
 *
 * The hour log for retainers. Each entry is time spent against a client's
 * retainer on a given day. Entries are summed per calendar month (of `date`)
 * against the retainer's `hoursPerMonth` cap — no rollover between months.
 *
 * `clientAccount` is denormalized from the retainer so a month's entries can be
 * queried by client + date range in one go (see src/actions/retainers.ts).
 */
const RetainerTimeEntries: CollectionConfig = {
  slug: 'retainer-time-entries',
  admin: {
    useAsTitle: 'description',
    group: 'Clients',
    defaultColumns: ['date', 'hours', 'category', 'clientAccount', 'loggedBy'],
    description: 'Hours logged against a retainer, summed per calendar month against the cap.',
  },
  access: {
    create: adminOrUser,
    read: adminOrUser,
    update: adminOrUser,
    delete: adminOnly,
  },
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
          required: true,
          min: 0,
          admin: { width: '50%' },
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
        { label: 'Draft', value: 'draft' },
        { label: 'Logged', value: 'logged' },
      ],
      admin: { description: 'Draft = a planned task with no hours yet; Logged = actual time counted against the cap.' },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'work',
      options: [
        { label: 'Work', value: 'work' },
        { label: 'Meeting', value: 'meeting' },
        { label: 'Revision', value: 'revision' },
        { label: 'Reporting', value: 'reporting' },
      ],
      admin: { description: 'Meetings, revisions, and reporting all count against the cap (per the playbook).' },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'retainer',
      type: 'relationship',
      relationTo: 'retainers',
      required: true,
      index: true,
    },
    {
      name: 'clientAccount',
      type: 'relationship',
      relationTo: 'client-accounts',
      required: true,
      index: true,
    },
    {
      name: 'loggedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, description: 'Staff member who logged this entry' },
    },
    // ── Term snapshot ──────────────────────────────────────────────────────────
    // The retainer's terms frozen at log time, so past months keep the cap/rate
    // they were actually billed under even after the retainer is later edited.
    // Set in logHours(); read by getRetainerSummary() for non-current months.
    {
      type: 'row',
      fields: [
        {
          name: 'capAtLog',
          type: 'number',
          min: 0,
          admin: { width: '25%', readOnly: true, description: 'hours/mo at log time' },
        },
        {
          name: 'overageRateAtLog',
          type: 'number',
          min: 0,
          admin: { width: '25%', readOnly: true, description: 'overage $/hr at log time' },
        },
        {
          name: 'feeAtLog',
          type: 'number',
          min: 0,
          admin: { width: '25%', readOnly: true, description: 'fee/mo at log time' },
        },
        {
          name: 'tierAtLog',
          type: 'select',
          options: [
            { label: 'Basic', value: 'basic' },
            { label: 'Growth', value: 'growth' },
            { label: 'Enterprise', value: 'enterprise' },
          ],
          admin: { width: '25%', readOnly: true, description: 'tier at log time' },
        },
      ],
    },
  ],
}

export default RetainerTimeEntries
