// ─── Status vocabulary for the portal ────────────────────────────────────────
// Every status colour in (spaces) resolves through this module, and every
// colour it hands back is a --space-status-* token from the theme registry.
// Raw Tailwind palette classes (amber-400, emerald-400, …) must not appear in
// dashboard code: they are fixed dark-theme values and break `light`/`sonar`.

export type StatusTone = 'ok' | 'active' | 'warn' | 'hold' | 'danger' | 'idle'

export interface StatusMeta {
  tone: StatusTone
  label: string
}

/** Inline style values for a tone — foreground, soft fill, hairline. */
export interface ToneStyle {
  color: string
  background: string
  borderColor: string
}

export function toneStyle(tone: StatusTone): ToneStyle {
  return {
    color: `var(--space-status-${tone})`,
    background: `var(--space-status-${tone}-soft)`,
    borderColor: `var(--space-status-${tone}-line)`,
  }
}

/** Just the foreground — for dots, icons and bare text. */
export function toneColor(tone: StatusTone): string {
  return `var(--space-status-${tone})`
}

const IDLE: StatusMeta = { tone: 'idle', label: 'Unknown' }

function lookup(map: Record<string, StatusMeta>, key: string | null | undefined): StatusMeta {
  if (!key) return IDLE
  return map[key] ?? { tone: 'idle', label: key.replace(/-/g, ' ') }
}

// ─── Projects ────────────────────────────────────────────────────────────────

const PROJECT: Record<string, StatusMeta> = {
  active: { tone: 'ok', label: 'Active' },
  'in-progress': { tone: 'active', label: 'In progress' },
  pending: { tone: 'idle', label: 'Pending' },
  'on-hold': { tone: 'hold', label: 'On hold' },
  completed: { tone: 'ok', label: 'Completed' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
}

export const projectStatus = (s: string | null | undefined): StatusMeta => lookup(PROJECT, s)

// ─── Sprints ─────────────────────────────────────────────────────────────────

const SPRINT: Record<string, StatusMeta> = {
  pending: { tone: 'idle', label: 'Pending' },
  'in-progress': { tone: 'active', label: 'In progress' },
  delayed: { tone: 'warn', label: 'Delayed' },
  finished: { tone: 'ok', label: 'Finished' },
}

export const sprintStatus = (s: string | null | undefined): StatusMeta => lookup(SPRINT, s)

// ─── Orders / invoices ───────────────────────────────────────────────────────

const ORDER: Record<string, StatusMeta> = {
  pending: { tone: 'warn', label: 'Unpaid' },
  paid: { tone: 'ok', label: 'Paid' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
  refunded: { tone: 'idle', label: 'Refunded' },
}

export const orderStatus = (s: string | null | undefined): StatusMeta => lookup(ORDER, s)

// ─── Tasks ───────────────────────────────────────────────────────────────────

const TASK: Record<string, StatusMeta> = {
  pending: { tone: 'idle', label: 'To do' },
  'in-progress': { tone: 'active', label: 'In progress' },
  completed: { tone: 'ok', label: 'Done' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
}

export const taskStatus = (s: string | null | undefined): StatusMeta => lookup(TASK, s)
