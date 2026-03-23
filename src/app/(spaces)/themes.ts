export type ThemeId = 'paper' | 'void' | 'arctic' | 'ember' | 'emerald' | 'dusk' | 'chrome' | 'light'

export interface ThemeDefinition {
  id: ThemeId
  label: string
  description: string
  // CSS variable values (without the var() wrapper)
  vars: {
    '--space-accent': string        // Primary accent hex (replaces #67e8f9)
    '--space-accent-rgb': string    // R, G, B values (for rgba() usage)
    '--space-accent-dim': string    // Dimmer version for inactive/muted states
    '--space-accent-glow': string   // rgba string for glow effects
    '--space-accent-soft': string   // rgba string for soft bg tint (cards, pills)
    '--space-bg-base': string       // Base background (replaces pure #000)
    '--space-bg-surface': string    // Card/surface background
    '--space-nav-bg': string        // MobileBottomNav glassmorphism bg rgba
    '--space-border': string        // Default border rgba
    // Extended theme variables (replaces hard-coded component colors)
    '--space-text-primary': string    // Primary text (#F0F0F0 dark / #111111 light)
    '--space-text-secondary': string  // Secondary text (#6B6B6B dark / #666666 light)
    '--space-text-tertiary': string   // Tertiary text (#A0A0A0 dark / #888888 light)
    '--space-text-muted': string      // Muted text (#4A4A4A dark / #aaaaaa light)
    '--space-bg-card': string         // Card background (#252525 dark / #ffffff light)
    '--space-bg-card-hover': string   // Card hover bg (#2D2D2D dark / #f0f0f0 light)
    '--space-border-hard': string     // Solid border (#404040 dark / #e0e0e0 light)
    '--space-divider': string         // Divider/progress track (#333333 dark / #e8e8e8 light)
    '--space-nav-fg': string          // Nav active text (#ffffff dark / #111111 light)
    '--space-nav-fg-dim': string      // Nav inactive text (rgba white/40 dark / rgba black/40 light)
  }
}

