"use client"

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Zap,
  Check,
  Lock,
  Network,
  Clock,
  DollarSign,
  Shield,
  TrendingUp,
  CheckCircle2,
  Workflow,
  Database,
  Cloud,
  Cpu,
  BarChart3,
  Users,
  Calendar
} from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"

export default function IntegrationAutomationContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section - Dramatic Before/After */}
      <HeroSection />

      {/* Integration Ecosystem Section */}
      <IntegrationEcosystemSection />

      {/* ROI Calculator Section */}
      <ROICalculatorSection />

      {/* Security & Methodology Section */}
      <SecurityMethodologySection />

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}

// Hero Section - Before/After Time Savings Visualization
function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section ref={ref} className="pt-32 pb-20 px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center max-w-4xl mx-auto mb-20">
            <span className="inline-block px-6 py-2 bg-purple-400/10 border border-purple-400/20 rounded-full text-sm font-medium text-purple-400 uppercase tracking-wider mb-6">
              Integration & Automation Services
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transform Your Business with{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Intelligent Automation
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8">
              Reduce manual work by 90%, connect your tools seamlessly, and scale your operations
              without hiring more staff. Custom workflow automation that pays for itself in weeks.
            </p>
          </div>
        </ScrollReveal>

        {/* Before/After Comparison */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* BEFORE - Manual Process */}
          <motion.div
            className="relative bg-slate-900/40 border border-red-500/30 rounded-2xl p-8 overflow-hidden"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-4 right-4 bg-red-500/20 border border-red-500/40 rounded-full px-4 py-1 text-xs font-medium text-red-400 uppercase">
              Before
            </div>

            <h3 className="text-2xl font-bold text-white mb-6 pt-8">Manual Process</h3>

            <div className="space-y-4 mb-8">
              {[
                { task: 'Copy data from email to spreadsheet', time: '45 min', icon: Users },
                { task: 'Manually update CRM records', time: '1.5 hrs', icon: Database },
                { task: 'Send invoices one by one', time: '2 hrs', icon: DollarSign },
                { task: 'Export and import between tools', time: '1 hr', icon: Cloud },
                { task: 'Generate weekly reports', time: '3 hrs', icon: BarChart3 }
              ].map((item, i) => (
                <motion.div
                  key={item.task}
                  className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <item.icon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{item.task}</p>
                    <p className="text-xs text-red-400 mt-1">{item.time}/week</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-red-500/20 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Total Time</span>
                <span className="text-3xl font-bold text-red-400">8 hours/week</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">≈ $400/week in labor costs</p>
            </div>
          </motion.div>

          {/* AFTER - Automated Process */}
          <motion.div
            className="relative bg-gradient-to-br from-purple-900/30 via-violet-900/20 to-fuchsia-900/30 border border-purple-400/30 rounded-2xl p-8 overflow-hidden shadow-2xl shadow-purple-500/10"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-4 right-4 bg-emerald-500/20 border border-emerald-500/40 rounded-full px-4 py-1 text-xs font-medium text-emerald-400 uppercase">
              After
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent opacity-60" />

            <h3 className="text-2xl font-bold text-white mb-6 pt-8 relative">Automated Workflow</h3>

            <div className="space-y-4 mb-8 relative">
              {[
                { task: 'Auto-sync email data to spreadsheet', time: 'Instant', icon: Workflow },
                { task: 'CRM updates automatically', time: 'Real-time', icon: Zap },
                { task: 'Invoices sent on trigger', time: 'Automated', icon: CheckCircle2 },
                { task: 'Tools sync bidirectionally', time: 'Live sync', icon: Network },
                { task: 'Reports generated automatically', time: '5 min', icon: BarChart3 }
              ].map((item, i) => (
                <motion.div
                  key={item.task}
                  className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-purple-400/10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <item.icon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{item.task}</p>
                    <p className="text-xs text-emerald-400 mt-1">{item.time}</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                </motion.div>
              ))}
            </div>

            <div className="border-t border-purple-400/20 pt-6 relative">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Total Time</span>
                <span className="text-3xl font-bold text-emerald-400">15 min/week</span>
              </div>
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                95% time reduction • $380/week saved
              </p>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2 }}
        >
          {[
            { label: 'Time Saved', value: '90%', icon: Clock },
            { label: 'Error Reduction', value: '99%', icon: CheckCircle2 },
            { label: 'ROI Timeline', value: '2-4 weeks', icon: TrendingUp },
            { label: 'Integrations', value: '200+', icon: Network }
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-slate-900/40 border border-purple-400/20 rounded-xl p-6 text-center"
            >
              <stat.icon className="w-6 h-6 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Integration Ecosystem Section - Interactive Tool Network
function IntegrationEcosystemSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const integrationCategories = [
    {
      category: 'CRM & Sales',
      tools: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM'],
      color: 'blue',
      icon: Users
    },
    {
      category: 'Payment & Finance',
      tools: ['Stripe', 'PayPal', 'QuickBooks', 'Xero'],
      color: 'emerald',
      icon: DollarSign
    },
    {
      category: 'Communication',
      tools: ['Slack', 'Teams', 'Gmail', 'Outlook'],
      color: 'purple',
      icon: Network
    },
    {
      category: 'Productivity',
      tools: ['Notion', 'Airtable', 'Asana', 'Monday.com'],
      color: 'cyan',
      icon: Workflow
    },
    {
      category: 'E-commerce',
      tools: ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento'],
      color: 'violet',
      icon: BarChart3
    },
    {
      category: 'Marketing',
      tools: ['Mailchimp', 'SendGrid', 'Google Analytics', 'Meta Ads'],
      color: 'fuchsia',
      icon: TrendingUp
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Connect Your Entire{' '}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Tech Stack
              </span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              We integrate with 200+ platforms. From CRMs to payment processors,
              marketing tools to databases - we make them work together seamlessly.
            </p>
          </div>
        </ScrollReveal>

        {/* Integration Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {integrationCategories.map((category, i) => (
            <motion.div
              key={category.category}
              className="bg-slate-900/40 backdrop-blur-sm border border-purple-400/20 rounded-xl p-6 hover:border-purple-400/40 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-${category.color}-500/10 border border-${category.color}-400/30 flex items-center justify-center`}>
                  <category.icon className={`w-5 h-5 text-${category.color}-400`} />
                </div>
                <h3 className="text-lg font-semibold text-white">{category.category}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.tools.map((tool, idx) => (
                  <span
                    key={tool}
                    className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs text-gray-300 group-hover:border-purple-400/30 transition-colors"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Integration CTA */}
        <motion.div
          className="max-w-4xl mx-auto bg-gradient-to-r from-purple-900/30 via-violet-900/30 to-fuchsia-900/30 border border-purple-400/30 rounded-2xl p-8 md:p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <Cpu className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Need a Custom Integration?
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Don't see your tool listed? We build custom API integrations for any platform.
            If it has an API (or even if it doesn't), we can connect it.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all duration-300 group"
          >
            Request Custom Integration
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ROI Calculator Section - Show Real Savings
function ROICalculatorSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [tasksAutomated, setTasksAutomated] = useState(20)

  // Calculate savings
  const avgTimePerTask = 15 // minutes
  const avgHourlyRate = 50 // dollars
  const weeklyTimeSaved = (tasksAutomated * avgTimePerTask) / 60 // hours
  const weeklySavings = weeklyTimeSaved * avgHourlyRate
  const monthlySavings = weeklySavings * 4
  const yearlySavings = monthlySavings * 12

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Calculate Your{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Cost Savings
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              See how much time and money you could save with workflow automation.
              Most clients see ROI in under 4 weeks.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Calculator Input */}
          <motion.div
            className="bg-slate-900/40 border border-purple-400/20 rounded-2xl p-8"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-white mb-6">Your Business Metrics</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-300 mb-3">
                  How many repetitive tasks per week?
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={tasksAutomated}
                  onChange={(e) => setTasksAutomated(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500">5 tasks</span>
                  <span className="text-lg font-bold text-purple-400">{tasksAutomated} tasks</span>
                  <span className="text-xs text-gray-500">100 tasks</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Avg Time/Task</div>
                  <div className="text-xl font-semibold text-white">{avgTimePerTask} min</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Avg Hourly Rate</div>
                  <div className="text-xl font-semibold text-white">${avgHourlyRate}/hr</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-gray-400 mb-2">Assumptions:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Tasks can be 90-95% automated</li>
                  <li>• Includes direct and indirect costs</li>
                  <li>• Based on industry averages</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Savings Results */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-400/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-semibold text-white">Your Projected Savings</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end pb-4 border-b border-emerald-400/20">
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Weekly Savings</div>
                    <div className="text-xs text-gray-400">{weeklyTimeSaved.toFixed(1)} hours saved</div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">
                    ${weeklySavings.toFixed(0)}
                  </div>
                </div>

                <div className="flex justify-between items-end pb-4 border-b border-emerald-400/20">
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Monthly Savings</div>
                    <div className="text-xs text-gray-400">{(weeklyTimeSaved * 4).toFixed(0)} hours saved</div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">
                    ${monthlySavings.toFixed(0)}
                  </div>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <div>
                    <div className="text-lg font-semibold text-white mb-1">Yearly Savings</div>
                    <div className="text-xs text-emerald-400">{(weeklyTimeSaved * 52).toFixed(0)} hours saved annually</div>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    ${yearlySavings.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Benefits */}
            <div className="bg-slate-900/40 border border-purple-400/20 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4">Beyond Cost Savings</h4>
              <div className="space-y-3">
                {[
                  'Eliminate human error in data entry',
                  'Real-time data synchronization',
                  'Scale operations without new hires',
                  'Free staff for strategic work',
                  '24/7 automated workflows'
                ].map((benefit, i) => (
                  <div key={benefit} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Security & Methodology Section
function SecurityMethodologySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const processSteps = [
    {
      phase: 'Discovery',
      title: 'Workflow Audit',
      description: 'We analyze your current processes to identify automation opportunities',
      duration: '1-2 days',
      icon: BarChart3
    },
    {
      phase: 'Design',
      title: 'Architecture Planning',
      description: 'Map out integrations, data flows, and security requirements',
      duration: '2-3 days',
      icon: Workflow
    },
    {
      phase: 'Build',
      title: 'Development',
      description: 'Build custom integrations with enterprise-grade security',
      duration: '1-2 weeks',
      icon: Cpu
    },
    {
      phase: 'Deploy',
      title: 'Testing & Launch',
      description: 'Rigorous testing before production deployment',
      duration: '2-3 days',
      icon: CheckCircle2
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Enterprise-Grade{' '}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Security & Process
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your data security is paramount. We follow enterprise best practices and compliance standards.
            </p>
          </div>
        </ScrollReveal>

        {/* Security Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: Shield,
              title: 'End-to-End Encryption',
              description: 'All data transfers encrypted with industry-standard protocols (TLS 1.3, AES-256)'
            },
            {
              icon: Lock,
              title: 'Secure Authentication',
              description: 'OAuth 2.0, API key rotation, and multi-factor authentication support'
            },
            {
              icon: Database,
              title: 'Data Privacy',
              description: 'GDPR & SOC 2 compliant. Your data never leaves your infrastructure'
            }
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              className="bg-slate-900/40 border border-purple-400/20 rounded-xl p-6 text-center hover:border-purple-400/40 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-400/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Implementation Process Timeline */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-10 text-center">
            Our Implementation Process
          </h3>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500/20 via-purple-500/40 to-fuchsia-500/20" />

            <div className="grid md:grid-cols-4 gap-8">
              {processSteps.map((step, i) => (
                <motion.div
                  key={step.phase}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.15 }}
                >
                  {/* Step Number Circle */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30 relative z-10">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="mt-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-xs font-medium text-purple-400">
                      {step.phase}
                    </div>
                  </div>

                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-white mb-2">{step.title}</h4>
                    <p className="text-sm text-gray-400 mb-3">{step.description}</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-purple-400">
                      <Clock className="w-3 h-3" />
                      <span>{step.duration}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Total Timeline */}
          <motion.div
            className="mt-12 text-center bg-slate-900/40 border border-purple-400/20 rounded-xl p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 1.2 }}
          >
            <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-gray-300">
              <span className="text-2xl font-bold text-white">2-3 weeks</span> average implementation time
            </p>
            <p className="text-sm text-gray-400 mt-1">From first call to production deployment</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  return (
    <section className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Automate Your Business
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Let's discuss how workflow automation can transform your operations.
            Free consultation, custom solutions, and transparent pricing.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg shadow-purple-500/30 group"
            >
              Start Your Automation Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-10 py-5 border border-purple-400/30 text-purple-400 hover:bg-purple-400/10 rounded-lg text-lg font-medium transition-all duration-300"
            >
              View Integration Case Studies
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-400" />
              <span>Free workflow audit</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-400" />
              <span>2-3 week implementation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-400" />
              <span>ROI in 4 weeks</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
