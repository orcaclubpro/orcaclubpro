"use client"

import ScrollReveal from "@/components/layout/scroll-reveal"
import DynamicGreeting from "@/components/layout/dynamic-greeting"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="h-screen relative z-10 flex items-center justify-center">
      <div className="max-w-5xl mx-auto px-6 md:px-8 text-center relative w-full py-6">
        <ScrollReveal>
          <DynamicGreeting className="mb-12 md:mb-16" />
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center items-stretch mb-6 md:mb-8">
            {/* SPACES — solid gradient, primary CTA */}
            <Link
              href="/login"
              className="group relative px-10 md:px-14 py-4 md:py-5 rounded-md font-semibold text-base md:text-lg text-white inline-flex items-center justify-center gap-2.5 whitespace-nowrap overflow-hidden transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}
            >
              {/* Shimmer */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative tracking-[0.12em] text-sm md:text-base uppercase font-bold">SPACES</span>
            </Link>

            {/* Free Consultation — glassmorphism secondary CTA */}
            <Link
              href="/contact"
              className="group relative px-10 md:px-14 py-4 md:py-5 bg-white/[0.04] border border-white/[0.12] rounded-md text-base md:text-lg font-light text-white/80 hover:bg-white/[0.08] hover:border-white/[0.22] hover:text-white transition-all duration-300 inline-flex items-center justify-center gap-2.5 whitespace-nowrap"
            >
              Free Consultation
              <ArrowRight size={15} className="opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </div>

          <p className="text-xs text-white/20 font-light tracking-[0.25em] uppercase">
            3–21 Day Delivery · Fixed Pricing · Direct Developer Access
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
