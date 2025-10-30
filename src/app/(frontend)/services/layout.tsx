import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Services | ORCACLUB",
  description: "Expert web design, workflow automation, SEO visibility engineering, and AI solutions. Transform your business with tailored digital solutions that increase efficiency and drive growth.",
  keywords: "web design services, workflow automation, SEO services, AI solutions, digital transformation, business automation, custom web development, search engine optimization, AI workflow automation, visibility engineering",
  openGraph: {
    title: "Services | ORCACLUB",
    description: "Expert web design, workflow automation, SEO visibility engineering, and AI solutions. Transform your business with tailored digital solutions.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Services | ORCACLUB",
    description: "Expert web design, workflow automation, SEO visibility engineering, and AI solutions. Transform your business with tailored digital solutions.",
  },
  alternates: {
    canonical: "/services",
  },
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}