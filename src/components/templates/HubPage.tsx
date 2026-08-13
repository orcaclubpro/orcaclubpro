import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/layout/scroll-reveal'
import { PageShell } from '@/components/marketing/PageShell'
import { Section } from '@/components/marketing/Section'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { FAQ } from '@/components/marketing/FAQ'
import { CtaSection, type CtaProps } from '@/components/marketing/CtaSection'
import { PriceAnchor } from '@/components/marketing/PriceAnchor'
import { JsonLd } from '@/lib/seo/json-ld'
import {
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
  type Faq,
} from '@/lib/seo/schema'
import type { OfferKey } from '@/data/pricing'

export type HubCard = {
  title: string
  blurb: string
  href: string
  /** Key into src/data/pricing.ts — renders the price on the card. */
  priceKey?: OfferKey
}

export type HubPageProps = {
  /** Route path, e.g. '/websites'. Feeds canonical-relative JSON-LD ids. */
  path: string
  /** Plain-text identity for JSON-LD (hero.title may contain markup). */
  schema: { name: string; description: string }
  hero: {
    eyebrow: string
    title: ReactNode
    sub: string
  }
  /** Optional prose paragraphs between hero and cards. */
  intro?: string[]
  /** Child-page link cards — the spokes of this hub. */
  cards: HubCard[]
  faqs?: Faq[]
  cta: CtaProps
}

/**
 * Hub-page template (e.g. /websites, /get-found): hero → intro → child-page
 * card grid → FAQ → closing CTA. Emits CollectionPage + BreadcrumbList
 * (+ FAQPage when faqs are rendered) JSON-LD. Page metadata stays in the
 * page's page.tsx via buildMetadata().
 */
export function HubPage({ path, schema, hero, intro, cards, faqs, cta }: HubPageProps) {
  const jsonLd: object[] = [
    collectionPageSchema({
      path,
      name: schema.name,
      description: schema.description,
      items: cards.map((card) => ({ name: card.title, path: card.href })),
    }),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: schema.name, path },
    ]),
  ]
  if (faqs?.length) jsonLd.push(faqSchema(path, faqs))

  return (
    <PageShell>
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <Section spacing="hero" borderTop={false}>
        <div className="text-center">
          <ScrollReveal>
            <p className="text-xs tracking-[0.35em] uppercase text-white/30 mb-8 font-light">
              {hero.eyebrow}
            </p>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight text-white mb-8">
              {hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light">
              {hero.sub}
            </p>
          </ScrollReveal>
        </div>
      </Section>

      {/* Intro prose */}
      {intro && intro.length > 0 && (
        <Section width="prose" borderTop={false}>
          <ScrollReveal>
            <div className="space-y-6">
              {intro.map((paragraph, i) => (
                <p key={i} className="text-lg text-gray-400 font-light leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </ScrollReveal>
        </Section>
      )}

      {/* Child-page cards */}
      <Section>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <ScrollReveal key={card.href} delay={index * 75}>
              <Link
                href={card.href}
                className="group flex flex-col p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 h-full"
              >
                <h2 className="text-xl font-medium text-white mb-3">{card.title}</h2>
                <p className="text-gray-400 font-light leading-relaxed mb-6">{card.blurb}</p>
                <div className="mt-auto flex items-center justify-between">
                  {card.priceKey ? (
                    <PriceAnchor offer={card.priceKey} className="text-sm" />
                  ) : (
                    <span />
                  )}
                  <ArrowRight
                    size={16}
                    className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200"
                  />
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <Section width="prose">
          <SectionHeader
            title={
              <>
                Frequently Asked <span className="gradient-text font-light">Questions</span>
              </>
            }
          />
          <FAQ faqs={faqs} />
        </Section>
      )}

      <CtaSection {...cta} />
    </PageShell>
  )
}
