import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import HeroSection from "@/components/sections/HeroSection"
import ClientsSection from "@/components/sections/ClientsSection"
import ServicesGrid from "@/components/sections/ServicesGrid"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getPayload } from "payload"
import config from "@payload-config"

export const metadata: Metadata = {
  title: 'ORCACLUB | Comprehensive Website Development and Automation',
  description: 'Technical operations studio specializing in custom integrations, workflow automation, and full stack development. Fixed-price packages ($1K-30K) with 3-21 day delivery for businesses needing scalable technical solutions.',
  keywords: [
    'techops studio',
    'technical operations',
    'custom integrations',
    'workflow automation',
    'full stack development',
    'website development',
    'business automation',
    'custom software development',
    'api development',
    'shopify integration',
    'stripe integration',
    'headless cms',
    'next.js development',
    'react development',
    'development consultancy'
  ],
  openGraph: {
    title: 'ORCACLUB | Comprehensive Website Development and Automation',
    description: 'Technical operations studio specializing in custom integrations, workflow automation, and full stack development. Fixed-price packages with fast delivery.',
    url: 'https://orcaclub.pro',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ORCACLUB | Comprehensive Website Development and Automation',
    description: 'Technical operations studio for custom integrations, workflow automation, and full stack development. Fast delivery, transparent pricing.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro',
  },
}

export default async function HomePage() {
  // Fetch clients from Payload
  const payload = await getPayload({ config })

  const clientsData = await payload.find({
    collection: 'clients' as any,
    sort: 'displayOrder',
    limit: 12,
  })

  const clients = clientsData.docs

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

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Our Work Section - Clients */}
      <ClientsSection clients={clients} />

      {/* Capabilities Section */}
      <section className="py-40 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-32">
              <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
                Tailored <span className="gradient-text font-light">solutions</span> for scaling businesses
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
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
            <h2 className="text-4xl md:text-5xl font-extralight mb-10 tracking-tight">
              Ready to launch your <span className="gradient-text font-light">next project</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-16 font-light leading-relaxed max-w-3xl mx-auto">
              No opaque quotes. No lengthy sales cycles. Just transparent pricing, fast delivery, and direct developer access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/project"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                View Project Tiers <ArrowRight size={20} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-12 py-6 bg-white/5 border border-white/10 rounded-full text-lg font-light text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500 magnetic interactive"
              >
                Free Consultation
              </Link>
            </div>
            <p className="text-xs text-gray-600 font-light">
              3-21 Day Delivery • Fixed Pricing • $1K-30K
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer is now in the layout */}
    </div>
  )
}
