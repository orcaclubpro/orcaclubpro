'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ClientAccountOption {
  id: string
  name: string
  email: string
}

interface ClientAccountComboboxProps {
  accounts: ClientAccountOption[]
  value: string
  onValueChange: (value: string) => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
}

export function ClientAccountCombobox({
  accounts,
  value,
  onValueChange,
  loading = false,
  disabled = false,
  placeholder = 'Select client account…',
}: ClientAccountComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = accounts.find((a) => a.id === value)

  const filtered = search.trim()
    ? accounts.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase()),
      )
    : accounts

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const handleOpen = () => {
    if (disabled || loading) return
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSelect = (id: string) => {
    onValueChange(id)
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange('')
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Closed: show trigger button */}
      {!open ? (
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled || loading}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 h-9 rounded-md border text-sm transition-colors',
            'bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)]',
            'hover:bg-[var(--space-bg-card-hover)] hover:border-[var(--space-border-hard)]',
            'focus:outline-none focus:border-[rgba(139,156,182,0.20)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <span className="truncate text-left">
            {loading ? (
              <span className="text-[var(--space-text-secondary)]">Loading…</span>
            ) : selected ? (
              selected.name
            ) : (
              <span className="text-[var(--space-text-secondary)]">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="size-4 text-[var(--space-text-secondary)] shrink-0 ml-2" />
        </button>
      ) : (
        /* Open: inline search + list */
        <div className="rounded-md border border-[rgba(139,156,182,0.18)] bg-[var(--space-bg-base)] overflow-hidden">
          {/* Search row */}
          <div className="flex items-center gap-2 px-3 border-b border-[var(--space-border-hard)]">
            <Search className="size-3.5 text-[var(--space-text-secondary)] shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="flex-1 py-2 bg-transparent text-sm text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus:outline-none"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] transition-colors shrink-0"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Results list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-[var(--space-text-secondary)] text-center">No accounts found</p>
            ) : (
              filtered.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleSelect(account.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[rgba(255,255,255,0.06)] transition-colors',
                    account.id === value && 'bg-[rgba(139,156,182,0.04)]',
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--space-text-primary)] truncate">{account.name}</p>
                    {account.email && (
                      <p className="text-[10px] text-[var(--space-text-secondary)] truncate">{account.email}</p>
                    )}
                  </div>
                  {account.id === value && (
                    <Check className="size-3.5 text-[var(--space-accent)] shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
