import type { Metadata } from 'next'
import MarketingIntegrationContent from './MarketingIntegrationContent'

export const metadata: Metadata = {
  title: 'Marketing Integration Services | Google Ads, Meta Pixel, LinkedIn & More | ORCACLUB',
  description: 'Connect your marketing platforms: Google Ads, Meta Pixel, LinkedIn Insight Tag, TikTok Pixel, and more. Track conversions and optimize campaigns with proper integration.',
  keywords: [
    'google ads integration',
    'google ads management',
    'marketing integration',
    'facebook pixel integration',
    'meta pixel setup',
    'conversion tracking',
    'marketing technology stack',
    'remarketing setup',
    'ad campaign tracking',
    'conversion optimization',
    'paid search integration',
    'linkedin insight tag',
    'tiktok pixel',
    'google analytics 4',
    'enhanced conversions',
    'CAPI setup',
    'conversions API'
  ],
  openGraph: {
    title: 'Marketing Integration Services | Connect Your Marketing Stack | ORCACLUB',
    description: 'Unified marketing data for better decisions. Google Ads, Meta Pixel, LinkedIn, TikTok, and more - properly integrated for accurate tracking and optimization.',
    url: 'https://orcaclub.pro/services/marketing-integration',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketing Integration Services | ORCACLUB',
    description: 'Connect your marketing platforms for unified tracking and optimization. Google Ads, Meta Pixel, LinkedIn, TikTok & more.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/marketing-integration',
  },
}

export default function MarketingIntegrationPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/marketing-integration#service",
    "serviceType": "Marketing Platform Integration",
    "name": "Marketing Integration Services",
    "description": "Professional marketing platform integration services including Google Ads, Meta Pixel, LinkedIn Insight Tag, TikTok Pixel, and conversion tracking setup.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Marketing Integration Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Google Ads Integration",
            "description": "Complete Google Ads conversion tracking, enhanced conversions, and GA4 linking"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Meta Pixel & CAPI Setup",
            "description": "Meta Pixel installation with Conversions API for iOS 14+ compliance"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "LinkedIn Marketing Integration",
            "description": "LinkedIn Insight Tag and B2B conversion tracking setup"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "TikTok Pixel Setup",
            "description": "TikTok Pixel installation and event tracking configuration"
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
        "name": "Which marketing platforms do you integrate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We integrate all major advertising platforms including Google Ads, Meta (Facebook/Instagram), LinkedIn, TikTok, Pinterest, Twitter/X, Microsoft Ads, and Snapchat. We also set up Google Analytics 4, Google Tag Manager, and connect your CRM systems."
        }
      },
      {
        "@type": "Question",
        "name": "How does marketing integration help my business?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Proper marketing integration ensures accurate conversion tracking, enables retargeting/remarketing campaigns, provides clear attribution data, and allows you to optimize ad spend based on real performance data rather than guesswork."
        }
      },
      {
        "@type": "Question",
        "name": "Is your integration GDPR and CCPA compliant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we implement all integrations with privacy compliance in mind. This includes consent management, cookie consent banners, server-side tracking options, and proper data handling procedures that comply with GDPR, CCPA, and other privacy regulations."
        }
      },
      {
        "@type": "Question",
        "name": "What is the Meta Conversions API (CAPI)?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Meta Conversions API is a server-side tracking solution that sends conversion data directly from your server to Meta, bypassing browser limitations like iOS 14+ restrictions and ad blockers. This significantly improves tracking accuracy and campaign performance."
        }
      },
      {
        "@type": "Question",
        "name": "How long does marketing integration take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Basic integration setups take 1-2 weeks. More complex implementations with multiple platforms, server-side tracking, and custom event configurations typically take 2-4 weeks. We provide ongoing monitoring and maintenance as part of our Scale and Enterprise packages."
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
      { "@type": "ListItem", "position": 3, "name": "Marketing Integration", "item": "https://orcaclub.pro/services/marketing-integration" }
    ]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <MarketingIntegrationContent />
    </>
  )
}
