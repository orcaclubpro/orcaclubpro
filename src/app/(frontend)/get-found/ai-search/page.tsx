import Link from 'next/link'
import { SpokePage } from '@/components/templates/SpokePage'
import type { StatProps } from '@/components/marketing/Stat'
import { buildMetadata } from '@/lib/seo/meta'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'How to Show Up in ChatGPT | AI Search Visibility | ORCACLUB',
  description:
    'How AI assistants actually source their answers, what plausibly improves your odds of being cited, and what is still genuinely unknown — AI search treated as part of the get-found system, not a separate product.',
  path: '/get-found/ai-search',
  ogType: 'article',
})

const AUTHOR = {
  name: 'Chance Noonan',
  role: 'Founder, ORCACLUB',
  // TODO(chance): verify blurb — this is the solo-operator credibility line on every spoke page
  blurb:
    'I run every ORCACLUB engagement personally — the audits, the builds, and the monthly search work — so the person writing this page is the same person doing the work.',
}

// Stats rule: only figures whose publisher and URL have been verified. AI search is short on
// trustworthy public numbers — most circulating figures are vendor marketing — so this page
// argues from documented mechanics instead.
const stats: StatProps[] = [
  {
    value: '3',
    label:
      'separate crawlers OpenAI documents — GPTBot for model training, OAI-SearchBot for surfacing sites in ChatGPT search, and ChatGPT-User for user-initiated fetches. Blocking the wrong one makes you invisible.',
    source: { name: 'OpenAI developer docs', url: 'https://developers.openai.com/api/docs/bots' },
  },
  // TODO(chance): add a sourced stat on AI-assistant referral or usage share if a first-party
  // one appears. Deliberately empty for now — the widely quoted GEO figures trace back to
  // vendor blog posts, and citing those would undercut the whole argument of this page.
]

const faqs: Faq[] = [
  {
    question: 'Can I pay to appear in ChatGPT answers?',
    answer:
      'Not in the way you can pay for a Google ad today. There is no submission form, no inclusion fee, and no verified vendor relationship that guarantees a citation. Advertising formats inside AI assistants are actively being developed and that will change, but as of this page anyone selling guaranteed placement in AI answers is selling something they do not control.',
  },
  {
    question: 'Does an llms.txt file help?',
    answer:
      'There is no public evidence that major assistants use it. It is a proposed convention — a plain-text file describing your site for language models — and adding one costs almost nothing, but no major AI provider has committed to reading it. Treat it as a cheap bet, not a strategy, and be skeptical of anyone charging for it as a deliverable.',
  },
  {
    question: 'Will AI search kill my organic traffic?',
    answer:
      'It changes the shape of it. Questions that were answered by a click are increasingly answered in the interface, which compresses informational traffic — while the visits that still arrive tend to be further down the funnel. The defensible response is the same either way: be the source the answer is built from, and make sure the pages people do land on are the ones that convert.',
  },
  {
    question: 'What if ChatGPT says something wrong about my business?',
    answer:
      'Trace it back to the source, because assistants are usually repeating something they found — an outdated directory listing, a stale profile, an old page on your own site, a competitor comparison article. Correcting the underlying sources and making the accurate version unambiguous on your own site is the only lever that exists. There is no support ticket for a wrong answer.',
  },
  {
    question: 'How is this different from SEO?',
    answer:
      'Mostly it is not, and that is the honest answer. Crawlability, clear structure, structured data, consistent business information, and being cited by other credible sites serve both. The differences are emphasis: answering questions directly rather than burying the answer, keeping entity information identical everywhere, and measuring by testing prompts instead of checking ranks.',
  },
]

