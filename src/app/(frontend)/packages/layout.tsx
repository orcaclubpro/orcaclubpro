import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Web Development Packages | Pricing & Service Tiers | ORCACLUB',
  description: 'Transparent web development pricing. Choose from Launch ($1-3K), Scale ($3-5K), or Enterprise ($6-30K) packages. Get exactly what your business needs.',
  keywords: [
    'web design cost',
    'website cost',
    'website pricing',
    'web development services',
    'web development pricing',
    'website development cost',
    'web design packages',
    'website packages',
    'web development packages',
    'fixed price web development',
    'website design pricing',
    'custom website cost',
    'business website cost',
    'ecommerce website cost',
    'web agency pricing'
  ],
  openGraph: {
    title: 'Web Development Packages | Pricing & Service Tiers | ORCACLUB',
    description: 'Transparent web development pricing. Launch ($1-3K), Scale ($3-5K), or Enterprise ($6-30K). Fixed prices, guaranteed timelines.',
    url: 'https://orcaclub.pro/packages',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Development Packages | ORCACLUB',
    description: 'Transparent pricing: Launch ($1-3K), Scale ($3-5K), Enterprise ($6-30K). No hidden fees, guaranteed delivery.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/packages',
  },
}

export default function PackagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
