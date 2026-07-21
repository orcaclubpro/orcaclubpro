import type { CollectionConfig, FieldHook } from 'payload'
import { adminOnly, adminOrUser } from '../access'
import { adminOrProjectMember } from '../access'
import { encryptField, decryptField } from '../utils/fieldEncryption'

const encryptBeforeChange: FieldHook = ({ value }) => {
  if (!value || typeof value !== 'string') return value
  // Don't double-encrypt values already in our format
  if (value.startsWith('ENC_V1:')) return value
  return encryptField(value)
}

const decryptAfterRead: FieldHook = ({ value }) => {
  if (!value || typeof value !== 'string') return value
  const decrypted = decryptField(value)
  return decrypted !== null ? decrypted : value
}

const Credentials: CollectionConfig = {
  slug: 'credentials',
  // SECURITY: keep decrypted secrets off the public API surface. GraphQL is
  // disabled entirely, and collection-level read is staff-only so a client
  // cannot GET /api/credentials to pull cleartext secrets. Clients still view
  // their own project's credentials through the server-rendered portal and the
  // vetted server actions in src/actions/credentials.ts (which run via the
  // Local API and enforce project ownership + the vault session).
  graphQL: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'project', 'website', 'username', 'updatedAt'],
    group: 'Project Management',
    description: 'Secure per-project credentials with passwords and secrets encrypted at rest',
  },
  access: {
    create: adminOrUser,
    read: adminOrProjectMember,
    update: adminOrUser,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Credential label (e.g. "WordPress Admin", "AWS Console")',
      },
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      index: true,
      admin: {
        description: 'Project this credential belongs to',
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Login URL or service homepage',
      },
    },
    {
      name: 'username',
      type: 'text',
      admin: {
        description: 'Username or email address',
      },
    },
    {
      name: 'password',
      type: 'text',
      admin: {
        description: 'Password (encrypted at rest using AES-256-GCM)',
      },
      hooks: {
        beforeChange: [encryptBeforeChange],
        afterRead: [decryptAfterRead],
      },
    },
    {
      name: 'secrets',
      type: 'array',
      admin: {
        description: 'Additional key/value secrets (API keys, tokens, environment variables)',
      },
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          admin: {
            description: 'Secret name (e.g. "API_KEY", "Secret Token")',
          },
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: {
            description: 'Secret value (encrypted at rest)',
          },
          hooks: {
            beforeChange: [encryptBeforeChange],
            afterRead: [decryptAfterRead],
          },
        },
      ],
    },
  ],
}

export default Credentials
