import type { Page } from '@/types/payload-types'
import HeroBlockRenderer from '@/components/blocks/HeroBlockRenderer'
import CapabilitiesBlockRenderer from '@/components/blocks/CapabilitiesBlockRenderer'
import CtaBlockRenderer from '@/components/blocks/CtaBlockRenderer'
import ContactFormBlockRenderer from '@/components/blocks/ContactFormBlockRenderer'
import OrcaclubCarouselBlockRenderer from '@/components/blocks/OrcaclubCarouselBlockRenderer'

type LayoutBlock = NonNullable<Page['layout']>[number]

interface RenderBlocksProps {
  blocks: LayoutBlock[]
}

export default function RenderBlocks({ blocks }: RenderBlocksProps) {
  if (!blocks || blocks.length === 0) return null

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case 'hero':
            return <HeroBlockRenderer key={index} block={block} />
          case 'capabilities':
            return <CapabilitiesBlockRenderer key={index} block={block} />
          case 'cta':
            return <CtaBlockRenderer key={index} block={block} />
          case 'contactForm':
            return <ContactFormBlockRenderer key={index} block={block} />
          case 'orcaclubCarousel':
            return <OrcaclubCarouselBlockRenderer key={index} block={block} />
          default:
            return null
        }
      })}
    </>
  )
}
