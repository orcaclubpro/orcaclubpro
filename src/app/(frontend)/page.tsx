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
  title: 'ORCACLUB est 2025 | Branding, Marketing, and Consulting',
  description: 'Full-service branding, marketing, and consulting agency. We help businesses build powerful brands, execute strategic marketing campaigns, and navigate complex business challenges with expert consulting services.',
  keywords: [
    'branding agency',
    'marketing agency',
    'business consulting',
    'brand strategy',
    'marketing consulting',
    'brand development',
    'digital marketing',
    'brand identity',
    'marketing strategy',
    'business consulting services',
    'creative agency',
    'brand consulting',
    'marketing campaigns',
    'brand design',
    'strategic consulting',
    'brand positioning'
  ],
  openGraph: {
    title: 'ORCACLUB est 2025 | Branding, Marketing, and Consulting',
    description: 'Full-service branding, marketing, and consulting agency. Build powerful brands, execute strategic marketing, and navigate business challenges with expert guidance.',
    url: 'https://orcaclub.pro',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ORCACLUB est 2025 | Branding, Marketing, and Consulting',
    description: 'Full-service branding, marketing, and consulting agency. Build powerful brands and execute strategic marketing with expert consulting.',
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
      <HeroSection clients={clients} />

      {/* Capabilities Section */}
      <section className="py-40 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-32">
              <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
                Tailored <span className="gradient-text font-light">solutions</span> for modern business
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                We believe every business deserves software that works perfectly for their unique needs.
                Here&apos;s how we make that happen.
              </p>
            </div>
          </ScrollReveal>

          <ServicesGrid />
        </div>
      </section>

      {/* Clients Section */}
      <ClientsSection clients={clients} />

      {/* Call to Action */}
      <section className="py-40 px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-10 tracking-tight">
              Ready to transform your <span className="gradient-text font-light">business workflows</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-16 font-light leading-relaxed max-w-3xl mx-auto">
              Let&apos;s discuss how we can create tailored solutions that make your business more efficient, 
              more profitable, and more competitive in today&apos;s digital landscape.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive mb-8"
            >
              Start Your Project <ArrowRight size={20} />
            </Link>
            <p className="text-xs text-gray-600 font-light">
              Free consultation • Custom solutions • Transparent pricing
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer is now in the layout */}
    </div>
  )
}
