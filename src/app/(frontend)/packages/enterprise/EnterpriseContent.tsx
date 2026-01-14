"use client"

import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { motion } from "motion/react"
import { useState, useEffect, useRef } from "react"
import {
  ArrowRight,
  Check,
  Clock,
  Building2,
  ShoppingBag,
  Code2,
  LayoutDashboard,
  Database,
  Workflow,
  Users,
  Headphones,
  Shield,
  Layers,
  Globe,
  Server,
  ChevronDown,
  Sparkles,
  Calendar,
  Settings,
  Package,
  Briefcase,
  Store,
  Boxes,
  CalendarClock,
  Rocket,
  Zap
} from "lucide-react"

export default function EnterpriseContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Hero Section */}
      <HeroSection />

      {/* What's Included Section */}
      <WhatsIncludedSection />

      {/* Ideal For Section */}
      <IdealForSection />

      {/* Custom Options Section */}
      <CustomOptionsSection />

      {/* Process Section */}
      <ProcessSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}

// Breadcrumbs Component
function Breadcrumbs() {
  return (
    <nav className="relative z-10 pt-28 px-8" aria-label="Breadcrumb">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          <li>
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              Home
            </Link>
          </li>
          <li className="text-gray-600">/</li>
          <li>
            <Link href="/project" className="hover:text-cyan-400 transition-colors">
              Project Tiers
            </Link>
          </li>
          <li className="text-gray-600">/</li>
          <li className="text-cyan-400">Enterprise</li>
        </ol>
      </div>
    </nav>
  )
}

