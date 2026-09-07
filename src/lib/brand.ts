// ── Business identity ──────────────────────────────────────────────────────────
// The one place any client-facing surface reads ORCACLUB's own name and line of
// business from — contracts, generated PDFs, transactional emails, print pages.
//
// It exists because the descriptor had already drifted into two: contracts and
// emails said "Technical Operations Development Studio" while every invoice,
// proposal, and work log said "Web Design and Marketing Automation". A client
// holding both saw two different businesses.
//
// Change it here and every document follows.

/** The wordmark. Always this casing in body copy; the gothic face handles display. */
export const BRAND_NAME = 'ORCACLUB'

/** The lockup tagline — "ORCACLUB | Marketing, Web Development, SEO and AEO". */
export const BRAND_TAGLINE = 'Marketing, Web Development, SEO and AEO'

/**
 * How the business describes itself inside a contract recital, reading directly
 * after the name and a comma: "ORCACLUB, a marketing, web development, ...".
 *
 * This is a description of the trade, NOT a statement of legal form. A signed
 * agreement should also name the entity actually bound — a sole proprietorship,
 * an LLC and its state — which the NDA carries as `providerEntity` and which
 * overrides this when set.
 */
export const BRAND_LEGAL_DESCRIPTION = 'a marketing, web development, SEO, and AEO studio'

export const BRAND_URL = 'orcaclub.pro'

/** Footer rule on generated PDFs. */
export const BRAND_FOOTER = `${BRAND_NAME} · ${BRAND_TAGLINE} · ${BRAND_URL}`

/** Tracked uppercase strapline under the wordmark on branded PDF headers. */
export const BRAND_STRAPLINE = BRAND_TAGLINE.toUpperCase()

/** Sign-off on plain-text emails. */
export const BRAND_SIGNOFF = `${BRAND_NAME} | ${BRAND_TAGLINE}`

/** The lockup as one string, for headers and tables: "ORCACLUB · Marketing, ...". */
export const BRAND_FULL_NAME = `${BRAND_NAME} · ${BRAND_TAGLINE}`

/**
 * How the business names itself as a party to an agreement. A recital reads as
 * prose, so it takes the description rather than the lockup — no middots inside
 * "by and between ___ and ___".
 */
export const BRAND_CONTRACT_PARTY = `${BRAND_NAME}, ${BRAND_LEGAL_DESCRIPTION}`
