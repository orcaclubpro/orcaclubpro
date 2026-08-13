import Link from 'next/link'
import { SpokePage } from '@/components/templates/SpokePage'
import type { StatProps } from '@/components/marketing/Stat'
import { buildMetadata } from '@/lib/seo/meta'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'Meta Ads Management Orange County | Facebook & Instagram Ads | ORCACLUB',
  description:
    'Founder-run Facebook and Instagram ads for Orange County businesses: Pixel plus Conversions API tracking, a real creative testing cadence, broad audience strategy, and reporting in cost per lead.',
  path: '/get-found/meta-ads',
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
    value: '3.60B',
    label:
      'people used a Meta app on an average day in June 2026 — the reason reach is never the constraint on Meta; relevance is.',
    source: {
      name: 'Meta Q2 2026 results',
      url: 'https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-Reports-Second-Quarter-2026-Results/default.aspx',
    },
  },
  // TODO(chance): add a sourced stat on signal loss post-ATT if you find a first-party one.
  // Apple and Meta both describe the effect qualitatively; the widely circulated percentages
  // trace back to vendor blog posts, so nothing was used here.
]

const faqs: Faq[] = [
  {
    question: 'Do I have to run ads on both Facebook and Instagram?',
    answer:
      'They are bought in the same place, so the practical question is where your creative performs, not which app you prefer. Most campaigns start with placements open so Meta can find the cheapest conversions, then get restricted only when the data shows a placement is buying junk. Vertical video tends to earn its keep on Instagram and Reels; longer copy and link posts still work on Facebook, where the audience for most Orange County service businesses actually skews.',
  },
  {
    question: 'Who owns the ad account and the pixel data?',
    answer:
      'You do. The Business Manager, the ad account, the pixel or dataset, and the custom audiences are created under your business and I work inside them with assigned access you can revoke. That matters more on Meta than most people realize: your pixel history and customer lists are the raw material for every future campaign, and an agency that rebuilds them inside its own Business Manager keeps the compounding asset when you leave.',
  },
  {
    question: 'Do you produce the creative?',
    answer:
      'I write the copy, build the ad variants, and direct what needs to be shot — and for most local businesses the highest-performing footage is captured on a phone by you or your team, because it looks native to the feed. Where a build is warranted, ORCACLUB also builds the landing page the ad points at, so the click lands somewhere that matches the promise instead of on a generic homepage.',
  },
  {
    question: 'My Meta ads worked and then suddenly stopped. What happened?',
    answer:
      'Nine times out of ten the creative fatigued: the same audience has now seen the ad enough that frequency climbed and cost per result followed. The other common causes are an ad set re-entering the learning phase after too many edits, a tracking break that stopped conversions reporting, or a budget change large enough to reset delivery. All four are diagnosable in an afternoon, which is what the audit does before anyone touches the budget.',
  },
  {
    question: 'Are Meta ads worth it for a local service business?',
    answer:
      'Sometimes — and the honest answer depends on whether people in your category buy on impulse or on need. Visual, discretionary, considered-but-not-urgent services do well: aesthetics, fitness, remodels, dental, events, restaurants, local retail. Emergency and highly technical services usually do better putting the same dollars into search, where the intent already exists. That call gets made from your numbers in the audit rather than from a channel preference.',
  },
]

