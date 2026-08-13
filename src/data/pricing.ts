/**
 * Single source of truth for ALL offer pricing on the marketing site.
 *
 * Consumed by <PriceAnchor>, the MoneyPage price band, /pricing, and hub cards.
 * Never retype a price in a page — reference an entry here by key. When a price
 * changes, it changes in exactly one place.
 */

export type Offer = {
  /** Human-readable offer name (also used as the JSON-LD offer name). */
  name: string
  /** Display string, e.g. '$4,000–$10,000' or '$500/mo'. */
  priceDisplay: string
  /** Optional qualifier shown next to the price (payment terms, what varies the range). */
  priceNote?: string
  /** Optional delivery timeline display, e.g. '2–4 weeks'. */
  timeline?: string
}

export const OFFERS = {
  'websites-payload-cms': {
    name: 'Payload CMS Website',
    // TODO(chance): confirm final pricing before cutover
    priceDisplay: '$4,000–$10,000',
    priceNote: 'Fixed quote after scoping — no hourly surprises.',
    timeline: '2–4 weeks',
  },
  'websites-shopify': {
    name: 'Shopify Storefront',
    // TODO(chance): confirm final pricing before cutover
    priceDisplay: '$2,500–$5,000',
    priceNote: 'Fixed quote after scoping.',
    timeline: '2–3 weeks',
  },
  'websites-custom-commerce': {
    name: 'Custom Commerce Build',
    // TODO(chance): confirm final pricing before cutover
    priceDisplay: 'from $12,000',
    priceNote: 'Scoped and quoted per project.',
    timeline: '4–8 weeks',
  },
  'get-found-audit': {
    name: 'Search Visibility Audit',
    // TODO(chance): confirm final pricing before cutover
    priceDisplay: '$1,500–$2,500',
    priceNote: 'One-time engagement, fixed deliverables.',
    timeline: '1–2 weeks',
  },
  'get-found-growth': {
    name: 'Growth Retainer',
    // TODO(chance): confirm final pricing before cutover
    priceDisplay: '$1,000–$5,000/mo',
    priceNote: 'Monthly retainer, scoped to channel mix.',
    timeline: 'Ongoing',
  },
  care: {
    name: 'Care Plan',
    // TODO(chance): confirm final pricing before cutover
    priceDisplay: '$500/mo',
    priceNote: 'Hosting, updates, backups, and small fixes.',
    timeline: 'Ongoing',
  },
} as const satisfies Record<string, Offer>

export type OfferKey = keyof typeof OFFERS
