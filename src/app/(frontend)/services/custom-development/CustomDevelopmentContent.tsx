'use client'

import Link from "next/link"
import {
  ArrowRight,
  Code2,
  Users,
  Shield,
  Zap,
  CheckCircle,
  X,
  ChevronDown,
  Layers,
  Globe,
  Lock,
  BarChart3,
  FileText,
  Calendar,
  CreditCard,
  Bell,
  Database,
  Settings,
  Boxes,
  Truck,
  ClipboardList,
  UserCheck,
  Key,
  Gauge,
  Server,
  GitBranch,
  Puzzle,
  Lightbulb,
  Palette,
  Wrench,
  Rocket
} from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import { useState } from "react"

// Problem points with off-the-shelf software
const problems = [
  {
    title: "Generic Software Doesn't Fit",
    description: "Off-the-shelf tools force you to adapt your workflow to their design. Your business is unique - why should your software be generic?"
  },
  {
    title: "Paying for Features You Don't Use",
    description: "SaaS subscriptions charge you monthly for 100 features when you only need 10. That's wasted budget that could fund custom solutions."
  },
  {
    title: "Can't Customize Enough",
    description: "You've hit the limits of your current tools. Workarounds and duct-tape integrations are slowing your team down."
  },
  {
    title: "No Competitive Advantage",
    description: "If you use the same tools as everyone else, you get the same capabilities. Custom software is a strategic asset, not a commodity."
  },
  {
    title: "Manual Processes Eating Time",
    description: "Your team spends hours on tasks that should be automated. Data entry, report generation, status updates - all of it could be streamlined."
  }
]

// Custom solutions we build
const solutionCategories = [
  {
    title: "Client Portals",
    icon: Users,
    color: "cyan",
    description: "Give your clients a premium self-service experience",
    features: [
      "Customer self-service portals",
      "Secure document sharing",
      "Project status dashboards",
      "Invoice and payment management",
      "Support ticket systems"
    ]
  },
  {
    title: "Admin Dashboards",
    icon: BarChart3,
    color: "blue",
    description: "Command center for your internal operations",
    features: [
      "Internal operations dashboards",
      "Real-time data visualization",
      "User management systems",
      "Content moderation tools",
      "Reporting and analytics"
    ]
  },
  {
    title: "Inventory & Order Management",
    icon: Boxes,
    color: "indigo",
    description: "Track every item from supplier to customer",
    features: [
      "Custom inventory tracking",
      "Multi-warehouse management",
      "Order processing workflows",
      "Supplier management",
      "Stock alerts and reordering"
    ]
  },
  {
    title: "Booking & Scheduling",
    icon: Calendar,
    color: "purple",
    description: "Let customers book without the back-and-forth",
    features: [
      "Appointment scheduling",
      "Resource management",
      "Calendar integrations",
      "Automated reminders",
      "Payment processing"
    ]
  },
  {
    title: "SaaS Foundations",
    icon: Globe,
    color: "emerald",
    description: "Build your own software product",
    features: [
      "Multi-tenant architecture",
      "Subscription management",
      "User authentication (SSO, 2FA)",
      "API for third-party access",
      "Usage metering and billing"
    ]
  }
]

// Tech stack
const techStack = [
  {
    name: "React",
    description: "Component-based UI library for interactive interfaces",
    icon: Code2
  },
  {
    name: "Next.js",
    description: "Full-stack framework with server-side rendering and API routes",
    icon: Server
  },
  {
    name: "TypeScript",
    description: "Type-safe JavaScript that catches bugs before production",
    icon: Shield
  },
  {
    name: "Node.js",
    description: "JavaScript runtime for backend services and APIs",
    icon: Settings
  },
  {
    name: "Payload CMS",
    description: "Headless CMS for content management and admin panels",
    icon: Database
  },
  {
    name: "PostgreSQL / MongoDB",
    description: "Enterprise databases for structured or flexible data",
    icon: Database
  }
]

