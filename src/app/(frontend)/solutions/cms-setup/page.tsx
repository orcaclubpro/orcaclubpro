"use client"

import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { ArrowRight, FileText, Layers, Zap, CheckCircle2, Clock, Users, Edit, Globe, ChevronDown, Rocket, Database, Settings } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export default function CMSSetupPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const deliverables = [
    "PayloadCMS or Sanity installation & configuration",
    "Custom content types and data models",
    "Intuitive admin UI for content editors",
    "API setup for frontend integration",
    "Team training and documentation",
    "Migration from existing CMS (if needed)"
  ]

  const timeline = [
    { phase: "Day 1", title: "CMS Selection & Planning", description: "Choose between PayloadCMS or Sanity, design content models, plan migrations" },
    { phase: "Days 2-3", title: "Installation & Configuration", description: "Set up CMS, configure hosting, implement content types" },
    { phase: "Days 4-5", title: "Integration & Training", description: "Connect to frontend, train your team, finalize documentation" }
  ]

  const faqs = [
    {
      question: "What's the difference between PayloadCMS and Sanity?",
      answer: "PayloadCMS is a code-first, self-hosted CMS with complete control over your data and infrastructure. Sanity is a cloud-hosted platform with powerful real-time collaboration. We'll recommend the best fit based on your needs, team size, and technical requirements."
    },
    {
      question: "Can you migrate content from our current CMS?",
      answer: "Yes! We handle migrations from WordPress, Contentful, Strapi, and other platforms. We'll map your existing content structure to the new CMS and ensure a smooth transition without data loss."
    },
    {
      question: "Will our team need to learn code?",
      answer: "No. Both PayloadCMS and Sanity have user-friendly admin interfaces. Your content editors will use a visual editor—no coding required. We provide training and documentation to get your team up to speed quickly."
    },
    {
      question: "How does the CMS connect to our website?",
      answer: "Headless CMSs provide APIs that your website or app consumes. We'll set up the API endpoints and integrate them with your frontend (React, Next.js, etc.), ensuring fast, secure content delivery."
    },
    {
      question: "Do you provide ongoing CMS support?",
      answer: "Yes. We offer maintenance packages for updates, new content types, and technical support. We can also train your team to manage the CMS independently with full handoff documentation."
    }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block px-4 py-2 bg-green-400/10 border border-green-400/20 rounded-full text-sm font-medium text-green-400 uppercase tracking-wider mb-6">
                Launch Tier Solution
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Launch Your Headless CMS in <span className="gradient-text">3-5 Days</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed">
                Modern content management with PayloadCMS or Sanity. Custom content types, intuitive admin UI, and seamless frontend integration—no more wrestling with WordPress.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/project#launch"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
                >
                  Select Launch Tier <ArrowRight size={20} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-10 py-5 border border-cyan-400/30 rounded-full text-lg font-medium text-cyan-400 hover:bg-cyan-400/10 transition-all duration-300"
                >
                  Free Consultation
                </Link>
              </div>

              <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-full">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span className="text-gray-300">3-5 Day Delivery • $1,000-3,000</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                The <span className="gradient-text">Challenge</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
                You need flexible content management, but WordPress is outdated, bloated, and not developer-friendly. You want modern tools without the complexity.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Database, title: "Inflexible Content Types", desc: "Current CMS can't handle custom data structures or relationships" },
              { icon: Zap, title: "Slow Performance", desc: "Heavy WordPress sites with plugin bloat and security vulnerabilities" },
              { icon: Edit, title: "Poor Editor Experience", desc: "Clunky admin interfaces that frustrate content teams" }
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-red-400/30 transition-all duration-300">
                  <item.icon className="w-10 h-10 text-red-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Our <span className="gradient-text">Solution</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
                Modern headless CMS with custom content modeling, developer-friendly APIs, and beautiful admin UIs. Fast setup, easy to use, and built to scale.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: FileText, title: "Custom Content Types", desc: "Design content models that fit your business perfectly" },
              { icon: Users, title: "Intuitive Admin UI", desc: "Beautiful interfaces that content editors actually enjoy using" },
              { icon: Globe, title: "API-First Architecture", desc: "Use content anywhere—websites, apps, or other platforms" },
              { icon: Settings, title: "Full Customization", desc: "Extend and configure the CMS to match your workflow" }
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="flex gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-lg bg-cyan-400/10">
                      <item.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables Section */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                What You <span className="gradient-text">Get</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-4">
            {deliverables.map((item, i) => (
              <ScrollReveal key={i} delay={i * 50}>
                <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="gradient-text">3-5 Day</span> Timeline
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                From planning to fully configured CMS in under a week
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-6">
            {timeline.map((item, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-lg">
                      <span className="text-cyan-400 font-mono text-sm">{item.phase}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CMS Comparison */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                PayloadCMS vs <span className="gradient-text">Sanity</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
                Both are excellent. We'll help you choose based on your needs.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            <ScrollReveal delay={0}>
              <div className="bg-slate-900/60 backdrop-blur-xl border border-blue-400/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-blue-400 mb-4">PayloadCMS</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Self-hosted with full data control</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Code-first with TypeScript support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Built on React and Node.js</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">No ongoing CMS fees</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">Best for:</span> Teams that want complete control, developers who prefer code-first approaches, projects needing custom functionality
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">Sanity</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Cloud-hosted, zero infrastructure</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Real-time collaboration features</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Powerful content studio UI</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Global CDN for fast content delivery</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">Best for:</span> Teams needing real-time collaboration, projects requiring global content delivery, businesses wanting managed infrastructure
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Tier Recommendation */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="bg-gradient-to-r from-blue-600/10 to-cyan-500/10 border border-cyan-400/20 rounded-2xl p-12 text-center">
              <Rocket className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Recommended: <span className="gradient-text">Launch Tier</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                Headless CMS setup is fast and straightforward. Our Launch tier gets you a fully configured CMS with custom content types in 3-5 days—perfect for startups and growing businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-full">
                  <span className="text-gray-300">Investment: <span className="text-cyan-400 font-semibold">$1,000-3,000</span></span>
                </div>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-full">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">Timeline: <span className="text-cyan-400 font-semibold">3-5 days</span></span>
                </div>
              </div>
              <Link
                href="/project#launch"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
              >
                Select Launch Tier <ArrowRight size={20} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <ScrollReveal key={i} delay={i * 50}>
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                    >
                      <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-cyan-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        height: isOpen ? 'auto' : 0,
                        maxHeight: isOpen ? '500px' : 0
                      }}
                    >
                      <div className="px-8 pb-6 text-gray-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to upgrade your <span className="gradient-text">content management</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Select the Launch tier to get started, or schedule a free consultation to discuss which CMS is right for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/project#launch"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
              >
                Select Launch Tier <ArrowRight size={20} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 border border-cyan-400/30 rounded-full text-lg font-medium text-cyan-400 hover:bg-cyan-400/10 transition-all duration-300"
              >
                Free Consultation
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
