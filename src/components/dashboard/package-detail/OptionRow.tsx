'use client'

import { useState } from 'react'
import { Check, ChevronRight, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmt, type LineItem } from './utils'

/** One proposal line item as an expandable row.
 *
 *  The circle is the include/exclude control — `selected` means "included in the
 *  quote", unselected renders the same item as an optional add-on the client may
 *  request. The rest of the row expands to reveal the per-item editors, so a long
 *  package stays scannable until you actually want to change something. */
export function OptionRow({
  item,
  selected,
  requested,
  onToggle,
  onRemove,
  onDescriptionChange,
  onQuantityChange,
  onAdjustedPriceChange,
}: {
  item: LineItem
  selected: boolean
  requested?: boolean
  onToggle: () => void
  onRemove?: () => void
  onDescriptionChange?: (desc: string) => void
  onQuantityChange?: (qty: number) => void
  onAdjustedPriceChange?: (price: number | null) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const qty = item.quantity ?? 1
  const basePrice = item.price ?? 0
  const unitPrice = item.adjustedPrice ?? basePrice
  const total = unitPrice * qty
  const baseTotal = basePrice * qty
  const hasDiscount = item.adjustedPrice != null && item.adjustedPrice !== basePrice
  const hasEditors = !!(onQuantityChange || onDescriptionChange || onAdjustedPriceChange)

  return (
    <div className={cn('transition-colors', selected ? 'bg-[rgba(255,255,255,0.02)]' : 'bg-transparent')}>
      {/* ── Row ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3.5 py-3">

        {/* Include / exclude — stops propagation so it never expands the row */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          title={selected ? 'Move to available add-ons' : 'Include in this package'}
          aria-label={selected ? 'Move to available add-ons' : 'Include in this package'}
          aria-pressed={selected}
          className={cn(
            'size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
            selected
              ? 'bg-[rgba(139,156,182,0.10)] border-[rgba(139,156,182,0.30)]'
              : 'border-[var(--space-border-hard)] hover:border-[rgba(139,156,182,0.30)]',
          )}
        >
          {selected && <Check className="size-3" style={{ color: 'var(--space-accent)' }} />}
        </button>

        {/* Name + meta — the expand target */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="flex-1 min-w-0 flex items-center gap-3 text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn(
                'text-sm font-semibold leading-snug',
                selected ? 'text-[var(--space-text-primary)]' : 'text-[var(--space-text-secondary)]',
              )}>
                {item.name}
              </p>
              {qty > 1 && (
                <span className="text-[0.625rem] text-[var(--space-text-muted)] tabular-nums">× {qty}</span>
              )}
              {item.isRecurring && (
                <span className={cn(
                  'text-[0.625rem] rounded-full px-1.5 py-0.5 uppercase tracking-wide font-medium',
                  selected
                    ? 'border border-[rgba(139,156,182,0.15)] bg-[rgba(139,156,182,0.06)]'
                    : 'text-[var(--space-text-muted)] bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)]',
                )} style={selected ? { color: 'var(--space-accent)', opacity: 0.8 } : {}}>
                  {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
                </span>
              )}
              {requested && !selected && (
                <span className="text-[0.5625rem] text-amber-400/80 bg-amber-400/[0.08] border border-amber-400/20 rounded px-1.5 py-0.5 font-semibold uppercase tracking-widest">
                  Requested by client
                </span>
              )}
            </div>
            {/* Collapsed peek at the description; the full text lives in the panel. */}
            {item.description && !expanded && (
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--space-text-muted)] line-clamp-1">
                {item.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            {hasDiscount && (
              <span className="text-[0.6875rem] font-mono tabular-nums text-[var(--space-text-muted)] line-through leading-none">
                {fmt(baseTotal)}
                {item.isRecurring && (
                  <span className="font-sans">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
                )}
              </span>
            )}
            <span className={cn(
              'text-sm font-bold font-mono tabular-nums leading-none',
              hasDiscount ? '' : selected ? 'text-[var(--space-text-primary)]' : 'text-[var(--space-text-muted)]',
            )} style={hasDiscount ? { color: 'var(--space-accent)' } : {}}>
              {fmt(total)}
              {item.isRecurring && (
                <span className="text-xs font-normal text-[var(--space-text-muted)] font-sans">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
              )}
            </span>
          </div>

          <ChevronRight className={cn(
            'size-3.5 shrink-0 text-[var(--space-text-muted)] transition-transform',
            expanded && 'rotate-90',
          )} />
        </button>
      </div>

      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-3.5 pb-3.5 pl-[2.75rem]">
          <div className="h-px bg-[var(--space-divider)] mb-3" />
          <div className="flex flex-col gap-2">

            {/* Read-only description when this row has no editors (add-ons) */}
            {item.description && !onDescriptionChange && (
              <p className="text-xs leading-relaxed text-[var(--space-text-muted)] whitespace-pre-line">
                {item.description}
              </p>
            )}

            {onAdjustedPriceChange && (
              <div className="flex items-center justify-between">
                <span className="text-[0.625rem] text-[var(--space-text-muted)] uppercase tracking-widest font-medium">Adjusted Price</span>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    'flex items-center gap-1 border rounded-md px-2 h-7 transition-colors',
                    item.adjustedPrice != null ? 'border-[rgba(139,156,182,0.20)] bg-[rgba(139,156,182,0.04)]' : 'border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]'
                  )}>
                    <span className={cn('text-[0.625rem] shrink-0', item.adjustedPrice != null ? '' : 'text-[var(--space-text-muted)]')} style={item.adjustedPrice != null ? { color: 'var(--space-accent)', opacity: 0.7 } : {}}>$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.adjustedPrice ?? ''}
                      onChange={e => {
                        const v = e.target.value
                        onAdjustedPriceChange(v === '' ? null : parseFloat(v))
                      }}
                      placeholder={String(item.price ?? 0)}
                      className="w-20 text-xs bg-transparent text-[var(--space-text-primary)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  {item.adjustedPrice != null && (
                    <button
                      type="button"
                      onClick={() => onAdjustedPriceChange(null)}
                      className="size-5 flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] transition-colors"
                      title="Reset to base price"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {onQuantityChange && (
              <div className="flex items-center justify-between">
                <span className="text-[0.625rem] text-[var(--space-text-muted)] uppercase tracking-widest font-medium">Quantity</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(Math.max(1, qty - 1))}
                    className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-colors text-sm leading-none"
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 1) onQuantityChange(v)
                    }}
                    className="w-10 text-center text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-md text-[var(--space-text-primary)] py-1 focus:outline-none focus:border-[rgba(139,156,182,0.20)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onQuantityChange(qty + 1)}
                    className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-colors text-sm leading-none"
                  >+</button>
                  {qty > 1 && (
                    <span className="text-[0.625rem] text-[var(--space-text-muted)] ml-1 tabular-nums">× {fmt(unitPrice)} ea</span>
                  )}
                </div>
              </div>
            )}

            {onDescriptionChange && (
              <textarea
                value={item.description ?? ''}
                onChange={e => onDescriptionChange(e.target.value)}
                placeholder="Add a description… (shown on invoice)"
                rows={2}
                className="w-full px-3 py-2 text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-tertiary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] resize-none leading-relaxed transition-colors"
              />
            )}

            {onRemove && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={onRemove}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[0.625rem] rounded-md border border-[var(--space-border-hard)] text-[var(--space-text-muted)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-400/[0.06] transition-all"
                >
                  <Trash2 className="size-3" />
                  Remove item
                </button>
              </div>
            )}

            {!hasEditors && !onRemove && !item.description && (
              <p className="text-[0.625rem] text-[var(--space-text-muted)] italic">Nothing to configure on this item.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
