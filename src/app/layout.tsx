import type React from "react"
import type { Metadata } from "next"
import { Montserrat, JetBrains_Mono } from "next/font/google"
import Script from "next/script"
import { Toaster } from "sonner"
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
  title: "ORCACLUB - Tailored Software Solutions",
  description:
    "Leading software company crafting tailored solutions for modern businesses. Expert web design, AI agents, workflow automation, and custom software development. Top-rated software consultants delivering beautiful designs and intelligent automation for SMBs and enterprises.",
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
  authors: [{ name: "orcaclub", url: "https://orcaclub.co" }],
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
    title: "ORCACLUB - Leading Software Company | Web Design & AI Agents",
    description: "Expert software company specializing in beautiful web design, AI agents, and custom software solutions. Transform your business with our tailored automation and intelligent workflows.",
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
    title: "ORCACLUB - Leading Software Company | Web Design & AI Agents",
    description: "Expert software company specializing in beautiful web design, AI agents, and custom software solutions. Transform your business with tailored automation.",
    creator: "@orcaclub",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://orcaclub.pro",
  },
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://orcaclub.pro/#organization",
        "name": "orcaclub",
        "url": "https://orcaclub.pro",
        "logo": {
          "@type": "ImageObject",
          "url": "https://orcaclub.pro/logo.png",
          "width": 200,
          "height": 60
        },
        "description": "Leading software development company crafting tailored solutions for modern businesses. Expert web design, AI agents, workflow automation, and custom software development.",
        "foundingDate": "2024",
        "industry": "Software Development",
        "areaServed": "Global",
        "knowsAbout": [
          "Software Development",
          "Web Design",
          "AI Agents",
          "Workflow Automation",
          "Custom Software Solutions",
          "Digital Transformation",
          "SEO Services",
          "Enterprise Software",
          "Mobile App Development",
          "Cloud Solutions",
          "AI Machine Learning",
          "Business Process Automation",
          "E-commerce Development",
          "UI/UX Design",
          "Database Design",
          "API Development",
          "Software Consulting",
          "Technology Strategy",
          "Technical Insights",
          "Software Development Best Practices",
          "AI Automation Insights",
          "Web Design Psychology",
          "Performance Optimization",
          "Software Architecture"
        ],
        "sameAs": [
          "https://linkedin.com/company/orcaclub",
          "https://twitter.com/orcaclub",
          "https://github.com/orcaclub"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Service",
          "availableLanguage": "English"
        },
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "US"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://orcaclub.pro/#website",
        "url": "https://orcaclub.pro",
        "name": "orcaclub - Leading Software Development Company",
        "description": "Premier software development company specializing in custom web design, AI agents, and intelligent automation solutions.",
        "publisher": {
          "@id": "https://orcaclub.pro/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://orcaclub.pro/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://orcaclub.pro/services#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What makes orcaclub different from other software companies?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "As a leading software company, we combine cutting-edge technology with beautiful design principles. Our expertise in AI agents, web design, and workflow automation sets us apart. We don't just build software – we craft tailored solutions that transform how businesses operate. Our mathematical approach to design and psychological precision ensures every solution delivers measurable results and competitive advantages."
            }
          },
          {
            "@type": "Question",
            "name": "What software development services does orcaclub provide?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We offer comprehensive software development services including custom web design, AI workflow automation, enterprise software solutions, mobile app development, e-commerce platforms, SEO services, and digital transformation consulting. Our software consultants specialize in creating intelligent solutions that grow with your business."
            }
          },
          {
            "@type": "Question",
            "name": "How does orcaclub approach AI and automation projects?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our AI agents and automation solutions are built using advanced machine learning and natural language processing. We create custom AI models that understand your specific domain, learn from your data, and provide actionable insights. Our workflow automation reduces manual tasks by up to 80% while improving accuracy and efficiency."
            }
          },
          {
            "@type": "Question",
            "name": "What is the typical timeline for software development projects?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Project timelines vary based on complexity and scope. Simple web design projects typically take 2-4 weeks, while comprehensive software development and AI automation solutions require 6-12 weeks. We provide detailed timelines during our initial consultation and maintain transparent communication throughout the development process."
            }
          },
          {
            "@type": "Question",
            "name": "Does orcaclub work with small businesses and startups?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we work with businesses of all sizes, from startups to Fortune 500 companies. Our software development services are scalable and can be tailored to fit any budget. Whether you need a simple website, complex enterprise software, or AI automation solutions, we have packages designed for every stage of business growth."
            }
          },
          {
            "@type": "Question",
            "name": "What technologies does orcaclub specialize in?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We specialize in modern web technologies including React, Next.js, Node.js, Python, AI/ML frameworks, cloud platforms (AWS, Azure, GCP), mobile development (React Native, Flutter), and database technologies. Our software engineers stay current with the latest technologies to deliver cutting-edge solutions."
            }
          }
        ]
      },
      {
        "@type": "Service",
        "@id": "https://orcaclub.pro/services#software-development",
        "name": "Software Development Services",
        "description": "Custom software development, web design, AI automation, and digital transformation solutions for businesses of all sizes.",
        "provider": {
          "@id": "https://orcaclub.pro/#organization"
        },
        "areaServed": "Global",
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Software Development Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Custom Web Design",
                "description": "Beautiful, responsive web design with mathematical precision and psychological intelligence"
              }
            },
            {
              "@type": "Offer", 
              "itemOffered": {
                "@type": "Service",
                "name": "AI Workflow Automation",
                "description": "Intelligent automation solutions that learn and adapt to your business processes"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service", 
                "name": "SEO Services",
                "description": "Technical SEO optimization and strategic visibility engineering"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Enterprise Software Development",
                "description": "Scalable, secure enterprise software solutions and digital transformation"
              }
            }
          ]
        }
      }
    ]
  }

  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-black text-white overflow-x-hidden">
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SL0EWEX39P"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SL0EWEX39P');
          `}
        </Script>
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
