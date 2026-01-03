import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { ArrowRight, Check, Clock, Zap, Code, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: 'Headless Shopify Development | ORCACLUB TechOps',
  description: 'Custom headless Shopify integration with React/Next.js. Break free from theme limitations with enterprise-grade performance. $6K-30K, 14-21 day delivery. Full design control and workflow automation.',
  keywords: [
    'headless shopify',
    'shopify headless integration',
    'custom shopify frontend',
    'shopify next.js',
    'shopify react',
    'shopify storefront api',
    'custom ecommerce',
    'shopify workflow automation',
    'headless commerce',
    'shopify performance',
    'techops shopify'
  ],
  openGraph: {
    title: 'Headless Shopify Development | ORCACLUB TechOps',
    description: 'Custom headless Shopify with Next.js. Enterprise performance without theme limitations. 14-21 day delivery.',
    url: 'https://orcaclub.pro/solutions/headless-shopify-commerce',
    siteName: 'ORCACLUB',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Headless Shopify Development | ORCACLUB TechOps',
    description: 'Custom headless Shopify with full design control and enterprise performance.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/solutions/headless-shopify-commerce',
  },
}

export default function HeadlessShopifyPage() {
  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Headless Shopify Development",
    "description": "Custom headless Shopify integration with React/Next.js for enterprise-grade ecommerce",
    "provider": {
      "@type": "Organization",
      "name": "ORCACLUB"
    },
    "areaServed": "Worldwide",
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://orcaclub.pro/solutions/headless-shopify-commerce"
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
        "name": "Headless Shopify Commerce",
        "item": "https://orcaclub.pro/solutions/headless-shopify-commerce"
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
                <span className="text-sm text-cyan-400 font-light">Launch in 14-21 days</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-blue-400/10 border border-blue-400/30">
                <span className="text-sm text-blue-400 font-light">Enterprise Tier</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extralight mb-8 tracking-tight">
              Launch <span className="gradient-text font-light">Headless Shopify</span> Commerce in 14-21 Days
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl font-light leading-relaxed">
              Break free from Shopify theme limitations. Get a custom React/Next.js frontend with enterprise performance and full design control.
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
                Shopify themes are limiting your brand and performance. You need:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Custom frontend that matches your exact brand vision</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Lightning-fast performance without theme bloat</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Full control over UX and conversion optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Modern tech stack that developers actually want to work with</span>
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
                We build a custom Next.js frontend powered by Shopify&apos;s Storefront API. You get the best of both worlds: Shopify&apos;s powerful backend and complete frontend freedom.
              </p>
              <h3 className="text-xl font-light text-white mb-4">What&apos;s Included:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Custom React/Next.js frontend tailored to your brand</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Shopify Storefront API integration (GraphQL)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Product pages, collection pages, cart, and checkout flow</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">PayloadCMS for marketing content and pages</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">SEO optimization with Next.js metadata and structured data</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Mobile-responsive, accessibility-tested design</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Performance optimization (Core Web Vitals)</span>
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
                  <Code className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Frontend Application</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Next.js 15 with App Router</li>
                  <li>• TypeScript configuration</li>
                  <li>• Tailwind CSS styling system</li>
                  <li>• Component library (shadcn/ui)</li>
                  <li>• Vercel deployment ready</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Shopify Integration</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Storefront API setup</li>
                  <li>• Product data synchronization</li>
                  <li>• Cart and checkout flows</li>
                  <li>• Customer account integration</li>
                  <li>• Inventory management</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Content Management</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• PayloadCMS installation</li>
                  <li>• Custom content models</li>
                  <li>• Marketing page builder</li>
                  <li>• Blog/content publishing</li>
                  <li>• Media management</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Performance & SEO</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Core Web Vitals optimization</li>
                  <li>• Image optimization pipeline</li>
                  <li>• SEO metadata structure</li>
                  <li>• Schema.org markup</li>
                  <li>• Sitemap generation</li>
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
                  <h3 className="text-lg font-light text-white">Days 1-5: Foundation</h3>
                  <span className="text-sm text-cyan-400">Week 1</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Project setup, Shopify Storefront API configuration, Next.js scaffold, design system implementation, core component development
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 6-10: Core Features</h3>
                  <span className="text-sm text-cyan-400">Week 2</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Product pages, collection browsing, cart functionality, checkout integration, customer accounts, search implementation
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 11-16: Content & Marketing</h3>
                  <span className="text-sm text-cyan-400">Week 2-3</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  PayloadCMS setup, marketing pages, blog integration, SEO optimization, analytics setup, conversion tracking
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 17-21: Polish & Launch</h3>
                  <span className="text-sm text-cyan-400">Week 3</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Performance optimization, mobile testing, cross-browser QA, security audit, staging deployment, production launch
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
                <span className="gradient-text">Enterprise</span> Tier
              </h2>
              <p className="text-xl text-gray-400 font-light mb-8 max-w-2xl mx-auto">
                This solution is available in our Enterprise tier. Perfect for businesses ready to scale with a custom, high-performance commerce platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500 font-light mb-1">Investment Range</p>
                  <p className="text-3xl font-light text-white">$6,000 - $30,000</p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-800"></div>
                <div>
                  <p className="text-sm text-gray-500 font-light mb-1">Timeline</p>
                  <p className="text-3xl font-light text-white">14-21 days</p>
                </div>
              </div>
              <Link
                href="/project#enterprise"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Select Enterprise Tier <ArrowRight size={20} />
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
                  Do I need to migrate away from Shopify?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  No. You keep your existing Shopify backend, products, inventory, and checkout. We only replace the frontend (what customers see). Your Shopify admin stays exactly the same.
                </p>
              </div>

              <div className="workspace-card p-8 rounded-xl">
                <h3 className="text-xl font-light text-white mb-3">
                  Will this affect my existing Shopify apps?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Most backend apps (inventory, shipping, analytics) continue working. Frontend apps (theme customizations, popups) need to be rebuilt or replaced. We&apos;ll audit your current apps and recommend alternatives during discovery.
                </p>
              </div>

              <div className="workspace-card p-8 rounded-xl">
                <h3 className="text-xl font-light text-white mb-3">
                  Can I still use Shopify&apos;s checkout?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Yes. We integrate with Shopify&apos;s hosted checkout or build a custom checkout experience depending on your Shopify plan and requirements. Both options maintain PCI compliance and security.
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
              Ready to <span className="gradient-text font-light">launch</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
              Break free from theme limitations. Get enterprise performance with complete design freedom.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/project#enterprise"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Select Enterprise <ArrowRight size={20} />
              </Link>
              <Link
                href="/project"
                className="inline-flex items-center gap-4 px-12 py-6 border border-gray-700 rounded-full text-lg font-light text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-all duration-500"
              >
                View All Tiers
              </Link>
            </div>
            <p className="text-sm text-gray-600 font-light mt-8">
              14-21 day delivery • $6K-30K investment • Full source code ownership
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
