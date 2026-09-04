// Shared types and math for the package proposal UI — the summary cards in
// ClientPackagesTab and the full detail page both read from here so a pricing
// or schedule rule only ever has one definition.

export type Frequency = 'monthly' | 'biweekly' | 'weekly' | 'custom'

export interface LineItem {
  name: string
  description?: string | null
  price: number
  adjustedPrice?: number | null
  quantity?: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
  /** When true, this line is an optional add-on the client can request — excluded
   *  from the proposal total. Undefined on older docs is treated as included. */
  isAddOn?: boolean
}

export interface ScheduledEntry {
  id: string
  label: string
  amount: number
  dueDate?: string | null
  orderId?: string | null
  invoicedAt?: string | null
}

export interface PackageDoc {
  id: string
  name: string
  description?: string | null
  coverMessage?: string | null
  notes?: string | null
  status: string
  lineItems?: LineItem[]
  requestedItems?: Array<{ name: string; requestedAt?: string }>
  paymentSchedule?: ScheduledEntry[]
  projectRef?: string | { id: string; name: string } | null
  createdAt: string
}

export interface PackageOrderSummary {
  id: string
  orderNumber?: string | null
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  invoiceType?: string | null
  invoiceNote?: string | null
  stripeInvoiceUrl?: string | null
  createdAt: string
}

export function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function fmtExact(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

/** Totals for exactly the items handed in — callers filter add-ons out first,
 *  because whether an add-on counts depends on the caller, not the math. */
export function computeTotals(lineItems: LineItem[] = []) {
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const total = (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1)
    if (item.isRecurring) {
      if (item.recurringInterval === 'year') annual += total
      else monthly += total
    } else {
      oneTime += total
    }
  }
  return { oneTime, monthly, annual }
}

/** Generate installment due dates from a start date and frequency.
 *  When `startAtDate` is true (deposit is set), installment 1 falls ON the
 *  start date (offset = i).  Without a deposit the start date is treated as
 *  the period anchor and installment 1 falls one period later (offset = i+1). */
export function generateInstallmentDates(
  startDate: string,
  count: number,
  frequency: Frequency,
  startAtDate = false,
): string[] {
  if (!startDate || count === 0 || frequency === 'custom') return Array(count).fill('')
  const [y, m, d] = startDate.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const offset = startAtDate ? i : i + 1
    let date: Date
    if (frequency === 'monthly') {
      date = new Date(y, m - 1 + offset, d)
    } else if (frequency === 'biweekly') {
      date = new Date(y, m - 1, d + 14 * offset)
    } else {
      // weekly
      date = new Date(y, m - 1, d + 7 * offset)
    }
    const yy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
  })
}

/** Compute installment amounts — last one absorbs rounding. */
export function computeInstallmentAmounts(remaining: number, count: number): number[] {
  if (count <= 0 || remaining <= 0) return Array(count).fill(0)
  const base = Math.floor((remaining / count) * 100) / 100
  const last = Math.round((remaining - base * (count - 1)) * 100) / 100
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? last : base))
}

export function formatDisplayDate(isoDate: string) {
  if (!isoDate) return ''
  // split('T')[0] strips time — Payload stores date fields as full ISO strings
  const parts = isoDate.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return ''
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  if (!isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

/** Label for installment `i` of `count` — Balance when there is only one. */
export function installmentLabel(i: number, count: number) {
  if (count === 1) return 'Balance'
  return i === count - 1 ? 'Final Payment' : `Installment ${i + 1}`
}

export function statusStyle(status?: string) {
  switch (status) {
    case 'accepted': return 'text-emerald-400 border-emerald-400/25 bg-emerald-400/10'
    case 'sent':     return 'text-[var(--space-accent)] border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.10)]'
    case 'archived': return 'text-[var(--space-text-muted)] border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.02)]'
    default:         return 'text-amber-400/80 border-amber-400/20 bg-amber-400/[0.06]'
  }
}
