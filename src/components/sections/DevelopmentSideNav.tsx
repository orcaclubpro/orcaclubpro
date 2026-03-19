"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const sections = [
  { id: "section-sprint", name: "Sprint Cycle",     sub: "1–2 weeks" },
  { id: "section-expect", name: "What to Expect",   sub: "3 commitments" },
]

export default function DevelopmentSideNav() {
  const [activeId, setActiveId] = useState("section-sprint")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav className="hidden lg:block sticky top-[139px] self-start" aria-label="Section navigation">
      <p className="text-xs tracking-[0.35em] uppercase text-white/20 mb-7 font-light">
        On this page
      </p>

      <div>
        {sections.map((section, i) => {
          const isActive = activeId === section.id
          const isPast   = sections.findIndex((s) => s.id === activeId) > i
          const isLast   = i === sections.length - 1

          return (
            <div key={section.id}>
              <button
                onClick={() => scrollTo(section.id)}
                className="flex items-start gap-4 text-left group w-full"
                aria-current={isActive ? "true" : undefined}
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
                    className={`block text-sm font-light leading-snug transition-colors duration-300 ${
                      isActive
                        ? "text-white"
                        : isPast
                          ? "text-white/25"
                          : "text-white/18 group-hover:text-white/50"
                    }`}
                  >
                    {section.name}
                  </span>
                  <span
                    className={`block text-xs font-light mt-0.5 transition-colors duration-300 ${
                      isActive ? "text-white/35" : "text-white/10"
                    }`}
                  >
                    {section.sub}
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

      {/* Divider + CTA */}
      <div className="mt-8 pt-6 border-t border-white/[0.05]">
        <Link
          href="/contact"
          className="group flex items-center gap-2 text-sm font-light text-white/25 hover:text-white/60 transition-colors duration-200"
        >
          Start a project
          <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>
    </nav>
  )
}
