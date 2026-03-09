import type { Block } from 'payload'

export const CtaBlock: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  fields: [
    {
      name: 'label',
      type: 'text',
      defaultValue: 'Get Started',
      admin: {
        description: 'Small eyebrow label above the heading',
      },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Ready to launch your next project?',
      admin: {
        description: 'Section heading',
      },
    },
    {
      name: 'subheading',
      type: 'text',
      defaultValue:
        'No opaque quotes. No lengthy sales cycles. Just transparent pricing, fast delivery, and direct developer access.',
      admin: {
        description: 'Descriptive paragraph below the heading',
      },
    },
    {
      name: 'primaryButtonLabel',
      type: 'text',
      defaultValue: 'Start Your Project',
      admin: {
        description: 'Label for the primary CTA button',
      },
    },
    {
      name: 'primaryButtonHref',
      type: 'text',
      defaultValue: '/contact',
      admin: {
        description: 'URL for the primary CTA button',
      },
    },
    {
      name: 'secondaryButtonLabel',
      type: 'text',
      defaultValue: 'View Project Tiers',
      admin: {
        description: 'Label for the secondary CTA button',
      },
    },
    {
      name: 'secondaryButtonHref',
      type: 'text',
      defaultValue: '/project',
      admin: {
        description: 'URL for the secondary CTA button',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      defaultValue: '3–21 Day Delivery · Fixed Pricing · Direct Developer Access',
      admin: {
        description: 'Small tagline shown below the buttons',
      },
    },
  ],
}
