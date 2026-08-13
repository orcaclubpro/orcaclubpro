import ScrollReveal from '@/components/layout/scroll-reveal'
import { PageShell } from '@/components/marketing/PageShell'
import { Section } from '@/components/marketing/Section'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { CtaSection } from '@/components/marketing/CtaSection'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { buildMetadata } from '@/lib/seo/meta'
import { BASE_URL, ORG_ID } from '@/lib/seo/site'
import { Check, X } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'About | ORCACLUB',
  description:
    'ORCACLUB is a technical operations development studio in Orange County, run by one senior operator. Direct access, NDA-first process, fixed quotes — and you own everything that gets built.',
  path: '/about',
})

const howItWorks = [
  {
    title: 'Direct access, always',
    description:
      'You talk to the person building your project. No account managers, no project coordinators relaying messages, no layers between a question and an answer.',
  },
  {
    title: 'NDA before details',
    description:
      'Confidentiality is step one of every engagement. An NDA is signed before you share anything about your business — it is the default, not a special request.',
  },
  {
    title: 'Fixed quotes after scoping',
    description:
      'Every project gets a real scoping conversation, then a fixed price and a fixed timeline. No hourly meters, no open-ended invoices.',
  },
  {
    title: 'You own everything',
    description:
      'Domain, hosting accounts, code, and content stay in your name from day one. If we ever part ways, everything transfers cleanly.',
  },
]

const refusals = [
  {
    title: 'No invented numbers',
    description:
      'No fabricated case studies, ROI percentages, or satisfaction scores. If a claim appears on this site, it can be backed up.',
  },
  {
    title: 'No outsourcing',
    description:
      'Nothing is white-labeled or handed to subcontractors. The work you pay for is the work one senior operator personally does.',
  },
  {
    title: 'No lock-in',
    description:
      'No proprietary platforms you cannot leave, no hostage hosting, no artificial dependencies designed to make firing us painful.',
  },
  {
    title: 'No work without a scope',
    description:
      'No vague retainers billed against goodwill. Every engagement has a defined scope, a price, and a deliverable before it starts.',
  },
]

export default function AboutPage() {
  const jsonLd: object[] = [
    {
      '@type': 'Person',
      '@id': `${BASE_URL}/about#person`,
      name: 'Chance Noonan',
      jobTitle: 'Founder & Operator',
      url: `${BASE_URL}/about`,
      worksFor: { '@id': ORG_ID },
      knowsAbout: [
        'Web Development',
        'Next.js',
        'Payload CMS',
        'Shopify',
        'E-commerce',
        'Search Visibility',
        'Business Automation',
      ],
    },
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ]),
  ]

  return (
    <PageShell>
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <Section spacing="hero" borderTop={false}>
        <div className="text-center">
          <ScrollReveal>
            <p className="text-xs tracking-[0.35em] uppercase text-white/30 mb-8 font-light">
              About
            </p>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight text-white mb-8">
              One Operator. <span className="gradient-text font-light">The Whole Stack.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light">
              ORCACLUB is a technical operations development studio in Orange County, California —
              websites, commerce systems, and search visibility, built and run by one senior
              operator instead of an agency org chart.
            </p>
          </ScrollReveal>
        </div>
      </Section>

      {/* Who's behind it */}
      <Section width="prose">
        <SectionHeader
          align="left"
          title={
            <>
              Who&apos;s <span className="gradient-text font-light">Behind It</span>
            </>
          }
        />
        <ScrollReveal>
          <div className="space-y-6 text-lg text-gray-400 font-light leading-relaxed [&_strong]:text-white [&_strong]:font-normal">
            {/* TODO(chance): verify and expand this bio — background, years, anything you want public. */}
            <p>
              <strong>Chance Noonan</strong> — a full-stack developer who builds the whole system:
              the site your customers see, the CMS your team edits, the integrations that move data
              between your tools, and the search presence that brings people in.
            </p>
            <p>
              When you hire ORCACLUB, that is who you get. Not a sales rep who hands you to a
              delivery team, not a project manager who does not write code — the same person on
              every call, in every commit, accountable for the result.
            </p>
            <p>
              The studio calls itself a <strong>technical operations development studio</strong>{' '}
              because the work rarely stops at a website. Most projects are really operations
              problems — intake that goes to voicemail, orders that get re-keyed by hand, a business
              invisible in local search — and the site is just where the fix lives.
            </p>
          </div>
        </ScrollReveal>
      </Section>

      {/* How the studio works */}
      <Section>
        <SectionHeader
          title={
            <>
              How the Studio <span className="gradient-text font-light">Works</span>
            </>
          }
        />
        <div className="grid md:grid-cols-2 gap-6">
          {howItWorks.map((item, index) => (
            <ScrollReveal key={index} delay={index * 75}>
              <div className="flex items-start gap-4 p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl h-full">
                <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* What it refuses to do */}
      <Section>
        <SectionHeader
          title={
            <>
              What It <span className="gradient-text font-light">Refuses to Do</span>
            </>
          }
          sub="A one-person studio stays trustworthy by being clear about its lines."
        />
        <div className="grid md:grid-cols-2 gap-6">
          {refusals.map((item, index) => (
            <ScrollReveal key={index} delay={index * 75}>
              <div className="flex items-start gap-4 p-6 rounded-xl bg-black/20 border border-white/[0.06] backdrop-blur-xl h-full">
                <X className="w-5 h-5 text-gray-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      <CtaSection
        heading={
          <>
            Work With the Person Who <span className="gradient-text font-light">Does the Work</span>
          </>
        }
        sub="Tell me what's broken or what you're building. You'll get a straight answer about whether it's a fit."
        primary={{ label: 'Start a conversation', href: '/contact' }}
        secondary={{ label: 'See pricing', href: '/pricing' }}
        note="NDA-first process | Fixed quotes | Direct operator access"
      />
    </PageShell>
  )
}