// Hero Section
function HeroSection() {
  return (
    <section className="pt-8 pb-20 px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-400/10 border border-indigo-400/20 rounded-full text-sm font-medium text-indigo-400 uppercase tracking-wider mb-6">
                <Building2 className="w-4 h-4" />
                Enterprise Tier
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Enterprise Solutions for{" "}
                <span className="gradient-text">Complex Needs</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <p className="text-xl md:text-2xl text-gray-400 mb-8 leading-relaxed">
                Full-service development for businesses requiring Shopify stores, custom APIs, admin dashboards, and unlimited integrations.
              </p>
            </motion.div>

            {/* Price & Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="grid grid-cols-2 gap-6 mb-10 max-w-md">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-400/30 rounded-lg p-4 relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-sm text-gray-400 mb-2">Investment</div>
                  <div className="text-3xl font-bold text-indigo-400">$6K-30K</div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Clock className="w-4 h-4" />
                    Timeline
                  </div>
                  <div className="text-3xl font-bold text-cyan-400">14-21 Days</div>
                </div>
              </div>
            </motion.div>

            {/* Key Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="space-y-3 mb-10">
                {[
                  'Everything in Scale tier included',
                  'Unlimited custom integrations',
                  'Dedicated project manager',
                  'Extended support period'
                ].map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                  >
                    <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact?tier=enterprise"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600/30 to-cyan-500/20 border border-indigo-400/40 rounded-full text-lg font-medium text-indigo-400 hover:from-indigo-600/40 hover:to-cyan-500/30 hover:border-indigo-400/60 transition-all duration-500 magnetic interactive"
                >
                  Get Custom Quote <ArrowRight size={20} />
                </Link>
                <Link
                  href="/project"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-gray-300 hover:text-white transition-colors magnetic"
                >
                  Compare All Tiers <ArrowRight size={16} className="opacity-50" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right: Visual Element */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-indigo-400/20 rounded-xl shadow-2xl shadow-indigo-400/10 overflow-hidden p-8">
              {/* Full Service Badge */}
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 bg-indigo-400/20 border border-indigo-400/40 rounded-full text-xs font-medium text-indigo-400">
                  FULL SERVICE
                </div>
              </div>

              {/* Service Icons Grid */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                {[
                  { icon: ShoppingBag, label: 'Shopify', color: 'indigo' },
                  { icon: Code2, label: 'Custom APIs', color: 'cyan' },
                  { icon: LayoutDashboard, label: 'Dashboards', color: 'blue' },
                  { icon: Database, label: 'Database', color: 'purple' },
                  { icon: Workflow, label: 'Automation', color: 'indigo' },
                  { icon: Layers, label: 'Integrations', color: 'cyan' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-${item.color}-400/10 border border-${item.color}-400/30 flex items-center justify-center`}>
                      <item.icon className={`w-7 h-7 text-${item.color}-400`} />
                    </div>
                    <span className="text-sm text-gray-400">{item.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Bottom Stats */}
              <div className="mt-10 pt-6 border-t border-slate-700/50 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-xs text-gray-500">Projects Delivered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">14-21</div>
                  <div className="text-xs text-gray-500">Day Delivery</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">1:1</div>
                  <div className="text-xs text-gray-500">Developer Access</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// What's Included Section
function WhatsIncludedSection() {
  const scaleFeatures = [
    'Headless CMS Setup',
    'Infrastructure & Hosting',
    'Mobile Responsive Design',
    'SEO Configuration',
    'Brand-Aligned Custom Design',
    '2 Custom Integrations',
    'Advanced Analytics (GA4)',
    'Form Automation',
    'Email Marketing Integration'
  ]

  const enterpriseFeatures = [
    { icon: Layers, title: 'Unlimited Integrations', description: 'Connect any number of systems, APIs, and third-party services' },
    { icon: ShoppingBag, title: 'Shopify Store Development', description: 'Full Shopify or headless commerce implementation with custom themes' },
    { icon: Code2, title: 'Custom API Development', description: 'Bespoke APIs connecting your systems and external services' },
    { icon: LayoutDashboard, title: 'Admin Dashboard/Portal', description: 'Custom admin interfaces for your team and clients' },
    { icon: Database, title: 'Database Architecture', description: 'Scalable database design for enterprise applications' },
    { icon: Workflow, title: 'Custom Automation Workflows', description: 'End-to-end business process automation' },
    { icon: Users, title: 'Dedicated Project Manager', description: 'Single point of contact throughout your project' },
    { icon: Headphones, title: 'Extended Support Period', description: 'Longer post-launch support for peace of mind' },
  ]

  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What's <span className="gradient-text">Included</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Everything in Scale tier, plus comprehensive enterprise capabilities
            </p>
          </div>
        </ScrollReveal>

        {/* Scale Features - Inherited */}
        <ScrollReveal>
          <div className="mb-12 p-6 bg-slate-900/40 backdrop-blur-xl border border-cyan-400/20 rounded-xl">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Everything in Scale Tier:
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              {scaleFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-gray-300 text-sm">
                  <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Enterprise Features */}
        <div className="grid md:grid-cols-2 gap-6">
          {enterpriseFeatures.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 50}>
              <div className="flex gap-4 bg-slate-900/60 backdrop-blur-xl border border-indigo-400/20 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-500">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-indigo-400/10">
                    <feature.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Ideal For Section
function IdealForSection() {
  const idealCases = [
    {
      icon: Store,
      title: 'E-commerce Businesses Launching on Shopify',
      description: 'Full Shopify store setup with custom themes, product management, and headless commerce options',
      examples: ['Online retailers', 'D2C brands', 'Subscription businesses']
    },
    {
      icon: Users,
      title: 'Companies Needing Client Portals',
      description: 'Secure, role-based portals for clients to access their data, documents, and services',
      examples: ['Agencies', 'Service providers', 'B2B businesses']
    },
    {
      icon: Layers,
      title: 'Businesses with Complex Integration Needs',
      description: 'Connect multiple systems, CRMs, ERPs, and third-party services seamlessly',
      examples: ['Multi-channel retailers', 'Enterprise organizations', 'Growing startups']
    },
    {
      icon: Settings,
      title: 'Organizations Requiring Custom Software',
      description: 'Bespoke applications tailored to unique business processes and workflows',
      examples: ['Custom internal tools', 'Industry-specific solutions', 'Process automation']
    }
  ]

  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ideal <span className="gradient-text">For</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Enterprise tier is perfect for these use cases
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {idealCases.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 100}>
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 hover:border-indigo-400/30 transition-all duration-500 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-indigo-400/10 flex-shrink-0">
                    <item.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-gray-400 mb-4 leading-relaxed">{item.description}</p>
                <div className="flex flex-wrap gap-2">
                  {item.examples.map((example) => (
                    <span key={example} className="px-3 py-1 bg-slate-800/60 border border-slate-700/50 rounded-full text-xs text-gray-300">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Custom Options Section
function CustomOptionsSection() {
  const customOptions = [
    {
      icon: Globe,
      title: 'Multi-site Management',
      description: 'Manage multiple websites from a single admin interface with shared content and assets'
    },
    {
      icon: Boxes,
      title: 'Inventory Management Systems',
      description: 'Real-time inventory tracking across multiple channels with automated sync'
    },
    {
      icon: CalendarClock,
      title: 'Booking/Scheduling Platforms',
      description: 'Custom booking systems with calendar integration, payments, and notifications'
    },
    {
      icon: Rocket,
      title: 'SaaS Application Foundations',
      description: 'Multi-tenant architecture, user management, and billing infrastructure'
    },
    {
      icon: Briefcase,
      title: 'B2B Portal Development',
      description: 'Wholesale ordering, quote systems, and customer-specific pricing'
    },
    {
      icon: Server,
      title: 'Custom Backend Systems',
      description: 'Tailored server-side applications for unique business requirements'
    }
  ]

  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Custom Options <span className="gradient-text">Available</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Extend your project with these additional capabilities
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customOptions.map((option, i) => (
            <ScrollReveal key={option.title} delay={i * 50}>
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-500 group">
                <div className="p-3 rounded-lg bg-cyan-400/10 w-fit mb-4 group-hover:bg-cyan-400/20 transition-colors">
                  <option.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{option.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{option.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-6">
              Have a unique requirement? We love solving complex problems.
            </p>
            <Link
              href="/contact?tier=enterprise"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Discuss Your Project <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Process Section
function ProcessSection() {
  const steps = [
    {
      phase: 'Discovery',
      icon: Users,
      duration: '2-3 Days',
      description: 'Deep dive into your business needs, technical requirements, and integration landscape. We map out the complete project scope.',
      deliverables: ['Requirements document', 'Technical architecture', 'Project timeline', 'Detailed proposal']
    },
    {
      phase: 'Design',
      icon: LayoutDashboard,
      duration: '3-5 Days',
      description: 'Create wireframes, user flows, and visual designs. You approve every element before development begins.',
      deliverables: ['Wireframes & mockups', 'User flow diagrams', 'Design system', 'Prototype (if needed)']
    },
    {
      phase: 'Development',
      icon: Code2,
      duration: '7-10 Days',
      description: 'Build your solution with modern frameworks, implement integrations, and develop custom features. Daily progress updates.',
      deliverables: ['Staging environment', 'Daily standups', 'Integration testing', 'Code documentation']
    },
    {
      phase: 'Deployment',
      icon: Rocket,
      duration: '2-3 Days',
      description: 'Launch to production, final testing, and team training. Extended support ensures smooth transition.',
      deliverables: ['Production deployment', 'Team training', 'Documentation', 'Support handoff']
    }
  ]

  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our <span className="gradient-text">Process</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              A structured approach to delivering enterprise solutions
            </p>
          </div>
        </ScrollReveal>

        {/* Process Timeline */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 via-cyan-400 to-blue-500" />

          <div className="space-y-12">
            {steps.map((step, i) => {
              const isEven = i % 2 === 0

              return (
                <ScrollReveal key={step.phase} delay={i * 100}>
                  <div className={`flex flex-col lg:flex-row items-center gap-8 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                    {/* Content Card */}
                    <div className={`flex-1 ${isEven ? 'lg:text-right' : 'lg:text-left'}`}>
                      <div className="inline-block bg-slate-900/60 backdrop-blur-xl border border-indigo-400/20 rounded-xl p-6 lg:p-8 hover:border-indigo-400/40 transition-all duration-500">
                        <div className={`flex items-center gap-4 mb-4 ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                          <div className="p-3 rounded-lg bg-indigo-400/10">
                            <step.icon className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm text-cyan-400 font-medium">{step.duration}</div>
                            <h3 className="text-2xl font-bold text-white">{step.phase}</h3>
                          </div>
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-4">{step.description}</p>
                        <div className={`flex flex-wrap gap-2 ${isEven ? 'lg:justify-end' : 'lg:justify-start'}`}>
                          {step.deliverables.map((item) => (
                            <span key={item} className="px-3 py-1 bg-slate-800/60 border border-slate-700/50 rounded-full text-xs text-gray-400">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Node */}
                    <div className="relative flex-shrink-0 hidden lg:flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-400/20 border-2 border-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-400/30">
                        <span className="text-indigo-400 font-bold">{i + 1}</span>
                      </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 hidden lg:block" />
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>

        {/* Timeline Footer */}
        <ScrollReveal>
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-indigo-400/20 rounded-full">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span className="text-gray-300">Total Project Timeline: 14-21 Days</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// FAQ Section
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "What's included in the Enterprise tier?",
      answer: "The Enterprise tier includes everything in our Scale package plus unlimited integrations, Shopify store development, custom API development, admin dashboards/portals, database architecture, custom automation workflows, a dedicated project manager, and extended support period. Pricing ranges from $6K-$30K depending on project scope."
    },
    {
      question: "How long does an Enterprise project take?",
      answer: "Enterprise projects typically take 14-21 days from kickoff to launch. Complex projects with multiple systems or extensive custom development may require additional time, which we'll discuss during your free consultation."
    },
    {
      question: "Can you build a custom Shopify store?",
      answer: "Absolutely. We specialize in both traditional Shopify stores and headless Shopify implementations using Next.js. This includes custom themes, product configurators, subscription systems, and integrations with your existing business tools."
    },
    {
      question: "Do you build client portals and admin dashboards?",
      answer: "Yes, custom admin dashboards and client portals are a core part of our Enterprise offering. We build secure, role-based systems that give your team and clients exactly the access and functionality they need."
    },
    {
      question: "What kind of custom automation can you build?",
      answer: "We build automation workflows that connect your systems, from order processing and inventory sync to customer onboarding flows and reporting automation. If you can describe the process, we can automate it."
    },
    {
      question: "How do I get a custom quote?",
      answer: "Start with a free 30-minute consultation where we'll discuss your project requirements, integrations needed, and timeline. We'll then provide a detailed proposal with transparent pricing and project milestones."
    }
  ]

  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Common questions about Enterprise tier projects
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i

              return (
                <div
                  key={i}
                  className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden hover:border-indigo-400/30 transition-all duration-500"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-indigo-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
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
              )
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  return (
    <section className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center bg-gradient-to-r from-indigo-600/10 to-cyan-500/10 border border-indigo-400/20 rounded-2xl p-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-400/10 border border-indigo-400/20 rounded-full text-sm font-medium text-indigo-400 uppercase tracking-wider mb-6">
              <Zap className="w-4 h-4" />
              Enterprise Tier
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Build Something <span className="gradient-text">Exceptional</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Let's discuss your enterprise project. Free consultation, custom quote, and a clear roadmap to launch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/contact?tier=enterprise"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-indigo-400/20 transition-all duration-500 magnetic"
              >
                Get Custom Quote <ArrowRight size={20} />
              </Link>
              <Link
                href="/project"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 border border-indigo-400/30 rounded-full text-lg font-medium text-indigo-400 hover:bg-indigo-400/10 transition-all duration-300 magnetic"
              >
                Compare All Tiers <Package size={18} />
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Free consultation | 14-21 day delivery | Projects from $6K-$30K
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
