"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Cinzel_Decorative } from "next/font/google"

const gothic = Cinzel_Decorative({ weight: "700", subsets: ["latin"] })

interface DynamicGreetingProps {
  className?: string
}

interface GreetingContent {
  first: string
  second: string
  language: string
}

// Define greetings for different languages and times of day
const greetings = {
  morning: [
    { first: "Good", second: "Morning", language: "English" },
    { first: "Buen", second: "Día", language: "Spanish" },
    { first: "Bon", second: "Matin", language: "French" },
    { first: "Guten", second: "Morgen", language: "German" },
    { first: "Buon", second: "Giorno", language: "Italian" },
    { first: "おはよう", second: "ございます", language: "Japanese" },
    { first: "早上", second: "好", language: "Chinese" },
    { first: "좋은", second: "아침", language: "Korean" },
    { first: "Bom", second: "Dia", language: "Portuguese" },
    { first: "Доброе", second: "Утро", language: "Russian" },
    { first: "صباح", second: "الخير", language: "Arabic" },
    { first: "शुभ", second: "प्रभात", language: "Hindi" }
  ],
  afternoon: [
    { first: "Good", second: "Afternoon", language: "English" },
    { first: "Buenas", second: "Tardes", language: "Spanish" },
    { first: "Bon", second: "Après-midi", language: "French" },
    { first: "Guten", second: "Tag", language: "German" },
    { first: "Buon", second: "Pomeriggio", language: "Italian" },
    { first: "こんに", second: "ちは", language: "Japanese" },
    { first: "下午", second: "好", language: "Chinese" },
    { first: "좋은", second: "오후", language: "Korean" },
    { first: "Boa", second: "Tarde", language: "Portuguese" },
    { first: "Добрый", second: "День", language: "Russian" },
    { first: "مساء", second: "الخير", language: "Arabic" },
    { first: "शुभ", second: "दोपहर", language: "Hindi" }
  ],
  evening: [
    { first: "Good", second: "Evening", language: "English" },
    { first: "Buenas", second: "Noches", language: "Spanish" },
    { first: "Bon", second: "Soir", language: "French" },
    { first: "Guten", second: "Abend", language: "German" },
    { first: "Buona", second: "Sera", language: "Italian" },
    { first: "こんば", second: "んは", language: "Japanese" },
    { first: "晚上", second: "好", language: "Chinese" },
    { first: "좋은", second: "저녁", language: "Korean" },
    { first: "Boa", second: "Noite", language: "Portuguese" },
    { first: "Добрый", second: "Вечер", language: "Russian" },
    { first: "مساء", second: "الخير", language: "Arabic" },
    { first: "शुभ", second: "संध्या", language: "Hindi" }
  ]
}

export default function DynamicGreeting({ className = "" }: DynamicGreetingProps) {
  const [greetingContent, setGreetingContent] = useState<GreetingContent>(greetings.morning[0])
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0)
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const determineTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours()
    
    if (hour >= 5 && hour < 12) {
      return 'morning'
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon'
    } else {
      return 'evening'
    }
  }

  const getCurrentGreeting = (langIndex: number, currentTime: 'morning' | 'afternoon' | 'evening') => {
    const currentGreetings = greetings[currentTime]
    return currentGreetings[langIndex % currentGreetings.length]
  }

  const animateToNextGreeting = useCallback(() => {
    if (isTransitioning) return // Prevent overlapping animations

    // Start exit animation (swipe up)
    setIsTransitioning(true)
    setIsVisible(false)

    // After exit animation, update content and show new greeting
    setTimeout(() => {
      const newIndex = currentLanguageIndex + 1
      const currentTime = determineTimeOfDay()
      const newGreeting = getCurrentGreeting(newIndex, currentTime)

      setCurrentLanguageIndex(newIndex)
      setTimeOfDay(currentTime)
      setGreetingContent(newGreeting)

      // Small delay before entrance animation for smoother transition
      setTimeout(() => {
        setIsTransitioning(false)
        setIsVisible(true)
      }, 150)
    }, 600) // Slightly longer exit animation for more fluid feel
  }, [isTransitioning, currentLanguageIndex])

  // Stable ref — always points to the latest animateToNextGreeting without
  // being a dependency of the interval effect, preventing teardown/recreation.
  const animateRef = useRef(animateToNextGreeting)
  useEffect(() => {
    animateRef.current = animateToNextGreeting
  }, [animateToNextGreeting])

  // Initial setup
  useEffect(() => {
    const initialTime = determineTimeOfDay()
    const initialGreeting = getCurrentGreeting(0, initialTime)

    setTimeOfDay(initialTime)
    setGreetingContent(initialGreeting)
    setMounted(true)

    const textTimer = setTimeout(() => {
      setIsVisible(true)
    }, 600)

    return () => {
      clearTimeout(textTimer)
    }
  }, [])

  // Combined interval: cycles language every 15s and checks time-of-day each tick.
  // Uses stable ref so the interval is never torn down and recreated.
  useEffect(() => {
    if (!mounted) return

    const interval = setInterval(() => {
      animateRef.current()

      // Check time-of-day on every tick (15s granularity is fine).
      // animateToNextGreeting already updates timeOfDay inside the transition,
      // but we also catch the case where time changes between language cycles.
      setTimeOfDay(prev => {
        const newTime = determineTimeOfDay()
        if (newTime !== prev) {
          // Update greeting content to match new time, keeping current index.
          setCurrentLanguageIndex(idx => {
            const newGreeting = getCurrentGreeting(idx, newTime)
            setGreetingContent(newGreeting)
            return idx
          })
        }
        return newTime
      })
    }, 15000)

    return () => clearInterval(interval)
  }, [mounted]) // stable — never re-registers after mount

  if (!mounted) return null

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      <div className="flex flex-col items-center text-center space-y-3 px-8">

        {/* Dynamic Greeting Text - Centered */}
        <div className="flex flex-col items-center">
          <div
            className={`${gothic.className} tracking-tighter leading-tight transition-all duration-700 ease-in-out whitespace-nowrap ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-60px]'
            }`}
            style={{
              transitionDelay: isTransitioning ? '0ms' : '300ms',
              fontSize: 'clamp(1.5rem, 3.5vw, 3rem)',
            }}
          >
            <span className="text-white">
              {greetingContent.first}
            </span>
            <span className="ml-2 md:ml-3 lg:ml-4 xl:ml-6">
              <span className="primary-gradient-text">
                {greetingContent.second}
              </span>
            </span>
          </div>
        </div>

        {/* Elegant Divider */}
        <div className={`w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent transition-all duration-1000 ${
          isVisible ? 'opacity-60 scale-x-100' : 'opacity-0 scale-x-0'
        }`} style={{ transitionDelay: '600ms' }}></div>
      </div>
    </div>
  )
} 