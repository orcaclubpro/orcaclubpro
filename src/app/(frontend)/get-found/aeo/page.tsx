import Link from 'next/link'
import { SpokePage } from '@/components/templates/SpokePage'
import { buildMetadata } from '@/lib/seo/meta'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'What Is AEO? Answer Engine Optimization Explained | ORCACLUB',
  description:
    'Answer engine optimization (AEO) is writing and structuring pages so search features and AI assistants can lift a direct answer from them. What it is, how it differs from SEO, and how ORCACLUB builds it into every page.',
  path: '/get-found/aeo',
  ogType: 'article',
})

const linkClass = 'text-cyan-400 hover:text-cyan-300 transition-colors'

const faqs: Faq[] = [
  {
    question: 'Is AEO the same thing as GEO?',
    answer:
      'They overlap. AEO is the older, broader term for shaping content so any answer engine — featured snippets, voice assistants, AI Overviews, chat assistants — can lift an answer from it. GEO (generative engine optimization) is usually used for AI assistants specifically. How assistants like ChatGPT find and cite sources is covered on the AI search page; this page covers how the answers on your own pages are shaped.',
  },
  {
    question: 'Do I need to buy AEO as a separate service?',
    answer:
      'No. AEO is a way of writing and structuring pages, not a separate channel. At ORCACLUB it is part of the SEO and content work: every page that gets written or rewritten is built answer-first, with the matching structured data, at no extra line item.',
  },
  {
    question: 'Does FAQ schema still matter?',
    answer:
      'Yes, for clarity rather than for a guaranteed rich result. Structured data makes a page eligible for search features, but Google decides when to show them. What FAQPage markup reliably does is state each question and answer in a format machines cannot misread, which is the point of AEO.',
  },
  {
    question: 'Can AEO reduce clicks to my site?',
    answer:
      'Sometimes. When an engine answers a simple question directly, some people never click. The trade is still worth making: the alternative is a competitor’s answer in that spot, and the people who do click through tend to want the deeper detail or the service behind the answer.',
  },
  {
    question: 'Does AEO work for a local service business?',
    answer:
      'Yes, and often best there. Customers ask concrete questions — what a service costs, how long it takes, whether you serve their area — and a page that answers each one plainly is exactly what answer engines look for. Pair it with consistent local business information and it supports local visibility too.',
  },
]

