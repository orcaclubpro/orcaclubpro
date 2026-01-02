import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { ArrowRight, Check, Clock, Rocket, Layers, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: 'Fast Website Development - Launch in 3-5 Days | ORCACLUB',
  description: 'Professional website in 3-5 days. Headless CMS, mobile responsive, SEO optimized. Launch tier: $1K-3K. Modern tech stack with PayloadCMS or Sanity.',
  keywords: [
    'fast website development',
    'quick website launch',
    'website in days',
    'rapid website development',
    'headless cms website',
    'payload cms',
    'sanity cms',
    'next.js website',
    'professional website',
    'fast turnaround website'
  ],
  openGraph: {
    title: 'Fast Website Development - Launch in 3-5 Days | ORCACLUB',
    description: 'Professional website in 3-5 days. Headless CMS, mobile responsive, SEO optimized. $1K-3K.',
    url: 'https://orcaclub.pro/solutions/fast-website-launch',
    siteName: 'ORCACLUB',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fast Website Development - Launch in 3-5 Days',
    description: 'Professional website with headless CMS in 3-5 days. Mobile responsive, SEO optimized.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/solutions/fast-website-launch',
  },
}

export default function FastWebsiteLaunchPage() {
  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Fast Website Launch",
    "description": "Professional website development with headless CMS in 3-5 days",
    "provider": {
      "@type": "Organization",
      "name": "ORCACLUB"
    },
    "areaServed": "Worldwide",
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://orcaclub.pro/solutions/fast-website-launch"
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
        "name": "Fast Website Launch",
        "item": "https://orcaclub.pro/solutions/fast-website-launch"
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
                <span className="text-sm text-cyan-400 font-light">Launch in 3-5 days</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-blue-400/10 border border-blue-400/30">
                <span className="text-sm text-blue-400 font-light">Launch Tier</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extralight mb-8 tracking-tight">
              Launch Your Professional <span className="gradient-text font-light">Website</span> in 3-5 Days
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl font-light leading-relaxed">
              Stop waiting months for a website. Get a professional, modern website with headless CMS in less than a week.
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
                Traditional web development takes too long and costs too much. You need a website now, but:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Agencies quote 2-3 months and $10K+ for basic websites</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Website builders (Wix, Squarespace) look amateur and lack flexibility</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">WordPress is outdated, slow, and requires constant maintenance</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5"></div>
                  <span className="text-gray-400 font-light">Your business can&apos;t wait months to establish an online presence</span>
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
                We build professional websites using modern headless CMS technology (PayloadCMS or Sanity) with Next.js. You get enterprise-grade technology at startup speed.
              </p>
              <h3 className="text-xl font-light text-white mb-4">What&apos;s Included:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Headless CMS setup (PayloadCMS or Sanity) for easy content management</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Next.js frontend with modern design and animations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Up to 10 pages (Home, About, Services, Contact, Blog, etc.)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Mobile-responsive design that works on all devices</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">SEO optimization with metadata and structured data</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Contact form with email notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Hosting setup and deployment (Vercel/Netlify)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-gray-400 font-light">Brand-aligned design with your colors and logo</span>
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
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">CMS Setup</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• PayloadCMS or Sanity installation</li>
                  <li>• Content models for pages and blog</li>
                  <li>• Media library setup</li>
                  <li>• Admin user account</li>
                  <li>• Content editing tutorial</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Website Infrastructure</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Next.js 15 application</li>
                  <li>• Vercel/Netlify deployment</li>
                  <li>• Custom domain setup</li>
                  <li>• SSL certificate (HTTPS)</li>
                  <li>• CDN configuration</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Rocket className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">Design & UX</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Mobile-responsive layouts</li>
                  <li>• Brand color integration</li>
                  <li>• Modern animations</li>
                  <li>• Typography system</li>
                  <li>• Accessibility features</li>
                </ul>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Check className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-light text-white">SEO & Performance</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 font-light">
                  <li>• Meta tags and descriptions</li>
                  <li>• Structured data markup</li>
                  <li>• Image optimization</li>
                  <li>• Sitemap generation</li>
                  <li>• Core Web Vitals tuning</li>
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
                  <h3 className="text-lg font-light text-white">Day 1: Setup & Planning</h3>
                  <span className="text-sm text-cyan-400">Day 1</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Project kickoff, content gathering, CMS installation, infrastructure setup, design system configuration
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Days 2-3: Development</h3>
                  <span className="text-sm text-cyan-400">Days 2-3</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Page templates, navigation, content integration, contact forms, mobile responsive design, brand styling
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Day 4: SEO & Content</h3>
                  <span className="text-sm text-cyan-400">Day 4</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  SEO metadata, structured data, content population, image optimization, blog setup, final content review
                </p>
              </div>

              <div className="workspace-card p-6 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-light text-white">Day 5: Testing & Launch</h3>
                  <span className="text-sm text-cyan-400">Day 5</span>
                </div>
                <p className="text-gray-400 font-light text-sm">
                  Cross-browser testing, mobile testing, performance optimization, domain configuration, production deployment
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
                <span className="gradient-text">Launch</span> Tier
              </h2>
              <p className="text-xl text-gray-400 font-light mb-8 max-w-2xl mx-auto">
                This solution is available in our Launch tier. Perfect for businesses that need a professional online presence quickly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500 font-light mb-1">Investment Range</p>
                  <p className="text-3xl font-light text-white">$1,000 - $3,000</p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-800"></div>
                <div>
                  <p className="text-sm text-gray-500 font-light mb-1">Timeline</p>
                  <p className="text-3xl font-light text-white">3-5 days</p>
                </div>
              </div>
              <Link
                href="/project#launch"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Select Launch Tier <ArrowRight size={20} />
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
                  Can I update content myself after launch?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Yes. We include a headless CMS (PayloadCMS or Sanity) with a user-friendly admin panel. You can edit pages, add blog posts, and upload images without any coding knowledge. We provide a tutorial walkthrough at launch.
                </p>
              </div>

              <div className="workspace-card p-8 rounded-xl">
                <h3 className="text-xl font-light text-white mb-3">
                  What if I need more than 10 pages?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  The Launch tier includes up to 10 pages. If you need more, we can add them for $200-500 per additional page depending on complexity. Alternatively, you can add pages yourself using the CMS after launch.
                </p>
              </div>

              <div className="workspace-card p-8 rounded-xl">
                <h3 className="text-xl font-light text-white mb-3">
                  What&apos;s the ongoing cost after launch?
                </h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  Hosting on Vercel or Netlify is typically free for small-to-medium traffic sites (up to 100K visitors/month). Domain costs ~$15/year. CMS hosting (if external) ranges from free to $20/month. No mandatory maintenance fees.
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
              Stop waiting months. Get your professional website live in 3-5 days.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/project#launch"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Select Launch <ArrowRight size={20} />
              </Link>
              <Link
                href="/project"
                className="inline-flex items-center gap-4 px-12 py-6 border border-gray-700 rounded-full text-lg font-light text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-all duration-500"
              >
                View All Tiers
              </Link>
            </div>
            <p className="text-sm text-gray-600 font-light mt-8">
              3-5 day delivery • $1K-3K investment • Headless CMS included
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
