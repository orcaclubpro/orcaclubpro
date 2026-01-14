"use client"

import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { motion, useInView } from "motion/react"
import { useState, useRef } from "react"
import {
  ArrowRight,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Target,
  Eye,
  MousePointer,
  Clock,
  Download,
  Play,
  ShoppingCart,
  CreditCard,
  FileText,
  Settings,
  Code2,
  Search,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Layers,
  Zap,
  Globe,
  Shield,
  Database,
  Activity,
  Users,
  Filter
} from "lucide-react"

export default function AnalyticsContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section */}
      <ProblemSection />

      {/* Analytics Services Section */}
      <ServicesSection />

      {/* What We Track Section */}
      <WhatWeTrackSection />

      {/* Dashboard Section */}
      <DashboardSection />

      {/* Analytics Stack Section */}
      <AnalyticsStackSection />

      {/* GA4 Migration Section */}
      <GA4MigrationSection />

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
              Web Analytics Implementation
            </span>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-6">
              Data That <span className="gradient-text font-light">Drives Decisions</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              Stop flying blind. Professional analytics implementation that shows you exactly what's working, what's not, and where to focus next.
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
                  From Guessing to Knowing
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Every marketing dollar, every design decision, every feature priority - backed by real data. We implement <span className="text-cyan-400 font-medium">Google Analytics 4</span>, <span className="text-cyan-400 font-medium">Tag Manager</span>, and custom dashboards that turn raw data into actionable insights.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                  <BarChart3 className="w-12 h-12 text-cyan-400" />
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
            { label: 'Events Tracked', value: '50+', icon: Activity },
            { label: 'GA4 + GTM Setup', value: 'Full', icon: Settings },
            { label: 'Custom Dashboards', value: 'Included', icon: PieChart },
            { label: 'Included In', value: 'Scale Tier', icon: CheckCircle2 }
          ].map((stat) => (
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
              Flying Blind is <span className="text-red-400 font-light">Expensive</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Without proper analytics, every business decision is a guess. And wrong guesses cost you money, time, and opportunities.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Without Analytics */}
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
              <h3 className="text-xl font-semibold text-white">Without Analytics</h3>
            </div>
            <ul className="space-y-4">
              {[
                'No visibility into what\'s working',
                'Guessing instead of knowing',
                'Missing conversion opportunities',
                'Can\'t prove ROI on marketing spend',
                'No idea which traffic sources convert',
                'Decisions based on gut feeling'
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

          {/* With Analytics */}
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
              <h3 className="text-xl font-semibold text-white">With Proper Analytics</h3>
            </div>
            <ul className="space-y-4">
              {[
                'See exactly where visitors come from',
                'Know which pages convert best',
                'Track every button click and form submission',
                'Measure campaign performance precisely',
                'Identify drop-off points in your funnel',
                'Decisions backed by real data'
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

// Analytics Services Section
function ServicesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const services = [
    {
      icon: BarChart3,
      title: 'Google Analytics 4 Setup',
      description: 'Full GA4 implementation with enhanced measurement, custom events, conversion tracking, and audience configuration. The foundation of data-driven decisions.',
      features: ['Enhanced measurement events', 'Custom conversion tracking', 'Audience segments', 'Cross-domain tracking']
    },
    {
      icon: Layers,
      title: 'Google Tag Manager',
      description: 'GTM container setup with organized triggers, variables, and tags. Manage all your tracking from one central location without touching code.',
      features: ['Container setup', 'Custom triggers', 'Data layer configuration', 'Third-party tag management']
    },
    {
      icon: Search,
      title: 'Google Search Console',
      description: 'Complete GSC setup, verification, and sitemap submission. Monitor your search performance and get indexed faster.',
      features: ['Domain verification', 'Sitemap submission', 'Index monitoring', 'Search performance data']
    },
    {
      icon: MousePointer,
      title: 'Custom Event Tracking',
      description: 'Track specific user interactions that matter to your business. Button clicks, form submissions, scroll depth, video views - if it happens, we can track it.',
      features: ['Button click tracking', 'Form submission events', 'Scroll depth triggers', 'Video engagement metrics']
    },
    {
      icon: Filter,
      title: 'Conversion Funnels',
      description: 'Multi-step funnel tracking to understand where users drop off. Identify bottlenecks and optimize your conversion path.',
      features: ['Multi-step tracking', 'Drop-off analysis', 'Path exploration', 'Goal flow visualization']
    },
    {
      icon: ShoppingCart,
      title: 'E-commerce Tracking',
      description: 'Full ecommerce analytics for Shopify, WooCommerce, or custom stores. Track product views, cart actions, and purchases.',
      features: ['Product impressions', 'Add to cart events', 'Checkout tracking', 'Purchase analytics']
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Analytics Services
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Analytics We <span className="gradient-text font-light">Implement</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Comprehensive tracking infrastructure that captures every interaction that matters to your business.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
              <p className="text-gray-400 leading-relaxed mb-4 text-sm">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
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

// What We Track Section
function WhatWeTrackSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const trackingCategories = [
    {
      title: 'User Behavior',
      icon: Users,
      items: [
        { name: 'Page views & sessions', desc: 'Which pages get traffic' },
        { name: 'Scroll depth', desc: 'How far users read' },
        { name: 'Time on page', desc: 'Engagement duration' },
        { name: 'Click patterns', desc: 'What users interact with' }
      ]
    },
    {
      title: 'Conversions',
      icon: Target,
      items: [
        { name: 'Form submissions', desc: 'Lead capture tracking' },
        { name: 'Button clicks', desc: 'CTA engagement' },
        { name: 'File downloads', desc: 'Resource interest' },
        { name: 'Goal completions', desc: 'Key action tracking' }
      ]
    },
    {
      title: 'Traffic Sources',
      icon: Globe,
      items: [
        { name: 'Organic search', desc: 'SEO performance' },
        { name: 'Paid campaigns', desc: 'Ad ROI tracking' },
        { name: 'Social media', desc: 'Platform attribution' },
        { name: 'Referral traffic', desc: 'Partner effectiveness' }
      ]
    },
    {
      title: 'Engagement',
      icon: Activity,
      items: [
        { name: 'Video views', desc: 'Play, pause, completion' },
        { name: 'Link clicks', desc: 'External & internal' },
        { name: 'Tab interactions', desc: 'Feature interest' },
        { name: 'Search queries', desc: 'Site search behavior' }
      ]
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Data Collection
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              What We <span className="gradient-text font-light">Track</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Every interaction that impacts your business, captured and organized for easy analysis.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trackingCategories.map((category, index) => (
            <motion.div
              key={category.title}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
                <div className="p-2 rounded-lg bg-cyan-400/10">
                  <category.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{category.title}</h3>
              </div>
              <ul className="space-y-4">
                {category.items.map((item, i) => (
                  <li key={i} className="group">
                    <div className="text-gray-200 font-medium text-sm">{item.name}</div>
                    <div className="text-gray-500 text-xs">{item.desc}</div>
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

// Dashboard Section
function DashboardSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const dashboardFeatures = [
    { icon: LineChart, title: 'Traffic Overview', desc: 'Sessions, users, and page views over time' },
    { icon: Target, title: 'Conversion Metrics', desc: 'Goal completions and conversion rates' },
    { icon: Globe, title: 'Source Attribution', desc: 'Where your traffic comes from' },
    { icon: TrendingUp, title: 'Performance Trends', desc: 'Week-over-week comparisons' },
    { icon: Users, title: 'Audience Insights', desc: 'Demographics and behavior patterns' },
    { icon: FileText, title: 'Top Content', desc: 'Your most engaging pages' }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <ScrollReveal>
              <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
                Custom Dashboards
              </span>
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
                Your Data, <span className="gradient-text font-light">Visualized</span>
              </h2>
              <p className="text-xl text-gray-400 font-light leading-relaxed mb-8">
                Raw data is useless. We build custom Looker Studio dashboards that present your key metrics clearly, so you can make decisions at a glance.
              </p>
            </ScrollReveal>

            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              {dashboardFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-700/30"
                >
                  <feature.icon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-white">{feature.title}</div>
                    <div className="text-xs text-gray-500">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard Preview */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-500">Looker Studio Dashboard</span>
              </div>

              {/* Mock Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Users', value: '12,847', change: '+15%' },
                  { label: 'Sessions', value: '24,391', change: '+22%' },
                  { label: 'Conversions', value: '847', change: '+31%' }
                ].map((metric) => (
                  <div key={metric.label} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{metric.label}</div>
                    <div className="text-xl font-bold text-white">{metric.value}</div>
                    <div className="text-xs text-cyan-400">{metric.change}</div>
                  </div>
                ))}
              </div>

              {/* Mock Chart */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="text-xs text-gray-500 mb-4">Traffic Trend</div>
                <div className="flex items-end gap-1 h-24">
                  {[40, 55, 45, 60, 75, 65, 80, 70, 85, 90, 75, 95].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-cyan-500/30 to-cyan-400/60 rounded-sm"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Mock Table */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-3">Top Traffic Sources</div>
                {[
                  { source: 'Organic Search', sessions: '8,421', pct: '34%' },
                  { source: 'Direct', sessions: '5,847', pct: '24%' },
                  { source: 'Social', sessions: '4,123', pct: '17%' }
                ].map((row) => (
                  <div key={row.source} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <span className="text-sm text-gray-300">{row.source}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">{row.sessions}</span>
                      <span className="text-xs text-cyan-400 w-8 text-right">{row.pct}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Decorative gradient */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Analytics Stack Section
function AnalyticsStackSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const tools = [
    {
      name: 'Google Analytics 4',
      shortName: 'GA4',
      description: 'The core of web analytics. Event-based tracking with machine learning insights and cross-platform measurement.',
      color: 'orange'
    },
    {
      name: 'Google Tag Manager',
      shortName: 'GTM',
      description: 'Central hub for all tracking tags. Add, edit, and manage tracking without touching your website code.',
      color: 'blue'
    },
    {
      name: 'Google Search Console',
      shortName: 'GSC',
      description: 'Monitor search performance, indexing status, and search queries that drive traffic to your site.',
      color: 'green'
    },
    {
      name: 'Looker Studio',
      shortName: 'Studio',
      description: 'Custom dashboards that visualize your data. Connect multiple sources into one beautiful report.',
      color: 'cyan'
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Technology
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Our Analytics <span className="gradient-text font-light">Stack</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Industry-standard tools configured to work together seamlessly.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-500 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-${tool.color}-400/10 border border-${tool.color}-400/20 flex items-center justify-center`}>
                <span className="text-2xl font-bold text-cyan-400">{tool.shortName}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{tool.name}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{tool.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
        >
          <p className="text-gray-500 text-sm font-light">
            All tools are free from Google. We configure them properly so they work together.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// GA4 Migration Section
function GA4MigrationSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-amber-400/20 rounded-2xl p-8 md:p-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20 flex-shrink-0">
              <Zap className="w-10 h-10 text-amber-400" />
            </div>
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-xs font-medium text-amber-400 uppercase tracking-wider mb-4">
                Still on Universal Analytics?
              </span>
              <h2 className="text-3xl font-extralight mb-4 tracking-tight">
                Time to <span className="text-amber-400 font-light">Migrate to GA4</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Universal Analytics stopped processing data in July 2023. If your site is still running UA (or running nothing at all), you're missing critical data every day. GA4 is the future - it's event-based, privacy-focused, and offers features UA never had.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Event-based tracking (more flexible)',
                  'Cross-platform measurement',
                  'Built-in machine learning insights',
                  'Privacy-first architecture',
                  'Better integration with Google Ads',
                  'Predictive analytics capabilities'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
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
      question: 'What data do you track with analytics implementation?',
      answer: 'We track page views, user sessions, traffic sources, button clicks, form submissions, scroll depth, file downloads, video engagement, conversion events, and campaign performance. For ecommerce sites, we also track product views, cart additions, checkout steps, and purchases. All tracking is customized to your specific business goals.'
    },
    {
      question: 'Is analytics tracking GDPR and privacy compliant?',
      answer: 'Yes. We implement analytics with privacy in mind. This includes consent management integration, IP anonymization where required, data retention settings, and cookie policy compliance. We configure GA4\'s privacy controls and can integrate with your consent management platform.'
    },
    {
      question: 'Who manages the analytics after setup?',
      answer: 'After implementation, you own your analytics completely. We provide documentation and training on how to read your dashboards and reports. The setup is self-maintaining - data continues to collect automatically. We can provide ongoing support if needed, but it\'s not required.'
    },
    {
      question: 'Is Google Analytics 4 different from Universal Analytics?',
      answer: 'Yes, significantly. GA4 is event-based rather than session-based, offers better cross-platform tracking, has built-in machine learning insights, and is designed for a cookie-less future. Universal Analytics was sunset in July 2023, so all new implementations use GA4. If you\'re still on UA, we can help migrate.'
    },
    {
      question: 'What is Google Tag Manager and why do I need it?',
      answer: 'Google Tag Manager (GTM) is a container that manages all your tracking codes in one place. Instead of adding code to your website every time you want to track something new, you add it to GTM. This makes tracking easier to manage, faster to update, and reduces the risk of breaking your site with code changes.'
    },
    {
      question: 'Is analytics tracking included in your website packages?',
      answer: 'Analytics implementation is included in our Scale tier and above. The Launch tier includes technical SEO foundations but not full analytics setup. We recommend Scale for any business that wants to make data-driven decisions about their website performance.'
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
              Common questions about analytics implementation
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
              Start Tracking <span className="gradient-text font-light">What Matters</span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 font-light leading-relaxed max-w-2xl mx-auto">
              Full analytics implementation is included in the Scale tier. GA4, Tag Manager, Search Console, and custom dashboards - everything you need to make data-driven decisions.
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
                href="/contact"
                className="inline-flex items-center gap-2 px-12 py-6 border border-slate-600 rounded-full text-lg font-light text-gray-300 hover:border-cyan-400/30 hover:text-white transition-all duration-300"
              >
                Get a Quote
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-8 font-light">
              Analytics included in Scale ($3K-5K) and Enterprise tiers. Launch tier includes technical SEO only.
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
      title: 'Technical SEO',
      description: 'Schema markup, Core Web Vitals, and search engine optimization foundations',
      href: '/services/technical-seo',
      icon: Search
    },
    {
      title: 'Marketing Integration',
      description: 'Connect your marketing tools with your website for seamless campaigns',
      href: '/services/integration-automation',
      icon: Zap
    },
    {
      title: 'E-commerce',
      description: 'Full ecommerce tracking for Shopify, WooCommerce, and custom stores',
      href: '/services/ecommerce',
      icon: ShoppingCart
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
