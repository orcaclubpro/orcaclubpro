import type { ReactNode } from 'react'

/**
 * The standard `py-20 px-8` marketing section band, extracted from the
 * repeated section wrapper in the service Content files.
 *
 * One max-width scale, two stops:
 *   - 'prose' → max-w-4xl (FAQ, long-form copy)
 *   - 'grid'  → max-w-6xl (card grids, tables, heroes)
 */
export type SectionWidth = 'prose' | 'grid'

const WIDTHS: Record<SectionWidth, string> = {
  prose: 'max-w-4xl',
  grid: 'max-w-6xl',
}

export type SectionSpacing = 'default' | 'hero' | 'closing'

const SPACING: Record<SectionSpacing, string> = {
  default: 'py-20',
  hero: 'pt-32 pb-20',
  closing: 'py-32',
}

export function Section({
  id,
  width = 'grid',
  spacing = 'default',
  borderTop = true,
  className = '',
  children,
}: {
  id?: string
  width?: SectionWidth
  spacing?: SectionSpacing
  /** Standard `border-t border-zinc-800/50` divider. Turn off for heroes. */
  borderTop?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={[
        SPACING[spacing],
        'px-8 relative',
        borderTop ? 'border-t border-zinc-800/50' : '',
        id ? 'scroll-mt-24' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${WIDTHS[width]} mx-auto`}>{children}</div>
    </section>
  )
}
