'use client'

import { useState } from 'react'
import { Plus, X, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SowScopeItem } from '@/lib/document-generators'
import { normalizeSowItems } from '@/lib/sow/clauses'

const inputCls =
  'w-full bg-[var(--space-bg-base)] border border-[#333] rounded-lg px-3 py-2 text-sm text-[var(--space-text-primary)] placeholder-[var(--space-text-muted)] outline-none focus:border-[var(--space-accent)] transition-colors'

/**
 * A titled list where each line can carry an optional description, used for the
 * Scope of Work, the Deliverables, and the Out of Scope exclusions. Both parts
 * print on the contract — the title in bold, the description underneath it.
 *
 * Legacy documents stored these as plain strings; `normalizeSowItems` reads both
 * shapes so an old SOW opens without losing its lines.
 */
export function SowItemListEditor({
  label,
  hint,
  items,
  placeholder,
  descriptionPlaceholder = 'Optional description — prints under the title',
  onChange,
  onReset,
  usingDefaults,
}: {
  label: string
  hint?: string
  items: unknown
  placeholder: string
  descriptionPlaceholder?: string
  onChange: (next: SowScopeItem[]) => void
  /** Offered when the list is staff-overridden and can fall back to a standard. */
  onReset?: () => void
  usingDefaults?: boolean
}) {
  const list = normalizeSowItems(items)
  const [openDesc, setOpenDesc] = useState<number | null>(null)

  const patch = (i: number, next: Partial<SowScopeItem>) =>
    onChange(list.map((item, j) => (j === i ? { ...item, ...next } : item)))

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[0.5625rem] font-bold uppercase tracking-widest text-[var(--space-accent)]">{label}</p>
        {usingDefaults && (
          <span className="text-[0.5rem] font-bold uppercase tracking-widest text-[var(--space-text-muted)]">
            Standard list
          </span>
        )}
      </div>
      {hint && <p className="text-[0.625rem] text-[var(--space-text-secondary)] leading-relaxed">{hint}</p>}

      {list.length === 0 && (
        <p className="text-[0.625rem] text-[var(--space-text-muted)] italic">Nothing listed yet.</p>
      )}

      {list.map((item, i) => {
        const open = openDesc === i || Boolean(item.description?.trim())
        return (
          <div key={i} className="rounded-lg border border-[var(--space-border-hard)] p-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                className={inputCls}
                value={item.title}
                placeholder={placeholder}
                onChange={e => patch(i, { title: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setOpenDesc(open ? null : i)}
                title={open ? 'Hide description' : 'Add a description'}
                className="shrink-0 p-1 text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] transition-colors"
              >
                {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => onChange(list.filter((_, j) => j !== i))}
                title="Remove"
                className="shrink-0 text-[var(--space-text-secondary)] hover:text-red-400 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {open && (
              <textarea
                value={item.description ?? ''}
                placeholder={descriptionPlaceholder}
                rows={2}
                onChange={e => patch(i, { description: e.target.value })}
                className={cn(inputCls, 'text-xs leading-relaxed resize-y')}
              />
            )}
          </div>
        )
      })}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            onChange([...list, { title: '', description: '' }])
            setOpenDesc(list.length)
          }}
          className="flex items-center gap-1 text-[0.625rem] text-[var(--space-accent)] hover:underline"
        >
          <Plus className="size-3" /> Add line
        </button>
        {onReset && !usingDefaults && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[0.625rem] text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)]"
          >
            <RotateCcw className="size-3" /> Reset to standard
          </button>
        )}
      </div>
    </div>
  )
}
