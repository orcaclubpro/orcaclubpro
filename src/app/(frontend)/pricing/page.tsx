'use client'

import { Check } from 'lucide-react'
import AnimatedBackground from "@/components/layout/animated-background"
import Image from 'next/image'
import Link from 'next/link'

const pricingData = [
  {
    service: 'Website Development',
    subheading: 'MVP / Proof of Concept',
    hourlyRate: '$75',
    features: [
      'MVP Development ($199 value)',
      'Project Proposal Documentation',
      'Project Discovery Session',
      'First 10 Hours Free ($500 value)',
    ],
    originalPrice: '$899',
    actualPrice: '$599',
    downPayment: '$100 down to get started',
    color: 'cyan',
  },
  {
    service: 'Digital Marketing',
    subheading: 'Campaign Management',
    hourlyRate: '$45',
    features: [
      'Campaign Strategy',
      'Ad Management',
      'Brand Development',
      'Performance Analytics',
    ],
    originalPrice: '$1,299',
    actualPrice: '$899',
    downPayment: '$150 down to get started',
    color: 'blue',
  },
  {
    service: 'SEO & Visibility',
    subheading: 'Search Optimization',
    hourlyRate: '$55',
    features: [
      'Technical SEO Audit',
      'Content Strategy',
      'Keyword Research',
      'Monthly Reporting',
    ],
    originalPrice: '$999',
    actualPrice: '$699',
    downPayment: '$125 down to get started',
    color: 'teal',
  },
  {
    service: 'Automations',
    subheading: 'Workflow Integration',
    hourlyRate: '$55',
    features: [
      'Process Analysis',
      'Custom Automation Setup',
      'Integration Development',
      'Training & Documentation',
    ],
    originalPrice: '$1,499',
    actualPrice: '$999',
    downPayment: '$200 down to get started',
    color: 'purple',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fade-in">
            <Image
              src="/orcaclubpro.png"
              alt="ORCACLUB Pro"
              width={120}
              height={120}
              className="w-20 h-20 md:w-24 md:h-24 object-contain mx-auto"
              priority
            />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-cyan-400 mb-4 animate-slide-up">
            PRICING
          </h1>

          <p className="text-lg md:text-xl text-gray-400 font-light animate-slide-up-delay">
            Get started with one of our starter packages below
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingData.map((item, index) => (
              <div
                key={item.service}
                className="bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Hourly Rate */}
                <div className="mb-6">
                  <div className="text-sm text-gray-400 mb-1">Hourly Rate</div>
                  <div className="text-3xl font-bold text-white">{item.hourlyRate}/hr</div>
                </div>

                {/* Service Title */}
                <h3 className="text-xl font-bold text-white mb-2">{item.service}</h3>

                {/* Subheading */}
                <p className="text-sm text-gray-400 mb-6">{item.subheading}</p>

                {/* Divider */}
                <div className="h-px bg-white/10 mb-6" />

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {item.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl text-gray-500 line-through">{item.originalPrice}</span>
                    <span className="text-3xl font-bold text-white">{item.actualPrice}</span>
                  </div>
                  <p className="text-xs text-gray-400">{item.downPayment}</p>
                </div>

                {/* CTA Button */}
                <Link
                  href="/contact"
                  className="mt-6 w-full block text-center px-6 py-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 px-6 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-fade-in-delay">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Questions about pricing?
            </h2>
            <p className="text-gray-400 mb-8">
              Contact us for a free consultation and custom quote tailored to your needs.
            </p>
            <Link
              href="/contact"
              className="inline-block px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg text-base font-medium text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }

        .animate-slide-up-delay {
          animation: slideUp 0.6s ease-out 0.3s forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-delay {
          animation: fadeIn 0.6s ease-out 0.5s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
