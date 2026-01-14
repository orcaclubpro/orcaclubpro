import type { Metadata } from 'next'
import ScaleContent from './ScaleContent'

export const metadata: Metadata = {
  title: 'Scale Package | Web Development + Integrations $3K-5K | ORCACLUB',
  description: 'Scale your online presence with 2 integrations, analytics, and automation. Perfect for growing businesses. $3K-5K, delivered in 7-10 days.',
  keywords: [
    'web development services',
    'api integration',
    'marketing automation',
    'google analytics setup',
    'stripe integration',
    'hubspot integration',
    'mailchimp integration',
    'zapier automation',
    'technical seo optimization',
    'cms development',
    'business automation',
    'web development package',
    'integration development',
    'growing business website',
  ],
  openGraph: {
    title: 'Scale Package | Web Development + Integrations $3K-5K | ORCACLUB',
    description: 'Scale your online presence with 2 integrations, analytics, and automation. Perfect for growing businesses. $3K-5K, delivered in 7-10 days.',
    url: 'https://orcaclub.pro/packages/scale',
    siteName: 'ORCACLUB',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB Scale Package - Web Development with Integrations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scale Package | Web Development + Integrations $3K-5K',
    description: 'Scale your online presence with 2 integrations, analytics, and automation. Perfect for growing businesses.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/packages/scale',
  },
}

export default function ScalePackagePage() {
  // Service schema for Scale package
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": "https://orcaclub.pro/packages/scale#product",
    "name": "Scale Package - Web Development with Integrations",
    "description": "Professional web development package including 2 third-party integrations, Google Analytics + Tag Manager setup, marketing automation, technical SEO optimization, and performance optimization. Delivered in 7-10 days.",
    "brand": {
      "@type": "Brand",
      "name": "ORCACLUB"
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "3000",
      "highPrice": "5000",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@id": "https://orcaclub.pro/#organization"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "50"
    }
  }

  // FAQ schema for Scale package
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What integrations are included in the Scale package?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Scale package includes 2 third-party integrations of your choice. Popular options include HubSpot, Salesforce, Mailchimp, Klaviyo, Stripe, PayPal, Zapier automation, and calendar booking systems. We'll help you choose the integrations that best fit your business needs."
        }
      },
      {
        "@type": "Question",
        "name": "How is Scale different from the Launch package?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Scale includes everything in Launch (headless CMS, hosting, responsive design, SEO configuration) plus 2 custom integrations, Google Analytics + Tag Manager setup, marketing automation, technical SEO optimization, performance optimization, advanced CMS configuration, and priority support."
        }
      },
      {
        "@type": "Question",
        "name": "What if I need more than 2 integrations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "If you need more than 2 integrations, Shopify e-commerce, or custom API development, we recommend our Enterprise package. Enterprise includes unlimited integrations and more complex system architecture."
        }
      },
      {
        "@type": "Question",
        "name": "How long does the Scale package take to deliver?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Scale package is delivered in 7-10 business days from project kickoff. Development begins within 48 hours of your down payment. We provide daily progress updates throughout the project."
        }
      },
      {
        "@type": "Question",
        "name": "What analytics and tracking is included?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We set up Google Analytics 4 (GA4) with full e-commerce tracking if applicable, Google Tag Manager for flexible tag deployment, conversion tracking for your key actions, and custom event tracking for user interactions."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide ongoing support after launch?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Scale package includes priority support during and after launch. We also offer monthly maintenance packages (Essential, Growth, and Partner Care) for ongoing updates, security patches, and performance monitoring."
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
        "name": "Scale Package",
        "item": "https://orcaclub.pro/packages/scale"
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
      <ScaleContent />
    </>
  )
}
