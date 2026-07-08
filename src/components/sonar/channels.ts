// SONAR channels + format routing (Phase 1 — static).
// In Phase 2 this becomes a `sonar-channels` collection + a `format` field.

export type SonarFormat = 'decode' | 'brief' | 'fieldnote'

export interface SonarChannel {
  slug: string
  name: string
  group: 'channels' | 'studio'
  /** freshness readout shown in the spine; '' = quiet */
  signal?: string
  star?: boolean
  /** one-line description of what the channel covers (used on the Desk hub) */
  blurb: string
  /** per-channel identity accent so each reads as its own hub (light / deep) */
  accent: string
  accentDeep: string
  /** live signal strength 0–5, drives the console meter + row ranking */
  signalLevel: number
}

export const CHANNELS: SonarChannel[] = [
  {
    slug: 'ai',
    name: 'AI',
    group: 'channels',
    signal: '2',
    blurb: 'Models, tooling & findings — the frontier, decoded.',
    accent: '#0e7c86',
    accentDeep: '#46d3da',
    signalLevel: 4,
  },
  {
    slug: 'markets',
    name: 'Markets',
    group: 'channels',
    signal: '1',
    blurb: 'AI × money — the catalysts, and what’s investable.',
    accent: '#9b7a2f',
    accentDeep: '#d9b85e',
    signalLevel: 3,
  },
  {
    slug: 'research',
    name: 'Research',
    group: 'channels',
    signal: '',
    blurb: 'Technical deep-dives — the papers, decoded.',
    accent: '#3e5c99',
    accentDeep: '#7fa0db',
    signalLevel: 2,
  },
  {
    slug: 'field-notes',
    name: 'Field Notes',
    group: 'studio',
    star: true,
    blurb: 'What we’re actually building — the case study, as content.',
    accent: '#a85641',
    accentDeep: '#db8e74',
    signalLevel: 4,
  },
]

/** Which reading template a channel's articles render with. */
export const CHANNEL_FORMAT: Record<string, SonarFormat> = {
  ai: 'decode',
  research: 'decode',
  markets: 'brief',
  'field-notes': 'fieldnote',
}

export function channelName(slug: string): string {
  return CHANNELS.find((c) => c.slug === slug)?.name ?? slug
}
