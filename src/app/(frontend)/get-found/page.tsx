import { HubPage } from '@/components/templates/HubPage'
import { buildMetadata } from '@/lib/seo/meta'

export const metadata = buildMetadata({
  title: 'SEO Services Orange County | Get Found on Google & AI Search',
  description:
    'One system for getting found: technical SEO, content, Google Ads, Meta, local visibility, and AI search — run together by a senior operator in Orange County. Start with a fixed-price audit.',
  path: '/get-found',
})

export default function GetFoundPage() {
  return (
    <HubPage
      path="/get-found"
      schema={{
        name: 'Get Found',
        description:
          'Search visibility services in Orange County: technical SEO, content, Google Ads, Meta Ads, local visibility, and AI search run as one system.',
      }}
      hero={{
        eyebrow: 'Get Found',
        title: (
          <>
            Getting found is <span className="gradient-text font-light">one system</span>
          </>
        ),
        sub: 'Technical SEO, content, Google Ads, Meta, local visibility, and AI search — run together by one senior operator, not sold as separate line items.',
      }}
      intro={[
        'How do you get found on Google — and now ChatGPT? The same way: a fast, crawlable site with clean structured data, content that actually answers the questions your customers ask, consistent local signals, and paid campaigns where paying beats waiting. Google ranks it, and AI models cite it, for the same underlying reasons.',
        'That is why buying channels à la carte underperforms. An SEO vendor, an ads vendor, and a "GBP guy" each optimize their own silo. Run as one system, the channels feed each other: ad data tells you which keywords convert before you invest months of content in them, technical fixes lift organic rankings and ad Quality Scores at the same time, and the reviews and structured data that win the Maps pack are the same signals AI assistants pull into their answers.',
        'Every engagement starts the same way: a fixed-price Search Visibility Audit that maps where you show up today — across Google and AI search — and what to fix first. From there you can execute the plan yourself, or hand it to the Growth retainer and get weekly reporting on what moved.',
      ]}
      cards={[
        {
          title: 'Search Visibility Audit',
          blurb:
            'Start here. A fixed-price, fixed-scope diagnostic of how you show up on Google and AI search — technical, content, local, and measurement — ending in a prioritized plan.',
          href: '/get-found/audit',
          priceKey: 'get-found-audit',
        },
        {
          title: 'Growth Retainer',
          blurb:
            'The whole system, run monthly: a channel mix across SEO, ads, local, and AI search, executed by one operator with weekly reporting.',
          href: '/get-found/growth',
          priceKey: 'get-found-growth',
        },
        {
          title: 'SEO',
          blurb:
            'The organic foundation: technical health, content built around real queries, and the authority signals that compound over time.',
          href: '/get-found/seo',
        },
        {
          title: 'Google Ads',
          blurb:
            'Capture high-intent searches today while organic builds. Campaigns managed against conversions, not clicks.',
          href: '/get-found/google-ads',
        },
        {
          title: 'Meta Ads',
          blurb:
            'Facebook and Instagram campaigns for demand that does not start with a search — audience testing, creative iteration, retargeting.',
          href: '/get-found/meta-ads',
        },
        {
          title: 'Local Visibility',
          blurb:
            'Google Business Profile, Maps rankings, reviews, and citation consistency — how nearby customers actually choose.',
          href: '/get-found/local-visibility',
        },
        {
          title: 'AI Search',
          blurb:
            'Show up when customers ask ChatGPT, Perplexity, or Google AI Overviews. Structured data and content shaped for how models cite sources.',
          href: '/get-found/ai-search',
        },
      ]}
      faqs={[
        {
          question: 'How do I get my business found on ChatGPT and AI search?',
          answer:
            'AI assistants answer from what they can crawl, parse, and trust: your site content, structured data, reviews, and consistent business information across the web. There is no submission form and no shortcut — the work is making your site the clearest, best-structured answer to the questions your customers ask. That overlaps heavily with good SEO, which is why we treat AI search as part of one system rather than a separate service.',
        },
        {
          question: 'Do I need every channel?',
          answer:
            'No. The audit exists to answer exactly this — most businesses need two or three channels done well, not six done thinly. A local service business usually lives on local visibility and Google Ads; a niche B2B firm may need content and AI search far more than Meta. The system framing means the channels you do run reinforce each other, not that you buy all of them.',
        },
        {
          question: 'Why one operator instead of an agency?',
          answer:
            'ORCACLUB is a technical operations development studio run by a solo senior operator. The person who audits your site is the person who fixes it and the person who reports the numbers to you — no account managers, no junior handoffs, no markup layers. The trade-off is honest: limited client slots, in exchange for the work actually being done by the person you talked to.',
        },
        {
          question: 'Where should I start?',
          answer:
            'The Search Visibility Audit. It is fixed-price, takes one to two weeks, and produces a prioritized plan you own regardless of what happens next. Some clients execute it themselves; others hand it to the Growth retainer. Either way you start from a map instead of a guess.',
        },
      ]}
      cta={{
        heading: (
          <>
            Not sure where to <span className="gradient-text font-light">start</span>?
          </>
        ),
        sub: 'The audit answers that. One fixed price, one to two weeks, and a prioritized plan for getting found — on Google and everywhere else your customers ask.',
        primary: { label: 'Book a call', href: '/contact' },
        secondary: { label: 'See pricing', href: '/pricing' },
        note: 'Orange County based. Working with clients everywhere.',
      }}
    />
  )
}
