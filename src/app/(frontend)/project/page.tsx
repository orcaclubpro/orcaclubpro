import Link from "next/link"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Start a Project — ORCACLUB",
  description:
    "Begin your engagement with ORCACLUB. Every project starts with a conversation — structured, NDA-protected, and built around your goals.",
  openGraph: {
    title: "Start a Project — ORCACLUB",
    description:
      "Begin your engagement with ORCACLUB. Every project starts with a conversation — structured, NDA-protected, and built around your goals.",
    type: "website",
  },
}

const phases = [
  { number: "01", name: "Consultation", sub: "Discovery & qualification" },
  { number: "02", name: "Onboarding", sub: "Agreement & access setup" },
  { number: "03", name: "Development", sub: "Active work & sprints" },
  { number: "04", name: "Closeout", sub: "Delivery & handoff" },
]

export default function ProjectPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <ScrollReveal>
          <p className="text-[11px] tracking-[0.45em] uppercase text-white/30 mb-12 font-light">
            Client Engagement
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-extralight text-white mb-8 tracking-tight leading-none">
            Start a Project
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-gray-400 font-light max-w-sm mx-auto mb-20 leading-relaxed text-base md:text-lg">
            We work with a select number of clients at a time — deeply, not broadly. Every engagement begins with a conversation.
          </p>
        </ScrollReveal>

        {/* Phase strip */}
        <ScrollReveal delay={300}>
          <div className="flex items-center justify-center mb-20">
            {phases.map((phase, i) => (
              <div key={phase.number} className="flex items-center">
                <div className="flex flex-col items-center px-6 md:px-10 py-3">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-white/20 font-light mb-2">
                    {phase.number}
                  </span>
                  <span className="text-sm md:text-base font-light text-white/50">
                    {phase.name}
                  </span>
                </div>
                {i < phases.length - 1 && (
                  <div className="w-6 md:w-10 h-px bg-white/[0.07]" />
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* CTAs */}
        <ScrollReveal delay={400}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/project/onboarding"
                className="group flex items-center justify-center gap-2.5 px-10 py-4 rounded-md font-semibold text-sm text-black bg-white hover:bg-white/90 hover:scale-[1.02] transition-all duration-200"
              >
                See How It Works
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              <Link
                href="/project/development"
                className="flex items-center justify-center gap-2.5 px-10 py-4 rounded-md font-semibold text-sm text-white bg-white/[0.04] border border-white/[0.12] hover:bg-white/[0.08] transition-all duration-200"
              >
                What&apos;s a Project Like?
              </Link>
            </div>

            <Link
              href="/login"
              className="text-[11px] text-white/18 hover:text-white/40 transition-colors duration-200 tracking-wide"
            >
              Already a client? Sign in
            </Link>
          </div>
        </ScrollReveal>

        {/* Trust signal */}
        <ScrollReveal delay={550}>
          <div className="mt-24 flex items-center gap-6">
            <div className="h-px w-12 bg-white/[0.06]" />
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/18 font-light">
              NDA-protected &middot; Selective intake &middot; No unsolicited pitches
            </p>
            <div className="h-px w-12 bg-white/[0.06]" />
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}
