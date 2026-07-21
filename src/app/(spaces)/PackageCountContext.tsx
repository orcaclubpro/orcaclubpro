'use client'

import { createContext, useContext, useState } from 'react'

interface PackageCountContextValue {
  packageCount: number
  setPackageCount: (n: number) => void
}

const PackageCountContext = createContext<PackageCountContextValue>({
  packageCount: 0,
  setPackageCount: () => {},
})

export function usePackageCount() {
  return useContext(PackageCountContext)
}

// initialCount is fetched server-side in the spaces layout (client experience
// only) so the mobile-nav badge is correct on first paint.
export function PackageCountProvider({
  children,
  initialCount = 0,
}: {
  children: React.ReactNode
  initialCount?: number
}) {
  const [packageCount, setPackageCount] = useState(initialCount)
  return (
    <PackageCountContext.Provider value={{ packageCount, setPackageCount }}>
      {children}
    </PackageCountContext.Provider>
  )
}
