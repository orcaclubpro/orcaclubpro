'use client'

import { Check } from 'lucide-react'
import AnimatedBackground from "@/components/layout/animated-background"
import Link from 'next/link'
import { useState } from 'react'

const pricingData = [
  {
    service: 'Website Development',
    subheading: 'Full Handover Website',
    hourlyRate: '$75',
    features: [
      'Your preferred hosting',
      'First 10 hours free',
      'Comprehensive discovery and planning with documentation',
    ],
    originalPrice: '$999',
    actualPrice: '$699',
    downPayment: '$150 down to get started',
    color: 'cyan',
    schemaType: 'Custom Website Development',
    schemaDescription: 'Affordable full-stack web development for startups and small businesses. Build custom MVP websites with React and Next.js in 2-4 weeks.',
  },
  {
    service: 'Digital Marketing',
    subheading: 'Campaign Management',
    hourlyRate: '$45',
    features: [
      'Proposal, strategy, and research documentation',
      'Market and demographic research',
      'Weekly reports',
      'Campaign management',
      'Trackable and managed analytics',
    ],
    originalPrice: '$799',
    actualPrice: '$399',
    downPayment: '$100 down to get started',
    color: 'blue',
    schemaType: 'Digital Marketing Services',
    schemaDescription: 'Professional digital marketing and campaign management for small businesses. Strategic ad management, branding, and analytics.',
  },
  {
    service: 'SEO & Visibility',
    subheading: 'Search Optimization',
    hourlyRate: '$45',
    features: [
      'Technical SEO Audit',
      'Content Strategy',
      'Keyword Research',
      'Monthly Reporting',
    ],
    originalPrice: '$799',
    actualPrice: '$399',
    downPayment: '$100 down to get started',
    color: 'teal',
    schemaType: 'SEO Services',
    schemaDescription: 'Affordable SEO services to improve search rankings and organic traffic. Technical audits, keyword research, and content optimization.',
  },
  {
    service: 'Automations',
    subheading: 'Workflow Integration',
    hourlyRate: '$65',
    features: [
      'Process Analysis',
      'Custom Automation Setup',
      'Integration Development',
      'Training & Documentation',
    ],
    originalPrice: '$899',
    actualPrice: '$599',
    downPayment: '$150 down to get started',
    color: 'purple',
    schemaType: 'Business Automation Services',
    schemaDescription: 'Custom workflow automation and integration services. Streamline business processes with intelligent automation solutions.',
  },
]

