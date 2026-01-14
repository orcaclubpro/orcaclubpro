'use client'

import Link from "next/link"
import {
  ArrowRight,
  Database,
  FileText,
  Users,
  Shield,
  Zap,
  CheckCircle,
  X,
  ChevronDown,
  Code2,
  Layers,
  Globe,
  Lock,
  Eye,
  History,
  Languages,
  Image,
  Settings,
  Puzzle
} from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import { useState } from "react"

// Problem points with traditional CMS
const problems = [
  {
    title: "Slow Page Loads",
    description: "Bloated plugins and database queries make your site crawl. Every second of delay costs you conversions."
  },
  {
    title: "Developer Bottleneck",
    description: "Need a simple text change? Wait for a developer. Traditional CMS creates friction between your team and your content."
  },
  {
    title: "Design Limitations",
    description: "Stuck with templates and themes. Want something custom? Good luck fighting against the system."
  },
  {
    title: "Security Vulnerabilities",
    description: "WordPress powers 40% of the web - and is targeted by 90% of CMS attacks. Plugins introduce new vulnerabilities constantly."
  }
]

// Headless CMS benefits
const headlessBenefits = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Static generation and edge caching deliver sub-second load times. Your content serves from the closest data center."
  },
  {
    icon: Puzzle,
    title: "Unlimited Flexibility",
    description: "Any frontend framework. Any design. No templates restricting your vision - just clean APIs and creative freedom."
  },
  {
    icon: Shield,
    title: "Enhanced Security",
    description: "Decoupled architecture means smaller attack surface. No exposed admin URLs. No plugin vulnerabilities."
  },
  {
    icon: Globe,
    title: "Omnichannel Ready",
    description: "One content source, infinite destinations. Website, mobile app, digital signage, IoT - all from one CMS."
  }
]

// Payload CMS features
const payloadFeatures = [
  {
    icon: Code2,
    title: "TypeScript Native",
    description: "Full type safety from database to frontend. Catch errors at compile time, not production."
  },
  {
    icon: Database,
    title: "Self-Hosted",
    description: "Your data, your servers, your control. No vendor lock-in, no surprise pricing increases."
  },
  {
    icon: Layers,
    title: "Open Source",
    description: "MIT licensed. Inspect the code, contribute improvements, extend freely without licensing fees."
  },
  {
    icon: Settings,
    title: "Highly Customizable",
    description: "Custom fields, hooks, access control, and admin components. Build exactly what you need."
  }
]

// CMS Features we build
const cmsFeatures = [
  {
    icon: Eye,
    title: "Visual Content Editing",
    description: "Rich text editors, block-based layouts, and live preview. Your team edits content visually, seeing exactly how it will appear."
  },
  {
    icon: FileText,
    title: "Custom Field Types",
    description: "Beyond text and images - product configurators, location pickers, pricing tables, and any structured data your business needs."
  },
  {
    icon: Users,
    title: "Multi-User Roles",
    description: "Editors, reviewers, admins - define who can see, edit, and publish what. Full audit trails for compliance."
  },
  {
    icon: History,
    title: "Versioning & Drafts",
    description: "Work on drafts without affecting live content. Roll back to any previous version. Schedule future publications."
  },
  {
    icon: Image,
    title: "Media Library",
    description: "Centralized asset management with automatic optimization. Responsive images, lazy loading, and CDN delivery built-in."
  },
  {
    icon: Languages,
    title: "Localization",
    description: "Multi-language content with field-level translations. Manage global sites from one admin panel."
  }
]

// WordPress vs Headless comparison
const comparisonData = [
  { feature: "Page Load Speed", wordpress: "2-5 seconds", headless: "< 1 second", wpGood: false },
  { feature: "Design Flexibility", wordpress: "Template-limited", headless: "Unlimited", wpGood: false },
  { feature: "Security", wordpress: "Frequent patches needed", headless: "Minimal attack surface", wpGood: false },
  { feature: "Content Editing", wordpress: "Plugin-dependent", headless: "Custom-built UX", wpGood: false },
  { feature: "Scalability", wordpress: "Server upgrades required", headless: "Scales infinitely", wpGood: false },
  { feature: "Multi-platform", wordpress: "Web only (mostly)", headless: "Any platform", wpGood: false },
  { feature: "Learning Curve", wordpress: "Familiar to many", headless: "Team training included", wpGood: true },
  { feature: "Plugin Ecosystem", wordpress: "Extensive (variable quality)", headless: "Custom integrations", wpGood: true },
]

