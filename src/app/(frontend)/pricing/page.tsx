import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'
import ScrollReveal from '@/components/layout/scroll-reveal'
import { PageShell } from '@/components/marketing/PageShell'
import { Section } from '@/components/marketing/Section'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { FAQ } from '@/components/marketing/FAQ'
import { CtaSection } from '@/components/marketing/CtaSection'
import { PriceAnchor } from '@/components/marketing/PriceAnchor'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbSchema, faqSchema, serviceSchema, type Faq } from '@/lib/seo/schema'
import { buildMetadata } from '@/lib/seo/meta'
import { OFFERS, type OfferKey } from '@/data/pricing'

export const metadata = buildMetadata({
  title: 'Pricing — ORCACLUB',
  description:
    'Transparent pricing for websites, commerce builds, search visibility, and ongoing site care. Every engagement is scoped and quoted in writing before work begins — no hourly surprises.',
  path: '/pricing',
})

// ─── Data ────────────────────────────────────────────────────────────────────

type OfferCard = {
  key: OfferKey
  label: string
  href: string
  description: string
  featured?: boolean
}

const buildOffers: OfferCard[] = [
  {
    key: 'websites-payload-cms',
    label: '01',
    href: '/websites/payload-cms',
    description:
      'Business and marketing sites on Payload CMS. Custom-designed, fast, and fully editable by you — pages, content, and blog without calling a developer.',
    featured: true,
  },
  {
    key: 'websites-shopify',
    label: '02',
    href: '/websites/shopify',
    description:
      'A Shopify storefront themed to your brand and configured to sell — products, checkout, shipping, and payments ready on day one.',
  },
  {
    key: 'websites-custom-commerce',
    label: '03',
    href: '/websites/custom-commerce',
    description:
      'Commerce that outgrows a template — custom checkout flows, wholesale portals, client dashboards, and multi-system integrations.',
  },
]

const getFoundOffers: OfferCard[] = [
  {
    key: 'get-found-audit',
    label: '01',
    href: '/get-found/audit',
    description:
      'A fixed-scope teardown of why your site isn’t ranking — technical issues, content gaps, and competitor positioning — delivered as a prioritized plan you can execute with anyone.',
  },
  {
    key: 'get-found-growth',
    label: '02',
    href: '/get-found/growth',
    description:
      'Ongoing search and paid-channel execution — SEO, content, and ad management scoped monthly to the channels that actually feed your pipeline.',
  },
]

const careOffer: OfferCard = {
  key: 'care',
  label: '01',
  href: '/care',
  description:
    'Hosting, security updates, backups, and small fixes at one flat monthly rate. Your site stays fast, secure, and current without you thinking about it.',
}

// TODO(chance): verify each matrix row against the final scope of the three
// build offers before cutover — rows are drafted from the offer definitions,
// not confirmed deliverable lists.
const featureMatrix: {
  feature: string
  payload: boolean | string
  shopify: boolean | string
  custom: boolean | string
}[] = [
  { feature: 'Custom design, built to your brand', payload: true, shopify: true, custom: true },
  { feature: 'Content editing without a developer', payload: 'Payload CMS', shopify: 'Shopify admin', custom: 'Payload CMS' },
  { feature: 'SEO foundations — metadata, schema, sitemap', payload: true, shopify: true, custom: true },
  { feature: 'Hosting, domain & SSL setup', payload: true, shopify: true, custom: true },
  { feature: 'Analytics setup', payload: true, shopify: true, custom: true },
  { feature: 'Blog / content publishing', payload: true, shopify: 'Optional', custom: true },
  { feature: 'Online checkout & payments', payload: false, shopify: true, custom: true },
  { feature: 'Product catalog & inventory', payload: false, shopify: true, custom: true },
  { feature: 'Custom integrations (CRM, email, booking)', payload: 'Scoped', shopify: 'Scoped', custom: true },
  { feature: 'Custom APIs & backend logic', payload: false, shopify: false, custom: true },
  { feature: 'Admin dashboards & client portals', payload: false, shopify: false, custom: true },
  { feature: 'Multi-system sync (ERP, 3PL, wholesale)', payload: false, shopify: false, custom: true },
]