export default function PricingPage() {
  const [selectedService, setSelectedService] = useState(0)
  // Generate structured data for each service
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": pricingData.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Service",
        "name": item.schemaType,
        "description": item.schemaDescription,
        "provider": {
          "@type": "Organization",
          "name": "ORCACLUB",
          "url": "https://orcaclub.pro"
        },
        "offers": {
          "@type": "Offer",
          "price": item.actualPrice.replace('$', '').replace(',', ''),
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://orcaclub.pro/pricing",
          "priceValidUntil": "2025-12-31"
        }
      }
    }))
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "ORCACLUB",
    "description": "Affordable web development, digital marketing, and consulting services for small businesses and startups",
    "url": "https://orcaclub.pro",
    "telephone": "",
    "priceRange": "$399-$699",
    "areaServed": "Worldwide",
    "knowsAbout": [
      "Web Development",
      "Custom Website Design",
      "Full Stack Development",
      "SEO Services",
      "Digital Marketing",
      "Business Automation"
    ]
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="min-h-screen bg-black relative overflow-hidden">
        <AnimatedBackground />

        {/* Hero Section */}
        <section className="relative z-10 pt-12 md:pt-0 pb-8 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-cyan-400 mb-4 animate-in slide-in-from-bottom duration-700">
              Let's Get Started
            </h1>

            <p className="text-lg md:text-xl text-gray-400 font-light animate-in slide-in-from-bottom duration-700 delay-300 mb-2">
              Affordable web development, SEO, and marketing packages
            </p>
            <p className="text-base text-gray-500 font-light animate-in slide-in-from-bottom duration-700 delay-300">
              Professional results for small businesses and startups · Starting at $399
            </p>
          </div>
        </section>

        {/* Mobile Navigation */}
        <section className="relative z-10 px-4 pb-8 lg:hidden">
          <div className="max-w-xl mx-auto">
            {/* Service Tabs */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              {pricingData.map((item, index) => (
                <button
                  key={item.service}
                  onClick={() => setSelectedService(index)}
                  className={`relative px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    selectedService === index
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/60 text-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900/60 border border-white/10 text-gray-400 hover:border-cyan-400/30 hover:text-gray-300'
                  }`}
                >
                  {/* Active indicator dot */}
                  {selectedService === index && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  )}
                  <div className="text-left">
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {item.hourlyRate}/hr
                    </div>
                    <div className="leading-tight">{item.service}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Swipe hint */}
            <p className="text-xs text-center text-gray-500 mt-4">
              Tap to view package details
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="relative z-10 px-6 pb-32">
          <div className="max-w-7xl mx-auto">
            {/* Mobile: Single Card Display */}
            <div className="lg:hidden max-w-md mx-auto px-2">
              {pricingData.map((item, index) => (
                <div
                  key={item.service}
                  className={`bg-slate-900/60 backdrop-blur-xl border-2 border-cyan-400/20 rounded-2xl p-8 transition-all duration-300 flex flex-col shadow-xl ${
                    selectedService === index ? 'flex animate-in fade-in slide-in-from-bottom duration-500' : 'hidden'
                  }`}
                >
                  {/* Hourly Rate */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-1">Hourly Rate</div>
                    <div className="text-3xl font-bold text-white">{item.hourlyRate}/hr</div>
                  </div>

                  {/* Service Title */}
                  <h2 className="text-xl font-bold text-white mb-2">{item.service}</h2>

                  {/* Subheading */}
                  <p className="text-sm text-gray-400 mb-6">{item.subheading}</p>

                  {/* Divider */}
                  <div className="h-px bg-white/10 mb-6" />

                  {/* Features */}
                  <div className="space-y-3 mb-8 flex-1">
                    {item.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-xl text-gray-500 line-through">{item.originalPrice}</span>
                      <span className="text-3xl font-bold text-white">{item.actualPrice}</span>
                    </div>
                    <p className="text-xs text-gray-400">{item.downPayment}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Grid Display */}
            <div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingData.map((item, index) => (
                <div
                  key={item.service}
                  className="bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300 animate-in zoom-in duration-500 flex flex-col"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Hourly Rate */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-1">Hourly Rate</div>
                    <div className="text-3xl font-bold text-white">{item.hourlyRate}/hr</div>
                  </div>

                  {/* Service Title */}
                  <h2 className="text-xl font-bold text-white mb-2">{item.service}</h2>

                  {/* Subheading */}
                  <p className="text-sm text-gray-400 mb-6">{item.subheading}</p>

                  {/* Divider */}
                  <div className="h-px bg-white/10 mb-6" />

                  {/* Features */}
                  <div className="space-y-3 mb-8 flex-1">
                    {item.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-xl text-gray-500 line-through">{item.originalPrice}</span>
                      <span className="text-3xl font-bold text-white">{item.actualPrice}</span>
                    </div>
                    <p className="text-xs text-gray-400">{item.downPayment}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Single CTA Below Cards */}
            <div className="mt-12 text-center px-4 lg:px-0">
              <Link
                href="/contact"
                className="inline-block w-full max-w-md lg:w-auto px-12 py-5 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-xl text-lg font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Link>
              <p className="text-xs text-gray-500 mt-4">
                Free consultation • No hidden fees
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose ORCACLUB - SEO Content Section */}
        <section className="relative z-10 px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/20 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                Why Choose <span className="gradient-text">ORCACLUB</span> for Your Web Development?
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Budget-Friendly Pricing</h3>
                  <p className="text-sm leading-relaxed">
                    Affordable packages starting at just $399. Get professional custom websites, SEO, and marketing
                    without breaking the bank. Perfect for small businesses and startups on a budget.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Fast Delivery</h3>
                  <p className="text-sm leading-relaxed">
                    Launch your website in 2-4 weeks, not months. Our efficient full-stack development
                    process ensures you get to market quickly with high-quality results.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Modern Technology Stack</h3>
                  <p className="text-sm leading-relaxed">
                    Built with React, Next.js, and cutting-edge web technologies. Get a fast, SEO-optimized,
                    mobile-responsive website that performs exceptionally well.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Transparent Process</h3>
                  <p className="text-sm leading-relaxed">
                    No hidden fees. Clear pricing with low down payments ($100-$200). Free project discovery
                    session and documentation included in every package.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="relative z-10 px-6 pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-in fade-in duration-700 delay-500">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                Questions about pricing?
              </h2>
              <p className="text-gray-400 mb-8">
                Contact us for a free consultation and custom quote tailored to your business needs.
              </p>
              <Link
                href="/contact"
                className="inline-block px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg text-base font-medium text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
              >
                Schedule Free Consultation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
