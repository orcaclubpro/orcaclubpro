import { HubPage } from '@/components/templates/HubPage'
import { buildMetadata } from '@/lib/seo/meta'
import { OFFERS } from '@/data/pricing'
import type { Faq } from '@/lib/seo/schema'

// Overall band across the three build offers. Derived so a price change in
// pricing.ts flows through here too — the cheapest floor and dearest ceiling.
const LOW = OFFERS['websites-payload-cms'].priceDisplay.split('–')[0]
const HIGH = OFFERS['websites-shopify'].priceDisplay.split('–')[1]

export const metadata = buildMetadata({
  title: 'Web Design Orange County | Custom Websites Built in Weeks | ORCACLUB',
  description: `Custom website design and development for Orange County businesses. Modern Next.js, Payload CMS, and Shopify builds at a fixed quote — marketing sites from ${LOW}, commerce builds up to ${HIGH}.`,
  path: '/websites',
})

const faqs: Faq[] = [
  {
    question: 'How much does a custom website cost?',
    answer: `Website projects run from ${LOW} to ${HIGH}, depending on what you need. A content-managed marketing site on Payload CMS is ${OFFERS['websites-payload-cms'].priceDisplay} and the fastest way to launch. Shopify storefronts run ${OFFERS['websites-shopify'].priceDisplay}, since a real store means integrations, checkout work, and email automation, not just a theme. Custom commerce builds — client portals, admin dashboards, headless storefronts — run ${OFFERS['websites-custom-commerce'].priceDisplay}. Every project gets a fixed quote after scoping, so the number you agree to is the number you pay.`,
  },
  {
    question: 'How can you deliver in weeks when agencies quote months?',
    answer:
      'Because there are no agency layers. You work directly with the senior developer building your site — no account managers, no handoffs, no committee reviews. Combined with a modern code-first stack (Next.js, TypeScript, Payload CMS) instead of plugin assembly, that removes most of what makes agency timelines stretch to 3–6 months. A marketing site ships in 2–4 weeks; a full commerce build takes one to two months rather than half a year.',
  },
  {
    question: 'Do you handle both design and development?',
    answer:
      'Yes. Design and development happen together, by the same person, which is part of why delivery is fast. Design decisions are made for conversion — clear hierarchy, fast load times, mobile-first layouts — not for portfolio screenshots. If you have existing brand guidelines we build to them; if not, we establish a clean system as part of the project.',
  },
  {
    question: 'What are your websites built on?',
    answer:
      'Marketing and content sites are built on Next.js with Payload CMS — a TypeScript-native, self-hosted content management system — the same stack our own platform runs on. Ecommerce stores run on Shopify. Larger custom builds combine these with Stripe, custom APIs, and whatever systems your business already uses.',
  },
  {
    question: 'Can you rebuild or redesign my existing website?',
    answer:
      'Yes. We audit the current site, migrate your content, and rebuild on the modern stack while preserving your URLs and search equity — redirects, metadata, and structured data are part of the scope, not an afterthought. Most rebuilds come out faster, easier to edit, and better positioned in search than the site they replace.',
  },
  {
    question: 'What happens after launch?',
    answer: `You own the site outright — code, content, and accounts. If you want us to keep running it, the Care Plan (${OFFERS['care'].priceDisplay}) covers hosting, updates, backups, and small fixes. Either way you get training and documentation so your team can manage content without a developer.`,
  },
]

export default function WebsitesHubPage() {
  return (
    <HubPage
      path="/websites"
      schema={{
        name: 'Websites',
        description:
          'Custom website design and development for Orange County businesses — Payload CMS builds, Shopify storefronts, and custom commerce platforms at a fixed quote.',
      }}
      hero={{
        eyebrow: 'Web Design & Development — Orange County',
        title: (
          <>
            Websites Built in <span className="gradient-text font-light">Weeks</span>, Not Quarters
          </>
        ),
        sub: 'Custom websites designed, built, and launched on a modern stack — 2–4 weeks for a marketing site, 1–2 months for a full commerce build. Fixed scope, fixed quote, built by the senior developer you actually talk to.',
      }}
      intro={[
        `Here is what a professionally built website actually costs: ${LOW} to ${HIGH}, depending on what it has to do. A content-managed marketing site runs ${OFFERS['websites-payload-cms'].priceDisplay}; a Shopify storefront with real integrations runs ${OFFERS['websites-shopify'].priceDisplay}; custom commerce platforms run ${OFFERS['websites-custom-commerce'].priceDisplay}. Every project is scoped first and quoted fixed — no hourly meters, no surprise invoices.`,
        'ORCACLUB is a technical operations development studio, not a marketing agency. Every site is built code-first on Next.js and Payload CMS — the same stack our own platform runs on — rather than assembled from page builders and plugins. That is why the sites are fast, why they rank, and why your team can edit everything without calling a developer.',
        'The speed is structural, not rushed. Traditional agencies take 3–6 months because work passes through account managers, designers, developers, and review committees. Here it passes through one senior operator with a fixed scope and weekly written updates. A marketing site goes discovery to launch in 2–4 weeks; a full commerce build takes one to two months.',
        'Design decisions serve conversion, not decoration: clear hierarchy, sub-second loads, mobile-first layouts, and technical SEO — metadata, structured data, Core Web Vitals — baked in from the first commit rather than bolted on after launch.',
      ]}
      cards={[
        {
          title: 'Payload CMS Websites',
          blurb:
            'Content-managed marketing sites on the TypeScript-native, self-hosted CMS — including WordPress migrations. Your team edits everything; the site stays fast.',
          href: '/websites/payload-cms',
          priceKey: 'websites-payload-cms',
        },
        {
          title: 'Shopify Storefronts',
          blurb:
            'Custom theme design, integrations, and email automation for stores that have outgrown a stock template — built by a developer, not a theme installer.',
          href: '/websites/shopify',
          priceKey: 'websites-shopify',
        },
        {
          title: 'Custom Commerce Builds',
          blurb:
            'Client portals, dashboards, headless storefronts, Stripe billing, and API-heavy platforms — architected, scoped, and quoted per project.',
          href: '/websites/custom-commerce',
          priceKey: 'websites-custom-commerce',
        },
      ]}
      faqs={faqs}
      cta={{
        heading: (
          <>
            Ready to build something <span className="gradient-text font-light">fast</span>?
          </>
        ),
        sub: 'Tell us what the site needs to do. You get a fixed scope, a fixed quote, and a launch date before any work starts.',
        primary: { label: 'Start a project', href: '/contact' },
        secondary: { label: 'See pricing', href: '/pricing' },
        note: 'Free consultation · Fixed quotes · Direct access to the developer',
      }}
    />
  )
}
