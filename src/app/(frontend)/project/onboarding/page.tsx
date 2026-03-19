import Link from "next/link"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import PhaseProgressNav from "@/components/sections/PhaseProgressNav"
import ProjectSubNav from "@/components/layout/ProjectSubNav"
import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "How We Work — ORCACLUB",
  description:
    "The full ORCACLUB engagement process — from initial discovery through final delivery. Four phases, structured sprints, and written updates at every step.",
  openGraph: {
    title: "How We Work — ORCACLUB",
    description:
      "The full ORCACLUB engagement process — from initial discovery through final delivery. Four phases, structured sprints, and written updates at every step.",
    type: "website",
  },
}

const phases = [
  {
    id: "phase-01",
    number: "01",
    name: "Consultation",
    sub: "Pre-engagement · Discovery & qualification",
    steps: [
      "Receive inquiry — email, referral, or inbound contact",
      "Initial discovery call — scope, timeline, and budget range",
      "NDA signed before any sensitive information is exchanged",
      "Deeper discovery session — goals, current state, deliverable expectations",
      "Proposal drafted with high-level scope and pricing estimate",
    ],
    sprint: false,
    deposit: null,
    outro: null,
  },
  {
    id: "phase-02",
    number: "02",
    name: "Onboarding",
    sub: "Agreement · Documentation · Access setup",
    steps: [
      "W-9 exchanged for client vendor and tax records",
      "MSA or project contract sent for review and signature",
      "Scope of work finalized — deliverables, timeline, and revision limits",
      "Payment schedule agreed and signed within the contract",
      "Access handed off — credentials, brand assets, ad accounts, CMS",
    ],
    sprint: false,
    deposit: null,
    outro: null,
  },
  {
    id: "phase-03",
    number: "03",
    name: "Development",
    sub: "Active work · Sprints · Reporting",
    steps: [
      "Project initialized — tasks, milestones, and sprint map created in system",
      "Kickoff call — priorities, comms cadence, and tools confirmed with client",
      "Sprint cycles of 1–2 weeks with defined tasks and acceptance criteria",
      "Weekly written update — completed work, blockers, and next steps",
      "End-of-sprint review — feedback collected, next sprint planned",
      "Scope changes documented and approved in writing before execution",
    ],
    sprint: true,
    deposit: "A deposit is collected at the start of this phase — before any work begins.",
    outro: null,
  },
  {
    id: "phase-04",
    number: "04",
    name: "Closeout",
    sub: "Delivery · Sign-off · Handoff",
    steps: [
      "Final deliverables reviewed against the original scope of work",
      "All assets and files delivered to client",
      "Written client sign-off obtained — formal acceptance of completed work",
      "Access and credentials returned or transferred to client",
      "Final invoice issued per the agreed payment schedule",
    ],
    sprint: false,
    deposit: null,
    outro: "For ongoing needs, retainer arrangements are available after successful project completion.",
  },
]

