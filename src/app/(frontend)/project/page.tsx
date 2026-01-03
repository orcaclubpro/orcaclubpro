"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowDown, Check, Clock, DollarSign, Zap, Target, Wrench, Package, Headphones, ChevronDown } from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import { BookingModal } from "@/components/booking-modal"
import { cn } from "@/lib/utils"

export const metadata = {
  title: 'Development Packages | ORCACLUB TechOps Studio',
  description: 'Fixed-price development packages for custom integrations, workflow automation, and full stack solutions. Launch ($1K-3K), Scale ($3K-5K), Enterprise ($6K-30K). Fast delivery in 3-21 days with transparent pricing.',
  keywords: [
    'development packages',
    'fixed-price development',
    'techops services',
    'custom integrations',
    'workflow automation',
    'full stack development',
    'web development pricing',
    'software development packages',
    'business automation services',
    'custom software pricing'
  ],
  openGraph: {
    title: 'Development Packages | ORCACLUB TechOps Studio',
    description: 'Fixed-price packages for custom integrations and automation. Launch, Scale, or Enterprise tiers with 3-21 day delivery.',
    url: 'https://orcaclub.pro/project',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Development Packages | ORCACLUB TechOps Studio',
    description: 'Fixed-price development packages. Launch ($1K-3K), Scale ($3K-5K), Enterprise ($6K-30K). Fast delivery.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/project',
  },
}

interface TierCardProps {
  id: string
  tier: string
  price: string
  timeline: string
  deliverables: string[]
  bestFor: string
  highlighted?: boolean
}

