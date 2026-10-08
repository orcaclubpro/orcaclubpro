import { authorizationServerMetadata, corsPreflight, json } from '@/lib/oauth/metadata'

export const dynamic = 'force-dynamic'

export function GET(): Response {
  return json(authorizationServerMetadata())
}

export const OPTIONS = corsPreflight
