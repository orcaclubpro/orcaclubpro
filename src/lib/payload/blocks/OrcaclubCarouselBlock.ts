import type { Block } from 'payload'

export const OrcaclubCarouselBlock: Block = {
  slug: 'orcaclubCarousel',
  interfaceName: 'OrcaclubCarouselBlock',
  admin: {
    group: 'Interactive',
  },
  fields: [
    {
      name: 'sectionLabel',
      type: 'text',
      defaultValue: 'ORCACLUB',
      admin: {
        description: 'Small uppercase label displayed above the carousel.',
      },
    },
    {
      name: 'autoPlay',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'autoPlayInterval',
      type: 'number',
      defaultValue: 6000,
      admin: {
        description: 'Milliseconds between auto-advances (minimum 2000).',
      },
    },
    {
      name: 'slides',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 12,
      admin: {
        description: 'Add slides for events, news, merchandise drops, and announcements.',
      },
      fields: [
        // ── Format ──────────────────────────────────────────────────────────
        {
          name: 'layout',
          type: 'select',
          required: true,
          defaultValue: 'horizontal',
          admin: {
            description: 'Horizontal = wide cinematic card. Vertical = centered portrait card (best for product shots, posters).',
          },
          options: [
            { label: '⬛ Horizontal — Landscape / Cinematic', value: 'horizontal' },
            { label: '▯  Vertical — Portrait / Product / Poster', value: 'vertical' },
          ],
        },
        // ── Category ────────────────────────────────────────────────────────
        {
          name: 'category',
          type: 'select',
          required: true,
          defaultValue: 'news',
          options: [
            { label: '🔵 Event',        value: 'event' },
            { label: '⚪ News',         value: 'news' },
            { label: '🟡 Merchandise',  value: 'merchandise' },
            { label: '🟣 Announcement', value: 'announcement' },
          ],
        },
        // ── Images (multiple) ───────────────────────────────────────────────
        {
          name: 'images',
          type: 'array',
          required: true,
          minRows: 1,
          maxRows: 20,
          admin: {
            description: 'First image is the primary slide image. Additional images appear in the gallery grid.',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'caption',
              type: 'text',
              admin: {
                description: 'Optional caption shown on hover in the gallery grid.',
              },
            },
          ],
        },
        // ── Copy ────────────────────────────────────────────────────────────
        {
          name: 'eyebrow',
          type: 'text',
          admin: {
            description: 'Small label above title — e.g. "Limited Drop", "March 2026".',
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: 'Main headline. 3–6 words for maximum impact.',
          },
        },
        {
          name: 'subtitle',
          type: 'textarea',
          admin: {
            description: 'Supporting copy beneath the title. 1–2 sentences.',
          },
        },
        {
          name: 'ctaLabel',
          type: 'text',
          admin: {
            description: 'Button label — e.g. "Shop Now", "Learn More", "Register".',
          },
        },
        {
          name: 'ctaHref',
          type: 'text',
          admin: {
            description: 'URL the CTA button links to.',
          },
        },
      ],
    },
  ],
}
