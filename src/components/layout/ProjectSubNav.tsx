"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const tabs = [
  { name: "How We Work",         href: "/project/onboarding" },
  { name: "Project Development", href: "/project/development" },
]

const SECTIONS: Record<string, { id: string; label: string }[]> = {
  "/project/onboarding": [
    { id: "phase-01", label: "Consultation" },
    { id: "phase-02", label: "Onboarding" },
    { id: "phase-03", label: "Development" },
    { id: "phase-04", label: "Closeout" },
  ],
  "/project/development": [
    { id: "section-sprint", label: "Sprint Cycle" },
    { id: "section-expect", label: "What to Expect" },
  ],
}

export default function ProjectSubNav() {
  const pathname = usePathname()
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  const isVisible = pathname in SECTIONS

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const sections = SECTIONS[pathname]
    if (!sections) return

    setActiveLabel(sections[0].label)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const match = sections.find((s) => s.id === entry.target.id)
            if (match) setActiveLabel(match.label)
          }
        })
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [pathname, isVisible])

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-[83px] left-0 right-0 z-40 border-b transition-colors duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-white/[0.06]"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 flex items-center h-14 gap-6">

        {/* Page tabs */}
        <div className="flex items-center h-full">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-5 h-full flex items-center text-sm font-light tracking-wide transition-colors duration-200 ${
                  isActive ? "text-white" : "text-white/35 hover:text-white/65"
                }`}
              >
                {tab.name}
                <span
                  className={`absolute bottom-0 left-5 right-5 h-px transition-all duration-300 ${
                    isActive ? "bg-[#67e8f9]" : "bg-transparent"
                  }`}
                />
              </Link>
            )
          })}
        </div>

        {/* Active section label */}
        {activeLabel && (
          <>
            <div className="w-px h-4 bg-white/[0.08] shrink-0" />
            <span
              key={activeLabel}
              className="text-sm font-light text-[#67e8f9]/60 animate-fadeIn"
            >
              {activeLabel}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
