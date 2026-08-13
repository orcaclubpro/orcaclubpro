import type React from "react"
import type { Metadata } from "next"
import { Montserrat, JetBrains_Mono } from "next/font/google"
import Script from "next/script"
import { Toaster } from "sonner"
import { JsonLd } from "@/lib/seo/json-ld"
import { organizationSchema, webSiteSchema } from "@/lib/seo/schema"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://orcaclub.pro'),
  title: "ORCACLUB | Built to Surface",
  description:
    "Development, Marketing, and Design. Schedule a free call.",
  keywords: [
    "orcaclub",
    "software company",
    "software",
    "web design",
    "AI agents",
    "software club",
    "beautiful designs",
    "web developer",
    "software consultant",
    "custom software development",
    "workflow automation",
    "software agency",
    "tailored software solutions",
    "modern web design",
    "artificial intelligence",
    "AI workflows",
    "business automation",
    "digital transformation",
    "software engineering",
    "responsive web design",
    "user experience design",
    "software architecture",
    "automation consulting",
    "enterprise software",
    "startup software solutions"
  ],
  authors: [{ name: "orcaclub", url: "https://orcaclub.pro" }],
  creator: "orcaclub",
  publisher: "orcaclub",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://orcaclub.pro",
    siteName: "ORCACLUB",
    title: "ORCACLUB | Built to Surface",
    description: "Development, Marketing, and Design. Schedule a free call.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "orcaclub - Software Company for Web Design and AI Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ORCACLUB | Built to Surface",
    description: "Development, Marketing, and Design. Schedule a free call.",
    creator: "@orcaclub",
    images: ["/og-image.jpg"],
  },
  // No alternates.canonical here — Next.js merges metadata down the tree, so a
  // root canonical would stamp every page without its own as a duplicate of the
  // homepage. Each page/layout sets its own canonical.
  other: {
    "application-name": "orcaclub",
    "apple-mobile-web-app-title": "orcaclub",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Sitewide identity only — Organization + WebSite. Page-scoped nodes
            (Service, FAQPage, Article, Breadcrumb) are emitted by the pages
            that render that content, via src/lib/seo/schema.ts. */}
        <JsonLd data={[organizationSchema(), webSiteSchema()]} />
        {/* Google Tag Manager */}
        <Script id="gtm-head" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K6GPMWXL');`}
        </Script>
      </head>
      <body className="font-sans antialiased bg-black text-white overflow-x-clip" suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K6GPMWXL"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          duration={4000}
          className="pointer-events-auto"
        />
      </body>
    </html>
  )
}