export default function AiSearchSpokePage() {
  return (
    <SpokePage
      path="/get-found/ai-search"
      schema={{
        headline: 'How to Show Up in ChatGPT and AI Search: What Works, What Is Still Unknown',
        description:
          'How AI assistants retrieve and cite sources, which levers plausibly improve the odds of being cited, what remains genuinely unproven, and how AI search visibility is measured.',
      }}
      breadcrumbs={[
        { name: 'Home', path: '/' },
        { name: 'Get Found', path: '/get-found' },
        { name: 'AI Search', path: '/get-found/ai-search' },
      ]}
      title={
        <>
          How do I show up in <span className="gradient-text font-light">ChatGPT</span>?
        </>
      }
      answer={
        <>
          <strong>
            You show up in ChatGPT the way you earn a citation anywhere else: AI assistants build
            answers by retrieving content they can crawl — your own indexed pages, plus what other
            credible sites say about you — so the work is being crawlable and fast, structured
            clearly enough to parse, unambiguous about who you are, and genuinely referenced
            elsewhere.
          </strong>{' '}
          There is no submission form and no shortcut, which is why AI search is a capability inside
          the{' '}
          <Link href="/get-found" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            get-found system
          </Link>{' '}
          rather than a separate product with a separate invoice.
        </>
      }
      qa={[
        {
          id: 'how-ai-assistants-answer',
          heading: 'Where do AI assistants actually get their answers?',
          body: (
            <>
              <p>
                Two places, and the distinction decides everything you can influence. Some answers
                come from <strong>what the model absorbed in training</strong> — a frozen snapshot
                you cannot edit. Most answers about a specific local business come from{' '}
                <strong>live retrieval</strong>: the assistant runs searches, fetches pages, and
                writes an answer from what it just read, with citations.
              </p>
              <p>
                That retrieval layer is ordinary web infrastructure. OpenAI documents a dedicated
                crawler, OAI-SearchBot, whose stated job is surfacing websites in ChatGPT&apos;s
                search features. Google&apos;s AI Overviews are assembled over its own index.
                Perplexity retrieves and cites live pages.
              </p>
              <p>
                The practical implication is unglamorous and freeing: the raw material for AI
                answers is the same crawlable, indexed, well-structured content that wins organic
                rankings. If a page cannot be found and parsed, it cannot be cited, and no amount of
                AI-specific tactics changes that.
              </p>
            </>
          ),
        },
        {
          id: 'what-moves-the-needle',
          heading: 'What actually improves your chances of being cited?',
          body: (
            <>
              <p>
                Four things, in rough order of confidence.{' '}
                <strong>Retrievability</strong> first — crawlable, fast, server-rendered content,
                because a page that needs JavaScript to reveal its text is a page a fetcher may
                never see. <strong>Answer-shaped writing</strong> second: a direct answer stated in
                one clean sentence near a question-shaped heading is trivially quotable, which is
                the structure this page uses on purpose.
              </p>
              <p>
                <strong>Entity clarity</strong> third — the same business name, address, phone, and
                description everywhere, with Organization and LocalBusiness markup saying it in
                machine-readable form, so a model has no competing versions of who you are.{' '}
                <strong>Third-party corroboration</strong> fourth: reviews, directory profiles,
                press, and mentions on sites the assistant already trusts.
              </p>
              <p>
                None of that is exotic. It is the same list a good technical SEO would hand you,
                which is the point — the overlap is nearly total.
              </p>
            </>
          ),
        },
        {
          id: 'whats-unknown',
          heading: 'What is still genuinely unknown about AI search optimization?',
          body: (
            <>
              <p>
                More than the market admits, and pretending otherwise is how people get sold
                packages. <strong>No AI provider publishes ranking documentation</strong> the way
                search engines publish guidelines, so nobody outside those companies knows how
                sources are weighted, how often the selection logic changes, or why one page gets
                cited over an equivalent one.
              </p>
              <p>
                There is also no reliable rank tracking. Answers vary by phrasing, by session, by
                model version, and by whatever the assistant retrieved that minute — so
                &quot;ranking&quot; in the search sense does not exist here. Attribution is thin
                too: a person who asks ChatGPT for a recommendation and then searches your name
                arrives looking like direct traffic.
              </p>
              <p>
                So the honest position is a confidence gradient: high confidence in retrievability
                and entity clarity, moderate confidence in structure and corroboration, and
                explicit uncertainty everywhere else — restated as evidence changes.
              </p>
            </>
          ),
        },
        {
          id: 'structured-data',
          heading: 'Does structured data help with AI search?',
          body: (
            <>
              <p>
                For Google&apos;s systems the case is documented: structured data is how Google
                understands entities and generates rich results, and Google publishes exactly which
                types it supports and how to implement them. That part is not speculative.
              </p>
              <p>
                For large language models specifically, the honest answer is{' '}
                <strong>plausible but unproven</strong>. Nobody outside those labs has shown that a
                JSON-LD block directly increases citation odds. What it demonstrably does is remove
                ambiguity — your services, hours, location, pricing, and identity stated once, in a
                format that cannot be misread by whatever is parsing the page.
              </p>
              <p>
                Which makes it an easy call regardless. Structured data is already table stakes for
                organic search, it costs a developer an afternoon, and the plausible AI upside comes
                free with work you should be doing anyway. That is a very different proposition from
                paying a premium for &quot;AI schema&quot; as a standalone product.
              </p>
            </>
          ),
        },
        {
          id: 'ai-crawlers',
          heading: 'Should I let AI crawlers access my site?',
          body: (
            <>
              <p>
                Decide crawler by crawler, because they do different jobs. OpenAI documents three:
                GPTBot, which gathers content that may improve its foundation models;{' '}
                <strong>OAI-SearchBot, which surfaces sites in ChatGPT&apos;s search features</strong>
                ; and ChatGPT-User, which fetches pages when a user&apos;s request requires it.
              </p>
              <p>
                That distinction matters more than the debate around it. A publisher who objects to
                training on principle can block GPTBot and still be findable. Blanket-blocking
                everything with an AI-sounding user agent — which plenty of sites have done by
                copying a robots.txt snippet — quietly removes you from the search surface you were
                trying to appear in.
              </p>
              <p>
                For most local and service businesses the calculus is simple: you want to be found,
                so let the search-facing crawlers through. If your business sells the content
                itself, the tradeoff is real and worth an actual conversation.
              </p>
            </>
          ),
        },
        {
          id: 'measurement',
          heading: 'How do you measure AI search visibility?',
          body: (
            <>
              <p>
                By testing it directly, because no rank tracker exists.{' '}
                <strong>A fixed panel of prompts</strong> — the questions your customers actually
                ask, phrased the way they would phrase them — run across ChatGPT, Perplexity, and
                Google AI Overviews on a set cadence, recording whether you appear, what is said
                about you, and which sources get cited instead.
              </p>
              <p>
                That produces two useful things: a baseline you can move, and a list of the sites
                currently winning your answers, which is a direct target list for corroboration
                work.
              </p>
              <p>
                Alongside it, referral traffic from assistant domains is worth segmenting in
                analytics — real but under-counted, since the moment someone reads a recommendation
                and searches your name, the visit stops looking like AI traffic. That measurement is
                part of the{' '}
                <Link
                  href="/get-found/audit"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  search visibility audit
                </Link>
                , not a separate engagement.
              </p>
            </>
          ),
        },
        {
          id: 'is-it-a-separate-service',
          heading: 'Is AI search a separate service you should be buying?',
          body: (
            <>
              <p>
                No — and the pricing behavior in this corner of the market is the tell. A wave of
                vendors renamed SEO as GEO or AEO and attached a premium to the same deliverables:
                schema, content structure, entity consistency. The work is real. The separate line
                item is not.
              </p>
              <p>
                At ORCACLUB it is folded into the technical and content work you were already
                paying for. The{' '}
                <Link
                  href="/get-found/audit"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  audit
                </Link>{' '}
                includes testing how assistants describe your business today and tracing wrong or
                missing answers to their cause; the{' '}
                <Link
                  href="/get-found/growth"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Growth retainer
                </Link>{' '}
                keeps the prompt panel running month to month.
              </p>
              <p>
                What you should expect from anyone selling this is a clear account of what is known,
                what is inferred, and what is a guess. If that account is missing, you are buying
                confidence rather than capability.
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
            Find out what AI assistants say about you{' '}
            <span className="gradient-text font-light">right now</span>
          </>
        ),
        sub: 'The get-found audit tests how ChatGPT, Perplexity, and Google AI Overviews answer questions about your business and your category — what they say, what they cite instead of you, and which fixable gaps on your site cause it.',
        primary: { label: 'Request the audit', href: '/contact' },
        secondary: { label: 'See what the audit covers', href: '/get-found/audit' },
        note: 'Included in the audit and the retainer · Never sold as a separate AI package',
      }}
    />
  )
}
