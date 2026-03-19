"use client"

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Check,
  TrendingUp,
  BarChart3,
  Globe,
  Award,
  ArrowRight,
  Target,
} from "lucide-react"
import IntegrationSection from './IntegrationSection'
import dynamic from 'next/dynamic'
const BookingModal = dynamic(() => import('@/components/booking-modal').then(m => ({ default: m.BookingModal })), { ssr: false })

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

// Website Development Section — Left-Aligned, Browser/Code Theme
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
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/[0.04] via-transparent to-transparent"
           style={{ backgroundPosition: '20% 30%' }} />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:block">
        {/* Content Block — Left */}
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

          <p className="text-gray-400 leading-relaxed mb-8 font-light">
            Launch-ready websites in 2–4 weeks. Custom business tools, analytics dashboards, and seamless CRM integrations. Fast turnaround without sacrificing quality.
          </p>

          <div className="space-y-3 mb-8">
            {['2 week – 1 month development time', 'Custom business tools', 'Analytics & dashboards', 'CRM integrations'].map((feature, i) => (
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400/10 border border-cyan-400/20 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300 group"
            >
              Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Browser Mockup — Right Side */}
        <motion.div
          className="relative md:absolute md:right-0 md:top-10 w-full md:w-[55%] max-w-2xl"
          initial={{ opacity: 0, rotateY: -15 }}
          animate={isInView ? { opacity: 1, rotateY: -8 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ perspective: '1200px' }}
        >
          <div className="relative bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-xl shadow-2xl shadow-cyan-400/[0.06] overflow-hidden"
               style={{ transform: 'rotateX(4deg)' }}>
            {/* Browser Chrome */}
            <div className="bg-slate-800/80 px-4 py-3 flex items-center gap-2 border-b border-white/[0.05]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 ml-4 bg-black/30 rounded px-3 py-1.5 text-xs text-gray-500 font-light">
                https://your-business.com
              </div>
            </div>

            {/* Code Editor */}
            <div className="bg-[#0a0a0a] p-6 font-mono text-xs md:text-sm">
              <pre className="text-gray-300">
                <code>
                  {code.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="text-white/10 mr-4 select-none w-4 text-right">{i + 1}</span>
                      <span className={line.includes('export') || line.includes('return') ? 'text-cyan-400/80' :
                                       line.includes('function') ? 'text-white/60' :
                                       line.includes('className') ? 'text-cyan-400' : 'text-gray-400'}>
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
          </div>

          {/* Tech Stack Badges */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { name: 'React' },
              { name: 'Next.js' },
              { name: 'TypeScript' },
              { name: 'Tailwind' }
            ].map((tech, i) => (
              <motion.div
                key={tech.name}
                className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-300 text-xs font-medium"
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
            className="mt-8 flex items-center justify-between text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.5 }}
          >
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => (
              <div key={week} className="flex flex-col items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${i < 3 ? 'bg-cyan-400/60' : 'bg-cyan-400 animate-pulse'}`} />
                <span>{week}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// Digital Marketing Section — Right-Aligned, Funnel/Dashboard Theme
function MarketingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      ref={ref}
      className="relative min-h-[600px] md:min-h-[700px]"
      aria-label="Digital Marketing Services"
    >
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/[0.03] via-transparent to-transparent"
           style={{ backgroundPosition: '70% 30%' }} />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:block">
        {/* Content Block — Right */}
        <motion.div
          className="max-w-md mb-12 md:ml-auto md:text-right"
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
            Digital Marketing
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Digital Marketing Services
          </h2>

          <h3 className="text-2xl md:text-3xl font-light text-cyan-400 mb-6">
            ROI-Driven Campaign Management
          </h3>

          <p className="text-gray-400 leading-relaxed mb-8 font-light">
            End-to-end campaign management from strategy to execution. Create high-converting funnels, manage ad campaigns, and track every metric that matters.
          </p>

          <div className="space-y-3 flex flex-col md:items-end mb-8">
            {['Campaign funnels', 'Ad management', 'Brand strategy', 'Metric tracking'].map((feature, i) => (
              <motion.div
                key={feature}
                className="flex items-center gap-3 text-sm text-gray-400"
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 md:hidden" />
                <span>{feature}</span>
                <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 hidden md:block" />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 md:justify-end"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2 }}
          >
            <BookingModal
              triggerClassName="px-6 py-3 bg-cyan-400/20 border border-cyan-400/40 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/30 transition-all duration-300"
              triggerText="Get a Quote"
            />
            <Link
              href="/services/digital-marketing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400/10 border border-cyan-400/20 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300 group"
            >
              Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Marketing Funnel — Left Side */}
        <div className="relative md:absolute md:left-0 md:top-10 w-full md:w-[60%]">
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {[
              { label: '10,000 Impressions', width: '100%', bg: 'bg-white/[0.03] border border-white/[0.07]', text: 'text-gray-400' },
              { label: '5,200 Clicks',       width: '80%',  bg: 'bg-cyan-400/[0.07] border border-cyan-400/[0.14]', text: 'text-gray-300' },
              { label: '1,840 Leads',        width: '60%',  bg: 'bg-cyan-400/[0.14] border border-cyan-400/[0.24]', text: 'text-gray-200' },
              { label: '427 Sales',          width: '40%',  bg: 'bg-cyan-400/[0.24] border border-cyan-400/[0.40]', text: 'text-white' },
            ].map((tier, i) => (
              <motion.div
                key={tier.label}
                className={`mx-auto mb-3 relative overflow-hidden rounded-lg ${tier.bg}`}
                style={{ width: tier.width, maxWidth: '400px' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.15 }}
              >
                <div className={`px-6 py-4 text-sm md:text-base font-light text-center ${tier.text}`}>
                  {tier.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Metrics Dashboard */}
          <motion.div
            className="bg-black/60 backdrop-blur-xl border border-cyan-400/15 rounded-xl p-6 shadow-2xl max-w-md"
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
                  <metric.icon className="w-4 h-4 text-cyan-400/60 mx-auto mb-2" />
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{metric.label}</div>
                  <div className="text-xl md:text-2xl font-light text-white mb-1">{metric.value}</div>
                  <div className="text-xs text-cyan-400/70">{metric.change}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// SEO Section — Left-Aligned, Search/Ranking Theme
function SEOSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      ref={ref}
      className="relative min-h-[600px] md:min-h-[700px]"
      aria-label="SEO Services"
    >
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/[0.03] via-transparent to-transparent"
           style={{ backgroundPosition: '30% 50%' }} />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:block">
        {/* Content Block — Left */}
        <motion.div
          className="max-w-md mb-12"
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
            SEO & Content
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            SEO & Content Optimization
          </h2>

          <h3 className="text-2xl md:text-3xl font-light text-cyan-400 mb-6">
            Double Your Search Traffic
          </h3>

          <p className="text-gray-400 leading-relaxed mb-8 font-light">
            Visibility engineering that compounds over time. Strategic content management, technical website optimization, and search strategies that deliver lasting results.
          </p>

          <div className="space-y-3 mb-8">
            {['Content management', 'Visibility engineering', 'Website optimization', 'Traffic growth'].map((feature, i) => (
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
              href="/services/seo-services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400/10 border border-cyan-400/20 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300 group"
            >
              Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* SEO Visualizations — Right Side */}
        <div className="relative md:absolute md:right-0 md:top-10 w-full md:w-[55%] max-w-2xl space-y-6">
          {/* SERP Mockup — dark, brand-aligned */}
          <motion.div
            className="bg-black/70 backdrop-blur-xl rounded-xl p-5 border border-cyan-400/15 shadow-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-cyan-400/50" />
              <span className="text-xs text-gray-500 font-light">yoursite.com › services</span>
            </div>
            <h3 className="text-cyan-400 text-lg font-light mb-1.5 hover:underline cursor-pointer underline-offset-2">
              Your Business | #1 Result
            </h3>
            <p className="text-sm text-gray-500 mb-3 font-light leading-relaxed">
              Professional services that drive results. Fast turnaround, custom solutions, and expert execution.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400/80">★</span>
                  ))}
                </div>
                <span className="text-gray-500">247 reviews</span>
              </div>
            </div>
          </motion.div>

          {/* Ranking Tracker */}
          <motion.div
            className="bg-black/60 backdrop-blur-xl border border-cyan-400/15 rounded-xl p-6"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 }}
          >
            <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-5">Ranking Progress</h4>
            <div className="space-y-3">
              {[
                { pos: '#20', progress: 15, colorClass: 'bg-white/10' },
                { pos: '#15', progress: 30, colorClass: 'bg-white/20' },
                { pos: '#8',  progress: 60, colorClass: 'bg-cyan-400/30' },
                { pos: '#3',  progress: 85, colorClass: 'bg-cyan-400/60' },
                { pos: '#1',  progress: 100, colorClass: 'bg-cyan-400 shadow-sm shadow-cyan-400/40 animate-pulse' }
              ].map((rank, i) => (
                <motion.div
                  key={rank.pos}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <span className="text-gray-500 text-xs font-mono w-8">{rank.pos}</span>
                  <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className={`h-full ${rank.colorClass}`}
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${rank.progress}%` } : {}}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.6 }}
                    />
                  </div>
                  {i === 4 && (
                    <Award className="w-4 h-4 text-cyan-400" />
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
            ].map((stat) => (
              <motion.div
                key={stat.label}
                className="bg-black/60 backdrop-blur-xl border border-cyan-400/15 rounded-lg p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{stat.label}</div>
                <div className="text-2xl md:text-3xl font-light text-white mb-1">{stat.value}</div>
                <div className="text-xs text-cyan-400/70 flex items-center gap-1">
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