export default function AeoSpokePage() {
  return (
    <SpokePage
      path="/get-found/aeo"
      schema={{
        headline: 'What Is Answer Engine Optimization (AEO)?',
        description:
          'What answer engine optimization is, how it differs from SEO, what an answer-ready page looks like, which structured data supports it, and how ORCACLUB builds it into every page.',
      }}
      breadcrumbs={[
        { name: 'Home', path: '/' },
        { name: 'Get Found', path: '/get-found' },
        { name: 'AEO', path: '/get-found/aeo' },
      ]}
      title={
        <>
          What is <span className="gradient-text font-light">answer engine optimization</span>{' '}
          (AEO)?
        </>
      }
      answer={
        <>
          <strong>
            Answer engine optimization (AEO) is writing and structuring a page so a search feature
            or AI assistant can lift a direct answer from it: a question-shaped heading, a clear
            answer in the first sentence or two, and structured data that says the same thing in
            machine-readable form.
          </strong>{' '}
          It is a layer of good SEO, not a separate product, and it is how every page in the{' '}
          <Link href="/get-found" className={linkClass}>
            get-found system
          </Link>{' '}
          is built. For how ChatGPT and other assistants find and cite sources, see{' '}
          <Link href="/get-found/ai-search" className={linkClass}>
            AI search
          </Link>
          .
        </>
      }
      qa={[
        {
          id: 'what-is-aeo',
          heading: 'What is an answer engine?',
          body: (
            <>
              <p>
                An answer engine is any system that responds to a question with an answer instead
                of a list of links. Google&apos;s featured snippets and AI Overviews, voice
                assistants, and chat assistants all work this way: they read pages, pick the
                passage that best answers the question, and present it directly.
              </p>
              <p>
                <strong>AEO is making your page the easiest one to pick.</strong> The engine still
                needs the page to be crawlable, indexed, and trusted — that is SEO. AEO is about
                what happens next: whether the answer on the page is stated plainly enough to be
                lifted as-is, or buried in a paragraph the engine has to interpret.
              </p>
            </>
          ),
        },
        {
          id: 'aeo-vs-seo',
          heading: 'How is AEO different from SEO?',
          body: (
            <>
              <p>
                SEO decides whether your page is found and ranked. AEO decides whether, once found,
                it gets quoted. The foundation is shared — technical health, content that matches
                real searches, authority — and without it no amount of answer formatting helps.
              </p>
              <p>
                The difference is emphasis at the page level. SEO asks &quot;which query should
                this page rank for?&quot; AEO asks &quot;which question does this section answer,
                and is the answer in the first sentence?&quot; In practice that means{' '}
                <strong>one question per section, the answer before the explanation</strong>, and
                markup that matches the visible content. It is a writing and structure discipline
                applied on top of the{' '}
                <Link href="/get-found/seo" className={linkClass}>
                  SEO
                </Link>{' '}
                work, not instead of it.
              </p>
            </>
          ),
        },
        {
          id: 'answer-ready-page',
          heading: 'What does an answer-ready page look like?',
          body: (
            <>
              <p>
                This one is a working example. Every section heading is a question a customer
                would actually ask. The first sentence under it answers that question on its own,
                so it still makes sense if it is quoted without the rest of the page. The detail,
                caveats, and examples come after.
              </p>
              <p>
                Around that core: <strong>a short direct answer at the top of the page</strong>{' '}
                that sums up the whole topic, lists and tables where the answer is genuinely a list
                or a comparison, a visible last-updated date, and breadcrumbs that show where the
                page sits on the site. None of it is decoration. Each piece removes a step the
                engine would otherwise have to guess at.
              </p>
            </>
          ),
        },
        {
          id: 'structured-data',
          heading: 'Which structured data supports AEO?',
          body: (
            <>
              <p>
                Structured data is a block of JSON-LD that describes the page in a vocabulary
                search engines publish and support. For answer-first pages the useful types are{' '}
                <strong>FAQPage</strong> for question-and-answer content,{' '}
                <strong>Article</strong> for the page itself, <strong>BreadcrumbList</strong> for
                its place in the site, and <strong>Organization</strong> or{' '}
                <strong>LocalBusiness</strong> for who is behind it.
              </p>
              <p>
                The rule that matters: markup has to describe what is visibly on the page. Schema
                that claims answers the page doesn&apos;t show is a mismatch engines are built to
                ignore. Done honestly, it makes the page eligible for search features and states
                its answers in a form that can&apos;t be misread. It doesn&apos;t guarantee a
                rich result; the engine decides that.
              </p>
            </>
          ),
        },
        {
          id: 'how-orcaclub-does-aeo',
          heading: 'How does ORCACLUB do AEO?',
          body: (
            <>
              <p>
                Page by page, as part of the content and technical work rather than as a separate
                package. It starts with the questions: the{' '}
                <Link href="/get-found/audit" className={linkClass}>
                  audit
                </Link>{' '}
                maps what your customers actually ask at each stage, from what a service is to what
                it costs to who to hire. Those questions become the headings on your service pages
                and supporting articles.
              </p>
              <p>
                Then each page is written answer-first, given the matching structured data, and
                rendered on the server so the text is in the HTML a crawler fetches rather than
                assembled later by JavaScript. Because I build the sites as well as write for them,
                the structure ships in the code instead of sitting in a recommendations document.
                On the{' '}
                <Link href="/get-found/growth" className={linkClass}>
                  Growth retainer
                </Link>
                , new and rewritten pages follow the same pattern month to month.
              </p>
            </>
          ),
        },
        {
          id: 'what-aeo-cannot-do',
          heading: 'What can AEO not promise?',
          body: (
            <>
              <p>
                <strong>No one can guarantee a featured snippet or a citation.</strong> Answer
                engines choose between pages that all answer the question, and they don&apos;t
                publish exactly how. AEO improves your odds by making your answer the clearest
                one; it doesn&apos;t control the engine.
              </p>
              <p>
                It also can&apos;t rescue a page the engine never sees or doesn&apos;t trust. A
                slow, poorly linked page with no authority won&apos;t be quoted however well it is
                written, which is why AEO sits on top of SEO. And for chat assistants specifically
                — which crawlers to allow, what is still unknown, and how to test what they say
                about you — the{' '}
                <Link href="/get-found/ai-search" className={linkClass}>
                  AI search page
                </Link>{' '}
                goes into detail.
              </p>
            </>
          ),
        },
      ]}
      faqs={faqs}
      lastUpdated="2026-11-04"
      cta={{
        heading: (
          <>
            See which of your pages are <span className="gradient-text font-light">answer-ready</span>
          </>
        ),
        sub: 'The get-found audit reviews how your key pages are structured, which customer questions they answer and miss, and what structured data is in place, and ends in a prioritized plan.',
        primary: { label: 'Request the audit', href: '/contact' },
        secondary: { label: 'See what the audit covers', href: '/get-found/audit' },
        note: 'Part of the SEO and content work · Never sold as a separate AEO package',
      }}
    />
  )
}
