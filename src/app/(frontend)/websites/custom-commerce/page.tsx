import { MoneyPage } from '@/components/templates/MoneyPage'
import { buildMetadata } from '@/lib/seo/meta'
import { OFFERS } from '@/data/pricing'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'Custom Commerce Development | Portals, Dashboards & Headless Builds | ORCACLUB',
  description: `Custom commerce platforms — client portals, admin dashboards, headless storefronts, Stripe billing, and API-heavy builds. Scoped and quoted per project, ${OFFERS['websites-custom-commerce'].priceDisplay}.`,
  path: '/websites/custom-commerce',
})

const faqs: Faq[] = [
  {
    question: 'What counts as a custom commerce build?',
    answer:
      'Anything where off-the-shelf software stops fitting: client portals with role-based access, admin dashboards over your operations data, headless storefronts, subscription billing systems, B2B ordering with customer-specific pricing, and platforms that tie multiple systems together through APIs. If a theme or a SaaS subscription cannot do it, this is the offer that can.',
  },
  {
    question: 'How does pricing work?',
    answer: `Custom builds run ${OFFERS['websites-custom-commerce'].priceDisplay} and are quoted per project. We scope first — requirements, integrations, architecture — and then give you a fixed quote with milestones. The quote is the price; complexity risk is ours to manage, not yours to absorb in hourly overruns.`,
  },
  {
    question: 'How long does a custom build take?',
    answer: `The typical band is ${OFFERS['websites-custom-commerce'].timeline}, depending on scope. A focused client portal lands at the short end; a multi-system platform with several integrations runs longer. You get a firm timeline with the quote, and progress ships in visible weekly milestones — not a silent months-long black box.`,
  },
  {
    question: 'Who owns the code and intellectual property?',
    answer:
      'You do. On final payment you receive full ownership of all custom code, designs, and documentation, plus complete source access and deployment credentials. No vendor lock-in — you can host anywhere and hire anyone to maintain it.',
  },
  {
    question: 'Can you integrate with the systems we already use?',
    answer:
      'Yes — that is usually the core of the project. CRMs like Salesforce and HubSpot, payment systems, ERPs, accounting software, inventory platforms, and custom internal tools. If it has an API we integrate it, and if it does not, we can build the API layer around it.',
  },
  {
    question: 'What does a Stripe billing integration include?',
    answer:
      'Production-grade payment infrastructure: checkout, subscriptions and recurring billing, a customer self-service portal, and webhook handling with idempotency so events are never processed twice or lost. Failed payments get automatic smart retries and dunning flows, so revenue recovery runs without manual chasing.',
  },
  {
    question: 'What is headless commerce, and when is it worth it?',
    answer:
      'Headless keeps a proven commerce backend — Shopify, most often — and replaces the template storefront with a custom React/Next.js frontend talking to it over the Storefront API. You keep Shopify checkout, payments, and admin, but gain total design freedom and app-like performance. It is worth it when the template ceiling is genuinely costing you conversions or brand differentiation; when it is not, we will tell you.',
  },
  {
    question: 'What happens after launch?',
    answer:
      'Every build ships with documentation, testing, error monitoring, and an extended support window while your team settles in. After that, ongoing maintenance is available — or your own team takes over with full docs and full ownership. The system keeps working either way.',
  },
]

export default function CustomCommercePage() {
  return (
    <MoneyPage
      path="/websites/custom-commerce"
      schema={{
        name: 'Custom Commerce Development',
        serviceType: 'Custom Software Development',
        description:
          'Custom commerce platform development — client portals, admin dashboards, headless storefronts, Stripe billing, custom APIs, and system integrations, architected and quoted per project.',
      }}
      hero={{
        eyebrow: 'Custom Commerce Builds',
        title: (
          <>
            Custom <span className="gradient-text font-light">Commerce</span>, Engineered
          </>
        ),
        sub: 'When templates and SaaS subscriptions stop fitting: client portals, dashboards, headless storefronts, and API-heavy platforms — architected around your operations and quoted fixed, per project.',
        ctaLabel: 'Scope your build',
      }}
      priceKey="websites-custom-commerce"
      deliverablesTitle={
        <>
          What We <span className="gradient-text font-light">Build</span>
        </>
      }
      deliverables={[
        {
          title: 'Client portals',
          description:
            'Secure, role-based portals where your clients see their own projects, documents, invoices, and status — a premium self-service experience that cuts the email back-and-forth.',
        },
        {
          title: 'Admin dashboards',
          description:
            'A command center for your internal operations: real-time metrics, order and inventory views, and the controls your team actually needs in one place.',
        },
        {
          title: 'Headless storefronts',
          description:
            'Custom React/Next.js frontends on the Shopify Storefront API — keep the commerce backend you trust, escape the template ceiling entirely.',
        },
        {
          title: 'Stripe billing infrastructure',
          description:
            'Checkout, subscriptions, customer portal, and webhook-driven billing with idempotency, smart retries, and dunning — payment plumbing built to production standards.',
        },
        {
          title: 'Custom APIs',
          description:
            'REST or GraphQL endpoints with authentication, rate limiting, and full documentation — connecting your systems or exposing your platform to partners.',
        },
        {
          title: 'System integrations',
          description:
            'CRMs, ERPs, inventory, fulfillment, accounting — synced in real time through webhooks and background jobs instead of manual exports.',
        },
        {
          title: 'Database architecture',
          description:
            'Schemas designed for how your business actually operates, indexed and structured to stay fast as data grows.',
        },
        {
          title: 'Automation workflows',
          description:
            'Order processing, onboarding sequences, reporting, notifications — if you can describe the process, it can run without a human pushing buttons.',
        },
      ]}
      process={[
        {
          title: 'Discovery and scoping',
          description:
            'A deep dive into your requirements, existing systems, and integration landscape. This is where the fixed quote comes from — you see the full scope, price, and milestones before committing.',
        },
        {
          title: 'Architecture and design',
          description:
            'Database schema, API structure, authentication, and interface design — the decisions that determine whether the platform is still solid in three years. You approve the plan before build.',
        },
        {
          title: 'Build in weekly milestones',
          description:
            'Development ships in visible increments with working software at each milestone — integrations, testing, and security review included as we go, not crammed in at the end.',
        },
        {
          title: 'Launch, document, support',
          description:
            'Production deployment, monitoring, team training, and complete documentation, followed by an extended support window while the platform beds in.',
        },
      ]}
      faqs={faqs}
      cta={{
        heading: (
          <>
            Outgrown <span className="gradient-text font-light">off-the-shelf</span>?
          </>
        ),
        sub: 'Describe the system your business actually needs. We scope it, quote it fixed, and build it — with you owning every line at the end.',
        primaryLabel: 'Scope your build',
        secondaryLabel: 'See pricing',
        note: 'Fixed quote after scoping · Full code ownership · Extended post-launch support',
      }}
    />
  )
}
