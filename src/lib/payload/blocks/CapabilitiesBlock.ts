import type { Block } from 'payload'

export const CapabilitiesBlock: Block = {
  slug: 'capabilities',
  interfaceName: 'CapabilitiesBlock',
  fields: [
    {
      name: 'label',
      type: 'text',
      defaultValue: 'Capabilities',
      admin: {
        description: 'Small eyebrow label above the heading',
      },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Tailored solutions for scaling businesses',
      admin: {
        description: 'Section heading. "solutions" renders as gradient text in the renderer.',
      },
    },
    {
      name: 'subheading',
      type: 'text',
      defaultValue: 'Fixed-price tiers, fast delivery, and modern tech. Choose Launch, Scale, or Enterprise.',
      admin: {
        description: 'Descriptive paragraph below the heading',
      },
    },
  ],
}
