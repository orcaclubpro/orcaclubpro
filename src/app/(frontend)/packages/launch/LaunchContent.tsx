"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Clock,
  Rocket,
  ChevronDown,
  Monitor,
  Smartphone,
  Shield,
  Search,
  FileText,
  GraduationCap,
  Server,
  Building2,
  Briefcase,
  Store,
  Users,
  Zap
} from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import { cn } from "@/lib/utils"

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
        <span className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors pr-4">
          {question}
        </span>
        <ChevronDown className={cn(
          "w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-96 pb-6" : "max-h-0"
      )}>
        <p className="text-gray-300 font-light leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
  delay?: number
}

function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <ScrollReveal delay={delay}>
      <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 h-full">
        <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
          <Icon className="w-6 h-6 text-cyan-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 font-light leading-relaxed">{description}</p>
      </div>
    </ScrollReveal>
  )
}

interface IdealForCardProps {
  icon: React.ElementType
  title: string
  description: string
  delay?: number
}

function IdealForCard({ icon: Icon, title, description, delay = 0 }: IdealForCardProps) {
  return (
    <ScrollReveal delay={delay}>
      <div className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-cyan-400/5 to-blue-500/5 border border-cyan-400/20 backdrop-blur-xl">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-400 font-light">{description}</p>
        </div>
      </div>
    </ScrollReveal>
  )
}

