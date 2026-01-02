"use client"

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target,
  TrendingUp,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
  Users,
  DollarSign,
  Eye,
  LineChart,
  MessageSquare,
  ShoppingCart,
  Clock,
  Shield,
  Award,
  ChevronRight
} from 'lucide-react'
import AnimatedBackground from '@/components/layout/animated-background'
import ScrollReveal from '@/components/layout/scroll-reveal'

export default function DigitalMarketingContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Platform Mastery Section */}
      <PlatformSection />

      {/* Process Section */}
      <ProcessSection />

      {/* Results Section */}
      <ResultsSection />

      {/* Website Development Callout */}
      <WebsiteCalloutSection />

      {/* Final CTA Section */}
      <FinalCTASection />
    </div>
  )
}

// Hero Section with Animated Metrics
function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [roi, setRoi] = useState(0)
  const [conversions, setConversions] = useState(0)
  const [spend, setSpend] = useState(0)

  useEffect(() => {
    if (isInView) {
      // Animate ROI counter to 4.8x
      const roiInterval = setInterval(() => {
        setRoi(prev => {
          if (prev >= 4.8) {
            clearInterval(roiInterval)
            return 4.8
          }
          return Math.min(prev + 0.1, 4.8)
        })
      }, 30)

      // Animate conversion rate to 12.4%
      const convInterval = setInterval(() => {
        setConversions(prev => {
          if (prev >= 12.4) {
            clearInterval(convInterval)
            return 12.4
          }
          return Math.min(prev + 0.3, 12.4)
        })
      }, 30)

      // Animate reduced spend to 67%
      const spendInterval = setInterval(() => {
        setSpend(prev => {
          if (prev >= 67) {
            clearInterval(spendInterval)
            return 67
          }
          return Math.min(prev + 2, 67)
        })
      }, 30)

      return () => {
        clearInterval(roiInterval)
        clearInterval(convInterval)
        clearInterval(spendInterval)
      }
    }
  }, [isInView])

  return (
    <section ref={ref} className="pt-32 pb-20 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-400/10 border border-blue-400/20 rounded-full text-xs font-medium text-blue-400 uppercase tracking-wider mb-6">
              Digital Marketing Services
            </span>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Digital Marketing Services<br />
              That Deliver <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">Measurable ROI</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-12">
              Stop wasting ad spend on guesswork. Get transparent, data-driven campaign management
              that turns marketing dollars into measurable business growth.
            </p>
          </div>
        </ScrollReveal>

        {/* Metrics Dashboard */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          {/* ROI Metric */}
          <motion.div
            className="bg-slate-900/60 backdrop-blur-xl border border-blue-400/20 rounded-xl p-8 shadow-2xl hover:border-blue-400/40 transition-colors"
            whileHover={{ y: -4 }}
          >
            <Target className="w-10 h-10 text-blue-400 mb-4" />
            <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Average ROAS</div>
            <div className="text-5xl font-bold text-white mb-2">
              {roi.toFixed(1)}<span className="text-3xl text-blue-400">x</span>
            </div>
            <div className="text-sm text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Return on Ad Spend
            </div>
          </motion.div>

          {/* Conversion Rate */}
          <motion.div
            className="bg-slate-900/60 backdrop-blur-xl border border-indigo-400/20 rounded-xl p-8 shadow-2xl hover:border-indigo-400/40 transition-colors"
            whileHover={{ y: -4 }}
            transition={{ delay: 0.1 }}
          >
            <BarChart3 className="w-10 h-10 text-indigo-400 mb-4" />
            <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Avg Conversion Rate</div>
            <div className="text-5xl font-bold text-white mb-2">
              {conversions.toFixed(1)}<span className="text-3xl text-indigo-400">%</span>
            </div>
            <div className="text-sm text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Above industry average
            </div>
          </motion.div>

          {/* Wasted Spend Reduction */}
          <motion.div
            className="bg-slate-900/60 backdrop-blur-xl border border-emerald-400/20 rounded-xl p-8 shadow-2xl hover:border-emerald-400/40 transition-colors"
            whileHover={{ y: -4 }}
            transition={{ delay: 0.2 }}
          >
            <DollarSign className="w-10 h-10 text-emerald-400 mb-4" />
            <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Wasted Spend Reduced</div>
            <div className="text-5xl font-bold text-white mb-2">
              {Math.round(spend)}<span className="text-3xl text-emerald-400">%</span>
            </div>
            <div className="text-sm text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Through optimization
            </div>
          </motion.div>
        </motion.div>

        {/* Value Props */}
        <ScrollReveal delay={600}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: Shield, title: 'Transparent Reporting', desc: 'Know exactly where every dollar goes with real-time dashboards' },
              { icon: Zap, title: 'A/B Testing Built In', desc: 'Continuous optimization through data-driven experimentation' },
              { icon: Award, title: 'Multi-Channel Expertise', desc: 'Master-level execution across all major advertising platforms' }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-full bg-blue-400/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={1000}>
          <div className="text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600/20 to-emerald-500/20 border border-blue-400/30 rounded-full text-lg font-medium text-blue-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-emerald-500/30 transition-all duration-300 group"
            >
              Get Your Free Marketing Audit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-gray-500 mt-4">No commitment • Detailed analysis • Actionable insights</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Platform Mastery Section
function PlatformSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const platforms = [
    {
      name: 'Google Ads',
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-400/30',
      hoverBorder: 'hover:border-blue-400/60',
      features: ['Search Ads', 'Display Network', 'Shopping Campaigns', 'YouTube Ads'],
      bestFor: 'High-intent searches & product discovery'
    },
    {
      name: 'Meta Ads',
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      borderColor: 'border-indigo-400/30',
      hoverBorder: 'hover:border-indigo-400/60',
      features: ['Facebook Ads', 'Instagram Ads', 'Audience Network', 'Messenger Ads'],
      bestFor: 'Brand awareness & social engagement'
    },
    {
      name: 'LinkedIn Ads',
      icon: MessageSquare,
      color: 'from-blue-600 to-blue-700',
      borderColor: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-500/60',
      features: ['Sponsored Content', 'InMail Campaigns', 'Lead Gen Forms', 'Account Targeting'],
      bestFor: 'B2B lead generation & professional targeting'
    },
    {
      name: 'TikTok Ads',
      icon: Zap,
      color: 'from-pink-500 to-purple-600',
      borderColor: 'border-pink-400/30',
      hoverBorder: 'hover:border-pink-400/60',
      features: ['In-Feed Ads', 'Spark Ads', 'TopView', 'Branded Effects'],
      bestFor: 'Viral reach & younger demographics'
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Multi-Channel Campaign <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Expertise</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We're not a one-platform agency. We master every major advertising channel
              and build integrated strategies that maximize your reach and ROI.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.name}
              className={`bg-slate-900/60 backdrop-blur-xl border ${platform.borderColor} ${platform.hoverBorder} rounded-2xl p-8 shadow-2xl transition-all duration-300 group cursor-pointer`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <platform.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{platform.name}</h3>
                  <p className="text-sm text-gray-400 italic">{platform.bestFor}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {platform.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Platforms */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-400 text-sm mb-4">Also experienced with:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Twitter/X Ads', 'Pinterest Ads', 'Reddit Ads', 'Programmatic Display', 'Native Advertising'].map(platform => (
              <span
                key={platform}
                className="px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-gray-300"
              >
                {platform}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Process Section
function ProcessSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const steps = [
    {
      number: '01',
      title: 'Strategy',
      duration: 'Week 1',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/30',
      tasks: [
        'Market & competitor research',
        'Audience persona development',
        'Channel strategy & budget allocation',
        'KPI definition & tracking setup'
      ]
    },
    {
      number: '02',
      title: 'Launch',
      duration: 'Week 2',
      icon: Zap,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
      borderColor: 'border-indigo-400/30',
      tasks: [
        'Campaign creation & setup',
        'Ad creative production',
        'Landing page optimization',
        'Initial campaign launch'
      ]
    },
    {
      number: '03',
      title: 'Optimize',
      duration: 'Weeks 3-4',
      icon: BarChart3,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/30',
      tasks: [
        'Performance monitoring & analysis',
        'A/B testing creative & copy',
        'Bid strategy optimization',
        'Budget reallocation to winners'
      ]
    },
    {
      number: '04',
      title: 'Scale',
      duration: 'Month 2+',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/30',
      tasks: [
        'Expand to new audiences',
        'Test additional channels',
        'Increase budget on proven campaigns',
        'Continuous improvement & reporting'
      ]
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Our Proven <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Process</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Transparent, data-driven methodology that takes you from strategy to scale.
              No black boxes, no surprises—just results.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="relative"
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15 }}
            >
              {/* Connection Line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-slate-700 to-transparent z-0" />
              )}

              <div className={`relative bg-slate-900/60 backdrop-blur-xl border ${step.borderColor} rounded-xl p-6 shadow-xl hover:border-opacity-60 transition-all duration-300 z-10`}>
                {/* Number Badge */}
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-400">{step.number}</span>
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg ${step.bgColor} flex items-center justify-center mb-4`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>

                {/* Title */}
                <h3 className={`text-2xl font-bold ${step.color} mb-2`}>{step.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">{step.duration}</span>
                </div>

                {/* Tasks */}
                <ul className="space-y-2">
                  {step.tasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Process Note */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/60 border border-slate-700/50 rounded-full">
            <Eye className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300 text-sm">
              Weekly reporting calls • Real-time dashboard access • Dedicated account manager
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Results Section
function ResultsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const caseStudies = [
    {
      industry: 'E-commerce',
      icon: ShoppingCart,
      color: 'from-blue-500 to-indigo-600',
      challenge: 'High cart abandonment, low ROAS on Facebook ads',
      solution: 'Implemented retargeting funnels, optimized product feed, A/B tested ad creative',
      results: [
        { label: 'ROAS', before: '1.8x', after: '5.2x', change: '+189%' },
        { label: 'Conversion Rate', before: '1.2%', after: '3.8%', change: '+217%' },
        { label: 'Revenue', before: '$42K/mo', after: '$156K/mo', change: '+271%' }
      ]
    },
    {
      industry: 'SaaS Platform',
      icon: LineChart,
      color: 'from-purple-500 to-pink-600',
      challenge: 'Expensive CPL, long sales cycles, low demo bookings',
      solution: 'LinkedIn + Google combined strategy, lead magnet funnels, nurture sequences',
      results: [
        { label: 'Cost per Lead', before: '$247', after: '$89', change: '-64%' },
        { label: 'Demo Bookings', before: '12/mo', after: '67/mo', change: '+458%' },
        { label: 'MRR Growth', before: '+$8K/mo', after: '+$34K/mo', change: '+325%' }
      ]
    },
    {
      industry: 'Local Service',
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      challenge: 'Limited local visibility, inconsistent lead quality',
      solution: 'Google Local Service Ads, geo-targeted search campaigns, review optimization',
      results: [
        { label: 'Monthly Leads', before: '23', after: '94', change: '+309%' },
        { label: 'Cost per Lead', before: '$156', after: '$67', change: '-57%' },
        { label: 'Lead Quality Score', before: '3.2/5', after: '4.7/5', change: '+47%' }
      ]
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Real Client <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Results</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Don't just take our word for it. Here's what we've achieved for businesses
              across different industries and growth stages.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-12">
          {caseStudies.map((study, i) => (
            <motion.div
              key={study.industry}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.2 }}
            >
              <div className="p-8 md:p-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${study.color} flex items-center justify-center shadow-lg`}>
                    <study.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{study.industry}</h3>
                    <p className="text-sm text-gray-400">Case Study</p>
                  </div>
                </div>

                {/* Challenge & Solution */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Challenge</div>
                    <p className="text-gray-300 leading-relaxed">{study.challenge}</p>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Our Solution</div>
                    <p className="text-gray-300 leading-relaxed">{study.solution}</p>
                  </div>
                </div>

                {/* Results */}
                <div className="border-t border-slate-700/50 pt-6">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-4">Results</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {study.results.map((result, idx) => (
                      <motion.div
                        key={result.label}
                        className="bg-slate-800/60 rounded-lg p-5 border border-slate-700/30"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.4 + i * 0.2 + idx * 0.1 }}
                      >
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">{result.label}</div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Before</div>
                            <div className="text-lg text-gray-400 line-through">{result.before}</div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-blue-400" />
                          <div>
                            <div className="text-xs text-gray-500 mb-1">After</div>
                            <div className="text-lg font-bold text-white">{result.after}</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {result.change}
                        </div>
                      </motion.div>
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

// Website Development Callout Section
function WebsiteCalloutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 border border-blue-400/20 rounded-2xl p-8 md:p-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Need a High-Converting Website?
          </h3>
          <p className="text-lg text-gray-400 mb-6 max-w-2xl mx-auto">
            Marketing campaigns perform best with optimized landing pages. We also offer website development with fast turnaround times.
          </p>
          <Link
            href="/project"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-400/30 rounded-full text-lg font-medium text-blue-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-300 group"
          >
            View Website Development Tiers
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// Final CTA Section
function FinalCTASection() {
  return (
    <section className="py-40 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Stop Wasting <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Ad Spend</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            Let's audit your current campaigns and show you exactly where you're leaving money on the table.
            Free analysis, no commitment, actionable insights in 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600/20 to-emerald-500/20 border border-blue-400/30 rounded-full text-lg font-medium text-blue-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-emerald-500/30 transition-all duration-300 group"
            >
              Get Your Free Marketing Audit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors px-6 py-5"
            >
              View More Case Studies
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No long-term contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Transparent pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
