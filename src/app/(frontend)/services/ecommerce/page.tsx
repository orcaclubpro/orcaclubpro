import type { Metadata } from 'next'
import EcommerceContent from './EcommerceContent'

export const metadata: Metadata = {
  title: 'Ecommerce Web Design & Development | Custom Online Store Development | ORCACLUB',
  description: 'Expert ecommerce website development with Shopify headless integration, custom payment systems, and inventory management. Launch your online store in 2-4 weeks with our experienced ecommerce developers.',
  keywords: [
    'ecommerce web design',
    'ecommerce development',
    'ecommerce website development',
    'online store development',
    'ecommerce developer',
    'custom ecommerce',
    'Shopify headless',
    'Shopify development',
    'payment integration',
    'Stripe integration',
    'inventory management system',
    'online store builder',
    'ecommerce platform',
    'custom shopping cart',
    'ecommerce solutions',
    'headless commerce',
    'B2B ecommerce',
    'B2C ecommerce'
  ],
  openGraph: {
    title: 'Ecommerce Website Development | Custom Online Stores in 2-4 Weeks',
    description: 'Launch a high-converting online store with custom ecommerce development. Shopify headless, Stripe payments, and inventory systems built by expert ecommerce developers.',
    url: 'https://orcaclub.pro/services/ecommerce',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ecommerce Website Development | ORCACLUB',
    description: 'Custom online stores with Shopify headless, payment integration, and inventory management. Launch in 2-4 weeks.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/ecommerce',
  },
}

export default function EcommercePage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/ecommerce#service",
    "serviceType": "Ecommerce Website Development",
    "name": "Ecommerce Development Services",
    "description": "Professional ecommerce website development services delivering custom online stores in 2-4 weeks.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global"
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://orcaclub.pro" },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://orcaclub.pro/services" },
      { "@type": "ListItem", "position": 3, "name": "Ecommerce Development", "item": "https://orcaclub.pro/services/ecommerce" }
    ]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <EcommerceContent />
    </>
  )
}
