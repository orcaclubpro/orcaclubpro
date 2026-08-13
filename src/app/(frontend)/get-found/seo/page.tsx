import Link from 'next/link'
import { SpokePage } from '@/components/templates/SpokePage'
import type { StatProps } from '@/components/marketing/Stat'
import { buildMetadata } from '@/lib/seo/meta'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'SEO Services Orange County | Monthly Search Visibility | ORCACLUB',
  description:
    'Founder-run SEO services for Orange County businesses. Technical foundation, content mapped to real searches, and authority building — one monthly retainer, reported in leads, not vanity metrics.',
  path: '/get-found/seo',
  ogType: 'article',
})

const AUTHOR = {
  name: 'Chance Noonan',
  role: 'Founder, ORCACLUB',
  // TODO(chance): verify blurb — this is the solo-operator credibility line on every spoke page
  blurb:
    'I run every ORCACLUB engagement personally — the audits, the builds, and the monthly search work — so the person writing this page is the same person doing the work.',
}

// Stats rule: only figures whose publisher and URL have been verified.
const stats: StatProps[] = [
  {
    value: '27.6%',
    label:
      'average organic click-through rate for the #1 result on Google, across an analysis of ~4 million search results.',
    source: { name: 'Backlinko Google CTR study', url: 'https://backlinko.com/google-ctr-stats' },
  },
  {
    value: '2.5s',
    label:
      'the Largest Contentful Paint threshold Google calls "good" — measured at the 75th percentile of real page loads, alongside INP under 200ms and CLS under 0.1.',
    source: { name: 'Google — web.dev, Core Web Vitals', url: 'https://web.dev/articles/vitals' },
  },
  // TODO(chance): add a sourced stat for organic share of traffic if you find one you trust —
  // the widely quoted BrightEdge "53% of traffic" figure was dropped because the underlying
  // report is not publicly verifiable at a stable URL.
]

const faqs: Faq[] = [
  {
    question: 'Do you guarantee first-page rankings?',
    answer:
      'No, and you should walk away from anyone who does. Google does not sell organic positions and no outside party controls its results. What I commit to is the work — technical fixes, content, authority building — reported honestly every month, with leading indicators (impressions, rankings, clicks) you can verify yourself in Google Search Console.',
  },
  {
    question: 'Do I still need SEO if I already run Google Ads?',
    answer:
      'Ads buy visibility while you pay; SEO earns visibility that persists. They also feed each other: paid search-term data tells you which queries convert before you invest months of content in them, and strong organic presence lowers your dependence on rising click costs. The get-found system runs both as one program instead of two competing vendors.',
  },
  {
    question: 'What happens to the work if I cancel?',
    answer:
      'You keep everything. The content lives on your website, the technical fixes stay in your codebase, and Google Search Console, Analytics, and Business Profile are owned by your accounts from day one. SEO compounds, so momentum slows if the work stops — but nothing is held hostage.',
  },
  {
    question: 'Is SEO different for a local service business than for ecommerce?',
    answer:
      'Meaningfully, yes. A local service business wins with location relevance, Google Business Profile, reviews, and service pages that match "near me" intent. Ecommerce wins with category and product page architecture, structured data, and content that captures comparison searches. Same three pillars, very different execution — the monthly plan reflects which one you are.',
  },
  {
    question: 'Do you work with businesses outside Orange County?',
    answer:
      'Yes. The system is the same anywhere — Orange County is simply home base and where most client work is concentrated, which is why the local examples on this page come from here.',
  },
]

