import type { Metadata } from 'next'
import TechnicalSeoContent from './TechnicalSeoContent'

export const metadata: Metadata = {
  title: 'Technical SEO Services | Search Engine Optimization Setup | ORCACLUB',
  description: 'Technical SEO implementation: schema markup, site speed optimization, structured data, and Google Search Console setup. Rank higher, faster.',
  keywords: [
    'seo services',
    'search engine optimization',
    'local seo',
    'seo audit',
    'seo optimization',
    'technical seo',
    'schema markup',
    'structured data',
    'core web vitals',
    'site speed optimization',
    'google search console',
    'xml sitemap',
    'meta tags optimization',
    'mobile seo',
    'page speed optimization'
  ],
  openGraph: {
    title: 'Technical SEO Implementation | Build SEO-Ready Websites | ORCACLUB',
    description: 'We implement technical SEO foundations that help your website rank. Schema markup, Core Web Vitals, structured data, and search console setup included in every build.',
    url: 'https://orcaclub.pro/services/technical-seo',
    siteName: 'ORCACLUB',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB Technical SEO Services - Search Engine Optimization Setup',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Technical SEO Implementation | ORCACLUB',
    description: 'Technical SEO foundations built into every website. Schema markup, Core Web Vitals optimization, and Google Search Console setup.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/technical-seo',
  },
}

export default function TechnicalSeoPage() {
  // Service schema for technical SEO
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/technical-seo#service",
    "serviceType": "Technical SEO Implementation",
    "name": "Technical SEO Services",
    "description": "Professional technical SEO implementation including schema markup, Core Web Vitals optimization, structured data, XML sitemaps, and Google Search Console setup. We build SEO-ready websites, not ongoing SEO retainers.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Technical SEO Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Schema Markup Implementation",
            "description": "Organization, LocalBusiness, Service, FAQ, Breadcrumb, and Product structured data implementation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Core Web Vitals Optimization",
            "description": "LCP, FID/INP, and CLS optimization for better search rankings and user experience"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Site Architecture Setup",
            "description": "URL structure, XML sitemaps, robots.txt, and crawlability optimization"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Google Search Console Setup",
            "description": "Complete Search Console configuration, sitemap submission, and initial indexing"
          }
        }
      ]
    }
  }

  // FAQ schema for technical SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the difference between technical SEO and content SEO?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Technical SEO focuses on the infrastructure that helps search engines crawl and index your site: site speed, schema markup, URL structure, mobile optimization, and Core Web Vitals. Content SEO involves keyword research, content creation, and ongoing optimization. We specialize in technical SEO implementation - building the foundation that makes your content discoverable."
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer ongoing SEO management or monthly retainers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. We implement technical SEO foundations during your website build, but we don't offer monthly SEO retainers, content writing, or link building campaigns. Our focus is building SEO-ready websites with proper technical foundations. If you need ongoing SEO management, we can recommend trusted partners."
        }
      },
      {
        "@type": "Question",
        "name": "What schema markup types do you implement?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We implement Organization, LocalBusiness, Service, FAQ, Breadcrumb, Product, Article, and Review schema depending on your business type. Schema markup helps search engines understand your content and can enable rich snippets in search results."
        }
      },
      {
        "@type": "Question",
        "name": "How long does technical SEO implementation take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Technical SEO is built into our standard development process. It's included in every project tier and doesn't add extra time. Your website launches with proper meta tags, schema markup, XML sitemaps, robots.txt, and Google Search Console already configured."
        }
      },
      {
        "@type": "Question",
        "name": "What are Core Web Vitals and why do they matter?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Core Web Vitals are Google's metrics for user experience: LCP (Largest Contentful Paint) measures loading speed, INP (Interaction to Next Paint) measures interactivity, and CLS (Cumulative Layout Shift) measures visual stability. Good Core Web Vitals scores are a Google ranking factor and improve user experience."
        }
      },
      {
        "@type": "Question",
        "name": "Is technical SEO included in all your project tiers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Every website we build includes technical SEO fundamentals: meta tags, Open Graph, schema markup, XML sitemap, robots.txt, and mobile optimization. The Scale tier adds Google Analytics and Search Console setup. Enterprise tier includes advanced structured data and custom SEO requirements."
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
        "name": "Technical SEO",
        "item": "https://orcaclub.pro/services/technical-seo"
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
      <TechnicalSeoContent />
    </>
  )
}
