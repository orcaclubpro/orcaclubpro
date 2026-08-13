import { OFFERS, type OfferKey } from '@/data/pricing'

/**
 * Inline price display keyed into src/data/pricing.ts — never hardcode a
 * price string in a page. Renders e.g. "$4,000–$10,000" (optionally with
 * " · 2–4 weeks").
 */
export function PriceAnchor({
  offer,
  showTimeline = false,
  className = '',
}: {
  offer: OfferKey
  showTimeline?: boolean
  className?: string
}) {
  const { priceDisplay, timeline } = OFFERS[offer]
  return (
    <span className={`text-cyan-400 font-light whitespace-nowrap ${className}`}>
      {priceDisplay}
      {showTimeline && timeline && (
        <span className="text-gray-500"> &middot; {timeline}</span>
      )}
    </span>
  )
}
