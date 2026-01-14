import type { Metadata } from 'next'
import LaunchContent from './LaunchContent'

export const metadata: Metadata = {
  title: 'Launch Package | Fast Website Development $1K-3K | ORCACLUB',
  description: 'Launch your website in 3-5 days. CMS setup, hosting, responsive design included. Perfect for startups and small businesses. Starting at $1,000.',
  keywords: [
    'small business web design',
    'web design cost',
    'website pricing',
    'fast website development',
    'cheap website design',
    'startup website',
    'small business website',
    'website launch package',
    'quick website setup',
    'CMS setup',
    'responsive web design',
    'website hosting included',
    'SEO setup',
    'content migration'
  ],
  openGraph: {
    title: 'Launch Package | Fast Website Development $1K-3K | ORCACLUB',
    description: 'Launch your website in 3-5 days. CMS setup, hosting, responsive design included. Perfect for startups and small businesses.',
    url: 'https://orcaclub.pro/packages/launch',
    siteName: 'ORCACLUB',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB Launch Package - Fast Website Development',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Launch Package | Fast Website Development $1K-3K | ORCACLUB',
    description: 'Launch your website in 3-5 days. CMS setup, hosting, responsive design included. Starting at $1,000.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/packages/launch',
  },
}

export default function LaunchPackagePage() {
  // Service schema for Launch package
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/packages/launch#service",
    "serviceType": "Website Development - Launch Package",
    "name": "Launch Package - Fast Website Development",
    "description": "Professional website development package delivering launch-ready websites in 3-5 days. Includes CMS setup, responsive design, hosting, SSL certificate, basic SEO setup, content migration, and training session. Perfect for startups and small businesses.",
    "provider": {
      "@type": "Organization",
      "@id": "https://orcaclub.pro/#organization",
      "name": "ORCACLUB",
      "url": "https://orcaclub.pro"
    },
    "areaServed": "Global",
    "offers": {
      "@type": "Offer",
      "priceRange": "$1,000-$3,000",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "validFrom": "2024-01-01"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Launch Package Features",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "CMS Setup",
            "description": "Headless CMS setup with Payload CMS for easy content management"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Responsive Design",
            "description": "Mobile-first responsive design that works on all devices"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Hosting & SSL",
            "description": "Professional hosting with SSL certificate included"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Basic SEO Setup",
            "description": "Search engine optimization fundamentals configured"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Content Migration",
            "description": "Transfer existing content to your new website"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Training Session",
            "description": "Hands-on training to manage your new website"
          }
        }
      ]
    }
  }

  // FAQ schema for Launch package
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How long does the Launch package take to complete?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Launch package is designed for speed. We deliver your complete website in 3-5 business days from project kickoff. This includes CMS setup, design implementation, content migration, and a training session."
        }
      },
      {
        "@type": "Question",
        "name": "What is included in the $1K-3K price range?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Launch package includes: Payload CMS setup, responsive mobile-first design, professional hosting, SSL certificate, basic SEO configuration, content migration from your existing site, and a hands-on training session. The price varies based on the number of pages and content complexity."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need technical knowledge to manage my website?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No technical knowledge required. We use Payload CMS which provides an intuitive admin interface. Plus, your package includes a training session where we walk you through everything - adding content, uploading images, and making updates."
        }
      },
      {
        "@type": "Question",
        "name": "Is hosting included in the Launch package?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, professional hosting is included. We handle the technical setup including domain configuration, SSL certificate installation, and ongoing hosting. You own everything - full account transfers provided."
        }
      },
      {
        "@type": "Question",
        "name": "What if I need integrations like Stripe or email marketing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Third-party integrations are not included in the Launch package. If you need payment processing, CRM integration, email marketing, or automation, consider our Scale package ($3K-5K) which includes 2 custom integrations."
        }
      },
      {
        "@type": "Question",
        "name": "Can I upgrade to Scale or Enterprise later?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. The Launch package is built on the same modern tech stack (Next.js, Payload CMS) as our higher tiers. When you're ready for integrations, analytics, or advanced features, we can seamlessly upgrade your site."
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
        "name": "Packages",
        "item": "https://orcaclub.pro/project"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Launch Package",
        "item": "https://orcaclub.pro/packages/launch"
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
      <LaunchContent />
    </>
  )
}
