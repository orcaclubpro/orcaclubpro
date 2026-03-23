'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Info, X, FolderOpen, Receipt, Package, ArrowRight, Check } from 'lucide-react'
import { useTabContext } from '@/app/(spaces)/TabContext'
import { usePackageCount } from '@/app/(spaces)/PackageCountContext'
import { dismissTips } from '@/actions/profile'

interface WelcomeInfoButtonProps {
  firstName?: string | null
  showTips?: boolean
}

export function WelcomeInfoButton({ firstName, showTips }: WelcomeInfoButtonProps) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [dontShow, setDontShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false) // guard for createPortal (SSR)
  const [, startTransition] = useTransition()
  const { navigate } = useTabContext()
  const { packageCount } = usePackageCount()
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mount guard — createPortal requires document
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-open once on mount if showTips is true
  useEffect(() => {
    if (showTips && !dismissed) {
      const t = setTimeout(() => openModal(), 700)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openModal = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
  }

  const closeModal = () => {
    setVisible(false)
    if (dontShow) {
      setDismissed(true)
      startTransition(() => { dismissTips() })
    }
    closeTimerRef.current = setTimeout(() => setOpen(false), 300)
  }

  const handleNavigate = (tab: string) => {
    closeModal()
    setTimeout(() => navigate(tab), 160)
  }

  // ── Modal content (rendered via portal into document.body) ──────────────

  const modal = open && (
    <div
      className="fixed inset-0 z-[9999]"
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#000000]/50 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={closeModal}
      />

      {/* Panel — top-right on desktop, centered on mobile */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 sm:items-start sm:justify-end sm:p-6 sm:pt-[72px]"
        onClick={closeModal}
      >
        <div
          className="relative w-full max-w-[340px] rounded-2xl border border-[var(--space-border-hard)] bg-[var(--space-bg-base)] shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
          style={{
            transition: 'opacity 300ms ease-out, transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.90) translateY(-10px)',
            transformOrigin: 'top right',
          }}
        >
          {/* Top accent */}
          <div
            style={{
              height: 1,
              background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.4), transparent)',
              opacity: visible ? 1 : 0,
              transition: 'opacity 400ms ease',
              transitionDelay: visible ? '100ms' : '0ms',
            }}
          />

          <div className="p-5 space-y-4">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div
              className="flex items-start justify-between gap-3"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(-6px)',
                transition: 'opacity 280ms ease, transform 280ms ease',
                transitionDelay: visible ? '60ms' : '0ms',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                  <Info className="size-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-blue-400/60 mb-0.5">
                    Client Portal
                  </p>
                  <h3 className="text-sm font-bold text-[var(--space-text-primary)]">
                    Welcome to ORCACLUB{firstName ? `, ${firstName}` : ''}
                  </h3>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] rounded-lg hover:bg-[var(--space-bg-card-hover)] transition-colors shrink-0 mt-0.5"
                aria-label="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* ── Description ─────────────────────────────────────────────── */}
            <p
              className="text-xs text-[var(--space-text-secondary)] leading-relaxed"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(4px)',
                transition: 'opacity 280ms ease, transform 280ms ease',
                transitionDelay: visible ? '100ms' : '0ms',
              }}
            >
              This is your client portal — view the progress of your projects and pay your invoices, all in one place.
            </p>

            {/* ── Navigation CTAs ──────────────────────────────────────────── */}
            <div
              className="space-y-2"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 280ms ease, transform 280ms ease',
                transitionDelay: visible ? '140ms' : '0ms',
              }}
            >
              <button
                onClick={() => handleNavigate('projects')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] hover:border-blue-500/25 hover:bg-blue-500/[0.04] transition-all duration-150 text-left group"
              >
                <FolderOpen className="size-3.5 text-[var(--space-text-muted)] group-hover:text-blue-400 transition-colors shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--space-text-primary)]">Track milestones &amp; sprints</p>
                  <p className="text-[10px] text-[var(--space-text-muted)] mt-0.5">View your project progress</p>
                </div>
                <ArrowRight className="size-3 text-[var(--space-text-muted)] group-hover:text-blue-400 transition-colors shrink-0" />
              </button>

              <button
                onClick={() => handleNavigate('invoices')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] hover:border-blue-500/25 hover:bg-blue-500/[0.04] transition-all duration-150 text-left group"
              >
                <Receipt className="size-3.5 text-[var(--space-text-muted)] group-hover:text-blue-400 transition-colors shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--space-text-primary)]">View and pay invoices</p>
                  <p className="text-[10px] text-[var(--space-text-muted)] mt-0.5">Manage your payments</p>
                </div>
                <ArrowRight className="size-3 text-[var(--space-text-muted)] group-hover:text-blue-400 transition-colors shrink-0" />
              </button>

              {/* View Packages — blue CTA with count badge */}
              <button
                onClick={() => handleNavigate('packages')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500/[0.10] border border-blue-500/25 hover:bg-blue-500/[0.18] hover:border-blue-500/40 transition-all duration-150 text-left group"
              >
                <Package className="size-3.5 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-300">View packages</p>
                  <p className="text-[10px] text-blue-400/60 mt-0.5">Your service proposals</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {packageCount > 0 && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none shadow-sm">
                      {packageCount > 9 ? '9+' : packageCount}
                    </span>
                  )}
                  <ArrowRight className="size-3 text-blue-400/60 group-hover:text-blue-400 transition-colors" />
                </div>
              </button>
            </div>

            {/* ── Don't show again ─────────────────────────────────────────── */}
            <div
              className="flex items-center gap-2.5 pt-1 border-t border-[var(--space-border-hard)]"
              style={{
                opacity: visible ? 1 : 0,
                transition: 'opacity 280ms ease',
                transitionDelay: visible ? '200ms' : '0ms',
              }}
            >
              <button
                type="button"
                onClick={() => setDontShow(v => !v)}
                className={`flex items-center justify-center size-4 rounded border-2 shrink-0 transition-all duration-150 ${
                  dontShow
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-transparent border-[var(--space-border-hard)] hover:border-[var(--space-border-hard)]'
                }`}
                aria-label="Don't show again"
              >
                {dontShow && <Check className="size-2.5 text-white" strokeWidth={3} />}
              </button>
              <span
                className="text-[10px] text-[var(--space-text-muted)] select-none cursor-pointer"
                onClick={() => setDontShow(v => !v)}
              >
                Don&apos;t show again
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Trigger button — inline, styled for the header */}
      <button
        onClick={openModal}
        className="flex items-center justify-center size-7 rounded-full bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 hover:border-blue-500/50 hover:shadow-[0_0_10px_rgba(59,130,246,0.15)] transition-all duration-200 focus:outline-none shrink-0"
        aria-label="Portal info"
      >
        <Info className="size-3.5 text-blue-400" />
      </button>

      {/* Portal — renders into document.body, escapes all stacking contexts */}
      {mounted && createPortal(modal, document.body)}
    </>
  )
}
