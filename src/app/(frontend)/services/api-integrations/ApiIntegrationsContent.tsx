'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Network,
  Clock,
  Shield,
  Code2,
  Database,
  RefreshCw,
  AlertTriangle,
  Zap,
  Lock,
  Server,
  Webhook,
  GitBranch,
  BarChart3,
  Users,
  ShoppingCart,
  Mail,
  MessageSquare,
  Calendar,
  FileJson,
  Settings,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity
} from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"

export default function ApiIntegrationsContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section */}
      <ProblemSection />

      {/* Integration Categories */}
      <IntegrationCategoriesSection />

      {/* How We Build Section */}
      <HowWeBuildSection />

      {/* Architecture Section */}
      <ArchitectureSection />

      {/* Tier Breakdown */}
      <TierSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Related Services */}
      <RelatedServicesSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}

// Hero Section
function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section ref={ref} className="pt-32 pb-20 px-8 relative z-10">
      <div className="max-w-6xl mx-auto text-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-cyan-400 text-sm mb-8">
            <Network className="w-4 h-4" />
            API Integration Services
          </div>
          <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
            <span className="gradient-text font-light">Connect</span> Everything,{' '}
            <span className="gradient-text font-light">Automate</span> Anything
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-8">
            End the chaos of disconnected systems. We build <strong className="text-white font-normal">custom API integrations</strong> that
            sync your CRM, ecommerce, marketing tools, and business systems into one{' '}
            <strong className="text-white font-normal">unified data ecosystem</strong>.
          </p>
        </ScrollReveal>

        {/* Quick Stats */}
        <motion.div
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          {[
            { label: 'Platforms Connected', value: '50+', icon: Network },
            { label: 'Data Sync', value: 'Real-time', icon: RefreshCw },
            { label: 'Uptime SLA', value: '99.9%', icon: Activity },
            { label: 'Error Recovery', value: 'Automatic', icon: Shield }
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-xl p-6 text-center hover:border-cyan-400/30 transition-all duration-300"
            >
              <stat.icon className="w-6 h-6 text-cyan-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/project#scale"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:from-cyan-400/30 hover:to-blue-500/30 transition-all duration-300"
          >
            Connect Your Systems <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
          >
            Free Integration Audit <ArrowRight size={16} className="opacity-50" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// Problem Section
function ProblemSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const problems = [
    {
      icon: Database,
      title: 'Data Silos Everywhere',
      description: 'Customer data in your CRM, order data in Shopify, email data in Mailchimp. None of it talks to each other.'
    },
    {
      icon: RefreshCw,
      title: 'Manual Data Entry',
      description: 'Staff spending hours copying data between platforms. Error-prone, time-consuming, and completely preventable.'
    },
    {
      icon: AlertTriangle,
      title: 'Inconsistent Data',
      description: 'Customer updated their email in HubSpot but the old one is still in Stripe. Which one is right?'
    },
    {
      icon: BarChart3,
      title: 'No Single Source of Truth',
      description: 'Different reports from different systems showing different numbers. Impossible to make confident decisions.'
    },
    {
      icon: Layers,
      title: 'Integration Nightmares',
      description: 'Tried Zapier but hit limits. Hired a developer but they built something fragile. Time to do it right.'
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Sound <span className="gradient-text font-light">Familiar</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              These integration headaches cost businesses thousands in lost productivity
              and missed opportunities every month.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              className="p-6 rounded-2xl bg-black/40 border border-red-500/20 backdrop-blur-xl hover:border-red-500/40 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * index }}
            >
              <problem.icon className="w-10 h-10 text-red-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-medium text-white mb-2">{problem.title}</h3>
              <p className="text-gray-400 font-light text-sm leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
        >
          <p className="text-lg text-gray-300">
            We fix all of this with <span className="text-cyan-400 font-medium">custom API integrations</span> that actually work.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Integration Categories Section
function IntegrationCategoriesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const categories = [
    {
      title: 'CRM Integrations',
      icon: Users,
      color: 'blue',
      description: 'Connect your customer relationship management systems',
      integrations: [
        { name: 'Salesforce', detail: 'Bidirectional sync, custom objects, workflows' },
        { name: 'HubSpot', detail: 'Contacts, deals, companies, marketing automation' },
        { name: 'Pipedrive', detail: 'Pipeline sync, activity tracking' },
        { name: 'Zoho CRM', detail: 'Full module integration, custom fields' }
      ]
    },
    {
      title: 'Ecommerce Integrations',
      icon: ShoppingCart,
      color: 'emerald',
      description: 'Sync your online store with everything else',
      integrations: [
        { name: 'Shopify', detail: 'Admin API, Storefront API, webhooks' },
        { name: 'Stripe', detail: 'Payments, subscriptions, invoicing' },
        { name: 'Inventory Systems', detail: 'Real-time stock sync, multi-warehouse' },
        { name: 'Order Management', detail: 'Fulfillment, tracking, returns' }
      ]
    },
    {
      title: 'Marketing Platforms',
      icon: Mail,
      color: 'purple',
      description: 'Automate your marketing data flow',
      integrations: [
        { name: 'Mailchimp / Klaviyo', detail: 'List sync, campaign triggers' },
        { name: 'ActiveCampaign', detail: 'Automation, CRM sync, scoring' },
        { name: 'ConvertKit', detail: 'Subscriber management, sequences' },
        { name: 'Customer.io', detail: 'Event tracking, messaging automation' }
      ]
    },
    {
      title: 'Business Tools',
      icon: MessageSquare,
      color: 'cyan',
      description: 'Connect your operational tools',
      integrations: [
        { name: 'Slack', detail: 'Notifications, commands, workflows' },
        { name: 'Airtable / Notion', detail: 'Database sync, automations' },
        { name: 'Google Workspace', detail: 'Sheets, Docs, Drive integration' },
        { name: 'Calendar Systems', detail: 'Google Calendar, Calendly, scheduling' }
      ]
    },
    {
      title: 'Custom API Development',
      icon: Code2,
      color: 'violet',
      description: 'When off-the-shelf solutions are not enough',
      integrations: [
        { name: 'REST API Design', detail: 'Clean, documented, versioned APIs' },
        { name: 'Webhook Handlers', detail: 'Reliable event processing' },
        { name: 'Data Transformation', detail: 'ETL pipelines, format conversion' },
        { name: 'Authentication', detail: 'OAuth 2.0, API keys, JWT' }
      ]
    }
  ]

  const colorClasses: Record<string, { bg: string; border: string; text: string; hoverBorder: string }> = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-400/30', text: 'text-blue-400', hoverBorder: 'hover:border-blue-400/50' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-400/30', text: 'text-emerald-400', hoverBorder: 'hover:border-emerald-400/50' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-400/30', text: 'text-purple-400', hoverBorder: 'hover:border-purple-400/50' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-400/30', text: 'text-cyan-400', hoverBorder: 'hover:border-cyan-400/50' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-400/30', text: 'text-violet-400', hoverBorder: 'hover:border-violet-400/50' }
  }

  return (
    <section ref={ref} className="py-20 px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Integrations We <span className="gradient-text font-light">Build</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              From CRM systems to custom APIs, we connect the platforms that power your business.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-8">
          {categories.map((category, index) => {
            const colors = colorClasses[category.color]
            return (
              <motion.div
                key={category.title}
                className={`p-8 rounded-2xl bg-black/40 border ${colors.border} backdrop-blur-xl ${colors.hoverBorder} transition-all duration-300`}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * index }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                    <category.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white">{category.title}</h3>
                    <p className="text-sm text-gray-400">{category.description}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {category.integrations.map((integration) => (
                    <div
                      key={integration.name}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <CheckCircle2 className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                      <div>
                        <span className="text-white font-medium text-sm">{integration.name}</span>
                        <p className="text-gray-400 text-xs mt-0.5">{integration.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// How We Build Section
function HowWeBuildSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const steps = [
    {
      number: '01',
      title: 'API Audit & Documentation Review',
      description: 'We analyze your existing systems, review API documentation, and identify data relationships. Understanding what exists before building anything new.',
      icon: FileJson
    },
    {
      number: '02',
      title: 'Data Mapping & Transformation',
      description: 'Define how data flows between systems. Map fields, handle format differences, and design transformation logic for clean data sync.',
      icon: GitBranch
    },
    {
      number: '03',
      title: 'Error Handling & Retry Logic',
      description: 'Build resilient integrations that handle network issues, API rate limits, and unexpected failures gracefully. No lost data.',
      icon: Shield
    },
    {
      number: '04',
      title: 'Rate Limiting Management',
      description: 'Respect API rate limits with intelligent queuing and throttling. Maximize throughput without triggering blocks.',
      icon: Clock
    },
    {
      number: '05',
      title: 'Monitoring & Alerts',
      description: 'Real-time monitoring dashboards and proactive alerts. Know about issues before they impact your business.',
      icon: Activity
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              How We Build <span className="gradient-text font-light">Integrations</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              A systematic approach to building integrations that are robust, maintainable, and scalable.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300"
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 * index }}
            >
              <div className="flex items-center gap-4 md:w-1/3">
                <div className="w-14 h-14 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="text-cyan-400 font-mono text-sm">{step.number}</div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-lg font-medium text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 font-light text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Architecture Section
function ArchitectureSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const principles = [
    {
      title: 'Event-Driven Architecture',
      description: 'Webhooks and event queues ensure real-time sync without polling. Changes propagate instantly across systems.',
      icon: Webhook
    },
    {
      title: 'Idempotent Operations',
      description: 'Safe to retry any operation without creating duplicates. Essential for reliable sync in distributed systems.',
      icon: RefreshCw
    },
    {
      title: 'Version-Aware Integrations',
      description: 'We track API versions and handle deprecations gracefully. Your integrations adapt as platforms evolve.',
      icon: GitBranch
    },
    {
      title: 'Comprehensive Logging',
      description: 'Every API call logged with request/response data. Debug issues in minutes, not days.',
      icon: Server
    },
    {
      title: 'Secure by Default',
      description: 'OAuth 2.0, encrypted credentials, least-privilege access. Security built in, not bolted on.',
      icon: Lock
    },
    {
      title: 'Horizontal Scalability',
      description: 'Integrations designed to handle growing data volumes. Queue-based architecture scales with your business.',
      icon: Layers
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Integration <span className="gradient-text font-light">Architecture</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              How we build integrations that are robust, maintainable, and ready to scale with your business.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((principle, index) => (
            <motion.div
              key={principle.title}
              className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * index }}
            >
              <principle.icon className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-medium text-white mb-2">{principle.title}</h3>
              <p className="text-gray-400 font-light text-sm leading-relaxed">{principle.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Tier Section
function TierSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              <span className="gradient-text font-light">Pricing</span> Tiers
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              API integrations are available in our Scale and Enterprise tiers.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Scale Tier */}
          <motion.div
            className="p-8 rounded-2xl bg-black/40 border border-cyan-400/30 backdrop-blur-xl hover:border-cyan-400/50 transition-all duration-300"
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold text-cyan-400 mb-3">Scale Tier</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-white">$3K-5K</span>
              <span className="text-sm text-gray-500">7-10 days</span>
            </div>
            <p className="text-gray-300 mb-6 font-light">
              Perfect for connecting 2 platforms with standard integration needs.
            </p>
            <div className="space-y-3">
              {[
                '2 platform integrations included',
                'Bidirectional data sync',
                'Webhook implementation',
                'Error handling & retry logic',
                'Basic monitoring setup',
                'Documentation & training'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Enterprise Tier */}
          <motion.div
            className="p-8 rounded-2xl bg-gradient-to-br from-cyan-900/20 via-blue-900/20 to-violet-900/20 border border-blue-400/30 backdrop-blur-xl hover:border-blue-400/50 transition-all duration-300 relative overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute top-4 right-4 bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1 text-xs font-medium text-blue-400 uppercase">
              Recommended
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
              Enterprise Tier
            </h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-white">$6K-30K</span>
              <span className="text-sm text-gray-500">14-21 days</span>
            </div>
            <p className="text-gray-300 mb-6 font-light">
              For complex multi-platform integrations and custom API development.
            </p>
            <div className="space-y-3">
              {[
                'Unlimited integrations',
                'Custom API development',
                'Complex data transformations',
                'Advanced workflow automation',
                'Enterprise security & compliance',
                'Dedicated monitoring dashboard',
                'Priority support & maintenance'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/project"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500"
          >
            View All Packages <ArrowRight size={20} />
          </Link>
          <p className="text-xs text-gray-500 mt-4">
            Not sure which tier fits? Schedule a free integration audit.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// FAQ Section
function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: 'How long does an API integration take to build?',
      answer: 'Simple integrations between 2 platforms typically take 1-2 weeks. Complex multi-platform integrations with custom business logic can take 2-4 weeks. We provide detailed timelines after reviewing your specific requirements during the free audit.'
    },
    {
      question: 'What happens if the third-party API changes?',
      answer: 'We build integrations with version detection and graceful degradation. Our monitoring systems alert us to API changes before they cause issues. With our maintenance plans, we handle updates proactively - you will not notice anything except continued smooth operation.'
    },
    {
      question: 'How do you handle data security?',
      answer: 'All data transfers use TLS 1.3 encryption. We implement OAuth 2.0 for authentication where supported, never store credentials in code, and follow least-privilege access principles. Credentials are stored in secure vaults, not in your codebase.'
    },
    {
      question: 'Can you integrate systems without public APIs?',
      answer: 'Yes. We can build integrations using webhooks, direct database connections (with your permission), file-based transfers, or custom middleware. If data exists in a system, we can usually find a way to connect it securely.'
    },
    {
      question: 'Do you provide ongoing maintenance?',
      answer: 'Yes. Our monthly maintenance plans ($300-1,200/mo) include monitoring, error handling, API updates, and support. This ensures your integrations continue working reliably as the platforms you use evolve over time.'
    },
    {
      question: 'What if we need to add more integrations later?',
      answer: 'Our integrations are designed to be extensible. Adding new platform connections to an existing integration architecture is typically faster and less expensive than the initial build. We document everything for easy expansion.'
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Frequently Asked <span className="gradient-text font-light">Questions</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="border border-white/10 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * index }}
            >
              <button
                className="w-full p-6 flex items-center justify-between text-left bg-black/40 backdrop-blur-xl"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-white font-medium pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="p-6 pt-0 bg-black/40 backdrop-blur-xl">
                  <p className="text-gray-400 font-light leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Related Services Section
function RelatedServicesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const relatedServices = [
    {
      title: 'Automation Workflows',
      description: 'Take your integrations further with automated business processes.',
      href: '/services/integration-automation',
      icon: Zap
    },
    {
      title: 'Ecommerce Development',
      description: 'Full ecommerce solutions with built-in integrations.',
      href: '/services/ecommerce',
      icon: ShoppingCart
    },
    {
      title: 'Custom Development',
      description: 'When you need something built from scratch.',
      href: '/services/web-development',
      icon: Code2
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extralight mb-4 tracking-tight">
              Related <span className="gradient-text font-light">Services</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {relatedServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * index }}
            >
              <Link
                href={service.href}
                className="block p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group h-full"
              >
                <service.icon className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-medium text-white mb-2">{service.title}</h3>
                <p className="text-gray-400 font-light text-sm">{service.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  return (
    <section className="py-32 px-8 border-t border-slate-800/50 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
            Ready to <span className="gradient-text font-light">Connect Your Systems</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
            Stop copying data between platforms. Let us build integrations that keep
            your systems in sync automatically, reliably, and securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/project"
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500"
            >
              Connect Your Systems <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
            >
              Free Integration Audit <ArrowRight size={16} className="opacity-50" />
            </Link>
          </div>
          <p className="text-xs text-gray-600 mt-8 font-light">
            Free consultation | Scale: 2 integrations | Enterprise: Unlimited
          </p>

          {/* Trust Signals */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>99.9% uptime SLA</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Real-time sync</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Enterprise security</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
