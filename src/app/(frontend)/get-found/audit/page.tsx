import { MoneyPage } from '@/components/templates/MoneyPage'
import { buildMetadata } from '@/lib/seo/meta'

export const metadata = buildMetadata({
  title: 'Search Visibility Audit | Fixed-Price SEO & AI Search Audit',
  description:
    'A fixed-price, fixed-scope audit of how your business shows up on Google and AI search: crawl and indexation, Core Web Vitals, structured data, local visibility, and measurement — ending in a prioritized plan you own.',
  path: '/get-found/audit',
})

export default function AuditPage() {
  return (
    <MoneyPage
      path="/get-found/audit"
      schema={{
        name: 'Search Visibility Audit',
        serviceType: 'SEO Audit',
        description:
          'Fixed-price diagnostic of search visibility across Google and AI search: technical SEO, structured data, Core Web Vitals, local presence, and analytics setup, delivered as a prioritized findings report and plan.',
      }}
      hero={{
        eyebrow: 'Search Visibility Audit',
        title: (
          <>
            Find out why you&apos;re <span className="gradient-text font-light">not being found</span>
          </>
        ),
        sub: 'A fixed-price, fixed-scope diagnostic of how your business shows up on Google and AI search — what is broken, what is missing, and what to fix first. You get a prioritized plan you own, whoever executes it.',
        ctaLabel: 'Book the audit',
      }}
      priceKey="get-found-audit"
      deliverables={[
        {
          title: 'Crawl & indexation review',
          description:
            'Google Search Console coverage, XML sitemaps, robots.txt, canonical tags, and redirects — mapping which pages Google can actually see versus which are invisible, and why.',
        },
        {
          title: 'Core Web Vitals & performance',
          description:
            'LCP, CLS, and INP measured against real field data, with fixes ranked by impact. Slow pages lose rankings and paid-traffic conversions at the same time.',
        },
        {
          title: 'Structured data & schema',
          description:
            'JSON-LD coverage check — Organization, LocalBusiness, Service, FAQ, and the rest — against what your pages should be declaring. This is what search engines and AI models parse to understand who you are.',
        },
        {
          title: 'On-page & content review',
          description:
            'Title tags, meta descriptions, heading structure, and internal linking, mapped against the queries you should be winning. Where content is thin, missing, or answering the wrong question.',
        },
        {
          title: 'Local visibility check',
          description:
            'Google Business Profile completeness, review profile, citation and NAP consistency, and where you actually rank in the Maps pack for your core services.',
        },
        {
          title: 'AI search visibility',
          description:
            'How ChatGPT, Perplexity, and Google AI Overviews represent your business today — what they say, what they cite, and which gaps in your content and structured data feed wrong or missing answers.',
        },
        {
          title: 'Measurement setup review',
          description:
            'GA4, Google Tag Manager, Search Console, and conversion events — whether the numbers you are looking at can be trusted, and what has to change before any channel spend is judged by them.',
        },
        {
          title: 'Prioritized findings & plan',
          description:
            'Everything above distilled into a ranked plan: what to fix first, why, and roughly what each fix takes. Scoped so you, your developer, or ORCACLUB can execute it.',
        },
      ]}
      process={[
        {
          title: 'Kickoff & access',
          description:
            'A short call plus read access to Search Console, GA4, and your Google Business Profile. If any of those do not exist yet, that becomes finding number one.',
        },
        {
          title: 'Crawl & collect',
          description:
            'Full site crawl, Search Console and analytics data pull, performance testing against field data, and direct testing of how AI assistants answer questions about your business and category.',
        },
        {
          title: 'Analyze & prioritize',
          description:
            'Findings are ranked by impact against effort — not a 200-line issue dump, but a short list of what actually moves visibility, in order.',
        },
        {
          title: 'Readout & plan',
          description:
            'A walkthrough call plus the written report and prioritized plan. You leave knowing exactly what is wrong, what it costs you, and what to do about it.',
        },
      ]}
      faqs={[
        {
          question: 'What exactly do I get?',
          answer:
            'A written report covering the eight areas above, a prioritized fix-first plan ranked by impact versus effort, and a walkthrough call to go through it. The plan is written so it can be executed by anyone competent — you keep it regardless of whether you ever work with ORCACLUB again.',
        },
        {
          question: 'Do you fix the issues, or just report them?',
          answer:
            'The audit is a diagnostic — fixed scope is what keeps it fixed price. Quick wins that take minutes get flagged clearly so you can knock them out immediately. Larger execution is quoted separately, either as a one-off project or through the Growth retainer, which typically starts by working straight down the audit plan.',
        },
        {
          question: 'How do you audit AI search?',
          answer:
            'By testing it directly: asking ChatGPT, Perplexity, and Google AI Overviews the questions your customers ask, recording what they answer and what they cite, then tracing gaps back to causes on your site — missing structured data, thin content, inconsistent business information. AI search is new, but the inputs it draws from are auditable today.',
        },
        {
          question: 'Other agencies offer free SEO audits. Why does this cost money?',
          answer:
            'A free audit is a sales document — an automated crawl report designed to scare you into a retainer. This is one to two weeks of a senior operator manually reviewing your site, your data, and your market, with conclusions specific to your business. It is priced like real work because it is real work, and the deliverable is designed to be useful even if you never spend another dollar with us.',
        },
        {
          question: 'What do you need from me?',
          answer:
            'About an hour total: a kickoff call, read access to Google Search Console, GA4, and your Google Business Profile, and answers to a short questionnaire about your services and the customers you want more of. Everything else happens on our side.',
        },
      ]}
      cta={{
        heading: (
          <>
            Stop guessing why you&apos;re <span className="gradient-text font-light">invisible</span>
          </>
        ),
        sub: 'One fixed price, one to two weeks, and a prioritized plan for getting found on Google and AI search. The natural next step is the Growth retainer — but the plan is yours either way.',
        primaryLabel: 'Book the audit',
        note: 'Fixed price, fixed scope. No retainer required.',
      }}
    />
  )
}
