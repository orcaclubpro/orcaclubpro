'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Settings, Eye, ChevronRight, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemePicker } from './ThemeSwitcher'
import { ClientViewList } from './ClientViewList'
import { UserSettingsPanel } from './UserSettingsModal'

interface UserMenuProps {
  name: string
  email: string
  title?: string | null
  role?: string | null
  /** Staff (admin/user) get the "View as client" section. */
  isStaff: boolean
}

/**
 * The orca logo in the header is the trigger. Hovering reveals a dropdown with
 * the theme picker, a staff-only "View as client" section, and an Account
 * settings button that opens the sliding settings sidebar. Hover-only: the menu
 * opens on mouse-enter and closes shortly after the cursor leaves the trigger +
 * menu area (a small delay bridges the gap between them).
 */
export function UserMenu({ name, email, title, role, isStaff }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showClients, setShowClients] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  function handleLeave() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 140)
  }

  const initial = (name || email || '?')[0].toUpperCase()

  return (
    <>
      <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        {/* Trigger — the orca logo */}
        <button
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className="group flex items-center justify-center w-12 h-12 rounded-lg hover:bg-[var(--space-bg-card-hover)] transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(139,156,182,0.15)]"
        >
          <Image
            src="/orcaclubpro.png"
            alt="Account"
            width={48}
            height={48}
            className={cn(
              'transition-all duration-200 group-hover:scale-110',
              open ? 'opacity-100 scale-110' : 'opacity-60 group-hover:opacity-100',
            )}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-[18.75rem] rounded-2xl z-[60] overflow-hidden"
            style={{
              background: 'var(--space-bg-card)',
              border: '1px solid var(--space-border-hard)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.15)',
              animation: 'userMenuIn 160ms cubic-bezier(0.22,1,0.36,1) forwards',
            }}
          >
            {/* Identity */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--space-border-hard)]">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)]"
                style={{ color: 'var(--space-accent)' }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--space-text-primary)] leading-tight truncate">{name || email}</p>
                <p className="text-[0.6875rem] text-[var(--space-text-muted)] truncate">{email}</p>
              </div>
            </div>

            {/* Theme */}
            <div className="px-3 py-3 border-b border-[var(--space-border-hard)]">
              <p className="flex items-center gap-1.5 text-[0.5625rem] uppercase tracking-[0.15em] text-[var(--space-text-tertiary)] font-semibold px-1 pb-2">
                <Palette className="size-3" /> Theme
              </p>
              <ThemePicker />
            </div>

            {/* View as client — staff only */}
            {isStaff && (
              <div className="border-b border-[var(--space-border-hard)]">
                <button
                  onClick={() => setShowClients((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[var(--space-text-secondary)] hover:bg-[var(--space-bg-card-hover)] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Eye className="size-4 text-[var(--space-text-muted)]" />
                    View as client
                  </span>
                  <ChevronRight className={cn('size-3.5 text-[var(--space-text-muted)] transition-transform', showClients && 'rotate-90')} />
                </button>
                {showClients && (
                  <div className="px-3 pb-3">
                    <ClientViewList autoFocus />
                  </div>
                )}
              </div>
            )}

            {/* Account settings */}
            <div className="py-1.5">
              <button
                onClick={() => { setOpen(false); setSettingsOpen(true) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--space-text-secondary)] hover:bg-[var(--space-bg-card-hover)] hover:text-[var(--space-text-primary)] transition-colors"
              >
                <Settings className="size-4 text-[var(--space-text-muted)]" />
                Account settings
              </button>
            </div>
          </div>
        )}
      </div>

      <UserSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        name={name}
        email={email}
        title={title}
        role={role}
      />

      <style>{`
        @keyframes userMenuIn {
          from { opacity: 0; transform: scale(0.97) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  )
}
