import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { ArrowRight, Check, Clock, Workflow, Zap, Link2 } from "lucide-react"

export const metadata: Metadata = {
  title: 'Business Workflow Automation - Launch in 7-10 Days | ORCACLUB',
  description: 'Automate your business workflows with custom integrations. Scale tier: $3K-5K, 7-10 days. Connect tools, eliminate manual processes, save time.',
  keywords: [
    'business automation',
    'workflow automation',
    'process automation',
    'api integration',
    'zapier alternative',
    'custom automation',
    'workflow optimization',
    'business process automation',
    'integration development',
    'automation developer'
  ],
  openGraph: {
    title: 'Business Workflow Automation - Launch in 7-10 Days | ORCACLUB',
    description: 'Automate workflows with custom integrations. Connect tools, eliminate manual work. $3K-5K, 7-10 days.',
    url: 'https://orcaclub.pro/solutions/business-automation',
    siteName: 'ORCACLUB',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Workflow Automation - Launch in 7-10 Days',
    description: 'Automate workflows with custom integrations. Eliminate manual processes.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/solutions/business-automation',
  },
}

export default function BusinessAutomationPage() {
  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Business Workflow Automation",
    "description": "Custom workflow automation and business process integration",
    "provider": {
      "@type": "Organization",
      "name": "ORCACLUB"
    },
    "areaServed": "Worldwide",
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://orcaclub.pro/solutions/business-automation"
    }
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://orcaclub.pro"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Solutions",
        "item": "https://orcaclub.pro/solutions"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Business Automation",
        "item": "https://orcaclub.pro/solutions/business-automation"
      }
    ]
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <AnimatedBackground />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-light">Launch in 7-10 days</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-blue-400/10 border border-blue-400/30">
                <span className="text-sm text-blue-400 font-light">Scale Tier</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extralight mb-8 tracking-tight">
              Automate Your <span className="gradient-text font-light">Business Workflows</span> in 7-10 Days
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl font-light leading-relaxed">
              Stop wasting time on manual processes. Connect your tools, automate workflows, and reclaim hours every week.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-light mb-8">
              The <span className="gradient-text">Problem</span>
            </h2>
            <div className="workspace-card p-8 rounded-2xl">
              <p className="text-lg text-gray-300 font-light mb-6 leading-relaxed">
                Your team is buried in manual tasks that computers should handle. You&apos;re losing time and money because:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Manual data entry between systems wastes hours every week</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Tools don&apos;t talk to each other, creating disconnected workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Zapier/Make limitations prevent complex automation you actually need</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Repetitive tasks drain employee morale and productivity</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-light mb-8">
              The <span className="gradient-text">Solution</span>
            </h2>
            <div className="workspace-card p-8 rounded-2xl mb-8">
              <p className="text-lg text-gray-300 font-light mb-6 leading-relaxed">
                We build custom automation workflows that connect your existing tools and eliminate manual processes. Unlike generic automation tools, we create exactly what your business needs.
              </p>
              <h3 className="text-xl font-light text-white mb-4">What&apos;s Included:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Up to 2 custom API integrations between your tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Automated workflow triggers (time-based, event-based, webhook-based)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Data synchronization between systems (CRM, email, spreadsheets, etc.)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Email notifications and alerts for workflow events</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Error handling and retry logic for reliable automation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Analytics dashboard to track automation performance</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Documentation for managing and troubleshooting workflows</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-light mb-8">
              Common <span className="gradient-text">Use Cases</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="workspace-card p-6 rounded-xl">
                <h3 className="text-lg font-light text-white mb-3">CRM to Email Marketing</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  Automatically sync new leads from your CRM to email marketing platform. Trigger welcome sequences, update contact segments, and track engagement.
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <h3 className="text-lg font-light text-white mb-3">Invoice to Accounting</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  When a payment is received, automatically create invoices in your accounting software, update spreadsheets, and send receipts to customers.
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <h3 className="text-lg font-light text-white mb-3">Form to Multiple Systems</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  When someone fills out a contact form, create CRM record, add to email list, notify sales team, and log in project management tool.
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <h3 className="text-lg font-light text-white mb-3">Daily Report Generation</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  Pull data from multiple sources, generate formatted reports, and email them to stakeholders automatically every morning.
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <h3 className="text-lg font-light text-white mb-3">Inventory Synchronization</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  Keep inventory levels in sync across e-commerce platform, warehouse management, and accounting systems in real-time.
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <h3 className="text-lg font-light text-white mb-3">Customer Onboarding</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  Automate entire onboarding sequence: create accounts, send welcome emails, schedule kickoff calls, provision access, and track progress.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Deliverables Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-light mb-8">
              <span className="gradient-text">Deliverables</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Link2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">API Integrations</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• 2 custom API connections</li>
                  <li>• Authentication setup (OAuth, API keys)</li>
                  <li>• Data mapping and transformation</li>
                  <li>• Bidirectional sync (if needed)</li>
                  <li>• Real-time or scheduled updates</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Workflow className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Automation Workflows</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Trigger configuration (time, events, webhooks)</li>
                  <li>• Conditional logic and routing</li>
                  <li>• Multi-step workflow chains</li>
                  <li>• Error handling and fallbacks</li>
                  <li>• Logging and audit trail</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Notifications & Alerts</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Email notification system</li>
                  <li>• Slack/Teams integration (optional)</li>
                  <li>• Success/failure alerts</li>
                  <li>• Daily summary reports</li>
                  <li>• Custom notification templates</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Monitoring & Docs</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Analytics dashboard</li>
                  <li>• Automation health metrics</li>
                  <li>• Workflow documentation</li>
                  <li>• Troubleshooting guide</li>
                  <li>• API credential management</li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-light mb-8">
              <span className="gradient-text">Timeline</span> Breakdown
            </h2>
            <div className="space-y-6">
              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 1-2: Discovery & Planning</h3>
                  <span className="text-sm text-cyan-400">Days 1-2</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Workflow mapping session, identify pain points, select tools to integrate, document current manual process, design automation architecture
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 3-6: Integration Build</h3>
                  <span className="text-sm text-cyan-400">Days 3-6</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  API authentication setup, build first integration, build second integration, data mapping and transformation, workflow trigger configuration
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 7-8: Testing & Refinement</h3>
                  <span className="text-sm text-cyan-400">Days 7-8</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  End-to-end workflow testing, edge case validation, error handling verification, notification setup, analytics dashboard configuration
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 9-10: Launch & Training</h3>
                  <span className="text-sm text-cyan-400">Days 9-10</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Production deployment, team training session, documentation handoff, monitoring setup, post-launch support plan
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Tier Recommendation */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="workspace-card p-12 rounded-2xl text-center">
              <h2 className="text-3xl md:text-4xl font-light mb-6">
                <span className="gradient-text">Scale</span> Tier
              </h2>
              <p className="text-xl text-gray-400 font-light mb-8 max-w-2xl mx-auto">
                This solution is available in our Scale tier. Perfect for businesses ready to eliminate manual processes and scale operations efficiently.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500 font-light mb-1">Investment Range</p>
                  <p className="text-3xl font-light text-white">$3,000 - $5,000</p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-800"></div>
                <div>
                  <p className="text-sm text-gray-500 font-light mb-1">Timeline</p>
                  <p className="text-3xl font-light text-white">7-10 days</p>
                </div>
              </div>
              <Link
                href="/project#scale"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Select Scale Tier <ArrowRight size={20} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-light mb-8">
              Common <span className="gradient-text">Questions</span>
            </h2>
            <div className="space-y-6">
              <div className="workspace-card p-8 rounded-xl">
                <h3 className="text-xl font-light text-white mb-3">
                  What if the tools I use don&apos;t have APIs?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Most modern software has APIs, even if not publicly documented. We can reverse-engineer interfaces, use web scraping where appropriate, or suggest alternative tools that better support automation. We&apos;ll assess feasibility during discovery.
                </p>
              </div>

              <div className="workspace-card p-8 rounded-xl">
                <h3 className="text-xl font-light text-white mb-3">
                  Can I add more integrations later?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Yes. The Scale tier includes 2 integrations, but you can add more at $1,500-2,500 per additional integration depending on complexity. We can also establish an ongoing relationship for continuous automation improvements.
                </p>
              </div>

              <div className="workspace-card p-8 rounded-xl">
                <h3 className="text-xl font-light text-white mb-3">
                  What happens if an automation breaks?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  We build error handling and notifications into every workflow. If something breaks (usually due to API changes from vendors), you&apos;ll get an alert immediately. We offer maintenance plans for ongoing monitoring and fixes, or you can contact us for one-off repairs.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-10 tracking-tight">
              Ready to <span className="gradient-text font-light">automate</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
              Stop wasting time on manual processes. Automate your workflows in 7-10 days.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/project#scale"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Select Scale <ArrowRight size={20} />
              </Link>
              <Link
                href="/project"
                className="inline-flex items-center gap-4 px-12 py-6 border border-gray-700 rounded-full text-lg font-light text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-all duration-500"
              >
                View All Tiers
              </Link>
            </div>
            <p className="text-sm text-gray-600 font-light mt-8">
              7-10 day delivery • $3K-5K investment • 2 custom integrations
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
