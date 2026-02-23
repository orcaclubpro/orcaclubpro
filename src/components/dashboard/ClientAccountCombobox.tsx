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
            'bg-white/[0.03] border-white/[0.06] text-white',
            'hover:bg-white/[0.05] hover:border-white/[0.10]',
            'focus:outline-none focus:border-cyan-400/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <span className="truncate text-left">
            {loading ? (
              <span className="text-white/30">Loading…</span>
            ) : selected ? (
              selected.name
            ) : (
              <span className="text-white/30">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="size-4 text-white/30 shrink-0 ml-2" />
        </button>
      ) : (
        /* Open: inline search + list */
        <div className="rounded-md border border-cyan-400/25 bg-[#0c0c0c] overflow-hidden">
          {/* Search row */}
          <div className="flex items-center gap-2 px-3 border-b border-white/[0.06]">
            <Search className="size-3.5 text-white/25 shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="flex-1 py-2 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-white/25 hover:text-white/55 transition-colors shrink-0"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Results list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-white/25 text-center">No accounts found</p>
            ) : (
              filtered.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleSelect(account.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors',
                    account.id === value && 'bg-cyan-400/[0.05]',
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{account.name}</p>
                    {account.email && (
                      <p className="text-[10px] text-white/30 truncate">{account.email}</p>
                    )}
                  </div>
                  {account.id === value && (
                    <Check className="size-3.5 text-cyan-400 shrink-0 ml-2" />
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
