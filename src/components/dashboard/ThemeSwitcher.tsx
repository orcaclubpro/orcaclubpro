'use client'

import { useState, useRef, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { useTheme } from '@/app/(spaces)/ThemeContext'
import { THEMES, type ThemeId } from '@/app/(spaces)/themes'
import { cn } from '@/lib/utils'

const THEME_SWATCHES: Record<ThemeId, string> = {
  paper:   '#8B9CB6',
  void:    '#67e8f9',
  arctic:  '#7dd3fc',
  ember:   '#fbbf24',
  emerald: '#34d399',
  dusk:    '#a78bfa',
  chrome:  '#e2e8f0',
}

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

  const current = THEMES[themeId]

  return (
    <div ref={ref} className="relative">
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.12] transition-all duration-200 hover:bg-white/[0.08] active:scale-95"
        style={{ background: open ? 'rgba(255,255,255,0.08)' : 'transparent' }}
        aria-label="Switch theme"
      >
        {/* Accent swatch dot */}
        <span
          className="size-2.5 rounded-full flex-shrink-0 ring-1 ring-white/20"
          style={{ background: THEME_SWATCHES[themeId] }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60 hidden sm:block">
          {current.label}
        </span>
        <Palette className="size-3.5 text-white/60 sm:hidden" />
      </button>

      {/* Popover — opens downward since switcher is in the top header */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-64 rounded-2xl p-2 z-50"
          style={{
            background: '#252525',
            border: '1px solid var(--space-border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.20)',
            animation: 'themeFadeIn 160ms cubic-bezier(0.22,1,0.36,1) forwards',
          }}
        >
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#6B6B6B] font-semibold px-2 pt-1 pb-2">
            Color Preset
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(THEMES).map((theme) => {
              const active = theme.id === themeId
              return (
                <button
                  key={theme.id}
                  onClick={() => { setTheme(theme.id); setOpen(false) }}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-150 active:scale-95',
                    active ? 'bg-[#2D2D2D]' : 'hover:bg-[#2D2D2D]',
                  )}
                  style={active ? { boxShadow: `0 0 0 1px ${THEME_SWATCHES[theme.id]}30` } : undefined}
                >
                  <span
                    className="size-5 rounded-full flex-shrink-0 ring-1 ring-white/20"
                    style={{
                      background: THEME_SWATCHES[theme.id],
                      boxShadow: active ? `0 0 8px ${THEME_SWATCHES[theme.id]}60` : 'none',
                    }}
                  />
                  <div>
                    <p className="text-[11px] font-semibold text-[#F0F0F0] leading-none mb-0.5">{theme.label}</p>
                    <p className="text-[9px] text-[#6B6B6B] leading-none">{theme.description}</p>
                  </div>
                  {active && (
                    <span
                      className="ml-auto size-1.5 rounded-full flex-shrink-0"
                      style={{ background: THEME_SWATCHES[theme.id] }}
                    />
                  )}
                </button>
              )
            })}
          </div>
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
