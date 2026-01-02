import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Project Tiers - Launch, Scale & Enterprise | ORCACLUB',
  description: 'Choose your development package: Launch ($1K-3K, 3-5 days), Scale ($3K-5K, 7-10 days), or Enterprise ($6K-30K, 14-21 days). Fixed pricing, fast delivery, transparent timelines.',
  keywords: [
    'development packages',
    'fixed price web development',
    'project tiers',
    'launch tier',
    'scale tier',
    'enterprise tier',
    'web development pricing',
    'fast delivery development',
    'shopify integration pricing',
    'headless cms pricing',
    'business automation pricing'
  ],
  openGraph: {
    title: 'Project Tiers - Launch, Scale & Enterprise | ORCACLUB',
    description: 'Fixed-price development packages. Choose Launch, Scale, or Enterprise. 3-21 day delivery with transparent pricing.',
    url: 'https://orcaclub.pro/project',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Tiers - Launch, Scale & Enterprise | ORCACLUB',
    description: 'Fixed-price development packages with 3-21 day delivery.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/project',
  },
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
