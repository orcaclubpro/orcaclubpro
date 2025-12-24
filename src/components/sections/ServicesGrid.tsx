"use client"

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Code2,
  Target,
  Search,
  Check,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  Globe,
  Award,
  Lock,
  ArrowRight,
  Shield,
  Network
} from "lucide-react"
import { services } from '@/data/services'
import IntegrationSection from './IntegrationSection'
import { BookingModal } from '@/components/booking-modal'

export default function ServicesGrid() {
  return (
    <div className="w-full space-y-32 md:space-y-40">
      <WebDevSection />
      <MarketingSection />
      <SEOSection />
      <IntegrationSection />
    </div>
  )
}

// Website Development Section - Left-Aligned, Browser/Code Theme
function WebDevSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [code, setCode] = useState('')

  const fullCode = `export function Hero() {
  return (
    <section className="hero">
      <h1>Your Business</h1>
      <p>Built with precision</p>
    </section>
  )
}`

  useEffect(() => {
    if (isInView && code.length < fullCode.length) {
      const timeout = setTimeout(() => {
        setCode(fullCode.slice(0, code.length + 1))
      }, 30)
      return () => clearTimeout(timeout)
    }
  }, [isInView, code, fullCode])

  return (
    <section
      ref={ref}
      className="relative min-h-[600px] md:min-h-[700px]"
      aria-label="Website Development Services"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent"
           style={{ backgroundPosition: '20% 30%' }} />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:block">
        {/* Content Block - Left */}
        <motion.div
          className="max-w-md mb-12"
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
            Website Development
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Custom Website Development
          </h2>

          <h3 className="text-2xl md:text-3xl font-light text-cyan-400 mb-6">
            Websites Built in Weeks, Not Months
          </h3>

          <p className="text-gray-300 leading-relaxed mb-8">
            Launch-ready websites in 2-4 weeks. Custom business tools, analytics dashboards, and seamless CRM integrations. Fast turnaround without sacrificing quality.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {['2 week - 1 month development time', 'Custom business tools', 'Analytics & dashboards', 'CRM integrations'].map((feature, i) => (
              <motion.div
                key={feature}
                className="flex items-center gap-3 text-sm text-gray-400"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2 }}
          >
            <BookingModal
              triggerClassName="px-6 py-3 bg-cyan-400/20 border border-cyan-400/40 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/30 transition-all duration-300"
              triggerText="Get a Quote"
            />
            <Link
              href="/services/web-development"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300 group"
            >
              Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Browser Mockup - Right Side */}
        <motion.div
          className="relative md:absolute md:right-0 md:top-10 w-full md:w-[55%] max-w-2xl"
          initial={{ opacity: 0, rotateY: -15 }}
          animate={isInView ? { opacity: 1, rotateY: -8 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ perspective: '1200px' }}
        >
          <div className="relative bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-xl shadow-2xl shadow-cyan-400/10 overflow-hidden"
               style={{ transform: 'rotateX(4deg)' }}>
            {/* Browser Chrome */}
            <div className="bg-slate-800/80 px-4 py-3 flex items-center gap-2 border-b border-slate-700/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 ml-4 bg-slate-900/50 rounded px-3 py-1.5 text-xs text-gray-400">
                https://your-business.com
              </div>
            </div>

            {/* Code Editor */}
            <div className="bg-[#1e1e1e] p-6 font-mono text-xs md:text-sm">
              <pre className="text-gray-300">
                <code>
                  {code.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="text-gray-600 mr-4 select-none w-4 text-right">{i + 1}</span>
                      <span className={line.includes('export') || line.includes('return') ? 'text-blue-400' :
                                       line.includes('function') ? 'text-yellow-300' :
                                       line.includes('className') ? 'text-cyan-400' : 'text-gray-300'}>
                        {line}
                      </span>
                      {i === code.split('\n').length - 1 && code.length < fullCode.length && (
                        <span className="inline-block w-1.5 h-4 bg-cyan-400 animate-pulse ml-0.5" />
                      )}
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            {/* Code Grid Pattern Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="text-cyan-400 text-6xl font-bold font-mono">{'</>'}</div>
            </div>
          </div>

          {/* Tech Stack Badges */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { name: 'React', color: 'from-blue-400 to-blue-600' },
              { name: 'Next.js', color: 'from-slate-600 to-slate-800' },
              { name: 'TypeScript', color: 'from-blue-500 to-blue-700' },
              { name: 'Tailwind', color: 'from-cyan-400 to-cyan-600' }
            ].map((tech, i) => (
              <motion.div
                key={tech.name}
                className={`px-4 py-2 rounded-lg bg-gradient-to-r ${tech.color} text-white text-xs font-medium shadow-lg`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 1.2 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                {tech.name}
              </motion.div>
            ))}
          </div>

          {/* Timeline */}
          <motion.div
            className="mt-8 flex items-center justify-between text-xs text-gray-400"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.5 }}
          >
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => (
              <div key={week} className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${i < 3 ? 'bg-cyan-400' : 'bg-cyan-400 animate-pulse'} mb-2`} />
                <span>{week}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// Digital Marketing Section - Right-Aligned, Funnel/Dashboard Theme
function MarketingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      ref={ref}
      className="relative min-h-[600px] md:min-h-[700px]"
      aria-label="Digital Marketing Services"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-indigo-500/5 via-transparent to-transparent"
           style={{ backgroundPosition: '70% 30%' }} />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:block">
        {/* Content Block - Right */}
        <motion.div
          className="max-w-md mb-12 md:ml-auto md:text-right"
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-blue-400/10 border border-blue-400/20 rounded-full text-xs font-medium text-blue-400 uppercase tracking-wider mb-6">
            Digital Marketing
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Digital Marketing Services
          </h2>

          <h3 className="text-2xl md:text-3xl font-light bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-6">
            ROI-Driven Campaign Management
          </h3>

          <p className="text-gray-300 leading-relaxed mb-8">
            End-to-end campaign management from strategy to execution. Create high-converting funnels, manage ad campaigns, and track every metric that matters.
          </p>

          {/* Features */}
          <div className="space-y-3 flex flex-col md:items-end mb-8">
            {['Campaign funnels', 'Ad management', 'Brand strategy', 'Metric tracking'].map((feature, i) => (
              <motion.div
                key={feature}
                className="flex items-center gap-3 text-sm text-gray-400"
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <Check className="w-4 h-4 text-blue-400 flex-shrink-0 md:hidden" />
                <span>{feature}</span>
                <Check className="w-4 h-4 text-blue-400 flex-shrink-0 hidden md:block" />
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 md:justify-end"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2 }}
          >
            <BookingModal
              triggerClassName="px-6 py-3 bg-blue-400/20 border border-blue-400/40 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-400/30 transition-all duration-300"
              triggerText="Get a Quote"
            />
            <Link
              href="/services/digital-marketing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-400/10 border border-blue-400/30 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-400/20 transition-all duration-300 group"
            >
              Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Marketing Funnel - Left Side */}
        <div className="relative md:absolute md:left-0 md:top-10 w-full md:w-[60%]">
          {/* Funnel Visualization */}
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {[
              { label: '10,000 Impressions', width: '100%', color: 'from-blue-200 to-blue-300' },
              { label: '5,200 Clicks', width: '80%', color: 'from-blue-300 to-blue-400' },
              { label: '1,840 Leads', width: '60%', color: 'from-blue-400 to-blue-500' },
              { label: '427 Sales', width: '40%', color: 'from-blue-500 to-emerald-400' }
            ].map((tier, i) => (
              <motion.div
                key={tier.label}
                className={`mx-auto mb-3 relative overflow-hidden rounded-lg bg-gradient-to-r ${tier.color} shadow-lg`}
                style={{ width: tier.width, maxWidth: '400px' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.15 }}
              >
                <div className="px-6 py-4 text-white text-sm md:text-base font-medium text-center backdrop-blur-sm">
                  {tier.label}
                </div>
                {/* Flowing particles */}
                {isInView && (
                  <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/60 rounded-full animate-ping"
                       style={{ animationDelay: `${i * 0.3}s` }} />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Metrics Dashboard */}
          <motion.div
            className="bg-slate-900/60 backdrop-blur-xl border border-blue-400/20 rounded-xl p-6 shadow-2xl max-w-md"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1 }}
          >
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'CTR', value: '5.2%', change: '+12%', icon: Target },
                { label: 'CPA', value: '$24', change: '-18%', icon: TrendingUp },
                { label: 'ROAS', value: '4.8x', change: '+32%', icon: BarChart3 }
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 1.2 + i * 0.1 }}
                >
                  <metric.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{metric.label}</div>
                  <div className="text-xl md:text-2xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-xs text-emerald-400">{metric.change}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// SEO Section - Left-Aligned, Search/Ranking Theme
function SEOSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      ref={ref}
      className="relative min-h-[600px] md:min-h-[700px]"
      aria-label="SEO Services"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-teal-500/5 via-transparent to-transparent"
           style={{ backgroundPosition: '30% 50%' }} />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:block">
        {/* Content Block - Left */}
        <motion.div
          className="max-w-md mb-12"
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-teal-400/10 border border-teal-400/20 rounded-full text-xs font-medium text-teal-400 uppercase tracking-wider mb-6">
            SEO & Content
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            SEO & Content Optimization
          </h2>

          <h3 className="text-2xl md:text-3xl font-light text-teal-400 mb-6">
            Double Your Search Traffic
          </h3>

          <p className="text-gray-300 leading-relaxed mb-8">
            Visibility engineering that compounds over time. Strategic content management, technical website optimization, and search strategies that deliver lasting results.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {['Content management', 'Visibility engineering', 'Website optimization', 'Traffic growth'].map((feature, i) => (
              <motion.div
                key={feature}
                className="flex items-center gap-3 text-sm text-gray-400"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <Check className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2 }}
          >
            <BookingModal
              triggerClassName="px-6 py-3 bg-teal-400/20 border border-teal-400/40 rounded-lg text-sm font-medium text-teal-400 hover:bg-teal-400/30 transition-all duration-300"
              triggerText="Get a Quote"
            />
            <Link
              href="/services/seo-services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-400/10 border border-teal-400/30 rounded-lg text-sm font-medium text-teal-400 hover:bg-teal-400/20 transition-all duration-300 group"
            >
              Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* SEO Visualizations - Right Side */}
        <div className="relative md:absolute md:right-0 md:top-10 w-full md:w-[55%] max-w-2xl space-y-6">
          {/* Google SERP Mockup */}
          <motion.div
            className="bg-white rounded-lg shadow-2xl p-4 border border-gray-200"
            initial={{ opacity: 0, y: -20, rotateX: 10 }}
            animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">yoursite.com › services</span>
            </div>
            <h3 className="text-blue-600 text-lg font-normal mb-1 hover:underline cursor-pointer">
              Your Business | #1 Result
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Professional services that drive results. Fast turnaround, custom solutions, and expert execution.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <span className="text-gray-600">247 reviews</span>
              </div>
            </div>
          </motion.div>

          {/* Ranking Tracker */}
          <motion.div
            className="bg-slate-900/60 backdrop-blur-xl border border-teal-400/20 rounded-xl p-6"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 }}
          >
            <h4 className="text-sm font-medium text-gray-400 mb-4">Ranking Progress</h4>
            <div className="space-y-3">
              {[
                { pos: '#20', progress: 15, color: 'bg-gray-500' },
                { pos: '#15', progress: 30, color: 'bg-gray-400' },
                { pos: '#8', progress: 60, color: 'bg-yellow-500' },
                { pos: '#3', progress: 85, color: 'bg-teal-500' },
                { pos: '#1', progress: 100, color: 'bg-teal-400 shadow-lg shadow-teal-400/50 animate-pulse' }
              ].map((rank, i) => (
                <motion.div
                  key={rank.pos}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <span className="text-gray-400 text-sm font-mono w-8">{rank.pos}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-full ${rank.color}`}
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${rank.progress}%` } : {}}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.6 }}
                    />
                  </div>
                  {i === 4 && (
                    <Award className="w-4 h-4 text-teal-400" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Traffic Growth Stats */}
          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1 }}
          >
            {[
              { label: 'Monthly Visits', value: '5.8K', change: '+141%' },
              { label: 'Domain Authority', value: '67', change: '+12' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="bg-slate-900/60 backdrop-blur-xl border border-teal-400/20 rounded-lg p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">{stat.label}</div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
