import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { ArrowRight, Zap, Rocket, CreditCard, Workflow } from "lucide-react"

export const metadata: Metadata = {
  title: 'Technical Solutions for Modern Operations | ORCACLUB',
  description: 'Problem-solution technical services for modern businesses. Headless commerce, rapid website launches, payment integration, and business automation. Launch in days, not months.',
  keywords: [
    'technical solutions',
    'headless shopify',
    'fast website development',
    'stripe integration',
    'business automation',
    'shopify developer',
    'payment processing',
    'workflow automation',
    'rapid development',
    'technical consulting'
  ],
  openGraph: {
    title: 'Technical Solutions for Modern Operations | ORCACLUB',
    description: 'Problem-solution technical services. Launch in days with headless commerce, rapid websites, payments, and automation.',
    url: 'https://orcaclub.pro/solutions',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Technical Solutions for Modern Operations | ORCACLUB',
    description: 'Launch in days with headless commerce, rapid websites, payments, and automation.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/solutions',
  },
}

const solutions = [
  {
    icon: Zap,
    title: "Headless Shopify Commerce",
    description: "Custom headless Shopify integration with React/Next.js. Enterprise performance without theme limitations.",
    timeline: "14-21 days",
    href: "/solutions/headless-shopify-commerce",
    tier: "Enterprise",
    priceRange: "$6K-30K"
  },
  {
    icon: Rocket,
    title: "Fast Website Launch",
    description: "Professional website with headless CMS in 3-5 days. Modern, mobile-responsive, SEO optimized.",
    timeline: "3-5 days",
    href: "/solutions/fast-website-launch",
    tier: "Launch",
    priceRange: "$1K-3K"
  },
  {
    icon: CreditCard,
    title: "Stripe Payment Integration",
    description: "Full Stripe integration with subscriptions, webhooks, and customer portal. Production-ready payment processing.",
    timeline: "7-10 days",
    href: "/solutions/stripe-integration",
    tier: "Scale",
    priceRange: "$3K-5K"
  },
  {
    icon: Workflow,
    title: "Business Automation",
    description: "Custom workflow automation connecting your existing tools. Eliminate manual processes and save time.",
    timeline: "7-10 days",
    href: "/solutions/business-automation",
    tier: "Scale",
    priceRange: "$3K-5K"
  }
]

export default function SolutionsPage() {
  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://orcaclub.pro"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Solutions",
        "item": "https://orcaclub.pro/solutions"
      }
    ]
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <AnimatedBackground />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="text-5xl md:text-7xl font-extralight mb-8 tracking-tight">
              Solutions for Modern <span className="gradient-text font-light">Technical Operations</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed mb-6">
              We solve specific technical problems with proven solutions. No months-long projects. No guesswork. Just clear timelines and predictable results.
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto font-light">
              Each solution is designed to solve a common business problem. Choose your solution, launch in days.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => (
              <ScrollReveal key={solution.href} delay={index * 100}>
                <Link
                  href={solution.href}
                  className="block group"
                >
                  <div className="workspace-card p-8 rounded-2xl h-full hover:scale-[1.02] transition-all duration-500">
                    {/* Icon & Timeline Badge */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20">
                        <solution.icon className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div className="px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/30">
                        <span className="text-sm text-cyan-400 font-light">{solution.timeline}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-2xl font-light text-white mb-4 group-hover:gradient-text transition-all duration-300">
                      {solution.title}
                    </h3>
                    <p className="text-gray-400 font-light leading-relaxed mb-6">
                      {solution.description}
                    </p>

                    {/* Tier & Price */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                      <div>
                        <p className="text-sm text-gray-500 font-light">Tier</p>
                        <p className="text-white font-normal">{solution.tier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-light">Investment</p>
                        <p className="text-white font-normal">{solution.priceRange}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-10 tracking-tight">
              Ready to get <span className="gradient-text font-light">started</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-16 font-light leading-relaxed max-w-2xl mx-auto">
              View our project tiers to see which solution fits your needs and budget.
            </p>
            <Link
              href="/project"
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
            >
              View Project Tiers <ArrowRight size={20} />
            </Link>
            <p className="text-sm text-gray-600 font-light mt-8">
              Clear pricing • Fixed timelines • Proven solutions
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
