import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Currency without cents — e.g. $1,234 */
export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

/** Currency with cents — e.g. $1,234.56 */
export const fmtCurrencyFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

/** Short date with year — e.g. "Jan 1, 2025". Use for full ISO datetime strings. */
export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))

/** Month + year — e.g. "January 2025" */
export const fmtMonthYear = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(iso))

/**
 * Timezone-safe date for schedule entries stored as "YYYY-MM-DD".
 * Parses date parts directly to avoid UTC→local offset issues.
 * Returns "Jan 1" format (no year, since schedule items are near-term).
 */
export function fmtScheduleDate(iso: string): string {
  const parts = iso.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return iso
  const [y, m, d] = parts
  const dt = new Date(y, m - 1, d)
  if (!isFinite(dt.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(dt)
}

// ─── isDueSoon ────────────────────────────────────────────────────────────────

/**
 * Returns true if the given date-only string ("YYYY-MM-DD") falls within
 * `days` days from today (default: 30). Timezone-safe.
 */
export function isDueSoon(dueDate: string | null | undefined, days = 30): boolean {
  if (!dueDate) return false
  const parts = dueDate.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return false
  const due = new Date(parts[0], parts[1] - 1, parts[2])
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + days)
  return due <= cutoff
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export type OrderStatusKey = 'paid' | 'pending' | 'cancelled'

export type ClientOrderSummary = {
  id: string
  orderNumber: string | null
  title?: string | null
  amount: number
  status: OrderStatusKey
  createdAt: string
  stripeInvoiceUrl?: string | null
}

export type ScheduledEntry = {
  id: string
  label: string
  amount: number
  dueDate?: string | null
  orderId?: string | null
}

export type ScheduledPackage = {
  id: string
  name: string
  paymentSchedule?: ScheduledEntry[]
}

// ─── Order status config ──────────────────────────────────────────────────────

export type OrderStatusCfg = {
  label: string
  icon: LucideIcon
  /** For icon-based displays (ClientInvoiceTimeline compact list) */
  iconColor: string
  /** For dot-based displays (OrdersView vertical timeline) */
  dotClass: string
  badgeClass: string
  /** Amount text color */
  amountClass: string
  /** Invoice card border */
  cardClass: string
  /** Vertical connector line color */
  lineClass: string
  /** Invoice title color */
  titleClass: string
}

export const ORDER_STATUS_CFG: Record<OrderStatusKey, OrderStatusCfg> = {
  paid: {
    label: 'Paid',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    dotClass: 'bg-emerald-400',
    badgeClass: 'text-emerald-400 bg-emerald-400/[0.07] border-emerald-400/20',
    amountClass: 'text-white',
    cardClass: 'border-white/[0.08] hover:border-white/[0.13]',
    lineClass: 'bg-emerald-400/20',
    titleClass: 'text-white',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    iconColor: 'text-amber-400',
    dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]',
    badgeClass: 'text-amber-400 bg-amber-400/[0.07] border-amber-400/20',
    amountClass: 'text-amber-400',
    cardClass: 'border-amber-400/20 hover:border-amber-400/30',
    lineClass: 'bg-amber-400/30',
    titleClass: 'text-white',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    iconColor: 'text-red-400/60',
    dotClass: 'bg-white/20',
    badgeClass: 'text-gray-600 bg-white/[0.03] border-white/[0.08]',
    amountClass: 'text-gray-600 line-through',
    cardClass: 'border-white/[0.05] hover:border-white/[0.08]',
    lineClass: 'bg-white/[0.07]',
    titleClass: 'text-gray-500',
  },
}

// ─── Project status config ────────────────────────────────────────────────────

export const PROJECT_STATUS_CFG = {
  'in-progress': {
    label: 'In Progress',
    stripe: 'bg-cyan-400',
    dot: 'bg-cyan-400',
    color: 'text-cyan-400',
    badgeClasses: 'text-cyan-400 bg-cyan-400/[0.07] border border-cyan-400/20',
    ringColor: 'rgb(34,211,238)',
  },
  pending: {
    label: 'Pending',
    stripe: 'bg-yellow-400',
    dot: 'bg-yellow-400',
    color: 'text-yellow-400',
    badgeClasses: 'text-yellow-400 bg-yellow-400/[0.07] border border-yellow-400/20',
    ringColor: 'rgb(250,204,21)',
  },
  'on-hold': {
    label: 'On Hold',
    stripe: 'bg-orange-400',
    dot: 'bg-orange-400',
    color: 'text-orange-400',
    badgeClasses: 'text-orange-400 bg-orange-400/[0.07] border border-orange-400/20',
    ringColor: 'rgb(251,146,60)',
  },
  completed: {
    label: 'Completed',
    stripe: 'bg-emerald-400',
    dot: 'bg-emerald-400',
    color: 'text-emerald-400',
    badgeClasses: 'text-emerald-400 bg-emerald-400/[0.07] border border-emerald-400/20',
    ringColor: 'rgb(52,211,153)',
  },
  cancelled: {
    label: 'Cancelled',
    stripe: 'bg-red-400/60',
    dot: 'bg-red-400',
    color: 'text-red-400',
    badgeClasses: 'text-red-400 bg-red-400/[0.07] border border-red-400/20',
    ringColor: 'rgb(248,113,113)',
  },
} as const

// ─── Sprint status config ─────────────────────────────────────────────────────

export const SPRINT_STATUS_CFG = {
  pending: {
    label: 'Pending',
    dot: 'bg-gray-500',
    color: 'text-gray-400',
    badgeClasses: 'text-gray-400 bg-gray-400/[0.07] border border-gray-400/20',
    bar: 'bg-gray-500/60',
  },
  'in-progress': {
    label: 'In Progress',
    dot: 'bg-[#67e8f9]',
    color: 'text-[#67e8f9]',
    badgeClasses: 'text-[#67e8f9] bg-[#67e8f9]/[0.07] border border-[#67e8f9]/20',
    bar: 'bg-[#67e8f9]/70',
  },
  delayed: {
    label: 'Delayed',
    dot: 'bg-yellow-400',
    color: 'text-yellow-400',
    badgeClasses: 'text-yellow-400 bg-yellow-400/[0.07] border border-yellow-400/20',
    bar: 'bg-yellow-400/70',
  },
  finished: {
    label: 'Finished',
    dot: 'bg-emerald-400',
    color: 'text-emerald-400',
    badgeClasses: 'text-emerald-400 bg-emerald-400/[0.07] border border-emerald-400/20',
    bar: 'bg-emerald-400/70',
  },
} as const

// ─── Task status config ───────────────────────────────────────────────────────

export const TASK_STATUS_CFG = {
  pending: {
    label: 'Pending',
    dot: 'bg-gray-500',
    color: 'text-gray-400',
  },
  'in-progress': {
    label: 'In Progress',
    dot: 'bg-[#67e8f9]',
    color: 'text-[#67e8f9]',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-400',
    color: 'text-emerald-400',
  },
  blocked: {
    label: 'Blocked',
    dot: 'bg-red-400',
    color: 'text-red-400',
  },
} as const
