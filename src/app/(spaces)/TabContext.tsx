'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface TabContextValue {
  activeTab: string
  navigate: (tab: string) => void
}

const TabContext = createContext<TabContextValue>({
  activeTab: 'home',
  navigate: () => {},
})

export function useTabContext() {
  return useContext(TabContext)
}

export function TabProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const username = pathname?.match(/^\/u\/([^/]+)/)?.[1]
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') ?? 'home')

  // Sync when browser back/forward changes the URL
  useEffect(() => {
    setActiveTab(searchParams.get('tab') ?? 'home')
  }, [searchParams])

  const navigate = useCallback(
    (tab: string) => {
      if (!username) return
      setActiveTab(tab)
      const href = tab === 'home' ? `/u/${username}` : `/u/${username}?tab=${tab}`
      router.replace(href, { scroll: false })
    },
    [router, username],
  )

  return <TabContext.Provider value={{ activeTab, navigate }}>{children}</TabContext.Provider>
}
