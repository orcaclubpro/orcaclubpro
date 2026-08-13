import type { Metadata } from 'next'

// The page is a Client Component and cannot export metadata itself.
export const metadata: Metadata = {
  title: 'Reset Password - ORCACLUB',
  robots: { index: false, follow: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
