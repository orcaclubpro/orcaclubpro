import type { Metadata } from 'next'
import HostingContent from './HostingContent'

export const metadata: Metadata = {
  title: 'Managed Web Hosting Services | Secure Website Hosting & SSL | ORCACLUB',
  description: 'Reliable web hosting with SSL, security, and performance optimization. WordPress hosting, VPS, and cloud solutions. Included with all packages.',
  keywords: [
    'web hosting',
    'website hosting',
    'hosting services',
    'wordpress hosting',
    'ssl certificate',
    'site hosting',
    'vps hosting',
    'cloud hosting',
    'website security',
    'website maintenance',
    'managed hosting',
    'secure hosting',
    'fast hosting',
    'CDN hosting',
    'edge deployment',
    'vercel hosting',
    'cloudflare hosting'
  ],
  openGraph: {
    title: 'Managed Web Hosting Services | Secure Website Hosting & SSL',
    description: 'Enterprise-grade hosting included with every project. SSL, CDN, DDoS protection, automated backups, and 99.9% uptime guarantee.',
    url: 'https://orcaclub.pro/services/hosting-infrastructure',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Managed Web Hosting Services | ORCACLUB',
    description: 'Enterprise-grade hosting included with every project. SSL, CDN, security, and performance optimization.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/hosting-infrastructure',
  },
}

export default function HostingInfrastructurePage() {
  // Service schema for hosting infrastructure
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/hosting-infrastructure#service",
    "serviceType": "Web Hosting Services",
    "name": "Managed Web Hosting & Infrastructure",
    "description": "Enterprise-grade managed web hosting services with SSL certificates, CDN, DDoS protection, automated backups, and 99.9% uptime guarantee. Included with all project packages.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Hosting Infrastructure Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Edge Deployment",
            "description": "Global edge deployment via Vercel and Cloudflare for lightning-fast performance worldwide"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "SSL/TLS Security",
            "description": "Automatic SSL certificate provisioning and renewal with modern TLS encryption"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "CDN & Caching",
            "description": "Global content delivery network with intelligent edge caching for optimal performance"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "DDoS Protection",
            "description": "Enterprise-grade DDoS mitigation and web application firewall protection"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Automated Backups",
            "description": "Automatic daily backups with instant rollback capabilities"
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
        "name": "Is hosting really included with all packages?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Enterprise-grade hosting is included with every project tier (Launch, Scale, and Enterprise). You get SSL certificates, CDN, DDoS protection, automated backups, and 99.9% uptime guarantee at no additional cost. No separate hosting fees, ever."
        }
      },
      {
        "@type": "Question",
        "name": "What is your uptime guarantee?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We guarantee 99.9% uptime for all hosted websites. Our infrastructure is built on Vercel and Cloudflare's global edge networks, which have a proven track record of reliability. If we ever fail to meet this guarantee, you'll receive service credits."
        }
      },
      {
        "@type": "Question",
        "name": "Can you migrate my existing website?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. We handle complete website migrations including DNS transfers, content migration, email setup, and SSL configuration. Most migrations are completed within 24-48 hours with zero downtime using our staging and DNS propagation strategy."
        }
      },
      {
        "@type": "Question",
        "name": "What happens if my website goes down?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our monitoring systems detect issues within seconds and automatically attempt recovery. For critical issues, our team is notified immediately. With maintenance packages, you get priority support with response times as fast as 30 minutes for critical issues."
        }
      },
      {
        "@type": "Question",
        "name": "Do I get backups of my website?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All websites include automated daily backups with 30-day retention. You can request a restore at any time, and we can roll back to any previous version within minutes. Enterprise tier includes continuous deployment with instant rollback capabilities."
        }
      },
      {
        "@type": "Question",
        "name": "How fast will my website load?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our hosting infrastructure is optimized for sub-2-second load times globally. We achieve this through edge deployment (serving from the closest data center to each visitor), aggressive caching, image optimization, code minification, and lazy loading. Most of our sites achieve 90+ PageSpeed scores."
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
        "name": "Hosting & Infrastructure",
        "item": "https://orcaclub.pro/services/hosting-infrastructure"
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
      <HostingContent />
    </>
  )
}
