"use client"

import { useState, useEffect } from "react"
import { UnifrakturMaguntia } from "next/font/google"

const blackletter = UnifrakturMaguntia({ weight: "400", subsets: ["latin"] })

export default function LoginGreeting() {
  const [tagVisible, setTagVisible] = useState(false)
  const [textVisible, setTextVisible] = useState(false)
  const [dividerVisible, setDividerVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setTagVisible(true), 200)
    const t2 = setTimeout(() => setTextVisible(true), 600)
    const t3 = setTimeout(() => setDividerVisible(true), 900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className="flex flex-col items-center text-center space-y-5">
      {/* Gothic tag — matches DynamicGreeting logo reveal timing */}
      <div
        className="transition-all duration-1000 ease-out"
        style={{
          opacity: tagVisible ? 1 : 0,
          transform: tagVisible ? 'translateY(0)' : 'translateY(-20px)',
        }}
      >
        <span className={`${blackletter.className} text-4xl text-white/40`}>
          Client Portal
        </span>
      </div>

      {/* SPACES — same animation as DynamicGreeting text */}
      <div
        className="transition-all duration-700 ease-in-out"
        style={{
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? 'translateY(0)' : 'translateY(-60px)',
          transitionDelay: textVisible ? '300ms' : '0ms',
        }}
      >
        <div className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-tighter leading-tight whitespace-nowrap">
          <span className="text-white">Welcome</span>
          <span className="ml-3 md:ml-4 lg:ml-5 gradient-text">back.</span>
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