// Shared dark-theme base values for the extended variables
const DARK_EXTENDED = {
  '--space-text-primary':   '#F0F0F0',
  '--space-text-secondary': '#6B6B6B',
  '--space-text-tertiary':  '#A0A0A0',
  '--space-text-muted':     '#4A4A4A',
  '--space-bg-card':        '#252525',
  '--space-bg-card-hover':  '#2D2D2D',
  '--space-border-hard':    '#404040',
  '--space-divider':        '#333333',
  '--space-nav-fg':         '#ffffff',
  '--space-nav-fg-dim':     'rgba(255, 255, 255, 0.40)',
} as const

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  paper: {
    id: 'paper',
    label: 'Charcoal',
    description: 'Dark charcoal with muted slate blue accent',
    vars: {
      '--space-accent': '#8B9CB6',
      '--space-accent-rgb': '139, 156, 182',
      '--space-accent-dim': '#6B7F9A',
      '--space-accent-glow': 'rgba(139, 156, 182, 0.20)',
      '--space-accent-soft': 'rgba(139, 156, 182, 0.08)',
      '--space-bg-base': '#1C1C1C',
      '--space-bg-surface': 'rgba(255, 255, 255, 0.04)',
      '--space-nav-bg': 'rgba(34, 34, 34, 0.96)',
      '--space-border': 'rgba(255, 255, 255, 0.08)',
      ...DARK_EXTENDED,
    },
  },
  void: {
    id: 'void',
    label: 'Void',
    description: 'Pure black with intelligence cyan',
    vars: {
      '--space-accent': '#67e8f9',
      '--space-accent-rgb': '103, 232, 249',
      '--space-accent-dim': '#22d3ee',
      '--space-accent-glow': 'rgba(103, 232, 249, 0.45)',
      '--space-accent-soft': 'rgba(103, 232, 249, 0.06)',
      '--space-bg-base': '#000000',
      '--space-bg-surface': 'rgba(255,255,255,0.03)',
      '--space-nav-bg': 'rgba(6, 6, 10, 0.82)',
      '--space-border': 'rgba(255,255,255,0.08)',
      ...DARK_EXTENDED,
    },
  },
  arctic: {
    id: 'arctic',
    label: 'Arctic',
    description: 'Deep navy with ice blue',
    vars: {
      '--space-accent': '#7dd3fc',
      '--space-accent-rgb': '125, 211, 252',
      '--space-accent-dim': '#38bdf8',
      '--space-accent-glow': 'rgba(125, 211, 252, 0.4)',
      '--space-accent-soft': 'rgba(125, 211, 252, 0.06)',
      '--space-bg-base': '#050a14',
      '--space-bg-surface': 'rgba(125,211,252,0.02)',
      '--space-nav-bg': 'rgba(4, 8, 20, 0.85)',
      '--space-border': 'rgba(125,211,252,0.08)',
      ...DARK_EXTENDED,
    },
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    description: 'Dark charcoal with warm amber',
    vars: {
      '--space-accent': '#fbbf24',
      '--space-accent-rgb': '251, 191, 36',
      '--space-accent-dim': '#f59e0b',
      '--space-accent-glow': 'rgba(251, 191, 36, 0.4)',
      '--space-accent-soft': 'rgba(251, 191, 36, 0.06)',
      '--space-bg-base': '#0c0800',
      '--space-bg-surface': 'rgba(251,191,36,0.02)',
      '--space-nav-bg': 'rgba(12, 8, 0, 0.85)',
      '--space-border': 'rgba(251,191,36,0.08)',
      ...DARK_EXTENDED,
    },
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    description: 'Deep forest with bright green',
    vars: {
      '--space-accent': '#34d399',
      '--space-accent-rgb': '52, 211, 153',
      '--space-accent-dim': '#10b981',
      '--space-accent-glow': 'rgba(52, 211, 153, 0.4)',
      '--space-accent-soft': 'rgba(52, 211, 153, 0.06)',
      '--space-bg-base': '#020a05',
      '--space-bg-surface': 'rgba(52,211,153,0.02)',
      '--space-nav-bg': 'rgba(2, 8, 4, 0.85)',
      '--space-border': 'rgba(52,211,153,0.08)',
      ...DARK_EXTENDED,
    },
  },
  dusk: {
    id: 'dusk',
    label: 'Dusk',
    description: 'Deep indigo with violet glow',
    vars: {
      '--space-accent': '#a78bfa',
      '--space-accent-rgb': '167, 139, 250',
      '--space-accent-dim': '#8b5cf6',
      '--space-accent-glow': 'rgba(167, 139, 250, 0.4)',
      '--space-accent-soft': 'rgba(167, 139, 250, 0.06)',
      '--space-bg-base': '#06030f',
      '--space-bg-surface': 'rgba(167,139,250,0.02)',
      '--space-nav-bg': 'rgba(6, 3, 15, 0.85)',
      '--space-border': 'rgba(167,139,250,0.08)',
      ...DARK_EXTENDED,
    },
  },
  chrome: {
    id: 'chrome',
    label: 'Chrome',
    description: 'Near-black with silver shimmer',
    vars: {
      '--space-accent': '#e2e8f0',
      '--space-accent-rgb': '226, 232, 240',
      '--space-accent-dim': '#cbd5e1',
      '--space-accent-glow': 'rgba(226, 232, 240, 0.35)',
      '--space-accent-soft': 'rgba(226, 232, 240, 0.05)',
      '--space-bg-base': '#080808',
      '--space-bg-surface': 'rgba(226,232,240,0.02)',
      '--space-nav-bg': 'rgba(8, 8, 8, 0.85)',
      '--space-border': 'rgba(226,232,240,0.07)',
      ...DARK_EXTENDED,
    },
  },
  light: {
    id: 'light',
    label: 'Light',
    description: 'Swiss editorial — pure white, near-black, precision cyan',
    vars: {
      // Accent: confident cyan — clear, professional, distinctive
      '--space-accent': '#0284c7',
      '--space-accent-rgb': '2, 132, 199',
      '--space-accent-dim': '#0369a1',
      '--space-accent-glow': 'rgba(2, 132, 199, 0.18)',
      '--space-accent-soft': 'rgba(2, 132, 199, 0.07)',
      // Backgrounds: cool neutral base, pure white surfaces
      '--space-bg-base': '#f5f5f5',
      '--space-bg-surface': 'rgba(0, 0, 0, 0.025)',
      '--space-nav-bg': 'rgba(245, 245, 245, 0.97)',
      // Default border: subtle but present — enough structure without noise
      '--space-border': 'rgba(0, 0, 0, 0.10)',
      // Text: near-black hierarchy — strong, readable at every level
      '--space-text-primary':   '#0a0a0a',  // near-black — softer than pure #000, still dominant
      '--space-text-secondary': '#262626',  // dark — clearly subordinate but authoritative
      '--space-text-tertiary':  '#525252',  // mid — labels, captions, clearly tertiary
      '--space-text-muted':     '#8a8a8a',  // muted — timestamps, placeholders, still legible
      // Card surfaces
      '--space-bg-card':        '#ffffff',
      '--space-bg-card-hover':  '#f2f2f2',  // perceptible but calm hover
      // Borders: near-black for strong outlines, mid-gray for internal dividers
      '--space-border-hard':    '#111111',  // near-black borders — intentional, premium
      '--space-divider':        '#d4d4d4',  // light internal separator
      // Nav: full opacity near-black active, 45% dim for inactive
      '--space-nav-fg':         '#0a0a0a',
      '--space-nav-fg-dim':     'rgba(10, 10, 10, 0.45)',
    },
  },
}

export const DEFAULT_THEME: ThemeId = 'paper'
