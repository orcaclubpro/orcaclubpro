import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SEO Services & Content Optimization | OrcaClub - Double Your Search Traffic",
  description: "Professional SEO services that double your organic search traffic. Strategic content optimization, technical SEO, and visibility engineering that delivers lasting results. Get a free SEO audit today.",
  keywords: [
    "SEO services",
    "search engine optimization",
    "content optimization",
    "increase organic traffic",
    "technical SEO",
    "local SEO",
    "visibility engineering",
    "keyword research",
    "content strategy",
    "SEO audit",
    "search visibility",
    "ranking optimization",
    "SEO consulting",
    "organic search growth",
    "SEO company",
    "professional SEO",
    "on-page SEO",
    "off-page SEO",
    "link building",
    "Google ranking",
    "search traffic growth",
    "SEO strategy",
    "search engine marketing",
    "SERP optimization"
  ],
  openGraph: {
    title: "SEO Services & Content Optimization | OrcaClub",
    description: "Double your search traffic with professional SEO services. Strategic content optimization, technical SEO, and proven strategies that deliver results.",
    type: "website",
    url: "https://orcaclub.pro/services/seo-services",
    images: [
      {
        url: "/og-seo-services.jpg",
        width: 1200,
        height: 630,
        alt: "OrcaClub SEO Services - Double Your Search Traffic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEO Services & Content Optimization | OrcaClub",
    description: "Double your search traffic with professional SEO services. Free SEO audit available.",
    images: ["/og-seo-services.jpg"],
  },
  alternates: {
    canonical: "https://orcaclub.pro/services/seo-services",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function SEOServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