// Development process
const processSteps = [
  {
    phase: "Discovery",
    timeline: "2-3 days",
    icon: Lightbulb,
    color: "cyan",
    description: "We dive deep into your business requirements",
    activities: [
      "Stakeholder interviews",
      "Workflow mapping",
      "Technical requirements gathering",
      "Integration inventory",
      "Project scope definition"
    ]
  },
  {
    phase: "Design",
    timeline: "3-5 days",
    icon: Palette,
    color: "blue",
    description: "We architect the solution and design the experience",
    activities: [
      "System architecture design",
      "Database schema planning",
      "UI/UX wireframes",
      "API design",
      "Design review and approval"
    ]
  },
  {
    phase: "Development",
    timeline: "7-10 days",
    icon: Wrench,
    color: "indigo",
    description: "We build your application with daily progress updates",
    activities: [
      "Iterative development sprints",
      "Daily progress updates",
      "Staging environment access",
      "Continuous integration",
      "Code review and testing"
    ]
  },
  {
    phase: "Deployment",
    timeline: "2-3 days",
    icon: Rocket,
    color: "purple",
    description: "We launch and ensure a smooth handoff",
    activities: [
      "Production deployment",
      "Performance optimization",
      "Team training sessions",
      "Documentation handoff",
      "Post-launch support"
    ]
  }
]

// Custom vs off-the-shelf comparison
const comparisonData = [
  {
    factor: "Initial Cost",
    offShelf: "Low monthly fee",
    custom: "Higher upfront investment",
    customWins: false,
    note: "But no recurring per-seat costs"
  },
  {
    factor: "Long-term Cost",
    offShelf: "Escalating subscriptions",
    custom: "Fixed ownership cost",
    customWins: true,
    note: "ROI typically in 12-18 months"
  },
  {
    factor: "Feature Fit",
    offShelf: "60-70% of what you need",
    custom: "100% tailored to your workflow",
    customWins: true,
    note: ""
  },
  {
    factor: "Competitive Edge",
    offShelf: "Same as competitors",
    custom: "Unique capability",
    customWins: true,
    note: ""
  },
  {
    factor: "Integration",
    offShelf: "Limited by vendor",
    custom: "Connects to anything",
    customWins: true,
    note: ""
  },
  {
    factor: "Scaling",
    offShelf: "Per-seat pricing adds up",
    custom: "Unlimited users included",
    customWins: true,
    note: ""
  },
  {
    factor: "Data Ownership",
    offShelf: "On vendor servers",
    custom: "You own everything",
    customWins: true,
    note: ""
  },
  {
    factor: "Customization",
    offShelf: "Request and wait",
    custom: "Build exactly what you need",
    customWins: true,
    note: ""
  }
]

// FAQ data
const faqs = [
  {
    question: "How long does custom web application development take?",
    answer: "Custom application timelines vary by complexity. Simple client portals or admin dashboards typically take 2-4 weeks. More complex systems like inventory management or booking platforms take 4-8 weeks. Full SaaS platforms with multi-tenancy can take 8-12+ weeks. We provide detailed timelines after our discovery phase."
  },
  {
    question: "How much does custom web application development cost?",
    answer: "Custom applications fall under our Enterprise tier, starting at $6K for simpler applications and ranging up to $30K+ for complex SaaS platforms. Pricing depends on features, integrations, and complexity. We provide fixed-price quotes after discovery so there are no surprises."
  },
  {
    question: "Do you provide ongoing maintenance and support?",
    answer: "Yes. We offer monthly maintenance packages from $300-1,200/mo that include bug fixes, security updates, minor feature additions, and priority support. We also provide documentation and training so your team can handle day-to-day operations."
  },
  {
    question: "Who owns the code and intellectual property?",
    answer: "You do. Upon final payment, you receive full ownership of all custom code, designs, and documentation. We provide complete source code access and deployment credentials. There's no vendor lock-in - you can host anywhere and hire any team to maintain it."
  },
  {
    question: "Can you integrate with our existing systems?",
    answer: "Yes. We specialize in integrations with CRMs (Salesforce, HubSpot), payment systems (Stripe, Square), ERPs, accounting software, and custom APIs. If it has an API, we can integrate it. We also build custom APIs for systems that don't have one."
  },
  {
    question: "What technologies do you use for custom development?",
    answer: "Our core stack is React, Next.js, TypeScript, and Node.js for the frontend and backend. For databases, we use PostgreSQL or MongoDB depending on your needs. We also use Payload CMS for content management, Stripe for payments, and deploy on Vercel or AWS."
  }
]

