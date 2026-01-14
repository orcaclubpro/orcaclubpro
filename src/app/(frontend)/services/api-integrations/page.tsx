import type { Metadata } from 'next'
import ApiIntegrationsContent from './ApiIntegrationsContent'

export const metadata: Metadata = {
  title: 'API Integration Services | CRM Integration, Custom API Development | ORCACLUB',
  description: 'Connect your systems with custom API development and integration services. Salesforce, HubSpot, Shopify, and custom integrations that actually work.',
  keywords: [
    'api integration',
    'system integration',
    'api development',
    'crm integration',
    'salesforce integration',
    'database integration',
    'shopify integration',
    'hubspot integration',
    'zapier integration',
    'mailchimp integration',
    'custom api development',
    'rest api development',
    'webhook integration',
    'data synchronization',
    'platform integration',
    'third party integration',
    'api consulting',
    'integration architecture'
  ],
  openGraph: {
    title: 'API Integration Services | Connect Your Systems | ORCACLUB',
    description: 'Custom API development and system integration services. Salesforce, HubSpot, Shopify integrations that eliminate data silos and automate workflows.',
    url: 'https://orcaclub.pro/services/api-integrations',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Integration Services | ORCACLUB',
    description: 'Connect your systems with custom API development. CRM, ecommerce, and marketing platform integrations built to scale.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/api-integrations',
  },
}

export default function ApiIntegrationsPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/api-integrations#service",
    "serviceType": "API Integration Services",
    "name": "API Integration & Custom API Development",
    "description": "Professional API integration services connecting CRMs, ecommerce platforms, marketing tools, and custom systems. Bidirectional sync, webhook handlers, and robust error handling.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "API Integration Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "CRM Integration",
            "description": "Salesforce, HubSpot, Pipedrive, and Zoho CRM integrations with bidirectional sync"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Ecommerce Integration",
            "description": "Shopify, Stripe, and custom ecommerce platform integrations"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom API Development",
            "description": "REST API design, webhook handlers, and data transformation layers"
          }
        }
      ]
    }
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How long does an API integration take to build?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simple integrations between 2 platforms typically take 1-2 weeks. Complex multi-platform integrations with custom business logic can take 2-4 weeks. We provide detailed timelines after reviewing your specific requirements."
        }
      },
      {
        "@type": "Question",
        "name": "What happens if the third-party API changes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We build integrations with version detection and graceful degradation. Our monitoring systems alert us to API changes before they cause issues. With our maintenance plans, we handle updates proactively."
        }
      },
      {
        "@type": "Question",
        "name": "How do you handle data security in integrations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All data transfers use TLS 1.3 encryption. We implement OAuth 2.0 for authentication, never store credentials in code, and follow least-privilege access principles. Our integrations are GDPR compliant."
        }
      },
      {
        "@type": "Question",
        "name": "Can you integrate systems that don't have a public API?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We can build integrations using webhooks, database connections, file-based transfers, or custom middleware. If data exists in a system, we can usually find a way to connect it."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide ongoing maintenance for integrations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Our monthly maintenance plans include monitoring, error handling, API updates, and support. This ensures your integrations continue working reliably as platforms evolve."
        }
      }
    ]
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://orcaclub.pro" },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://orcaclub.pro/services" },
      { "@type": "ListItem", "position": 3, "name": "API Integrations", "item": "https://orcaclub.pro/services/api-integrations" }
    ]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ApiIntegrationsContent />
    </>
  )
}
