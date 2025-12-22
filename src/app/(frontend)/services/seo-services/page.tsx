"use client"

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import {
  Search,
  TrendingUp,
  FileText,
  Settings,
  Target,
  BarChart3,
  Globe,
  Award,
  CheckCircle2,
  ArrowRight,
  Zap,
  Users,
  Eye,
  Sparkles,
  LineChart,
  Map,
  ArrowUpRight
} from "lucide-react"

export default function SEOServicesPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Pain Points Section */}
      <PainPointsSection />

      {/* SEO Methodology */}
      <MethodologySection />

      {/* Traffic Growth */}
      <TrafficGrowthSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}

// Hero Section - Live Search Simulation
function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [searchQuery, setSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const queries = [
    "best business software",
    "website development services",
    "custom CRM solutions"
  ]

  const [currentQueryIndex, setCurrentQueryIndex] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const query = queries[currentQueryIndex]
    let charIndex = 0
    setIsTyping(true)
    setShowResults(false)

    const typeInterval = setInterval(() => {
      if (charIndex <= query.length) {
        setSearchQuery(query.slice(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)
        setShowResults(true)

        // Wait 3 seconds then start next query
        setTimeout(() => {
          setCurrentQueryIndex((prev) => (prev + 1) % queries.length)
        }, 3000)
      }
    }, 80)

    return () => clearInterval(typeInterval)
  }, [isInView, currentQueryIndex])

  return (
    <section ref={ref} className="pt-32 pb-20 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-teal-400/10 border border-teal-400/20 rounded-full text-xs font-medium text-teal-400 uppercase tracking-wider mb-6">
              SEO & Content Optimization
            </span>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-6">
              Double Your <span className="gradient-text font-light">Search Traffic</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              Visibility engineering that compounds over time. Strategic content, technical optimization, and search strategies that deliver lasting results.
            </p>
          </div>
        </ScrollReveal>

        {/* Live Search Simulation */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          {/* Google Search Bar Mockup */}
          <div className="bg-white rounded-full shadow-2xl p-4 mb-8 flex items-center gap-4">
            <Search className="w-6 h-6 text-gray-400 ml-2" />
            <input
              type="text"
              value={searchQuery}
              readOnly
              className="flex-1 text-gray-800 text-lg outline-none bg-transparent"
              placeholder="Search Google or type a URL"
            />
            {isTyping && (
              <span className="w-0.5 h-6 bg-blue-600 animate-pulse" />
            )}
          </div>

          {/* Search Results */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={showResults ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Your Result - #1 */}
            <motion.div
              className="bg-slate-900/60 backdrop-blur-xl border-2 border-teal-400/40 rounded-lg p-6 relative overflow-hidden"
              initial={{ y: 20 }}
              animate={showResults ? { y: 0 } : {}}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute top-4 right-4">
                <Award className="w-6 h-6 text-teal-400" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-teal-400 font-medium">yoursite.com</span>
                <span className="text-xs text-gray-500">• #1 Result</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Your Business - Industry Leader
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Professional services that drive results. Fast turnaround, custom solutions, and expert execution. Trusted by 200+ businesses.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <span className="text-sm text-gray-400">247 reviews</span>
              </div>
            </motion.div>

            {/* Competitor Results - Faded */}
            {[2, 3].map((position) => (
              <motion.div
                key={position}
                className="bg-slate-900/30 backdrop-blur-xl border border-slate-700/30 rounded-lg p-4 opacity-40"
                initial={{ y: 20 }}
                animate={showResults ? { y: 0 } : {}}
                transition={{ delay: 0.1 + position * 0.1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">competitor-site-{position}.com</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Competitor Business #{position}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Generic description text that doesn&apos;t stand out...
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            className="text-center text-sm text-gray-500 mt-8"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1 }}
          >
            <Sparkles className="w-4 h-4 inline mr-2 text-teal-400" />
            This is where your business should be
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

// Pain Points → Solution Section
function PainPointsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const painPoints = [
    {
      pain: "Invisible in search results",
      solution: "Rank #1 for your target keywords",
      icon: Eye,
      stat: "141% traffic increase",
      color: "from-teal-500 to-cyan-400"
    },
    {
      pain: "Competitors outranking you",
      solution: "Strategic competitive analysis",
      icon: Target,
      stat: "Outrank 87% of competitors",
      color: "from-blue-500 to-teal-500"
    },
    {
      pain: "No organic lead generation",
      solution: "Content that converts visitors",
      icon: Users,
      stat: "3x more qualified leads",
      color: "from-indigo-500 to-blue-500"
    },
    {
      pain: "Unclear SEO strategy",
      solution: "Data-driven roadmap & execution",
      icon: Map,
      stat: "Clear 90-day plan",
      color: "from-slate-600 to-teal-600"
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Stop <span className="gradient-text font-light">losing</span> to your competition
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Every day without SEO is a day your competitors capture your potential customers.
              We turn that around.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {painPoints.map((item, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-teal-400/30 transition-all duration-500 h-full">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>

                {/* Pain Point */}
                <div className="mb-4">
                  <span className="text-xs text-red-400 uppercase tracking-wider font-medium">Problem</span>
                  <p className="text-lg text-gray-400 mt-1">{item.pain}</p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-6 h-6 text-teal-400 mb-4 group-hover:translate-x-2 transition-transform" />

                {/* Solution */}
                <div className="mb-6">
                  <span className="text-xs text-teal-400 uppercase tracking-wider font-medium">Solution</span>
                  <p className="text-xl text-white font-light mt-1">{item.solution}</p>
                </div>

                {/* Stat */}
                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400 font-medium">{item.stat}</span>
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

// SEO Methodology - 3 Tiers
function MethodologySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const tiers = [
    {
      title: "Technical Foundation",
      subtitle: "The backbone of SEO success",
      icon: Settings,
      color: "teal",
      items: [
        "Site speed optimization (Core Web Vitals)",
        "Mobile responsiveness & UX",
        "Structured data implementation",
        "XML sitemaps & crawlability",
        "Technical audit & fixes"
      ]
    },
    {
      title: "Content Strategy",
      subtitle: "Content that ranks and converts",
      icon: FileText,
      color: "blue",
      items: [
        "Keyword research & mapping",
        "High-quality content creation",
        "On-page optimization (title, meta, headers)",
        "Content gap analysis",
        "User intent alignment"
      ]
    },
    {
      title: "Authority Building",
      subtitle: "Establish domain dominance",
      icon: Award,
      color: "indigo",
      items: [
        "Quality backlink acquisition",
        "Local SEO & Google Business Profile",
        "Brand mention & citation building",
        "Competitor analysis",
        "Ongoing performance tracking"
      ]
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Our <span className="gradient-text font-light">3-Tier</span> SEO System
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              A comprehensive approach that addresses every layer of search optimization.
              No shortcuts. Just proven strategies that work.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.15 }}
            >
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 h-full hover:border-teal-400/30 transition-all duration-500 group">
                {/* Icon & Badge */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${tier.color}-500 to-${tier.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <tier.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className={`px-3 py-1 bg-${tier.color}-400/10 border border-${tier.color}-400/20 rounded-full text-xs font-medium text-${tier.color}-400 uppercase tracking-wider`}>
                    Tier {index + 1}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold text-white mb-2">
                  {tier.title}
                </h3>
                <p className="text-sm text-gray-400 mb-8">
                  {tier.subtitle}
                </p>

                {/* Items */}
                <ul className="space-y-3">
                  {tier.items.map((item, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3 text-sm text-gray-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.4 + index * 0.15 + i * 0.05 }}
                    >
                      <CheckCircle2 className={`w-5 h-5 text-${tier.color}-400 flex-shrink-0 mt-0.5`} />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Connection Line (desktop only) */}
              {index < tiers.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-teal-400/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
        >
          <p className="text-gray-500 text-sm font-light max-w-2xl mx-auto">
            Each tier builds on the previous one, creating a compound effect that drives sustainable, long-term growth in organic traffic and rankings.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Traffic Growth Visualization
function TrafficGrowthSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [animatedValues, setAnimatedValues] = useState({
    visits: 0,
    leads: 0,
    revenue: 0
  })

  useEffect(() => {
    if (!isInView) return

    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps

      setAnimatedValues({
        visits: Math.floor(5832 * progress),
        leads: Math.floor(427 * progress),
        revenue: Math.floor(48600 * progress)
      })

      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [isInView])

  const metrics = [
    {
      label: "Monthly Visits",
      value: animatedValues.visits.toLocaleString(),
      change: "+141%",
      icon: Eye,
      color: "from-teal-400 to-cyan-500"
    },
    {
      label: "Qualified Leads",
      value: animatedValues.leads.toLocaleString(),
      change: "+218%",
      icon: Users,
      color: "from-blue-400 to-indigo-500"
    },
    {
      label: "Revenue Growth",
      value: `$${(animatedValues.revenue / 1000).toFixed(1)}K`,
      change: "+287%",
      icon: LineChart,
      color: "from-indigo-400 to-purple-500"
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Real <span className="gradient-text font-light">results</span>, real growth
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Average results from our SEO clients after 6 months of strategic optimization.
              These aren&apos;t vanity metrics — they&apos;re bottom-line impact.
            </p>
          </div>
        </ScrollReveal>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
            >
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center hover:border-teal-400/30 transition-all duration-500">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${metric.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <metric.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  {metric.label}
                </div>
                <div className="text-5xl font-bold text-white mb-3">
                  {metric.value}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">{metric.change}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <motion.div
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-2xl font-light text-white mb-8 text-center">
            Your SEO Journey
          </h3>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4">
            {[
              { month: "Month 1-2", action: "Foundation & Audit", desc: "Technical fixes, keyword research" },
              { month: "Month 3-4", action: "Content & Optimization", desc: "High-quality content, on-page SEO" },
              { month: "Month 5-6", action: "Authority & Scale", desc: "Link building, ranking acceleration" },
              { month: "Month 6+", action: "Sustained Growth", desc: "Ongoing optimization, compounding results" }
            ].map((phase, i) => (
              <motion.div
                key={i}
                className="flex-1 relative"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {i + 1}
                  </div>
                  <div className="text-sm text-teal-400 font-medium mb-1">{phase.month}</div>
                  <div className="text-base text-white font-light mb-1">{phase.action}</div>
                  <div className="text-xs text-gray-400">{phase.desc}</div>
                </div>

                {/* Connector Line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 bg-gradient-to-r from-teal-400/50 to-blue-500/50" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-32 px-8 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-teal-400/20 rounded-3xl p-12 md:p-16 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <Zap className="w-16 h-16 text-teal-400 mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
                Ready to <span className="gradient-text font-light">dominate</span> search results?
              </h2>
              <p className="text-xl text-gray-400 mb-10 font-light leading-relaxed max-w-2xl mx-auto">
                Let&apos;s audit your current SEO, identify opportunities, and create a custom strategy to 2x your organic traffic in 6 months.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full text-lg font-medium text-white hover:shadow-2xl hover:shadow-teal-400/30 transition-all duration-500 magnetic"
                >
                  Get Free SEO Audit
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 px-12 py-6 border border-slate-600 rounded-full text-lg font-light text-gray-300 hover:border-teal-400/30 hover:text-white transition-all duration-300 magnetic"
                >
                  View All Services
                </Link>
              </div>

              <p className="text-xs text-gray-600 mt-8 font-light">
                Free consultation • No long-term contracts • Transparent reporting
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