// Engagement process — seeded from /project + /project/onboarding. This copy
// is genuinely differentiated; substance preserved, condensed for one strip.
const engagementSteps = [
  {
    title: 'Discovery',
    description:
      'A discovery call covers scope, timeline, and budget range. An NDA is signed before any sensitive information is exchanged.',
  },
  {
    title: 'Scope of work',
    description:
      'You get a written scope of work — deliverables, timeline, revision limits, and payment schedule — before anything is signed. A fixed quote, not an estimate that drifts.',
  },
  {
    title: 'Deposit',
    description:
      'A deposit is collected before development begins. No work starts on a handshake, and no invoice surprises you later.',
  },
  {
    title: 'Sprints',
    description:
      'Work runs in 1–2 week sprint cycles with a weekly written update — completed work, blockers, next steps. Scope changes are documented and approved in writing before execution.',
  },
  {
    title: 'Handoff',
    description:
      'Deliverables are reviewed against the original scope, you sign off in writing, and every credential, account, and line of code transfers to you.',
  },
]

const faqs: Faq[] = [
  {
    question: 'How do I know which offer is right for me?',
    answer:
      'If you need a site people can find and you can edit yourself, that’s the Payload CMS build. If you’re selling products online, start with Shopify. If your commerce needs custom checkout flows, wholesale pricing, or integrations a template can’t handle, that’s a custom commerce build. If you’re not sure, the first call sorts it out — no commitment either way.',
  },
  {
    question: 'Are these prices fixed?',
    answer:
      'They’re ranges because scope varies. After discovery you get a fixed written quote — the number in your scope of work is the number on your invoice. No hourly billing, no drift.',
  },
  {
    question: 'What’s included in every build?',
    answer:
      'Every build includes custom design, SEO foundations, analytics, documentation, and a full handoff — you own the code, the accounts, and the content. And you work directly with the person building it.',
  },
  {
    question: 'How does payment work?',
    answer:
      'A deposit before development begins, with the remainder on a payment schedule written into the contract. Larger builds can be split across milestones.',
  },
  {
    question: 'What happens after launch?',
    answer: `Everything transfers to you — code, accounts, credentials. The site is fully yours. If you’d rather not run it yourself, the ${OFFERS.care.name} (${OFFERS.care.priceDisplay}) covers hosting, updates, backups, and small fixes.`,
  },
  {
    question: 'What’s the difference between the audit and the growth retainer?',
    answer: `The ${OFFERS['get-found-audit'].name} is a one-time engagement with fixed deliverables — a complete diagnosis and a prioritized plan you can execute with any team. The ${OFFERS['get-found-growth'].name} is ongoing execution: we do the work month over month, scoped to the channel mix that fits your business.`,
  },
  {
    question: 'What if my project doesn’t fit one of these offers?',
    answer:
      'Some projects don’t. Reach out anyway — if it’s work we can do well, we’ll scope a custom engagement. If it isn’t, we’ll say so and point you somewhere better.',
  },
  {
    question: 'Who actually does the work?',
    answer:
      'ORCACLUB is a technical operations development studio in Orange County run by a senior operator. You talk directly to the person writing the code — no account managers, no handoffs.',
  },
]

// ─── JSON-LD ─────────────────────────────────────────────────────────────────

