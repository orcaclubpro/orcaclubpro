import type { CollectionConfig } from 'payload'
import { anyone, adminOrUser, adminOnly } from '@/lib/payload/access'

const formatSlug = (val: string): string =>
  val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()

export const Timelines: CollectionConfig = {
  slug: 'timelines',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'eyebrow', 'slug'],
    group: 'Content',
    description: 'Interactive horizontal timeline pages for project roadmaps',
    components: {
      views: {
        edit: {
          preview: {
            Component: '@/components/payload/timelines/TimelinePreviewTab',
            path: '/preview',
            tab: {
              label: 'Preview',
              href: '/preview',
            },
          },
        },
      },
    },
  },
  access: {
    read: anyone,
    create: adminOrUser,
    update: adminOrUser,
    delete: adminOnly,
  },
  fields: [
    // ── Header fields ──
    {
      name: 'eyebrow',
      type: 'text',
      required: true,
      admin: {
        description: 'Small label above the title (e.g. "Kawai Digital · Site Relaunch")',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Main heading (e.g. "Launch")',
      },
    },
    {
      name: 'titleEmphasis',
      type: 'text',
      label: 'Title Emphasis',
      admin: {
        description: 'Italic gold word appended to title (e.g. "Roadmap")',
      },
    },
    {
      name: 'dateRange',
      type: 'text',
      label: 'Date Range',
      admin: {
        description: 'Header meta date span (e.g. "March 2 – April 2026")',
      },
    },
    {
      name: 'metaLabel',
      type: 'text',
      label: 'Meta Label',
      admin: {
        description: 'Second line of header meta (e.g. "Internal Planning Doc")',
      },
    },
    {
      name: 'style',
      type: 'select',
      label: 'Visual Style',
      defaultValue: 'cinematic',
      admin: {
        position: 'sidebar',
        description: 'Controls the visual presentation of the public timeline page',
      },
      options: [
        { label: '🎬 Cinematic — Dark gold horizontal scroll', value: 'cinematic' },
        { label: '📋 Vertical Clean — Minimal scrollable roadmap', value: 'vertical-clean' },
        { label: '📐 Blueprint — Technical dark navy grid', value: 'blueprint' },
        { label: '📰 Editorial — Magazine high-contrast layout', value: 'editorial' },
        { label: '💻 Terminal — CLI green-on-black output', value: 'terminal' },
      ],
    },
    {
      name: 'accessCode',
      type: 'text',
      admin: {
        description: 'Optional. If set, visitors must enter this code to view the timeline at /orcaclub/projects/[slug].',
        position: 'sidebar',
        placeholder: 'e.g. ORCA-2026',
      },
      access: {
        read: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'user')),
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL path — auto-generated from title (e.g. "kawai-launch")',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (typeof value === 'string' && value) return formatSlug(value)
            if (data?.title) return formatSlug(data.title as string)
            return value
          },
        ],
      },
    },

    // ── Timeline blocks ──
    {
      name: 'phases',
      type: 'blocks',
      label: 'Timeline Blocks',
      admin: {
        description: 'Add phase cards, checklist blocks, or a launch block in order',
      },
      blocks: [
        // ── Phase Card ──
        {
          slug: 'phase',
          labels: { singular: 'Phase Card', plural: 'Phase Cards' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'dateRange',
                  type: 'text',
                  required: true,
                  label: 'Date Range',
                  admin: {
                    width: '50%',
                    description: 'e.g. "Mar 2 – 6"',
                  },
                },
                {
                  name: 'tag',
                  type: 'text',
                  label: 'Tag Label',
                  admin: {
                    width: '50%',
                    description: 'e.g. "Setup", "Integrate", "Pre-Launch"',
                  },
                },
              ],
            },
            {
              name: 'tagColor',
              type: 'select',
              label: 'Tag Color',
              defaultValue: 'build',
              options: [
                { label: 'Build — teal green', value: 'build' },
                { label: 'Integrate — purple', value: 'integrate' },
                { label: 'Touch-Up — orange', value: 'touchup' },
                { label: 'Pre-Launch — red', value: 'prep' },
              ],
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'items',
              type: 'array',
              label: 'Work Items',
              admin: {
                description: 'Bullet points inside the card',
              },
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'dealerPill',
              type: 'group',
              label: 'Notification Pill (optional)',
              admin: {
                description: 'Highlighted callout at the bottom of the card',
              },
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'text',
                  type: 'text',
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                    description: 'e.g. "End of week — Soft launch to select dealers for testing"',
                  },
                },
              ],
            },
          ],
        },

        // ── Checklist Block ──
        {
          slug: 'checklist',
          labels: { singular: 'Checklist Block', plural: 'Checklist Blocks' },
          fields: [
            {
              name: 'dateLabel',
              type: 'text',
              label: 'Date Label',
              admin: {
                description: 'Badge text above the node (e.g. "Pre-Launch Checklist")',
              },
            },
            {
              name: 'tag',
              type: 'text',
              label: 'Tag Label',
              defaultValue: 'Must Complete',
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              admin: {
                description: 'e.g. "Launch Requirements"',
              },
            },
            {
              name: 'items',
              type: 'array',
              label: 'Checklist Items',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'note',
                  type: 'text',
                  label: 'Warning Note (optional)',
                  admin: {
                    description: 'Small warning shown below the item text',
                  },
                },
              ],
            },
          ],
        },

        // ── Launch Block ──
        {
          slug: 'launch',
          labels: { singular: 'Launch Block', plural: 'Launch Blocks' },
          fields: [
            {
              name: 'dateLabel',
              type: 'text',
              label: 'Date Label',
              defaultValue: 'Early – Mid April',
              admin: {
                description: 'Badge above the pulsing node',
              },
            },
            {
              name: 'label',
              type: 'text',
              label: 'Label (small, above title)',
              defaultValue: 'Go Live',
            },
            {
              name: 'title',
              type: 'text',
              admin: {
                description: 'Non-italic part (e.g. "Site")',
              },
              defaultValue: 'Site',
            },
            {
              name: 'titleEmphasis',
              type: 'text',
              label: 'Title Emphasis (italic gold)',
              defaultValue: 'Launch',
            },
            {
              name: 'subtitle',
              type: 'text',
              defaultValue: 'Public · Full Release',
            },
          ],
        },
      ],
    },
  ],
}
