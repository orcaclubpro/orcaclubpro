import Link from 'next/link'
import { SpokePage } from '@/components/templates/SpokePage'
import { buildMetadata } from '@/lib/seo/meta'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'Google Ads Management Orange County | Founder-Run PPC | ORCACLUB',
  description:
    'Google Ads management for Orange County businesses: conversion tracking installed first, tight account structure, budget decisions from real cost-per-lead data, and reporting you can verify.',
  path: '/get-found/google-ads',
  ogType: 'article',
})

const AUTHOR = {
  name: 'Chance Noonan',
  role: 'Founder, ORCACLUB',
  // TODO(chance): verify blurb — this is the solo-operator credibility line on every spoke page
  blurb:
    'I run every ORCACLUB engagement personally — the audits, the builds, and the monthly search work — so the person writing this page is the same person doing the work.',
}

// TODO(chance): add a sourced stat. Deliberately empty: the "$2 in revenue per $1 spent" figure
// that was drafted here comes from Google's own Economic Impact model — a 2009 modeling
// assumption, not a measured advertiser average — so it was cut rather than presented as a
// benchmark. If you want a stat card here, a WordStream/Google Ads benchmark you personally
// trust, cited by name and URL, is the bar.

const faqs: Faq[] = [
  {
    question: 'Do you require a minimum ad spend?',
    answer:
      'No hard minimum, but there is a practical floor: your daily budget needs to buy enough clicks to produce conversion data, and in competitive Orange County service categories clicks are not cheap. If your budget can only buy a handful of clicks a day, I will tell you in the audit whether Google Ads is viable yet or whether that money works harder elsewhere in the get-found system first.',
  },
  {
    question: 'Who owns the Google Ads account?',
    answer:
      'You do — always. The account is created under your email and billing, and I manage it through manager-account access that you can revoke at any time. Your conversion data, search-term history, and audience lists are assets; agencies that run your ads inside their own account are holding those assets hostage.',
  },
  {
    question: 'Should I start with Google Ads or SEO?',
    answer:
      'Usually both, at different intensities. Ads produce leads and search-term data in weeks; SEO compounds over months. Paid data tells you which queries actually convert before you invest months of content in them — then organic rankings gradually reduce how much you need to spend. Running them as one system is the entire point of the get-found retainer.',
  },
  {
    question: 'How fast will I see leads from Google Ads?',
    answer:
      'Clicks start the day campaigns go live; a stable, believable cost per lead takes four to eight weeks of data and iteration. The first weeks are deliberately about learning — pruning wasted search terms, testing ad copy, and letting the bidding system calibrate — so judge the channel on the trend after the first month, not the first invoice.',
  },
  {
    question: 'Do you write the ad copy?',
    answer:
      'Yes — copy, extensions, and the landing-page recommendations that go with them. Because ORCACLUB also builds websites, landing-page fixes actually get implemented rather than stalling in a suggestions document, and the ad-to-page match improves the quality component Google uses to price your clicks.',
  },
]

