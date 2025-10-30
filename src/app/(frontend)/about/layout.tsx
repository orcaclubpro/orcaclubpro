import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "About Us | ORCACLUB",
  description: "Learn about orcaclub, a premier software development company specializing in custom web design, AI automation, and digital transformation. Meet our expert team of software consultants and developers.",
  keywords: [
    "about software company",
    "software development company",
    "web design agency",
    "software agency team",
    "custom software development company",
    "AI automation company",
    "software consultants",
    "digital transformation agency",
    "software engineering company",
    "technology consulting firm",
    "enterprise software company",
    "web development agency",
    "software development team",
    "innovation software company",
    "business automation experts",
    "software solutions company",
    "professional software developers",
    "award winning software company",
    "expert web designers",
    "software company history"
  ],
  openGraph: {
    title: "About Us | ORCACLUB",
    description: "Learn about orcaclub, a premier software development company specializing in custom web design, AI automation, and digital transformation. Meet our expert team.",
    type: "website",
    url: "https://orcaclub.pro/about",
    images: [{
      url: "/og-about.jpg",
      width: 1200,
      height: 630,
      alt: "About orcaclub - Software Development Company Team"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | ORCACLUB",
    description: "Learn about orcaclub, a premier software development company specializing in custom web design, AI automation, and digital transformation."
  },
  alternates: {
    canonical: "https://orcaclub.pro/about"
  }
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pt-32 pb-20 px-8">
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  )
}