import { MoneyPage } from '@/components/templates/MoneyPage'
import { buildMetadata } from '@/lib/seo/meta'

export const metadata = buildMetadata({
  title: 'Search Growth Retainer | SEO, Ads & AI Search Management',
  description:
    'A monthly retainer that runs your whole search system — SEO, content, Google Ads, Meta, local visibility, and AI search — executed by one senior operator with weekly reporting.',
  path: '/get-found/growth',
})

export default function GrowthPage() {
  return (
    <MoneyPage
      path="/get-found/growth"
      schema={{
        name: 'Growth Retainer',
        serviceType: 'Search Marketing Management',
        description:
          'Monthly search-visibility retainer covering SEO, content, Google Ads, Meta Ads, local visibility, and AI search as one managed channel mix, with weekly reporting.',
      }}
      hero={{
        eyebrow: 'Growth Retainer',
        title: (
          <>
            One operator running your <span className="gradient-text font-light">whole search system</span>
          </>
        ),
        sub: 'SEO, content, Google Ads, Meta, local visibility, and AI search — managed as one monthly channel mix instead of six vendor silos. Weekly reporting, monthly reprioritization, and the same senior operator doing the work every week.',
        ctaLabel: 'Start the conversation',
      }}
      priceKey="get-found-growth"
      deliverablesTitle={
        <>
          What the retainer <span className="gradient-text font-light">covers</span>
        </>
      }
      deliverables={[
        {
          title: 'Monthly channel mix',
          description:
            'Your budget and my hours are allocated across the channels each month based on what the numbers say is producing — not a fixed package of deliverables that ignores results.',
        },
        {
          title: 'Technical SEO & site health',
          description:
            'Ongoing crawlability, Core Web Vitals, structured data, and indexation upkeep. The foundation gets maintained, not audited once and forgotten.',
        },
        {
          title: 'Content production & optimization',
          description:
            'Pages and posts built around queries your customers actually search — new content where gaps exist, rework where existing pages underperform.',
        },
        {
          title: 'Paid campaign management',
          description:
            'Google Ads and Meta Ads: campaign builds, keyword and audience testing, creative iteration, and budget management against conversions. Ad spend is paid by you directly to the platforms.',
        },
        {
          title: 'Local visibility management',
          description:
            'Google Business Profile upkeep, review response cadence, and citation consistency — the signals that decide the Maps pack.',
        },
        {
          title: 'AI search optimization',
          description:
            'Structured data, entity consistency, and content shaped for how ChatGPT, Perplexity, and AI Overviews select and cite sources — folded into the same content and technical work, not billed as a separate mystery line item.',
        },
        {
          title: 'Measurement & weekly reporting',
          description:
            'GA4, Search Console, and ad platform data rolled into a weekly report in plain language: what happened, what it means, and what changes next week because of it.',
        },
        {
          title: 'Monthly priorities call',
          description:
            'Once a month we look at the trend lines together and reset the channel mix. You always know what is being worked on and why.',
        },
      ]}
      process={[
        {
          title: 'Start from the audit',
          description:
            'Retainers begin with a Search Visibility Audit — either one you already have, or one folded into the first month. It sets the baseline and the initial fix-first list, so the retainer starts executing on day one instead of exploring.',
        },
        {
          title: 'Set the channel mix',
          description:
            'Based on the audit and your budget, we agree where the effort goes first. A local service business and a niche B2B firm get very different mixes — that is the point.',
        },
        {
          title: 'Execute weekly, report weekly',
          description:
            'The work ships every week and the report lands every week. No quarterly decks, no "trust the process" black-box months.',
        },
        {
          title: 'Reprioritize monthly',
          description:
            'Channels that produce get more of the budget; channels that stall get diagnosed or cut. The mix follows the data, and you see the same data I do.',
        },
      ]}
      faqs={[
        // TODO(chance): define retainer tiers — what $1k vs $3k vs $5k concretely buys
        {
          question: 'What does $1,000/mo buy versus $5,000/mo?',
          answer:
            'The honest variable is hours and channel count. At the low end you get a focused engagement — typically one or two channels (for most local businesses: local visibility plus either SEO or Google Ads) with weekly reporting. At the top end you get the full system: multiple paid channels, ongoing content production, and technical work running in parallel. Exact tier definitions are scoped on the intro call against your market and goals.',
        },
        {
          question: 'Is there a long-term contract?',
          answer:
            'No. The retainer is month-to-month. Search work compounds — most of the value shows up over quarters, not weeks — so I will tell you honestly if your timeline expectations and budget do not match. But you are never locked in.',
          // TODO(chance): verify contract terms — confirm month-to-month, notice period
        },
        {
          question: 'Do I need the audit first?',
          answer:
            'Yes, in practice. Running a retainer without a baseline means spending your first paid month discovering what an audit would have found for a fixed price. If you come in without one, the first month of the retainer is structured around producing it.',
        },
        {
          question: 'Who actually does the work?',
          answer:
            'The same senior operator you talk to — ORCACLUB is a technical operations development studio, not an agency with layers. The trade-off is capacity: retainer slots are limited, because everything is done by the person accountable for it.',
        },
        {
          question: 'How is ad spend handled?',
          answer:
            'You pay Google and Meta directly from your own ad accounts — you own the accounts, the data, and the billing. The retainer covers strategy and management only, so there is no margin hidden inside your ad spend.',
        },
        {
          question: 'What does reporting look like?',
          answer:
            'A weekly written report in plain language: traffic, rankings, spend, conversions, what was shipped, and what changes next week. Plus a monthly call to reset priorities. If a report ever leaves you unsure what you paid for that week, that is a bug — tell me.',
        },
      ]}
      cta={{
        heading: (
          <>
            Ready to run search as <span className="gradient-text font-light">one system</span>?
          </>
        ),
        sub: 'Start with the audit, then hand the plan to the retainer — one operator, one channel mix, weekly reporting on what moved.',
        primaryLabel: 'Start the conversation',
        note: 'Month-to-month. Limited retainer slots.',
      }}
    />
  )
}
