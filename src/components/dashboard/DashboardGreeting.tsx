'use client'

import { useState, useEffect, useCallback } from 'react'

const greetings = {
  morning: [
    { first: 'Good', second: 'Morning' },
    { first: 'Buen', second: 'Día' },
    { first: 'Bon', second: 'Matin' },
    { first: 'Guten', second: 'Morgen' },
    { first: 'Buon', second: 'Giorno' },
    { first: 'おはよう', second: 'ございます' },
    { first: '早上', second: '好' },
    { first: '좋은', second: '아침' },
    { first: 'Bom', second: 'Dia' },
    { first: 'Доброе', second: 'Утро' },
  ],
  afternoon: [
    { first: 'Good', second: 'Afternoon' },
    { first: 'Buenas', second: 'Tardes' },
    { first: 'Bon', second: 'Après-midi' },
    { first: 'Guten', second: 'Tag' },
    { first: 'Buon', second: 'Pomeriggio' },
    { first: 'こんに', second: 'ちは' },
    { first: '下午', second: '好' },
    { first: '좋은', second: '오후' },
    { first: 'Boa', second: 'Tarde' },
    { first: 'Добрый', second: 'День' },
  ],
  evening: [
    { first: 'Good', second: 'Evening' },
    { first: 'Buenas', second: 'Noches' },
    { first: 'Bon', second: 'Soir' },
    { first: 'Guten', second: 'Abend' },
    { first: 'Buona', second: 'Sera' },
    { first: 'こんば', second: 'んは' },
    { first: '晚上', second: '好' },
    { first: '좋은', second: '저녁' },
    { first: 'Boa', second: 'Noite' },
    { first: 'Добрый', second: 'Вечер' },
  ],
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  return 'evening'
}

interface DashboardGreetingProps {
  firstName?: string | null
  subtitle?: string
  size?: 'default' | 'large'
  meta?: string
}

export function DashboardGreeting({ firstName, subtitle, size = 'default', meta }: DashboardGreetingProps) {
  const headingClass = size === 'large'
    ? 'text-5xl lg:text-6xl font-extralight text-white tracking-tight'
    : 'text-3xl font-extralight text-white tracking-tight'
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [index, setIndex] = useState(0)
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [greeting, setGreeting] = useState(greetings.morning[0])

  useEffect(() => {
    const t = getTimeOfDay()
    setTimeOfDay(t)
    setGreeting(greetings[t][0])
    setMounted(true)
    setTimeout(() => setVisible(true), 100)
  }, [])

  const next = useCallback(() => {
    if (transitioning) return
    setTransitioning(true)
    setVisible(false)
    setTimeout(() => {
      const t = getTimeOfDay()
      const newIndex = index + 1
      setIndex(newIndex)
      setTimeOfDay(t)
      setGreeting(greetings[t][newIndex % greetings[t].length])
      setTimeout(() => {
        setTransitioning(false)
        setVisible(true)
      }, 100)
    }, 400)
  }, [transitioning, index])

  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(next, 15000)
    return () => clearInterval(interval)
  }, [mounted, next])

  if (!mounted) {
    // SSR fallback — static, no flash
    return (
      <div>
        {meta && (
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/25 mb-2 select-none">{meta}</p>
        )}
        <h1 className={headingClass}>
          Good{' '}
          <span className="gradient-text">
            {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}
          </span>
          {firstName ? `, ${firstName}` : ''}
        </h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1.5">{subtitle}</p>}
      </div>
    )
  }

  return (
    <div>
      {meta && (
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/25 mb-2 select-none">{meta}</p>
      )}
      <div
        className="transition-all duration-500 ease-in-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        }}
      >
        <h1 className={headingClass}>
          <span>{greeting.first} </span>
          <span className="gradient-text">{greeting.second}</span>
          {firstName ? `, ${firstName}` : ''}
        </h1>
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1.5">{subtitle}</p>
      )}
    </div>
  )
}
