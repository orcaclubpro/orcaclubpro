'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ScrollReveal from '@/components/layout/scroll-reveal'
import type { Faq } from '@/lib/seo/schema'

// Re-export so pages can type their FAQ array once and feed it to both this
// component and faqSchema() from @/lib/seo/schema — one array, two consumers,
// no drift between rendered FAQs and JSON-LD.
export type { Faq } from '@/lib/seo/schema'

/**
 * THE site accordion — the single FAQ implementation for all marketing pages.
 * Extracted from the cleanest existing instance (services/cms-development).
 * Server-compatible data in (plain {question, answer}[]), client
 * interactivity inside.
 */
export function FAQ({
  faqs,
  defaultOpen = 0,
}: {
  faqs: Faq[]
  /** Index opened on load; null for all collapsed. */
  defaultOpen?: number | null
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen)

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index

        return (
          <ScrollReveal key={index} delay={index * 50}>
            <div className="rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300">
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-lg font-medium text-white pr-8">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-cyan-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: isOpen ? '500px' : 0,
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="px-6 pb-5 text-gray-400 font-light leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          </ScrollReveal>
        )
      })}
    </div>
  )
}
