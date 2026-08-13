import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/layout/scroll-reveal'

export type CtaProps = {
  heading: ReactNode
  sub?: ReactNode
  primary: { label: string; href: string }
  secondary?: { label: string; href: string }
  /** Tiny reassurance line under the buttons (e.g. "Free consultation"). */
  note?: string
}

/**
 * Closing CTA band, extracted from the CTASection pattern the service Content
 * files repeat (py-32 band, centered, pill primary + text secondary).
 */
export function CtaSection({ heading, sub, primary, secondary, note }: CtaProps) {
  return (
    <section className="py-32 px-8 border-t border-zinc-800/50 relative">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight text-white">
            {heading}
          </h2>
          {sub && (
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
              {sub}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <Link
              href={primary.href}
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500"
            >
              {primary.label} <ArrowRight size={20} />
            </Link>
            {secondary && (
              <Link
                href={secondary.href}
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
              >
                {secondary.label} <ArrowRight size={16} className="opacity-50" />
              </Link>
            )}
          </div>
          {note && <p className="text-xs text-gray-600 font-light">{note}</p>}
        </ScrollReveal>
      </div>
    </section>
  )
}
