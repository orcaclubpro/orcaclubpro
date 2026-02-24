'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronUp, Clock, CheckCircle, XCircle,
  Copy, CheckCheck, ExternalLink, CreditCard, Calendar,
  Receipt, Loader2, AlertTriangle, CalendarDays, Zap,
  Pencil, Plus, Trash2, X, Check, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { updateOrderDueDate, updateOrderLineItems, deleteOrder, markOrderAsPaid, type LineItemInput } from '@/actions/orders'

interface LineItem {
  title: string
  description?: string | null
  quantity?: number | null
  price: number
  isRecurring?: boolean | null
  recurringInterval?: 'month' | 'year' | null
}

export interface OrderDoc {
  id: string
  orderNumber: string
  status: 'pending' | 'paid' | 'cancelled'
  amount: number
  createdAt: string
  dueDate?: string | null
  stripeInvoiceId?: string | null
  stripeInvoiceUrl?: string | null
  lineItems?: LineItem[]
  projectRef?: { id: string; name: string } | string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(d: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(d))
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

const STATUS_CFG = {
  paid: {
    color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20',
    icon: CheckCircle, label: 'Paid',
  },
  pending: {
    color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20',
    icon: Clock, label: 'Pending',
  },
  cancelled: {
    color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20',
    icon: XCircle, label: 'Cancelled',
  },
}

// ── Due date editor ────────────────────────────────────────────────────────────

function DueDateEditor({
  orderId, dueDate, hasStripe,
}: {
  orderId: string
  dueDate: string | null | undefined
  hasStripe: boolean
}) {
  const [value, setValue]   = useState(toDateInputValue(dueDate))
  const [saving, setSaving] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const isDirty = value !== toDateInputValue(dueDate)

  async function handleSave() {
    setSaving(true); setWarning(null); setError(null); setSaved(false)
    const isoValue = value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null
    const result = await updateOrderDueDate(orderId, isoValue)
    setSaving(false)
    if (result.success) {
      setSaved(true)
      if (result.warning) setWarning(result.warning)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(result.error ?? 'Failed to save')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <input
            type="date"
            value={value}
            onChange={(e) => { setValue(e.target.value); setSaved(false); setWarning(null); setError(null) }}
            className={cn(
              'h-8 px-3 pr-8 text-xs rounded-lg border bg-transparent text-white',
              'focus:outline-none focus:ring-1 focus:ring-[#67e8f9]/40 [color-scheme:dark]',
              isDirty ? 'border-[#67e8f9]/30 bg-[#67e8f9]/[0.04]' : 'border-white/[0.08]',
            )}
          />
          <CalendarDays className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-gray-600" />
        </div>
        {isDirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-[#67e8f9] border border-[#67e8f9]/25 bg-[#67e8f9]/[0.04] rounded-lg hover:bg-[#67e8f9]/[0.12] disabled:opacity-50 transition-all"
          >
            {saving ? <><Loader2 className="size-3 animate-spin" /> Saving…</> : 'Save'}
          </button>
        )}
        {saved && !isDirty && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check className="size-3" />{warning ? 'Saved' : 'Saved & synced'}
          </span>
        )}
        {!value && !isDirty && <span className="text-xs text-gray-600">No due date set</span>}
        {hasStripe && !saving && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-600">
            <Zap className="size-3" />Syncs to Stripe
          </span>
        )}
      </div>
      {warning && (
        <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-400/[0.06] border border-amber-400/[0.15] rounded-lg px-3 py-2">
          <AlertTriangle className="size-3.5 shrink-0 mt-px" /><span>{warning}</span>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ── Line items editor ─────────────────────────────────────────────────────────

type EditItem = {
  title: string
  description: string
  quantity: number
  price: number
  isRecurring: boolean
  recurringInterval: 'month' | 'year' | ''
}

function itemsToEdit(items: LineItem[]): EditItem[] {
  return items.map((item) => ({
    title: item.title,
    description: item.description ?? '',
    quantity: item.quantity ?? 1,
    price: item.price,
    isRecurring: item.isRecurring ?? false,
    recurringInterval: (item.recurringInterval ?? '') as EditItem['recurringInterval'],
  }))
}

function LineItemsEditor({
  orderId,
  lineItems,
  hasStripe,
  onSaved,
}: {
  orderId: string
  lineItems: LineItem[]
  hasStripe: boolean
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [items, setItems]     = useState<EditItem[]>(itemsToEdit(lineItems))
  const [saving, setSaving]   = useState(false)
  const [synced, setSynced]   = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  function handleEdit() {
    setItems(itemsToEdit(lineItems))
    setWarning(null)
    setError(null)
    setSynced(false)
    setEditing(true)
  }

  function handleCancel() {
    setItems(itemsToEdit(lineItems))
    setEditing(false)
    setWarning(null)
    setError(null)
  }

  function updateItem(i: number, patch: Partial<EditItem>) {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  }

  function addItem() {
    setItems((prev) => [...prev, { title: '', description: '', quantity: 1, price: 0, isRecurring: false, recurringInterval: '' }])
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (items.some((it) => !it.title.trim())) {
      setError('Every line item must have a title.'); return
    }
    if (items.some((it) => it.price < 0 || it.quantity < 1)) {
      setError('Price must be ≥ 0 and quantity must be ≥ 1.'); return
    }

    setSaving(true); setWarning(null); setError(null); setSynced(false)

    const payload: LineItemInput[] = items.map((it) => ({
      title: it.title.trim(),
      description: it.description.trim() || null,
      quantity: it.quantity,
      price: it.price,
      isRecurring: it.isRecurring,
      recurringInterval: it.isRecurring && it.recurringInterval ? it.recurringInterval : null,
    }))

    const result = await updateOrderLineItems(orderId, payload)
    setSaving(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to save'); return
    }

    setSynced(result.synced ?? false)
    if (result.warning) setWarning(result.warning)
    setEditing(false)
    onSaved()
  }

  const editTotal = items.reduce((s, it) => s + it.price * (it.quantity || 1), 0)

  // ── Read mode ────────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
          {lineItems.map((item, i) => {
            const total = (item.price ?? 0) * (item.quantity ?? 1)
            return (
              <div key={i} className="flex items-start gap-4 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-snug">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {(item.quantity ?? 1) > 1 && (
                      <span className="text-[11px] text-gray-600">×{item.quantity}</span>
                    )}
                    {item.isRecurring && (
                      <span className="text-[10px] text-[#67e8f9]/60 bg-[#67e8f9]/[0.06] border border-[#67e8f9]/[0.15] rounded-full px-1.5 py-0.5 uppercase tracking-wide">
                        {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 pt-0.5">
                  <p className="text-sm font-bold font-mono text-white tabular-nums">
                    {fmt(total)}
                    {item.isRecurring && (
                      <span className="text-xs font-normal text-gray-500 font-sans">
                        /{item.recurringInterval === 'year' ? 'yr' : 'mo'}
                      </span>
                    )}
                  </p>
                  {(item.quantity ?? 1) > 1 && (
                    <p className="text-[10px] text-gray-600 mt-0.5">{fmt(item.price)} ea.</p>
                  )}
                </div>
              </div>
            )
          })}
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total</span>
            <span className="text-base font-bold text-white font-mono tabular-nums">
              {fmt(lineItems.reduce((s, it) => s + it.price * (it.quantity ?? 1), 0))}
            </span>
          </div>
        </div>

        {/* Edit trigger + sync status */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/[0.08] rounded-lg hover:text-white hover:border-white/[0.16] hover:bg-white/[0.03] transition-all"
          >
            <Pencil className="size-3" />Edit Items
          </button>
          {synced && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Sparkles className="size-3" />Synced to Stripe
            </span>
          )}
          {warning && (
            <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-400/[0.06] border border-amber-400/[0.15] rounded-lg px-3 py-2 flex-1">
              <AlertTriangle className="size-3.5 shrink-0 mt-px" /><span>{warning}</span>
            </div>
          )}
          {hasStripe && !warning && !synced && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-600">
              <Zap className="size-3" />Syncs to Stripe if draft
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Item rows */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3"
          >
            {/* Title row */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest w-4 shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
                placeholder="Item title"
                className="flex-1 h-8 px-3 text-sm bg-[#0a0a0a] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#67e8f9]/30"
              />
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(i)}
                  className="size-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Description */}
            <textarea
              value={item.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              placeholder="Description (optional — shown on invoice)"
              rows={2}
              className="w-full px-3 py-2 text-xs bg-[#0a0a0a] border border-white/[0.06] rounded-lg text-gray-300 placeholder:text-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-[#67e8f9]/30"
            />

            {/* Qty × Price = Total */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Qty</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-16 h-8 px-2 text-sm text-center bg-[#0a0a0a] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#67e8f9]/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <span className="text-gray-600 text-xs">×</span>

              <div className="flex items-center gap-1.5">
                <label className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Price</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-600">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.price}
                    onChange={(e) => updateItem(i, { price: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-28 h-8 pl-6 pr-3 text-sm bg-[#0a0a0a] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#67e8f9]/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <span className="text-gray-600 text-xs">=</span>

              <span className="text-sm font-bold text-white font-mono tabular-nums">
                {fmt(item.price * (item.quantity || 1))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add item */}
      <button
        onClick={addItem}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#67e8f9] transition-colors"
      >
        <Plus className="size-3.5" />Add item
      </button>

      {/* Running total */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">New Total</span>
        <span className="text-base font-bold text-white font-mono tabular-nums">{fmt(editTotal)}</span>
      </div>

      {/* Stripe note */}
      {hasStripe && (
        <p className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <Zap className="size-3" />
          Changes sync to Stripe only if the invoice is still a draft. Finalized invoices are updated in Payload only.
        </p>
      )}

      {/* Errors */}
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#67e8f9]/[0.10] border border-[#67e8f9]/30 text-[#67e8f9] rounded-lg hover:bg-[#67e8f9]/[0.18] disabled:opacity-50 transition-colors"
        >
          {saving ? <><Loader2 className="size-3 animate-spin" />Saving…</> : <>Save Changes</>}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Mark as paid button ────────────────────────────────────────────────────────

function MarkAsPaidButton({ orderId, onPaid }: { orderId: string; onPaid: () => void }) {
  const [confirm, setConfirm]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleClick() {
    if (!confirm) { setConfirm(true); return }
    setSaving(true)
    const result = await markOrderAsPaid(orderId)
    setSaving(false)
    if (!result.success) { setError(result.error ?? 'Failed'); return }
    onPaid()
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        onBlur={() => setTimeout(() => setConfirm(false), 200)}
        disabled={saving}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-50',
          confirm
            ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
            : 'text-gray-500 border-white/[0.08] hover:text-emerald-400 hover:border-emerald-500/30',
        )}
      >
        {saving ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3.5" />}
        {confirm ? 'Confirm payment' : 'Mark as Paid'}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  )
}

// ── Delete button ──────────────────────────────────────────────────────────────

function DeleteOrderButton({ orderId, onDeleted }: { orderId: string; onDeleted: () => void }) {
  const [confirm, setConfirm]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [warning, setWarning]   = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)
    const result = await deleteOrder(orderId)
    setDeleting(false)
    if (!result.success) { setError(result.error ?? 'Failed to delete'); return }
    if (result.warning) { setWarning(result.warning); setTimeout(onDeleted, 2500) }
    else onDeleted()
  }

  if (warning) {
    return (
      <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-400/[0.06] border border-amber-400/[0.15] rounded-lg px-3 py-2 flex-1">
        <AlertTriangle className="size-3.5 shrink-0 mt-px" /><span>{warning}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleDelete}
        onBlur={() => setTimeout(() => setConfirm(false), 200)}
        disabled={deleting}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-50',
          confirm
            ? 'text-red-400 border-red-500/40 bg-red-500/10'
            : 'text-gray-600 border-white/[0.06] hover:text-red-400 hover:border-red-500/30',
        )}
      >
        {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
        {confirm ? 'Confirm delete' : 'Delete Order'}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  )
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  role,
  onDeleted,
  onPaid,
}: {
  order: OrderDoc
  role: 'admin' | 'user' | 'client'
  onDeleted: (id: string) => void
  onPaid: (id: string) => void
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied]     = useState(false)

  const cfg = STATUS_CFG[order.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
  const StatusIcon = cfg.icon
  const lineItems = order.lineItems ?? []
  const canEditDueDate   = role !== 'client' && order.status === 'pending'
  const canEditLineItems = role !== 'client'
  const canMarkPaid      = role !== 'client' && order.status === 'pending'
  const canDelete        = role === 'admin'

  const handleCopyLink = () => {
    if (!order.stripeInvoiceUrl) return
    navigator.clipboard.writeText(order.stripeInvoiceUrl).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden transition-all duration-300',
        expanded ? 'border-[#67e8f9]/20' : 'border-white/[0.07] hover:border-white/[0.12]',
      )}
      style={{ background: 'linear-gradient(145deg, #191919 0%, #121212 100%)' }}
    >
      {/* Glow bar */}
      <div className={cn(
        'h-px transition-all duration-500',
        expanded
          ? 'bg-gradient-to-r from-transparent via-[#67e8f9]/60 to-transparent'
          : 'bg-gradient-to-r from-transparent via-white/[0.06] to-transparent',
      )} />

      {/* Header */}
      <div onClick={() => setExpanded(!expanded)} className="px-7 pt-6 pb-5 cursor-pointer select-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Primary: line item title */}
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <span className="text-base font-semibold text-white leading-snug truncate">
                {lineItems[0]?.title ?? 'Invoice'}
                {lineItems.length > 1 && (
                  <span className="text-xs text-gray-600 font-normal ml-1.5">+{lineItems.length - 1} more</span>
                )}
              </span>
              <Badge
                variant="outline"
                className={`${cfg.color} ${cfg.bg} border ${cfg.border} text-[10px] px-1.5 py-0 inline-flex items-center gap-1 shrink-0`}
              >
                <StatusIcon className="size-2.5" />{cfg.label}
              </Badge>
            </div>

            {/* Project reference */}
            {order.projectRef && typeof order.projectRef !== 'string' && (
              <p className="text-xs text-gray-500 mb-1 truncate">{order.projectRef.name}</p>
            )}

            {/* Order number */}
            <p className="text-[11px] font-mono text-gray-600 mb-2">#{order.orderNumber}</p>

            {/* Dates */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="size-3" />{fmtDate(order.createdAt)}
              </span>
              {order.dueDate && (
                <span className={cn('flex items-center gap-1 text-xs', order.status === 'pending' ? 'text-amber-600/80' : 'text-gray-600')}>
                  <CalendarDays className="size-3" />Due {fmtDate(order.dueDate)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <p className="text-2xl font-bold text-white font-mono tabular-nums">{fmt(order.amount)}</p>
            {expanded
              ? <ChevronUp className="size-4 text-gray-500 mt-1.5" />
              : <ChevronDown className="size-4 text-gray-500 mt-1.5" />
            }
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <div className="px-7 py-6 space-y-6" style={{ background: 'rgba(0,0,0,0.25)' }}>

            {/* Payment actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {order.stripeInvoiceUrl ? (
                <>
                  <a
                    href={order.stripeInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#67e8f9] border border-[#67e8f9]/25 bg-[#67e8f9]/[0.04] rounded-lg hover:bg-[#67e8f9]/[0.12] transition-all"
                  >
                    <CreditCard className="size-3.5" />
                    {order.status === 'pending' ? 'Pay Invoice' : 'View Invoice'}
                    <ExternalLink className="size-3 opacity-70" />
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/[0.08] rounded-lg hover:text-white hover:border-white/[0.18] transition-all"
                  >
                    {copied ? <CheckCheck className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </>
              ) : order.status === 'pending' ? (
                <p className="text-xs text-gray-600 italic">No payment link yet — contact your project manager.</p>
              ) : null}
            </div>

            {/* Due date */}
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Due Date</p>
              {canEditDueDate ? (
                <DueDateEditor orderId={order.id} dueDate={order.dueDate} hasStripe={!!order.stripeInvoiceId} />
              ) : (
                <p className={cn('text-sm', order.dueDate ? 'text-white' : 'text-gray-600')}>
                  {order.dueDate ? fmtDate(order.dueDate) : '—'}
                </p>
              )}
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Line Items</p>
              {canEditLineItems ? (
                <LineItemsEditor
                  orderId={order.id}
                  lineItems={lineItems}
                  hasStripe={!!order.stripeInvoiceId}
                  onSaved={() => router.refresh()}
                />
              ) : (
                /* Client read-only */
                <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                  {lineItems.map((item, i) => {
                    const total = (item.price ?? 0) * (item.quantity ?? 1)
                    return (
                      <div key={i} className="flex items-start gap-4 px-4 py-3.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">{item.title}</p>
                          {item.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>}
                          <div className="flex items-center gap-2 mt-1.5">
                            {(item.quantity ?? 1) > 1 && <span className="text-[11px] text-gray-600">×{item.quantity}</span>}
                            {item.isRecurring && (
                              <span className="text-[10px] text-[#67e8f9]/60 bg-[#67e8f9]/[0.06] border border-[#67e8f9]/[0.15] rounded-full px-1.5 py-0.5 uppercase tracking-wide">
                                {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold font-mono text-white tabular-nums pt-0.5">{fmt(total)}</p>
                      </div>
                    )
                  })}
                  <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02]">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total</span>
                    <span className="text-base font-bold text-white font-mono tabular-nums">{fmt(order.amount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mark as paid / Delete */}
            {(canMarkPaid || canDelete) && (
              <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3 flex-wrap">
                {canMarkPaid && (
                  <MarkAsPaidButton orderId={order.id} onPaid={() => onPaid(order.id)} />
                )}
                {canDelete && (
                  <DeleteOrderButton
                    orderId={order.id}
                    onDeleted={() => onDeleted(order.id)}
                  />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function ClientOrdersTab({
  orders: initialOrders,
  role,
}: {
  orders: OrderDoc[]
  role: 'admin' | 'user' | 'client'
}) {
  const router = useRouter()
  // Local list so deleted orders vanish immediately without waiting for router.refresh()
  const [orders, setOrders] = useState<OrderDoc[]>(initialOrders)

  function handleDeleted(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id))
    router.refresh()
  }

  function handlePaid(id: string) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'paid' } : o))
    router.refresh()
  }

  const pendingOrders   = orders.filter((o) => o.status === 'pending')
  const paidOrders      = orders.filter((o) => o.status === 'paid')
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled')

  if (orders.length === 0) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-white/[0.07]"
        style={{ background: 'linear-gradient(145deg, #191919 0%, #121212 100%)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="size-64 rounded-full bg-[#67e8f9]/[0.02] blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center py-14 px-6">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-5">
            <Receipt className="size-7 text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">No orders yet</h3>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
            {role === 'client' ? 'You have no invoices on record yet.' : 'This client has no orders on record.'}
          </p>
        </div>
      </div>
    )
  }

  const sections = [
    { label: 'Pending',   items: pendingOrders,   icon: Clock,        color: 'text-amber-400'   },
    { label: 'Paid',      items: paidOrders,       icon: CheckCircle,  color: 'text-emerald-400' },
    { label: 'Cancelled', items: cancelledOrders,  icon: XCircle,      color: 'text-red-400'     },
  ].filter((s) => s.items.length > 0)

  return (
    <section className="space-y-6">
      {sections.map((section) => (
        <div key={section.label} className="space-y-3">
          <div className="flex items-center gap-2">
            <section.icon className={`size-3.5 ${section.color}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {section.label} · {section.items.length}
            </span>
          </div>
          <div className="space-y-3">
            {section.items.map((order) => (
              <OrderCard key={order.id} order={order} role={role} onDeleted={handleDeleted} onPaid={handlePaid} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
