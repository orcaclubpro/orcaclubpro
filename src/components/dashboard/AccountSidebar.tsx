'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Eye, LogOut, Settings, X } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { ThemePicker } from './ThemeSwitcher'
import { ClientViewList } from './ClientViewList'
import { UserSettingsPanel } from './UserSettingsModal'

interface AccountSidebarProps {
  name: string
  email: string
  title?: string | null
  role?: string | null
  /** Staff (admin/user) get the "View as client" pane. */
  isStaff: boolean
}

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', user: 'Team', client: 'Client' }

/** How long the sheet takes to leave — kept in step with the CSS below. */
const SLIDE_MS = 300

/**
 * The header menu: a hamburger that opens a sheet from the right holding
 * everything about *you* rather than about the work — who you are signed in as,
 * how the portal looks, whose portal you are looking at, your account, and the
 * way out.
 *
 * Two panes, not an accordion. A 380px column has nowhere to push content down
 * to, so "View as client" slides the client search in over the root pane and the
 * header grows a back arrow. Esc walks back the same way: clients → root → closed.
 * The client pane is built on first use and then kept, so drilling in costs one
 * fetch per session rather than one per open.
 *
 * Everything reads from `--space-*`, so all three themes come for free; the theme
 * slabs are the only colour in the sheet, which is what makes them the thing your
 * eye lands on.
 */
