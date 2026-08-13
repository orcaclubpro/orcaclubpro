import { MoneyPage } from '@/components/templates/MoneyPage'
import { buildMetadata } from '@/lib/seo/meta'
import { OFFERS } from '@/data/pricing'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'Payload CMS Developer | Websites & WordPress Migrations | ORCACLUB',
  description: `Payload CMS development from a studio that runs its own platform on it. Custom content models, admin UIs, and WordPress migrations — ${OFFERS['websites-payload-cms'].priceDisplay}, delivered in ${OFFERS['websites-payload-cms'].timeline}.`,
  path: '/websites/payload-cms',
})

const faqs: Faq[] = [
  {
    question: 'What is Payload CMS and how is it different from WordPress?',
    answer:
      'Payload CMS is a headless, TypeScript-native content management system. It separates content management from presentation: your content lives in a structured database with a clean admin panel, and is delivered by API to a fast Next.js frontend. Unlike WordPress, there is no theme lock-in, no plugin stack to patch, and no exposed admin surface to attack — which is why Payload sites are faster, safer, and far more flexible to design.',
  },
  {
    question: 'Why Payload over Sanity, Contentful, or Strapi?',
    answer:
      'Payload is open source (no licensing fees, no vendor lock-in), self-hosted (you own your data and infrastructure), and TypeScript-native (type safety from database to frontend catches errors before production). Our own platform runs on Payload — we work in it every day, which is a different level of familiarity than an agency that installed it once. That said, if you are already on Sanity, Contentful, or Strapi, we can extend or migrate from those too.',
  },
  {
    question: 'Can you migrate our WordPress site to Payload?',
    answer:
      'Yes — migrations are a core part of this offer. We audit your existing content, design a proper content model, migrate all posts, pages, and media, and set up redirects so your search rankings carry over. Your team gets a cleaner admin than WordPress ever gave them, with training and documentation included.',
  },
  {
    question: 'Will my team be able to edit content without a developer?',
    answer:
      'Yes — that is the point. Every build includes an admin interface tailored to your editors: visual rich-text editing, drafts and live preview, media management with automatic image optimization, and role-based permissions so the right people can edit and publish the right things. Training and documentation are part of the deliverable.',
  },
  {
    question: 'How long does a Payload CMS project take?',
    answer: `The band for this offer is ${OFFERS['websites-payload-cms'].timeline}. A simple marketing site with a straightforward content model can go live in under a week; the full band covers custom content types, WordPress migrations, and integrations. You get a firm timeline with the fixed quote after scoping.`,
  },
  {
    question: 'How much does a Payload CMS website cost?',
    answer: `${OFFERS['websites-payload-cms'].priceDisplay}, quoted fixed after scoping. Where you land in the range depends on the number of content types, whether a migration is involved, and any integrations. No hourly billing — the quote is the price.`,
  },
  {
    question: 'Is Payload secure and scalable?',
    answer:
      'Yes. Self-hosting means your data stays on your infrastructure, and the decoupled architecture keeps the attack surface small — no plugin vulnerabilities, no public admin URLs to probe. Payload ships with built-in authentication and field-level access control, runs on MongoDB or Postgres, and scales horizontally as your content and traffic grow.',
  },
  {
    question: 'Who maintains the site after launch?',
    answer: `You own everything — code, content, and hosting accounts — so any developer can maintain it. If you would rather not think about it, our Care Plan (${OFFERS['care'].priceDisplay}) covers hosting, updates, backups, and small fixes.`,
  },
]

export default function PayloadCmsPage() {
  return (
    <MoneyPage
      path="/websites/payload-cms"
      schema={{
        name: 'Payload CMS Development',
        serviceType: 'CMS Development',
        description:
          'Payload CMS website development and WordPress migrations — custom content models, tailored admin interfaces, and fast Next.js frontends, built by a studio that runs its own platform on Payload.',
      }}
      hero={{
        eyebrow: 'Payload CMS Developer',
        title: (
          <>
            <span className="gradient-text font-light">Payload CMS</span> Development
          </>
        ),
        sub: 'We build websites on Payload CMS — the open-source, TypeScript-native CMS — and migrate teams off WordPress. Our own platform runs on it, so you are hiring a developer who works in Payload every day, not one who installed it once.',
        ctaLabel: 'Get a modern CMS',
      }}
      priceKey="websites-payload-cms"
      deliverablesTitle={
        <>
          What Every Build <span className="gradient-text font-light">Includes</span>
        </>
      }
      deliverables={[
        {
          title: 'Custom content model',
          description:
            'Collections and fields designed around your actual content — services, projects, posts, team, whatever your business publishes — not forced into a blog-shaped mold.',
        },
        {
          title: 'Admin panel your team will use',
          description:
            'Visual editing, drafts with live preview, version history, and role-based permissions. Editors publish confidently without touching code.',
        },
        {
          title: 'Fast Next.js frontend',
          description:
            'Payload and Next.js run co-located in one codebase. Static generation and edge caching deliver sub-second loads that WordPress plugin stacks cannot match.',
        },
        {
          title: 'WordPress / legacy CMS migration',
          description:
            'Content audit, data migration including media, and redirect mapping so your existing search rankings survive the move.',
        },
        {
          title: 'Media library with optimization',
          description:
            'Centralized assets with automatic resizing, responsive images, and CDN delivery built in — no image plugin required.',
        },
        {
          title: 'Technical SEO foundation',
          description:
            'Metadata, structured data, sitemaps, and Core Web Vitals handled at build time. The site is search-ready the day it ships.',
        },
        {
          title: 'Self-hosted, fully owned',
          description:
            'Your data on your infrastructure. MIT-licensed CMS, complete source code, deployment credentials — no vendor lock-in, no license fees.',
        },
        {
          title: 'Training and documentation',
          description:
            'A walkthrough for your editors and written docs for whoever maintains the site — you are never dependent on us to make a change.',
        },
      ]}
      process={[
        {
          title: 'Scope and content model design',
          description:
            'We map your content, integrations, and migration needs, then design the collection structure. You get a fixed quote and a firm timeline before any code is written.',
        },
        {
          title: 'Build',
          description:
            'Collections, admin configuration, and the Next.js frontend come together in one codebase, with progress updates as sections come online.',
        },
        {
          title: 'Migrate and load content',
          description:
            'Existing content moves over — mapped, cleaned, and redirected. New content gets entered through the same admin your team will use going forward.',
        },
        {
          title: 'Launch and train',
          description:
            'Deploy to production, verify redirects and search indexing, and train your editors. Simple sites reach this step in days; migrations within the full band.',
        },
      ]}
      faqs={faqs}
      cta={{
        heading: (
          <>
            Stop fighting your <span className="gradient-text font-light">CMS</span>
          </>
        ),
        sub: 'Get a content management system that is fast for visitors and effortless for editors — built by a developer who runs his own business on it.',
        primaryLabel: 'Start a project',
        secondaryLabel: 'See pricing',
        note: 'Fixed quote after scoping · WordPress migrations included in scope',
      }}
    />
  )
}
