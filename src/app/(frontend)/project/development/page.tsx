import Link from "next/link"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import DevelopmentSideNav from "@/components/sections/DevelopmentSideNav"
import ProjectSubNav from "@/components/layout/ProjectSubNav"
import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Project Development — ORCACLUB",
  description:
    "Understand what active project development looks like at ORCACLUB — sprint cycles, weekly updates, scope protection, and full asset ownership at closeout.",
  openGraph: {
    title: "Project Development — ORCACLUB",
    description:
      "Sprint-based project development with weekly written updates, locked scope, and full ownership at closeout.",
    type: "website",
  },
}

const sprintSteps = [
  {
    label: "Plan",
    detail: "Tasks and acceptance criteria defined. Priorities confirmed with you before work starts.",
  },
  {
    label: "Build",
    detail: "Active development. Blockers surfaced immediately — never held until the next update.",
  },
  {
    label: "Update",
    detail: "Written summary every week — what was completed, what's next, anything that needs your input.",
  },
  {
    label: "Review",
    detail: "Sprint output delivered for your review. Feedback collected, next sprint scoped.",
  },
]

const expectations = [
  {
    number: "01",
    heading: "You always know where things stand",
    body: "A written update goes out every week — no chasing for status. It covers what was completed, any blockers, and what's planned next.",
  },
  {
    number: "02",
    heading: "Scope stays locked until you change it",
    body: "Anything outside the original scope is documented in writing and approved by you before work begins. No surprise additions, no assumptions.",
  },
  {
    number: "03",
    heading: "Everything is yours at the end",
    body: "Final delivery includes all assets, files, credentials, and documentation. Full written sign-off is collected before the project is closed.",
  },
]

export default function ProjectDevelopmentPage() {
  return (
    <div className="min-h-screen bg-black relative">
      <AnimatedBackground />
      <ProjectSubNav />

      {/* Hero — full width, no sidebar */}
      <section className="relative z-10 pt-52 pb-28 px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="text-xs tracking-[0.35em] uppercase text-white/30 mb-8 font-light">
              Project Development
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-6xl md:text-7xl font-extralight text-white mb-8 tracking-tight leading-tight">
              What a project<br />looks like
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-gray-400 font-light leading-relaxed text-lg md:text-xl max-w-lg">
              Once onboarding is complete, active work runs in sprint cycles — short, focused, and reported on every week.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Sidebar + content */}
      <section className="relative z-10 px-8 pb-44">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-16 xl:gap-28">

            {/* Sticky side nav */}
            <div className="hidden lg:block w-44 xl:w-52 shrink-0">
              <DevelopmentSideNav />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-w-0 space-y-36">

              {/* Sprint cycle */}
              <div id="section-sprint" className="scroll-mt-[145px]">
                <div className="sticky top-[139px] z-20 pt-6 backdrop-blur-2xl">
                  <h2 className="text-4xl md:text-5xl font-extralight text-white mb-2 tracking-tight">
                    Sprint Cycle
                  </h2>
                  <p className="text-lg font-light text-white/35 mb-7">
                    1–2 weeks per sprint &middot; repeats until delivery
                  </p>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="h-10" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
                  {sprintSteps.map((step, i) => (
                    <ScrollReveal key={i} delay={i * 60} className="h-full">
                      <div className="bg-black p-8 h-full flex flex-col gap-5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs tracking-[0.25em] uppercase text-white/20 font-light">
                            0{i + 1}
                          </span>
                          {i < sprintSteps.length - 1 && (
                            <span className="hidden lg:block text-white/10 text-sm ml-auto">→</span>
                          )}
                          {i === sprintSteps.length - 1 && (
                            <span className="hidden lg:block text-white/10 text-sm ml-auto">↻</span>
                          )}
                        </div>
                        <p className="text-white font-light text-2xl">{step.label}</p>
                        <p className="text-gray-500 font-light text-base leading-relaxed mt-auto">
                          {step.detail}
                        </p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                <ScrollReveal delay={280}>
                  <p className="mt-6 text-sm text-white/18 font-light tracking-wide leading-relaxed">
                    Sprints repeat until all deliverables are complete. Typically 2–6 weeks of active development per engagement.
                  </p>
                </ScrollReveal>
              </div>

              {/* What to expect */}
              <div id="section-expect" className="scroll-mt-[145px]">
                <div className="sticky top-[139px] z-20 pt-6 backdrop-blur-2xl">
                  <h2 className="text-4xl md:text-5xl font-extralight text-white mb-2 tracking-tight">
                    What to Expect
                  </h2>
                  <p className="text-lg font-light text-white/35 mb-7">
                    Three things you can count on in every engagement
                  </p>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="h-10" />
                </div>

                <div className="space-y-16">
                  {expectations.map((item, i) => (
                    <ScrollReveal key={i} delay={i * 80}>
                      <div className="flex gap-10 md:gap-16 items-start">
                        <span className="text-xs tracking-[0.25em] uppercase text-white/18 font-light pt-1.5 shrink-0">
                          {item.number}
                        </span>
                        <div>
                          <h3 className="text-white font-light text-3xl md:text-4xl mb-4 leading-snug">
                            {item.heading}
                          </h3>
                          <p className="text-gray-500 font-light text-lg leading-relaxed max-w-md">
                            {item.body}
                          </p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-white/[0.05] px-8 py-40">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-12">
              <div>
                <p className="text-xs tracking-[0.35em] uppercase text-white/25 mb-8 font-light">
                  Ready to start
                </p>
                <h2 className="text-5xl md:text-6xl font-extralight text-white tracking-tight">
                  Start a project
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end shrink-0">
                <Link
                  href="/contact"
                  className="group flex items-center justify-center gap-2.5 px-10 py-4 rounded-md font-semibold text-sm text-black bg-white hover:bg-white/90 hover:scale-[1.02] transition-all duration-200"
                >
                  Join the Waitlist
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
                <Link
                  href="/project/onboarding"
                  className="flex items-center justify-center gap-2.5 px-10 py-4 rounded-md font-semibold text-sm text-white bg-white/[0.04] border border-white/[0.12] hover:bg-white/[0.08] transition-all duration-200"
                >
                  See the Process
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
