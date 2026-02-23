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

export function PackageCountProvider({ children }: { children: React.ReactNode }) {
  const [packageCount, setPackageCount] = useState(0)
  return (
    <PackageCountContext.Provider value={{ packageCount, setPackageCount }}>
      {children}
    </PackageCountContext.Provider>
  )
}
