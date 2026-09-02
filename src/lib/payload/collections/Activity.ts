import type { CollectionConfig } from 'payload'
import { adminOnly, adminOrUser } from '../access'

/**
 * Activity Collection
 *
 * The portal's append-only event feed — one row per thing that happened,
 * newest first, across records that otherwise live in five different
 * collections: orders created, projects created and meaningfully changed,
 * retainer hours logged, and emails sent.
 *
 * WHY NOT PAYLOAD VERSIONS
 * Payload's built-in `versions` feature is the documented audit-log mechanism,
 * but it is a *per-document history*, not a feed: each version is a full
 * snapshot stored in a per-collection `_<slug>_versions` table. Rendering
 * "the last 40 things that happened" from versions means one query per source
 * collection plus a merge in JS, every snapshot is the whole document (heavy),
 * and events that are not document writes at all — an email going out — cannot
 * be represented. So versions stay off; this narrow, denormalized collection is
 * the feed. It is written only by hooks (see hooks/recordActivity.ts).
 *
 * APPEND-ONLY
 * `create` is closed to everyone: rows are written by the Local API with the
 * default `overrideAccess: true` (no user passed), never from the admin UI or
 * REST. `update` is closed outright; only admins may delete.
 *
 * ROW SHAPE
 * Rows are deliberately denormalized — actor name, client name, amount and a
 * portal-relative `href` are copied in at write time so the feed renders from a
 * single depth-0 query with no joins, and so a row still reads correctly after
 * the record it describes is renamed or deleted.
 */
export const Activity: CollectionConfig = {
  slug: 'activity',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['occurredAt', 'kind', 'title', 'actorName', 'clientAccount'],
    group: 'System',
    description: 'Append-only feed of portal events. Written by hooks — never edit by hand.',
  },
  access: {
    // Internal only — hooks create these with overrideAccess (no user passed).
    create: () => false,
    read: adminOrUser,
    update: () => false,
    delete: adminOnly,
  },
  // The feed is always time-ordered, and is usually filtered before it is
  // sorted — by kind (one lane), by client (a client's history), or by actor.
  // Each compound index matches one of those query shapes prefix-first.
  indexes: [
    { fields: ['kind', 'occurredAt'] },
    { fields: ['clientAccount', 'occurredAt'] },
    { fields: ['actor', 'occurredAt'] },
  ],
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          index: true,
          options: [
            { label: 'Order created', value: 'order-created' },
            { label: 'Project created', value: 'project-created' },
            { label: 'Project updated', value: 'project-updated' },
            { label: 'Retainer hours logged', value: 'retainer-log' },
            { label: 'Email sent', value: 'email-sent' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'occurredAt',
          type: 'date',
          required: true,
          index: true,
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayAndTime' },
            description: 'When the event happened. The feed sorts on this, not createdAt.',
          },
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Headline — the first line of the feed row.' },
    },
    {
      name: 'summary',
      type: 'text',
      admin: { description: 'Second line — qualifies the event (status, client, hours).' },
    },
    {
      name: 'href',
      type: 'text',
      admin: {
        description:
          'Portal-relative path WITHOUT the /u/<username> prefix (e.g. /projects/<id>). The view prefixes it.',
      },
    },
    {
      name: 'status',
      type: 'text',
      admin: {
        description:
          'Raw status of the subject at event time (order/project status). The view maps it to a tone.',
      },
    },
    {
      name: 'amount',
      type: 'number',
      admin: { description: 'Money for orders, hours for retainer logs — unit implied by kind.' },
    },
    {
      name: 'recipient',
      type: 'text',
      index: true,
      admin: { description: 'Recipient address for email-sent events.' },
    },

    // ── Who ──────────────────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'actor',
          type: 'relationship',
          relationTo: 'users',
          index: true,
          admin: { width: '50%', description: 'The signed-in user who caused the event, if any.' },
        },
        {
          name: 'actorName',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Name snapshot — survives the user being renamed or deleted.',
          },
        },
      ],
    },

    // ── What it was about ────────────────────────────────────────────────────
    // Optional per kind. Kept as discrete relationships (rather than one
    // polymorphic field) so each is independently indexable and queryable.
    {
      name: 'clientAccount',
      type: 'relationship',
      relationTo: 'client-accounts',
      index: true,
    },
    { name: 'project', type: 'relationship', relationTo: 'projects', index: true },
    { name: 'order', type: 'relationship', relationTo: 'orders' },
    { name: 'retainer', type: 'relationship', relationTo: 'retainers' },

    // ── What changed (project updates) ───────────────────────────────────────
    {
      name: 'changes',
      type: 'array',
      admin: {
        description: 'Meaningful field changes only — status, dates, budget, milestones.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'field', type: 'text', required: true, admin: { width: '33%' } },
            { name: 'from', type: 'text', admin: { width: '33%' } },
            { name: 'to', type: 'text', admin: { width: '33%' } },
          ],
        },
      ],
    },
  ],
}

export default Activity
