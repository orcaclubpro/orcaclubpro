import type { Metadata } from 'next'
import WebDevelopmentContent from './WebDevelopmentContent'

export const metadata: Metadata = {
  title: 'Custom Web Development Services | Fast Website Development in 2-4 Weeks | OrcaClub',
  description: 'Expert custom web development services with 2-4 week delivery. React, Next.js, TypeScript websites with custom business tools, CRM integrations, and analytics dashboards. Launch-ready websites built by experienced developers.',
  keywords: [
    'custom web development',
    'fast website development',
    'React development',
    'Next.js websites',
    'custom business tools',
    'CRM integration',
    'web development services',
    'responsive web design',
    'TypeScript development',
    'custom dashboards',
    'e-commerce development',
    'SEO-optimized websites',
    '2-4 week delivery',
    'modern web frameworks',
    'web development company'
  ],
  openGraph: {
    title: 'Custom Web Development in 2-4 Weeks | React & Next.js Experts',
    description: 'Launch-ready custom websites in 2-4 weeks. Modern tech stack with React, Next.js & TypeScript. Custom business tools, integrations, and SEO optimization included.',
    url: 'https://orcaclub.pro/services/web-development',
    siteName: 'OrcaClub',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OrcaClub Custom Web Development Services - Fast, Modern Websites',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Web Development in 2-4 Weeks | OrcaClub',
    description: 'Launch-ready websites with React, Next.js, and modern technology. Custom tools, integrations, and fast delivery.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/web-development',
  },
}

export default function WebDevelopmentPage() {
  // Service schema for web development
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/web-development#service",
    "serviceType": "Custom Web Development",
    "name": "Custom Website Development Services",
    "description": "Professional custom web development services delivering launch-ready websites in 2-4 weeks. Specializing in React, Next.js, TypeScript, custom business tools, CRM integrations, and modern web applications.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Web Development Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom Business Tools Development",
            "description": "Internal dashboards, calculators, booking systems, and workflow automation tools"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Analytics Dashboards",
            "description": "Real-time data visualization and custom reporting solutions"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "E-commerce Development",
            "description": "Full-featured online stores with inventory management and payment processing"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "CRM Integration",
            "description": "Seamless integration with CRM systems, analytics tools, and third-party platforms"
          }
        }
      ]
    }
  }

  // FAQ schema for web development
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does a custom website cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Projects typically range from $5,000 to $25,000 depending on complexity. Simple marketing sites start around $5K, while custom business tools with integrations can go higher. We provide a detailed quote after understanding your needs in a free consultation."
        }
      },
      {
        "@type": "Question",
        "name": "What information do you need to get started?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We'll need to understand your business goals, target audience, desired features, and any existing systems we need to integrate with. During our discovery call, we'll walk through everything and provide a clear project scope and timeline."
        }
      },
      {
        "@type": "Question",
        "name": "Can you work with our existing brand guidelines?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. We can match your existing brand colors, fonts, and style guide perfectly. If you don't have brand guidelines yet, we can help create a cohesive design system for your website."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide hosting and maintenance?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We can handle hosting setup and provide ongoing maintenance packages. Alternatively, we can deploy to your preferred hosting provider. All our sites are built with modern deployment practices for easy updates."
        }
      },
      {
        "@type": "Question",
        "name": "What makes you different from other web development agencies?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Three things: speed (2-4 weeks vs 3-6 months), modern technology (React/Next.js for better performance and SEO), and transparency (daily updates and clear communication). We're developers who actually ship, not project managers who delegate."
        }
      },
      {
        "@type": "Question",
        "name": "Can you help with SEO and digital marketing after launch?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We offer SEO services and digital marketing campaign management. Every website we build is SEO-optimized from day one, and we can help you drive traffic and conversions after launch."
        }
      }
    ]
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://orcaclub.pro"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Services",
        "item": "https://orcaclub.pro/services"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Web Development",
        "item": "https://orcaclub.pro/services/web-development"
      }
    ]
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Page Content */}
      <WebDevelopmentContent />
    </>
  )
}
