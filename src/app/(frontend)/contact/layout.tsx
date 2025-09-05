import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Contact Us - Get a Quote for Software Development & Web Design | orcaclub",
  description: "Contact our software development company for custom web design, AI automation, and digital transformation projects. Get a free consultation and quote for your business needs.",
  keywords: [
    "contact software company",
    "get quote web design",
    "software development consultation",
    "contact software consultant",
    "web design quote",
    "software development inquiry",
    "business automation consultation", 
    "AI solutions contact",
    "custom software quote",
    "digital transformation consultation",
    "contact software agency",
    "software development services quote",
    "web application development contact",
    "hire software developers",
    "software company contact",
    "technology consulting contact",
    "software project inquiry",
    "web design consultation",
    "contact software engineers",
    "business software solutions inquiry"
  ],
  openGraph: {
    title: "Contact Us - Get a Quote for Software Development & Web Design",
    description: "Contact our software development company for custom web design, AI automation, and digital transformation projects. Get a free consultation and quote.",
    type: "website",
    url: "https://orcaclub.pro/contact",
    images: [{
      url: "/og-contact.jpg", 
      width: 1200,
      height: 630,
      alt: "Contact orcaclub - Software Development Company"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - Get a Quote for Software Development & Web Design", 
    description: "Contact our software development company for custom web design, AI automation, and digital transformation projects."
  },
  alternates: {
    canonical: "https://orcaclub.pro/contact"
  }
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pt-32 pb-20 px-8">
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  )
} 