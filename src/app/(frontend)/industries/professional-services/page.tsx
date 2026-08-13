import Link from 'next/link'
import { SpokePage } from '@/components/templates/SpokePage'
import { buildMetadata } from '@/lib/seo/meta'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'Websites for Law Firms & Professional Services in Orange County | ORCACLUB',
  description:
    'Website builds and search visibility for law firms, lenders, insurance agencies, and accounting practices in Orange County. Fast, credible sites with real intake automation — from a solo senior operator under NDA.',
  path: '/industries/professional-services',
})

const faqs: Faq[] = [
  {
    question: 'Do you only work with firms in Orange County?',
    answer:
      'No. ORCACLUB is based in Orange County, California, and most clients are local — but every part of an engagement works remotely, and firms anywhere are welcome.',
  },
  {
    question: 'Will you sign an NDA before we talk details?',
    answer:
      'Yes, and it comes first. An NDA is signed before you share anything about your practice, your clients, or your numbers. That is the default process, not a special request.',
  },
  {
    question: 'What does a professional-services website cost?',
    answer:
      'Every build gets a fixed quote after a scoping conversation — no hourly billing, no open-ended invoices. Published price ranges for every offer are on the pricing page.',
  },
  {
    question: 'How long does a build take?',
    answer:
      'Most professional-services sites run two to four weeks from kickoff to launch, depending on page count and intake complexity. The timeline is fixed in the quote before work begins.',
    // TODO(chance): verify the 2–4 week claim holds for typical professional-services scopes.
  },
  {
    question: 'Who actually does the work?',
    answer:
      'One senior operator — the person you talk to is the person who designs, builds, and ships the site. Nothing is outsourced and nothing is handed to a junior team.',
  },
]

