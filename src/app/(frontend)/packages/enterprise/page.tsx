import type { Metadata } from 'next'
import EnterpriseContent from './EnterpriseContent'

export const metadata: Metadata = {
  title: 'Enterprise Web Development | Custom Solutions $6K-30K | ORCACLUB',
  description: 'Full-service enterprise development: Shopify stores, custom APIs, admin dashboards, unlimited integrations. Custom quote for complex projects.',
  keywords: [
    'shopify expert',
    'custom app development',
    'enterprise web development',
    'shopify headless commerce',
    'custom api development',
    'admin dashboard development',
    'business automation',
    'enterprise software solutions',
    'custom integrations',
    'b2b portal development',
    'saas development',
    'multi-site management',
    'inventory management system',
    'booking platform development',
    'shopify plus development'
  ],
  openGraph: {
    title: 'Enterprise Web Development | Custom Solutions $6K-30K | ORCACLUB',
    description: 'Full-service enterprise development with Shopify stores, custom APIs, admin dashboards, and unlimited integrations. Custom quote for complex projects.',
    url: 'https://orcaclub.pro/packages/enterprise',
    siteName: 'ORCACLUB',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB Enterprise Web Development - Custom Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise Web Development | $6K-30K | ORCACLUB',
    description: 'Full-service enterprise development: Shopify stores, custom APIs, admin dashboards. Custom quote for complex projects.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/packages/enterprise',
  },
}

export default function EnterprisePage() {
  // Service schema for enterprise tier
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/packages/enterprise#service",
    "serviceType": "Enterprise Web Development",
    "name": "Enterprise Web Development Services",
    "description": "Full-service enterprise development including Shopify stores, custom API development, admin dashboards, database architecture, and unlimited integrations. 14-21 day delivery for complex projects ranging from $6K to $30K.",
    "provider": {
      "@type": "Organization",
      "@id": "https://orcaclub.pro/#organization",
      "name": "ORCACLUB",
      "url": "https://orcaclub.pro"
    },
    "areaServed": "Global",
    "priceRange": "$6,000 - $30,000",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Enterprise Development Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Shopify Store Development",
            "description": "Full Shopify and headless commerce implementation with custom themes and integrations"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom API Development",
            "description": "Bespoke API solutions connecting your systems and third-party services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Admin Dashboard Development",
            "description": "Custom admin portals and client dashboards for business operations"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Database Architecture",
            "description": "Scalable database design and implementation for enterprise applications"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom Automation Workflows",
            "description": "End-to-end business process automation and system integration"
          }
        }
      ]
    }
  }

  // FAQ schema for enterprise tier
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What's included in the Enterprise tier?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Enterprise tier includes everything in our Scale package plus unlimited integrations, Shopify store development, custom API development, admin dashboards/portals, database architecture, custom automation workflows, a dedicated project manager, and extended support period. Pricing ranges from $6K-$30K depending on project scope."
        }
      },
      {
        "@type": "Question",
        "name": "How long does an Enterprise project take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Enterprise projects typically take 14-21 days from kickoff to launch. Complex projects with multiple systems or extensive custom development may require additional time, which we'll discuss during your free consultation."
        }
      },
      {
        "@type": "Question",
        "name": "Can you build a custom Shopify store?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. We specialize in both traditional Shopify stores and headless Shopify implementations using Next.js. This includes custom themes, product configurators, subscription systems, and integrations with your existing business tools."
        }
      },
      {
        "@type": "Question",
        "name": "Do you build client portals and admin dashboards?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, custom admin dashboards and client portals are a core part of our Enterprise offering. We build secure, role-based systems that give your team and clients exactly the access and functionality they need."
        }
      },
      {
        "@type": "Question",
        "name": "What kind of custom automation can you build?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We build automation workflows that connect your systems, from order processing and inventory sync to customer onboarding flows and reporting automation. If you can describe the process, we can automate it."
        }
      },
      {
        "@type": "Question",
        "name": "How do I get a custom quote?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Start with a free 30-minute consultation where we'll discuss your project requirements, integrations needed, and timeline. We'll then provide a detailed proposal with transparent pricing and project milestones."
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
        "name": "Project Tiers",
        "item": "https://orcaclub.pro/project"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Enterprise",
        "item": "https://orcaclub.pro/packages/enterprise"
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
      <EnterpriseContent />
    </>
  )
}