export function AccountSidebar({ name, email, title, role, isStaff }: AccountSidebarProps) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pane, setPane] = useState<'root' | 'clients'>('root')
  // The client list costs a fetch, so it is only built once you actually drill in.
  // After that it stays mounted, keeping its search and rows across trips back.
  const [clientsMounted, setClientsMounted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => () => { if (exitTimer.current) clearTimeout(exitTimer.current) }, [])

  const showClients = () => {
    setClientsMounted(true)
    setPane('clients')
  }

  const openSheet = () => {
    if (exitTimer.current) clearTimeout(exitTimer.current)
    setPane('root')
    setOpen(true)
    requestAnimationFrame(() => setVisible(true))
  }

  // Slide out first, unmount after — and hand focus back to the hamburger, which
  // is exactly where the sheet came from.
  const closeSheet = useCallback(() => {
    setVisible(false)
    if (exitTimer.current) clearTimeout(exitTimer.current)
    exitTimer.current = setTimeout(() => {
      setOpen(false)
      setPane('root')
    }, SLIDE_MS)
    triggerRef.current?.focus()
  }, [])

  // Move focus into the sheet so the keyboard follows the eye.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => panelRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [open])

  // Esc walks back one level.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      if (pane === 'clients') setPane('root')
      else closeSheet()
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [open, pane, closeSheet])

  // The sheet is a modal surface; the page behind it should not scroll under it.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const initial = (name || email || '?')[0].toUpperCase()
  /** Quiet text that stays readable in every theme — see the note on contrast below. */
  const quiet = 'color-mix(in srgb, var(--space-text-primary) 62%, var(--space-bg-base))'
  const roleLabel = role ? ROLE_LABEL[role] ?? null : null

  const trigger = (
    <button
      ref={triggerRef}
      onClick={openSheet}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label="Open menu"
      className="group flex size-[44px] items-center justify-center rounded-[12px] transition-colors duration-200 hover:bg-[var(--space-bg-card-hover)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-border-hard)]"
    >
      <span className="flex w-[20px] flex-col gap-[5px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-[1.5px] w-full rounded-full bg-[var(--space-nav-fg-dim)] transition-colors duration-200 group-hover:bg-[var(--space-nav-fg)]"
          />
        ))}
      </span>
    </button>
  )

  const sheet = open && (
    <>
      <div
        data-account-scrim
        onClick={closeSheet}
        className="fixed inset-0 z-[60]"
        style={{
          background: visible ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0)',
          transition: `background ${SLIDE_MS}ms cubic-bezier(0.32,0.72,0,1)`,
        }}
      />

      <div
        data-account-sheet
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="fixed bottom-0 right-0 top-0 z-[61] flex w-[380px] flex-col border-l border-[var(--space-border-hard)] focus:outline-none max-[520px]:w-full"
        style={{
          background: 'var(--space-bg-base)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform ${SLIDE_MS}ms cubic-bezier(0.32,0.72,0,1)`,
        }}
      >
        {/* Sheet header — the page header behind still shows the lockup, so this bar
            carries only what changes: where you are, and the way out. */}
        <div className="flex h-[52px] shrink-0 items-center justify-between px-[22px]">
          {pane === 'root' ? (
            <span />
          ) : (
            <button
              onClick={() => setPane('root')}
              className="-ml-[8px] flex items-center gap-[6px] rounded-[10px] px-[8px] py-[6px] transition-colors hover:bg-[var(--space-bg-card-hover)] focus:outline-none"
            >
              <ChevronLeft className="size-[17px] text-[var(--space-text-muted)]" />
              <span className="text-[15px] font-semibold text-[var(--space-text-primary)]">View as client</span>
            </button>
          )}

          <button
            onClick={closeSheet}
            aria-label="Close menu"
            className="flex size-[32px] items-center justify-center rounded-[9px] text-[var(--space-text-muted)] transition-colors hover:bg-[var(--space-bg-card-hover)] hover:text-[var(--space-text-primary)] focus:outline-none"
          >
            <X className="size-[17px]" />
          </button>
        </div>

        {/* Panes */}
        <div className="relative flex-1 overflow-hidden">
          <Pane active={pane === 'root'} from="left">
            <div className="flex min-h-full flex-col">
            {/* Identity */}
            <div className="flex items-center gap-[13px] px-[22px] pb-[20px] pt-[4px]">
              <span
                className="flex size-[42px] shrink-0 items-center justify-center rounded-full border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] text-[16px] font-semibold"
                style={{ color: 'var(--space-accent)' }}
              >
                {initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold leading-tight text-[var(--space-text-primary)]">
                  {name || email}
                </span>
                <span className="mt-[3px] block truncate text-[12px]" style={{ color: quiet }}>{email}</span>
              </span>
              {roleLabel && (
                <span
                  className="shrink-0 rounded-full px-[9px] py-[3px] text-[10.5px] font-semibold"
                  style={{ background: 'var(--space-accent-soft)', color: 'var(--space-accent)' }}
                >
                  {roleLabel}
                </span>
              )}
            </div>

            {/* Appearance */}
            <div className="border-t border-[var(--space-border-hard)] px-[22px] py-[18px]">
              <p className="pb-[12px] text-[12px] font-semibold" style={{ color: quiet }}>Appearance</p>
              <ThemePicker />
            </div>

            {/* Actions */}
            <div className="border-t border-[var(--space-border-hard)] py-[7px]">
              {isStaff && (
                <SheetRow
                  icon={Eye}
                  label="View as client"
                  onClick={showClients}
                  trailing={<ChevronRight className="size-[15px] text-[var(--space-text-muted)]" />}
                />
              )}
              <SheetRow
                icon={Settings}
                label="Account settings"
                onClick={() => { closeSheet(); setSettingsOpen(true) }}
              />
            </div>

            {/* Anchored to the bottom edge — the way out is always in the same place,
                whatever the sheet is tall enough to show above it. */}
            <div className="mt-auto border-t border-[var(--space-border-hard)] py-[7px]">
              <SheetRow icon={LogOut} label="Sign out" onClick={() => { void logoutAction() }} />
            </div>
            </div>
          </Pane>

          {clientsMounted && (
            <Pane active={pane === 'clients'} from="right">
              <div className="flex h-full flex-col pt-[18px]">
                <ClientViewList autoFocus />
              </div>
            </Pane>
          )}
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-account-sheet], [data-account-scrim], [data-account-pane] {
            transition: none !important;
          }
        }
      `}</style>
    </>
  )

  return (
    <>
      {trigger}
      {mounted && sheet && createPortal(sheet, document.body)}

      <UserSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        name={name}
        email={email}
        title={title}
        role={role}
      />
    </>
  )
}

/**
 * One pane of the sheet. Both stay mounted so the client list keeps its search
 * and its loaded rows across a trip back to the root pane; the inactive one is
 * pulled out of the tab order with `visibility`.
 */
function Pane({
  active,
  from,
  children,
}: {
  active: boolean
  from: 'left' | 'right'
  children: React.ReactNode
}) {
  const parked = from === 'left' ? 'translateX(-12%)' : 'translateX(12%)'
  return (
    <div
      data-account-pane
      className="absolute inset-0 overflow-y-auto"
      style={{
        transform: active ? 'translateX(0)' : parked,
        opacity: active ? 1 : 0,
        visibility: active ? 'visible' : 'hidden',
        transition: `transform ${SLIDE_MS}ms cubic-bezier(0.32,0.72,0,1), opacity 180ms ease, visibility 0s linear ${active ? '0s' : `${SLIDE_MS}ms`}`,
      }}
    >
      {children}
    </div>
  )
}

function SheetRow({
  icon: Icon,
  label,
  onClick,
  trailing,
}: {
  icon: typeof Eye
  label: string
  onClick: () => void
  trailing?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-[12px] px-[22px] py-[11px] text-left transition-colors hover:bg-[var(--space-bg-card-hover)] focus:outline-none focus-visible:bg-[var(--space-bg-card-hover)]"
    >
      <Icon className="size-[17px] shrink-0 text-[var(--space-text-muted)] transition-colors group-hover:text-[var(--space-accent)]" />
      <span className="flex-1 text-[15px] font-medium text-[var(--space-text-primary)]">{label}</span>
      {trailing}
    </button>
  )
}
