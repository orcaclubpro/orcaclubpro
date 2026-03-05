export type ThemeId = 'void' | 'arctic' | 'ember' | 'emerald' | 'dusk' | 'chrome'

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
  }
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
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
    },
  },
}

export const DEFAULT_THEME: ThemeId = 'void'
