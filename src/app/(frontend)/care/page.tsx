import { MoneyPage } from '@/components/templates/MoneyPage'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import ScrollReveal from '@/components/layout/scroll-reveal'
import { buildMetadata } from '@/lib/seo/meta'
import type { Faq } from '@/lib/seo/schema'
import { Minus } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Website Care Plan — Hosting, Updates & Support | ORCACLUB',
  description:
    'One monthly plan that keeps your site fast, secure, and current: managed edge hosting, monitoring, backups, security updates, and small-change support with priority response.',
  path: '/care',
})

const faqs: Faq[] = [
  {
    question: 'What exactly does the Care Plan cover?',
    answer:
      'Everything involved in keeping a live site healthy: managed hosting on an edge network, SSL, global CDN, automated backups with rollback, uptime and performance monitoring, proactive security and dependency updates, and small content changes — all with priority response from the operator who built your site.',
  },
  {
    question: 'What counts as a small change?',
    answer:
      'Changes measured in minutes or hours, not days: copy updates, image swaps, adding a testimonial, adjusting a section. New pages, new features, and redesigns are separate projects — scoped and quoted before any work starts, so there are never surprise charges inside the plan.',
    // TODO(chance): define the monthly small-change allowance (hours or request count) before publishing.
  },
  {
    // TODO(chance): decide how the old free-hosting promise transitions for existing clients —
    // the retired /services/hosting-infrastructure page promised "hosting included free with every
    // project, no separate fees ever." This answer is the proposed reframe; existing clients on the
    // old promise need an explicit grandfathering/transition decision before this ships.
    question: "Didn't hosting used to be included with every project?",
    answer:
      'Every project still launches with its infrastructure fully set up — deployment, SSL, and CDN are part of the build, never a separate launch fee. Care is the ongoing plan for everything a one-time build fee was never designed to cover: the monitoring, updates, backups, and hands-on support that keep a site healthy for years after launch.',
  },
  {
    question: 'Can you take over a site someone else built?',
    answer:
      'Yes. Onboarding starts with an audit of your current hosting, DNS, and codebase, then a migration to the managed stack. Most migrations complete within a few days with no downtime, using a staged deployment before DNS cutover.',
    // TODO(chance): verify typical migration turnaround before publishing.
  },
  {
    question: 'What happens if my site goes down?',
    answer:
      'Monitoring detects downtime and performance regressions automatically, and most issues are resolved before anyone emails about them. When you do reach out, the request goes directly to the person who built and runs your site — no ticket queue, no tier-one support script.',
    // TODO(chance): decide whether to commit to a specific response-time window for Care requests.
  },
  {
    question: 'Is there a contract? What happens if I cancel?',
    answer:
      'The plan is month to month. If you cancel, you keep everything — the site, the code, and the accounts are yours, and the handover includes credentials and deployment documentation so any developer can pick it up cleanly.',
    // TODO(chance): confirm month-to-month terms and the handover commitment.
  },
]

/** "Where Care ends" — the honesty section, rendered in the template's flex slot. */
function NotIncluded() {
  const items = [
    {
      title: 'New pages, features, and redesigns',
      description: 'Anything that changes what the site is gets scoped and quoted as its own project.',
    },
    {
      title: 'Content production',
      description: 'Blogging, copywriting campaigns, and photography are not part of the plan.',
    },
    {
      title: 'Search and ads campaigns',
      description: 'Ongoing SEO and paid channels are the Growth Retainer — a separate engagement.',
    },
    {
      title: 'Commerce operations',
      description: 'Inventory, order fulfillment, and merchandising stay with your team.',
    },
    {
      title: 'Third-party bills',
      description: 'Domains and paid services stay registered in your name — you keep direct ownership.',
    },
  ]
  return (
    <>
      <SectionHeader
        title={
          <>
            Where Care <span className="gradient-text font-light">Ends</span>
          </>
        }
        sub="A flat monthly plan only works if the scope is honest. These are the things Care deliberately does not include."
      />
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {items.map((item, index) => (
          <ScrollReveal key={index} delay={index * 75}>
            <div className="flex items-start gap-4 p-6 rounded-xl bg-black/20 border border-white/[0.06] backdrop-blur-xl h-full">
              <Minus className="w-5 h-5 text-gray-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-white mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{item.description}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </>
  )
}

export default function CarePage() {
  return (
    <MoneyPage
      path="/care"
      schema={{
        name: 'Website Care Plan',
        serviceType: 'Managed Website Hosting & Maintenance',
        description:
          'Monthly website care: managed edge hosting, SSL, CDN, automated backups, uptime monitoring, security updates, and small-change support with priority response.',
      }}
      hero={{
        eyebrow: 'Ongoing · Care Plan',
        title: (
          <>
            Your Site, <span className="gradient-text font-light">Looked After</span>
          </>
        ),
        sub: 'Websites decay without attention — dependencies age, content drifts, small problems compound. Care is one monthly plan that keeps your site fast, secure, and current: hosting, monitoring, updates, and small changes, handled by the operator who built it.',
        ctaLabel: 'Start a Care Plan',
      }}
      priceKey="care"
      deliverables={[
        {
          title: 'Managed edge hosting',
          description:
            "Deployed on Vercel's edge network, serving your site from data centers close to every visitor.",
        },
        {
          title: 'Global CDN and caching',
          description:
            'Pages and assets cached at hundreds of edge locations worldwide for consistently fast loads.',
        },
        {
          title: 'SSL, always current',
          description:
            'Certificates provisioned and renewed automatically with modern TLS. No lapses, no warnings.',
        },
        {
          title: 'Automated backups and rollback',
          description:
            'Every deployment is a restorable snapshot. If something breaks, roll back in minutes — not days.',
        },
        {
          title: 'Uptime and performance monitoring',
          description:
            'Continuous automated monitoring catches downtime and regressions — usually before you notice.',
        },
        {
          title: 'Security and dependency updates',
          description:
            'Framework patches and dependency updates applied proactively, not after an incident.',
        },
        {
          title: 'Small-change support',
          description:
            'Copy edits, image swaps, minor layout tweaks — handled inside the plan, no per-change invoices.',
        },
        {
          title: 'Priority response',
          description:
            'A direct line to the person who built your site. Care requests go to the front of the queue.',
        },
      ]}
      process={[
        {
          title: 'Onboard',
          description:
            'An audit of your current hosting, DNS, and access. Sites built elsewhere get migrated onto the managed stack with a staged deployment — no downtime.',
        },
        {
          title: 'Stabilize',
          description:
            'Monitoring, backups, and an update baseline go in place. Anything fragile gets flagged and fixed before it becomes an outage.',
        },
        {
          title: 'Maintain',
          description:
            'Updates and monitoring run continuously. Send small-change requests any time — they get handled directly, without a ticket queue.',
        },
      ]}
      caseStudy={<NotIncluded />}
      faqs={faqs}
      cta={{
        heading: (
          <>
            Stop Babysitting <span className="gradient-text font-light">Your Website</span>
          </>
        ),
        sub: 'One plan, one monthly price, one person responsible for keeping your site healthy.',
        primaryLabel: 'Start a Care Plan',
        note: 'Month to month | You own everything | Direct operator access',
      }}
    />
  )
}
