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
    priceDisplay: '$2,000–$5,000',
    priceNote: 'Fixed quote after scoping — no hourly surprises.',
    // TODO(chance): confirm timeline — kept at 2–4 weeks for the "quick site" positioning
    timeline: '2–4 weeks',
  },
  'websites-shopify': {
    name: 'Shopify Storefront',
    priceDisplay: '$5,000–$20,000',
    priceNote: 'Fixed quote after scoping.',
    timeline: '1–2 months',
  },
  'websites-custom-commerce': {
    name: 'Custom Commerce Build',
    priceDisplay: '$10,000–$20,000',
    priceNote: 'Scoped and quoted per project.',
    // TODO(chance): confirm timeline — 1–2 months to match the Shopify band it overlaps
    timeline: '1–2 months',
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
