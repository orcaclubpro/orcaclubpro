'use client'

import { Check } from 'lucide-react'
import { useTheme } from '@/app/(spaces)/ThemeContext'
import { THEME_LIST, type ThemeDefinition } from '@/app/(spaces)/themes'
import { OrcaMark } from './OrcaMark'

/**
 * Theme rows for the account sidebar.
 *
 * Each row is a full-width slab painted entirely in its own theme's variables —
 * background, card, border, text, accent — wrapped around a miniature of the
 * portal itself: the header lockup over a content card. You are looking at the
 * theme, not at a swatch of it, so the contrast you are choosing is the contrast
 * you get. The rest of the sidebar stays greyscale so these are the only colour
 * on screen.
 *
 * Derived wholly from THEME_LIST — adding a theme to the registry adds a row.
 */

/** The portal, abstracted to four shapes, drawn in one theme's palette. */
function ThemeMiniature({ theme }: { theme: ThemeDefinition }) {
  const v = theme.vars
  return (
    <span
      className="flex h-[42px] w-[58px] shrink-0 flex-col gap-[4px] rounded-[8px] p-[5px]"
      style={{ background: v['--space-bg-base'], boxShadow: `inset 0 0 0 1px ${v['--space-border-hard']}` }}
    >
      {/* Header lockup — orca + wordmark */}
      <span className="flex items-center gap-[3px]">
        <OrcaMark size={9} style={{ color: v['--space-nav-fg'] }} />
        <span className="h-[2px] w-[15px] rounded-full" style={{ background: v['--space-nav-fg'], opacity: 0.8 }} />
      </span>
      {/* Content card */}
      <span
        className="flex flex-1 items-center gap-[3px] rounded-[4px] px-[4px]"
        style={{ background: v['--space-bg-card'], boxShadow: `inset 0 0 0 1px ${v['--space-border']}` }}
      >
        <span className="h-[2px] flex-1 rounded-full" style={{ background: v['--space-text-secondary'], opacity: 0.55 }} />
        <span className="size-[5px] shrink-0 rounded-full" style={{ background: v['--space-accent'] }} />
      </span>
    </span>
  )
}

function ThemeSlab({
  theme,
  active,
  onSelect,
}: {
  theme: ThemeDefinition
  active: boolean
  onSelect: () => void
}) {
  const v = theme.vars
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className="group relative flex w-full items-stretch overflow-hidden rounded-[14px] text-left transition-[box-shadow,transform] duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2"
      style={{
        background: v['--space-bg-base'],
        boxShadow: active
          ? `0 0 0 1.5px ${v['--space-accent']}`
          : `0 0 0 1px ${v['--space-border-hard']}`,
      }}
    >
      {/* Selection spine — the only thing that moves between states */}
      <span
        className="w-[4px] shrink-0 transition-colors duration-150"
        style={{ background: active ? v['--space-accent'] : 'transparent' }}
      />

      <span className="flex min-w-0 flex-1 items-center gap-[12px] py-[10px] pl-[11px] pr-[13px]">
        <ThemeMiniature theme={theme} />

        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-tight" style={{ color: v['--space-text-primary'] }}>
            {theme.label}
          </span>
          {/* Mixed from the theme's own ink and paper rather than taken from its
              tertiary token: the ramp inverts between light and dark modes, so any
              fixed token falls below readable on half the themes. */}
          <span
            className="mt-[3px] block text-[11.5px] leading-[1.35]"
            style={{ color: `color-mix(in srgb, ${v['--space-text-primary']} 62%, ${v['--space-bg-base']})` }}
          >
            {theme.description}
          </span>
        </span>

        <span
          className="flex size-[18px] shrink-0 items-center justify-center rounded-full transition-opacity duration-150"
          style={{ background: v['--space-accent'], opacity: active ? 1 : 0 }}
        >
          <Check className="size-[11px]" strokeWidth={3} style={{ color: v['--space-bg-base'] }} />
        </span>
      </span>
    </button>
  )
}

export function ThemePicker({ onPick }: { onPick?: () => void }) {
  const { themeId, setTheme } = useTheme()
  return (
    <div className="flex flex-col gap-[9px]">
      {THEME_LIST.map((theme) => (
        <ThemeSlab
          key={theme.id}
          theme={theme}
          active={theme.id === themeId}
          onSelect={() => {
            setTheme(theme.id)
            onPick?.()
          }}
        />
      ))}
    </div>
  )
}
