import type { ReactNode } from 'react'
import ScrollReveal from '@/components/layout/scroll-reveal'
import { PageShell } from '@/components/marketing/PageShell'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { FAQ } from '@/components/marketing/FAQ'
import { CtaSection, type CtaProps } from '@/components/marketing/CtaSection'
import { Stat, type StatProps } from '@/components/marketing/Stat'
import { LastUpdated } from '@/components/marketing/LastUpdated'
import { AuthorBio, type Author } from '@/components/marketing/AuthorBio'
import { LiftableAnswer } from '@/components/marketing/LiftableAnswer'
import { ScrollSpyNav } from '@/components/marketing/ScrollSpyNav'
import { Breadcrumbs, type Crumb } from '@/components/marketing/Breadcrumbs'
import { JsonLd } from '@/lib/seo/json-ld'
import { articleSchema, breadcrumbSchema, faqSchema, type Faq } from '@/lib/seo/schema'

export type QaSection = {
  /** DOM id / anchor — also drives the scroll-spy rail. */
  id: string
  /** Rendered as a question-style H2. */
  heading: string
  body: ReactNode
}

export type SpokePageProps = {
  /** Route path, e.g. '/get-found/local-visibility'. */
  path: string
  /** Plain-text identity for the Article JSON-LD node. */
  schema: { headline: string; description: string }
  /** ONE crumbs array — feeds both the visible trail and BreadcrumbList JSON-LD. */
  breadcrumbs: Crumb[]
  title: ReactNode
  /** The answer-first lede — 2–3 sentences an engine can lift verbatim. */
  answer: ReactNode
  /** Q&A sections: question-style H2s, the AEO backbone of the page. */
  qa: QaSection[]
  stats?: StatProps[]
  faqs?: Faq[]
  /** ISO date, e.g. '2026-08-13'. Renders visibly and feeds dateModified. */
  lastUpdated: string
  /** ISO date. Defaults to lastUpdated. */
  datePublished?: string
  author: Author
  cta: CtaProps
}

/**
 * Spoke-page template — the AEO pattern: breadcrumbs, answer-first bolded
 * lede, question-style H2 sections with a scroll-spy rail (auto-derived from
 * qa ids), cited stats, visible last-updated date, author bio, closing CTA.
 * Emits Article + BreadcrumbList (+ FAQPage) JSON-LD. Metadata stays in the
 * page's page.tsx via buildMetadata().
 */
export function SpokePage({
  path,
  schema,
  breadcrumbs,
  title,
  answer,
  qa,
  stats,
  faqs,
  lastUpdated,
  datePublished,
  author,
  cta,
}: SpokePageProps) {
  const jsonLd: object[] = [
    articleSchema({
      path,
      headline: schema.headline,
      description: schema.description,
      datePublished: datePublished ?? lastUpdated,
      dateModified: lastUpdated,
      authorName: author.name,
    }),
    breadcrumbSchema(breadcrumbs),
  ]
  if (faqs?.length) jsonLd.push(faqSchema(path, faqs))

  const spySections = qa.map((section) => ({ id: section.id, label: section.heading }))

  return (
    <PageShell>
      <JsonLd data={jsonLd} />

      {/* Hero: breadcrumbs → H1 → date → liftable answer */}
      <section className="pt-32 pb-16 px-8 relative">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <Breadcrumbs crumbs={breadcrumbs} className="mb-8" />
            <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-white mb-6 max-w-4xl">
              {title}
            </h1>
            <LastUpdated date={lastUpdated} className="mb-10" />
            <div className="max-w-3xl">
              <LiftableAnswer>{answer}</LiftableAnswer>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Side rail + Q&A content */}
      <section className="px-8 pb-24 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-16 xl:gap-28">
            <div className="hidden lg:block w-44 xl:w-52 shrink-0">
              <ScrollSpyNav sections={spySections} />
            </div>

            <div className="flex-1 min-w-0 max-w-3xl space-y-20">
              {qa.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  <h2 className="text-3xl md:text-4xl font-extralight tracking-tight text-white mb-6">
                    {section.heading}
                  </h2>
                  <div className="text-lg text-gray-400 font-light leading-relaxed space-y-5 [&_strong]:text-white [&_strong]:font-normal">
                    {section.body}
                  </div>
                </section>
              ))}

              {stats && stats.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <ScrollReveal key={index} delay={index * 75}>
                      <Stat {...stat} />
                    </ScrollReveal>
                  ))}
                </div>
              )}

              {faqs && faqs.length > 0 && (
                <div>
                  <SectionHeader
                    align="left"
                    title={
                      <>
                        Frequently Asked{' '}
                        <span className="gradient-text font-light">Questions</span>
                      </>
                    }
                  />
                  <FAQ faqs={faqs} />
                </div>
              )}

              <AuthorBio {...author} />
            </div>
          </div>
        </div>
      </section>

      <CtaSection {...cta} />
    </PageShell>
  )
}
