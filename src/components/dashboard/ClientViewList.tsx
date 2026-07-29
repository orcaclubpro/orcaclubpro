'use client'

import { useState, useEffect, useTransition } from 'react'
import { Search, Loader2, Building2 } from 'lucide-react'
import { getClientAccountsList } from '@/actions/packages'
import { enterClientPreview } from '@/app/(spaces)/preview-actions'

interface ClientOption {
  id: string
  name: string
  company: string | null
}

/**
 * Searchable client list that enters "view as client" preview on selection.
 * Trigger-less — embedded inside the header UserMenu. Clients load lazily on mount.
 */
export function ClientViewList({ autoFocus = false }: { autoFocus?: boolean }) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startPreview] = useTransition()

  useEffect(() => {
    let alive = true
    getClientAccountsList().then((res) => {
      if (!alive) return
      if (res.success) setClients(res.clients)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const q = search.toLowerCase().trim()
  const filtered = q
    ? clients.filter((c) => c.name.toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q))
    : clients

  function choose(id: string) {
    setPendingId(id)
    startPreview(() => enterClientPreview(id))
  }

  return (
    <div>
      <div className="relative mb-1.5">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--space-text-muted)] pointer-events-none" />
        <input
          autoFocus={autoFocus}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients…"
          className="w-full pl-8 pr-2.5 py-1.5 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)]"
        />
      </div>

      <div className="max-h-56 overflow-y-auto -mx-1 px-1">
        {loading ? (
          <div className="flex justify-center py-5">
            <Loader2 className="size-4 text-[var(--space-text-muted)] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-[var(--space-text-muted)] text-center py-5">
            {q ? 'No matching clients' : 'No clients yet'}
          </p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => choose(c.id)}
              disabled={pendingId != null}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-[var(--space-bg-card-hover)] transition-colors disabled:opacity-60"
            >
              <span className="size-6 shrink-0 rounded-md bg-[rgba(139,156,182,0.08)] border border-[var(--space-border-hard)] flex items-center justify-center">
                {pendingId === c.id
                  ? <Loader2 className="size-3 animate-spin text-[var(--space-accent)]" />
                  : <Building2 className="size-3 text-[var(--space-text-muted)]" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-medium text-[var(--space-text-secondary)] truncate">{c.name}</span>
                {c.company && (
                  <span className="block text-[10px] text-[var(--space-text-muted)] truncate">{c.company}</span>
                )}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
