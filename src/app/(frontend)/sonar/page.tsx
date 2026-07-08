import type { Metadata } from 'next'
import { JetBrains_Mono, Jost, Newsreader } from 'next/font/google'
import { SonarLanding } from '@/components/sonar/landing'
import './landing.css'

const serif = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-sonar-serif',
  display: 'swap',
})
const sans = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sonar-sans',
  display: 'swap',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-sonar-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SONAR — by ORCACLUB',
  description:
    'Signal from beneath the noise. A research desk that pushes the frontier out across audiences — and builds what it writes about.',
  alternates: { canonical: 'https://orcaclub.pro/sonar' },
}

export default function SonarLandingPage() {
  return <SonarLanding fontClass={`${serif.variable} ${sans.variable} ${mono.variable}`} />
}
