"use client"

import ScrollReveal from "@/components/layout/scroll-reveal"
import DynamicGreeting from "@/components/layout/dynamic-greeting"
import { BookingModal } from "@/components/booking-modal"
import { ArrowRight } from "lucide-react"
import Image from "next/image"

interface HeroSectionProps {
  clients?: Array<{
    id: string
    name: string
    logo: { url: string; alt?: string }
    website?: string
  }>
}

export default function HeroSection({ clients = [] }: HeroSectionProps) {
  const scrollToWork = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById('our-work')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToClients = (e: React.MouseEvent) => {
    e.preventDefault()
    const clientSection = document.querySelector('[data-section="clients"]')
    if (clientSection) {
      clientSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="h-screen relative z-10 flex items-center justify-center">
      <div className="max-w-5xl mx-auto px-6 md:px-8 text-center relative w-full py-6">
        <ScrollReveal>
          <DynamicGreeting className="mb-6 md:mb-8" />
        </ScrollReveal>

        {/* Subtle Value Proposition */}
        <ScrollReveal delay={200}>
          <p className="text-base md:text-lg text-gray-400 font-light mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
            Technical integration and business solutions
            <span className="text-cyan-400/80"> · </span>
            Built in weeks, not months
          </p>
        </ScrollReveal>

        {/* Client Logos - Clickable */}
        {clients.length > 0 && (
          <ScrollReveal delay={300}>
            <div className="mb-8 md:mb-10">
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-4 font-light">
                Trusted by Leading Brands
              </p>
              <button
                onClick={scrollToClients}
                className="block w-full cursor-pointer group"
                aria-label="Scroll to client section"
              >
                <div className="flex items-center justify-center gap-6 md:gap-8 flex-wrap max-w-3xl mx-auto">
                  {clients.slice(0, 6).map((client, idx) => {
                    const logoUrl = typeof client.logo === 'object' && client.logo?.url ? client.logo.url : null
                    if (!logoUrl) return null

                    return (
                      <div
                        key={client.id}
                        className="opacity-30 group-hover:opacity-60 hover:!opacity-80 transition-opacity duration-300 h-6 md:h-8 w-16 md:w-20 relative grayscale group-hover:grayscale-0"
                      >
                        <Image
                          src={logoUrl}
                          alt={client.logo.alt || client.name}
                          fill
                          className="object-contain"
                          loading={idx < 3 ? "eager" : "lazy"}
                          sizes="(max-width: 768px) 64px, 80px"
                        />
                      </div>
                    )
                  })}
                </div>
              </button>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal delay={400}>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-6 md:mb-8">
            <BookingModal
              triggerClassName="group relative px-8 md:px-12 py-4 md:py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-base md:text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              triggerText="Start Your Project"
            />
            <a
              href="#our-work"
              className="text-base md:text-lg font-light text-gray-300 hover:text-white transition-colors duration-300 flex items-center gap-2 magnetic cursor-pointer"
              onClick={scrollToWork}
            >
              View Our Work <ArrowRight size={16} className="opacity-50" />
            </a>
          </div>
          <p className="text-xs text-gray-600 font-light">
            Free consultation · Custom solutions · Transparent pricing
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
