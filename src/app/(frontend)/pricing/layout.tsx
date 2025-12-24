import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smarter Starter Packages | ORCACLUB est 2025',
  description: 'Affordable web development from $399. Custom websites, SEO & marketing packages for small businesses. Professional results in weeks. Start with $100 down.',
  keywords: [
    'affordable web development',
    'custom website design',
    'budget web development',
    'full stack development',
    'small business website',
    'startup website development',
    'professional web design',
    'fast website development',
    'MVP development',
    'website development pricing',
    'web development packages',
    'custom web solutions',
    'React development',
    'Next.js development',
    'affordable SEO services',
    'digital marketing packages',
    'website automation',
    'web development rates'
  ],
  openGraph: {
    title: 'Affordable Web Development Pricing | ORCACLUB est 2025',
    description: 'Professional web development starting at $399. Custom websites, SEO & marketing for small businesses. Fast delivery, transparent pricing.',
    url: 'https://orcaclub.pro/pricing',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Affordable Web Development Pricing | ORCACLUB est 2025',
    description: 'Custom web development from $399. Professional websites, SEO & marketing packages. Start with $100 down.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
