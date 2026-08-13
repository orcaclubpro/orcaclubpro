// JSON-LD builders. All page-level nodes reference the sitewide Organization
// via { '@id': ORG_ID } — the Organization + WebSite nodes themselves are
// emitted once, by the root layout. FAQPage must only be emitted by pages that
// visually render those FAQs (Google requirement) — one FAQ data array per
// page feeds both the JSX accordion and faqSchema, never two copies.
import { BASE_URL, ORG_ID, SITE_NAME, WEBSITE_ID } from './site'

const abs = (path: string) => `${BASE_URL}${path === '/' ? '' : path}`

export type Faq = { question: string; answer: string }

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`, // TODO(rework Phase D): asset missing
    description:
      'Technical operations development studio. Websites, commerce builds, and search visibility for businesses in Orange County and beyond.',
    foundingDate: '2024',
    areaServed: 'Orange County, CA',
    address: { '@type': 'PostalAddress', addressRegion: 'CA', addressCountry: 'US' },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'English',
    },
  }
}

export function webSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: BASE_URL,
    name: SITE_NAME,
    publisher: { '@id': ORG_ID },
  }
}

export function serviceSchema({
  path,
  name,
  serviceType,
  description,
  offers,
  audience,
}: {
  path: string
  name: string
  serviceType: string
  description: string
  offers?: Array<{ name: string; description?: string; price?: string; priceCurrency?: string }>
  audience?: string
}) {
  return {
    '@type': 'Service',
    '@id': `${abs(path)}#service`,
    name,
    serviceType,
    description,
    url: abs(path),
    provider: { '@id': ORG_ID },
    ...(audience ? { audience: { '@type': 'Audience', audienceType: audience } } : {}),
    ...(offers
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name,
            itemListElement: offers.map((offer) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: offer.name,
                ...(offer.description ? { description: offer.description } : {}),
              },
              ...(offer.price
                ? {
                    priceSpecification: {
                      '@type': 'PriceSpecification',
                      price: offer.price,
                      priceCurrency: offer.priceCurrency ?? 'USD',
                    },
                  }
                : {}),
            })),
          },
        }
      : {}),
  }
}

export function faqSchema(path: string, faqs: Faq[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${abs(path)}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

export function breadcrumbSchema(crumbs: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: abs(crumb.path),
    })),
  }
}

export function articleSchema({
  path,
  headline,
  description,
  datePublished,
  dateModified,
  image,
  section,
  authorName,
}: {
  path: string
  headline: string
  description?: string
  datePublished: string
  dateModified?: string
  image?: string
  section?: string
  authorName?: string
}) {
  return {
    '@type': 'Article',
    '@id': `${abs(path)}#article`,
    headline,
    ...(description ? { description } : {}),
    url: abs(path),
    datePublished,
    ...(dateModified ? { dateModified } : {}),
    ...(image ? { image } : {}),
    ...(section ? { articleSection: section } : {}),
    author: authorName ? { '@type': 'Person', name: authorName } : { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: abs(path),
  }
}

export function collectionPageSchema({
  path,
  name,
  description,
  items,
}: {
  path: string
  name: string
  description?: string
  items?: Array<{ name: string; path: string }>
}) {
  return {
    '@type': 'CollectionPage',
    '@id': `${abs(path)}#collection`,
    name,
    ...(description ? { description } : {}),
    url: abs(path),
    publisher: { '@id': ORG_ID },
    ...(items
      ? {
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: items.map((item, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: item.name,
              url: abs(item.path),
            })),
          },
        }
      : {}),
  }
}
