"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Check, X } from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import PackagesSideNav from "@/components/sections/PackagesSideNav"

// ─── Data ────────────────────────────────────────────────────────────────────

const tiers = [
  {
    id: "launch",
    label: "01",
    name: "Launch",
    price: "$1,000 – $3,000",
    timeline: "3–5 day delivery",
    description: "Content-focused sites, simple business sites, and MVP launches. Everything you need to go live fast.",
    href: "/packages/launch",
  },
  {
    id: "scale",
    label: "02",
    name: "Scale",
    price: "$3,000 – $5,000",
    timeline: "7–10 day delivery",
    description: "Growing businesses needing custom integrations, analytics, and workflow automation.",
    href: "/packages/scale",
    featured: true,
  },
  {
    id: "enterprise",
    label: "03",
    name: "Enterprise",
    price: "$6,000 – $30,000",
    timeline: "14–21 day delivery",
    description: "Complex commerce, custom APIs, admin dashboards, and multi-system enterprise workflows.",
    href: "/packages/enterprise",
  },
]

const featureMatrix = [
  { feature: "Headless CMS Setup",           launch: true,            scale: true,            enterprise: true },
  { feature: "Responsive Design",             launch: true,            scale: true,            enterprise: true },
  { feature: "Hosting & Domain Setup",        launch: true,            scale: true,            enterprise: true },
  { feature: "SSL Certificate",               launch: true,            scale: true,            enterprise: true },
  { feature: "SEO Configuration",             launch: true,            scale: true,            enterprise: true },
  { feature: "Brand-Aligned Custom Design",   launch: true,            scale: true,            enterprise: true },
  { feature: "Custom Integrations",           launch: false,           scale: "2 integrations", enterprise: "Unlimited" },
  { feature: "Analytics Setup (GA4)",         launch: false,           scale: true,            enterprise: true },
  { feature: "Form Automation",               launch: false,           scale: true,            enterprise: true },
  { feature: "Email Marketing Integration",   launch: false,           scale: true,            enterprise: true },
  { feature: "Shopify Headless Commerce",     launch: false,           scale: false,           enterprise: true },
  { feature: "Custom API Development",        launch: false,           scale: false,           enterprise: true },
  { feature: "Admin Dashboard",               launch: false,           scale: false,           enterprise: true },
  { feature: "Database Architecture",         launch: false,           scale: false,           enterprise: true },
  { feature: "Multi-platform System Sync",    launch: false,           scale: false,           enterprise: true },
]

const maintenancePlans = [
  {
    name: "Essential Care",
    price: "$500 / mo",
    hours: "10 hrs / mo",
    features: [
      "Security updates",
      "Weekly backups",
      "Dependency updates",
      "Bug fixes & minor changes",
    ],
  },
  {
    name: "Growth Care",
    price: "$1,000 – $2,000 / mo",
    hours: "20–30 hrs / mo",
    features: [
      "Everything in Essential",
      "SEO blog content",
      "Active SEO research",
      "Bug fixes & optimizations",
    ],
    featured: true,
  },
  {
    name: "Enterprise Care",
    price: "$3,000 / mo",
    hours: "40+ hrs / mo",
    features: [
      "Everything in Growth",
      "Marketing advisory",
      "Analytics services",
      "SEO & click generation",
    ],
  },
]

