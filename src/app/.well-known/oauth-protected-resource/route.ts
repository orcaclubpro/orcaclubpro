import { corsPreflight, json, protectedResourceMetadata } from '@/lib/oauth/metadata'

export const dynamic = 'force-dynamic'

export function GET(): Response {
  return json(protectedResourceMetadata())
}

export const OPTIONS = corsPreflight
