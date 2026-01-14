import type { Metadata } from 'next'
import AutomationContent from './AutomationContent'

export const metadata: Metadata = {
  title: 'Business Process Automation | Marketing Automation & Workflow Solutions | ORCACLUB',
  description: 'Automate your business operations: marketing automation, workflow optimization, and process automation. Save time, reduce errors, scale efficiently.',
  keywords: [
    'marketing automation',
    'workflow automation',
    'process automation',
    'business automation',
    'business process automation',
    'automation services',
    'crm automation',
    'sales automation',
    'zapier integration',
    'make integration',
    'integromat',
    'email automation',
    'lead automation',
    'workflow optimization',
    'custom automation',
    'api automation',
    'notification automation',
    'booking automation',
    'client onboarding automation'
  ],
  openGraph: {
    title: 'Business Process Automation | Work Smarter with Automation | ORCACLUB',
    description: 'Stop wasting time on manual tasks. Our automation solutions connect your tools, eliminate repetitive work, and help you scale without hiring more staff.',
    url: 'https://orcaclub.pro/services/automation-workflows',
    siteName: 'ORCACLUB',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB Automation Services - Business Process Automation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Process Automation | ORCACLUB',
    description: 'Automate repetitive tasks, connect your tools, and scale efficiently. Custom workflow automation that pays for itself in weeks.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/services/automation-workflows',
  },
}

export default function AutomationWorkflowsPage() {
  // Service schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://orcaclub.pro/services/automation-workflows#service",
    "serviceType": "Business Process Automation",
    "name": "Automation & Workflow Services",
    "description": "Professional business automation services including marketing automation, workflow optimization, CRM automation, and custom integrations. We connect your tools and eliminate manual processes.",
    "provider": {
      "@id": "https://orcaclub.pro/#organization"
    },
    "areaServed": "Global",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Automation Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Lead Automation",
            "description": "Automated lead capture, CRM sync, email sequences, and sales notifications"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Email Marketing Automation",
            "description": "Welcome sequences, abandoned cart recovery, re-engagement campaigns"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Sales Automation",
            "description": "Lead scoring, assignment routing, follow-up reminders, pipeline automation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Client Onboarding Automation",
            "description": "Automated welcome emails, account setup, task creation, and milestone tracking"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom API Automation",
            "description": "Custom Node.js automation and native API integrations for complex workflows"
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
        "name": "How much does workflow automation cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Automation projects start in our Scale tier ($3K-5K) for basic workflow automation connecting 2-4 platforms. Complex multi-platform automations with custom API development fall into our Enterprise tier ($6K-30K). Most clients see ROI within 2-4 weeks through time savings."
        }
      },
      {
        "@type": "Question",
        "name": "Should I use Zapier or custom automation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zapier is great for simple workflows with fewer than 5 steps and standard triggers. Custom automation is better for complex logic, high-volume operations, real-time requirements, or when Zapier's monthly costs exceed a one-time custom build. We help you choose the right approach."
        }
      },
      {
        "@type": "Question",
        "name": "How long does automation implementation take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simple automations using Zapier or Make can be implemented in 1-2 weeks. Custom API automations typically take 2-3 weeks. Enterprise-level workflow systems with multiple integrations take 3-4 weeks. We provide a detailed timeline during our discovery phase."
        }
      },
      {
        "@type": "Question",
        "name": "What happens if an automation breaks?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We build automations with error handling, notifications, and monitoring. If something fails, you're notified immediately. We also provide documentation so your team can troubleshoot common issues. For critical workflows, we can set up redundancy and fallback processes."
        }
      },
      {
        "@type": "Question",
        "name": "What tools can you automate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We can automate any tool with an API or Zapier/Make integration. Common platforms include Salesforce, HubSpot, Stripe, Shopify, Slack, Gmail, Google Sheets, Notion, Airtable, QuickBooks, and hundreds more. If it has an API, we can connect it."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need ongoing maintenance for automations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Well-built automations rarely need maintenance. However, API changes or business process updates may require adjustments. We provide documentation and training so your team can handle minor changes. For ongoing support, we offer maintenance packages."
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
        "name": "Automation Workflows",
        "item": "https://orcaclub.pro/services/automation-workflows"
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
      <AutomationContent />
    </>
  )
}
