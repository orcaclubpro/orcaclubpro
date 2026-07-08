'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type SonarTheme = 'light' | 'deep'

interface SonarThemeValue {
  theme: SonarTheme
  toggle: () => void
}

const SonarThemeContext = createContext<SonarThemeValue | null>(null)

export function useSonarTheme(): SonarThemeValue {
  const ctx = useContext(SonarThemeContext)
  if (!ctx) throw new Error('useSonarTheme must be used within SonarShell')
  return ctx
}

/**
 * SONAR shell — owns the theme state and paints the scoped `.sonar` container.
 * `data-theme` lives on this container (not <html>) so the shared root layout's
 * black body + Montserrat never bleed in. Light is the default; the ModeToggle
 * in the Spine flips it to "deep".
 */
export function SonarShell({
  fontClass,
  spine,
  children,
}: {
  fontClass: string
  spine: ReactNode
  children: ReactNode
}) {
  const [theme, setTheme] = useState<SonarTheme>('light')
  const toggle = () => setTheme((t) => (t === 'deep' ? 'light' : 'deep'))

  return (
    <SonarThemeContext.Provider value={{ theme, toggle }}>
      <div className={`sonar ${fontClass}`} data-theme={theme}>
        <div className="shell">
          {spine}
          {children}
        </div>
      </div>
    </SonarThemeContext.Provider>
  )
}