// Offer names only — display ranges live in src/data/pricing.ts and render in
// HTML; range strings aren't valid PriceSpecification values.
const jsonLd = [
  serviceSchema({
    path: '/pricing',
    name: 'ORCACLUB Services & Pricing',
    serviceType: 'Web Development & Search Marketing',
    description:
      'Fixed-quote websites, commerce builds, search visibility engagements, and ongoing site care from a technical operations development studio in Orange County.',
    offers: Object.values(OFFERS).map((offer) => ({
      name: offer.name,
      description: offer.priceNote,
    })),
  }),
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Pricing', path: '/pricing' },
  ]),
  faqSchema('/pricing', faqs),
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-white/60 font-light">{value}</span>
  }
  return value ? (
    <Check className="w-4 h-4 text-[#67e8f9]/60 mx-auto" />
  ) : (
    <X className="w-4 h-4 text-white/10 mx-auto" />
  )
}

/** Packages-style row card: label · name + blurb · price + timeline · arrow. */
function OfferRow({ offer, index }: { offer: OfferCard; index: number }) {
  const { name, timeline } = OFFERS[offer.key]
  return (
    <ScrollReveal delay={index * 60}>
      <Link
        href={offer.href}
        className={`group flex flex-col sm:flex-row items-start gap-5 sm:gap-8 p-6 sm:p-8 rounded-xl border transition-all duration-300 hover:border-white/[0.12] ${
          offer.featured
            ? 'border-[#67e8f9]/[0.15] bg-[#67e8f9]/[0.02]'
            : 'border-white/[0.06] bg-white/[0.01]'
        }`}
      >
        <span className="text-[10px] tracking-[0.35em] uppercase text-white/20 font-light pt-1.5 shrink-0 w-6 hidden sm:block">
          {offer.label}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 mb-3">
            <h3 className="text-3xl font-extralight text-white">{name}</h3>
            {offer.featured && (
              <span className="text-xs tracking-[0.25em] uppercase text-[#67e8f9]/50 font-light">
                Most common
              </span>
            )}
          </div>
          <p className="text-gray-500 font-light text-base sm:text-lg leading-relaxed max-w-md">
            {offer.description}
          </p>
        </div>

        <div className="sm:shrink-0 sm:text-right flex sm:flex-col items-baseline sm:items-end gap-3 sm:gap-0">
          <PriceAnchor offer={offer.key} className="text-xl sm:mb-1" />
          {timeline && <p className="text-white/30 font-light text-sm sm:text-base">{timeline}</p>}
        </div>

        <div className="shrink-0 self-end sm:self-center">
          <ArrowRight
            size={16}
            className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200"
          />
        </div>
      </Link>
    </ScrollReveal>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <PageShell>
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <Section spacing="hero" borderTop={false}>
        <div className="text-center">
          <ScrollReveal>
            <p className="text-xs tracking-[0.35em] uppercase text-white/30 mb-8 font-light">
              Pricing
            </p>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight text-white mb-8">
              Transparent <span className="gradient-text font-light">pricing</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light">
              Every offer on one page. Each engagement is scoped, quoted in writing, and delivered
              on a sprint cadence — you know the number before we start.
            </p>
          </ScrollReveal>
        </div>
      </Section>

      {/* ── Build offers ── */}
      <Section id="build">
        <SectionHeader
          eyebrow="Build"
          title={
            <>
              Websites &amp; <span className="gradient-text font-light">Commerce</span>
            </>
          }
          sub="Three ways to build, priced by what the site has to do — not by the hour."
        />
        <div className="space-y-5">
          {buildOffers.map((offer, i) => (
            <OfferRow key={offer.key} offer={offer} index={i} />
          ))}
        </div>
        <ScrollReveal delay={240}>
          <p className="mt-6 text-sm text-white/30 font-light tracking-wide leading-relaxed">
            Every build includes custom design, SEO foundations, analytics, documentation, and full
            code and account transfer at handoff.
          </p>
        </ScrollReveal>
      </Section>

      {/* ── Comparison matrix ── */}
      <Section id="compare">
        <SectionHeader
          eyebrow="Compare"
          title={
            <>
              What&apos;s in each <span className="gradient-text font-light">build</span>
            </>
          }
        />
        <ScrollReveal>
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="py-5 px-6 text-left text-xs tracking-[0.25em] uppercase text-white/25 font-light w-2/5">
                    Feature
                  </th>
                  <th className="py-5 px-4 text-center text-[10px] tracking-[0.35em] uppercase text-[#67e8f9]/40 font-light">
                    Payload CMS
                  </th>
                  <th className="py-5 px-4 text-center text-xs tracking-[0.25em] uppercase text-white/25 font-light">
                    Shopify
                  </th>
                  <th className="py-5 px-4 text-center text-xs tracking-[0.25em] uppercase text-white/25 font-light">
                    Custom Commerce
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureMatrix.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <td className="py-4 px-6 text-base text-gray-400 font-light">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      <FeatureValue value={row.payload} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <FeatureValue value={row.shopify} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <FeatureValue value={row.custom} />
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-white/[0.04]">
                  <td className="py-4 px-6 text-base text-gray-400 font-light">Typical timeline</td>
                  {(['websites-payload-cms', 'websites-shopify', 'websites-custom-commerce'] as const).map(
                    (key) => (
                      <td key={key} className="py-4 px-4 text-center text-sm text-white/60 font-light">
                        {OFFERS[key].timeline}
                      </td>
                    ),
                  )}
                </tr>
                <tr>
                  <td className="py-4 px-6 text-base text-gray-400 font-light">Price</td>
                  {(['websites-payload-cms', 'websites-shopify', 'websites-custom-commerce'] as const).map(
                    (key) => (
                      <td key={key} className="py-4 px-4 text-center">
                        <PriceAnchor offer={key} className="text-sm" />
                      </td>
                    ),
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── Get Found offers ── */}
      <Section id="get-found">
        <SectionHeader
          eyebrow="Get Found"
          title={
            <>
              Search <span className="gradient-text font-light">Visibility</span>
            </>
          }
          sub="A site nobody finds is a liability. Diagnose it once, or have us run the channels month over month."
        />
        <div className="space-y-5">
          {getFoundOffers.map((offer, i) => (
            <OfferRow key={offer.key} offer={offer} index={i} />
          ))}
        </div>
      </Section>

      {/* ── Care ── */}
      <Section id="care">
        <SectionHeader
          eyebrow="Care"
          title={
            <>
              After <span className="gradient-text font-light">Launch</span>
            </>
          }
          sub="Keep the site healthy without hiring for it."
        />
        <OfferRow offer={careOffer} index={0} />
      </Section>

      {/* ── Engagement process ── */}
      <Section id="process" width="prose">
        <SectionHeader
          eyebrow="The Process"
          title={
            <>
              How engagements <span className="gradient-text font-light">run</span>
            </>
          }
          sub="Every project follows the same structured sequence — from first conversation through final delivery. No surprises on either side."
        />
        <div className="space-y-10">
          {engagementSteps.map((step, index) => (
            <ScrollReveal key={step.title} delay={index * 75}>
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
        <ScrollReveal delay={400}>
          <div className="mt-16 flex items-center justify-center gap-6">
            <div className="h-px w-12 bg-white/[0.06]" />
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-light text-center">
              NDA-protected &middot; Fixed quotes &middot; Written sign-off
            </p>
            <div className="h-px w-12 bg-white/[0.06]" />
          </div>
        </ScrollReveal>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" width="prose">
        <SectionHeader
          title={
            <>
              Frequently Asked <span className="gradient-text font-light">Questions</span>
            </>
          }
          sub="Common questions before getting started."
        />
        <FAQ faqs={faqs} />
      </Section>

      {/* ── CTA ── */}
      <CtaSection
        heading={
          <>
            Not sure which <span className="gradient-text font-light">one</span>?
          </>
        }
        sub="The first conversation is a discovery call — scope, timeline, and budget range, no commitment. You'll leave with a recommendation either way."
        primary={{ label: 'Start a project', href: '/contact' }}
        note="NDA before any sensitive detail is exchanged · Fixed quote after scoping"
      />
    </PageShell>
  )
}
