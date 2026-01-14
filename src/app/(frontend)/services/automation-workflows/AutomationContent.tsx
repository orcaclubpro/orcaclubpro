"use client"

import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { motion, useInView } from "motion/react"
import { useState, useRef } from "react"
import {
  ArrowRight,
  Zap,
  CheckCircle2,
  XCircle,
  Mail,
  Users,
  Bell,
  FileText,
  ShoppingCart,
  Calendar,
  BarChart3,
  Package,
  ChevronDown,
  Workflow,
  Cog,
  Clock,
  AlertCircle,
  TrendingUp,
  Code2,
  Server,
  DollarSign,
  RefreshCw,
  Database,
  MessageSquare,
  Share2
} from "lucide-react"

export default function AutomationContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section */}
      <ProblemSection />

      {/* Automation Types Section */}
      <AutomationTypesSection />

      {/* Workflow Diagram Section */}
      <WorkflowDiagramSection />

      {/* Tools Section */}
      <ToolsSection />

      {/* Industry Use Cases Section */}
      <IndustryUseCasesSection />

      {/* Zapier vs Custom Section */}
      <ZapierVsCustomSection />

      {/* Our Process Section */}
      <ProcessSection />

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
              Workflow Automation Services
            </span>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-6">
              Work Smarter with <span className="gradient-text font-light">Automation</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              Stop wasting hours on manual processes. We build <strong className="text-white font-normal">marketing automation</strong>, <strong className="text-white font-normal">workflow automation</strong>, and <strong className="text-white font-normal">business process automation</strong> that saves you time and scales with your growth.
            </p>
          </div>
        </ScrollReveal>

        {/* Key Value Proposition */}
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
                  Reclaim Your Time
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  The average business wastes <span className="text-cyan-400 font-medium">10+ hours per week</span> on tasks that could be automated. From lead follow-ups to report generation, we identify and automate the processes slowing you down.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                  <Zap className="w-12 h-12 text-cyan-400" />
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
            { label: 'Time Saved', value: '90%', icon: Clock },
            { label: 'Error Reduction', value: '99%', icon: CheckCircle2 },
            { label: 'Tools Connected', value: '200+', icon: Share2 },
            { label: 'ROI Timeline', value: '2-4 wks', icon: TrendingUp }
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

  const problems = [
    {
      icon: Clock,
      title: 'Manual Data Entry Eating Hours',
      description: 'Copying information between spreadsheets, CRMs, and tools. Hours lost to mind-numbing repetitive tasks.'
    },
    {
      icon: AlertCircle,
      title: 'Leads Falling Through the Cracks',
      description: 'Without automated follow-up, hot leads go cold. Forgetting to respond costs you sales every week.'
    },
    {
      icon: RefreshCw,
      title: 'Inconsistent Follow-Up',
      description: 'Some leads get 5 touches, others get none. Manual processes create inconsistent customer experiences.'
    },
    {
      icon: XCircle,
      title: 'Human Errors in Repetitive Tasks',
      description: 'Typos, missed steps, wrong data. When humans do the same task 100 times, mistakes happen.'
    },
    {
      icon: Users,
      title: 'Cannot Scale Without Hiring',
      description: 'Every new customer means more manual work. You need to hire just to keep up with operations.'
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Sound <span className="text-red-400 font-light">Familiar</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Manual processes drain your time, create errors, and limit growth. Here's what we hear from businesses before they automate.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              className="bg-slate-900/60 backdrop-blur-xl border border-red-400/20 rounded-xl p-6 hover:border-red-400/40 transition-all duration-500"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="p-3 rounded-lg bg-red-400/10 w-fit mb-4">
                <problem.icon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{problem.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-500 text-lg font-light">
            These problems have solutions. <span className="text-cyan-400">Automation</span> eliminates them all.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Automation Types Section
function AutomationTypesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const automationTypes = [
    {
      icon: Users,
      title: 'Lead Automation',
      description: 'Capture leads from any source, sync to your CRM, trigger email sequences, and notify your sales team - all automatically.',
      flow: ['Lead Capture', 'CRM Sync', 'Email Sequence', 'Sales Alert'],
      color: 'cyan'
    },
    {
      icon: Mail,
      title: 'Email Marketing Automation',
      description: 'Welcome sequences for new subscribers, abandoned cart recovery, re-engagement campaigns for inactive customers.',
      flow: ['Trigger Event', 'Segment', 'Send Email', 'Track & Optimize'],
      color: 'blue'
    },
    {
      icon: TrendingUp,
      title: 'Sales Automation',
      description: 'Automatic lead scoring based on behavior, smart assignment routing to the right rep, follow-up reminders that never let leads go cold.',
      flow: ['Lead Score', 'Assign Rep', 'Schedule Follow-up', 'Track Deal'],
      color: 'indigo'
    },
    {
      icon: FileText,
      title: 'Client Onboarding',
      description: 'New client signs? Automated welcome emails, account setup, task creation for your team, and milestone tracking.',
      flow: ['New Client', 'Welcome Email', 'Setup Account', 'Create Tasks'],
      color: 'violet'
    },
    {
      icon: Bell,
      title: 'Notification Systems',
      description: 'Slack alerts for new sales, email notifications for support tickets, SMS for urgent issues. Stay informed without checking dashboards.',
      flow: ['Event Trigger', 'Filter Rules', 'Route Channel', 'Deliver Alert'],
      color: 'purple'
    },
    {
      icon: BarChart3,
      title: 'Report Generation',
      description: 'Daily sales summaries, weekly performance reports, monthly analytics - generated and delivered automatically.',
      flow: ['Pull Data', 'Calculate Metrics', 'Format Report', 'Schedule Delivery'],
      color: 'fuchsia'
    },
    {
      icon: Package,
      title: 'Inventory Alerts',
      description: 'Low stock notifications before you run out, automatic reorder triggers, supplier notifications when inventory needs replenishing.',
      flow: ['Monitor Stock', 'Threshold Check', 'Alert Team', 'Trigger Reorder'],
      color: 'pink'
    },
    {
      icon: Calendar,
      title: 'Booking Automation',
      description: 'Confirmation emails when appointments are booked, reminder sequences before meetings, follow-up emails after consultations.',
      flow: ['Booking Made', 'Confirm Email', 'Send Reminders', 'Follow-up'],
      color: 'rose'
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Automation Types
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              What We <span className="gradient-text font-light">Automate</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              From lead capture to inventory management, we build automation for every stage of your business operations.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {automationTypes.map((automation, index) => (
            <motion.div
              key={automation.title}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-500 group"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="p-3 rounded-lg bg-cyan-400/10 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <automation.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{automation.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{automation.description}</p>

              {/* Mini Flow Diagram */}
              <div className="space-y-2">
                {automation.flow.map((step, i) => (
                  <div key={step} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center text-[10px] font-medium">
                      {i + 1}
                    </span>
                    <span className="text-gray-500">{step}</span>
                    {i < automation.flow.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-gray-600 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Workflow Diagram Section
function WorkflowDiagramSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const workflowSteps = [
    { icon: Users, label: 'Lead Submits Form', sublabel: 'Website, Landing Page, Ad' },
    { icon: Database, label: 'CRM Updated', sublabel: 'Contact Created, Tags Added' },
    { icon: Mail, label: 'Email Sequence Starts', sublabel: 'Welcome, Nurture, Convert' },
    { icon: Bell, label: 'Sales Team Notified', sublabel: 'Slack, Email, SMS' },
    { icon: Calendar, label: 'Meeting Scheduled', sublabel: 'Auto Calendar Booking' },
    { icon: CheckCircle2, label: 'Deal Closed', sublabel: 'Invoice & Onboarding Triggered' }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Example Workflow
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Lead to <span className="gradient-text font-light">Customer</span> Automation
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              See how a fully automated lead workflow turns website visitors into paying customers without manual intervention.
            </p>
          </div>
        </ScrollReveal>

        {/* Workflow Diagram */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-16 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-cyan-500/20 via-cyan-500/40 to-cyan-500/20" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.label}
                className="relative flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                {/* Step Circle */}
                <div className="relative z-10 mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-xs font-bold text-cyan-400">
                    {index + 1}
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-white mb-1">{step.label}</h4>
                <p className="text-xs text-gray-500">{step.sublabel}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Result Stats */}
        <motion.div
          className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1 }}
        >
          {[
            { label: 'Manual Time Saved', value: '15 hrs/week', icon: Clock },
            { label: 'Lead Response Time', value: '< 5 minutes', icon: Zap },
            { label: 'Follow-up Rate', value: '100%', icon: CheckCircle2 }
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900/40 backdrop-blur-xl border border-cyan-400/20 rounded-xl p-6 text-center"
            >
              <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Tools Section
function ToolsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const toolCategories = [
    {
      category: 'Automation Platforms',
      tools: ['Zapier', 'Make (Integromat)', 'n8n', 'Custom Node.js'],
      description: 'We choose the right platform based on complexity, volume, and cost.'
    },
    {
      category: 'CRM & Sales',
      tools: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Close'],
      description: 'Automate your sales pipeline and customer relationships.'
    },
    {
      category: 'Email Marketing',
      tools: ['Mailchimp', 'Klaviyo', 'SendGrid', 'ConvertKit', 'ActiveCampaign'],
      description: 'Trigger sequences based on behavior and events.'
    },
    {
      category: 'Communication',
      tools: ['Slack', 'Microsoft Teams', 'Twilio SMS', 'Gmail', 'Outlook'],
      description: 'Route notifications to the right people at the right time.'
    },
    {
      category: 'Payments & Finance',
      tools: ['Stripe', 'PayPal', 'QuickBooks', 'Xero', 'Square'],
      description: 'Automate invoicing, payment follow-ups, and reconciliation.'
    },
    {
      category: 'E-commerce',
      tools: ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento'],
      description: 'Order processing, inventory alerts, and customer automation.'
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Integrations
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Tools We <span className="gradient-text font-light">Connect</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              We integrate with 200+ platforms. If it has an API, we can automate it.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolCategories.map((category, index) => (
            <motion.div
              key={category.category}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-500"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <h3 className="text-lg font-semibold text-white mb-2">{category.category}</h3>
              <p className="text-sm text-gray-400 mb-4">{category.description}</p>
              <div className="flex flex-wrap gap-2">
                {category.tools.map((tool) => (
                  <span
                    key={tool}
                    className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs text-gray-300"
                  >
                    {tool}
                  </span>
                ))}
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
            Don't see your tool? <span className="text-cyan-400">We can connect any platform with an API.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Industry Use Cases Section
function IndustryUseCasesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const industries = [
    {
      industry: 'E-commerce',
      icon: ShoppingCart,
      automations: [
        'Order confirmation emails with tracking info',
        'Shipping notifications at each status update',
        'Post-purchase review request sequences',
        'Abandoned cart recovery emails',
        'Low stock alerts and reorder triggers',
        'Customer win-back campaigns for inactive buyers'
      ]
    },
    {
      industry: 'Service Businesses',
      icon: Calendar,
      automations: [
        'Appointment confirmation and calendar invites',
        '24-hour and 1-hour reminder emails/SMS',
        'No-show follow-up and rescheduling offers',
        'Post-service feedback and review requests',
        'Rebooking reminders for recurring services',
        'Birthday and anniversary outreach'
      ]
    },
    {
      industry: 'B2B / SaaS',
      icon: Users,
      automations: [
        'Lead scoring based on engagement signals',
        'Multi-touch nurture sequences by funnel stage',
        'Proposal sent notifications with follow-up triggers',
        'Contract renewal reminders 60/30/7 days out',
        'Onboarding milestone emails and task creation',
        'Usage-based upsell triggers'
      ]
    },
    {
      industry: 'Agencies',
      icon: BarChart3,
      automations: [
        'Automated weekly/monthly client reports',
        'Project milestone notifications',
        'Time tracking and budget alerts',
        'Invoice generation and payment reminders',
        'Client portal access provisioning',
        'Team assignment and capacity alerts'
      ]
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              By Industry
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Automation <span className="gradient-text font-light">Use Cases</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Different industries have different automation needs. Here's what works for businesses like yours.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {industries.map((industry, index) => (
            <motion.div
              key={industry.industry}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-400/30 transition-all duration-500"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-xl bg-cyan-400/10">
                  <industry.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">{industry.industry}</h3>
              </div>
              <ul className="space-y-3">
                {industry.automations.map((automation, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{automation}</span>
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

// Zapier vs Custom Section
function ZapierVsCustomSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Honest Advice
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Zapier vs <span className="gradient-text font-light">Custom Automation</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Sometimes Zapier is the right choice. Sometimes custom code is better. Here's how to decide.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Zapier / Make */}
          <motion.div
            className="bg-slate-900/60 backdrop-blur-xl border border-orange-400/20 rounded-2xl p-8"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-orange-400/10">
                <Workflow className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Zapier / Make</h3>
                <p className="text-sm text-gray-400">No-code automation platforms</p>
              </div>
            </div>

            <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Best For:</h4>
            <ul className="space-y-3 mb-6">
              {[
                'Simple workflows with 5 or fewer steps',
                'Standard triggers and actions',
                'Quick implementation (days, not weeks)',
                'Businesses with changing requirements',
                'Lower task volumes (< 10,000/month)'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>

            <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Considerations:</h4>
            <ul className="space-y-2">
              {[
                'Monthly subscription costs add up',
                'Limited by platform capabilities',
                'Can be slow for complex logic'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Custom Automation */}
          <motion.div
            className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-cyan-400/10">
                <Code2 className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Custom Automation</h3>
                <p className="text-sm text-gray-400">API integrations & Node.js</p>
              </div>
            </div>

            <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Best For:</h4>
            <ul className="space-y-3 mb-6">
              {[
                'Complex business logic and conditions',
                'High-volume operations (10,000+ tasks)',
                'Real-time or near-real-time requirements',
                'Custom data transformations',
                'When monthly Zapier costs exceed build cost'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>

            <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Considerations:</h4>
            <ul className="space-y-2">
              {[
                'Higher upfront investment',
                'Longer implementation time',
                'Requires technical maintenance'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Decision Helper */}
        <motion.div
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
        >
          <DollarSign className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">The Cost Calculation</h4>
          <p className="text-gray-400 max-w-2xl mx-auto">
            If your Zapier bill exceeds <span className="text-cyan-400 font-medium">$200-300/month</span>,
            custom automation often makes more sense financially. We'll help you calculate the break-even point
            and recommend the right approach for your situation.
          </p>
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
      phase: '01',
      title: 'Map Current Workflow',
      description: 'We document your existing processes, identify bottlenecks, and find automation opportunities.',
      icon: Workflow,
      duration: '1-2 days'
    },
    {
      phase: '02',
      title: 'Identify Automation Points',
      description: 'Prioritize which processes to automate first based on time savings and complexity.',
      icon: Cog,
      duration: '1 day'
    },
    {
      phase: '03',
      title: 'Build & Configure',
      description: 'Develop automations using the right tools - Zapier, Make, or custom code.',
      icon: Code2,
      duration: '1-2 weeks'
    },
    {
      phase: '04',
      title: 'Test & Refine',
      description: 'Test with real data, handle edge cases, and optimize for reliability.',
      icon: RefreshCw,
      duration: '2-3 days'
    },
    {
      phase: '05',
      title: 'Monitor & Document',
      description: 'Set up monitoring, create documentation, and train your team.',
      icon: BarChart3,
      duration: '1-2 days'
    }
  ]

  return (
    <section ref={ref} className="py-24 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Our Approach
            </span>
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Our <span className="gradient-text font-light">Automation Process</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              From workflow mapping to live automation, here's how we transform your manual processes.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.phase}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 md:p-8 hover:border-cyan-400/30 transition-all duration-500"
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4 md:w-1/3">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <span className="text-cyan-400 font-mono text-sm">{step.phase}</span>
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  </div>
                </div>
                <div className="md:w-2/3 md:border-l md:border-slate-700/50 md:pl-6">
                  <p className="text-gray-400 leading-relaxed mb-2">{step.description}</p>
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <Clock className="w-4 h-4" />
                    <span>{step.duration}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-400 text-lg">
            Total timeline: <span className="text-cyan-400 font-semibold">2-3 weeks</span> for most automation projects
          </p>
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
      question: 'How much does workflow automation cost?',
      answer: 'Automation projects start in our Scale tier ($3K-5K) for basic workflow automation connecting 2-4 platforms. Complex multi-platform automations with custom API development fall into our Enterprise tier ($6K-30K). Most clients see ROI within 2-4 weeks through time savings.'
    },
    {
      question: 'Should I use Zapier or custom automation?',
      answer: 'Zapier is great for simple workflows with fewer than 5 steps and standard triggers. Custom automation is better for complex logic, high-volume operations, real-time requirements, or when Zapier\'s monthly costs exceed a one-time custom build. We help you choose the right approach.'
    },
    {
      question: 'How long does automation implementation take?',
      answer: 'Simple automations using Zapier or Make can be implemented in 1-2 weeks. Custom API automations typically take 2-3 weeks. Enterprise-level workflow systems with multiple integrations take 3-4 weeks. We provide a detailed timeline during our discovery phase.'
    },
    {
      question: 'What happens if an automation breaks?',
      answer: 'We build automations with error handling, notifications, and monitoring. If something fails, you\'re notified immediately. We also provide documentation so your team can troubleshoot common issues. For critical workflows, we can set up redundancy and fallback processes.'
    },
    {
      question: 'What tools can you automate?',
      answer: 'We can automate any tool with an API or Zapier/Make integration. Common platforms include Salesforce, HubSpot, Stripe, Shopify, Slack, Gmail, Google Sheets, Notion, Airtable, QuickBooks, and hundreds more. If it has an API, we can connect it.'
    },
    {
      question: 'Do I need ongoing maintenance for automations?',
      answer: 'Well-built automations rarely need maintenance. However, API changes or business process updates may require adjustments. We provide documentation and training so your team can handle minor changes. For ongoing support, we offer maintenance packages.'
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
              Common questions about our automation services
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
            <Zap className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
              Ready to <span className="gradient-text font-light">Automate Your Workflows</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-10 font-light leading-relaxed max-w-2xl mx-auto">
              Stop wasting time on manual processes. Let's identify your biggest automation opportunities
              and build workflows that save hours every week.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/packages/scale"
                className="group inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-lg font-medium text-white hover:shadow-2xl hover:shadow-cyan-400/30 transition-all duration-500"
              >
                Automate Your Workflows
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-12 py-6 border border-slate-600 rounded-full text-lg font-light text-gray-300 hover:border-cyan-400/30 hover:text-white transition-all duration-300"
              >
                Free Workflow Audit
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-8 font-light">
              Free consultation | 2-3 week implementation | ROI in 4 weeks
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
      title: 'API Integrations',
      description: 'Connect any platform with custom API development',
      href: '/services/api-integrations',
      icon: Server
    },
    {
      title: 'Analytics Tracking',
      description: 'Measure the impact of your automations with proper analytics',
      href: '/services/analytics-tracking',
      icon: BarChart3
    },
    {
      title: 'E-commerce',
      description: 'Automation solutions for online stores and Shopify',
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
