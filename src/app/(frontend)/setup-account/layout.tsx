import type { Metadata } from 'next'

// The page is a Client Component and cannot export metadata itself.
export const metadata: Metadata = {
  title: 'Account Setup - ORCACLUB',
  robots: { index: false, follow: false },
}

export default function SetupAccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
