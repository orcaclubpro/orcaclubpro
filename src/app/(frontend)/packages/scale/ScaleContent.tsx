"use client"

import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  Zap,
  BarChart3,
  Settings,
  RefreshCw,
  Search,
  Gauge,
  Layers,
  Headphones,
  TrendingUp,
  Users,
  CreditCard,
  Mail,
  Calendar,
  Link2,
  Sparkles,
} from "lucide-react"

// Breadcrumb Component
function Breadcrumbs() {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex items-center gap-2 text-sm text-gray-400">
        <li>
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Home
          </Link>
        </li>
        <ChevronRight className="w-4 h-4" />
        <li>
          <Link href="/project" className="hover:text-cyan-400 transition-colors">
            Project Tiers
          </Link>
        </li>
        <ChevronRight className="w-4 h-4" />
        <li>
          <span className="text-cyan-400">Scale Package</span>
        </li>
      </ol>
    </nav>
  )
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-6" : "max-h-0"
        }`}
      >
        <p className="text-gray-300 font-light leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

// Integration Card Component
function IntegrationCard({
  icon: Icon,
  name,
  description,
}: {
  icon: React.ElementType
  name: string
  description: string
}) {
  return (
    <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{name}</h3>
      <p className="text-sm text-gray-400 font-light">{description}</p>
    </div>
  )
}

export default function ScaleContent() {
  const launchFeatures = [
    "Headless CMS Setup (Payload/Sanity)",
    "Infrastructure Setup (hosting, domain, SSL)",
    "Mobile Responsive Design",
    "SEO Configuration",
    "Brand-Aligned Custom Design",
  ]

  const scaleAdditions = [
    { icon: Link2, text: "2 Third-Party Integrations", highlight: true },
    { icon: BarChart3, text: "Google Analytics + Tag Manager Setup", highlight: true },
    { icon: RefreshCw, text: "Marketing Automation Setup", highlight: true },
    { icon: Search, text: "Technical SEO Optimization", highlight: false },
    { icon: Gauge, text: "Performance Optimization", highlight: false },
    { icon: Layers, text: "Advanced CMS Configuration", highlight: false },
    { icon: Headphones, text: "Priority Support", highlight: false },
  ]

  const integrations = [
    { icon: Users, name: "HubSpot / Salesforce", description: "CRM sync for lead management and sales pipeline" },
    { icon: Mail, name: "Mailchimp / Klaviyo", description: "Email marketing automation and campaigns" },
    { icon: CreditCard, name: "Stripe / PayPal", description: "Payment processing and checkout flows" },
    { icon: Zap, name: "Zapier Automation", description: "Connect 5,000+ apps and automate workflows" },
    { icon: Calendar, name: "Calendar Booking", description: "Calendly, Cal.com, or custom booking systems" },
    { icon: TrendingUp, name: "Analytics Tools", description: "Mixpanel, Segment, or custom dashboards" },
  ]

  const idealFor = [
    {
      title: "Growing Businesses Needing Integrations",
      description: "Connect your website to the tools you already use for seamless operations",
    },
    {
      title: "Marketing Teams Wanting Analytics",
      description: "Get the data you need to make informed decisions and optimize campaigns",
    },
    {
      title: "Businesses Automating Workflows",
      description: "Reduce manual work with smart automation between your systems",
    },
    {
      title: "Companies Connecting CRM/Tools",
      description: "Sync your website with HubSpot, Salesforce, or other business tools",
    },
  ]

  const faqs = [
    {
      question: "What integrations are included in the Scale package?",
      answer:
        "The Scale package includes 2 third-party integrations of your choice. Popular options include HubSpot, Salesforce, Mailchimp, Klaviyo, Stripe, PayPal, Zapier automation, and calendar booking systems. We'll help you choose the integrations that best fit your business needs.",
    },
    {
      question: "How is Scale different from the Launch package?",
      answer:
        "Scale includes everything in Launch (headless CMS, hosting, responsive design, SEO configuration) plus 2 custom integrations, Google Analytics + Tag Manager setup, marketing automation, technical SEO optimization, performance optimization, advanced CMS configuration, and priority support.",
    },
    {
      question: "What if I need more than 2 integrations?",
      answer:
        "If you need more than 2 integrations, Shopify e-commerce, or custom API development, we recommend our Enterprise package. Enterprise includes unlimited integrations and more complex system architecture.",
    },
    {
      question: "How long does the Scale package take to deliver?",
      answer:
        "The Scale package is delivered in 7-10 business days from project kickoff. Development begins within 48 hours of your down payment. We provide daily progress updates throughout the project.",
    },
    {
      question: "What analytics and tracking is included?",
      answer:
        "We set up Google Analytics 4 (GA4) with full e-commerce tracking if applicable, Google Tag Manager for flexible tag deployment, conversion tracking for your key actions, and custom event tracking for user interactions.",
    },
    {
      question: "Do you provide ongoing support after launch?",
      answer:
        "Scale package includes priority support during and after launch. We also offer monthly maintenance packages (Essential, Growth, and Partner Care) for ongoing updates, security patches, and performance monitoring.",
    },
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <Breadcrumbs />
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="text-center">
              {/* Most Popular Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-sm font-bold text-black uppercase tracking-wider mb-8">
                <Sparkles className="w-4 h-4" />
                Most Popular
                <Sparkles className="w-4 h-4" />
              </div>

              <h1 className="text-5xl md:text-7xl font-extralight mb-6 tracking-tight">
                <span className="gradient-text font-light">Scale</span> Your Online Presence
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 font-light mb-8 max-w-3xl mx-auto leading-relaxed">
                Everything in Launch, plus integrations, analytics, and automation for growing businesses.
              </p>

              {/* Pricing & Timeline */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 border border-cyan-400/30 rounded-full">
                  <span className="text-4xl font-extralight text-white">$3K-5K</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg font-light">7-10 Day Delivery</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/contact?tier=scale"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-lg font-bold text-black hover:shadow-2xl hover:shadow-cyan-400/30 transition-all duration-300"
              >
                Choose Scale <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="mt-6 text-sm text-gray-500 font-light">
                Free 30-min consultation | Start in 48 hours
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                What's <span className="gradient-text font-light">Included</span>
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                Build on the Launch foundation with powerful integrations and optimization
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Launch Foundation */}
            <ScrollReveal delay={100}>
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-gray-400 uppercase tracking-wider">
                    From Launch
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">Foundation Included</h3>
                <div className="space-y-4">
                  {launchFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-400 font-light">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Scale Additions */}
            <ScrollReveal delay={200}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-blue-500/10 border border-cyan-400/30 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-3 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-xs font-bold text-black uppercase tracking-wider">
                    Scale Exclusive
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">Plus These Additions</h3>
                <div className="space-y-4">
                  {scaleAdditions.map((addition, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          addition.highlight
                            ? "bg-gradient-to-br from-cyan-400/30 to-blue-500/30 border border-cyan-400/50"
                            : "bg-white/10"
                        }`}
                      >
                        <addition.icon
                          className={`w-4 h-4 ${addition.highlight ? "text-cyan-400" : "text-gray-400"}`}
                        />
                      </div>
                      <span
                        className={`font-light mt-1 ${
                          addition.highlight ? "text-white font-medium" : "text-gray-300"
                        }`}
                      >
                        {addition.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Popular Integrations Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Popular <span className="gradient-text font-light">Integrations</span>
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                Choose any 2 integrations to connect your website with your business tools
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <IntegrationCard {...integration} />
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={600}>
            <div className="text-center mt-12 p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl">
              <p className="text-sm text-gray-300 font-light">
                <span className="text-cyan-400 font-medium">Need a different integration?</span> We can connect
                to virtually any API or third-party service. Just ask during your consultation.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Ideal For Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Ideal <span className="gradient-text font-light">For</span>
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                Scale is perfect for businesses ready to grow with smart integrations
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {idealFor.map((item, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-400 font-light">{item.description}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Upgrade Path Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="p-10 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/30 backdrop-blur-xl text-center">
              <h3 className="text-3xl font-extralight text-white mb-4">
                Need More <span className="text-indigo-400 font-light">Power</span>?
              </h3>
              <p className="text-lg text-gray-300 font-light mb-8 max-w-2xl mx-auto">
                If you need Shopify e-commerce, custom APIs, unlimited integrations, or enterprise-level
                architecture, check out our Enterprise package.
              </p>
              <Link
                href="/packages/enterprise"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/20 rounded-full text-lg font-medium text-white hover:bg-white/10 hover:border-indigo-400/50 transition-all duration-300"
              >
                Explore Enterprise <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight text-center mb-16 tracking-tight text-white">
              Frequently Asked <span className="gradient-text font-light">Questions</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
              {faqs.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Compare Tiers Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Compare <span className="gradient-text font-light">Packages</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Launch */}
            <ScrollReveal delay={100}>
              <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white mb-2">Launch</h3>
                <div className="text-3xl font-extralight text-gray-300 mb-2">$1K-3K</div>
                <div className="text-sm text-gray-500 mb-4">3-5 Day Delivery</div>
                <p className="text-sm text-gray-400 font-light mb-6">
                  Perfect for simple sites and MVPs
                </p>
                <Link
                  href="/packages/launch"
                  className="block text-center py-3 border border-white/20 rounded-full text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                >
                  View Launch
                </Link>
              </div>
            </ScrollReveal>

            {/* Scale (Highlighted) */}
            <ScrollReveal delay={200}>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-blue-500/10 border-2 border-cyan-400/50 backdrop-blur-xl relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-xs font-bold text-black">
                  MOST POPULAR
                </div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Scale</h3>
                <div className="text-3xl font-extralight text-white mb-2">$3K-5K</div>
                <div className="text-sm text-cyan-400 mb-4">7-10 Day Delivery</div>
                <p className="text-sm text-gray-300 font-light mb-6">
                  Integrations, analytics & automation
                </p>
                <Link
                  href="/contact?tier=scale"
                  className="block text-center py-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-sm font-bold text-black hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
                >
                  Choose Scale
                </Link>
              </div>
            </ScrollReveal>

            {/* Enterprise */}
            <ScrollReveal delay={300}>
              <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <div className="text-3xl font-extralight text-gray-300 mb-2">$6K-30K</div>
                <div className="text-sm text-gray-500 mb-4">14-21 Day Delivery</div>
                <p className="text-sm text-gray-400 font-light mb-6">
                  Shopify, custom APIs, complex systems
                </p>
                <Link
                  href="/packages/enterprise"
                  className="block text-center py-3 border border-white/20 rounded-full text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                >
                  View Enterprise
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-extralight mb-8 tracking-tight text-white">
              Ready to <span className="gradient-text font-light">Scale</span>?
            </h2>
            <p className="text-xl text-gray-300 font-light mb-10 max-w-2xl mx-auto">
              Get the integrations and analytics your growing business needs. Start with a free consultation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/contact?tier=scale"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-lg font-bold text-black hover:shadow-2xl hover:shadow-cyan-400/30 transition-all duration-300"
              >
                Choose Scale <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/project"
                className="inline-flex items-center gap-2 px-10 py-5 bg-white/5 border border-white/20 rounded-full text-lg font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                View All Packages
              </Link>
            </div>

            <p className="text-sm text-gray-500 font-light">
              Free 30-min consultation | 7-10 day delivery | Priority support included
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
