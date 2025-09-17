'use client'

import { useState, useEffect } from 'react'

export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false)
  const [hasEverScrolledPastHero, setHasEverScrolledPastHero] = useState(false)

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return

    // Check localStorage on mount to see if user has previously scrolled past hero
    const storedHasScrolled = localStorage.getItem('kaiju-has-scrolled-past-hero') === 'true'

    // Also check current scroll position on mount (in case user refreshed while scrolled down)
    const currentScrollY = window.scrollY
    const heroThreshold = window.innerHeight * 0.3
    const isCurrentlyPastHero = currentScrollY > heroThreshold

    if (storedHasScrolled || isCurrentlyPastHero) {
      setHasEverScrolledPastHero(true)
      // If we're currently past the top threshold, show the selector
      const topThreshold = window.innerHeight * 0.1
      setIsScrolledPastHero(currentScrollY > topThreshold)
    }

    const handleScroll = () => {
      if (typeof window === 'undefined') return

      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)

      // Hero activation threshold - 30% of viewport height (more accessible)
      const heroThreshold = window.innerHeight * 0.3
      // Top threshold - only hide when very close to top
      const topThreshold = window.innerHeight * 0.1

      // If user scrolls past hero for the first time, remember it
      if (currentScrollY > heroThreshold && !hasEverScrolledPastHero) {
        setHasEverScrolledPastHero(true)
        setIsScrolledPastHero(true)
        // Persist to localStorage
        localStorage.setItem('kaiju-has-scrolled-past-hero', 'true')
      }

      // Once activated, only hide if user scrolls back to very top
      if (hasEverScrolledPastHero) {
        setIsScrolledPastHero(currentScrollY > topThreshold)
      } else {
        // Initial state - show only after passing hero threshold
        setIsScrolledPastHero(currentScrollY > heroThreshold)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasEverScrolledPastHero])

  return { scrollY, isScrolledPastHero }
}