// Case study types
const projectTypes = [
  {
    title: "Client Portal for Professional Services",
    description: "Law firm needed a secure portal for client document exchange, case status tracking, and billing. Reduced email volume by 60% and improved client satisfaction.",
    industry: "Legal / Professional Services"
  },
  {
    title: "Inventory Management for Distributor",
    description: "Multi-location distributor needed real-time inventory across 5 warehouses with automated reorder points and supplier integration.",
    industry: "Distribution / Logistics"
  },
  {
    title: "Booking Platform for Healthcare",
    description: "Medical practice needed appointment scheduling with insurance verification, automated reminders, and telehealth integration.",
    industry: "Healthcare"
  },
  {
    title: "Internal Dashboard for Operations",
    description: "Manufacturing company needed real-time production metrics, quality control tracking, and shift management in one view.",
    industry: "Manufacturing"
  }
]

export default function CustomDevelopmentContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section */}
      <ProblemSection />

      {/* Solutions We Build */}
      <SolutionsSection />

      {/* Development Process */}
      <ProcessSection />

      {/* Tech Stack */}
      <TechStackSection />

      {/* Custom vs Off-the-Shelf */}
      <ComparisonSection />

      {/* Case Studies */}
      <CaseStudiesSection />

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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-400/10 border border-indigo-400/20 rounded-full text-indigo-400 text-sm mb-8">
            <Puzzle className="w-4 h-4" />
            Enterprise Development
          </div>
          <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
            Custom Solutions for <span className="gradient-text font-light">Complex Challenges</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-4">
            When off-the-shelf software doesn't fit, we build <strong className="text-white font-normal">custom web applications</strong> that match your exact workflow.
            <strong className="text-white font-normal"> Client portals</strong>, <strong className="text-white font-normal">admin dashboards</strong>, <strong className="text-white font-normal">inventory systems</strong>, and <strong className="text-white font-normal">SaaS platforms</strong>.
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto font-light mb-10">
            Built by <strong className="text-cyan-400 font-normal">full stack developers</strong> using React, Next.js, and TypeScript.
            Your competitive advantage, engineered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/packages/enterprise"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-400/20 to-cyan-500/20 border border-indigo-400/40 rounded-full text-lg font-medium text-indigo-400 hover:from-indigo-400/30 hover:to-cyan-500/30 transition-all duration-300"
            >
              Discuss Your Requirements <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/services/api-integrations"
              className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
            >
              API Integrations <ArrowRight size={16} className="opacity-50" />
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
              When <span className="text-red-400 font-light">Off-the-Shelf</span> Doesn't Cut It
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              You've tried the SaaS tools. You've stacked integrations.
              But your business still has gaps that generic software can't fill.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <ScrollReveal key={index} delay={index * 75}>
              <div className="p-6 rounded-xl bg-red-500/5 border border-red-400/20 backdrop-blur-xl hover:border-red-400/40 transition-all duration-300 group h-full">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-red-400/10 group-hover:bg-red-400/20 transition-colors flex-shrink-0">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">{problem.title}</h3>
                    <p className="text-sm text-gray-400 font-light leading-relaxed">{problem.description}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="mt-12 p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl text-center">
            <p className="text-lg text-gray-300 font-light">
              <strong className="text-white font-normal">Sound familiar?</strong> These are the exact problems
              <span className="text-cyan-400"> custom development</span> solves.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function SolutionsSection() {
  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-cyan-400 text-sm mb-6">
              What We Build
            </div>
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Custom <span className="gradient-text font-light">Web Applications</span> We Build
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              From client-facing portals to internal operations tools,
              we build applications that transform how your business operates.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-8">
          {solutionCategories.map((category, categoryIndex) => {
            const colorClasses = {
              cyan: 'border-cyan-400/20 hover:border-cyan-400/40 bg-cyan-400/5',
              blue: 'border-blue-400/20 hover:border-blue-400/40 bg-blue-400/5',
              indigo: 'border-indigo-400/20 hover:border-indigo-400/40 bg-indigo-400/5',
              purple: 'border-purple-400/20 hover:border-purple-400/40 bg-purple-400/5',
              emerald: 'border-emerald-400/20 hover:border-emerald-400/40 bg-emerald-400/5'
            }
            const iconColorClasses = {
              cyan: 'text-cyan-400 bg-cyan-400/10',
              blue: 'text-blue-400 bg-blue-400/10',
              indigo: 'text-indigo-400 bg-indigo-400/10',
              purple: 'text-purple-400 bg-purple-400/10',
              emerald: 'text-emerald-400 bg-emerald-400/10'
            }

            return (
              <ScrollReveal key={categoryIndex} delay={categoryIndex * 100}>
                <div className={`p-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${colorClasses[category.color as keyof typeof colorClasses]}`}>
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-1/3">
                      <div className={`inline-flex p-3 rounded-lg mb-4 ${iconColorClasses[category.color as keyof typeof iconColorClasses]}`}>
                        <category.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-medium text-white mb-3">{category.title}</h3>
                      <p className="text-gray-400 font-light">{category.description}</p>
                    </div>
                    <div className="lg:w-2/3">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center gap-3 p-3 rounded-lg bg-black/30"
                          >
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${iconColorClasses[category.color as keyof typeof iconColorClasses].split(' ')[0]}`} />
                            <span className="text-sm text-gray-300 font-light">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        <ScrollReveal delay={600}>
          <div className="mt-12 text-center">
            <p className="text-gray-400 font-light mb-6">
              Don't see exactly what you need? We build custom solutions for unique requirements.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Tell us about your project <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function ProcessSection() {
  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Our <span className="gradient-text font-light">Development Process</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              From discovery to deployment, a transparent process with no surprises.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative">
          {/* Timeline connector - hidden on mobile */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400/50 via-indigo-400/50 to-purple-400/50" />

          <div className="space-y-12">
            {processSteps.map((step, index) => {
              const isEven = index % 2 === 0
              const colorClasses = {
                cyan: 'border-cyan-400/30 bg-cyan-400/5 text-cyan-400',
                blue: 'border-blue-400/30 bg-blue-400/5 text-blue-400',
                indigo: 'border-indigo-400/30 bg-indigo-400/5 text-indigo-400',
                purple: 'border-purple-400/30 bg-purple-400/5 text-purple-400'
              }

              return (
                <ScrollReveal key={index} delay={index * 150}>
                  <div className={`flex flex-col md:flex-row items-center gap-8 ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                    {/* Content */}
                    <div className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                      <div className={`inline-block p-8 rounded-2xl border backdrop-blur-xl ${colorClasses[step.color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')}`}>
                        <div className={`flex items-center gap-4 mb-4 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                          <div className={`p-3 rounded-lg ${colorClasses[step.color as keyof typeof colorClasses].split(' ').slice(1, 3).join(' ')}`}>
                            <step.icon className={`w-6 h-6 ${colorClasses[step.color as keyof typeof colorClasses].split(' ')[2]}`} />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider">{step.timeline}</div>
                            <h3 className="text-2xl font-medium text-white">{step.phase}</h3>
                          </div>
                        </div>
                        <p className="text-gray-400 font-light mb-4">{step.description}</p>
                        <ul className={`space-y-2 ${isEven ? 'md:text-right' : ''}`}>
                          {step.activities.map((activity, activityIndex) => (
                            <li key={activityIndex} className={`flex items-center gap-2 text-sm text-gray-300 font-light ${isEven ? 'md:flex-row-reverse' : ''}`}>
                              <CheckCircle className={`w-3 h-3 flex-shrink-0 ${colorClasses[step.color as keyof typeof colorClasses].split(' ')[2]}`} />
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Timeline node - hidden on mobile */}
                    <div className="hidden md:flex items-center justify-center w-12">
                      <div className={`w-4 h-4 rounded-full ${colorClasses[step.color as keyof typeof colorClasses].split(' ').slice(1, 3).join(' ')} border-4 border-black`} />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 hidden md:block" />
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>

        <ScrollReveal delay={600}>
          <div className="mt-16 p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl text-center">
            <p className="text-lg text-gray-300 font-light">
              <strong className="text-white font-normal">Typical project timeline:</strong> 2-8 weeks from kickoff to launch,
              depending on complexity. <span className="text-cyan-400">Daily updates</span> keep you informed every step.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function TechStackSection() {
  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Built with <span className="gradient-text font-light">Modern Technology</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              We use cutting-edge frameworks and tools trusted by Fortune 500 companies.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {techStack.map((tech, index) => (
            <ScrollReveal key={index} delay={index * 75}>
              <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group h-full">
                <tech.icon className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-medium text-white mb-2">{tech.name}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{tech.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div className="p-8 rounded-2xl bg-gradient-to-r from-cyan-400/5 to-indigo-400/5 border border-cyan-400/20 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Enterprise-Grade Architecture</h3>
                <p className="text-gray-400 font-light">
                  Scalable, secure, and built for growth. Your application handles 10 users or 10,000.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <Shield className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-400 font-light">SOC 2 Ready</div>
                </div>
                <div className="text-center">
                  <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-400 font-light">99.9% Uptime</div>
                </div>
                <div className="text-center">
                  <GitBranch className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-400 font-light">CI/CD Pipeline</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
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
              <span className="text-gray-400">Off-the-Shelf</span> vs{" "}
              <span className="gradient-text font-light">Custom Development</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              When does custom make sense? Here's an honest comparison.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 text-gray-400 font-light border-b border-slate-800">Factor</th>
                  <th className="text-center p-4 text-gray-400 font-light border-b border-slate-800">Off-the-Shelf SaaS</th>
                  <th className="text-center p-4 text-indigo-400 font-light border-b border-slate-800">Custom Built</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <span className="text-white font-light">{row.factor}</span>
                      {row.note && (
                        <span className="block text-xs text-gray-500 mt-1">{row.note}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-2 ${!row.customWins ? 'text-green-400' : 'text-gray-400'}`}>
                        {!row.customWins && <CheckCircle className="w-4 h-4" />}
                        <span className="font-light text-sm">{row.offShelf}</span>
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-2 ${row.customWins ? 'text-indigo-400' : 'text-gray-400'}`}>
                        {row.customWins && <CheckCircle className="w-4 h-4" />}
                        <span className="font-light text-sm">{row.custom}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="mt-8 p-6 rounded-xl bg-indigo-400/5 border border-indigo-400/20 backdrop-blur-xl">
            <h3 className="text-lg font-medium text-white mb-3">When to Choose Custom Development</h3>
            <ul className="grid md:grid-cols-2 gap-3">
              {[
                "Your workflow is unique to your industry",
                "Off-the-shelf tools require too many workarounds",
                "You're paying for features you don't use",
                "Integration limitations are blocking growth",
                "You need a competitive advantage through technology",
                "Data security and ownership are priorities"
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-300 font-light">
                  <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function CaseStudiesSection() {
  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Types of Projects <span className="gradient-text font-light">We've Built</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Real solutions for real business challenges across industries.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {projectTypes.map((project, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 h-full">
                <div className="text-xs text-cyan-400 uppercase tracking-wider mb-3">{project.industry}</div>
                <h3 className="text-xl font-medium text-white mb-4">{project.title}</h3>
                <p className="text-gray-400 font-light leading-relaxed">{project.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div className="mt-12 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Tell us about your project requirements <ArrowRight className="w-4 h-4" />
            </Link>
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
              Common questions about custom web application development.
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
            Ready to Build Your <span className="gradient-text font-light">Custom Solution</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
            Let's discuss your requirements. Free consultation, transparent pricing, and a clear roadmap to launch.
            <strong className="text-white font-normal"> Custom development</strong> is our Enterprise tier specialty.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link
              href="/packages/enterprise"
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-indigo-600/20 to-cyan-500/20 border border-indigo-400/30 rounded-full text-lg font-light text-indigo-400 hover:from-indigo-600/30 hover:to-cyan-500/30 transition-all duration-500"
            >
              Discuss Your Requirements <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
            >
              Book a Consultation <ArrowRight size={16} className="opacity-50" />
            </Link>
          </div>
          <p className="text-xs text-gray-600 font-light">
            Enterprise tier starts at $6K | 2-8 week delivery | Full code ownership
          </p>
        </ScrollReveal>

        {/* Related Services */}
        <ScrollReveal delay={200}>
          <div className="mt-16 pt-16 border-t border-slate-800/50">
            <p className="text-sm text-gray-500 mb-6">Related Services</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/services/integration-automation"
                className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300 text-gray-300 hover:text-white font-light"
              >
                API Integrations
              </Link>
              <Link
                href="/services/web-development"
                className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300 text-gray-300 hover:text-white font-light"
              >
                Web Development
              </Link>
              <Link
                href="/services/hosting-infrastructure"
                className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300 text-gray-300 hover:text-white font-light"
              >
                Hosting & Infrastructure
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
