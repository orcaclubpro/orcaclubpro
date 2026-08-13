/**
 * NEW information-architecture nav data (hub-and-spoke funnel).
 *
 * NOT yet wired into the live header/footer — the cutover phase rewrites
 * header.tsx / footer.tsx to consume this file. Until then it is the reference
 * shape page-builder agents link against.
 */

export type NavItem = {
  label: string
  href: string
  /** Short one-liner for dropdown/mega-menu rows. */
  description?: string
  /** True for links that leave the site (render target="_blank" + rel). */
  external?: boolean
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
      },
      {
        label: 'Shopify Storefronts',
        href: '/websites/shopify',
        description: 'Shopify builds that convert — themes to headless.',
      },
      {
        label: 'Custom Commerce',
        href: '/websites/custom-commerce',
        description: 'Bespoke commerce, APIs, and multi-system workflows.',
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
      },
      {
        label: 'Growth Retainer',
        href: '/get-found/growth',
        description: 'Ongoing search and channel growth, monthly.',
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
  { label: 'Work', href: '/work' },
  { label: 'Sonar', href: 'https://sonar.orcaclub.pro', external: true },
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
      { label: 'Work', href: '/work' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Sonar', href: 'https://sonar.orcaclub.pro', external: true },
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
