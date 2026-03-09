import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'subheading',
      type: 'text',
      defaultValue: 'Marketing, Development, and Design agency.',
      admin: {
        description: 'Short tagline shown below the greeting',
      },
    },
    {
      name: 'primaryButtonLabel',
      type: 'text',
      defaultValue: 'Free Consultation',
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
      defaultValue: 'Our Solutions',
      admin: {
        description: 'Label for the secondary CTA button',
      },
    },
    {
      name: 'secondaryButtonHref',
      type: 'text',
      defaultValue: '/solutions',
      admin: {
        description: 'URL for the secondary CTA button',
      },
    },
    {
      name: 'showClientsCarousel',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether to show the client logo marquee at the bottom of the hero',
      },
    },
  ],
}
