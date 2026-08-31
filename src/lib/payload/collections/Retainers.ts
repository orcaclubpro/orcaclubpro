import type { CollectionConfig } from 'payload'
import { adminOrUser, adminOnly } from '../access/index'

/**
 * Retainers Collection
 *
 * A monthly retainer agreement for a client account — the tier, fee, and the
 * monthly hour cap staff log work against. One live retainer per client at a
 * time (enforced in src/actions/retainers.ts). Hours live in the separate
 * `retainer-time-entries` collection and are summed per calendar month against
 * `hoursPerMonth` — there is no rollover.
 *
 * This is really the client's ENGAGEMENT record, and `status` is its life in one line:
 * `scoping` (being pitched, no plan yet) → `active` (on a recurring plan) → `inactive`
 * (closed). A SCOPING record is an engagement being pitched: staff log planned work
 * (draft entries with hour estimates) and work already done (logged entries) against
 * it, but there is no fee, no hour cap, and nothing billable. Pricing is set from that
 * evidence afterwards: `activateRetainerPlan` writes the terms, flips the status, and
 * stamps the anchor.
 *
 * Ending a plan (see `endRetainerPlan`) always closes the engagement, stamping
 * `endedAt`. A closed record stays reachable read-only so a final cycle stranded by an
 * immediate end can still be invoiced — its hours are kept, never deleted.
 *
 * Non-recurring work is NOT modelled here. A fixed-price job is a `packages` proposal,
 * built in the Build station and run from Milestones, which already own itemized lines,
 * payment schedules, proposal documents, and a work log.
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
          admin: { width: '25%', description: 'Playbook tier — drives preset fee/hours in the builder. Nominal while scoping.' },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'active',
          index: true,
          options: [
            { label: 'Scoping', value: 'scoping' },
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
          admin: {
            width: '25%',
            description: 'Scoping = being pitched, no plan yet (no cycle, not billable) — pricing it starts the first cycle. Inactive retainers are off the dashboard board but still reachable read-only, so a final unbilled cycle can be invoiced; their logged hours are kept.',
          },
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
            description: 'Auto-set when activated — the billing-cycle anchor day. Unset while scoping.',
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
          admin: { width: '34%', description: 'USD per month — empty while scoping.' },
        },
        {
          name: 'hoursPerMonth',
          type: 'number',
          min: 0,
          admin: { width: '33%', description: 'Monthly hour cap (no rollover) — empty while scoping.' },
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
        description: 'Scheduled wind-down — the plan stays active and billable until this date, then closes.',
        condition: (data) => Boolean(data?.deactivateOn),
      },
    },
    {
      name: 'endedAt',
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayOnly' },
        description:
          'When the plan stopped billing. Bounds the closed era the read-only cycle view walks — cycles before it are billed history, and the last one may still need an invoice.',
        condition: (data) => Boolean(data?.endedAt),
      },
    },
    {
      // Superseded by `endedAt`, which holds the same instant. Kept so records closed
      // under the old "Non-Retainer client" state still resolve their era; nothing
      // writes it any more, and settleRetainer migrates them on read.
      name: 'nonRetainerSince',
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayOnly' },
        description: 'Deprecated — see Ended At.',
        condition: (data) => Boolean(data?.nonRetainerSince),
      },
    },
    // ── Scope ───────────────────────────────────────────────────────────────────
    // The pitch headline. The scope ITEMS are not stored here — they are ordinary
    // `retainer-time-entries` on this retainer: drafts = planned work (carrying an
    // hour estimate), logged = work already done. That way the pitch is built from
    // the same records the retainer runs on, and carries straight into cycle one.
    {
      name: 'scopeSummary',
      type: 'textarea',
      admin: { description: 'The pitch — what this retainer covers, in client-facing words.' },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal notes' },
    },
    {
      name: 'convertedPackages',
      type: 'relationship',
      relationTo: 'packages',
      hasMany: true,
      admin: {
        readOnly: true,
        description:
          'Deprecated — proposals sold against this engagement back when one-off work was scoped here. Fixed-price work is a package now, owned by Build and Milestones.',
        condition: (data) => Boolean(data?.convertedPackages?.length),
      },
    },
    {
      // Superseded by `convertedPackages`. Kept so records converted before the change
      // still show what they became; nothing writes it any more.
      name: 'convertedPackage',
      type: 'relationship',
      relationTo: 'packages',
      admin: {
        readOnly: true,
        description: 'Deprecated — see Converted Packages.',
        condition: (data) => Boolean(data?.convertedPackage),
      },
    },
    // ── Proposal (pre-activation) ───────────────────────────────────────────────
    // The priced offer sent to the client BEFORE the retainer starts. Terms live here
    // rather than in the live fields so nothing bills off a proposal: activation copies
    // them across. Written by server actions (setRetainerProposal / send…), not by hand.
    {
      type: 'collapsible',
      label: 'Proposal (pre-activation)',
      admin: {
        condition: (data) => data?.status === 'scoping' || Boolean(data?.proposalSentAt),
        description: 'The priced offer sent to the client. Copied into the live terms on activation.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'proposedTier',
              type: 'select',
              options: [
                { label: 'Basic', value: 'basic' },
                { label: 'Growth', value: 'growth' },
                { label: 'Enterprise', value: 'enterprise' },
              ],
              admin: { width: '25%' },
            },
            { name: 'proposedMonthlyFee', type: 'number', min: 0, admin: { width: '25%', description: 'USD/mo' } },
            { name: 'proposedHoursPerMonth', type: 'number', min: 0, admin: { width: '25%', description: 'Hour cap' } },
            { name: 'proposedOverageRate', type: 'number', min: 0, admin: { width: '25%', description: 'USD/hr' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'proposedStartDate',
              type: 'date',
              admin: { width: '50%', date: { pickerAppearance: 'dayOnly' }, description: 'Proposed first cycle start.' },
            },
            {
              name: 'proposalIncludesCompletedWork',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                width: '50%',
                description: 'Present the work already delivered as included at no extra charge.',
              },
            },
          ],
        },
        {
          name: 'proposalNote',
          type: 'textarea',
          admin: { description: 'Cover note shown on the proposal document and in the email.' },
        },
        {
          name: 'proposalSentAt',
          type: 'date',
          admin: { readOnly: true, date: { pickerAppearance: 'dayOnly' }, description: 'Last time the proposal was sent.' },
        },
        {
          name: 'proposalSentTo',
          type: 'array',
          admin: { readOnly: true, description: 'Recipients of the most recent send.' },
          fields: [{ name: 'email', type: 'text' }],
        },
      ],
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
