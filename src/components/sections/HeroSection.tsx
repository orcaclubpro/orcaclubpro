"use client"

import ScrollReveal from "@/components/layout/scroll-reveal"
import DynamicGreeting from "@/components/layout/dynamic-greeting"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Cinzel_Decorative } from "next/font/google"

const gothic = Cinzel_Decorative({ weight: "700", subsets: ["latin"] })

interface HeroSectionProps {
  clients?: any[]
  subheading?: string
  primaryButtonLabel?: string
  primaryButtonHref?: string
  secondaryButtonLabel?: string
  secondaryButtonHref?: string
  showClientsCarousel?: boolean
}

export default function HeroSection({
  clients = [],
  subheading = 'Marketing, Development, and Design agency.',
  primaryButtonLabel = 'Join the Wait List',
  primaryButtonHref = '/contact',
  secondaryButtonLabel = 'Start a Project',
  secondaryButtonHref = '/solutions',
  showClientsCarousel = true,
}: HeroSectionProps) {
  const repeated = clients.length > 0 && showClientsCarousel
    ? [...clients, ...clients, ...clients, ...clients]
    : []

  return (
    <section className="h-screen relative z-10 flex flex-col items-center justify-center">
      <div className="max-w-3xl mx-auto px-6 text-center w-full">

        {/* Logo */}
        <ScrollReveal>
          <Link href="/about" className="inline-block mb-8 hover:opacity-80 transition-opacity duration-300">
            <Image
              src="/orcaclubpro.png"
              alt="ORCACLUB"
              width={100}
              height={100}
              className="mx-auto object-contain"
              priority
            />
          </Link>
        </ScrollReveal>

        {/* Greeting */}
        <ScrollReveal delay={150}>
          <DynamicGreeting className="mb-20 sm:mb-6" />
        </ScrollReveal>

        {/* Value prop + CTAs */}
        <ScrollReveal delay={225}>
          <p className="text-sm text-white/35 font-light tracking-wide mb-10">
            {subheading}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {/* Primary button — black */}
            <Link
              href={primaryButtonHref}
              className="group relative w-56 py-4 rounded-md font-semibold text-base text-black bg-white inline-flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden transition-all duration-300 hover:bg-white/90 hover:scale-[1.02]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className={`relative tracking-[0.06em] ${gothic.className}`}>{primaryButtonLabel}</span>
            </Link>

            {/* Secondary button — white */}
            <Link
              href={secondaryButtonHref}
              className="group w-56 py-4 bg-white/[0.04] border border-white/[0.12] rounded-md text-base font-light text-white/80 hover:bg-white/[0.08] hover:border-white/[0.22] hover:text-white transition-all duration-300 inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span className={gothic.className}>{secondaryButtonLabel}</span>
              <ArrowRight size={13} className="opacity-50 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Client logo carousel — below CTA buttons */}
        {repeated.length > 0 && (
          <ScrollReveal delay={300}>
            <div className="mt-24">
              <p className="text-[9px] tracking-[0.4em] uppercase text-white/20 font-light text-center mb-5">
                Trusted By
              </p>
              <div
                className="relative overflow-hidden"
                style={{
                  maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
                }}
              >
                <div className="flex gap-12 items-center carousel-track" style={{ width: "max-content" }}>
                  {repeated.map((client, index) => {
                    const logo = client.logo
                    const logoUrl = typeof logo === "object" && logo?.url ? logo.url : null
                    const hasWebsite = client.website && client.website.trim() !== ""

                    const inner = (
                      <div className="carousel-logo flex items-center justify-center w-36 h-14 flex-shrink-0">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt={logo.alt || client.name}
                            width={144}
                            height={56}
                            className="object-contain w-full h-full"
                            priority={index < clients.length}
                          />
                        ) : (
                          <span className="text-white/20 text-[10px] font-light tracking-widest uppercase">
                            {client.name}
                          </span>
                        )}
                      </div>
                    )

                    return (
                      <div key={`${client.id ?? index}-${index}`} className="flex-shrink-0">
                        {hasWebsite ? (
                          <a href={client.website} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${client.name}`} className="block">
                            {inner}
                          </a>
                        ) : inner}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>

      <style jsx>{`
        .carousel-track {
          animation: marquee 40s linear infinite;
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .carousel-logo {
          filter: grayscale(1) brightness(0.45);
          transition: filter 0.4s ease, transform 0.3s ease;
        }
        .carousel-logo:hover {
          filter: grayscale(0) brightness(1);
          transform: scale(1.08);
        }
      `}</style>
    </section>
  )
}
