"use client"

import { useState, useEffect } from "react"
import { Cinzel_Decorative } from "next/font/google"

const gothic = Cinzel_Decorative({ weight: "700", subsets: ["latin"] })

export default function LoginGreeting() {
  const [textVisible, setTextVisible] = useState(false)
  const [dividerVisible, setDividerVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 200)
    const t2 = setTimeout(() => setDividerVisible(true), 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="flex flex-col items-center text-center space-y-5">
      {/* SPACES — same animation as DynamicGreeting text */}
      <div
        className="transition-all duration-700 ease-in-out"
        style={{
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? 'translateY(0)' : 'translateY(-60px)',
          transitionDelay: textVisible ? '300ms' : '0ms',
        }}
      >
        <div
          className={`${gothic.className} tracking-tighter leading-tight whitespace-nowrap`}
          style={{ fontSize: 'clamp(1.5rem, 3.5vw, 3rem)' }}
        >
          <span className="text-white">Welcome</span>
          <span className="ml-3 md:ml-4 lg:ml-5 primary-gradient-text">back.</span>
        </div>
      </div>

      {/* Divider — matches DynamicGreeting divider */}
      <div
        className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent transition-all duration-1000"
        style={{
          opacity: dividerVisible ? 0.6 : 0,
          transform: dividerVisible ? 'scaleX(1)' : 'scaleX(0)',
        }}
      />
    </div>
  )
}
