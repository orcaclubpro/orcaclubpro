import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Portfolio - Software Development Projects & Web Design Examples | orcaclub",
  description: "View our portfolio of successful software development projects, beautiful web designs, AI automation solutions & digital transformations. See real results from our software company's work.",
  keywords: [
    "software development portfolio",
    "web design portfolio",
    "software company projects",
    "AI automation examples",
    "web design examples",
    "software development case studies",
    "custom software projects",
    "digital transformation portfolio",
    "software agency work",
    "business automation projects",
    "web application examples",
    "software consultant portfolio",
    "technology solutions examples",
    "innovative software projects",
    "successful web designs",
    "software development showcase",
    "AI workflow examples",
    "enterprise software portfolio",
    "mobile app development portfolio",
    "ecommerce development examples"
  ],
  openGraph: {
    title: "Portfolio - Software Development Projects & Web Design Examples",
    description: "View our portfolio of successful software development projects, beautiful web designs, AI automation solutions & digital transformations. See real results from our work.",
    type: "website",
    url: "https://orcaclub.pro/portfolio",
    images: [{
      url: "/og-portfolio.jpg",
      width: 1200,
      height: 630,
      alt: "orcaclub Portfolio - Software Development Projects"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio - Software Development Projects & Web Design Examples",
    description: "View our portfolio of successful software development projects, beautiful web designs, AI automation solutions & digital transformations."
  },
  alternates: {
    canonical: "https://orcaclub.pro/portfolio"
  }
}

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pt-32 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}