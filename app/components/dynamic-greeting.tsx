"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

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
  const [logoVisible, setLogoVisible] = useState(false)

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

  const animateToNextGreeting = () => {
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
  }

  // Initial setup
  useEffect(() => {
    const initialTime = determineTimeOfDay()
    const initialGreeting = getCurrentGreeting(0, initialTime)
    
    setTimeOfDay(initialTime)
    setGreetingContent(initialGreeting)
    setMounted(true)

    // Staggered animation sequence for brand impact
    const logoTimer = setTimeout(() => {
      setLogoVisible(true)
    }, 200)

    const textTimer = setTimeout(() => {
      setIsVisible(true)
    }, 600)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(textTimer)
    }
  }, [])

  // Language cycling effect
  useEffect(() => {
    if (!mounted) return

    // Cycle through languages every 15 seconds
    const languageInterval = setInterval(() => {
      animateToNextGreeting()
    }, 15000)

    return () => clearInterval(languageInterval)
  }, [mounted, currentLanguageIndex, isTransitioning])

  // Time of day checking effect (separate from language cycling)
  useEffect(() => {
    if (!mounted) return

    const timeInterval = setInterval(() => {
      const newTime = determineTimeOfDay()
      if (newTime !== timeOfDay && !isTransitioning) {
        // Update time of day without animation when time changes
        const newGreeting = getCurrentGreeting(currentLanguageIndex, newTime)
        setTimeOfDay(newTime)
        setGreetingContent(newGreeting)
      }
    }, 60000)

    return () => clearInterval(timeInterval)
  }, [mounted, timeOfDay, currentLanguageIndex, isTransitioning])

  if (!mounted) return null

  return (
    <div className={`flex flex-col items-center justify-start pt-16 pb-16 w-full ${className}`}>
      <div className="flex flex-col items-center text-center space-y-4 max-w-4xl mx-auto px-8">
        
        {/* Logo - Top Center */}
        <div className={`transition-all duration-1000 ease-out ${
          logoVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-[-30px] scale-95'
        }`}>
          <Link href="/about" className="group transition-all duration-300 hover:scale-105 cursor-pointer">
            <Image
              src="/orcaclubpro.png"
              alt="ORCACLUB Pro"
              width={200}
              height={200}
              className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-contain group-hover:opacity-80 transition-opacity duration-300"
              priority
            />
          </Link>
        </div>

        {/* Dynamic Greeting Text - Centered */}
        <div className="flex flex-col items-center">
          <div 
            className={`text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-tighter leading-tight transition-all duration-700 ease-in-out whitespace-nowrap ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-60px]'
            }`}
            style={{ 
              transitionDelay: isTransitioning ? '0ms' : '300ms',
              fontWeight: '300'
            }}
          >
            <span className="text-white">
              {greetingContent.first}
            </span>
            <span className="ml-2 md:ml-3 lg:ml-4 xl:ml-6">
              <span className="gradient-text">
                {greetingContent.second}
              </span>
            </span>
          </div>
        </div>

        {/* Elegant Divider */}
        <div className={`w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent transition-all duration-1000 ${
          isVisible ? 'opacity-60 scale-x-100' : 'opacity-0 scale-x-0'
        }`} style={{ transitionDelay: '600ms' }}></div>

        {/* Brand Signature - Bottom Center */}
        <div className={`transition-all duration-800 ease-out ${
          isVisible ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-[20px]'
        }`} style={{ transitionDelay: '750ms' }}>
          <span className="inline-block text-xs md:text-sm font-medium text-gray-400 tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-100 hover:text-cyan-300 hover:tracking-[0.3em] cursor-default">
            by Chance Noonan
          </span>
        </div>
      </div>
    </div>
  )
} 