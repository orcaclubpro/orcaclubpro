import Link from 'next/link'
import { SpokePage } from '@/components/templates/SpokePage'
import { buildMetadata } from '@/lib/seo/meta'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'AI Integration for Your Business | Automate, Create, Decide, Assess | ORCACLUB',
  description:
    'How ORCACLUB builds AI into the way your business runs: automating repetitive work, creating content and assets, supporting decisions, and running assessments — connected to the tools you already use.',
  path: '/get-found/ai-integration',
  ogType: 'article',
})

const linkClass = 'text-cyan-400 hover:text-cyan-300 transition-colors'

const faqs: Faq[] = [
  {
    question: 'Is AI integration the same as AI search?',
    answer:
      'No. AI search and AEO are about being found by AI — making your site the source ChatGPT, Perplexity, and Google AI Overviews cite. AI integration is the other direction: building AI into your own operations so it does work inside your business. They can run side by side, but they solve different problems.',
  },
  {
    question: 'Do I need a custom build, or will an off-the-shelf AI tool do?',
    answer:
      'Often an existing tool, set up well, is the right answer, and the first conversation says so. A custom build earns its place when the work depends on your own data, has to move between several of your systems, or needs rules and review steps a general tool does not have.',
  },
  {
    question: 'Does AI replace the people doing the work?',
    answer:
      'That is not the goal. The useful split is letting AI take the repetitive and first-draft work while people keep the judgment calls, the approvals, and anything that goes to a customer. Every system is built with a clear point where a person checks the output before it matters.',
  },
  {
    question: 'Who builds it?',
    answer:
      'ORCACLUB is run by one senior operator. The person who scopes the work is the person who builds the integration and supports it afterwards — no account managers and no junior handoffs.',
  },
]

export default function AiIntegrationSpokePage() {
  return (
    <SpokePage
      path="/get-found/ai-integration"
      schema={{
        headline: 'How ORCACLUB Builds AI Into Your Business',
        description:
          'How ORCACLUB develops AI to automate repetitive work, create content and assets, support decisions, and run assessments, connected to the tools and data a business already uses.',
      }}
      breadcrumbs={[
        { name: 'Home', path: '/' },
        { name: 'Get Found', path: '/get-found' },
        { name: 'AI Integration', path: '/get-found/ai-integration' },
      ]}
      title={
        <>
          How we build <span className="gradient-text font-light">AI into your business</span>
        </>
      }
      answer={
        <>
          <strong>
            AI integration is building AI into the way your business already runs: it automates
            repetitive work, creates first drafts of content and assets, supports decisions with
            your own data, and runs assessments against criteria you set — connected to the tools
            you already use.
          </strong>{' '}
          This page is about putting AI to work inside your business. For being found and cited
          by AI assistants, see{' '}
          <Link href="/get-found/ai-search" className={linkClass}>
            AI search
          </Link>{' '}
          and{' '}
          <Link href="/get-found/aeo" className={linkClass}>
            AEO
          </Link>
          .
        </>
      }
      qa={[
        {
          id: 'automate',
          heading: 'How does AI automate work?',
          body: (
            <>
              <p>
                <strong>
                  By taking the repetitive steps people do by hand and running them as a workflow.
                </strong>{' '}
                Sorting incoming requests, moving data between systems, filling in records,
                drafting replies, and following up on schedule are the usual candidates: tasks that
                follow a pattern but have so far needed a person to read and route them.
              </p>
              <p>
                The work starts with your tools, not with a model. Your CRM, email platform,
                forms, storefront, and internal systems get connected through their APIs and
                webhooks, so data flows automatically instead of being copied by hand. AI is added
                at the steps that need reading or writing, and plain automation handles the rest.
                It is the same integration work behind the{' '}
                <Link href="/websites/custom-commerce" className={linkClass}>
                  multi-system workflows
                </Link>{' '}
                ORCACLUB already builds.
              </p>
            </>
          ),
        },
        {
          id: 'create',
          heading: 'How does AI help create content and assets?',
          body: (
            <>
              <p>
                <strong>
                  By producing first drafts from your own material, in your voice and format, for
                  a person to review and finish.
                </strong>{' '}
                Product descriptions, page drafts, email copy, summaries of long documents, and
                variations of an existing asset are where it helps most: work with a clear shape
                that is slow to do from a blank page.
              </p>
              <p>
                What makes the output usable is the setup around the model. It is given your
                existing content, your rules, and examples of what good looks like, and its drafts
                land where your team already works — in the CMS, a document, or a review queue —
                rather than in a separate chat window someone has to copy from.
              </p>
            </>
          ),
        },
        {
          id: 'decide',
          heading: 'How does AI support decisions?',
          body: (
            <>
              <p>
                <strong>
                  By gathering the information a decision needs and laying out the options, while
                  the decision itself stays with you.
                </strong>{' '}
                A model can pull together records from several systems, summarize what changed,
                flag what looks unusual, and set out the options with the reasons for each, so the
                person deciding starts from a clear picture instead of a pile of tabs.
              </p>
              <p>
                The system is built so you can see where each answer came from. It works from your
                data, shows its sources, and says plainly when it does not have enough to go on.
                Approvals, money, and anything customer-facing stay with a person.
              </p>
            </>
          ),
        },
        {
          id: 'assess',
          heading: 'How does AI run assessments?',
          body: (
            <>
              <p>
                <strong>
                  By checking work against criteria you define, the same way every time, and
                  reporting what passed, what failed, and why.
                </strong>{' '}
                Reviewing submissions against a checklist, scoring incoming leads or requests
                against your rules, and checking documents for missing or inconsistent information
                are typical uses.
              </p>
              <p>
                The criteria are written down first, so the assessment is consistent and can be
                checked. Results come back in a structured form your team can review, sort, and act
                on, with the reasoning attached, so a person can confirm or overrule any call
                quickly.
              </p>
            </>
          ),
        },
        {
          id: 'how-orcaclub-builds-ai',
          heading: 'How does ORCACLUB build an AI integration?',
          body: (
            <>
              <p>
                It starts with the work, not the technology: which tasks take the most time, where
                information gets stuck between systems, and which steps need judgment. From there
                the build is scoped to the few places where AI clearly helps, and plain automation
                covers the rest.
              </p>
              <p>
                Then it is built into your existing tools, tested on real examples from your
                business, and handed over with a clear review step wherever a person needs to stay
                in the loop. Because I build the sites and systems as well as the AI pieces, the
                integration ships as working software rather than a recommendations document.{' '}
                <Link href="/contact" className={linkClass}>
                  Start with a call
                </Link>{' '}
                about the work you want to take off your team&apos;s plate.
              </p>
            </>
          ),
        },
      ]}
      faqs={faqs}
      lastUpdated="2026-11-17"
      cta={{
        heading: (
          <>
            Put AI to work <span className="gradient-text font-light">inside your business</span>
          </>
        ),
        sub: 'Tell us which work takes the most time and which tools it runs through. We will map where AI fits, where plain automation is enough, and what to build first.',
        primary: { label: 'Book a call', href: '/contact' },
        secondary: { label: 'See custom builds', href: '/websites/custom-commerce' },
        note: 'Orange County based. Working with clients everywhere.',
      }}
    />
  )
}