export default function SeoSpokePage() {
  return (
    <SpokePage
      path="/get-found/seo"
      schema={{
        headline: 'SEO Services in Orange County: How a Monthly Retainer Actually Works',
        description:
          'What a monthly SEO retainer includes, how long SEO takes, and how technical work, content, and authority building compound into search visibility for Orange County businesses.',
      }}
      breadcrumbs={[
        { name: 'Home', path: '/' },
        { name: 'Get Found', path: '/get-found' },
        { name: 'SEO', path: '/get-found/seo' },
      ]}
      title={
        <>
          SEO services in <span className="gradient-text font-light">Orange County</span>, run
          month to month
        </>
      }
      answer={
        <>
          <strong>
            ORCACLUB runs monthly SEO for Orange County businesses on three pillars: a technical
            foundation Google can crawl and render fast, content mapped to what your customers
            actually search, and authority earned through real citations and mentions.
          </strong>{' '}
          It&apos;s one part of the{' '}
          <Link href="/get-found" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            get-found system
          </Link>{' '}
          — search, ads, and local visibility managed as a single program by the founder, not an
          account team.
        </>
      }
      qa={[
        {
          id: 'what-is-included',
          heading: 'What does a monthly SEO retainer actually include?',
          body: (
            <>
              <p>
                Every month splits across the same three pillars, weighted to where your site is
                weakest. <strong>Technical:</strong> crawl health, page speed, structured data, and
                index coverage — the plumbing that decides whether the rest of the work can rank at
                all. <strong>Content:</strong> new pages and rewrites mapped to specific queries
                your customers type, not blog posts published for their own sake.{' '}
                <strong>Authority:</strong> citations, local mentions, and links from sources that
                make sense for your business.
              </p>
              <p>
                What you see is concrete: a prioritized plan at the start of the month, the changes
                shipped during it, and a report at the end tying the work to impressions, rankings,
                and leads. Because I&apos;m a developer first, technical fixes get implemented
                directly instead of dying in a recommendations PDF — which is where most agency SEO
                quietly stalls.
              </p>
            </>
          ),
        },
        {
          id: 'how-long-does-seo-take',
          heading: 'How long does SEO take to work?',
          body: (
            <>
              <p>
                Expect meaningful movement in <strong>three to six months</strong>, not weeks.
                Technical fixes can lift crawling and indexing within days, and low-competition
                local queries sometimes move in the first month or two — but competitive Orange
                County terms take sustained work because Google needs time to recrawl, re-evaluate,
                and trust the changes.
              </p>
              <p>
                The honest framing: SEO is a compounding asset, not a faucet. A page that reaches
                the first page keeps producing leads without additional spend, and every month of
                work builds on the last instead of resetting to zero the way paused ad campaigns
                do. That&apos;s also why I report leading indicators — impressions and average
                position from Search Console — from month one, so you can watch the curve bend
                before the lead volume follows. Anyone promising page one in thirty days is either
                targeting queries nobody searches or planning tactics that get sites penalized.
              </p>
            </>
          ),
        },
        {
          id: 'technical-foundation',
          heading: 'What is the technical foundation, and why does it come first?',
          body: (
            <>
              <p>
                Technical SEO is everything that determines whether Google can{' '}
                <strong>find, render, and understand</strong> your pages: crawlability and clean
                internal linking, mobile rendering, canonical and redirect hygiene, XML sitemaps,
                structured data that tells machines exactly what each page is, and Core Web Vitals
                measured against Google&apos;s published thresholds — Largest Contentful Paint under
                2.5 seconds, Interaction to Next Paint under 200ms, layout shift under 0.1, at the
                75th percentile of real visits.
              </p>
              <p>
                It comes first because it multiplies everything after it. Content published on a
                site that loads slowly, renders poorly on phones, or buries pages five clicks deep
                is fighting with a handicap no amount of writing overcomes. Most sites I audit in
                Orange County carry the same handful of problems: bloated themes dragging load
                times, duplicate pages splitting ranking signals, and zero structured data. Fixing
                those is unglamorous, one-time-ish work — but it&apos;s the difference between
                content that ranks and content that sits in the index doing nothing. Ongoing
                months then only need technical maintenance, freeing budget for content and
                authority.
              </p>
            </>
          ),
        },
        {
          id: 'content-strategy',
          heading: 'How do you decide what content to create?',
          body: (
            <>
              <p>
                Backwards from revenue. I start with the services that actually make you money,
                map the queries a buyer types at each stage — <em>problem</em> searches,{' '}
                <em>comparison</em> searches, <em>ready-to-hire</em> searches — and check what
                already ranks for each. The gap between what you sell and what your site says
                becomes the content queue, ordered by how close each query sits to a purchase.
              </p>
              <p>
                In practice that means fewer, better pages: a real page for every service you
                offer, location-relevant pages where they&apos;re genuinely useful, and supporting
                articles that answer the questions customers ask before they buy. Each page is
                written to answer its query directly — the same structure this page uses — because
                that&apos;s what both Google and AI assistants reward. What it doesn&apos;t mean:
                publishing four generic blog posts a month to hit a quota. Volume without search
                demand behind it is content nobody asked for.
              </p>
            </>
          ),
        },
        {
          id: 'authority',
          heading: 'How do you build authority without buying spam links?',
          body: (
            <>
              <p>
                Slowly and legitimately, because the alternative gets sites penalized. Authority
                work in this retainer means: <strong>consistent citations</strong> across the
                directories and data providers that feed local search, <strong>real mentions</strong>{' '}
                from chambers, local press, suppliers, and industry associations you already have
                relationships with, and <strong>content worth referencing</strong> — data, guides,
                and answers other sites link to because they&apos;re useful.
              </p>
              <p>
                For most Orange County businesses the bar is lower than people fear. You&apos;re
                not competing with national publishers; you&apos;re competing with a handful of
                local rivals whose link profiles are usually thin. A dozen genuinely relevant
                mentions frequently outweighs hundreds of the junk links link-sellers peddle.
                I don&apos;t buy link packages, and if you&apos;ve bought them before, part of
                early authority work is often assessing and cleaning up what that left behind.
              </p>
            </>
          ),
        },
        {
          id: 'cost',
          heading: 'How much do SEO services cost in Orange County?',
          body: (
            <>
              <p>
                Orange County agency retainers commonly run from a few hundred dollars a month for
                templated local-listing work to several thousand for full-service programs — and
                price tracks who does the work more than what gets done. Big-agency retainers fund
                account managers and reporting layers; cheap retainers fund software that touches
                your listings and little else.
                {/* TODO(chance): verify the market-range framing matches what you want to claim publicly */}
              </p>
              <p>
                ORCACLUB&apos;s model is a flat monthly retainer with the founder doing the work —
                current pricing is published on the{' '}
                <Link
                  href="/pricing"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  pricing page
                </Link>{' '}
                rather than buried in a sales call. The honest way to evaluate any SEO cost is
                against a customer&apos;s value: if a client is worth four figures to you and
                search produces even a few extra per month, the retainer pays for itself. If your
                average sale is small and local demand is thin, I&apos;ll tell you SEO is the wrong
                first investment — that conversation happens in the audit, before you spend.
              </p>
            </>
          ),
        },
        {
          id: 'reporting',
          heading: 'How do you report SEO results?',
          body: (
            <>
              <p>
                A monthly report with three layers, in plain language.{' '}
                <strong>What was done:</strong> the actual changes shipped — pages published,
                fixes deployed, citations built. <strong>What moved:</strong> impressions, average
                position, and clicks from Google Search Console, plus rankings on the specific
                queries we&apos;re targeting. <strong>What it produced:</strong> organic leads —
                form fills and calls attributed to search, which is the only line that ultimately
                justifies the retainer.
              </p>
              <p>
                Two things make this different from the reports you may have received before.
                First, everything is verifiable: Search Console and Analytics live under your
                accounts, so you can check any number I show you. Second, no vanity padding — a
                traffic spike from an irrelevant blog post gets called out as noise, not
                celebrated. Because the get-found system also covers ads and local visibility, the
                report shows search in context of the whole pipeline instead of pretending SEO
                operates in a vacuum.
              </p>
            </>
          ),
        },
      ]}
      stats={stats}
      faqs={faqs}
      lastUpdated="2026-08-13"
      author={AUTHOR}
      cta={{
        heading: (
          <>
            Start with the <span className="gradient-text font-light">audit</span>, not the
            retainer
          </>
        ),
        sub: 'Every engagement begins with the get-found audit — a full crawl, ranking, and visibility baseline that shows exactly where you stand before you commit to anything. The Growth retainer then runs SEO alongside ads and local visibility as one system.',
        primary: { label: 'Request the audit', href: '/contact' },
        secondary: { label: 'See what the audit covers', href: '/get-found/audit' },
        note: 'Founder-run · No long-term contracts · You own every account',
      }}
    />
  )
}
