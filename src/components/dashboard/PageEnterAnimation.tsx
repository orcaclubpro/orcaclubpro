'use client'

import { useEffect, useRef } from 'react'

export function PageEnterAnimation({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.animation = 'pageSlideUp 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
  }, [])

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}