export default function MetaAdsSpokePage() {
  return (
    <SpokePage
      path="/get-found/meta-ads"
      schema={{
        headline: 'Meta Ads Management in Orange County: Signal, Creative, Then Spend',
        description:
          'How ORCACLUB runs Facebook and Instagram ads: Pixel plus Conversions API tracking, broad audience strategy, a deliberate creative testing cadence, and reporting in cost per lead rather than platform-reported conversions.',
      }}
      breadcrumbs={[
        { name: 'Home', path: '/' },
        { name: 'Get Found', path: '/get-found' },
        { name: 'Meta Ads', path: '/get-found/meta-ads' },
      ]}
      title={
        <>
          Meta ads where the <span className="gradient-text font-light">creative</span> is the
          targeting
        </>
      }
      answer={
        <>
          <strong>
            ORCACLUB runs Facebook and Instagram ads for Orange County businesses in a fixed order:
            server-side conversion tracking through both the Meta Pixel and the Conversions API
            first, broad audiences second, and a continuous creative testing cadence third — because
            on Meta the ad itself does most of the targeting work.
          </strong>{' '}
          It runs as one channel inside the{' '}
          <Link href="/get-found" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            get-found system
          </Link>
          , so it is only recommended where demand generation beats buying existing search intent.
        </>
      }
      qa={[
        {
          id: 'when-meta-beats-search',
          heading: 'When do Meta ads work better than Google Ads?',
          body: (
            <>
              <p>
                Google Ads capture demand that already exists — someone types &quot;emergency
                plumber Irvine&quot; and you pay to be the answer. Meta{' '}
                <strong>creates demand that wasn&apos;t there</strong>: nobody opens Instagram
                looking for a med spa, but the right ad in front of the right Orange County audience
                still produces bookings.
              </p>
              <p>
                Meta is the stronger channel when your category has far more potential customers
                than active searchers — aesthetics, fitness, remodels, dental, events, restaurants,
                local retail. Anything visual, anything where showing the work sells better than
                describing it, anything with a considered purchase and a long window between
                interest and action.
              </p>
              <p>
                Where Meta loses: urgent, unglamorous, high-intent services. Interrupting a feed to
                sell water-damage restoration is a bad trade when the person who needs it is already
                searching. Most businesses want one channel capturing demand and another creating
                it, which is why the mix gets decided from your numbers, not from preference.
              </p>
            </>
          ),
        },
        {
          id: 'pixel-and-conversions-api',
          heading: 'What are the Meta Pixel and Conversions API, and do I need both?',
          body: (
            <>
              <p>
                Yes, both. The <strong>Pixel</strong> is browser-side — JavaScript on your site
                reporting what visitors do. The <strong>Conversions API</strong> is server-side —
                your server or your platform&apos;s integration sending the same events straight to
                Meta. Run together with a shared event ID so Meta deduplicates them, they cover each
                other&apos;s blind spots.
              </p>
              <p>
                The reason is what browser-side tracking lost. Since Apple&apos;s App Tracking
                Transparency prompt arrived in iOS 14.5, and as browsers shortened cookie lifetimes
                and blocked more scripts, a meaningful share of events simply never reaches Meta.
                That is not only a reporting problem: Meta&apos;s delivery system optimizes toward
                the conversions it can see, so missing signal makes campaigns perform worse and look
                worse simultaneously.
              </p>
              <p>
                Server-side events survive that, and when they carry hashed customer data they
                improve event match quality — the health metric worth watching before you judge any
                campaign.
              </p>
            </>
          ),
        },
        {
          id: 'creative-testing',
          heading: 'How often does Meta ad creative need to be refreshed?',
          body: (
            <>
              <p>
                Continuously, because creative is where the performance lives. Expect a strong ad to
                run for weeks, not quarters. The tell that one is done is mechanical: frequency
                climbing while cost per result rises. If you wait for that before making the next
                thing, you spend a fortnight paying for a tired ad.
              </p>
              <p>
                The cadence that works is a small number of genuinely{' '}
                <strong>distinct concepts</strong> live at once — different hooks, different angles,
                not the same video with a new caption — plus a steady drip of new assets so a
                replacement is always ready. Test one variable at a time; changing creative,
                audience, and budget in the same week produces a result you cannot attribute.
              </p>
              <p>
                Raw material beats production value. Real footage of the work, real staff, real
                before-and-afters, and customer testimonials routinely outperform polished brand
                films, because an ad that looks native to the feed gets watched.
              </p>
            </>
          ),
        },
        {
          id: 'audience-strategy',
          heading: 'How should audiences be targeted on Meta now?',
          body: (
            <>
              <p>
                Broader than instinct suggests. The era of stacking twelve interests to build a
                clever audience is over — Meta&apos;s delivery system finds converters faster than
                manual segmentation once it has conversion signal, and narrow targeting mostly just
                raises what you pay to reach the same people.
              </p>
              <p>
                What still earns its place: <strong>geography</strong>, which for an Orange County
                service business is a hard constraint rather than a preference;{' '}
                <strong>retargeting</strong> layers built from site visitors, video viewers, and
                profile engagers; <strong>customer lists</strong> uploaded as custom audiences, both
                to re-sell and to exclude; and lookalikes seeded from actual buyers rather than all
                traffic.
              </p>
              <p>
                What to avoid is fragmentation. A dozen small ad sets split the budget so thinly
                that none of them accumulate enough conversions to optimize, and they compete
                against each other in the same auction. Fewer, better-funded ad sets learn faster.
              </p>
            </>
          ),
        },
        {
          id: 'budget-and-learning',
          heading: 'How much do I need to spend for Meta ads to work?',
          body: (
            <>
              <p>
                Enough to buy conversion volume, not just clicks. Meta&apos;s delivery system flags
                an ad set as <strong>&quot;learning limited&quot;</strong> when it is not getting
                enough optimization events to leave the learning phase — commonly cited as roughly
                fifty events in a rolling seven days.
                {/* TODO(chance): verify the ~50 events / 7 days threshold against the current Meta Business Help Center wording before publishing */}
              </p>
              <p>
                That gives you the budget floor by arithmetic rather than by feel: your cost per
                conversion multiplied by the events needed weekly. If that number is unreachable,
                the fix is to optimize toward an earlier, more frequent event — a lead instead of a
                closed sale — and treat the later step as the reporting metric.
              </p>
              <p>
                The corollary is concentration. Three ad sets at $10 a day learn nothing; one at $30
                a day learns. Restraint on the number of campaigns matters more at small budgets
                than any targeting decision you make.
              </p>
            </>
          ),
        },
        {
          id: 'management-cost',
          heading: 'How much does Meta ads management cost, and what does the fee cover?',
          body: (
            <>
              <p>
                Two separate numbers, and conflating them is how people end up unable to judge the
                channel. <strong>Ad spend</strong> goes to Meta from your own ad account, at no
                markup and with no pass-through billing.{' '}
                <strong>The management fee</strong> is a flat monthly retainer regardless of spend,
                published on the{' '}
                <Link
                  href="/pricing"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  pricing page
                </Link>{' '}
                rather than quoted as a percentage.
              </p>
              <p>
                Percentage-of-spend pricing is standard in the market and carries a quiet conflict:
                the agency earns more when you spend more, whether or not the spend performs.
                {/* TODO(chance): verify you want to characterize percentage-of-spend pricing this directly */}
              </p>
              <p>
                The fee buys tracking setup and maintenance, campaign builds, the creative testing
                cadence, audience and budget decisions, and the monthly report. What it cannot buy
                is a shortcut past creative: if there is nothing worth showing, no amount of
                management makes the account work.
              </p>
            </>
          ),
        },
        {
          id: 'reporting',
          heading: 'What should a Meta ads report actually show?',
          body: (
            <>
              <p>
                Spend, leads, and cost per lead, trended month over month — and{' '}
                <strong>reconciled against what you actually booked</strong>, not just what Meta
                claims. That reconciliation is the part most reports skip, and on Meta it is the
                part that matters most.
              </p>
              <p>
                Meta reports conversions on its own attribution settings, which by default credit
                view-throughs as well as clicks. That is not dishonest, but it means the platform
                will always count more conversions than your analytics or your calendar does. The
                report shows both numbers side by side and treats the gap as information rather than
                pretending it does not exist.
              </p>
              <p>
                Underneath sit the diagnostics: which creative carried the spend, frequency and
                cost-per-result trends, what was tested, what changed as a result. Because Meta runs
                inside the wider get-found system, it is reported next to search and local so you
                see one pipeline instead of channels each claiming the same customer.
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
            Find out if Meta is your <span className="gradient-text font-light">channel</span> at
            all
          </>
        ),
        sub: 'The get-found audit checks your tracking, reviews any existing account, and answers the harder question first: whether demand generation or search intent is the better place for the same dollars. The Growth retainer then runs whichever channels earn their spot.',
        primary: { label: 'Request the audit', href: '/contact' },
        secondary: { label: 'See what the audit covers', href: '/get-found/audit' },
        note: 'Founder-run · Flat fee, no percentage of spend · Your Business Manager, always',
      }}
    />
  )
}
