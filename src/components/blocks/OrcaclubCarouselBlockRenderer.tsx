import OrcaclubCarousel from "@/components/sections/OrcaclubCarousel"
import type { OrcaclubCarouselBlock } from "@/types/payload-types"

interface Props {
  block: OrcaclubCarouselBlock
}

export default function OrcaclubCarouselBlockRenderer({ block }: Props) {
  const slides = (block.slides ?? []).map((s) => {
    const images = (s.images ?? []).flatMap((imgEntry) => {
      const imgField = imgEntry.image
      if (typeof imgField !== 'object' || imgField === null || !('url' in imgField) || !imgField.url) {
        return []
      }
      return [{
        url: imgField.url as string,
        alt: (imgField as any).alt as string | undefined,
        caption: imgEntry.caption ?? null,
        width: (imgField as any).width as number | undefined,
        height: (imgField as any).height as number | undefined,
      }]
    })

    return {
      id: s.id ?? undefined,
      layout: (s.layout ?? 'horizontal') as 'horizontal' | 'vertical',
      category: s.category as 'event' | 'news' | 'merchandise' | 'announcement',
      images,
      eyebrow: s.eyebrow ?? null,
      title: s.title,
      subtitle: s.subtitle ?? null,
      ctaLabel: s.ctaLabel ?? null,
      ctaHref: s.ctaHref ?? null,
    }
  }).filter((s) => s.images.length > 0)

  if (slides.length === 0) return null

  return (
    <OrcaclubCarousel
      sectionLabel={block.sectionLabel ?? 'ORCACLUB'}
      slides={slides}
      autoPlay={block.autoPlay ?? true}
      autoPlayInterval={block.autoPlayInterval ?? 6000}
    />
  )
}
