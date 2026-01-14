import type { Metadata } from 'next'
import ShopifyContent from './ShopifyContent'

export const metadata: Metadata = {
  title: 'Shopify Development Services | Shopify Expert & Developer | OrcaClub',
  description: 'Expert Shopify development services including headless Shopify, theme development, app development, and custom integrations. Hire experienced Shopify developers for your store.',
  keywords: [
    'shopify developer',
    'shopify expert',
    'hire shopify developer',
    'shopify customization',
    'shopify integration',
    'shopify website design',
    'shopify app development',
    'shopify theme development',
    'custom shopify development',
    'shopify store development',
    'headless shopify',
    'shopify hydrogen',
    'shopify plus development',
    'shopify ecommerce',
    'shopify migration'
  ],
  openGraph: {
    title: 'Shopify Development Services | Expert Shopify Developers',
    description: 'Custom Shopify development from certified experts. Theme development, app development, headless commerce, and seamless integrations for your e-commerce success.',
    url: 'https://orcaclub.pro/services/shopify',
    siteName: 'OrcaClub',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OrcaClub Shopify Development Services - Expert Shopify Developers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shopify Development Services | OrcaClub',
    description: 'Expert Shopify development: themes, apps, headless commerce, and custom integrations. Transform your e-commerce with certified developers.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/shopify',
  },
}

export default function ShopifyPage() {
  // Service schema for Shopify development
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/shopify#service",
    "serviceType": "Shopify Development",
    "name": "Shopify Development Services",
    "description": "Professional Shopify development services including headless commerce with Hydrogen, custom theme development, Shopify app development, and seamless third-party integrations. Expert Shopify developers for stores of all sizes.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Shopify Development Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Headless Shopify Development",
            "description": "Custom headless commerce solutions using Shopify Hydrogen and Storefront API for lightning-fast storefronts"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Shopify Theme Development",
            "description": "Custom Shopify theme design and development with Liquid templating and Dawn 2.0"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Shopify App Development",
            "description": "Custom Shopify apps to extend store functionality with Node.js, React, and Shopify APIs"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Shopify Integration Services",
            "description": "Seamless integration with ERP systems, CRM platforms, fulfillment services, and marketing tools"
          }
        }
      ]
    }
  }

  // FAQ schema for Shopify development
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does custom Shopify development cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Shopify development projects typically range from $3,000 to $30,000+ depending on complexity. Simple theme customizations start around $3K, while headless builds with custom apps can go higher. We provide detailed quotes after understanding your requirements."
        }
      },
      {
        "@type": "Question",
        "name": "What is headless Shopify and should I use it?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Headless Shopify separates your frontend from Shopify's backend, allowing for faster page loads, complete design freedom, and better SEO. It's ideal for brands needing custom experiences beyond standard themes. We'll help you decide if headless is right for your business."
        }
      },
      {
        "@type": "Question",
        "name": "Can you migrate my store from another platform to Shopify?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We handle full migrations from WooCommerce, Magento, BigCommerce, and other platforms. This includes products, customers, orders, and SEO preservation. Most migrations complete within 1-2 weeks with zero downtime."
        }
      },
      {
        "@type": "Question",
        "name": "Do you build custom Shopify apps?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. We build custom Shopify apps for unique business requirements—from custom checkout experiences to inventory management systems. Our apps integrate seamlessly with your store using Shopify's Admin API and Storefront API."
        }
      },
      {
        "@type": "Question",
        "name": "How long does a Shopify project take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Timeline depends on scope: theme customizations take 1-2 weeks, custom theme development 2-4 weeks, and headless builds with apps 4-8 weeks. We provide exact timelines during our discovery call and stick to them."
        }
      },
      {
        "@type": "Question",
        "name": "Do you work with Shopify Plus merchants?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we work with Shopify Plus merchants and leverage Plus-exclusive features like Shopify Scripts, checkout customizations, and multiple expansion stores. Our enterprise experience ensures your high-volume store performs flawlessly."
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
        "name": "Shopify Development",
        "item": "https://orcaclub.pro/services/shopify"
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
      <ShopifyContent />
    </>
  )
}
