/**
 * Information-architecture nav data (hub-and-spoke funnel).
 *
 * Consumed by the header mega-dropdowns (NAV_ITEMS) and the footer
 * (FOOTER_LINKS) — the single source of truth for marketing-site links.
 *
 * Hub children are split by `featured`: featured children are the money pages
 * (they carry a price and lead the dropdown), the rest are supporting spokes
 * and related offers shown in the dropdown's side panel. That split is what
 * keeps the audit — the entry product — from being buried among seven peers.
 */

import type { OfferKey } from './pricing'

export type NavItem = {
  label: string
  href: string
  /** Short one-liner for dropdown/mega-menu rows. */
  description?: string
  /** True for links that leave the site (render target="_blank" + rel). */
  external?: boolean
  /** Money page: leads its hub dropdown and renders a price. */
  featured?: boolean
  /** Pulls price + timeline from src/data/pricing.ts — never hardcode them. */
  priceKey?: OfferKey
  /** Route not built yet — skipped by nav rendering so it can't 404. */
  comingSoon?: boolean
  children?: NavItem[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Websites',
    href: '/websites',
    description: 'Custom-built sites and storefronts you fully own.',
    children: [
      {
        label: 'Payload CMS Websites',
        href: '/websites/payload-cms',
        description: 'Fast, editable marketing sites on a headless CMS.',
        featured: true,
        priceKey: 'websites-payload-cms',
      },
      {
        label: 'Shopify Storefronts',
        href: '/websites/shopify',
        description: 'Shopify builds that convert — themes to headless.',
        featured: true,
        priceKey: 'websites-shopify',
      },
      {
        label: 'Custom Commerce',
        href: '/websites/custom-commerce',
        description: 'Bespoke commerce, APIs, and multi-system workflows.',
        featured: true,
        priceKey: 'websites-custom-commerce',
      },
      // Supporting — shown in the dropdown side panel, not the money grid.
      {
        label: 'Care Plan',
        href: '/care',
        description: 'Hosting, updates, and support after launch.',
        priceKey: 'care',
      },
    ],
  },
  {
    label: 'Get Found',
    href: '/get-found',
    description: 'Search visibility — audits, retainers, and channels.',
    children: [
      {
        label: 'Visibility Audit',
        href: '/get-found/audit',
        description: 'Fixed-price technical and content audit.',
        featured: true,
        priceKey: 'get-found-audit',
      },
      {
        label: 'Growth Retainer',
        href: '/get-found/growth',
        description: 'Ongoing search and channel growth, monthly.',
        featured: true,
        priceKey: 'get-found-growth',
      },
      {
        label: 'SEO',
        href: '/get-found/seo',
        description: 'How organic search actually works in practice.',
      },
      {
        label: 'Local Visibility',
        href: '/get-found/local-visibility',
        description: 'Show up where nearby customers search.',
      },
      {
        label: 'AI Search',
        href: '/get-found/ai-search',
        description: 'Get cited by AI answers, not skipped by them.',
      },
      {
        label: 'Google Ads',
        href: '/get-found/google-ads',
        description: 'Paid search that pays for itself.',
      },
      {
        label: 'Meta Ads',
        href: '/get-found/meta-ads',
        description: 'Instagram and Facebook demand generation.',
      },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  // /work is not built yet (needs the case-studies collection + real material).
  { label: 'Work', href: '/work', comingSoon: true },
  { label: 'Sonar', href: '/sonar' },
  { label: 'Contact', href: '/contact' },
  { label: 'About', href: '/about' },
]

export type FooterColumn = { heading: string; links: NavItem[] }

export const FOOTER_LINKS: FooterColumn[] = [
  {
    heading: 'Websites',
    links: [
      { label: 'Payload CMS Websites', href: '/websites/payload-cms' },
      { label: 'Shopify Storefronts', href: '/websites/shopify' },
      { label: 'Custom Commerce', href: '/websites/custom-commerce' },
      { label: 'Care Plan', href: '/care' },
    ],
  },
  {
    heading: 'Get Found',
    links: [
      { label: 'Visibility Audit', href: '/get-found/audit' },
      { label: 'Growth Retainer', href: '/get-found/growth' },
      { label: 'SEO', href: '/get-found/seo' },
      { label: 'Local Visibility', href: '/get-found/local-visibility' },
      { label: 'AI Search', href: '/get-found/ai-search' },
      { label: 'Google Ads', href: '/get-found/google-ads' },
      { label: 'Meta Ads', href: '/get-found/meta-ads' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Work', href: '/work', comingSoon: true },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Sonar', href: '/sonar' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Accessibility', href: '/accessibility' },
    ],
  },
]
