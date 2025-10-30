import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Insights | ORCACLUB",
  description: "Expert technical insights on software development, AI automation, web design, and digital transformation. Read in-depth articles from our software consultants on industry trends, best practices, and innovative solutions.",
  keywords: [
    "software development insights",
    "technical blog",
    "software company insights",
    "AI automation insights",
    "web design best practices",
    "software development trends",
    "technology insights",
    "software engineering articles",
    "digital transformation insights",
    "software consultant insights",
    "business automation insights",
    "web development insights",
    "software architecture insights",
    "technology strategy",
    "software development best practices",
    "AI workflow insights",
    "software industry analysis",
    "tech innovation insights",
    "software development expertise",
    "enterprise software insights"
  ],
  openGraph: {
    title: "Insights | ORCACLUB",
    description: "Expert technical insights on software development, AI automation, web design, and digital transformation. Read in-depth articles from our software consultants.",
    type: "website",
    url: "https://orcaclub.pro/insights",
    images: [{
      url: "/og-insights.jpg",
      width: 1200,
      height: 630,
      alt: "orcaclub Technical Insights - Software Development Expertise"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Insights | ORCACLUB",
    description: "Expert technical insights on software development, AI automation, web design, and digital transformation."
  },
  alternates: {
    canonical: "https://orcaclub.pro/insights"
  }
}

export default function InsightsLayout({
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