export default function ProfessionalServicesPage() {
  return (
    <SpokePage
      path="/industries/professional-services"
      schema={{
        headline: 'Websites for Law Firms and Professional Services in Orange County',
        description:
          'Why professional-services websites underperform, what a modern site should do for a law firm, lender, insurance agency, or accounting practice, and how ORCACLUB builds and maintains them.',
      }}
      breadcrumbs={[
        { name: 'Home', path: '/' },
        { name: 'Professional Services', path: '/industries/professional-services' },
      ]}
      title={
        <>
          Websites for <span className="gradient-text font-light">Professional Services</span>
        </>
      }
      answer={
        <>
          <strong>
            For a law firm, lender, insurance agency, or accounting practice, the website has one
            job: convert the trust you have already earned.
          </strong>{' '}
          Nearly every new client checks your site before they call — after a referral, a search, or
          an AI recommendation. A slow, outdated site quietly loses clients you never knew you had.
          ORCACLUB builds fast, credible sites with real intake automation for professional-services
          firms in Orange County, operated by one senior developer under NDA.
        </>
      }
      qa={[
        {
          id: 'why-sites-underperform',
          heading: 'Why do professional-services websites underperform?',
          body: (
            <>
              <p>
                Most professional-services sites were built once, years ago, and left alone. The
                symptoms are consistent across law, lending, insurance, and accounting:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong>They look dated</strong> — and in a trust business, a site that feels
                  neglected reads as a practice that might be too.
                </li>
                <li>
                  <strong>They load slowly on phones</strong>, where most first visits now happen.
                  Visitors leave before the homepage finishes rendering.
                </li>
                <li>
                  <strong>There is no intake path</strong> — a phone number and a generic contact
                  form, so after-hours inquiries go to voicemail and never come back.
                </li>
                <li>
                  <strong>They are invisible in local search</strong> — thin pages with no local
                  signals, so the firm never appears when someone nearby searches for exactly what
                  it does.
                </li>
              </ul>
              <p>
                None of these are marketing problems. They are operations problems that happen to
                live on a website — which is why a design-only refresh rarely fixes them.
              </p>
            </>
          ),
        },
        {
          id: 'what-a-modern-site-does',
          heading: "What should a firm's website actually do?",
          body: (
            <>
              <p>
                A professional-services site earns its keep in three ways, in order of impact:
              </p>
              <p>
                <strong>Hold the referral.</strong> Referred prospects arrive pre-sold and looking
                for reasons to confirm their decision — clear practice or service pages, credentials,
                and a professional presentation that matches the reputation that sent them. The
                site&apos;s first job is to not lose business you already won.
              </p>
              <p>
                <strong>Capture the inquiry.</strong> Intake forms that ask the right qualifying
                questions, route to the right person, confirm receipt automatically, and connect to
                scheduling — so a 9pm inquiry becomes a booked consultation instead of a voicemail
                someone returns three days later.
              </p>
              <p>
                <strong>Answer real questions.</strong> Pages structured around what prospects
                actually search — fee structures, process, timelines, service areas — written
                plainly. That is what converts visitors, and it is also exactly what search engines
                and AI assistants reward.
              </p>
            </>
          ),
        },
        {
          id: 'how-clients-find-you',
          heading: 'How do clients actually find a firm online?',
          body: (
            <>
              <p>
                Three paths, and they compound: a referral who searches your name to vet you, a
                local search like <strong>&ldquo;estate planning attorney near me&rdquo;</strong>{' '}
                when no referral exists, and — increasingly — an AI assistant asked to recommend a
                firm, which cites sites with clear, well-structured content.
              </p>
              <p>
                Winning all three is the same underlying work: a technically sound site, pages that
                answer real questions, accurate local listings, and structured data engines can
                read. That is the get-found system — it starts with a{' '}
                <Link
                  href="/get-found/audit"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  fixed-price visibility audit
                </Link>{' '}
                that shows exactly where your firm appears today, what is broken, and what it is
                worth fixing.
              </p>
            </>
          ),
        },
        {
          id: 'trust-and-compliance',
          heading: 'What about security, accessibility, and confidentiality?',
          body: (
            <>
              <p>
                Firms handle sensitive information, and their websites should act like it:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong>Encryption everywhere.</strong> SSL on every page, so intake forms and
                  client inquiries transmit over encrypted connections — and visitors see a trusted
                  site, not a browser warning.
                </li>
                <li>
                  <strong>Accessibility by default.</strong> Builds follow WCAG accessibility
                  guidelines — semantic structure, keyboard navigation, readable contrast — which
                  serves every visitor and reduces exposure to accessibility complaints.
                  {/* TODO(chance): verify the exact WCAG level to claim (2.1 AA?) and whether to state it. */}
                </li>
                <li>
                  <strong>NDA before details.</strong> Confidentiality is the first step of the
                  process, not an accommodation — an NDA is signed before you share anything about
                  your practice.
                </li>
                <li>
                  <strong>You own everything.</strong> Domain, hosting accounts, code, and content
                  stay in your name. No agency lock-in holding your web presence hostage.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'how-an-engagement-works',
          heading: 'How does an engagement work?',
          body: (
            <>
              <p>
                You work with one senior operator — the same person on every call, writing every
                line of code, accountable for the result. No account managers, no handoffs.
              </p>
              <p>
                Most firms start with the{' '}
                <Link
                  href="/get-found/audit"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  visibility audit
                </Link>
                : a fixed-price assessment of where your firm shows up, what the current site costs
                you, and a prioritized plan. If the site itself is the problem, a{' '}
                <Link href="/websites" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  website build
                </Link>{' '}
                follows with a fixed quote and a fixed timeline — and ongoing hosting, updates, and
                support are covered by the{' '}
                <Link href="/care" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Care Plan
                </Link>{' '}
                after launch. Full price ranges are published on the{' '}
                <Link href="/pricing" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  pricing page
                </Link>
                .
              </p>
            </>
          ),
        },
      ]}
      faqs={faqs}
      lastUpdated="2026-08-13"
      author={{
        name: 'Chance Noonan',
        role: 'Founder & Operator, ORCACLUB',
        blurb:
          'Technical operations developer in Orange County, California. Builds and runs websites, commerce systems, and search visibility for professional-services firms — personally, under NDA.',
        // TODO(chance): verify byline blurb wording.
      }}
      cta={{
        heading: (
          <>
            See Where Your Firm <span className="gradient-text font-light">Stands</span>
          </>
        ),
        sub: 'Start with a fixed-price visibility audit — where you appear, what the current site costs you, and what to fix first.',
        primary: { label: 'Get a visibility audit', href: '/get-found/audit' },
        secondary: { label: 'Explore website builds', href: '/websites' },
        note: 'NDA-first process | Fixed quotes | One senior operator',
      }}
    />
  )
}