export default function LaunchContent() {
  const features = [
    {
      icon: Monitor,
      title: "CMS Setup (Payload CMS)",
      description: "Modern headless CMS for easy content management. Update your site without touching code."
    },
    {
      icon: Smartphone,
      title: "Responsive Design",
      description: "Mobile-first design that looks perfect on phones, tablets, and desktops."
    },
    {
      icon: Server,
      title: "Hosting Included",
      description: "Professional hosting with fast load times. We handle all the technical details."
    },
    {
      icon: Shield,
      title: "SSL Certificate",
      description: "Secure HTTPS connection included. Build trust and improve SEO rankings."
    },
    {
      icon: Search,
      title: "Basic SEO Setup",
      description: "Meta tags, sitemaps, and search engine optimization fundamentals configured."
    },
    {
      icon: FileText,
      title: "Content Migration",
      description: "We transfer your existing content to the new site. No data left behind."
    },
    {
      icon: GraduationCap,
      title: "Training Session",
      description: "Hands-on walkthrough so you can confidently manage your new website."
    }
  ]

  const notIncluded = [
    "Third-party integrations (Stripe, CRM, etc.)",
    "Advanced analytics setup",
    "Automation workflows",
    "Custom API development",
    "E-commerce functionality",
    "Multi-language support"
  ]

  const idealFor = [
    {
      icon: Rocket,
      title: "Startups Needing Web Presence Quickly",
      description: "Launch your MVP site fast and focus on building your business."
    },
    {
      icon: Building2,
      title: "Small Businesses Updating Old Sites",
      description: "Replace outdated websites with modern, mobile-friendly design."
    },
    {
      icon: Briefcase,
      title: "Professional Services",
      description: "Lawyers, consultants, accountants who need a credible online presence."
    },
    {
      icon: Store,
      title: "Local Businesses Going Digital",
      description: "Restaurants, salons, contractors making their first website."
    }
  ]

  const faqs: FAQItemProps[] = [
    {
      question: "How long does the Launch package take?",
      answer: "We deliver your complete website in 3-5 business days from project kickoff. This includes CMS setup, design implementation, content migration, and a training session. Development begins within 48 hours of your down payment."
    },
    {
      question: "What determines the price within the $1K-3K range?",
      answer: "The price varies based on the number of pages, content complexity, and any custom design requirements. A simple 5-page site starts at $1,000, while a more comprehensive 15+ page site with custom layouts would be closer to $3,000. We provide a clear quote after understanding your needs."
    },
    {
      question: "Do I need technical knowledge to update my website?",
      answer: "Not at all. Payload CMS provides an intuitive admin interface where you can add pages, upload images, and edit content. Your package includes a training session where we walk you through everything step by step."
    },
    {
      question: "Is hosting really included?",
      answer: "Yes, professional hosting is included. We handle domain configuration, SSL certificate installation, and ongoing hosting. You own everything - we provide full account transfers so you have complete control."
    },
    {
      question: "What if I need integrations later?",
      answer: "No problem! The Launch package is built on the same modern tech stack as our Scale and Enterprise tiers. When you're ready for integrations, analytics, or advanced features, we can seamlessly upgrade your site without rebuilding from scratch."
    },
    {
      question: "Can you match my existing brand?",
      answer: "Absolutely. We design your site to match your brand colors, fonts, and style. If you don't have brand guidelines yet, we can help establish a cohesive visual identity during the design phase."
    }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Breadcrumb Navigation */}
      <section className="relative z-10 pt-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/project"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm font-light"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Packages
          </Link>
        </div>
      </section>

      {/* SECTION 1: HERO */}
      <section className="relative z-10 pt-8 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center">
              {/* Package Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full mb-6">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Launch Package</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extralight mb-6 tracking-tight">
                Launch Your <span className="gradient-text font-light">Website</span>
                <br />in Days, Not Months
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 font-light mb-8 max-w-3xl mx-auto leading-relaxed">
                Everything you need to go live fast. CMS, hosting, responsive design, and training included.
              </p>

              {/* Pricing and Timeline */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 border border-cyan-400/30 rounded-xl">
                  <span className="text-4xl font-extralight text-white">$1K-3K</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg font-medium">3-5 Day Delivery</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/contact?tier=launch"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300"
              >
                Start Launch Project <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="mt-6 text-sm text-gray-500 font-light">
                Free consultation | No commitment | Start in 48 hours
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 2: WHAT'S INCLUDED */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                What's <span className="gradient-text font-light">Included</span>
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                Everything you need to launch a professional website
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 50}
              />
            ))}
          </div>

          {/* All Packages Include */}
          <ScrollReveal>
            <div className="mt-12 p-8 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl text-center">
              <p className="text-sm text-gray-300 font-light leading-relaxed">
                <span className="font-medium text-cyan-400">All packages also include:</span> Free consultation, brand-aligned design, documentation, full account transfers, transparent contracts, and direct developer access
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 3: IDEAL FOR */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight text-white">
                Ideal <span className="gradient-text font-light">For</span>
              </h2>
              <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
                The Launch package is perfect for businesses that need to move fast
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {idealFor.map((item, index) => (
              <IdealForCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: WHAT'S NOT INCLUDED (Transparency) */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="p-8 md:p-12 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-extralight mb-4 tracking-tight text-white">
                  What's <span className="text-gray-400 font-light">Not</span> Included
                </h2>
                <p className="text-gray-400 font-light">
                  We believe in transparency. Here's what the Launch package doesn't include:
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {notIncluded.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400 text-sm font-light">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/10 text-center">
                <p className="text-gray-300 font-light mb-4">
                  Need integrations, analytics, or automation?
                </p>
                <Link
                  href="/packages/scale"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  <Users className="w-4 h-4" />
                  Explore Scale Package ($3K-5K) <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 5: UPGRADE PATH */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="relative p-8 md:p-12 rounded-2xl bg-gradient-to-r from-cyan-400/10 to-blue-500/10 border border-cyan-400/30 backdrop-blur-xl overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-extralight mb-4 tracking-tight text-white">
                    Ready to <span className="gradient-text font-light">Scale</span>?
                  </h2>
                  <p className="text-gray-300 font-light leading-relaxed mb-6">
                    Need integrations, advanced analytics, or automation workflows? The Scale package builds on Launch with 2 custom integrations, GA4 analytics, form automation, and email marketing integration.
                  </p>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-3xl font-extralight text-cyan-400">$3K-5K</div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      7-10 days
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    "Everything in Launch",
                    "2 Custom Integrations (Stripe, CRM, etc.)",
                    "Advanced Analytics (GA4, tracking)",
                    "Form Automation",
                    "Email Marketing Integration"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm font-light">{feature}</span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Link
                      href="/packages/scale"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400/20 border border-cyan-400/40 rounded-full text-cyan-400 hover:bg-cyan-400/30 hover:border-cyan-400/60 transition-all duration-300 text-sm font-medium"
                    >
                      View Scale Package <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 6: FAQ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight text-center mb-16 tracking-tight text-white">
              Launch Package <span className="gradient-text font-light">FAQ</span>
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
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full">
                <Rocket className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">Ready to Launch?</span>
              </div>
            </div>

            <h2 className="text-4xl md:text-6xl font-extralight mb-8 tracking-tight text-white">
              Start Your <span className="gradient-text font-light">Launch</span> Project
            </h2>

            <p className="text-xl text-gray-400 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              Get a professional website in 3-5 days. Book your free consultation and let's discuss your project.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/contact?tier=launch"
                className="px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300"
              >
                Start Launch Project
              </Link>
              <Link
                href="/project"
                className="px-10 py-5 bg-white/5 border border-white/20 rounded-full text-lg font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                Compare All Packages
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 font-light">
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
