import type { Metadata } from 'next'
import { JetBrains_Mono, Jost, Newsreader } from 'next/font/google'
import { Spine } from '@/components/sonar/spine'
import { SonarShell } from '@/components/sonar/theme'
import './sonar.css'

// SONAR type system — reading serif, UI sans, data mono. Exposed as CSS vars
// on the `.sonar` container (see sonar.css), so the root layout's Montserrat
// never bleeds into this subtree.
const serif = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-sonar-serif',
  display: 'swap',
})
const sans = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sonar-sans',
  display: 'swap',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sonar-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SONAR — by ORCACLUB',
  description: 'Signal from beneath the noise. A research desk that builds what it writes about.',
}

export default function SonarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SonarShell fontClass={`${serif.variable} ${sans.variable} ${mono.variable}`} spine={<Spine />}>
      {children}
    </SonarShell>
  )
}
