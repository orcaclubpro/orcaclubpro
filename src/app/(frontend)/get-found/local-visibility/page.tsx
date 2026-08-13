import Link from 'next/link'
import { SpokePage } from '@/components/templates/SpokePage'
import type { StatProps } from '@/components/marketing/Stat'
import { buildMetadata } from '@/lib/seo/meta'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'How Do I Show Up in Google Maps? | Local Visibility Orange County | ORCACLUB',
  description:
    'How Google Maps rankings actually work — relevance, distance, and prominence — and how ORCACLUB runs Google Business Profile, reviews, citations, and service-area pages for Orange County businesses.',
  path: '/get-found/local-visibility',
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
    value: '3',
    label:
      'factors Google says determine local ranking: relevance, distance, and prominence. Everything else is a proxy for one of the three.',
    source: {
      name: 'Google Business Profile Help',
      url: 'https://support.google.com/business/answer/7091',
    },
  },
  {
    value: '97%',
    label:
      'of consumers read reviews for local businesses, in a 2026 survey of 1,002 US adults.',
    source: {
      name: 'BrightLocal Local Consumer Review Survey 2026',
      url: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
    },
  },
  {
    value: '68%',
    label:
      'require a rating of at least four stars before they will consider using a local business.',
    source: {
      name: 'BrightLocal Local Consumer Review Survey 2026',
      url: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
    },
  },
]

const faqs: Faq[] = [
  {
    question: 'Can I rank in Google Maps without a storefront?',
    answer:
      'Yes. Google supports service-area businesses that visit customers rather than receive them — you verify a real address and then hide it, and your profile serves the cities you list. What you cannot do is invent presence: virtual offices, mailbox stores, and a relative\'s address in a city you want to rank in are the fastest route to a suspended profile, and reinstatement is slow and unpleasant.',
  },
  {
    question: 'Do Google Business Profile posts help rankings?',
    answer:
      'Treat them as conversion material rather than a ranking lever. Posts, photos, offers, and answered questions make a profile more convincing to the person already looking at it, and a profile that gets clicked and called sends better engagement signals than one that does not. Google does not document posting frequency as a ranking factor, so anyone selling a weekly-post package as the path to the Maps pack is selling activity, not results.',
  },
  {
    // TODO(chance): confirm the current name and URL of Google's spam-reporting / redressal form
    // before this answer describes the process in any more detail.
    question: 'A competitor is ranking with a fake listing. Can I do anything?',
    answer:
      'Yes — keyword-stuffed names, fake addresses, and lead-gen listings can be reported to Google, and removals do happen, though enforcement is inconsistent and slow. It is worth doing when a spam listing sits directly above you in a pack you would otherwise win, and worth ignoring when it does not. It is never worth copying: the same tactics get real businesses suspended.',
  },
  {
    question: 'How many Orange County cities can I realistically rank in?',
    answer:
      'Fewer than you would like, and the honest number depends on how dense your category is. Distance is a ranking factor you cannot optimize away, so a shop in Costa Mesa will always fight harder for Anaheim searches than a shop in Anaheim does. The workable target is your own city plus the ring of adjacent ones, won properly, rather than a page for every city in the county.',
  },
  {
    // TODO(chance): verify Google's current guidance on call-tracking numbers as the primary
    // phone with the real number listed as additional — this has shifted before.
    question: 'Should I use a call tracking number on my Google Business Profile?',
    answer:
      'You can, carefully. Google Business Profile allows a tracking number as the primary phone as long as your real number is also listed, which preserves the consistency that matters. What breaks things is swapping the tracking number into your website, citations, and directory listings so your business shows a different number in different places — that inconsistency is exactly what you spent the citation work eliminating.',
  },
]

