import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { CtaBlock } from '@/types/payload-types'
import ScrollReveal from '@/components/layout/scroll-reveal'

interface CtaBlockRendererProps {
  block: CtaBlock
}

export default function CtaBlockRenderer({ block }: CtaBlockRendererProps) {
  const label = block.label ?? 'Get Started'
  const heading = block.heading ?? 'Ready to launch your next project?'
  const subheading =
    block.subheading ??
    'No opaque quotes. No lengthy sales cycles. Just transparent pricing, fast delivery, and direct developer access.'
  const primaryButtonLabel = block.primaryButtonLabel ?? 'Start Your Project'
  const primaryButtonHref = block.primaryButtonHref ?? '/contact'
  const secondaryButtonLabel = block.secondaryButtonLabel ?? 'View Project Tiers'
  const secondaryButtonHref = block.secondaryButtonHref ?? '/project'
  const tagline = block.tagline ?? '3–21 Day Delivery · Fixed Pricing · Direct Developer Access'

  // Split heading on "next project" to inject gradient text
  const nextProjectIdx = heading.toLowerCase().indexOf('next project')
  let headingContent: React.ReactNode

  if (nextProjectIdx !== -1) {
    const before = heading.slice(0, nextProjectIdx)
    const phrase = heading.slice(nextProjectIdx, nextProjectIdx + 12)
    const after = heading.slice(nextProjectIdx + 12)
    headingContent = (
      <>
        {before}
        <span className="gradient-text font-light">{phrase}</span>
        {after}
      </>
    )
  } else {
    headingContent = heading
  }

  return (
    <section className="py-40 px-8 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light mb-5">
            {label}
          </p>
          <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
            {headingContent}
          </h2>
          <div className="mx-auto w-6 h-px bg-cyan-400/40 mb-8" />
          <p className="text-lg text-gray-400 mb-16 font-light leading-relaxed max-w-2xl mx-auto">
            {subheading}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href={primaryButtonHref}
              className="inline-flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-md text-base font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
            >
              {primaryButtonLabel} <ArrowRight size={18} />
            </Link>
            <Link
              href={secondaryButtonHref}
              className="inline-flex items-center gap-2 px-12 py-5 bg-white/[0.03] border border-white/[0.08] rounded-md text-base font-light text-white/70 hover:bg-white/[0.06] hover:border-white/[0.14] hover:text-white transition-all duration-500 magnetic interactive"
            >
              {secondaryButtonLabel}
            </Link>
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/15 font-light">
            {tagline}
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