export default function GoogleAdsSpokePage() {
  return (
    <SpokePage
      path="/get-found/google-ads"
      schema={{
        headline: 'Google Ads Management in Orange County: Tracking First, Then Spend',
        description:
          'How ORCACLUB manages Google Ads month to month: conversion tracking as a prerequisite, tight account structure, budget and bid strategy driven by cost-per-lead data, and honest reporting.',
      }}
      breadcrumbs={[
        { name: 'Home', path: '/' },
        { name: 'Get Found', path: '/get-found' },
        { name: 'Google Ads', path: '/get-found/google-ads' },
      ]}
      title={
        <>
          Google Ads management that starts with{' '}
          <span className="gradient-text font-light">tracking</span>, not spend
        </>
      }
      answer={
        <>
          <strong>
            ORCACLUB manages Google Ads for Orange County businesses in a fixed order: conversion
            tracking installed and verified first, tightly themed campaigns second, and budget
            decisions made from real cost-per-lead data — never from the platform&apos;s automated
            suggestions.
          </strong>{' '}
          It runs as one channel inside the{' '}
          <Link href="/get-found" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            get-found system
          </Link>
          , so paid search data feeds the SEO work and vice versa.
        </>
      }
      qa={[
        {
          id: 'what-management-includes',
          heading: 'What does Google Ads management include month to month?',
          body: (
            <>
              <p>
                Four recurring workstreams. <strong>Search-term hygiene:</strong> reviewing what
                your ads actually matched against and cutting the queries that waste budget —
                the single highest-leverage weekly task in most accounts.{' '}
                <strong>Testing:</strong> ad copy, landing pages, and bid strategy changes run
                deliberately, one variable at a time. <strong>Budget management:</strong> shifting
                spend toward the campaigns producing leads at acceptable cost and away from the
                ones that aren&apos;t. <strong>Reporting:</strong> a monthly summary in cost per
                lead, not impressions.
              </p>
              <p>
                What it deliberately excludes: blindly accepting Google&apos;s
                &quot;recommendations&quot; tab. Those prompts optimize for spend as often as for
                results, and auto-applied recommendations are turned off on day one. Management
                here means a person making decisions from your data — which is the entire
                difference between an account that improves each month and one that drifts.
              </p>
            </>
          ),
        },
        {
          id: 'conversion-tracking-first',
          heading: 'Why does conversion tracking come before any ad spend?',
          body: (
            <>
              <p>
                Because without it, nobody — not you, not me, not Google&apos;s bidding algorithms
                — can tell which clicks became customers. Every optimization decision downstream
                depends on conversion data: which keywords to keep, which ads win, what a lead
                costs, where the budget should move. Spending before tracking works is paying for
                data you&apos;re throwing away.
              </p>
              <p>
                Setup means tracking the actions that represent revenue: form submissions, phone
                calls, and purchases, with enhanced conversions passing hashed first-party data to
                recover what browser privacy changes hide, and Google Analytics linked for the
                full journey. For businesses that close deals offline, offline conversion import
                connects your closed sales back to the click that started them — so bidding
                optimizes toward customers, not just inquiries. This is prerequisite work, done
                and verified before campaigns launch, and it&apos;s the most common thing missing
                from the Orange County accounts I audit.
              </p>
            </>
          ),
        },
        {
          id: 'account-structure',
          heading: 'How should a Google Ads account be structured?',
          body: (
            <>
              <p>
                Simply and tightly. A small number of campaigns split by what actually needs a
                separate budget or location target, ad groups themed narrowly enough that one ad
                can speak directly to every keyword inside them, and a maintained negative-keyword
                list shared across the account. <strong>Brand and non-brand stay separated</strong>{' '}
                — mixing them lets cheap clicks from people already searching your name flatter
                the numbers and hide what acquisition really costs.
              </p>
              <p>
                Structure is also a location decision in Orange County: campaigns target the
                cities you actually serve, with search terms reviewed for out-of-area leakage.
                Where Performance Max or other automated campaign types earn a place, they run
                alongside — never instead of — search campaigns you can inspect, because a
                campaign whose search terms you can&apos;t see is a campaign you can&apos;t fully
                audit. Good structure isn&apos;t clever; it&apos;s legible, so every dollar can be
                traced to a decision.
              </p>
            </>
          ),
        },
        {
          id: 'management-cost',
          heading: 'How much does Google Ads management cost in Orange County?',
          body: (
            <>
              <p>
                The market prices management three ways: a percentage of ad spend (commonly
                10&ndash;20%), a flat monthly fee, or hourly. Percentage pricing carries a quiet
                conflict — the agency earns more when you spend more, whether or not the spend
                performs.
                {/* TODO(chance): verify the 10–20% market framing is how you want to characterize competitors */}
              </p>
              <p>
                ORCACLUB charges a flat retainer regardless of spend, published on the{' '}
                <Link
                  href="/pricing"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  pricing page
                </Link>
                , with ad spend paid directly to Google from your own account — no markup, no
                pass-through. The evaluation that matters isn&apos;t the fee in isolation but the
                total cost per lead: management fee plus ad spend, divided by leads produced. A
                well-run account with a management fee routinely beats a self-managed account
                without one, because the most expensive thing in Google Ads is the budget wasted
                on search terms nobody reviewed. The audit prices your situation before you commit
                to anything.
              </p>
            </>
          ),
        },
        {
          id: 'budget-bid-strategy',
          heading: 'How do budget and bid strategy actually get decided?',
          body: (
            <>
              <p>
                Budget starts from arithmetic, not ambition: what a click costs in your category
                locally, how many clicks it takes to produce a lead, and what a customer is worth.
                That yields the minimum monthly spend at which the channel can prove itself — if
                the math doesn&apos;t clear, I&apos;ll say so before you spend, not after.
              </p>
              <p>
                Bid strategy follows the data the account has earned. New accounts start with
                strategies that maximize learning while conversion volume builds; once the account
                converts consistently, it graduates to target-cost-per-action bidding, where
                Google&apos;s automation genuinely outperforms manual bidding —{' '}
                <strong>but only when it&apos;s optimizing toward accurate conversion data</strong>,
                which is why tracking came first. Targets then get tightened gradually, because
                slashing a target CPA overnight throttles volume. Budget shifts monthly toward
                whatever is producing leads at acceptable cost; nothing is set-and-forget.
              </p>
            </>
          ),
        },
        {
          id: 'retargeting',
          heading: 'Does retargeting work for local businesses?',
          body: (
            <>
              <p>
                Yes — as a supporting layer, not a primary channel. Most visitors don&apos;t
                convert on the first visit, and for considered purchases the gap between first
                visit and decision can run weeks. Retargeting keeps you present in that gap for a
                fraction of search-click prices, across display, YouTube, and search itself, where
                past visitors can be bid differently when they search again.
              </p>
              <p>
                The setup that makes it work is audience quality: segments built from meaningful
                behavior — service pages viewed, forms started, quotes requested — rather than one
                blanket &quot;all visitors&quot; list, with frequency caps so your brand
                doesn&apos;t become wallpaper, and durations matched to your actual sales cycle.
                For a local service business the honest expectation is modest volume at good
                efficiency: retargeting closes people search already brought you. It amplifies a
                working funnel; it cannot rescue a broken one.
              </p>
            </>
          ),
        },
        {
          id: 'reporting',
          heading: 'What should a Google Ads report actually show?',
          body: (
            <>
              <p>
                Three numbers carry the report: <strong>what was spent, what it produced, and
                what each lead cost</strong> — trended against previous months so you can see
                direction, not just a snapshot. Behind those sit the diagnostics: which campaigns
                and search terms drove the leads, what was tested, what changed as a result, and
                what&apos;s planned next month.
              </p>
              <p>
                Just as important is what the report refuses to do: celebrate impressions, clicks,
                or click-through rate as outcomes. Those are diagnostics — useful for explaining
                <em> why</em> cost per lead moved, meaningless as achievements. Everything is
                verifiable in your own account, because the account is yours; any number in the
                report can be checked against the source. And because Google Ads runs inside the
                wider get-found system, the report places paid search next to organic and local
                results, so you see one pipeline instead of channel silos each claiming credit
                for the same customer.
              </p>
            </>
          ),
        },
      ]}
      faqs={faqs}
      lastUpdated="2026-08-13"
      author={AUTHOR}
      cta={{
        heading: (
          <>
            Find out what your clicks are{' '}
            <span className="gradient-text font-light">actually buying</span>
          </>
        ),
        sub: "The get-found audit reviews your existing account — tracking accuracy, wasted spend, structure — or the viability math if you've never run ads. The Growth retainer then manages Google Ads alongside SEO and local visibility as one system.",
        primary: { label: 'Request the audit', href: '/contact' },
        secondary: { label: 'See what the audit covers', href: '/get-found/audit' },
        note: 'Founder-run · Flat fee, no percentage of spend · Your account, always',
      }}
    />
  )
}