export default function LocalVisibilitySpokePage() {
  return (
    <SpokePage
      path="/get-found/local-visibility"
      schema={{
        headline: 'How to Show Up in Google Maps: Local Visibility for Orange County Businesses',
        description:
          "How Google's local pack ranking works — relevance, distance, prominence — and the Google Business Profile, review, citation, and service-area page work that moves it.",
      }}
      breadcrumbs={[
        { name: 'Home', path: '/' },
        { name: 'Get Found', path: '/get-found' },
        { name: 'Local Visibility', path: '/get-found/local-visibility' },
      ]}
      title={
        <>
          How do I show up in <span className="gradient-text font-light">Google Maps</span>?
        </>
      }
      answer={
        <>
          <strong>
            You show up in Google Maps by ranking in the local pack, and Google states that local
            ranking comes down to three things — relevance, distance, and prominence — which in
            practice means a complete and correctly categorized Google Business Profile, a steady
            flow of real reviews, and consistent business information everywhere else on the web.
          </strong>{' '}
          For Orange County businesses it is usually the fastest-moving part of the{' '}
          <Link href="/get-found" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            get-found system
          </Link>
          , because most competitors have never done the basics properly.
        </>
      }
      qa={[
        {
          id: 'how-maps-ranking-works',
          heading: 'How does Google decide who shows up in the Maps pack?',
          body: (
            <>
              <p>
                Google publishes the framework itself, and it is three factors.{' '}
                <strong>Relevance</strong> is how well your profile matches what was searched.{' '}
                <strong>Distance</strong> is how far you are from the person searching.{' '}
                <strong>Prominence</strong> is how well known your business is, which Google
                describes as being influenced by links, articles, directories, and your review count
                and score.
              </p>
              <p>
                The consequence people miss is that distance makes local rankings a map, not a
                number. You do not have &quot;a ranking&quot; for &quot;dentist near me&quot; — you
                rank differently from one neighborhood to the next, and a search run from Newport
                Beach returns a different pack than the same search run in Fullerton.
              </p>
              <p>
                Distance is the one factor you cannot work on. So the entire job is maximizing
                relevance and prominence hard enough to win in the radius you can realistically
                serve, and being honest about where that radius ends.
              </p>
            </>
          ),
        },
        {
          id: 'google-business-profile',
          heading: 'How do I optimize my Google Business Profile?',
          body: (
            <>
              <p>
                Start with the <strong>primary category</strong>. It is the single
                highest-leverage field on the profile and the one most often wrong — a business
                filed under a broad category loses to a competitor filed under the specific one,
                every time. Secondary categories then cover the rest of what you do without diluting
                the main one.
              </p>
              <p>
                From there it is completeness, which sounds trivial and is not: services listed
                individually with real descriptions, service areas set correctly, hours kept
                accurate including holidays, attributes filled in, photos added regularly rather
                than once at setup, and the website link pointing at the page that matches the
                search rather than reflexively at the homepage.
              </p>
              <p>
                A fully completed profile does two jobs at once. It gives Google more surface to
                match a query against, and it gives the person reading it fewer reasons to tap the
                competitor underneath you.
              </p>
            </>
          ),
        },
        {
          id: 'reviews',
          heading: 'How many Google reviews do I need, and how do I get them?',
          body: (
            <>
              <p>
                The target is not a number, it is your competitors. If the three businesses in the
                Orange County pack you want to join sit at forty reviews and 4.7 stars, that is the
                bar — and being visibly below it costs you clicks even when you rank.
              </p>
              <p>
                Getting them is a process problem, not a marketing one. Ask every customer at the
                moment the work is finished and they are happiest, make it one tap with a direct
                review link, and put the ask into the job-completion or invoice flow so it happens
                without anyone remembering. <strong>Steady beats sudden</strong>: a consistent trickle
                reads as a real business, thirty reviews in a week reads as a purchase.
              </p>
              <p>
                Respond to all of them, including the bad ones, in public and without defensiveness
                — future customers read the response more carefully than the complaint. Never buy
                reviews and never gate them by only asking happy customers; both violate
                Google&apos;s policies.
              </p>
            </>
          ),
        },
        {
          id: 'citations-nap',
          heading: 'Do citations and NAP consistency still matter?',
          body: (
            <>
              <p>
                Less than the citation-building industry implies, more than skeptics claim.{' '}
                <strong>Consistency</strong> is what matters — name, address, and phone number
                identical across your site, your profile, and the directories and data aggregators
                that feed local search. Contradictory information makes Google less certain about
                which business is which, and uncertainty costs prominence.
              </p>
              <p>
                So the work is a cleanup, not a subscription. Audit what exists, correct the
                mismatches, kill the duplicate listings that split your signals, claim the handful of
                directories that actually matter in your industry, then maintain it. Buying five
                hundred citations a month after that is spending on volume nobody reads.
              </p>
              <p>
                The most common cause of a broken profile is mundane: you moved offices, changed
                phone providers, or rebranded, and the old details still live in forty places. That
                is usually the first finding in a local audit.
              </p>
            </>
          ),
        },
        {
          id: 'service-area-pages',
          heading: 'How do I rank in cities I serve but am not located in?',
          body: (
            <>
              <p>
                Partly through your website, because the Maps pack is not the only local result —
                the organic listings underneath it are winnable in cities where your profile
                cannot compete on distance. That is what service-area pages are for.
              </p>
              <p>
                A service-area page earns rankings when it is a <strong>real page</strong>: the
                specific work you have done in that city, photos from those jobs, local reviews,
                travel and coverage details, the questions customers there actually ask. Written
                that way, a page for Huntington Beach is genuinely different from one for Orange.
              </p>
              <p>
                What does not work is the templated version — thirty near-identical pages with the
                city name swapped in. Google has been dismissing doorway pages for years, and they
                make your site look thinner overall. Five substantial city pages beat thirty hollow
                ones, and they are also what an AI assistant can quote when someone asks who serves
                that area.
              </p>
            </>
          ),
        },
        {
          id: 'how-long',
          heading: 'How long does local SEO take to work?',
          body: (
            <>
              <p>
                Faster than most search work, and unevenly. Fixing a wrong primary category,
                completing a half-built profile, or correcting service areas can move a pack
                position within <strong>days to a few weeks</strong>, because the underlying data
                changed and Google re-evaluates quickly.
              </p>
              <p>
                Prominence takes months. Review count and score, links, and mentions accumulate at
                the speed of your actual customer volume, and there is no way to compress that
                without buying signals that put the profile at risk. Expect the first pack movement
                early and the durable position later.
              </p>
              <p>
                The other variable is competition density. In an Orange County category where the
                incumbents have hundreds of reviews and a decade of history, the honest plan starts
                with adjacent, less contested searches while prominence builds. That sequencing gets
                mapped in the audit rather than discovered three months into a retainer.
              </p>
            </>
          ),
        },
        {
          id: 'measurement',
          heading: 'How do you measure local visibility?',
          body: (
            <>
              <p>
                Not with a single rank number, because there is no such thing. Ranking is checked
                from a <strong>grid of points across your service area</strong>, which shows the
                shape of your visibility — where you own the pack, where you fade, and how far the
                edge has moved since last month.
              </p>
              <p>
                Alongside that sit the actions Google reports on the profile itself: calls, direction
                requests, website clicks, and the split between people who searched your name and
                people who found you by category. That last split is the one that matters. Growth in
                discovery searches is the profile earning new customers; growth in direct searches is
                usually your other marketing working.
              </p>
              <p>
                All of it lands in the same monthly report as search and ads, because a customer who
                found you on Maps after seeing an ad is one customer, not two — and the report is
                built to show that rather than let each channel claim them.
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
            See where you actually rank{' '}
            <span className="gradient-text font-light">across the map</span>
          </>
        ),
        sub: 'The get-found audit includes a local visibility check: profile completeness, category accuracy, review position against your real competitors, citation consistency, and grid rankings for your core services. The Growth retainer then runs it monthly alongside search and ads.',
        primary: { label: 'Request the audit', href: '/contact' },
        secondary: { label: 'See what the audit covers', href: '/get-found/audit' },
        note: 'Orange County based · Founder-run · You own the profile and every listing',
      }}
    />
  )
}
