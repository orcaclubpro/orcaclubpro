import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { ArrowRight, Check, Clock, CreditCard, Shield, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: 'Stripe Payment Integration - Setup in 7-10 Days | ORCACLUB',
  description: 'Custom Stripe payment integration for your platform. Scale tier: $3K-5K, 7-10 day implementation. Subscriptions, webhooks, customer portal, production-ready.',
  keywords: [
    'stripe integration',
    'payment processing setup',
    'stripe developer',
    'stripe subscription',
    'payment gateway integration',
    'stripe webhooks',
    'customer portal',
    'recurring payments',
    'stripe checkout',
    'payment processing'
  ],
  openGraph: {
    title: 'Stripe Payment Integration - Setup in 7-10 Days | ORCACLUB',
    description: 'Custom Stripe integration with subscriptions, webhooks, and customer portal. $3K-5K, 7-10 days.',
    url: 'https://orcaclub.pro/solutions/stripe-integration',
    siteName: 'ORCACLUB',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stripe Payment Integration - Setup in 7-10 Days',
    description: 'Custom Stripe integration. Subscriptions, webhooks, customer portal. Production-ready.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/solutions/stripe-integration',
  },
}

export default function StripeIntegrationPage() {
  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Stripe Payment Integration",
    "description": "Custom Stripe payment integration with subscriptions, webhooks, and customer portal",
    "provider": {
      "@type": "Organization",
      "name": "ORCACLUB"
    },
    "areaServed": "Worldwide",
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://orcaclub.pro/solutions/stripe-integration"
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
        "name": "Stripe Integration",
        "item": "https://orcaclub.pro/solutions/stripe-integration"
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
                <span className="text-sm text-cyan-400 font-light">Setup in 7-10 days</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-blue-400/10 border border-blue-400/30">
                <span className="text-sm text-blue-400 font-light">Scale Tier</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extralight mb-8 tracking-tight">
              Integrate <span className="gradient-text font-light">Stripe Payments</span> in 7-10 Days
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl font-light leading-relaxed">
              Accept payments, manage subscriptions, and handle recurring billing. Production-ready Stripe integration with webhooks and customer portal.
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
                Payment processing is complex and critical. You need it done right, but:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Stripe&apos;s API is powerful but complex to implement correctly</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Webhook handling requires careful security and error management</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Subscription management (upgrades, cancellations, billing) is tedious</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">One mistake could mean lost revenue or compliance issues</span>
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
                We implement a complete, production-ready Stripe integration with all the features you need to accept payments, manage subscriptions, and provide customers with self-service billing.
              </p>
              <h3 className="text-xl font-light text-white mb-4">What&apos;s Included:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Stripe account setup and API configuration</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Payment processing (one-time and recurring)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Subscription management (create, upgrade, cancel, pause)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Webhook handling for payment events (success, failed, disputes)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Customer portal for self-service billing and invoice history</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Test mode and production environment setup</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Error handling and retry logic for failed payments</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Email notifications for payment events</span>
                </li>
              </ul>
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
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Payment Processing</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Stripe API integration</li>
                  <li>• Checkout flow (embedded or hosted)</li>
                  <li>• Payment method management</li>
                  <li>• Invoice generation</li>
                  <li>• Receipt emails</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Webhook System</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Webhook endpoint configuration</li>
                  <li>• Event signature verification</li>
                  <li>• Payment success/failure handling</li>
                  <li>• Subscription lifecycle events</li>
                  <li>• Idempotency and retry logic</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Customer Portal</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Self-service billing dashboard</li>
                  <li>• Subscription upgrade/downgrade</li>
                  <li>• Payment method updates</li>
                  <li>• Invoice history</li>
                  <li>• Cancellation flow</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Testing & Docs</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Test mode payment scenarios</li>
                  <li>• Webhook testing suite</li>
                  <li>• Production deployment guide</li>
                  <li>• API documentation</li>
                  <li>• Admin troubleshooting guide</li>
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
                  <h3 className="text-lg font-light text-white">Days 1-2: Setup & Planning</h3>
                  <span className="text-sm text-cyan-400">Days 1-2</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Stripe account audit, payment flow design, product/pricing configuration, API key setup, webhook endpoint creation
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 3-5: Core Integration</h3>
                  <span className="text-sm text-cyan-400">Days 3-5</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Checkout flow implementation, payment processing logic, subscription creation and management, customer database sync
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 6-8: Webhooks & Portal</h3>
                  <span className="text-sm text-cyan-400">Days 6-8</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Webhook event handlers, customer portal setup, billing dashboard, email notifications, error handling and logging
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 9-10: Testing & Launch</h3>
                  <span className="text-sm text-cyan-400">Days 9-10</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Test mode validation, production configuration, payment scenario testing, security audit, production deployment, monitoring setup
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
                This solution is available in our Scale tier. Perfect for businesses ready to accept payments and manage subscriptions at scale.
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
                  Do I need my own Stripe account?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Yes. You&apos;ll need a Stripe account (free to create). We&apos;ll help you set it up if you don&apos;t have one yet. This ensures you own the merchant account and receive payments directly. Stripe charges 2.9% + 30¢ per successful transaction.
                </p>
              </div>

              <div className="workspace-card p-8 rounded-xl">
                <h3 className="text-xl font-light text-white mb-3">
                  Can you integrate with my existing platform?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Yes. We can integrate Stripe into your existing Next.js, React, Node.js, or other modern web application. We&apos;ll work with your current tech stack and database to ensure seamless integration with your user management and product catalog.
                </p>
              </div>

              <div className="workspace-card p-8 rounded-xl">
                <h3 className="text-xl font-light text-white mb-3">
                  What happens if a payment fails?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  We implement automatic retry logic using Stripe&apos;s Smart Retries. Failed payments trigger email notifications to customers, and we can set up dunning management (automated payment recovery). You&apos;ll also get webhook notifications for all failed payments to track and manage manually if needed.
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
              Ready to accept <span className="gradient-text font-light">payments</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
              Production-ready Stripe integration in 7-10 days. Start generating revenue with confidence.
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
              7-10 day delivery • $3K-5K investment • Production-ready webhooks
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