const sprintCycle = [
  "Sprint planned",
  "Weekly update",
  "Sprint review",
  "Next sprint kickoff",
]

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-black relative">
      <AnimatedBackground />
      <ProjectSubNav />

      {/* Header */}
      <section className="relative z-10 pt-52 pb-28 px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="text-xs tracking-[0.35em] uppercase text-white/30 mb-8 font-light">
              The Process
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-6xl md:text-7xl font-extralight text-white mb-7 tracking-tight">
              How We Work
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-gray-400 font-light max-w-xl leading-relaxed text-lg md:text-xl">
              Every engagement follows a structured four-phase sequence — from first conversation through final delivery. No surprises on either side.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Phase content + sticky nav */}
      <section className="relative z-10 px-8 pb-44">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-16 xl:gap-28">

            {/* Sticky side nav */}
            <div className="hidden lg:block w-44 xl:w-52 shrink-0">
              <PhaseProgressNav />
            </div>

            {/* Phase sections */}
            <div className="flex-1 min-w-0 space-y-44 md:space-y-52">
              {phases.map((phase) => (
                <div key={phase.id} id={phase.id} className="scroll-mt-[145px]">

                  {/* Sticky phase header — catches at top-[136px] and rides there
                      while the user scrolls through all steps in this phase */}
                  <div className="sticky top-[139px] z-20 pt-6 relative backdrop-blur-2xl">
                    {/* Decorative number lives inside sticky so it travels with the heading */}
                    <span
                      className="hidden sm:block absolute -top-4 -left-4 text-[160px] font-black text-white/[0.04] leading-none pointer-events-none select-none"
                      aria-hidden="true"
                    >
                      {phase.number}
                    </span>
                    <div className="relative">
                      <p className="text-xs tracking-[0.35em] uppercase text-white/25 mb-4 font-light">
                        Phase {phase.number}
                      </p>
                      <h2 className="text-5xl md:text-6xl font-extralight text-white mb-4 tracking-tight">
                        {phase.name}
                      </h2>
                      <p className="text-lg font-light text-white/35 tracking-wide mb-7">
                        {phase.sub}
                      </p>
                    </div>
                    {/* Rule lives inside sticky so it anchors with the heading */}
                    <div className="h-px bg-white/[0.05]" />
                    {/* Fade gradient — steps scroll under this seamlessly */}
                    <div className="h-10" />
                  </div>

                  {/* Steps */}
                  <div className="space-y-7 mt-4">
                    {phase.steps.map((step, i) => (
                      <ScrollReveal key={i} delay={60 + i * 45}>
                        <div className="flex gap-5 items-start">
                          <div className="mt-[9px] w-[3px] h-[3px] rounded-full bg-[#67e8f9]/50 shrink-0" />
                          <p className="text-gray-300 font-light leading-relaxed text-lg md:text-xl">
                            {step}
                          </p>
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>

                  {/* Sprint cycle visual */}
                  {phase.sprint && (
                    <ScrollReveal delay={320}>
                      <div className="mt-12 p-8 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                        <p className="text-xs tracking-[0.35em] uppercase text-white/25 mb-7 font-light">
                          Sprint Cycle &middot; 1–2 weeks
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          {sprintCycle.map((step, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="px-4 py-2 rounded-md bg-white/[0.03] border border-white/[0.07]">
                                <span className="text-base text-white/50 font-light">{step}</span>
                              </div>
                              {i < sprintCycle.length - 1 ? (
                                <span className="text-white/15 text-sm">→</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-white/15 text-base">↻</span>
                                  <span className="text-[10px] text-white/15 font-light tracking-wide">repeat</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollReveal>
                  )}

                  {/* Deposit callout */}
                  {phase.deposit && (
                    <ScrollReveal delay={370}>
                      <div className="mt-5 flex gap-4 items-start px-5 py-4 rounded-lg bg-[#67e8f9]/[0.03] border border-[#67e8f9]/[0.10]">
                        <span className="text-[#67e8f9]/50 text-sm mt-0.5 font-light">$</span>
                        <p className="text-base text-white/40 font-light leading-relaxed">
                          {phase.deposit}
                        </p>
                      </div>
                    </ScrollReveal>
                  )}

                  {/* Outro note */}
                  {phase.outro && (
                    <ScrollReveal delay={350}>
                      <p className="mt-12 text-base text-white/22 font-light italic leading-relaxed max-w-sm">
                        {phase.outro}
                      </p>
                    </ScrollReveal>
                  )}

                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 border-t border-white/[0.05] px-8 py-44">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="max-w-xl">
              <p className="text-xs tracking-[0.35em] uppercase text-white/25 mb-8 font-light">
                Ready to begin
              </p>
              <h2 className="text-5xl md:text-6xl font-extralight text-white mb-7 tracking-tight">
                Start a Project
              </h2>
              <p className="text-gray-400 font-light leading-relaxed mb-12 text-lg md:text-xl">
                If this process resonates, we&apos;d like to hear from you. The first conversation is always a discovery call — no commitment, no pitch.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <Link
                  href="/contact"
                  className="group flex items-center justify-center gap-2.5 px-10 py-4 rounded-md font-semibold text-sm text-black bg-white hover:bg-white/90 hover:scale-[1.02] transition-all duration-200"
                >
                  Join the Waitlist
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
                <Link
                  href="/packages"
                  className="flex items-center justify-center gap-2.5 px-10 py-4 rounded-md font-semibold text-sm text-white bg-white/[0.04] border border-white/[0.12] hover:bg-white/[0.08] transition-all duration-200"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
