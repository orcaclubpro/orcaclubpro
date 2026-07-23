// ─────────────────────────────────────────────────────────────────────────────
// SPACES dashboard theme registry — the single source of truth.
//
// Adding a theme = add ONE `defineTheme({...})` entry to THEME_LIST below.
// Everything else derives from it automatically:
//   • Payload's `dashboardTheme` dropdown  → themeSelectOptions()
//   • The ThemeSwitcher preview cards       → THEME_LIST / theme.vars
//   • The runtime + Payload default         → DEFAULT_THEME
//
// `defineTheme` expands a short spec (accent + base bg + mode) into the full
// `--space-*` variable set using shared light/dark defaults. Override any single
// variable via `overrides` when a theme needs to deviate.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark'

/** A theme id — kept as a plain string so adding a theme never requires editing a union type. */
export type ThemeId = string

/** The complete set of CSS custom properties every theme provides. */
export interface ThemeVars {
  '--space-accent': string        // Primary accent hex
  '--space-accent-rgb': string    // "R, G, B" (for rgba() composition)
  '--space-accent-dim': string    // Dimmer accent for inactive/muted states
  '--space-accent-glow': string   // rgba string for glow effects
  '--space-accent-soft': string   // rgba string for soft bg tint (cards, pills)
  '--space-bg-base': string       // Base page background
  '--space-bg-surface': string    // Subtle surface tint
  '--space-nav-bg': string        // Nav glassmorphism bg (rgba)
  '--space-border': string        // Default hairline border (rgba)
  '--space-text-primary': string    // Primary text
  '--space-text-secondary': string  // Secondary text
  '--space-text-tertiary': string   // Tertiary text (labels, captions)
  '--space-text-muted': string      // Muted text (timestamps, placeholders)
  '--space-bg-card': string         // Card background
  '--space-bg-card-hover': string   // Card hover background
  '--space-border-hard': string     // Solid border / divider
  '--space-divider': string         // Internal divider / progress track
  '--space-nav-fg': string          // Nav active text
  '--space-nav-fg-dim': string      // Nav inactive text
}

export interface ThemeDefinition {
  id: ThemeId
  label: string
  description: string
  mode: ThemeMode
  swatch: string // accent color, surfaced to the switcher dots
  vars: ThemeVars
}

// ─── Shared extended defaults (text / cards / borders per mode) ──────────────

const DARK_EXTENDED = {
  '--space-text-primary': '#F0F0F0',
  '--space-text-secondary': '#6B6B6B',
  '--space-text-tertiary': '#A0A0A0',
  '--space-text-muted': '#4A4A4A',
  '--space-bg-card': '#252525',
  '--space-bg-card-hover': '#2D2D2D',
  '--space-border-hard': '#404040',
  '--space-divider': '#333333',
  '--space-nav-fg': '#ffffff',
  '--space-nav-fg-dim': 'rgba(255, 255, 255, 0.40)',
} as const

// Warm-paper light defaults, tuned to match the Sonar (blog) design language.
const LIGHT_EXTENDED = {
  '--space-text-primary': '#15191b', // ink
  '--space-text-secondary': '#565c5e', // ink-soft
  '--space-text-tertiary': '#8b8f8a',
  '--space-text-muted': '#adaba2',
  '--space-bg-card': '#fbfaf6', // panel
  '--space-bg-card-hover': '#eae9e1', // hover
  '--space-border-hard': '#d3d2ca', // faint
  '--space-divider': '#e2e1da', // hair
  '--space-nav-fg': '#15191b',
  '--space-nav-fg-dim': 'rgba(21, 25, 27, 0.45)',
} as const

// ─── defineTheme: short spec → full ThemeDefinition ──────────────────────────

