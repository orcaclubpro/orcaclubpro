import type { CollectionConfig } from 'payload'
import { adminOnly, authenticatedOrPublished } from '@/lib/payload/access'
import { HeroBlock } from '@/lib/payload/blocks/HeroBlock'
import { CapabilitiesBlock } from '@/lib/payload/blocks/CapabilitiesBlock'
import { CtaBlock } from '@/lib/payload/blocks/CtaBlock'
import { ContactFormBlock } from '@/lib/payload/blocks/ContactFormBlock'
import { OrcaclubCarouselBlock } from '@/lib/payload/blocks/OrcaclubCarouselBlock'
import {
  MetaTitleField,
  MetaDescriptionField,
  MetaImageField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  versions: { drafts: true },
  access: {
    read: authenticatedOrPublished,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL slug. Use "home" for the homepage.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [HeroBlock, CapabilitiesBlock, CtaBlock, ContactFormBlock, OrcaclubCarouselBlock],
            },
          ],
        },
        {
          // Named tab — SEO fields stored under doc.meta.*
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({ hasGenerateFn: true }),
            MetaDescriptionField({ hasGenerateFn: true }),
            MetaImageField({ relationTo: 'media', hasGenerateFn: true }),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
  ],
}
