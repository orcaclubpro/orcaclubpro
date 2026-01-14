import type { Metadata } from 'next'
import CustomDevelopmentContent from './CustomDevelopmentContent'

export const metadata: Metadata = {
  title: 'Custom Web Application Development | SaaS Development & Enterprise Applications | ORCACLUB',
  description: 'Custom web application development for complex business needs. Client portals, admin dashboards, SaaS platforms, and enterprise solutions. React, Next.js, TypeScript experts.',
  keywords: [
    'full stack developer',
    'digital transformation',
    'client portal',
    'web application development',
    'custom app development',
    'inventory management system',
    'saas development',
    'dashboard development',
    'enterprise web development',
    'b2b web development',
    'react developer',
    'react development',
    'frontend developer',
    'backend developer',
    'custom software development',
    'business application development',
    'enterprise software',
    'admin dashboard',
    'booking system development',
    'multi-tenant application'
  ],
  openGraph: {
    title: 'Custom Web Application Development | Enterprise Solutions | ORCACLUB',
    description: 'Custom web applications for complex business needs. Client portals, admin dashboards, SaaS platforms, inventory systems, and booking platforms built with React, Next.js, and TypeScript.',
    url: 'https://orcaclub.pro/services/custom-development',
    siteName: 'ORCACLUB',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB Custom Web Application Development - Enterprise Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Web Application Development | SaaS & Enterprise | ORCACLUB',
    description: 'Custom client portals, admin dashboards, SaaS platforms, and enterprise applications built by full stack developers.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/custom-development',
  },
}

export default function CustomDevelopmentPage() {
  // Service schema for custom development
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/custom-development#service",
    "serviceType": "Custom Web Application Development",
    "name": "Custom Web Application Development Services",
    "description": "Professional custom web application development for complex business needs. Client portals, admin dashboards, SaaS platforms, inventory management systems, booking platforms, and enterprise solutions built with React, Next.js, and TypeScript.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Custom Development Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Client Portal Development",
            "description": "Custom client portals with secure document sharing, project dashboards, invoice management, and support ticket systems"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Admin Dashboard Development",
            "description": "Internal operations dashboards with real-time data visualization, user management, and reporting tools"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "SaaS Platform Development",
            "description": "Multi-tenant SaaS applications with subscription management, user authentication, and usage metering"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Inventory Management Systems",
            "description": "Custom inventory tracking with multi-warehouse management, order processing, and supplier management"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Booking & Scheduling Platforms",
            "description": "Appointment scheduling systems with calendar integrations, automated reminders, and payment processing"
          }
        }
      ]
    }
  }

  // FAQ schema for custom development
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How long does custom web application development take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Custom application timelines vary by complexity. Simple client portals or admin dashboards typically take 2-4 weeks. More complex systems like inventory management or booking platforms take 4-8 weeks. Full SaaS platforms with multi-tenancy can take 8-12+ weeks. We provide detailed timelines after our discovery phase."
        }
      },
      {
        "@type": "Question",
        "name": "How much does custom web application development cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Custom applications fall under our Enterprise tier, starting at $6K for simpler applications and ranging up to $30K+ for complex SaaS platforms. Pricing depends on features, integrations, and complexity. We provide fixed-price quotes after discovery so there are no surprises."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide ongoing maintenance and support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We offer monthly maintenance packages from $300-1,200/mo that include bug fixes, security updates, minor feature additions, and priority support. We also provide documentation and training so your team can handle day-to-day operations."
        }
      },
      {
        "@type": "Question",
        "name": "Who owns the code and intellectual property?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You do. Upon final payment, you receive full ownership of all custom code, designs, and documentation. We provide complete source code access and deployment credentials. There's no vendor lock-in - you can host anywhere and hire any team to maintain it."
        }
      },
      {
        "@type": "Question",
        "name": "Can you integrate with our existing systems?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We specialize in integrations with CRMs (Salesforce, HubSpot), payment systems (Stripe, Square), ERPs, accounting software, and custom APIs. If it has an API, we can integrate it. We also build custom APIs for systems that don't have one."
        }
      },
      {
        "@type": "Question",
        "name": "What technologies do you use for custom development?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our core stack is React, Next.js, TypeScript, and Node.js for the frontend and backend. For databases, we use PostgreSQL or MongoDB depending on your needs. We also use Payload CMS for content management, Stripe for payments, and deploy on Vercel or AWS."
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
        "name": "Custom Development",
        "item": "https://orcaclub.pro/services/custom-development"
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
      <CustomDevelopmentContent />
    </>
  )
}
