'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PackageBuilderTab } from './PackageBuilderTab'
import { RetainerTab } from './RetainerTab'
import type { ExistingProposal } from './PackageBuilderTab'

export type { ExistingProposal } from './PackageBuilderTab'

type ModalTab = 'builder' | 'retainer'

export interface PackageBuilderModalProps {
  mode: 'create' | 'edit'
  username: string
  clientId?: string
  existing?: ExistingProposal
  onClose: (createdOrUpdatedId?: string) => void
  initialTab?: ModalTab
}

/**
 * Tabbed "Client Operations" shell. Owns the portal, backdrop, header tab strip,
 * and body-scroll lock. Each tab is a self-contained tool that fills the body
 * (including its own footer). Both tabs stay mounted — the inactive one is hidden
 * rather than unmounted — so switching tabs never drops in-progress state.
 */
export function PackageBuilderModal({ mode, username, clientId, existing, onClose, initialTab = 'builder' }: PackageBuilderModalProps) {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<ModalTab>(initialTab)

  // Portal is only valid after mount (needs document); also locks body scroll while open.
  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (!mounted) return null

  // Client the Retainer tab operates on by default: explicit clientId, else the
  // edited proposal's client. The tab still lets staff switch clients.
  const existingClientId =
    typeof existing?.clientAccount === 'object' && existing?.clientAccount
      ? existing.clientAccount.id
      : typeof existing?.clientAccount === 'string'
        ? existing.clientAccount
        : undefined
  const retainerClientId = clientId ?? existingClientId

  const tabs: { id: ModalTab; label: string; icon: typeof Package }[] = [
    { id: 'builder', label: 'Package Builder', icon: Package },
    { id: 'retainer', label: 'Retainer', icon: Clock },
  ]

  const overlay = (
    // Above the command console (z-70), which can open this modal from its Milestones
    // station; below the builder's own pickers (z-90) so those still stack on top.
    <div className="fixed inset-0 z-[80] flex p-3 sm:p-5">
      <div className="absolute inset-0 bg-[#000000]/75 backdrop-blur-sm" onClick={() => onClose()} />
      <div
        className="relative z-10 w-full h-full flex flex-col overflow-hidden rounded-2xl border border-[var(--space-border-hard)] shadow-2xl shadow-[#000000]/50"
        style={{ background: 'var(--space-bg-card)' }}
      >
        {/* Header — icon + tab strip + close */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 border-b border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.015)]">
          <div className="size-9 shrink-0 rounded-xl bg-[rgba(139,156,182,0.08)] border border-[rgba(139,156,182,0.15)] hidden sm:flex items-center justify-center">
            <Package className="size-4" style={{ color: 'var(--space-accent)' }} />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-1">
            {tabs.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                    active
                      ? 'bg-[var(--space-bg-card-hover)] text-[var(--space-text-primary)]'
                      : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)]',
                  )}
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => onClose()}
            aria-label="Close"
            className="shrink-0 size-8 rounded-lg border border-[var(--space-border-hard)] flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:border-[rgba(139,156,182,0.20)] transition-all"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Bodies — both mounted; inactive hidden to preserve state across tab switches */}
        <div className="flex-1 min-h-0">
          <div className={cn('h-full min-h-0', tab === 'builder' ? 'block' : 'hidden')}>
            <PackageBuilderTab mode={mode} username={username} clientId={clientId} existing={existing} onClose={onClose} />
          </div>
          <div className={cn('h-full min-h-0', tab === 'retainer' ? 'block' : 'hidden')}>
            <RetainerTab clientId={retainerClientId} active={tab === 'retainer'} />
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
