import type { Metadata } from 'next'
import { sonarMono as mono, sonarSans as sans, sonarSerif as serif } from '@/fonts'
import { Spine } from '@/components/sonar/spine'
import { SonarShell } from '@/components/sonar/theme'
import './sonar.css'

// SONAR type system — reading serif, UI sans, data mono. Exposed as CSS vars
// on the `.sonar` container (see sonar.css), so the root layout's Montserrat
// never bleeds into this subtree.
// Fonts are self-hosted in src/fonts (Newsreader, Jost, JetBrains Mono).

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
