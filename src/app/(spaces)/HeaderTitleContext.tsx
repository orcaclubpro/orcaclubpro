'use client'

import { createContext, useContext, useState } from 'react'

interface HeaderTitleContextValue {
  title: string | null
  subtitle: string | null
  setTitle: (title: string | null) => void
  setSubtitle: (subtitle: string | null) => void
}

const HeaderTitleContext = createContext<HeaderTitleContextValue>({
  title: null,
  subtitle: null,
  setTitle: () => {},
  setSubtitle: () => {},
})

export function useHeaderTitle() {
  return useContext(HeaderTitleContext)
}

export function HeaderTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)
  const [subtitle, setSubtitle] = useState<string | null>(null)
  return (
    <HeaderTitleContext.Provider value={{ title, subtitle, setTitle, setSubtitle }}>
      {children}
    </HeaderTitleContext.Provider>
  )
}