const faqs = [
  {
    question: "How do I know which package is right for me?",
    answer: "Start with a free 30-minute consultation. We'll discuss your goals, timeline, and budget to recommend the right tier. Launch is ideal for content-focused sites, Scale for growing businesses with integrations, and Enterprise for complex commerce or multi-system workflows.",
  },
  {
    question: "What's included in every package?",
    answer: "All packages include: a free consultation, brand-aligned design, SEO best practices, documentation and training, full account and code transfer, transparent contracts, and direct developer access. You own everything we build.",
  },
  {
    question: "What if my project doesn't fit a package?",
    answer: "We offer custom hourly development for unique requirements, ongoing modifications, or projects that fall outside standard tiers. We can also create a custom package tailored to your specific needs.",
  },
  {
    question: "How fast can you start?",
    answer: "Development begins within 48 hours of your deposit. We keep our project queue intentionally small to ensure quality and fast delivery.",
  },
  {
    question: "Do you offer payment plans?",
    answer: "Yes. We require 30–50% down to begin, with the remainder due on completion. For larger Enterprise projects, milestone-based payments can be arranged.",
  },
  {
    question: "What happens after launch?",
    answer: "You receive full account transfers, documentation, and training. The site is 100% yours. Monthly maintenance packages are available if you want ongoing support, SEO, or advisory.",
  },
  {
    question: "What technologies do you use?",
    answer: "We specialize in modern stacks: React, Next.js, Payload CMS, Sanity, Shopify, and more. We'll recommend the best fit for your specific needs during the consultation.",
  },
  {
    question: "Are retainer discounts available?",
    answer: "Yes — 5% off on 3-month commitments, 10% off on 6-month commitments, and 15% off on 12-month commitments for all maintenance plans.",
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-start justify-between text-left gap-6 group"
      >
        <span className="text-lg font-light text-white/70 group-hover:text-white transition-colors duration-200 leading-snug">
          {question}
        </span>
        <span className={`text-white/25 text-lg shrink-0 mt-0.5 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {isOpen && (
        <p className="pb-6 text-gray-500 font-light leading-relaxed text-base">
          {answer}
        </p>
      )}
    </div>
  )
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-white/60 font-light">{value}</span>
  }
  return value
    ? <Check className="w-4 h-4 text-[#67e8f9]/60 mx-auto" />
    : <X className="w-4 h-4 text-white/10 mx-auto" />
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-black relative">
      <AnimatedBackground />

      {/* Hero */}
      <section className="relative z-10 pt-52 pb-28 px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="text-xs tracking-[0.35em] uppercase text-white/30 mb-8 font-light">
              Pricing
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-6xl md:text-7xl font-extralight text-white mb-7 tracking-tight">
              Transparent pricing
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-gray-400 font-light max-w-xl leading-relaxed text-lg md:text-xl">
              Three fixed-price tiers — Launch, Scale, and Enterprise. No hidden fees, no hourly surprises. You know exactly what you&apos;re getting before we start.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Sidebar + content */}
      <section className="relative z-10 px-8 pb-44">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-16 xl:gap-28">

            {/* Sticky sidebar */}
            <div className="w-44 xl:w-52 shrink-0">
              <PackagesSideNav />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-w-0 space-y-36">

              {/* ── Packages ── */}
              <div id="section-packages" className="scroll-mt-[100px]">
                <div className="sticky top-[96px] z-20 pt-8 backdrop-blur-2xl">
                  <h2 className="text-4xl md:text-5xl font-extralight text-white mb-2 tracking-tight">
                    Packages
                  </h2>
                  <p className="text-lg font-light text-white/35 mb-7">
                    Three tiers · fixed-price · full ownership at delivery
                  </p>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="h-10" />
                </div>

                <div className="space-y-5">
                  {tiers.map((tier, i) => (
                    <ScrollReveal key={tier.id} delay={i * 60}>
                      <Link
                        href={tier.href}
                        className={`group flex items-start gap-8 p-8 rounded-xl border transition-all duration-300 hover:border-white/[0.12] ${
                          tier.featured
                            ? "border-[#67e8f9]/[0.15] bg-[#67e8f9]/[0.02]"
                            : "border-white/[0.06] bg-white/[0.01]"
                        }`}
                      >
                        <span className="text-[10px] tracking-[0.35em] uppercase text-white/20 font-light pt-1.5 shrink-0 w-6">
                          {tier.label}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-4 mb-3">
                            <h3 className="text-3xl font-extralight text-white">
                              {tier.name}
                            </h3>
                            {tier.featured && (
                              <span className="text-xs tracking-[0.25em] uppercase text-[#67e8f9]/50 font-light">
                                Most common
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 font-light text-lg leading-relaxed max-w-md">
                            {tier.description}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-white font-light text-xl mb-1">{tier.price}</p>
                          <p className="text-white/30 font-light text-base">{tier.timeline}</p>
                        </div>

                        <div className="shrink-0 self-center">
                          <ArrowRight
                            size={16}
                            className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200"
                          />
                        </div>
                      </Link>
                    </ScrollReveal>
                  ))}
                </div>

                <ScrollReveal delay={240}>
                  <p className="mt-6 text-sm text-white/18 font-light tracking-wide leading-relaxed">
                    All packages include: free consultation, brand-aligned design, SEO configuration, documentation, full code and account transfer.
                  </p>
                </ScrollReveal>
              </div>

              {/* ── What's Included ── */}
              <div id="section-comparison" className="scroll-mt-[100px]">
                <div className="sticky top-[96px] z-20 pt-8 backdrop-blur-2xl">
                  <h2 className="text-4xl md:text-5xl font-extralight text-white mb-2 tracking-tight">
                    What&apos;s Included
                  </h2>
                  <p className="text-lg font-light text-white/35 mb-7">
                    Full feature breakdown across all three tiers
                  </p>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="h-10" />
                </div>

                <ScrollReveal>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="py-5 px-6 text-left text-xs tracking-[0.25em] uppercase text-white/25 font-light w-1/2">
                            Feature
                          </th>
                          <th className="py-5 px-4 text-center text-xs tracking-[0.25em] uppercase text-white/25 font-light">
                            Launch
                          </th>
                          <th className="py-5 px-4 text-center text-[10px] tracking-[0.35em] uppercase text-[#67e8f9]/40 font-light">
                            Scale
                          </th>
                          <th className="py-5 px-4 text-center text-xs tracking-[0.25em] uppercase text-white/25 font-light">
                            Enterprise
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {featureMatrix.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors duration-150"
                          >
                            <td className="py-4 px-6 text-base text-gray-400 font-light">{row.feature}</td>
                            <td className="py-4 px-4 text-center"><FeatureValue value={row.launch} /></td>
                            <td className="py-4 px-4 text-center"><FeatureValue value={row.scale} /></td>
                            <td className="py-4 px-4 text-center"><FeatureValue value={row.enterprise} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollReveal>
              </div>

              {/* ── Maintenance ── */}
              <div id="section-maintenance" className="scroll-mt-[100px]">
                <div className="sticky top-[96px] z-20 pt-8 backdrop-blur-2xl">
                  <h2 className="text-4xl md:text-5xl font-extralight text-white mb-2 tracking-tight">
                    Maintenance
                  </h2>
                  <p className="text-lg font-light text-white/35 mb-7">
                    Monthly retainers for ongoing support, security, and growth
                  </p>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="h-10" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.04] rounded-xl overflow-hidden mb-8">
                  {maintenancePlans.map((plan, i) => (
                    <ScrollReveal key={plan.name} delay={i * 60}>
                      <div className={`bg-black p-8 h-full flex flex-col gap-5 ${plan.featured ? "bg-[#67e8f9]/[0.02]" : ""}`}>
                        <div>
                          <p className="text-xs tracking-[0.25em] uppercase text-white/20 font-light mb-3">
                            {plan.hours}
                          </p>
                          <p className="text-white font-light text-2xl mb-1">{plan.name}</p>
                          <p className="text-[#67e8f9]/60 font-light text-lg">{plan.price}</p>
                        </div>
                        <ul className="space-y-2.5 mt-auto">
                          {plan.features.map((feature, j) => (
                            <li key={j} className="flex items-start gap-3">
                              <div className="mt-[7px] w-[3px] h-[3px] rounded-full bg-[#67e8f9]/40 shrink-0" />
                              <span className="text-base text-gray-500 font-light">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                {/* Retainer discounts */}
                <ScrollReveal delay={200}>
                  <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                      <p className="text-xs tracking-[0.25em] uppercase text-white/25 font-light">
                        Retainer discounts
                      </p>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
                      {[
                        { term: "3 months", discount: "5% off",  sub: "Quarterly" },
                        { term: "6 months", discount: "10% off", sub: "Semi-annual" },
                        { term: "12 months", discount: "15% off", sub: "Annual" },
                      ].map((row) => (
                        <div key={row.term} className="px-6 py-5 text-center hover:bg-white/[0.02] transition-colors duration-200">
                          <p className="text-2xl font-light text-[#67e8f9]/60 mb-1">{row.discount}</p>
                          <p className="text-base text-white/50 font-light">{row.term}</p>
                          <p className="text-sm text-white/20 font-light mt-0.5">{row.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* ── FAQ ── */}
              <div id="section-faq" className="scroll-mt-[100px]">
                <div className="sticky top-[96px] z-20 pt-8 backdrop-blur-2xl">
                  <h2 className="text-4xl md:text-5xl font-extralight text-white mb-2 tracking-tight">
                    FAQ
                  </h2>
                  <p className="text-lg font-light text-white/35 mb-7">
                    Common questions before getting started
                  </p>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="h-10" />
                </div>

                <ScrollReveal>
                  <div>
                    {faqs.map((faq, i) => (
                      <FAQItem key={i} question={faq.question} answer={faq.answer} />
                    ))}
                  </div>
                </ScrollReveal>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 border-t border-white/[0.05] px-8 py-44">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="max-w-xl">
              <p className="text-xs tracking-[0.35em] uppercase text-white/25 mb-8 font-light">
                Ready to begin
              </p>
              <h2 className="text-5xl md:text-6xl font-extralight text-white mb-7 tracking-tight">
                Start a Project
              </h2>
              <p className="text-gray-400 font-light leading-relaxed mb-12 text-lg md:text-xl">
                The first conversation is a free discovery call — no commitment. We&apos;ll identify the right tier and scope before any contracts are signed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <Link
                  href="/contact"
                  className="group flex items-center justify-center gap-2.5 px-10 py-4 rounded-md font-semibold text-sm text-black bg-white hover:bg-white/90 hover:scale-[1.02] transition-all duration-200"
                >
                  Get in Touch
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
                <Link
                  href="/project/onboarding"
                  className="flex items-center justify-center gap-2.5 px-10 py-4 rounded-md font-semibold text-sm text-white bg-white/[0.04] border border-white/[0.12] hover:bg-white/[0.08] transition-all duration-200"
                >
                  See How It Works
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