// FAQ data
const faqs = [
  {
    question: "What is a headless CMS and how is it different from WordPress?",
    answer: "A headless CMS separates content management from how content is displayed. Unlike WordPress which bundles both together, a headless CMS stores your content and delivers it via API to any frontend - websites, mobile apps, kiosks, or IoT devices. This means faster sites, better security, and unlimited design flexibility."
  },
  {
    question: "Can you migrate our existing WordPress site to a headless CMS?",
    answer: "Yes, we specialize in WordPress migrations. We'll audit your existing content, map it to a new content model, migrate all data including media, and train your team on the new system. Most migrations take 1-2 weeks depending on content volume."
  },
  {
    question: "Why do you recommend Payload CMS over other options?",
    answer: "Payload CMS is our preferred choice because it's open source (no vendor lock-in), TypeScript-native (fewer bugs, better DX), self-hosted (you own your data), and highly customizable. It provides the flexibility of custom code with the convenience of a visual admin panel."
  },
  {
    question: "Will my team be able to edit content without developer help?",
    answer: "Absolutely. We build intuitive admin interfaces with visual editing, draft previews, and role-based permissions. Your marketing team can update content, create new pages, and publish changes without touching code. We also provide training and documentation."
  },
  {
    question: "How long does a CMS development project take?",
    answer: "Simple CMS setups can be done in 3-5 days with our Launch tier. More complex projects with custom content models, integrations, and migrations typically take 1-3 weeks. Enterprise projects with advanced workflows may take 2-4 weeks."
  },
  {
    question: "Is Payload CMS secure and scalable?",
    answer: "Yes. Payload CMS is self-hosted, meaning your data stays on your infrastructure. It includes built-in authentication, field-level access control, and supports enterprise-grade databases like MongoDB. It scales horizontally and handles millions of content items efficiently."
  }
]

