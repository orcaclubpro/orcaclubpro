import { getPayload } from 'payload'
import config from '@payload-config'
import type { HeroBlock } from '@/types/payload-types'
import HeroSection from '@/components/sections/HeroSection'

interface HeroBlockRendererProps {
  block: HeroBlock
}

export default async function HeroBlockRenderer({ block }: HeroBlockRendererProps) {
  const payload = await getPayload({ config })

  const clientsData = await payload.find({
    collection: 'clients' as any,
    sort: 'displayOrder',
    limit: 12,
  })

  const clients = clientsData.docs

  return (
    <HeroSection
      clients={clients}
      subheading={block.subheading ?? undefined}
      primaryButtonLabel={block.primaryButtonLabel ?? undefined}
      primaryButtonHref={block.primaryButtonHref ?? undefined}
      secondaryButtonLabel={block.secondaryButtonLabel ?? undefined}
      secondaryButtonHref={block.secondaryButtonHref ?? undefined}
      showClientsCarousel={block.showClientsCarousel ?? undefined}
    />
  )
}
