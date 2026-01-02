"use client"

import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { ArrowRight, Code2, Database, Lock, CheckCircle2, Clock, Zap, Server, FileCode, Shield, Terminal, ChevronDown, Rocket } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export default function APIDevelopmentsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const deliverables = [
    "Custom API endpoints (RESTful or GraphQL)",
    "Database architecture and optimization",
    "Authentication & authorization system",
    "Comprehensive API documentation",
    "Unit and integration testing",
    "Performance optimization and caching"
  ]

  const timeline = [
    { phase: "Days 1-3", title: "Architecture & Design", description: "Database schema, API structure, authentication flow planning" },
    { phase: "Days 4-10", title: "Development & Integration", description: "Core API development, third-party integrations, testing" },
    { phase: "Days 11-14", title: "Testing & Documentation", description: "Performance optimization, security audit, API docs" },
    { phase: "Days 15-21", title: "Deployment & Training", description: "Production deployment, team training, monitoring setup" }
  ]

  const faqs = [
    {
      question: "What's the difference between REST and GraphQL APIs?",
      answer: "REST APIs use fixed endpoints for each resource, while GraphQL allows clients to request exactly the data they need. We'll recommend the best approach based on your use case—REST for simplicity, GraphQL for complex data requirements."
    },
    {
      question: "Can you integrate with our existing database?",
      answer: "Yes! We work with all major databases (PostgreSQL, MySQL, MongoDB, etc.) and can integrate with your existing infrastructure. We'll assess your current setup during discovery and ensure seamless integration."
    },
    {
      question: "How do you handle API security?",
      answer: "We implement industry-standard security: JWT or OAuth authentication, rate limiting, input validation, SQL injection prevention, and encrypted data transmission. Every API includes comprehensive security testing."
    },
    {
      question: "Will we get documentation?",
      answer: "Absolutely. You'll receive complete API documentation including endpoint details, request/response examples, authentication guides, and error handling. We use tools like Swagger/OpenAPI for interactive documentation."
    },
    {
      question: "Do you provide ongoing API maintenance?",
      answer: "Yes. We offer maintenance packages for monitoring, updates, and scaling. We can also train your team to manage the API independently with full handoff documentation."
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
              <div className="inline-block px-4 py-2 bg-blue-400/10 border border-blue-400/20 rounded-full text-sm font-medium text-blue-400 uppercase tracking-wider mb-6">
                Enterprise Tier Solution
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Build Custom APIs in <span className="gradient-text">14-21 Days</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed">
                Custom backend development and third-party integrations. RESTful or GraphQL APIs with authentication, database design, and comprehensive documentation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/project#enterprise"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
                >
                  Select Enterprise Tier <ArrowRight size={20} />
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
                <span className="text-gray-300">14-21 Day Delivery • $6,000-30,000</span>
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
                Your business needs a custom backend, third-party integrations, or data synchronization—but traditional development takes months and costs a fortune.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Database, title: "Disconnected Systems", desc: "Data silos across multiple platforms with no unified backend" },
              { icon: Lock, title: "Security Concerns", desc: "Need enterprise-grade authentication and data protection" },
              { icon: Zap, title: "Slow Performance", desc: "Current solutions can't handle scale or real-time requirements" }
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
                Production-ready APIs built with modern frameworks, security best practices, and comprehensive documentation. Fast delivery without compromising quality.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: Code2, title: "RESTful or GraphQL", desc: "Choose the best architecture for your use case" },
              { icon: Shield, title: "Enterprise Security", desc: "JWT/OAuth, rate limiting, encryption, input validation" },
              { icon: Server, title: "Optimized Performance", desc: "Caching, database optimization, load balancing" },
              { icon: FileCode, title: "Complete Documentation", desc: "Interactive API docs with Swagger/OpenAPI" }
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
                <span className="gradient-text">14-21 Day</span> Timeline
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                From architecture to deployment in 2-3 weeks
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

      {/* Tier Recommendation */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="bg-gradient-to-r from-blue-600/10 to-cyan-500/10 border border-cyan-400/20 rounded-2xl p-12 text-center">
              <Rocket className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Recommended: <span className="gradient-text">Enterprise Tier</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                Custom API development requires architecture planning, security implementation, and comprehensive testing. Our Enterprise tier delivers production-ready APIs in 14-21 days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-full">
                  <span className="text-gray-300">Investment: <span className="text-cyan-400 font-semibold">$6,000-30,000</span></span>
                </div>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-full">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300">Timeline: <span className="text-cyan-400 font-semibold">14-21 days</span></span>
                </div>
              </div>
              <Link
                href="/project#enterprise"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
              >
                Select Enterprise Tier <ArrowRight size={20} />
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
              Ready to build your <span className="gradient-text">custom API</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Select the Enterprise tier to get started, or schedule a free consultation to discuss your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/project#enterprise"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
              >
                Select Enterprise Tier <ArrowRight size={20} />
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
