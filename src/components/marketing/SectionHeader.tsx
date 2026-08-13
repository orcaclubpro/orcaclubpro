import type { ReactNode } from 'react'
import ScrollReveal from '@/components/layout/scroll-reveal'

/**
 * Standard section heading block, extracted from the `text-center mb-16`
 * header the service Content files repeat. Pass a ReactNode title to keep the
 * existing accent pattern, e.g.:
 *
 *   <SectionHeader
 *     title={<>Frequently Asked <span className="gradient-text font-light">Questions</span></>}
 *     sub="Common questions before getting started."
 *   />
 */
export function SectionHeader({
  title,
  sub,
  eyebrow,
  align = 'center',
}: {
  title: ReactNode
  sub?: ReactNode
  /** Small uppercase kicker above the title (packages-page pattern). */
  eyebrow?: string
  align?: 'center' | 'left'
}) {
  const centered = align === 'center'
  return (
    <ScrollReveal>
      <div className={`${centered ? 'text-center' : ''} mb-16`}>
        {eyebrow && (
          <p className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6 font-light">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight text-white">
          {title}
        </h2>
        {sub && (
          <p
            className={`text-xl text-gray-400 font-light max-w-3xl ${centered ? 'mx-auto' : ''}`}
          >
            {sub}
          </p>
        )}
      </div>
    </ScrollReveal>
  )
}
