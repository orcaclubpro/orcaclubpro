'use client'

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import {
  ArrowRight,
  Smartphone,
  Zap,
  Search,
  FileEdit,
  TrendingDown,
  AlertCircle,
  Users,
  CheckCircle2,
  Code2,
  Palette,
  Rocket,
  MessageSquare,
  Clock,
  ChevronDown,
  Monitor,
  Gauge,
  Shield,
  Globe,
  Layers,
  Settings
} from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"

export default function WebDesignContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section */}
      <ProblemSection />

      {/* Solution Section */}
      <SolutionSection />

      {/* Process Section */}
      <ProcessSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Tier Comparison */}
      <TierComparisonSection />

      {/* Technology Stack */}
      <TechnologySection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}

// Hero Section - "Modern web design that converts"
function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-8 relative z-10">
      <div className="max-w-6xl mx-auto text-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-cyan-400 text-sm mb-8">
            <Monitor className="w-4 h-4" />
            Flagship Service
          </div>
          <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
            Modern <span className="gradient-text font-light">Web Design</span> That Converts
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-4">
            Your website is often the first impression customers have of your business.
            An <strong className="text-white font-normal">outdated website</strong> costs you credibility, customers, and revenue every single day.
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto font-light mb-10">
            We design and build <strong className="text-white font-normal">fast, responsive, SEO-optimized websites</strong> that
            establish trust and convert visitors into customers.
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {[
              { stat: '3-5 Days', label: 'Launch Tier Delivery' },
              { stat: '< 2s', label: 'Page Load Time' },
              { stat: '100%', label: 'Mobile Responsive' },
              { stat: 'SEO', label: 'Optimized by Default' },
            ].map((item, index) => (
              <div key={index} className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl">
                <div className="text-2xl md:text-3xl font-light text-cyan-400 mb-1">{item.stat}</div>
                <div className="text-sm text-gray-400 font-light">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/packages"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:from-cyan-400/30 hover:to-blue-500/30 transition-all duration-300"
            >
              See Web Design Packages <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
            >
              Get a Free Quote <ArrowRight size={16} className="opacity-50" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Problem Section - Why outdated websites cost businesses money
function ProblemSection() {
  const problems = [
    {
      icon: TrendingDown,
      title: "High Bounce Rates",
      stat: "53%",
      description: "of mobile visitors leave if a page takes longer than 3 seconds to load. Slow, clunky websites hemorrhage potential customers before they even see what you offer.",
      impact: "Lost customers"
    },
    {
      icon: AlertCircle,
      title: "Lost Credibility",
      stat: "75%",
      description: "of consumers judge a company's credibility based on their website design. An outdated site signals an outdated business, causing visitors to choose competitors instead.",
      impact: "Damaged trust"
    },
    {
      icon: Smartphone,
      title: "Mobile Issues",
      stat: "60%+",
      description: "of all web traffic comes from mobile devices. If your site isn't mobile-responsive, you're invisible to the majority of potential customers actively searching for solutions.",
      impact: "Missed opportunities"
    },
    {
      icon: Search,
      title: "Poor SEO Rankings",
      stat: "0.63%",
      description: "of users click on results from the second page of Google. Without technical SEO optimization, your website is essentially hidden from the customers searching for you.",
      impact: "Zero visibility"
    }
  ]

  return (
    <section className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extralight mb-6 tracking-tight">
              Is Your Website <span className="gradient-text font-light">Costing You Business</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Outdated websites don't just look bad - they actively drive customers away.
              Here's what poor <strong className="text-white font-normal">web design</strong> is really costing your business.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {problems.map((problem, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-400/20 hover:border-red-400/40 transition-all duration-300 group h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-red-400/10">
                    <problem.icon className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-1">{problem.title}</h3>
                    <span className="text-sm text-red-400 font-mono">{problem.impact}</span>
                  </div>
                </div>
                <div className="text-4xl font-light text-red-400 mb-3">{problem.stat}</div>
                <p className="text-gray-400 font-light leading-relaxed">{problem.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="mt-16 text-center">
            <div className="inline-block p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
              <p className="text-lg text-gray-300 font-light">
                <strong className="text-white font-normal">The good news?</strong> These problems are fixable.
                Modern <strong className="text-cyan-400 font-normal">web design</strong> solves all of them.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Solution Section - ORCACLUB's approach
function SolutionSection() {
  const solutions = [
    {
      icon: Code2,
      title: "Modern Tech Stack",
      description: "We build with React and Next.js - the same frameworks powering Netflix, Airbnb, and TikTok. Your website loads instantly and ranks better on Google.",
      tech: "React, Next.js, TypeScript"
    },
    {
      icon: Smartphone,
      title: "Responsive-First Design",
      description: "Every pixel is designed mobile-first, then scaled up for larger screens. Your site looks stunning on any device, from smartphones to 4K monitors.",
      tech: "Mobile-first, Tailwind CSS"
    },
    {
      icon: Gauge,
      title: "Performance Obsessed",
      description: "Sub-2 second load times. Optimized images, lazy loading, and edge caching. Fast sites convert better, rank higher, and keep visitors engaged.",
      tech: "Core Web Vitals optimized"
    },
    {
      icon: FileEdit,
      title: "Easy Content Management",
      description: "Payload CMS gives you full control over your content. Update text, images, and pages yourself - no developer needed for day-to-day changes.",
      tech: "Payload CMS, headless"
    }
  ]

  return (
    <section className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extralight mb-6 tracking-tight">
              The ORCACLUB <span className="gradient-text font-light">Web Design</span> Approach
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              We don't just make websites look good - we engineer them for <strong className="text-white font-normal">performance, conversions, and growth</strong>.
              Every decision is backed by data and best practices.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="p-8 rounded-2xl bg-black/40 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 group h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-cyan-400/10 group-hover:bg-cyan-400/20 transition-colors">
                    <solution.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-1">{solution.title}</h3>
                    <span className="text-sm text-cyan-400/70 font-mono">{solution.tech}</span>
                  </div>
                </div>
                <p className="text-gray-400 font-light leading-relaxed">{solution.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Process Section - Discovery > Design > Development > Launch
function ProcessSection() {
  const steps = [
    {
      step: "01",
      title: "Discovery",
      duration: "Day 1",
      icon: MessageSquare,
      description: "We learn about your business, goals, target audience, and competitors. You share your vision; we translate it into a technical roadmap with clear deliverables.",
      deliverables: ["Requirements document", "Sitemap", "Project timeline"]
    },
    {
      step: "02",
      title: "Design",
      duration: "Days 1-2",
      icon: Palette,
      description: "Our designers create wireframes and mockups tailored to your brand. You see exactly how your site will look before we write any code. Revisions are included.",
      deliverables: ["Wireframes", "Visual mockups", "Design system"]
    },
    {
      step: "03",
      title: "Development",
      duration: "Days 2-4",
      icon: Code2,
      description: "We build your site with modern frameworks, implement responsive design, optimize performance, and integrate with your tools. Daily progress updates keep you informed.",
      deliverables: ["Functional website", "CMS setup", "Integrations"]
    },
    {
      step: "04",
      title: "Launch",
      duration: "Day 5",
      icon: Rocket,
      description: "Final testing across all devices and browsers. We deploy to production, configure hosting, set up analytics, and train your team on content management.",
      deliverables: ["Live website", "Training session", "Documentation"]
    }
  ]

  return (
    <section className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extralight mb-6 tracking-tight">
              Our <span className="gradient-text font-light">Web Design Process</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              A streamlined process that delivers results in days, not months.
              Transparent, collaborative, and designed for your success.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0" />

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div className="relative">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-black border-2 border-cyan-400 flex items-center justify-center mb-3 relative z-10">
                      <step.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="text-cyan-400 font-mono text-sm">{step.step}</div>
                  </div>

                  {/* Content card */}
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-medium text-white">{step.title}</h3>
                      <span className="text-xs text-cyan-400/70 font-mono bg-cyan-400/10 px-2 py-1 rounded">{step.duration}</span>
                    </div>
                    <p className="text-gray-400 font-light text-sm leading-relaxed mb-4">{step.description}</p>
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Deliverables:</div>
                      <ul className="space-y-1">
                        {step.deliverables.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <ScrollReveal delay={600}>
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400/10 border border-cyan-400/20 rounded-full">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-300 font-light">Average delivery: <strong className="text-white font-normal">3-5 days</strong> for Launch Tier</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Features Section - Responsive, Fast, SEO, Easy to Update
function FeaturesSection() {
  const features = [
    {
      icon: Smartphone,
      title: "Responsive Design",
      subtitle: "Mobile-First Approach",
      description: "Over 60% of web traffic comes from mobile devices. We design mobile-first, ensuring your site looks perfect on phones, then scale up for tablets and desktops. No pinching, no scrolling sideways - just seamless experiences on every screen size.",
      benefits: [
        "Perfect on all screen sizes (320px to 4K)",
        "Touch-optimized navigation and buttons",
        "Faster mobile load times",
        "Better Google rankings (mobile-first indexing)"
      ]
    },
    {
      icon: Zap,
      title: "Fast Loading",
      subtitle: "Core Web Vitals Optimized",
      description: "Google's Core Web Vitals directly impact your search rankings. We optimize for LCP (Largest Contentful Paint), FID (First Input Delay), and CLS (Cumulative Layout Shift). Result: sub-2 second load times that keep visitors engaged and Google happy.",
      benefits: [
        "Sub-2 second page loads",
        "Optimized images and lazy loading",
        "Edge caching via CDN",
        "Green scores on PageSpeed Insights"
      ]
    },
    {
      icon: Search,
      title: "SEO-Ready",
      subtitle: "Technical SEO Foundation",
      description: "A beautiful site is useless if no one can find it. We build with technical SEO baked in: semantic HTML, proper meta tags, structured data (JSON-LD), XML sitemaps, clean URLs, and blazing speed. Your site is primed to rank from day one.",
      benefits: [
        "Semantic HTML structure",
        "Meta tags and Open Graph data",
        "JSON-LD structured data",
        "XML sitemap and robots.txt"
      ]
    },
    {
      icon: FileEdit,
      title: "Easy to Update",
      subtitle: "Headless CMS Benefits",
      description: "Payload CMS gives you complete control without touching code. Update headlines, swap images, publish blog posts, and manage pages through an intuitive admin interface. Your team can make changes in minutes, not days waiting for a developer.",
      benefits: [
        "No coding required for content changes",
        "Intuitive visual editor",
        "Version history and drafts",
        "User roles and permissions"
      ]
    }
  ]

  return (
    <section className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extralight mb-6 tracking-tight">
              What Makes Our <span className="gradient-text font-light">Web Design</span> Different
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Every website we build includes these essential features that separate
              <strong className="text-white font-normal"> professional web design</strong> from amateur hour.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-8">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className={`grid md:grid-cols-2 gap-8 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className={`${index % 2 === 1 ? 'md:order-2' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-cyan-400/10">
                      <feature.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-medium text-white">{feature.title}</h3>
                      <span className="text-sm text-cyan-400/70">{feature.subtitle}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 font-light leading-relaxed mb-6">{feature.description}</p>
                </div>
                <div className={`p-6 rounded-2xl bg-black/40 border border-white/10 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-4">What You Get:</h4>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 font-light">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Tier Comparison - Launch vs Scale
function TierComparisonSection() {
  const tiers = [
    {
      name: "Launch Tier",
      price: "$1K-3K",
      timeline: "3-5 days",
      color: "cyan",
      bestFor: "Startups, small businesses, portfolio sites, landing pages",
      features: [
        { name: "Custom web design", included: true },
        { name: "Mobile responsive", included: true },
        { name: "Payload CMS setup", included: true },
        { name: "Basic SEO optimization", included: true },
        { name: "Managed hosting setup", included: true },
        { name: "Contact form", included: true },
        { name: "Analytics integration", included: false },
        { name: "Third-party integrations", included: false },
        { name: "Custom automation", included: false },
      ]
    },
    {
      name: "Scale Tier",
      price: "$3K-5K",
      timeline: "7-10 days",
      color: "blue",
      popular: true,
      bestFor: "Growing businesses needing integrations and advanced features",
      features: [
        { name: "Custom web design", included: true },
        { name: "Mobile responsive", included: true },
        { name: "Payload CMS setup", included: true },
        { name: "Advanced SEO optimization", included: true },
        { name: "Managed hosting setup", included: true },
        { name: "Contact form", included: true },
        { name: "Analytics integration", included: true },
        { name: "Up to 2 integrations", included: true },
        { name: "Custom automation", included: true },
      ]
    }
  ]

  return (
    <section className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extralight mb-6 tracking-tight">
              <span className="gradient-text font-light">Web Design</span> Packages
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Choose the tier that matches your needs. Both include our signature modern design
              and technology stack. Scale adds integrations and automation.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {tiers.map((tier, index) => (
            <ScrollReveal key={index} delay={index * 150}>
              <div className={`relative p-8 rounded-2xl border ${tier.popular ? 'bg-blue-500/5 border-blue-400/40' : 'bg-black/40 border-white/10'} hover:border-${tier.color}-400/60 transition-all duration-300`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 rounded-full text-xs font-medium text-white">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className={`text-2xl font-medium text-${tier.color}-400 mb-2`}>{tier.name}</h3>
                  <div className="text-4xl font-light text-white mb-1">{tier.price}</div>
                  <div className="text-sm text-gray-400">{tier.timeline} delivery</div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 mb-6">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Best For:</div>
                  <p className="text-sm text-gray-300 font-light">{tier.bestFor}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {feature.included ? (
                        <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-600 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-300' : 'text-gray-500'}>{feature.name}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/packages"
                  className={`block w-full py-4 rounded-full text-center font-medium transition-all duration-300 ${
                    tier.popular
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-cyan-400/20'
                      : 'border border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10'
                  }`}
                >
                  View Full Details
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="mt-12 text-center">
            <p className="text-gray-400 font-light mb-4">
              Need more? Our <strong className="text-white font-normal">Enterprise Tier</strong> ($6K-30K) includes
              Shopify integration, custom APIs, and dedicated admin dashboards.
            </p>
            <Link href="/packages" className="text-cyan-400 hover:underline inline-flex items-center gap-2">
              Compare all tiers <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Technology Stack Section
function TechnologySection() {
  const technologies = [
    {
      name: "React",
      description: "Component-based UI library for building interactive interfaces",
      category: "Frontend"
    },
    {
      name: "Next.js",
      description: "React framework with SSR, routing, and optimization built-in",
      category: "Framework"
    },
    {
      name: "TypeScript",
      description: "Type-safe JavaScript for reliable, maintainable code",
      category: "Language"
    },
    {
      name: "Tailwind CSS",
      description: "Utility-first CSS for rapid, consistent styling",
      category: "Styling"
    },
    {
      name: "Payload CMS",
      description: "Headless CMS for flexible, code-first content management",
      category: "CMS"
    },
    {
      name: "Vercel",
      description: "Edge deployment platform for instant global performance",
      category: "Hosting"
    }
  ]

  return (
    <section className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extralight mb-6 tracking-tight">
              Technology <span className="gradient-text font-light">Stack</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              We use the same modern technologies powering the world's best websites.
              Fast, secure, and built to scale with your business.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="flex flex-wrap justify-center gap-4">
            {technologies.map((tech, index) => (
              <div
                key={index}
                className="group px-6 py-4 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">{tech.name}</div>
                  <span className="text-xs text-gray-500 px-2 py-0.5 rounded bg-white/5">{tech.category}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{tech.description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="mt-12 text-center">
            <p className="text-gray-500 font-light">
              This stack is used by Netflix, Airbnb, Nike, and thousands of high-performance websites.
            </p>
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
      question: "How much does web design cost?",
      answer: "Our web design services start at $1,000-$3,000 for the Launch Tier (simple marketing sites, landing pages) and $3,000-$5,000 for the Scale Tier (sites with integrations and advanced features). Enterprise projects with Shopify, custom APIs, or complex functionality range from $6,000-$30,000. We provide transparent, fixed pricing after understanding your specific needs during a free consultation."
    },
    {
      question: "How long does it take to design and build a website?",
      answer: "Our Launch Tier websites are delivered in 3-5 days. Scale Tier projects with integrations take 7-10 days. Enterprise projects require 14-21 days. These timelines are significantly faster than traditional agencies (which typically take 3-6 months) because we use modern frameworks, proven templates, and efficient processes."
    },
    {
      question: "What is responsive web design and why does it matter?",
      answer: "Responsive web design ensures your website looks and functions perfectly on all devices - desktops, laptops, tablets, and smartphones. We use a mobile-first approach, designing for smaller screens first then scaling up. This is critical because over 60% of web traffic comes from mobile devices, and Google prioritizes mobile-friendly sites in search rankings."
    },
    {
      question: "Do you provide hosting and ongoing maintenance?",
      answer: "Yes. We offer managed hosting and maintenance packages starting at $300/month. This includes enterprise-grade hosting (Vercel, AWS, or your preferred platform), security updates, performance monitoring, content updates, and technical support. We also offer one-time deployment to your existing hosting if you prefer to manage it yourself."
    },
    {
      question: "Will my website be optimized for search engines (SEO)?",
      answer: "Absolutely. Every website includes technical SEO optimization: fast loading speeds (sub-2 second load times), proper meta tags and structured data, mobile-friendly design, clean URL structure, image optimization, and Core Web Vitals compliance. This provides a strong technical foundation. For ongoing SEO (content strategy, link building, keyword targeting), we offer dedicated SEO services."
    },
    {
      question: "Can you redesign my existing website?",
      answer: "Yes, website redesign is one of our core services. We analyze your current site's performance, identify issues affecting user experience and conversions, and rebuild it with modern technology. Most redesigns include improved design, faster performance, better mobile experience, and enhanced SEO - all while preserving your existing content and search engine equity."
    },
    {
      question: "What's included in the web design process?",
      answer: "Our process includes: Discovery (understanding your goals, audience, and requirements), Design (wireframes, mockups, and design system), Development (building the site with modern frameworks), and Launch (deployment, testing, and training). You receive daily progress updates throughout and a fully functional, content-managed website at the end."
    },
    {
      question: "Can I update the website myself after launch?",
      answer: "Yes! Every site we build includes Payload CMS, which provides an intuitive admin interface for managing content. You can update text, images, blog posts, and pages without any coding knowledge. We also provide training and documentation so your team feels confident making changes."
    }
  ]

  return (
    <section className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extralight mb-6 tracking-tight">
              <span className="gradient-text font-light">Web Design</span> FAQ
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Common questions about our web design and development services.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <ScrollReveal key={index} delay={index * 50}>
                <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300">
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
                      height: isOpen ? 'auto' : 0,
                      maxHeight: isOpen ? '500px' : 0
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

// CTA Section
function CTASection() {
  const relatedServices = [
    { name: "CMS Development", href: "/services/cms-development", icon: Layers },
    { name: "Hosting & Infrastructure", href: "/services/hosting-infrastructure", icon: Globe },
    { name: "Technical SEO", href: "/services/technical-seo", icon: Search },
  ]

  return (
    <section className="py-32 px-8 border-t border-slate-800/50 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
            Ready for a Website That <span className="gradient-text font-light">Works</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
            Stop losing customers to an outdated website. Get a modern, fast, mobile-friendly site
            that establishes trust and converts visitors into customers.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link
              href="/packages"
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500"
            >
              See Web Design Packages <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
            >
              Get a Free Quote <ArrowRight size={16} className="opacity-50" />
            </Link>
          </div>

          <p className="text-xs text-gray-600 mb-16 font-light">
            Free consultation | Fixed pricing | 3-5 day delivery | Modern tech stack
          </p>

          {/* Related Services */}
          <div className="pt-16 border-t border-slate-800/50">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-6">Related Services</p>
            <div className="flex flex-wrap justify-center gap-4">
              {relatedServices.map((service, index) => (
                <Link
                  key={index}
                  href={service.href}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-black/40 border border-white/10 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all duration-300"
                >
                  <service.icon className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300 font-light">{service.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
