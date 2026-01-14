"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Check, X, Clock, Shield, Zap, ChevronDown, CalendarCheck, Package, FileCheck } from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import { BookingModal } from "@/components/booking-modal"
import { cn } from "@/lib/utils"

interface TierCardProps {
  id: string
  tier: string
  price: string
  timeline: string
  description: string
  highlighted?: boolean
}

function TierCard({ id, tier, price, timeline, description, highlighted = false }: TierCardProps) {
  return (
    <Link
      href={`/packages/${id}`}
      className={cn(
        "relative p-8 rounded-2xl border backdrop-blur-xl transition-all duration-500 hover:scale-105 group block",
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

      <p className="text-sm text-gray-400 font-light text-center mb-6">
        {description}
      </p>

      <div className="flex items-center justify-center gap-2 text-cyan-400 group-hover:gap-4 transition-all duration-300">
        <span className="text-sm font-medium">View Details</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  )
}

interface FeatureRowProps {
  feature: string
  launch: boolean | string
  scale: boolean | string
  enterprise: boolean | string
}

function FeatureRow({ feature, launch, scale, enterprise }: FeatureRowProps) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="text-sm text-white font-light">{value}</span>
    }
    return value ? (
      <Check className="w-5 h-5 text-cyan-400 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-gray-600 mx-auto" />
    )
  }

  return (
    <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
      <td className="py-4 px-4 text-sm text-gray-300 font-light">{feature}</td>
      <td className="py-4 px-4 text-center">{renderValue(launch)}</td>
      <td className="py-4 px-4 text-center bg-cyan-400/5">{renderValue(scale)}</td>
      <td className="py-4 px-4 text-center">{renderValue(enterprise)}</td>
    </tr>
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

export default function PackagesPage() {
  const tiers: TierCardProps[] = [
    {
      id: "launch",
      tier: "LAUNCH",
      price: "$1,000-3,000",
      timeline: "3-5 Day Delivery",
      description: "Perfect for content-focused sites, simple business sites, and MVP launches."
    },
    {
      id: "scale",
      tier: "SCALE",
      price: "$3,000-5,000",
      timeline: "7-10 Day Delivery",
      description: "Growing businesses needing integrations, analytics, and automation.",
      highlighted: true
    },
    {
      id: "enterprise",
      tier: "ENTERPRISE",
      price: "$6,000-30,000",
      timeline: "14-21 Day Delivery",
      description: "Complex commerce, custom APIs, multi-system enterprise workflows."
    }
  ]

  const featureMatrix: FeatureRowProps[] = [
    { feature: "Headless CMS Setup (Payload/Sanity)", launch: true, scale: true, enterprise: true },
    { feature: "Responsive Design", launch: true, scale: true, enterprise: true },
    { feature: "Hosting & Domain Setup", launch: true, scale: true, enterprise: true },
    { feature: "SSL Certificate", launch: true, scale: true, enterprise: true },
    { feature: "SEO Configuration", launch: true, scale: true, enterprise: true },
    { feature: "Brand-Aligned Custom Design", launch: true, scale: true, enterprise: true },
    { feature: "Custom Integrations", launch: false, scale: "2 Integrations", enterprise: "Unlimited" },
    { feature: "Analytics Setup (GA4)", launch: false, scale: true, enterprise: true },
    { feature: "Form Automation", launch: false, scale: true, enterprise: true },
    { feature: "Email Marketing Integration", launch: false, scale: true, enterprise: true },
    { feature: "Shopify Headless Commerce", launch: false, scale: false, enterprise: true },
    { feature: "Custom API Development", launch: false, scale: false, enterprise: true },
    { feature: "Admin Dashboard", launch: false, scale: false, enterprise: true },
    { feature: "Database Architecture", launch: false, scale: false, enterprise: true },
    { feature: "Multi-platform System Sync", launch: false, scale: false, enterprise: true },
  ]

  const maintenanceTiers: MaintenanceTierProps[] = [
    {
      name: "ESSENTIAL CARE",
      price: "$300/month",
      features: [
        "Security Updates",
        "Weekly Backups",
        "Plugin/Dependency Updates",
        "30-min Response Time (Critical)",
        "Up to 1 Hour Changes/Month"
      ]
    },
    {
      name: "GROWTH CARE",
      price: "$600/month",
      features: [
        "Everything in Essential",
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
        "Everything in Growth",
        "Priority Support (1-hour response)",
        "Monthly Strategy Consultation",
        "Up to 6 Hours Changes/Month"
      ]
    }
  ]

  const faqs: FAQItemProps[] = [
    {
      question: "How much does a website cost?",
      answer: "Our web development packages range from $1,000-$30,000 depending on complexity. Launch tier ($1K-3K) covers content-focused sites, Scale tier ($3K-5K) adds integrations and automation, and Enterprise tier ($6K-30K) handles complex commerce and custom systems. Every project includes transparent pricing with no hidden fees."
    },
    {
      question: "How do I know which package is right for me?",
      answer: "Start with our free 30-minute consultation. We'll discuss your goals, timeline, and budget to recommend the perfect tier. Launch is ideal for content-focused sites, Scale for growing businesses with integrations, and Enterprise for complex commerce or multi-system workflows."
    },
    {
      question: "What's included in every package?",
      answer: "All packages include: Free consultation, brand-aligned design, SEO best practices, documentation & training, full account transfers, transparent contracts, and direct developer access. You own everything we build."
    },
    {
      question: "What if my project doesn't fit a package?",
      answer: "We offer custom hourly development at $75/hour for unique requirements, ongoing modifications, or projects that fall outside our standard tiers. We can also create a custom package tailored to your specific needs."
    },
    {
      question: "What happens after launch?",
      answer: "You receive full account transfers, documentation, and training. Your site is 100% yours. We offer optional monthly maintenance packages (Essential, Growth, or Partner Care) starting at $300/month if you want ongoing support, updates, and optimizations."
    },
    {
      question: "How fast can you start?",
      answer: "Development begins within 48 hours of your down payment. We keep our project queue intentionally small to ensure quality and fast delivery. Book your free consultation today to secure your spot."
    },
    {
      question: "Do you offer payment plans?",
      answer: "Yes! We require 30-50% down payment to begin, with the remainder due on completion. For larger Enterprise projects, we can arrange milestone-based payments throughout the project."
    },
    {
      question: "What technologies do you use?",
      answer: "We specialize in modern tech stacks: React, Next.js, Payload CMS, Sanity, Shopify, and more. We'll recommend the best stack for your specific needs during our consultation."
    }
  ]

  // Generate FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  // Service Schema for SEO
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/packages#service",
    "serviceType": "Web Development Services",
    "name": "Web Development Packages",
    "description": "Transparent web development pricing with fixed-price packages. Launch ($1-3K), Scale ($3-5K), and Enterprise ($6-30K) tiers available.",
    "provider": {
      "@type": "Organization",
      "name": "ORCACLUB",
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Web Development Packages",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Launch Package",
            "description": "CMS setup, responsive design, hosting, SSL - perfect for content-focused sites"
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "1000-3000",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Scale Package",
            "description": "Launch + 2 integrations, analytics, automation - for growing businesses"
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "3000-5000",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Enterprise Package",
            "description": "Scale + unlimited integrations, Shopify, custom APIs, admin dashboard"
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "6000-30000",
            "priceCurrency": "USD"
          }
        }
      ]
    }
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://orcaclub.pro" },
      { "@type": "ListItem", "position": 2, "name": "Packages", "item": "https://orcaclub.pro/packages" }
    ]
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <AnimatedBackground />

      {/* SECTION 1: HERO */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/30 mb-6">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-light">Transparent Pricing</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extralight mb-6 tracking-tight">
              Clear Pricing, <span className="gradient-text font-light">No Surprises</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light mb-8 max-w-3xl mx-auto leading-relaxed">
              Fixed-price web development packages designed to get you exactly what you need. Choose your tier, launch in days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="#comparison"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300"
              >
                Compare Packages <ArrowRight className="w-5 h-5" />
              </Link>
              <BookingModal
                triggerText="Free Consultation"
                triggerClassName="px-10 py-5 bg-white/5 border border-white/20 rounded-full text-lg font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              />
            </div>
            <p className="mt-6 text-sm text-gray-500 font-light">
              50+ projects delivered | 3-21 day delivery | No hidden fees
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 2: QUICK TIER CARDS */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Choose Your <span className="gradient-text font-light">Package</span>
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                Three tiers designed to match your business needs and budget
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

      {/* SECTION 3: FEATURE COMPARISON TABLE */}
      <section id="comparison" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Feature <span className="gradient-text font-light">Comparison</span>
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                See exactly what&apos;s included in each package
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <thead>
                  <tr className="border-b border-cyan-400/20">
                    <th className="py-6 px-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-1/3">
                      Feature
                    </th>
                    <th className="py-6 px-4 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">
                      <div className="flex flex-col items-center">
                        <span className="text-white text-lg font-bold">Launch</span>
                        <span className="text-cyan-400 font-light">$1K-3K</span>
                      </div>
                    </th>
                    <th className="py-6 px-4 text-center text-sm font-medium text-gray-400 uppercase tracking-wider bg-cyan-400/5">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-cyan-400 font-bold mb-1">MOST POPULAR</span>
                        <span className="text-white text-lg font-bold">Scale</span>
                        <span className="text-cyan-400 font-light">$3K-5K</span>
                      </div>
                    </th>
                    <th className="py-6 px-4 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">
                      <div className="flex flex-col items-center">
                        <span className="text-white text-lg font-bold">Enterprise</span>
                        <span className="text-cyan-400 font-light">$6K-30K</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureMatrix.map((row, index) => (
                    <FeatureRow key={index} {...row} />
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* Table CTA */}
          <ScrollReveal>
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">Not sure which tier is right for you?</p>
              <BookingModal
                triggerText="Schedule Free Consultation"
                triggerClassName="px-8 py-4 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-base font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 4: TRUST ELEMENTS - TIMELINE GUARANTEES */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Our <span className="gradient-text font-light">Commitment</span>
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                Guaranteed timelines, clear deliverables, transparent process
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: CalendarCheck, title: "TIMELINE GUARANTEED", desc: "We commit to your delivery date. Launch in 3-5 days, Scale in 7-10 days, Enterprise in 14-21 days.", metric: "100%" },
              { icon: FileCheck, title: "CLEAR DELIVERABLES", desc: "No scope creep, no hidden fees. You know exactly what you're getting before we start.", metric: "Defined" },
              { icon: Package, title: "FULL OWNERSHIP", desc: "You own everything. Complete code handoff, documentation, and training included.", metric: "100%" }
            ].map((item, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-light text-cyan-400 mb-2">{item.metric}</div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-400 font-light">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: MAINTENANCE PACKAGES */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Monthly <span className="gradient-text font-light">Maintenance</span>
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
                Save 15% when bundled with any project tier
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 6: FAQ */}
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

      {/* SECTION 7: FINAL CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-extralight mb-8 tracking-tight text-white">
              Ready to Get <span className="gradient-text font-light">Started</span>?
            </h2>
            <p className="text-xl text-gray-400 font-light mb-10 max-w-2xl mx-auto">
              Book your free consultation and let&apos;s discuss which package is right for your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <BookingModal
                triggerText="Schedule Free Consultation"
                triggerClassName="px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300"
              />
              <Link
                href="/contact"
                className="px-10 py-5 bg-white/5 border border-white/20 rounded-full text-lg font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                Contact Us
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 font-light">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400" />
                Free 30-min consultation
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400" />
                No obligation
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400" />
                Start in 48 hours
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
