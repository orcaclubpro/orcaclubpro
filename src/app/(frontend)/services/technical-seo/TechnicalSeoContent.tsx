"use client"

import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { motion, useInView } from "motion/react"
import { useState, useEffect, useRef } from "react"
import {
  ArrowRight,
  Search,
  Code2,
  Zap,
  CheckCircle2,
  XCircle,
  Globe,
  FileCode,
  Gauge,
  LayoutGrid,
  FileText,
  Settings,
  Smartphone,
  Timer,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Eye,
  MousePointer,
  Move,
  Server,
  Map,
  Bot,
  Share2
} from "lucide-react"

export default function TechnicalSeoContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section */}
      <ProblemSection />

      {/* What We Do Section */}
      <WhatWeDoSection />

      {/* What We Don't Do Section */}
      <WhatWeDontDoSection />

      {/* Schema Markup Section */}
      <SchemaMarkupSection />

      {/* Core Web Vitals Section */}
      <CoreWebVitalsSection />

      {/* Technical SEO Checklist */}
      <ChecklistSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />

      {/* Related Services */}
      <RelatedServicesSection />
    </div>
  )
}

// Hero Section
function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="pt-32 pb-20 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Technical SEO Implementation
            </span>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-6">
              Technical SEO That <span className="gradient-text font-light">Actually Works</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              We build SEO-ready websites with proper technical foundations. Schema markup, Core Web Vitals, structured data - implemented correctly from day one.
            </p>
          </div>
        </ScrollReveal>

        {/* Key Differentiator */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-semibold text-white mb-3">
                  Implementation, Not Retainers
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  We do <span className="text-cyan-400 font-medium">technical SEO implementation</span> - building the infrastructure that helps search engines find and understand your content. We don't do monthly SEO management, content writing, or link building campaigns.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                  <Code2 className="w-12 h-12 text-cyan-400" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
        >
          {[
            { label: 'Schema Types', value: '8+', icon: FileCode },
            { label: 'Avg. Speed Score', value: '95+', icon: Gauge },
            { label: 'Mobile Optimized', value: '100%', icon: Smartphone },
            { label: 'Included Free', value: 'All Tiers', icon: CheckCircle2 }
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 text-center"
            >
              <stat.icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Problem Section
function ProblemSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Beautiful Websites That <span className="text-red-400 font-light">Nobody Can Find</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Most agencies build stunning websites that search engines can't understand. Without proper technical SEO, you're invisible to Google.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Without Technical SEO */}
          <motion.div
            className="bg-slate-900/60 backdrop-blur-xl border border-red-400/20 rounded-2xl p-8"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-red-400/10">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Without Technical SEO</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Search engines can\'t understand your content',
                'No rich snippets in search results',
                'Slow loading kills your rankings',
                'Mobile users bounce immediately',
                'Google can\'t crawl your pages properly',
                'Competitors outrank you by default'
              ].map((item, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-gray-400"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* With Technical SEO */}
          <motion.div
            className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-cyan-400/10">
                <CheckCircle2 className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">With Technical SEO</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Schema markup tells Google what you do',
                'Rich snippets make you stand out in results',
                'Fast loading improves rankings and UX',
                'Mobile-first design ranks higher',
                'Proper sitemaps ensure full indexing',
                'Technical foundation supports future growth'
              ].map((item, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-gray-300"
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// What We Do Section
function WhatWeDoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const services = [
    {
      icon: FileCode,
      title: 'Schema Markup & Structured Data',
      description: 'JSON-LD implementation for Organization, LocalBusiness, Service, FAQ, Product, and Article schema. Help search engines understand your content.'
    },
    {
      icon: Gauge,
      title: 'Core Web Vitals Optimization',
      description: 'LCP, INP, and CLS optimization. Fast loading, responsive interactions, and stable layouts that Google rewards with better rankings.'
    },
    {
      icon: LayoutGrid,
      title: 'Site Architecture & URL Structure',
      description: 'Clean, logical URL structures with proper hierarchy. Breadcrumbs, canonical tags, and internal linking that makes sense to users and bots.'
    },
    {
      icon: Map,
      title: 'XML Sitemaps & Robots.txt',
      description: 'Auto-generated sitemaps that update with your content. Properly configured robots.txt to guide crawler behavior.'
    },
    {
      icon: Search,
      title: 'Google Search Console Setup',
      description: 'Complete GSC configuration, sitemap submission, indexing requests, and initial performance baseline. You launch with tracking in place.'
    },
    {
      icon: FileText,
      title: 'Meta Tags & Open Graph',
      description: 'SEO-optimized title tags, meta descriptions, and OG tags for every page. Social sharing that looks professional.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimization',
      description: 'Mobile-first responsive design that passes Google\'s mobile-friendly test. Touch-friendly interfaces and appropriate viewport settings.'
    },
    {
      icon: Zap,
      title: 'Page Speed Optimization',
      description: 'Image optimization, code splitting, lazy loading, and modern build processes. Sub-2-second load times that convert.'
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Technical Implementation
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              What We <span className="gradient-text font-light">Build</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Every website we create includes these technical SEO foundations. It's not an add-on - it's how we build.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-500 group"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="p-3 rounded-lg bg-cyan-400/10 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <service.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{service.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// What We Don't Do Section
function WhatWeDontDoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const dontDo = [
    {
      title: 'Monthly SEO Retainers',
      description: 'We build your foundation, then you own it. No ongoing monthly fees for "SEO management."'
    },
    {
      title: 'Content Writing / Blogging',
      description: 'We set up your blog structure, but we don\'t write your content or manage editorial calendars.'
    },
    {
      title: 'Link Building Campaigns',
      description: 'We implement proper internal linking, but we don\'t do outreach or backlink acquisition.'
    },
    {
      title: 'Keyword Research Services',
      description: 'We optimize for keywords you provide, but we don\'t do in-depth keyword strategy research.'
    },
    {
      title: 'Ongoing SEO Management',
      description: 'After launch, you have everything you need. We don\'t charge for monthly "optimization."'
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full text-xs font-medium text-amber-400 uppercase tracking-wider mb-6">
              Transparency
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              What We <span className="text-amber-400 font-light">Don't</span> Do
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              We believe in being upfront. Here's what's outside our scope so you know exactly what you're getting.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {dontDo.map((item, index) => (
            <motion.div
              key={item.title}
              className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="flex items-start gap-4">
                <XCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-500 text-sm font-light">
            Need ongoing SEO services? We can recommend trusted partners who specialize in content and link building.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Schema Markup Section
function SchemaMarkupSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const schemaTypes = [
    {
      name: 'Organization',
      description: 'Company name, logo, contact info, social profiles',
      useCase: 'Every business website'
    },
    {
      name: 'LocalBusiness',
      description: 'Address, hours, phone, service area',
      useCase: 'Businesses with physical locations'
    },
    {
      name: 'Service',
      description: 'Service descriptions, pricing, areas served',
      useCase: 'Service-based businesses'
    },
    {
      name: 'FAQ',
      description: 'Question and answer pairs',
      useCase: 'FAQ pages, service pages'
    },
    {
      name: 'BreadcrumbList',
      description: 'Navigation path to current page',
      useCase: 'All pages with hierarchy'
    },
    {
      name: 'Product',
      description: 'Price, availability, reviews, SKU',
      useCase: 'E-commerce products'
    },
    {
      name: 'Article',
      description: 'Author, publish date, headline',
      useCase: 'Blog posts, news articles'
    },
    {
      name: 'Review',
      description: 'Rating, author, review text',
      useCase: 'Testimonials, product reviews'
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Structured Data
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Schema Markup <span className="gradient-text font-light">Explained</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Schema markup is structured data that helps search engines understand your content. It can enable rich snippets - enhanced search results with ratings, prices, FAQs, and more.
            </p>
          </div>
        </ScrollReveal>

        {/* Why Schema Matters */}
        <motion.div
          className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 mb-12 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">Why Schema Markup Matters</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Eye, title: 'Rich Snippets', desc: 'Stand out in search results with stars, prices, FAQs' },
              { icon: Bot, title: 'AI Understanding', desc: 'Help search engines (and AI) understand your content' },
              { icon: TrendingUp, title: 'Better CTR', desc: 'Rich results get 30% higher click-through rates' }
            ].map((item, i) => (
              <div key={item.title} className="text-center">
                <item.icon className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                <h4 className="text-white font-medium mb-2">{item.title}</h4>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Schema Types Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {schemaTypes.map((schema, index) => (
            <motion.div
              key={schema.name}
              className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 hover:border-cyan-400/30 transition-all duration-500"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1 + index * 0.03 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileCode className="w-5 h-5 text-cyan-400" />
                <span className="font-mono text-sm text-cyan-400">{schema.name}</span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{schema.description}</p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">Best for:</span> {schema.useCase}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Core Web Vitals Section
function CoreWebVitalsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const vitals = [
    {
      name: 'LCP',
      fullName: 'Largest Contentful Paint',
      target: '< 2.5s',
      description: 'Measures loading performance. How long until the largest content element (usually a hero image or heading) is visible.',
      icon: Timer,
      color: 'cyan',
      howWeOptimize: [
        'Image optimization and lazy loading',
        'CDN delivery for faster asset loading',
        'Server-side rendering with Next.js',
        'Preloading critical resources'
      ]
    },
    {
      name: 'INP',
      fullName: 'Interaction to Next Paint',
      target: '< 200ms',
      description: 'Measures interactivity. How quickly the page responds to user interactions like clicks, taps, and keyboard input.',
      icon: MousePointer,
      color: 'blue',
      howWeOptimize: [
        'Code splitting to reduce JavaScript',
        'Debouncing expensive operations',
        'Web Workers for heavy computations',
        'Efficient React rendering patterns'
      ]
    },
    {
      name: 'CLS',
      fullName: 'Cumulative Layout Shift',
      target: '< 0.1',
      description: 'Measures visual stability. How much the page layout shifts unexpectedly while loading (annoying when buttons move as you click).',
      icon: Move,
      color: 'indigo',
      howWeOptimize: [
        'Reserved space for images and ads',
        'Font display optimization',
        'Avoiding dynamic content injection',
        'Proper aspect ratio handling'
      ]
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Google Ranking Factor
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Core Web Vitals <span className="gradient-text font-light">Optimization</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Core Web Vitals are Google's metrics for page experience. Good scores help you rank higher and provide a better user experience.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-8">
          {vitals.map((vital, index) => (
            <motion.div
              key={vital.name}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-400/20 transition-all duration-500"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Vital Info */}
                <div className="lg:w-1/3">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-4 rounded-xl bg-${vital.color}-400/10`}>
                      <vital.icon className={`w-8 h-8 text-${vital.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{vital.name}</h3>
                      <p className="text-sm text-gray-400">{vital.fullName}</p>
                    </div>
                  </div>
                  <div className={`inline-block px-4 py-2 bg-${vital.color}-400/10 border border-${vital.color}-400/20 rounded-lg mb-4`}>
                    <span className="text-sm text-gray-400">Target: </span>
                    <span className={`font-mono font-bold text-${vital.color}-400`}>{vital.target}</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">{vital.description}</p>
                </div>

                {/* Right: How We Optimize */}
                <div className="lg:w-2/3 lg:border-l lg:border-slate-700/50 lg:pl-8">
                  <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-4">How We Optimize</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {vital.howWeOptimize.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 text-${vital.color}-400 flex-shrink-0 mt-0.5`} />
                        <span className="text-gray-300 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Technical SEO Checklist
function ChecklistSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const checklist = [
    { category: 'On-Page SEO', items: ['Title tags optimized', 'Meta descriptions written', 'H1-H6 hierarchy', 'Image alt text', 'Internal linking'] },
    { category: 'Technical Foundation', items: ['XML sitemap generated', 'Robots.txt configured', 'Canonical tags set', 'SSL/HTTPS enabled', '404 page created'] },
    { category: 'Schema Markup', items: ['Organization schema', 'Breadcrumb schema', 'Service/Product schema', 'FAQ schema (where applicable)', 'LocalBusiness (if location-based)'] },
    { category: 'Performance', items: ['Core Web Vitals passing', 'Images optimized', 'Code minified', 'Lazy loading enabled', 'CDN configured'] },
    { category: 'Mobile & Accessibility', items: ['Mobile-responsive', 'Touch-friendly elements', 'Viewport meta tag', 'Font size readable', 'Color contrast passing'] },
    { category: 'Search Console', items: ['GSC verified', 'Sitemap submitted', 'Index coverage checked', 'Mobile usability verified', 'Performance baseline set'] }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Included in Every Build
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Our Technical SEO <span className="gradient-text font-light">Checklist</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Every website launches with these technical SEO elements in place. This isn't an add-on - it's our standard.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checklist.map((group, index) => (
            <motion.div
              key={group.category}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4 pb-3 border-b border-slate-700/50">
                {group.category}
              </h3>
              <ul className="space-y-3">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ Section
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const faqs = [
    {
      question: 'What is the difference between technical SEO and content SEO?',
      answer: 'Technical SEO focuses on the infrastructure that helps search engines crawl and index your site: site speed, schema markup, URL structure, mobile optimization, and Core Web Vitals. Content SEO involves keyword research, content creation, and ongoing optimization. We specialize in technical SEO implementation - building the foundation that makes your content discoverable.'
    },
    {
      question: 'Do you offer ongoing SEO management or monthly retainers?',
      answer: 'No. We implement technical SEO foundations during your website build, but we don\'t offer monthly SEO retainers, content writing, or link building campaigns. Our focus is building SEO-ready websites with proper technical foundations. If you need ongoing SEO management, we can recommend trusted partners.'
    },
    {
      question: 'How long does technical SEO implementation take?',
      answer: 'Technical SEO is built into our standard development process. It\'s included in every project tier and doesn\'t add extra time. Your website launches with proper meta tags, schema markup, XML sitemaps, robots.txt, and Google Search Console already configured.'
    },
    {
      question: 'Is technical SEO included in all your project tiers?',
      answer: 'Yes. Every website we build includes technical SEO fundamentals: meta tags, Open Graph, schema markup, XML sitemap, robots.txt, and mobile optimization. The Scale tier adds Google Analytics and Search Console setup. Enterprise tier includes advanced structured data and custom SEO requirements.'
    },
    {
      question: 'Will technical SEO alone get me to #1 on Google?',
      answer: 'Technical SEO is the foundation, but it\'s not the whole picture. Great rankings require quality content, domain authority, backlinks, and time. Technical SEO ensures search engines can find and understand your content - then your content quality and relevance determine where you rank.'
    },
    {
      question: 'Can you help if my site already has SEO problems?',
      answer: 'If we\'re building you a new website, it launches with proper technical SEO. For existing sites not built by us, we recommend working with an SEO agency for audits and remediation. Our expertise is building new sites right from the start.'
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Frequently Asked <span className="gradient-text font-light">Questions</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Common questions about our technical SEO implementation
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i

            return (
              <motion.div
                key={i}
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-500"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
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
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-cyan-400/20 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Build an <span className="gradient-text font-light">SEO-Optimized</span> Website
            </h2>
            <p className="text-xl text-gray-400 mb-10 font-light leading-relaxed max-w-2xl mx-auto">
              Technical SEO is included in every tier. The Scale package adds analytics tracking and Search Console setup - everything you need to rank.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/packages/scale"
                className="group inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-lg font-medium text-white hover:shadow-2xl hover:shadow-cyan-400/30 transition-all duration-500"
              >
                View Scale Package
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/project"
                className="inline-flex items-center gap-2 px-12 py-6 border border-slate-600 rounded-full text-lg font-light text-gray-300 hover:border-cyan-400/30 hover:text-white transition-all duration-300"
              >
                Compare All Tiers
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-8 font-light">
              Technical SEO included in all tiers. Scale tier adds analytics setup.
            </p>
          </div>
        </motion.div>
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
      title: 'Web Design',
      description: 'Beautiful, conversion-focused designs that complement technical SEO',
      href: '/services/web-design',
      icon: Globe
    },
    {
      title: 'Analytics Tracking',
      description: 'Measure your SEO success with proper analytics implementation',
      href: '/services/analytics-tracking',
      icon: TrendingUp
    },
    {
      title: 'Hosting Infrastructure',
      description: 'Fast, reliable hosting that supports great Core Web Vitals',
      href: '/services/hosting-infrastructure',
      icon: Server
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight mb-4 tracking-tight">
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
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link
                href={service.href}
                className="block bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-500 group h-full"
              >
                <service.icon className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-400">{service.description}</p>
                <div className="flex items-center gap-2 mt-4 text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
