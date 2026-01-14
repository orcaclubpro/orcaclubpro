import type { Metadata } from 'next'
import AnalyticsContent from './AnalyticsContent'

export const metadata: Metadata = {
  title: 'Web Analytics Setup | Google Tag Manager, Data Tracking & Dashboards | ORCACLUB',
  description: 'Professional analytics implementation: Google Tag Manager, custom dashboards, data visualization. Make data-driven decisions with proper tracking.',
  keywords: [
    'google tag manager',
    'data analytics',
    'data visualization',
    'business intelligence',
    'web analytics',
    'data tracking',
    'dashboard development',
    'google analytics integration',
    'google analytics 4',
    'GA4 setup',
    'GTM implementation',
    'conversion tracking',
    'event tracking',
    'analytics dashboard',
    'google search console',
    'looker studio',
    'data studio',
    'ecommerce tracking',
    'conversion funnel',
    'user behavior analytics'
  ],
  openGraph: {
    title: 'Web Analytics & Data Tracking Setup | Google Tag Manager Implementation | ORCACLUB',
    description: 'Stop guessing, start knowing. Professional Google Analytics 4, Tag Manager, and custom dashboard implementation. Make data-driven decisions with proper tracking.',
    url: 'https://orcaclub.pro/services/analytics-tracking',
    siteName: 'ORCACLUB',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB Web Analytics & Data Tracking Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Analytics Setup | Google Tag Manager & GA4 | ORCACLUB',
    description: 'Professional analytics implementation: GA4, Google Tag Manager, custom dashboards, and conversion tracking. Data-driven decisions start here.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/analytics-tracking',
  },
}

export default function AnalyticsTrackingPage() {
  // Service schema for analytics tracking
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/analytics-tracking#service",
    "serviceType": "Web Analytics Implementation",
    "name": "Web Analytics & Data Tracking Services",
    "description": "Professional web analytics implementation including Google Analytics 4, Google Tag Manager, custom event tracking, conversion funnels, and dashboard development. We set up the tracking infrastructure that enables data-driven decisions.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Analytics Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Google Analytics 4 Setup",
            "description": "Full GA4 implementation with enhanced measurement, custom events, and conversion tracking"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Google Tag Manager Implementation",
            "description": "GTM container setup with triggers, variables, and custom event configurations"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom Dashboard Development",
            "description": "Looker Studio dashboards with real-time metrics and business KPIs"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "E-commerce Analytics",
            "description": "Product views, cart additions, checkout tracking, and purchase analytics"
          }
        }
      ]
    }
  }

  // FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What data do you track with analytics implementation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We track page views, user sessions, traffic sources, button clicks, form submissions, scroll depth, file downloads, video engagement, conversion events, and campaign performance. For ecommerce sites, we also track product views, cart additions, checkout steps, and purchases. All tracking is customized to your specific business goals."
        }
      },
      {
        "@type": "Question",
        "name": "Is analytics tracking GDPR and privacy compliant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We implement analytics with privacy in mind. This includes consent management integration, IP anonymization where required, data retention settings, and cookie policy compliance. We configure GA4's privacy controls and can integrate with your consent management platform."
        }
      },
      {
        "@type": "Question",
        "name": "Who manages the analytics after setup?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "After implementation, you own your analytics completely. We provide documentation and training on how to read your dashboards and reports. The setup is self-maintaining - data continues to collect automatically. We can provide ongoing support if needed, but it's not required."
        }
      },
      {
        "@type": "Question",
        "name": "Is Google Analytics 4 different from Universal Analytics?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, significantly. GA4 is event-based rather than session-based, offers better cross-platform tracking, has built-in machine learning insights, and is designed for a cookie-less future. Universal Analytics was sunset in July 2023, so all new implementations use GA4. If you're still on UA, we can help migrate."
        }
      },
      {
        "@type": "Question",
        "name": "What is Google Tag Manager and why do I need it?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Google Tag Manager (GTM) is a container that manages all your tracking codes in one place. Instead of adding code to your website every time you want to track something new, you add it to GTM. This makes tracking easier to manage, faster to update, and reduces the risk of breaking your site with code changes."
        }
      },
      {
        "@type": "Question",
        "name": "Is analytics tracking included in your website packages?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Analytics implementation is included in our Scale tier and above. The Launch tier includes technical SEO foundations but not full analytics setup. We recommend Scale for any business that wants to make data-driven decisions about their website performance."
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
        "name": "Analytics Tracking",
        "item": "https://orcaclub.pro/services/analytics-tracking"
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
      <AnalyticsContent />
    </>
  )
}
