import type { CapabilitiesBlock } from '@/types/payload-types'
import ScrollReveal from '@/components/layout/scroll-reveal'
import ServicesGrid from '@/components/sections/ServicesGrid'

interface CapabilitiesBlockRendererProps {
  block: CapabilitiesBlock
}

export default function CapabilitiesBlockRenderer({ block }: CapabilitiesBlockRendererProps) {
  const label = block.label ?? 'Capabilities'
  const heading = block.heading ?? 'Tailored solutions for scaling businesses'
  const subheading =
    block.subheading ?? 'Fixed-price tiers, fast delivery, and modern tech. Choose Launch, Scale, or Enterprise.'

  // Split heading on "solutions" to inject gradient text, falling back to plain text
  const solutionsIdx = heading.toLowerCase().indexOf('solutions')
  let headingContent: React.ReactNode

  if (solutionsIdx !== -1) {
    const before = heading.slice(0, solutionsIdx)
    const word = heading.slice(solutionsIdx, solutionsIdx + 9)
    const after = heading.slice(solutionsIdx + 9)
    headingContent = (
      <>
        {before}
        <span className="gradient-text font-light">{word}</span>
        {after}
      </>
    )
  } else {
    headingContent = heading
  }

  return (
    <section className="py-40 px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-32">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light mb-5">
              {label}
            </p>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              {headingContent}
            </h2>
            <div className="mx-auto w-6 h-px bg-cyan-400/40 mb-8" />
            <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              {subheading}
            </p>
          </div>
        </ScrollReveal>

        <ServicesGrid />
      </div>
    </section>
  )
}
