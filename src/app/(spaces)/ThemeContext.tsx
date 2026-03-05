'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { THEMES, DEFAULT_THEME, type ThemeId } from './themes'

interface ThemeContextValue {
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME,
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: ThemeId
  username?: string  // for saving to DB
}

export function ThemeProvider({ children, initialTheme = DEFAULT_THEME, username }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>(initialTheme)

  // Apply CSS variables to document root when theme changes
  useEffect(() => {
    const theme = THEMES[themeId]
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    // Store in localStorage as fallback
    try { localStorage.setItem('orca-space-theme', themeId) } catch {}
  }, [themeId])

  const setTheme = useCallback(async (id: ThemeId) => {
    setThemeId(id)
    // Persist to DB via API route if username available
    if (username) {
      try {
        await fetch('/api/users/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: id }),
        })
      } catch {
        // Non-critical — localStorage is the fallback
      }
    }
  }, [username])

  return (
    <ThemeContext.Provider value={{ themeId, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
