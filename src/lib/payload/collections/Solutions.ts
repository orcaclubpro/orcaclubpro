import type { Block, CollectionConfig } from 'payload'
import {
  lexicalEditor,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { revalidatePath } from 'next/cache'
import { authenticated, authenticatedOrPublished } from '../access'

const formatSlug = (val: string): string =>
  val.replace(/ /g, '-').replace(/[^\w-]+/g, '').toLowerCase()

const ArticleBlock: Block = {
  slug: 'article',
  interfaceName: 'ArticleBlock',
  labels: {
    singular: 'Article',
    plural: 'Articles',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
        ],
      }),
    },
  ],
}

const Solutions: CollectionConfig = {
  slug: 'solutions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Content',
    description: 'SEO-driven solution pages with flexible content blocks',
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  access: {
    create: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [
      async ({ doc, req: { payload, context } }) => {
        if (!context.disableRevalidate) {
          setImmediate(() => {
            try {
              revalidatePath('/solutions', 'page')
              revalidatePath(`/solutions/${doc.slug}`, 'page')
              payload.logger.info(`[Solutions] Revalidated /solutions/${doc.slug}`)
            } catch (error) {
              payload.logger.error(`[Solutions] Revalidation error: ${error}`)
            }
          })
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req: { payload, context } }) => {
        if (!context.disableRevalidate) {
          setImmediate(() => {
            try {
              revalidatePath('/solutions', 'page')
              revalidatePath(`/solutions/${doc.slug}`, 'page')
              payload.logger.info(`[Solutions] Revalidated after delete /solutions/${doc.slug}`)
            } catch (error) {
              payload.logger.error(`[Solutions] Revalidation error on delete: ${error}`)
            }
          })
        }
        return doc
      },
    ],
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
        description: 'URL-friendly identifier (auto-generated from title)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (typeof value === 'string') return formatSlug(value)
            if (data?.title) return formatSlug(data.title as string)
            return value
          },
        ],
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Short summary shown on the solutions listing page',
              },
            },
            {
              name: 'layout',
              type: 'blocks',
              blocks: [ArticleBlock],
              admin: {
                description: 'Add content blocks to build the page',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'meta',
              type: 'group',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    description: 'Overrides page title in search results (50–60 chars recommended)',
                  },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  admin: {
                    description: 'Shown in search results (150–160 chars recommended)',
                  },
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Open Graph image for social sharing',
                  },
                },
                {
                  name: 'noIndex',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Prevent search engines from indexing this page',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default Solutions
