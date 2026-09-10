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
 * Trigger-less — it fills the second pane of the account sidebar. Clients load
 * lazily on mount, so the pane only pays for the fetch once you drill into it.
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
    <div className="flex h-full flex-col">
      <div className="relative px-[22px] pb-[14px]">
        <Search className="pointer-events-none absolute left-[34px] top-1/2 size-[15px] -translate-y-[7px] text-[var(--space-text-muted)]" />
        <input
          autoFocus={autoFocus}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients"
          className="h-[38px] w-full rounded-[10px] border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] pl-[36px] pr-[12px] text-[14px] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:border-[var(--space-accent)] focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-[14px] pb-[22px]">
        {loading ? (
          <div className="flex justify-center py-[26px]">
            <Loader2 className="size-[18px] animate-spin text-[var(--space-text-muted)]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-[8px] py-[26px] text-center text-[13px] text-[var(--space-text-muted)]">
            {q ? `No client matches “${search.trim()}”` : 'No clients yet. Create one to preview their portal.'}
          </p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => choose(c.id)}
              disabled={pendingId != null}
              className="flex w-full items-center gap-[11px] rounded-[10px] px-[8px] py-[8px] text-left transition-colors hover:bg-[var(--space-bg-card-hover)] disabled:opacity-50"
            >
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border border-[var(--space-border-hard)] bg-[var(--space-bg-card)]">
                {pendingId === c.id
                  ? <Loader2 className="size-[14px] animate-spin text-[var(--space-accent)]" />
                  : <Building2 className="size-[14px] text-[var(--space-text-muted)]" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-[var(--space-text-primary)]">{c.name}</span>
                {c.company && (
                  <span className="block truncate text-[11.5px] text-[var(--space-text-muted)]">{c.company}</span>
                )}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
