import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import HeroSection from "@/components/sections/HeroSection"
import ServicesGrid from "@/components/sections/ServicesGrid"
import RenderBlocks from "@/components/blocks/RenderBlocks"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getCachedClients, getCachedHomePage } from "@/lib/payload/cached-queries"

export const metadata: Metadata = {
  title: 'ORCACLUB',
  description: 'Professional web development company offering custom web development, website design services, and full-stack solutions. Our web design agency delivers fixed-price packages with 3-21 day turnaround for businesses seeking scalable web development services.',
  keywords: [
    'web development services',
    'web development company',
    'web design agency',
    'website design services',
    'custom web development',
    'full stack development',
    'custom integrations',
    'workflow automation',
    'website development',
    'business automation',
    'custom software development',
    'api development',
    'shopify integration',
    'stripe integration',
    'headless cms',
    'next.js development',
    'react development',
    'development consultancy',
    'professional web design',
    'ecommerce development'
  ],
  openGraph: {
    title: 'ORCACLUB',
    description: 'Professional web development company specializing in custom web development and website design services. Fixed-price packages with fast 3-21 day delivery from an experienced web design agency.',
    url: 'https://orcaclub.pro',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ORCACLUB',
    description: 'Web development services and custom web design from a professional web development company. Fast delivery, transparent pricing, and scalable solutions.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro',
  },
}

export default async function HomePage() {
  // Fetch clients and CMS home page in parallel using cached queries
  let clients: any[] = []
  let homePage: any = null
  try {
    const [clientsData, pagesData] = await Promise.all([
      getCachedClients(),
      getCachedHomePage(),
    ])
    clients = clientsData.docs
    homePage = pagesData.docs[0] ?? null
  } catch {
    // Pages collection may not exist yet or no home page created
  }

  // Breadcrumb schema for homepage
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://orcaclub.pro"
      }
    ]
  }

  const hasCmsLayout = homePage?.layout && Array.isArray(homePage.layout) && homePage.layout.length > 0

  return (
    <div className="min-h-screen relative">
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <AnimatedBackground />

      {hasCmsLayout ? (
        // CMS-managed layout
        <RenderBlocks blocks={homePage.layout} />
      ) : (
        // Fallback: hardcoded sections (shown until a CMS home page is created)
        <>
          {/* Hero Section */}
          <HeroSection clients={clients} />

          {/* Capabilities Section */}
          <section className="py-40 px-8 relative z-10">
            <div className="max-w-7xl mx-auto">
              <ScrollReveal>
                <div className="text-center mb-32">
                  <p className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light mb-5">
                    Capabilities
                  </p>
                  <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
                    Tailored <span className="gradient-text font-light">solutions</span> for scaling businesses
                  </h2>
                  <div className="mx-auto w-6 h-px bg-cyan-400/40 mb-8" />
                  <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                    Fixed-price tiers, fast delivery, and modern tech. Choose Launch, Scale, or Enterprise.
                  </p>
                </div>
              </ScrollReveal>

              <ServicesGrid />
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-40 px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollReveal>
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light mb-5">
                  Get Started
                </p>
                <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
                  Ready to launch your <span className="gradient-text font-light">next project</span>?
                </h2>
                <div className="mx-auto w-6 h-px bg-cyan-400/40 mb-8" />
                <p className="text-lg text-gray-400 mb-16 font-light leading-relaxed max-w-2xl mx-auto">
                  No opaque quotes. No lengthy sales cycles. Just transparent pricing, fast delivery, and direct developer access.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-md text-base font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
                  >
                    Start Your Project <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/project"
                    className="inline-flex items-center gap-2 px-12 py-5 bg-white/[0.03] border border-white/[0.08] rounded-md text-base font-light text-white/70 hover:bg-white/[0.06] hover:border-white/[0.14] hover:text-white transition-all duration-500 magnetic interactive"
                  >
                    View Project Tiers
                  </Link>
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/15 font-light">
                  3–21 Day Delivery · Fixed Pricing · Direct Developer Access
                </p>
              </ScrollReveal>
            </div>
          </section>
        </>
      )}

      {/* Footer is now in the layout */}
    </div>
  )
}
