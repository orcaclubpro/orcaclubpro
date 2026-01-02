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
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-stretch mb-6 md:mb-8">
            <Link
              href="/project"
              className="group relative px-8 md:px-12 py-4 md:py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-md text-base md:text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive inline-flex items-center justify-center whitespace-nowrap"
            >
              View Project Tiers
            </Link>
            <Link
              href="/portfolio"
              className="group relative px-8 md:px-12 py-4 md:py-6 bg-white/5 border border-white/10 rounded-md text-base md:text-lg font-light text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500 magnetic interactive inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              See Our Work <ArrowRight size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
          <p className="text-xs text-gray-600 font-light">
            3-21 Day Delivery · Fixed Pricing · $1K-30K
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
