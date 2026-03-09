import type { Block } from 'payload'

export const ContactFormBlock: Block = {
  slug: 'contactForm',
  interfaceName: 'ContactFormBlock',
  admin: {
    group: 'Interactive',
  },
  fields: [
    // ── Left panel ────────────────────────────────────────────────────────────
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Start a conversation.',
      admin: {
        description: 'Large gothic heading on the left panel.',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      defaultValue: 'New Project',
      admin: {
        description: 'Small uppercase label at the bottom-left of the panel.',
      },
    },
    {
      type: 'collapsible',
      label: 'Contact Details',
      fields: [
        {
          name: 'contactEmail',
          type: 'text',
          defaultValue: 'chance@orcaclub.pro',
        },
        {
          name: 'contactLocation',
          type: 'text',
          defaultValue: 'California 714',
        },
        {
          name: 'contactPhone',
          type: 'text',
          defaultValue: 'By appointment',
        },
      ],
    },

    // ── Step headings ─────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Step Headings',
      admin: {
        description: 'Title and subtitle shown at the top of each form step.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'step1Title', type: 'text', defaultValue: 'Schedule a Call.', admin: { width: '50%' } },
            { name: 'step1Sub', type: 'text', defaultValue: 'Schedule a free call to start your project.', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'step2Title', type: 'text', defaultValue: 'Your project.', admin: { width: '50%' } },
            { name: 'step2Sub', type: 'text', defaultValue: 'What are you looking to build?', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'step3Title', type: 'text', defaultValue: 'How to connect.', admin: { width: '50%' } },
            { name: 'step3Sub', type: 'text', defaultValue: 'Pick the option that works best for you.', admin: { width: '50%' } },
          ],
        },
      ],
    },

    // ── Services ──────────────────────────────────────────────────────────────
    {
      name: 'services',
      type: 'array',
      label: 'Service Options',
      minRows: 1,
      admin: {
        description: 'The clickable service pills on step 2. Value is sent to the API.',
      },
      defaultValue: [
        { label: 'Web Design',       value: 'web-design' },
        { label: 'AI & Automation',  value: 'ai-automation' },
        { label: 'Custom Software',  value: 'custom-software' },
        { label: 'SEO Services',     value: 'seo-services' },
        { label: 'Consulting',       value: 'consulting' },
        { label: 'Something Else',   value: 'other' },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              admin: {
                description: 'Displayed label',
                width: '50%',
              },
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: {
                description: 'URL-safe identifier (e.g. web-design)',
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    // ── Options ───────────────────────────────────────────────────────────────
    {
      name: 'showBookingOption',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show the "Book a Call" option in step 3. Disable to make "Send a Message" the only option.',
      },
    },
    {
      type: 'collapsible',
      label: 'Footer Link',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'footerLinkLabel',
              type: 'text',
              defaultValue: 'Our Packages',
              admin: { width: '50%' },
            },
            {
              name: 'footerLinkHref',
              type: 'text',
              defaultValue: '/packages',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
  ],
}