interface DefineThemeInput {
  id: ThemeId
  label: string
  description: string
  mode: ThemeMode
  /** Primary accent, hex. */
  accent: string
  /** Accent as "R, G, B" — used to derive glow/soft tints. */
  accentRgb: string
  /** Base page background, hex (nav bg is derived from it). */
  bgBase: string
  // Optional fine-tuning — sensible defaults are derived when omitted.
  accentDim?: string
  accentGlow?: string
  accentSoft?: string
  bgSurface?: string
  navBg?: string
  border?: string
  /** Override any individual --space-* variable. */
  overrides?: Partial<ThemeVars>
}

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function defineTheme(input: DefineThemeInput): ThemeDefinition {
  const { mode, accent, accentRgb, bgBase } = input
  const isDark = mode === 'dark'
  const extended = isDark ? DARK_EXTENDED : LIGHT_EXTENDED

  const vars: ThemeVars = {
    '--space-accent': accent,
    '--space-accent-rgb': accentRgb,
    '--space-accent-dim': input.accentDim ?? accent,
    '--space-accent-glow': input.accentGlow ?? `rgba(${accentRgb}, ${isDark ? 0.4 : 0.15})`,
    '--space-accent-soft': input.accentSoft ?? `rgba(${accentRgb}, ${isDark ? 0.06 : 0.08})`,
    '--space-bg-base': bgBase,
    '--space-bg-surface':
      input.bgSurface ?? (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(21, 25, 27, 0.02)'),
    '--space-nav-bg': input.navBg ?? hexToRgba(bgBase, isDark ? 0.85 : 0.92),
    '--space-border': input.border ?? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(21, 25, 27, 0.09)'),
    ...extended,
    ...(input.overrides ?? {}),
  }

  return {
    id: input.id,
    label: input.label,
    description: input.description,
    mode,
    swatch: accent,
    vars,
  }
}

// ─── The registry — order here is the order shown in the switcher ────────────

export const THEME_LIST: ThemeDefinition[] = [
  // ── Light ──
  defineTheme({
    id: 'sonar',
    label: 'Sonar',
    description: 'Warm editorial paper — matches the blog',
    mode: 'light',
    accent: '#0e7c86',
    accentRgb: '14, 124, 134',
    accentDim: '#0b616a',
    accentGlow: 'rgba(14, 110, 110, 0.13)',
    accentSoft: 'rgba(14, 110, 110, 0.09)',
    bgBase: '#f1f0ea', // paper
    border: '#e2e1da', // hair
  }),
  defineTheme({
    id: 'light',
    label: 'Light',
    description: 'Crisp neutral white with precision cyan',
    mode: 'light',
    accent: '#0284c7',
    accentRgb: '2, 132, 199',
    accentDim: '#0369a1',
    bgBase: '#f5f5f5',
    overrides: {
      '--space-bg-card': '#ffffff',
      '--space-bg-card-hover': '#f2f2f2',
      '--space-text-primary': '#0a0a0a',
      '--space-text-secondary': '#262626',
      '--space-text-tertiary': '#525252',
      '--space-text-muted': '#8a8a8a',
      '--space-border-hard': '#c9c9c9',
      '--space-divider': '#e2e2e2',
      '--space-nav-fg': '#0a0a0a',
      '--space-nav-fg-dim': 'rgba(10, 10, 10, 0.45)',
    },
  }),
  // ── Dark ──
  defineTheme({
    id: 'paper',
    label: 'Charcoal',
    description: 'Dark charcoal with muted slate blue',
    mode: 'dark',
    accent: '#8B9CB6',
    accentRgb: '139, 156, 182',
    accentDim: '#6B7F9A',
    accentGlow: 'rgba(139, 156, 182, 0.20)',
    accentSoft: 'rgba(139, 156, 182, 0.08)',
    bgBase: '#1C1C1C',
    bgSurface: 'rgba(255, 255, 255, 0.04)',
    navBg: 'rgba(34, 34, 34, 0.96)',
  }),
]

// ─── Derived lookups (do not edit — everything comes from THEME_LIST) ────────

/** The theme new users land on, and the runtime fallback when none is saved. */
export const DEFAULT_THEME: ThemeId = 'sonar'

export const THEMES: Record<ThemeId, ThemeDefinition> = Object.fromEntries(
  THEME_LIST.map((t) => [t.id, t]),
)

export function isThemeId(id: unknown): id is ThemeId {
  return typeof id === 'string' && id in THEMES
}

/** Payload `select` options generated from the registry. */
export function themeSelectOptions(): { label: string; value: ThemeId }[] {
  return THEME_LIST.map((t) => ({
    label: t.id === DEFAULT_THEME ? `${t.label} (Default)` : t.label,
    value: t.id,
  }))
}
