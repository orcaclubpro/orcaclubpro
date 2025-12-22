import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import {
  ArrowRight,
} from "lucide-react"
import { services } from '@/data/services'
import ServicesGrid from '@/components/sections/ServicesGrid'

export const metadata: Metadata = {
  title: 'Our Services - Web Development, AI Automation, SEO & Digital Marketing | OrcaClub',
  description: 'Comprehensive software development services including custom web development (2-4 weeks), AI workflow automation, SEO optimization, and digital marketing. Tailored solutions for modern businesses with expert execution and transparent pricing.',
  keywords: [
    'software development services',
    'web development services',
    'AI automation services',
    'SEO services',
    'digital marketing services',
    'custom web development',
    'workflow automation',
    'business automation',
    'software consultants',
    'technology solutions',
    'React development',
    'Next.js development',
    'CRM integration',
    'marketing automation'
  ],
  openGraph: {
    title: 'OrcaClub Services - Web Development, AI Automation & Marketing',
    description: 'Expert software services: Fast web development, intelligent automation, SEO optimization, and ROI-driven marketing campaigns. Transform your business with tailored solutions.',
    url: 'https://orcaclub.pro/services',
    siteName: 'OrcaClub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OrcaClub Services - Complete Software Development Solutions',
    description: 'Web development, AI automation, SEO, and digital marketing services for modern businesses.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services',
  },
}

export default async function ServicesPage() {

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
              Our <span className="gradient-text font-light">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-12">
              Tailored solutions designed to elevate your business.
              From elegant web design to intelligent automation, we bring your vision to life.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ServicesGrid />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8 border-t border-slate-800/50 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
              Ready to get <span className="gradient-text font-light">started</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
              Let&apos;s discuss how we can create tailored solutions that make your business
              more efficient, more profitable, and more competitive.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Start Your Project <ArrowRight size={20} />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors magnetic"
              >
                View Our Work <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
            <p className="text-xs text-gray-600 mt-8 font-light">
              Free consultation • Custom solutions • Transparent pricing
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-16 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl tracking-tight mb-4">
            <span className="font-extralight">ORCA</span>
            <span className="font-light gradient-text">CLUB</span>
          </div>
          <p className="text-gray-500 text-sm font-light">Software Agency • Tailored Solutions • Smarter Workflows</p>
        </div>
      </footer>
    </div>
  )
}
