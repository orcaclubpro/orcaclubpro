import type { Metadata } from 'next'
import CmsContent from './CmsContent'

export const metadata: Metadata = {
  title: 'Headless CMS Development | Payload CMS, Sanity, Contentful Experts | ORCACLUB',
  description: 'Modern CMS development with Payload CMS, headless architecture, and custom content management. Edit your content easily, publish instantly. Expert CMS platform development.',
  keywords: [
    'content management system',
    'wordpress cms',
    'headless cms',
    'payload cms',
    'cms platform',
    'sanity cms',
    'strapi cms',
    'contentful cms',
    'cms development',
    'custom cms',
    'headless architecture',
    'api-first cms',
    'content management',
    'cms integration',
    'typescript cms',
    'open source cms',
    'self-hosted cms',
    'cms migration'
  ],
  openGraph: {
    title: 'Headless CMS Development | Modern Content Management Solutions',
    description: 'Transform your content workflow with headless CMS architecture. Payload CMS experts delivering custom content management systems with visual editing, versioning, and unlimited design flexibility.',
    url: 'https://orcaclub.pro/services/cms-development',
    siteName: 'ORCACLUB',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB Headless CMS Development - Modern Content Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Headless CMS Development | Payload CMS Experts | ORCACLUB',
    description: 'Modern CMS development with headless architecture. Edit content easily, publish instantly, design freely.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/cms-development',
  },
}

export default function CmsDevelopmentPage() {
  // Service schema for CMS development
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/cms-development#service",
    "serviceType": "Headless CMS Development",
    "name": "Content Management System Development Services",
    "description": "Professional headless CMS development services specializing in Payload CMS, Sanity, and custom content management solutions. Modern architecture with visual editing, versioning, and API-first design.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "CMS Development Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Payload CMS Development",
            "description": "Open source, TypeScript-native CMS with self-hosting and full data ownership"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Headless CMS Architecture",
            "description": "API-first content management with decoupled frontend and backend"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "CMS Migration Services",
            "description": "Seamless migration from WordPress and legacy CMS platforms to modern headless solutions"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom Content Modeling",
            "description": "Tailored content types, custom fields, and structured data for your business needs"
          }
        }
      ]
    }
  }

  // FAQ schema for CMS development
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is a headless CMS and how is it different from WordPress?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A headless CMS separates content management from how content is displayed. Unlike WordPress which bundles both together, a headless CMS stores your content and delivers it via API to any frontend - websites, mobile apps, kiosks, or IoT devices. This means faster sites, better security, and unlimited design flexibility."
        }
      },
      {
        "@type": "Question",
        "name": "Can you migrate our existing WordPress site to a headless CMS?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in WordPress migrations. We'll audit your existing content, map it to a new content model, migrate all data including media, and train your team on the new system. Most migrations take 1-2 weeks depending on content volume."
        }
      },
      {
        "@type": "Question",
        "name": "Why do you recommend Payload CMS over other options?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Payload CMS is our preferred choice because it's open source (no vendor lock-in), TypeScript-native (fewer bugs, better DX), self-hosted (you own your data), and highly customizable. It provides the flexibility of custom code with the convenience of a visual admin panel."
        }
      },
      {
        "@type": "Question",
        "name": "Will my team be able to edit content without developer help?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. We build intuitive admin interfaces with visual editing, draft previews, and role-based permissions. Your marketing team can update content, create new pages, and publish changes without touching code. We also provide training and documentation."
        }
      },
      {
        "@type": "Question",
        "name": "How long does a CMS development project take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simple CMS setups can be done in 3-5 days with our Launch tier. More complex projects with custom content models, integrations, and migrations typically take 1-3 weeks. Enterprise projects with advanced workflows may take 2-4 weeks."
        }
      },
      {
        "@type": "Question",
        "name": "Is Payload CMS secure and scalable?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Payload CMS is self-hosted, meaning your data stays on your infrastructure. It includes built-in authentication, field-level access control, and supports enterprise-grade databases like MongoDB. It scales horizontally and handles millions of content items efficiently."
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
        "name": "CMS Development",
        "item": "https://orcaclub.pro/services/cms-development"
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
      <CmsContent />
    </>
  )
}
