"use client"

import { useState, useEffect } from "react"

const phases = [
  {
    id:       "phase-01",
    number:   "01",
    name:     "Consultation",
    duration: "3–7 days",
  },
  {
    id:       "phase-02",
    number:   "02",
    name:     "Onboarding",
    duration: "3–7 days",
  },
  {
    id:       "phase-03",
    number:   "03",
    name:     "Development",
    duration: "2–6 weeks",
  },
  {
    id:       "phase-04",
    number:   "04",
    name:     "Closeout",
    duration: "2–5 days",
  },
]

export default function PhaseProgressNav() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = phases.findIndex((p) => p.id === entry.target.id)
            if (idx !== -1) setActiveIndex(idx)
          }
        })
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    )

    phases.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav className="hidden lg:block sticky top-[139px] self-start" aria-label="Phase navigation">
      <p className="text-xs tracking-[0.35em] uppercase text-white/20 mb-7 font-light">
        Process
      </p>

      <div>
        {phases.map((phase, i) => {
          const isActive = i === activeIndex
          const isPast   = i < activeIndex
          const isLast   = i === phases.length - 1

          return (
            <div key={phase.id}>
              {/* Phase row */}
              <button
                onClick={() => scrollTo(phase.id)}
                className="flex items-start gap-4 text-left group w-full"
                aria-current={isActive ? "step" : undefined}
              >
                {/* Dot */}
                <div
                  className={`mt-[3px] w-[9px] h-[9px] rounded-full shrink-0 transition-all duration-500 ${
                    isActive
                      ? "bg-[#67e8f9] shadow-[0_0_10px_3px_rgba(103,232,249,0.35)] scale-110"
                      : isPast
                        ? "bg-[#67e8f9]/25 scale-90"
                        : "bg-transparent border border-white/15 group-hover:border-white/35"
                  }`}
                />

                {/* Labels */}
                <div className="pb-1 min-w-0">
                  <span
                    className={`block text-xs tracking-[0.25em] uppercase font-light transition-colors duration-300 ${
                      isActive
                        ? "text-[#67e8f9]"
                        : isPast
                          ? "text-[#67e8f9]/30"
                          : "text-white/15 group-hover:text-white/40"
                    }`}
                  >
                    {phase.number}
                  </span>
                  <span
                    className={`block text-sm font-light leading-snug mt-0.5 transition-colors duration-300 ${
                      isActive
                        ? "text-white"
                        : isPast
                          ? "text-white/25"
                          : "text-white/18 group-hover:text-white/50"
                    }`}
                  >
                    {phase.name}
                  </span>
                  <span
                    className={`block text-xs font-light mt-0.5 transition-colors duration-300 ${
                      isActive ? "text-white/35" : "text-white/10"
                    }`}
                  >
                    {phase.duration}
                  </span>
                </div>
              </button>

              {/* Connector segment */}
              {!isLast && (
                <div
                  className={`ml-[4px] my-1 w-px h-7 transition-all duration-500 ${
                    isPast ? "bg-[#67e8f9]/20" : "bg-white/[0.05]"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
