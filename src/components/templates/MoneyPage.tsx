import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import ScrollReveal from '@/components/layout/scroll-reveal'
import { PageShell } from '@/components/marketing/PageShell'
import { Section } from '@/components/marketing/Section'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { FAQ } from '@/components/marketing/FAQ'
import { CtaSection } from '@/components/marketing/CtaSection'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbSchema, faqSchema, serviceSchema, type Faq } from '@/lib/seo/schema'
import { OFFERS, type OfferKey } from '@/data/pricing'

export type MoneyCta = {
  heading: ReactNode
  sub?: ReactNode
  /** Label for the primary button — href is ALWAYS /contact. */
  primaryLabel?: string
  /** Label for the secondary link — href is ALWAYS /pricing. */
  secondaryLabel?: string
  note?: string
}

export type MoneyPageProps = {
  /** Route path, e.g. '/websites/payload-cms'. */
  path: string
  /** Plain-text identity for the Service JSON-LD node. */
  schema: { name: string; serviceType: string; description: string }
  hero: {
    eyebrow: string
    title: ReactNode
    sub: string
    /** Primary hero button label — href is ALWAYS /contact. */
    ctaLabel?: string
  }
  /** Scope of work — what's included, rendered as a check-marked grid. */
  deliverables: { title: string; description?: string }[]
  deliverablesTitle?: ReactNode
  /** Key into src/data/pricing.ts — renders the price + timeline stat band. */
  priceKey: OfferKey
  /** Optional numbered process steps. */
  process?: { title: string; description: string }[]
  faqs: Faq[]
  /** Placeholder slot for a future /work case-study feature. */
  caseStudy?: ReactNode
  cta: MoneyCta
}

/**
 * Money-page template (e.g. /websites/payload-cms, /get-found/audit).
 *
 * LINK DISCIPLINE — baked in, not configurable: the only outbound links this
 * template renders are /contact (primary CTA) and /pricing (secondary CTA +
 * price band). There are no other link props. Body copy stays link-free.
 *
 * Emits Service + BreadcrumbList + FAQPage JSON-LD. Metadata stays in the
 * page's page.tsx via buildMetadata().
 */
export function MoneyPage({
  path,
  schema,
  hero,
  deliverables,
  deliverablesTitle,
  priceKey,
  process,
  faqs,
  caseStudy,
  cta,
}: MoneyPageProps) {
  const offer = OFFERS[priceKey]

  const jsonLd: object[] = [
    serviceSchema({
      path,
      name: schema.name,
      serviceType: schema.serviceType,
      description: schema.description,
      // Deliberately no numeric price in JSON-LD — display ranges live in
      // src/data/pricing.ts and render in HTML only.
      offers: [{ name: offer.name, description: offer.priceNote }],
    }),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: schema.name, path },
    ]),
    faqSchema(path, faqs),
  ]

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
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-10">
              {hero.sub}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:from-cyan-400/30 hover:to-blue-500/30 transition-all duration-300"
              >
                {hero.ctaLabel ?? 'Start a project'} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
              >
                See pricing <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </Section>

      {/* Price + timeline stat band */}
      <Section width="prose">
        <ScrollReveal>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
              <div className="px-6 py-8 text-center">
                <p className="text-3xl font-extralight text-cyan-400 mb-1">{offer.priceDisplay}</p>
                <p className="text-sm text-white/50 font-light">{offer.name}</p>
              </div>
              <div className="px-6 py-8 text-center">
                <p className="text-3xl font-extralight text-white mb-1">
                  {offer.timeline ?? 'Scoped per project'}
                </p>
                <p className="text-sm text-white/50 font-light">Timeline</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
              {offer.priceNote && (
                <p className="text-sm text-white/35 font-light">{offer.priceNote}</p>
              )}
              <Link
                href="/pricing"
                className="group flex items-center gap-2 text-sm font-light text-white/40 hover:text-white/70 transition-colors duration-200"
              >
                Full pricing breakdown
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* Scope / deliverables */}
      <Section>
        <SectionHeader
          title={
            deliverablesTitle ?? (
              <>
                What&apos;s <span className="gradient-text font-light">Included</span>
              </>
            )
          }
        />
        <div className="grid md:grid-cols-2 gap-6">
          {deliverables.map((item, index) => (
            <ScrollReveal key={index} delay={index * 75}>
              <div className="flex items-start gap-4 p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl h-full">
                <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-400 font-light leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* Process steps */}
      {process && process.length > 0 && (
        <Section width="prose">
          <SectionHeader
            title={
              <>
                How It <span className="gradient-text font-light">Works</span>
              </>
            }
          />
          <div className="space-y-10">
            {process.map((step, index) => (
              <ScrollReveal key={index} delay={index * 75}>
                <div className="flex items-start gap-6">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-white/20 font-light pt-2 shrink-0 w-8">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400 font-light leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Section>
      )}

      {/* Case-study placeholder slot */}
      {caseStudy && <Section>{caseStudy}</Section>}

      {/* FAQ */}
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

      <CtaSection
        heading={cta.heading}
        sub={cta.sub}
        primary={{ label: cta.primaryLabel ?? 'Start a project', href: '/contact' }}
        secondary={{ label: cta.secondaryLabel ?? 'See pricing', href: '/pricing' }}
        note={cta.note}
      />
    </PageShell>
  )
}
