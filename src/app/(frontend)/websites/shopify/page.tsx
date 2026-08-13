import { MoneyPage } from '@/components/templates/MoneyPage'
import { buildMetadata } from '@/lib/seo/meta'
import { OFFERS } from '@/data/pricing'
import type { Faq } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'Shopify Designer & Developer in Orange County | ORCACLUB',
  description: `Custom Shopify storefronts with integrations and email automation, built by a senior Shopify developer in Orange County. ${OFFERS['websites-shopify'].priceDisplay}, delivered in ${OFFERS['websites-shopify'].timeline}.`,
  path: '/websites/shopify',
})

const faqs: Faq[] = [
  {
    question: 'What does a custom Shopify storefront cost?',
    answer: `${OFFERS['websites-shopify'].priceDisplay}, quoted fixed after scoping. The range covers everything from a heavily customized theme to a storefront with integrations and full email automation. You know the price before work starts — no hourly billing.`,
  },
  {
    question: 'What can you integrate with Shopify?',
    answer:
      'CRMs like HubSpot and Salesforce, email platforms like Klaviyo and Mailchimp, inventory systems, ERPs, fulfillment services, analytics tools, and custom databases. If it has an API, it can talk to Shopify. Integrations run on webhooks and background processing, so they never slow your storefront down.',
  },
  {
    question: 'Can you set up abandoned cart and post-purchase emails?',
    answer:
      'Yes. We configure automated sequences for abandoned carts, order confirmations, shipping updates, review requests, and post-purchase follow-ups — with messaging and timing matched to your brand. Recovering carts that would otherwise walk away is usually the fastest ROI in the whole project.',
  },
  {
    question: 'Do I need Shopify Plus?',
    answer:
      'Usually not. Custom themes, integrations, and email automation all work on standard Shopify plans. A few advanced features — like deep checkout customization — require Plus, and we will tell you plainly whether your scope actually needs it before you pay for the upgrade.',
  },
  {
    question: 'Custom theme or headless — which do I need?',
    answer:
      'For most stores, a custom theme on standard Shopify is the right call: full design control, fast delivery, and your team keeps the familiar Shopify admin. Headless builds — a custom React storefront on the Shopify Storefront API — make sense when you need total design freedom or app-like performance. Those fall under our custom commerce work and are scoped separately.',
  },
  {
    question: 'How long does a Shopify project take?',
    answer: `${OFFERS['websites-shopify'].timeline} for most storefronts, from kickoff to launch. Discovery and design come first, then the build with regular updates, then testing and launch with training for your team.`,
  },
  {
    question: 'What happens if an integration breaks after launch?',
    answer:
      'Every integration ships with error handling and monitoring, so failures alert us instead of silently dropping orders. You get documentation for everything, and ongoing maintenance is available if you want Shopify platform changes and third-party API updates handled for you.',
  },
  {
    question: 'Who am I actually working with?',
    answer:
      'The developer building your store. No account managers, no outsourced dev team — you talk directly to the person writing the code, which is why questions get answered quickly and the project stays on its schedule.',
  },
]

export default function ShopifyPage() {
  return (
    <MoneyPage
      path="/websites/shopify"
      schema={{
        name: 'Shopify Design & Development',
        serviceType: 'Ecommerce Development',
        description:
          'Custom Shopify storefront design and development in Orange County — theme builds, API integrations, webhook automation, and email flows from a senior Shopify developer.',
      }}
      hero={{
        eyebrow: 'Shopify Designer & Developer — Orange County',
        title: (
          <>
            <span className="gradient-text font-light">Shopify</span> Storefronts, Built Properly
          </>
        ),
        sub: 'Custom Shopify design and development for stores that have outgrown a stock template — themes, integrations, and automation built by a senior developer you work with directly.',
        ctaLabel: 'Start your store',
      }}
      priceKey="websites-shopify"
      deliverables={[
        {
          title: 'Custom theme design and build',
          description:
            'A storefront designed for your brand and built for conversion — from scratch or as a deep rework of your existing theme. Pixel-perfect, mobile-first, fast.',
        },
        {
          title: 'Store architecture and setup',
          description:
            'Products, collections, navigation, and checkout configured properly — the structural decisions that make a store easy to shop and easy to run.',
        },
        {
          title: 'Business tool integrations',
          description:
            'Shopify connected to your CRM, email platform, inventory, or fulfillment systems via API — order data flows automatically instead of being copied by hand.',
        },
        {
          title: 'Email automation',
          description:
            'Abandoned cart recovery, order confirmations, shipping updates, and post-purchase follow-ups — configured, branded, and running before launch.',
        },
        {
          title: 'Webhooks and real-time sync',
          description:
            'Orders, inventory, and customer events pushed to your other systems the moment they happen — asynchronously, so the storefront never slows down.',
        },
        {
          title: 'Analytics and tracking',
          description:
            'Sales and conversion tracking set up correctly, so you can see what is working without guessing.',
        },
        {
          title: 'Deep Shopify expertise',
          description:
            'Storefront API, Admin API, Liquid, custom checkouts, multi-currency, wholesale/B2B, and subscription commerce — the platform depth to solve problems a theme installer cannot.',
        },
        {
          title: 'Training and documentation',
          description:
            'A launch walkthrough for your team plus written docs, so day-to-day store management stays in your hands.',
        },
      ]}
      process={[
        {
          title: 'Discovery',
          description:
            'We dig into your products, your customers, and what the store needs to do — then recommend theme, integration, and automation scope with a fixed quote.',
        },
        {
          title: 'Design',
          description:
            'Storefront design built around your brand and your conversion path. You approve the direction before build starts.',
        },
        {
          title: 'Build and integrate',
          description:
            'Theme development, integrations, webhooks, and email flows come together with regular updates — you always know where the project stands.',
        },
        {
          title: 'Launch and train',
          description:
            'Deploy, test end-to-end order flows, and train your team. You launch with documentation, not dependence.',
        },
      ]}
      faqs={faqs}
      cta={{
        heading: (
          <>
            Ready to outgrow your <span className="gradient-text font-light">template</span>?
          </>
        ),
        sub: 'Tell us about your store. You get a fixed quote, a firm timeline, and a storefront that works as hard as you do.',
        primaryLabel: 'Start your store',
        secondaryLabel: 'See pricing',
        note: 'Fixed quote after scoping · Works on standard Shopify plans',
      }}
    />
  )
}