function TierCard({ id, tier, price, timeline, deliverables, bestFor, highlighted = false }: TierCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  return (
    <div
      id={id}
      className={cn(
        "relative p-8 rounded-2xl border backdrop-blur-xl transition-all duration-500 hover:scale-105",
        highlighted
          ? "bg-gradient-to-br from-cyan-400/10 to-blue-500/10 border-cyan-400/50 shadow-xl shadow-cyan-400/20"
          : "bg-black/40 border-white/10 hover:border-cyan-400/30"
      )}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-xs font-bold text-black">
          MOST POPULAR
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className={cn(
          "text-2xl font-bold mb-2",
          highlighted ? "gradient-text" : "text-white"
        )}>
          {tier}
        </h3>
        <div className="text-4xl font-extralight text-white mb-2">{price}</div>
        <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm">
          <Clock className="w-4 h-4" />
          {timeline}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {deliverables.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-300 text-sm font-light">{item}</span>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/10 mb-6">
        <p className="text-xs text-gray-400 font-light mb-1">Best for:</p>
        <p className="text-sm text-white font-light">{bestFor}</p>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-3 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-sm font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300"
      >
        Select {tier}
      </button>

      <BookingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  )
}

interface MaintenanceTierProps {
  name: string
  price: string
  features: string[]
  highlighted?: boolean
}

function MaintenanceTier({ name, price, features, highlighted = false }: MaintenanceTierProps) {
  return (
    <div className={cn(
      "p-6 rounded-xl border backdrop-blur-xl transition-all duration-300",
      highlighted
        ? "bg-gradient-to-br from-cyan-400/5 to-blue-500/5 border-cyan-400/30"
        : "bg-black/20 border-white/10 hover:border-cyan-400/20"
    )}>
      <h4 className="text-xl font-bold text-white mb-2">{name}</h4>
      <div className="text-3xl font-extralight text-cyan-400 mb-4">{price}</div>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-300 font-light">
            <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface FAQItemProps {
  question: string
  answer: string
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors">
          {question}
        </span>
        <ChevronDown className={cn(
          "w-5 h-5 text-gray-400 transition-transform duration-300",
          isOpen && "rotate-180"
        )} />
      </button>
      {isOpen && (
        <div className="pb-6 text-gray-300 font-light leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function ProjectPage() {
  const scrollToTiers = () => {
    document.getElementById('tiers')?.scrollIntoView({ behavior: 'smooth' })
  }

  const tiers: TierCardProps[] = [
    {
      id: "launch",
      tier: "LAUNCH",
      price: "$1,000-3,000",
      timeline: "3-5 Day Delivery",
      deliverables: [
        "Headless CMS Setup (Payload/Sanity)",
        "Infrastructure Setup (hosting, domain, SSL)",
        "Mobile Responsive Design",
        "SEO Configuration",
        "Brand-Aligned Custom Design"
      ],
      bestFor: "Simple business sites, content-first sites, MVP launches"
    },
    {
      id: "scale",
      tier: "SCALE",
      price: "$3,000-5,000",
      timeline: "7-10 Day Delivery",
      deliverables: [
        "Everything in Launch",
        "2 Custom Integrations (Stripe, email marketing, CRM)",
        "Advanced Analytics Setup (GA4, tracking)",
        "Form Automation (contact, booking)",
        "Email Marketing Integration"
      ],
      bestFor: "Growing e-commerce, service businesses, marketing automation",
      highlighted: true
    },
    {
      id: "enterprise",
      tier: "ENTERPRISE",
      price: "$6,000-30,000",
      timeline: "14-21 Day Delivery",
      deliverables: [
        "Everything in Scale",
        "Shopify Headless Ecommerce Integration",
        "Custom API Development",
        "Advanced Workflow Automation",
        "Database Architecture",
        "Admin Dashboard",
        "Multi-platform System Sync"
      ],
      bestFor: "Complex integrations, headless commerce, enterprise workflows"
    }
  ]

  const maintenanceTiers: MaintenanceTierProps[] = [
    {
      name: "ESSENTIAL CARE",
      price: "$300/month",
      features: [
        "Security Updates",
        "Weekly Backups",
        "Plugin/Dependency Updates",
        "30-min Response Time (Critical Issues)",
        "Up to 1 Hour Small Changes/Month"
      ]
    },
    {
      name: "GROWTH CARE",
      price: "$600/month",
      features: [
        "Everything Essential",
        "SEO Monitoring",
        "Monthly Analytics Reports",
        "Performance Monitoring",
        "Up to 3 Hours Changes/Month"
      ],
      highlighted: true
    },
    {
      name: "PARTNER CARE",
      price: "$1,200/month",
      features: [
        "Everything Growth",
        "Priority Support (1-hour response)",
        "Monthly Strategy Consultation",
        "Up to 6 Hours Changes/Month"
      ]
    }
  ]

  const faqs: FAQItemProps[] = [
    {
      question: "How do I know which tier is right for me?",
      answer: "Start with our free 30-minute consultation. We'll discuss your goals, timeline, and budget to recommend the perfect tier. Launch is ideal for content-focused sites, Scale for growing businesses with integrations, and Enterprise for complex commerce or multi-system workflows."
    },
    {
      question: "What if my project doesn't fit a package?",
      answer: "No problem! We offer custom hourly development at $75/hour for unique requirements, ongoing modifications, or projects that fall outside our standard tiers. We can also create a custom package tailored to your specific needs."
    },
    {
      question: "What happens after launch?",
      answer: "You receive full account transfers, documentation, and training. Your site is 100% yours. We offer optional monthly maintenance packages (Essential, Growth, or Partner Care) if you want ongoing support, updates, and optimizations."
    },
    {
      question: "How fast can you start?",
      answer: "Development begins within 48 hours of your down payment. We keep our project queue intentionally small to ensure quality and fast delivery. Book your free consultation today to secure your spot."
    },
    {
      question: "What's included in the free consultation?",
      answer: "A 30-minute call where we discuss your business goals, review your requirements, confirm scope fits the selected tier, answer all your questions, and provide a transparent project timeline and contract. Zero obligation."
    }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* SECTION 1: HERO */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="text-5xl md:text-7xl font-extralight mb-6 tracking-tight">
              Launch Your <span className="gradient-text font-light">Technical Operations</span>
              <br />in 3-21 Days
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light mb-8 max-w-3xl mx-auto leading-relaxed">
              Fixed-price development packages for Shopify, headless CMS, and business automation.
              Choose your tier, start in 48 hours.
            </p>
            <button
              onClick={scrollToTiers}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300 magnetic"
            >
              View Packages <ArrowDown className="w-5 h-5" />
            </button>
            <p className="mt-6 text-sm text-gray-500 font-light">
              50+ projects delivered | 3-21 day delivery
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 2: PROJECT TIERS */}
      <section id="tiers" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Choose Your <span className="gradient-text font-light">Package</span>
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                Fixed pricing, transparent timelines, no surprises
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {tiers.map((tier, index) => (
              <ScrollReveal key={tier.id} delay={index * 100}>
                <TierCard {...tier} />
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center p-8 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl">
              <p className="text-sm text-gray-300 font-light leading-relaxed">
                <span className="font-medium text-cyan-400">All packages include:</span> Free consultation, brand-aligned design, SEO best practices, documentation & training, full account transfers, transparent contracts, direct developer access
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight text-center mb-16 tracking-tight text-white">
              How It <span className="gradient-text font-light">Works</span>
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { icon: Package, title: "SELECT TIER", desc: "Choose the package that fits your needs" },
              { icon: Headphones, title: "CONSULTATION", desc: "30-min free call to confirm scope" },
              { icon: DollarSign, title: "DOWN PAYMENT", desc: "Secure your spot (30-50%)" },
              { icon: Zap, title: "RAPID DELIVERY", desc: "Development begins within 48 hours" },
              { icon: Target, title: "LAUNCH", desc: "Go live in 3-21 days with training" }
            ].map((step, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="text-center p-6 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 font-light">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: MONTHLY MAINTENANCE */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Monthly <span className="gradient-text font-light">Maintenance</span> Packages
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                Keep your site secure, fast, and optimized
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {maintenanceTiers.map((tier, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <MaintenanceTier {...tier} />
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center p-6 rounded-xl bg-gradient-to-r from-cyan-400/10 to-blue-500/10 border border-cyan-400/30">
              <p className="text-sm text-cyan-400 font-medium">
                💡 Save 15% when bundled with any project tier
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 5: CUSTOM HOURLY WORK */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center p-10 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
              <Wrench className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-3xl font-extralight text-white mb-4">
                Custom <span className="gradient-text font-light">Hourly Work</span>
              </h3>
              <p className="text-lg text-gray-300 font-light mb-6 max-w-2xl mx-auto">
                Need something outside our packages? We offer custom development at <span className="text-cyan-400 font-medium">$75/hour</span> for one-off features, existing site modifications, and ongoing partnerships.
              </p>
              <BookingModal
                triggerText="Inquire About Hourly Work"
                triggerClassName="px-8 py-3 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-base font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 6: WHY CHOOSE ORCACLUB */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight text-center mb-16 tracking-tight text-white">
              Why Choose <span className="text-white font-bold">ORCA</span><span className="gradient-text font-bold">CLUB</span>
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "SPEED", desc: "3-21 day delivery vs months" },
              { icon: "💰", title: "TRANSPARENT", desc: "Fixed pricing, no surprises" },
              { icon: "🎯", title: "FOCUSED", desc: "Direct developer access" },
              { icon: "🛠️", title: "MODERN TECH", desc: "React, Next.js, Payload, Shopify" },
              { icon: "📦", title: "TAILORED", desc: "Custom solutions for your needs" },
              { icon: "🤝", title: "PARTNERSHIP", desc: "Ongoing support available" }
            ].map((benefit, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-6 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 text-center">
                  <div className="text-4xl mb-3">{benefit.icon}</div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-300 font-light">{benefit.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: CASE STUDIES SNIPPET */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Recent <span className="gradient-text font-light">Projects</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { client: "Tech Startup", tier: "SCALE", timeline: "8 days" },
              { client: "E-commerce Brand", tier: "ENTERPRISE", timeline: "18 days" },
              { client: "Service Business", tier: "LAUNCH", timeline: "4 days" }
            ].map((project, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl">
                  <h4 className="text-lg font-bold text-white mb-2">{project.client}</h4>
                  <p className="text-sm text-gray-400 mb-1">Tier: <span className="text-cyan-400">{project.tier}</span></p>
                  <p className="text-sm text-gray-400">Timeline: <span className="text-cyan-400">{project.timeline}</span></p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-light"
              >
                View Full Portfolio →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 8: FAQ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight text-center mb-16 tracking-tight text-white">
              Frequently Asked <span className="gradient-text font-light">Questions</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <div className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
              {faqs.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 9: FINAL CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-extralight mb-8 tracking-tight text-white">
              Ready to Launch Your <span className="gradient-text font-light">Project</span>?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                onClick={scrollToTiers}
                className="px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300 magnetic"
              >
                Select a Package ↑
              </button>
              <BookingModal
                triggerText="Schedule Consultation"
                triggerClassName="px-10 py-5 bg-white/5 border border-white/20 rounded-full text-lg font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              />
            </div>
            <p className="text-sm text-gray-400 font-light">
              ✓ Free 30-min consultation | No obligation | Start in 48 hours
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
