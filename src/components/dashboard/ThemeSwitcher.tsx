'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Palette } from 'lucide-react'
import { useTheme } from '@/app/(spaces)/ThemeContext'
import { THEME_LIST, THEMES, type ThemeDefinition, type ThemeMode } from '@/app/(spaces)/themes'
import { cn } from '@/lib/utils'

/** A miniature live preview of a theme, rendered with that theme's own vars. */
function ThemeCard({
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
      onClick={onSelect}
      aria-label={`${theme.label} theme`}
      aria-pressed={active}
      className="group relative flex flex-col gap-1.5 p-1.5 rounded-xl text-left transition-all duration-150 active:scale-[0.97]"
      style={{
        background: active ? 'var(--space-bg-card-hover)' : 'transparent',
        boxShadow: active
          ? `0 0 0 1.5px ${v['--space-accent']}`
          : '0 0 0 1px var(--space-border)',
      }}
    >
      {/* Mini preview — painted with the theme's own colors */}
      <div
        className="relative h-11 rounded-lg overflow-hidden flex items-center gap-1.5 px-2"
        style={{ background: v['--space-bg-base'] }}
      >
        <div
          className="flex-1 h-7 rounded-md flex items-center gap-1 px-1.5"
          style={{
            background: v['--space-bg-card'],
            boxShadow: `inset 0 0 0 1px ${v['--space-border']}`,
          }}
        >
          <span className="text-[10px] font-bold leading-none" style={{ color: v['--space-text-primary'] }}>
            Aa
          </span>
          <span
            className="h-1 flex-1 rounded-full"
            style={{ background: v['--space-text-secondary'], opacity: 0.5 }}
          />
        </div>
        <span
          className="size-3 rounded-full shrink-0"
          style={{ background: v['--space-accent'], boxShadow: `0 0 6px ${v['--space-accent-glow']}` }}
        />
        {active && (
          <span
            className="absolute top-1 right-1 size-3.5 rounded-full flex items-center justify-center"
            style={{ background: v['--space-accent'] }}
          >
            <Check className="size-2.5" strokeWidth={3} style={{ color: v['--space-bg-base'] }} />
          </span>
        )}
      </div>
      {/* Label */}
      <span className="text-[10px] font-semibold leading-none px-0.5 text-[var(--space-text-primary)]">
        {theme.label}
      </span>
    </button>
  )
}

const MODE_ORDER: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
]

export function ThemeSwitcher() {
  const { themeId, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = THEMES[themeId] ?? THEME_LIST[0]

  return (
    <div ref={ref} className="relative">
      {/* Trigger — shows the current theme so it's always obvious which is active */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--space-border)] transition-all duration-200 hover:bg-[var(--space-bg-card-hover)] active:scale-95"
        style={{ background: open ? 'var(--space-bg-card-hover)' : 'transparent' }}
        aria-label="Switch theme"
        aria-expanded={open}
      >
        <span
          className="size-2.5 rounded-full flex-shrink-0 ring-1 ring-[var(--space-border-hard)]"
          style={{ background: current.swatch }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--space-nav-fg-dim)] hidden sm:block">
          {current.label}
        </span>
        <Palette className="size-3.5 text-[var(--space-nav-fg-dim)] sm:hidden" />
      </button>

      {/* Popover — opens downward since the switcher lives in the top header */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-72 rounded-2xl p-2.5 z-50"
          style={{
            background: 'var(--space-bg-card)',
            border: '1px solid var(--space-border-hard)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.15)',
            animation: 'themeFadeIn 160ms cubic-bezier(0.22,1,0.36,1) forwards',
          }}
        >
          <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--space-text-tertiary)] font-semibold px-1 pb-1">
            Theme
          </p>
          {MODE_ORDER.map(({ mode, label }) => {
            const themes = THEME_LIST.filter((t) => t.mode === mode)
            if (themes.length === 0) return null
            return (
              <div key={mode} className="mt-1.5">
                <p className="text-[8px] uppercase tracking-[0.2em] text-[var(--space-text-muted)] font-semibold px-1 pb-1.5">
                  {label}
                </p>
                <div className={cn('grid grid-cols-3 gap-1.5')}>
                  {themes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      active={theme.id === themeId}
                      onSelect={() => {
                        setTheme(theme.id)
                        setOpen(false)
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes themeFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  )
}
