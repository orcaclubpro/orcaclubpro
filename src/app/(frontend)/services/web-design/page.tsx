import type { Metadata } from 'next'
import WebDesignContent from './WebDesignContent'

export const metadata: Metadata = {
  title: 'Professional Web Design Services | Custom Website Development | ORCACLUB',
  description: 'Expert web design and development services for businesses. Responsive, modern websites built with cutting-edge technology. Get a quote today.',
  keywords: [
    // Primary keywords (74,000+ searches)
    'web design',
    'website design',
    'web developer',
    // Secondary keywords
    'web design near me',
    'web design agency',
    'website design services',
    'web development company',
    'web development services',
    // Long-tail keywords
    'responsive web design',
    'website redesign',
    'small business web design',
    'custom website design',
    'web design cost',
    // Additional relevant terms
    'modern website development',
    'professional web design',
    'business website design',
    'mobile-friendly web design',
    'SEO-optimized website',
    'fast loading websites',
    'React web development',
    'Next.js website',
  ],
  openGraph: {
    title: 'Professional Web Design Services | Custom Website Development | ORCACLUB',
    description: 'Expert web design and development services for businesses. Responsive, modern websites built with React, Next.js, and Tailwind CSS. Fast delivery, transparent pricing.',
    url: 'https://orcaclub.pro/services/web-design',
    siteName: 'ORCACLUB',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB Professional Web Design Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professional Web Design Services | ORCACLUB',
    description: 'Custom website design and development. Responsive, modern, SEO-optimized websites built with cutting-edge technology.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/web-design',
  },
}

export default function WebDesignPage() {
  // Service schema for web design
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/web-design#service",
    "serviceType": "Web Design and Development",
    "name": "Professional Web Design Services",
    "description": "Expert web design and development services delivering custom, responsive, SEO-optimized websites for businesses. Modern technology stack including React, Next.js, Tailwind CSS, and Payload CMS.",
    "provider": {
      "@type": "Organization",
      "@id": "https://orcaclub.pro/#organization",
      "name": "ORCACLUB",
      "url": "https://orcaclub.pro"
    },
    "areaServed": {
      "@type": "Place",
      "name": "Global"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Web Design Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Launch Tier Web Design",
            "description": "Professional website with headless CMS, responsive design, and SEO optimization. Delivered in 3-5 days."
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "1000-3000",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Scale Tier Web Design",
            "description": "Advanced website with integrations, analytics, automation features, and enhanced performance optimization. Delivered in 7-10 days."
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "price": "3000-5000",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Responsive Web Design",
            "description": "Mobile-first design ensuring perfect experience across all devices"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom Website Development",
            "description": "Bespoke website development with React, Next.js, and modern frameworks"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Website Redesign",
            "description": "Transform outdated websites into modern, high-performing digital experiences"
          }
        }
      ]
    }
  }

  // FAQ schema for web design
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does web design cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our web design services start at $1,000-$3,000 for the Launch Tier (simple marketing sites) and $3,000-$5,000 for the Scale Tier (sites with integrations and advanced features). Enterprise projects with custom development range from $6,000-$30,000. We provide transparent, fixed pricing after understanding your specific needs."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to design and build a website?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our Launch Tier websites are delivered in 3-5 days. Scale Tier projects with integrations take 7-10 days. Enterprise projects with custom development require 14-21 days. These timelines are significantly faster than traditional agencies (which typically take 3-6 months) because we use modern frameworks and proven processes."
        }
      },
      {
        "@type": "Question",
        "name": "What is responsive web design?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Responsive web design ensures your website looks and functions perfectly on all devices - desktops, laptops, tablets, and smartphones. We use a mobile-first approach, designing for smaller screens first and then scaling up. This is critical because over 60% of web traffic comes from mobile devices, and Google prioritizes mobile-friendly sites in search rankings."
        }
      },
      {
        "@type": "Question",
        "name": "What technologies do you use for web design?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We use modern, industry-leading technologies: React and Next.js for fast, interactive interfaces; Tailwind CSS for beautiful, responsive styling; Payload CMS for easy content management; and TypeScript for reliable, maintainable code. This tech stack delivers superior performance, SEO benefits, and scalability compared to traditional platforms like WordPress."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide website hosting and maintenance?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we offer managed hosting and maintenance packages starting at $300/month. This includes hosting on enterprise-grade infrastructure (Vercel, AWS, or your preferred platform), security updates, performance monitoring, content updates, and technical support. We also provide one-time deployment to your existing hosting if preferred."
        }
      },
      {
        "@type": "Question",
        "name": "Will my website be optimized for search engines (SEO)?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. Every website we build includes technical SEO optimization: fast loading speeds (sub-2 second load times), proper meta tags and structured data, mobile-friendly design, clean URL structure, image optimization, and Core Web Vitals compliance. This provides a strong foundation for ranking in search engines."
        }
      },
      {
        "@type": "Question",
        "name": "Can you redesign my existing website?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, website redesign is one of our core services. We analyze your current site's performance, identify issues affecting user experience and conversions, and rebuild it with modern technology. Most redesigns include improved design, faster performance, better mobile experience, and enhanced SEO - all while preserving your existing content and SEO equity."
        }
      },
      {
        "@type": "Question",
        "name": "What's included in your web design process?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our process includes: Discovery (understanding your goals, audience, and requirements), Design (wireframes, mockups, and design system), Development (building the site with modern frameworks), and Launch (deployment, testing, and training). You receive daily updates throughout and a fully functional, content-managed website at the end."
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
        "name": "Web Design",
        "item": "https://orcaclub.pro/services/web-design"
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
      <WebDesignContent />
    </>
  )
}
