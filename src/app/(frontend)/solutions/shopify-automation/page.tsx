"use client"

import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { ArrowRight, ShoppingCart, Zap, Mail, CheckCircle2, Clock, TrendingUp, BarChart3, Package, Workflow, ChevronDown, Rocket, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export default function ShopifyAutomationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const deliverables = [
    "2 custom Shopify integrations (CRM, inventory, etc.)",
    "Automated workflow setup (orders, emails, notifications)",
    "Email automation (abandoned cart, order confirmations)",
    "Analytics dashboard for sales tracking",
    "Webhook configuration for real-time updates",
    "Training and documentation for your team"
  ]

  const timeline = [
    { phase: "Days 1-2", title: "Discovery & Planning", description: "Identify integration points, map workflows, design automation rules" },
    { phase: "Days 3-6", title: "Integration Development", description: "Build Shopify connections, configure webhooks, set up automation" },
    { phase: "Days 7-8", title: "Testing & Launch", description: "Test workflows, configure email templates, train team" },
    { phase: "Days 9-10", title: "Monitoring & Optimization", description: "Monitor performance, optimize workflows, finalize documentation" }
  ]

  const faqs = [
    {
      question: "What tools can you integrate with Shopify?",
      answer: "We integrate Shopify with CRMs (HubSpot, Salesforce), email platforms (Mailchimp, Klaviyo), inventory systems, ERPs, analytics tools, and custom databases. If it has an API, we can connect it to Shopify."
    },
    {
      question: "Will automation slow down our store?",
      answer: "No. We use Shopify webhooks and background processing to ensure automation happens asynchronously without affecting your store's performance. Customers won't experience any slowdown."
    },
    {
      question: "Can you automate abandoned cart emails?",
      answer: "Absolutely. We set up automated email sequences for abandoned carts, order confirmations, shipping updates, and post-purchase follow-ups. You can customize messaging and timing to match your brand."
    },
    {
      question: "What happens if an integration breaks?",
      answer: "We implement error handling and monitoring to alert you if something fails. We also provide maintenance packages for ongoing support and updates as Shopify or third-party platforms evolve."
    },
    {
      question: "Do we need to be on Shopify Plus?",
      answer: "No. Most automations work on standard Shopify plans. However, some advanced features (like custom checkout flows) require Shopify Plus. We'll recommend the best solution for your plan level."
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
              <div className="inline-block px-4 py-2 bg-purple-400/10 border border-purple-400/20 rounded-full text-sm font-medium text-purple-400 uppercase tracking-wider mb-6">
                Scale Tier Solution
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Automate Your Shopify Workflows in <span className="gradient-text">7-10 Days</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed">
                Stop manual order processing and disconnected systems. Automate Shopify workflows, integrate with your business tools, and free up your team to focus on growth.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/project#scale"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
                >
                  Select Scale Tier <ArrowRight size={20} />
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
                <span className="text-gray-300">7-10 Day Delivery • $3,000-5,000</span>
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
                Your Shopify store is growing, but manual processes are holding you back. Order processing, inventory sync, and customer communication eat up hours every day.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Package, title: "Manual Order Processing", desc: "Hours spent copying order data between Shopify and other systems" },
              { icon: RefreshCw, title: "Disconnected Inventory", desc: "Stock levels out of sync across platforms, leading to overselling" },
              { icon: Mail, title: "No Email Automation", desc: "Missing revenue from abandoned carts and lack of post-purchase engagement" }
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
                Automated workflows that handle repetitive tasks, seamless integrations that keep your systems in sync, and smart email automation that recovers lost sales.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: Workflow, title: "Automated Workflows", desc: "Orders, fulfillment, and notifications happen automatically" },
              { icon: ShoppingCart, title: "2 Custom Integrations", desc: "Connect Shopify to CRM, inventory, or any business tool" },
              { icon: Mail, title: "Email Automation", desc: "Recover abandoned carts and nurture post-purchase relationships" },
              { icon: BarChart3, title: "Analytics Dashboard", desc: "Track sales, conversion rates, and automation performance" }
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
                <span className="gradient-text">7-10 Day</span> Timeline
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                From discovery to fully automated workflows in under 2 weeks
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

      {/* Automation Examples */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="gradient-text">Automation</span> Examples
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
                See how automation can transform your Shopify operations
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Abandoned Cart Recovery",
                description: "Automatically send personalized emails to customers who leave items in their cart. Include product images, discounts, and urgency messaging. Recover 10-15% of lost sales.",
                metrics: ["15% recovery rate", "3-email sequence", "Automated discounts"]
              },
              {
                title: "Order → CRM Sync",
                description: "When an order is placed, automatically create or update the customer record in your CRM (HubSpot, Salesforce, etc.). Keep sales and marketing aligned with real-time data.",
                metrics: ["Real-time sync", "Custom field mapping", "Two-way updates"]
              },
              {
                title: "Inventory Management",
                description: "Sync stock levels between Shopify and your warehouse or other sales channels. Prevent overselling and automate reorder alerts when inventory runs low.",
                metrics: ["Multi-channel sync", "Low stock alerts", "Auto-reordering"]
              },
              {
                title: "Post-Purchase Follow-Up",
                description: "Send automated thank-you emails, request reviews, and recommend complementary products. Increase customer lifetime value and build loyalty.",
                metrics: ["5-star reviews", "Upsell campaigns", "Loyalty building"]
              }
            ].map((example, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-300">
                  <h3 className="text-xl font-bold text-white mb-3">{example.title}</h3>
                  <p className="text-gray-400 mb-4 leading-relaxed">{example.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {example.metrics.map((metric, j) => (
                      <div key={j} className="px-3 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-xs text-cyan-400">
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
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
                Recommended: <span className="gradient-text">Scale Tier</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                Shopify automation requires custom integrations, workflow configuration, and thorough testing. Our Scale tier delivers 2 integrations and comprehensive automation in 7-10 days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-full">
                  <span className="text-gray-300">Investment: <span className="text-cyan-400 font-semibold">$3,000-5,000</span></span>
                </div>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-full">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">Timeline: <span className="text-cyan-400 font-semibold">7-10 days</span></span>
                </div>
              </div>
              <Link
                href="/project#scale"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
              >
                Select Scale Tier <ArrowRight size={20} />
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
              Ready to automate your <span className="gradient-text">Shopify store</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Select the Scale tier to get started, or schedule a free consultation to discuss your automation needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/project#scale"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
              >
                Select Scale Tier <ArrowRight size={20} />
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