export default function CmsContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section */}
      <ProblemSection />

      {/* Headless CMS Solution */}
      <HeadlessSolutionSection />

      {/* Why Payload CMS */}
      <PayloadSection />

      {/* CMS Features We Build */}
      <FeaturesSection />

      {/* WordPress vs Headless Comparison */}
      <ComparisonSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-8 relative z-10">
      <div className="max-w-6xl mx-auto text-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-cyan-400 text-sm mb-8">
            <Database className="w-4 h-4" />
            Headless CMS Experts
          </div>
          <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
            Content Management <span className="gradient-text font-light">Made Modern</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-4">
            Tired of fighting your <strong className="text-white font-normal">content management system</strong>?
            We build <strong className="text-white font-normal">headless CMS</strong> solutions that let you
            edit content easily, publish instantly, and design without limits.
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto font-light mb-10">
            Powered by <strong className="text-cyan-400 font-normal">Payload CMS</strong> - the open source,
            TypeScript-native CMS that puts you in control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/project"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:from-cyan-400/30 hover:to-blue-500/30 transition-all duration-300"
            >
              Get a Modern CMS <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/services/web-development"
              className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
            >
              Web Development <ArrowRight size={16} className="opacity-50" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              The <span className="text-red-400 font-light">Problem</span> with Traditional CMS
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              WordPress and legacy platforms were built for a different era.
              Today's businesses need more than a blogging tool.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {problems.map((problem, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="p-8 rounded-2xl bg-red-500/5 border border-red-400/20 backdrop-blur-xl hover:border-red-400/40 transition-all duration-300 group h-full">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-red-400/10 group-hover:bg-red-400/20 transition-colors">
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-3">{problem.title}</h3>
                    <p className="text-gray-400 font-light leading-relaxed">{problem.description}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function HeadlessSolutionSection() {
  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              The <span className="gradient-text font-light">Headless CMS</span> Solution
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Separate your content from presentation. Gain speed, security, and freedom.
            </p>
          </div>
        </ScrollReveal>

        {/* Architecture Diagram */}
        <ScrollReveal delay={200}>
          <div className="mb-16 p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
                  <Database className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Content Layer</h3>
                <p className="text-sm text-gray-400 font-light">
                  Your content lives in a structured database, managed through a custom admin panel
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="h-0.5 w-12 bg-gradient-to-r from-transparent to-cyan-400/50 hidden md:block" />
                  <div className="w-16 h-16 rounded-xl bg-blue-400/10 border border-blue-400/30 flex items-center justify-center">
                    <Code2 className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="h-0.5 w-12 bg-gradient-to-l from-transparent to-cyan-400/50 hidden md:block" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">API Layer</h3>
                <p className="text-sm text-gray-400 font-light">
                  REST & GraphQL APIs deliver content to any platform instantly
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-indigo-400/10 border border-indigo-400/30 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Presentation Layer</h3>
                <p className="text-sm text-gray-400 font-light">
                  Any frontend: React, mobile apps, digital signs, IoT devices
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {headlessBenefits.map((benefit, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group h-full">
                <benefit.icon className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-medium text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-400 font-light leading-relaxed">{benefit.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function PayloadSection() {
  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-cyan-400 text-sm mb-6">
              Our Stack Differentiator
            </div>
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Why <span className="gradient-text font-light">Payload CMS</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              ORCACLUB is built on Payload CMS. We know it inside and out because we use it every day.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {payloadFeatures.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-400/5 to-blue-500/5 border border-cyan-400/20 backdrop-blur-xl hover:border-cyan-400/40 transition-all duration-300 group h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-cyan-400/10 group-hover:bg-cyan-400/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 font-light leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl text-center">
            <p className="text-lg text-gray-300 font-light mb-4">
              We also work with <span className="text-white font-normal">Sanity</span>,{" "}
              <span className="text-white font-normal">Contentful</span>,{" "}
              <span className="text-white font-normal">Strapi</span>, and other{" "}
              <span className="text-white font-normal">headless CMS platforms</span> based on your needs.
            </p>
            <p className="text-gray-500 font-light">
              Already using a CMS? We can integrate, extend, or migrate.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              CMS Features <span className="gradient-text font-light">We Build</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Every CMS we deliver includes the tools your team needs to manage content independently.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cmsFeatures.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 75}>
              <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group h-full">
                <feature.icon className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComparisonSection() {
  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              <span className="text-gray-400">WordPress</span> vs{" "}
              <span className="gradient-text font-light">Headless CMS</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              See why modern businesses are making the switch.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 text-gray-400 font-light border-b border-slate-800">Feature</th>
                  <th className="text-center p-4 text-gray-400 font-light border-b border-slate-800">WordPress</th>
                  <th className="text-center p-4 text-cyan-400 font-light border-b border-slate-800">Headless CMS</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-light">{row.feature}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-2 ${row.wpGood ? 'text-gray-300' : 'text-red-400'}`}>
                        {!row.wpGood && <X className="w-4 h-4" />}
                        <span className="font-light">{row.wordpress}</span>
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-2 text-cyan-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-light">{row.headless}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="mt-8 p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl text-center">
            <p className="text-gray-400 font-light">
              <strong className="text-white font-normal">Note:</strong> WordPress is still excellent for blogs
              and simple sites. But if you need speed, security, and flexibility,{" "}
              <span className="text-cyan-400">headless is the future</span>.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Frequently Asked <span className="gradient-text font-light">Questions</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Common questions about CMS development and migration.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <ScrollReveal key={index} delay={index * 50}>
                <div className="rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="text-lg font-medium text-white pr-8">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-cyan-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isOpen ? '500px' : 0,
                      opacity: isOpen ? 1 : 0
                    }}
                  >
                    <div className="px-6 pb-5 text-gray-400 font-light leading-relaxed">
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
  )
}

function CTASection() {
  return (
    <section className="py-32 px-8 border-t border-slate-800/50 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
            Ready for a <span className="gradient-text font-light">Modern CMS</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
            Stop fighting your content management system. Get a{" "}
            <strong className="text-white font-normal">headless CMS</strong> that works the way you do.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link
              href="/project"
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500"
            >
              Get a Modern CMS <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
            >
              Discuss Your Project <ArrowRight size={16} className="opacity-50" />
            </Link>
          </div>
          <p className="text-xs text-gray-600 font-light">
            Free consultation | CMS setup starting at Launch tier ($1K-3K) | Migrations available
          </p>
        </ScrollReveal>

        {/* Related Services */}
        <ScrollReveal delay={200}>
          <div className="mt-16 pt-16 border-t border-slate-800/50">
            <p className="text-sm text-gray-500 mb-6">Related Services</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/services/web-development"
                className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300 text-gray-300 hover:text-white font-light"
              >
                Web Development
              </Link>
              <Link
                href="/services/integration-automation"
                className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300 text-gray-300 hover:text-white font-light"
              >
                API Integrations
              </Link>
              <Link
                href="/services/ecommerce"
                className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300 text-gray-300 hover:text-white font-light"
              >
                Ecommerce Development
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
