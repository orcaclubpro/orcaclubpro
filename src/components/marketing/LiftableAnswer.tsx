import type { ReactNode } from 'react'

/**
 * The answer-first lede for spoke pages: the 2–3 sentence direct answer an
 * AI engine or featured snippet can lift verbatim. Styled from the existing
 * hero-paragraph pattern (xl gray-300 light, with <strong> reading white).
 *
 * Usage: put the direct answer first, bold the key claim —
 *   <LiftableAnswer>
 *     <strong>Local SEO is ...</strong> The rest of the answer ...
 *   </LiftableAnswer>
 */
export function LiftableAnswer({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={`text-xl md:text-2xl text-gray-300 font-light leading-relaxed [&_strong]:text-white [&_strong]:font-normal ${className}`}
    >
      {children}
    </p>
  )
}
