'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePackageCount } from '@/app/(spaces)/PackageCountContext'
import type { Experience } from '@/app/(spaces)/experience'
import { tabsFor, tabHref, type TabDef } from '@/app/(spaces)/u/[username]/tabs'

// ── Idle collapse ────────────────────────────────────────────────────────────
// At rest the bar contracts into a short indicator line and grows back when a
// pointer approaches. It is one object throughout — the same element animates
// its width, height and radius between the two shapes, so the bar reads as
// physically shrinking rather than swapping places with a second widget.
//
// The choreography is asymmetric, which is what sells it: the shell springs
// open with a little overshoot while the contents fade in slightly behind it,
// and on the way out the contents clear quickly so the shell can close over
// empty space. Symmetric timing reads mechanical.

const COLLAPSED_H = 5              // px — iOS home-indicator proportions
const COLLAPSED_MIN = 96
const COLLAPSED_MAX = 180
const COLLAPSED_RATIO = 0.26       // of the expanded bar, so the line scales with it

const EXPAND_MS = 420
const COLLAPSE_MS = 340
const SPRING = 'cubic-bezier(0.34, 1.42, 0.64, 1)'   // overshoots, then settles
const SETTLE = 'cubic-bezier(0.32, 0.72, 0, 1)'      // calm, no overshoot

const OPEN_DELAY = 80    // ms — swallows a pointer sweeping across the bottom edge
const CLOSE_DELAY = 400  // ms — survives a brief exit without flickering shut

interface MobileBottomNavProps {
  /** Effective experience — reflects staff "view as client" preview. */
  experience: Experience
}

interface NavItem {
  href: string
  label: string
  icon: TabDef['icon']
  tab: string
}

export function MobileBottomNav({ experience }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { packageCount } = usePackageCount()
  const shellRef = useRef<HTMLElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Collapsing is a pointer affordance and stays off until we confirm a
  // hover-capable, fine pointer. On touch this bar IS the primary navigation
  // and there would be no hover to bring it back — so touch keeps it open.
  const [canHover, setCanHover] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [open, setOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const hover = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => { setCanHover(hover.matches); setReduceMotion(motion.matches) }
    apply()
    hover.addEventListener('change', apply)
    motion.addEventListener('change', apply)
    return () => {
      hover.removeEventListener('change', apply)
      motion.removeEventListener('change', apply)
    }
  }, [])

  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(r)
  }, [])

  // Arrive already closed. The bar is a known fixture rather than something to
  // be discovered, so it starts as the line and stays out of the way until a
  // pointer comes for it. Touch has no hover to bring it back, so there it
  // stays open.
  useEffect(() => {
    setOpen(!canHover)
  }, [canHover])

  // The shell is sized explicitly in both states so width/height have real
  // numbers to animate between. Contents are absolutely positioned and never
  // resized, so their natural box is what the open shape measures.
  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearTimer = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }, [])
  const openSoon = useCallback(() => {
    clearTimer(); timer.current = setTimeout(() => setOpen(true), OPEN_DELAY)
  }, [clearTimer])
  const closeSoon = useCallback(() => {
    clearTimer(); timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY)
  }, [clearTimer])
  const openNow = useCallback(() => { clearTimer(); setOpen(true) }, [clearTimer])
  useEffect(() => clearTimer, [clearTimer])

  // Close More menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        shellRef.current && !shellRef.current.contains(e.target as Node)
      ) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const match = pathname?.match(/^\/u\/([^\/]+)/)
  const username = match?.[1]
  if (!username) return null

  const onProjectPage = pathname?.startsWith(`/u/${username}/projects/`) ?? false
  const onClientPage  = pathname?.startsWith(`/u/${username}/clients/`)  ?? false
  const onDetailPage  = onProjectPage || onClientPage
  const isClient = experience === 'client'

  // Each tab is a route segment: /u/<username> is home, /u/<username>/<tab>
  // everything else. Detail pages (/u/<u>/projects/<id>) keep their tab active.
  const activeTab = pathname?.split('/')[3] || 'home'
  const isActive = (tab: string) => tab === activeTab

  // ── Link definitions — derived from the shared tab registry ─────────────────

  const toLink = (t: TabDef): NavItem => ({
    href: tabHref(username, t.id),
    label: t.label,
    icon: t.icon,
    tab: t.id,
  })
  const tabs = tabsFor(experience)

  // Primary: always visible on mobile. Search lives in the CommandConsole now
  // (FAB / "L") — it's no longer a nav item.
  const primaryLinks: NavItem[] = tabs.filter(t => t.inNav && t.navGroup === 'primary').map(toLink)

  // Secondary: hidden on mobile (More menu), inline on md+.
  const secondaryLinks = tabs.filter(t => t.inNav && t.navGroup === 'secondary').map(toLink)

  const anySecondaryActive = secondaryLinks.some(l => isActive(l.tab))

  const expanded = !canHover || open || menuOpen
  const measured = size.w > 0 && size.h > 0
  const ready = mounted && measured
  const showOpen = ready && expanded

  const lineW = Math.round(
    Math.min(COLLAPSED_MAX, Math.max(COLLAPSED_MIN, size.w * COLLAPSED_RATIO)),
  )

  // Inline transitions rather than utility classes: the two directions use
  // different curves and durations, and an inline shorthand is the only thing
  // that reliably beats them both. Reduced motion drops the lot.
  const shellTransition = reduceMotion
    ? 'none'
    : expanded
      ? [
          `width ${EXPAND_MS}ms ${SPRING}`,
          `height ${EXPAND_MS}ms ${SPRING}`,
          `border-radius ${EXPAND_MS}ms ${SPRING}`,
          'background-color 170ms linear',
          'border-color 170ms linear',
          'box-shadow 240ms linear',
          'opacity 260ms linear',
        ].join(', ')
      : [
          `width ${COLLAPSE_MS}ms ${SETTLE}`,
          `height ${COLLAPSE_MS}ms ${SETTLE}`,
          `border-radius ${COLLAPSE_MS}ms ${SETTLE}`,
          'background-color 200ms linear 60ms',
          'border-color 140ms linear',
          'box-shadow 200ms linear',
          'opacity 260ms linear',
        ].join(', ')

  const contentTransition = reduceMotion
    ? 'none'
    : expanded
      ? `opacity 200ms ease-out 90ms, transform 280ms ${SPRING} 60ms`
      : `opacity 130ms ease-in, transform 200ms ${SETTLE}`

  // ── Shared link renderer ────────────────────────────────────────────────────

  const NavLink = ({ item, layout }: { item: NavItem; layout: 'bar' | 'menu' }) => {
    const active = isActive(item.tab)
    const Icon = item.icon
    const className = cn(
      layout === 'bar'
        ? 'relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-200 active:scale-95 flex-1 cursor-pointer'
        : 'flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer',
      active ? 'bg-[var(--space-bg-card-hover)]' : 'hover:bg-[var(--space-bg-card-hover)]',
    )
    const inner = (
      <>
        <div className="relative">
          <Icon className={cn('size-5 transition-all duration-200', active ? 'text-[var(--space-nav-fg)]' : 'text-[var(--space-nav-fg-dim)]')} />
          {item.tab === 'packages' && isClient && packageCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[0.875rem] h-[0.875rem] rounded-full bg-red-500 text-white text-[0.5rem] font-bold flex items-center justify-center px-0.5 leading-none shadow-sm">
              {packageCount > 9 ? '9+' : packageCount}
            </span>
          )}
        </div>
        <span className={cn(
          'text-[0.625rem] font-semibold uppercase tracking-widest transition-colors duration-200 leading-none',
          active ? 'text-[var(--space-nav-fg)]' : 'text-[var(--space-nav-fg-dim)]',
        )}>
          {item.label}
        </span>
      </>
    )

    return (
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        onClick={() => setMenuOpen(false)}
        className={className}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div
      className="print:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      {/* Reserves the open bar's box so the shell can contract toward its own
          centre instead of dragging the layout down with it. */}
      <div
        className="relative flex items-center justify-center pointer-events-none"
        style={{ height: size.h || undefined }}
      >
        {/* ── Approach zone ─────────────────────────────────────────────────
            A 5px line is far too small to aim at, so the trigger is a wider
            invisible band around it — only as wide as the bar and only tall
            enough to catch an approach, leaving the rest of the bottom strip
            click-through for the content underneath. */}
        {canHover && (
          <div
            aria-hidden="true"
            className="absolute left-1/2 -translate-x-1/2 bottom-0 pointer-events-auto"
            style={{
              width: Math.max(size.w + 96, 240),
              height: expanded ? '100%' : '2.75rem',
            }}
            onPointerEnter={openSoon}
            onPointerLeave={closeSoon}
          />
        )}

        {/* ── More menu popup ───────────────────────────────────────────────── */}
        <div
          ref={menuRef}
          className={cn(
            'absolute bottom-full mb-3 pointer-events-auto md:hidden',
            'transition-all duration-200 origin-bottom',
            menuOpen
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-2 pointer-events-none',
          )}
          style={{
            background: 'var(--space-bg-base)',
            border: '1px solid var(--space-border)',
            borderRadius: '16px',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
            padding: '8px',
          }}
        >
          <div className={cn('grid gap-1', isClient ? 'grid-cols-2' : 'grid-cols-3')}>
            {secondaryLinks.map((item) => <NavLink key={item.tab} item={item} layout="menu" />)}
          </div>
        </div>

        {/* ── The bar ───────────────────────────────────────────────────────
            One element in both states. Open it is a bordered pill; closed it is
            the indicator line. Contents stay mounted and focusable the whole
            time — Tab reaches them and focus opens the bar — but stop taking
            pointer events while closed so there are no invisible click targets. */}
        <nav
          ref={shellRef}
          aria-label="Sections"
          onPointerEnter={canHover ? openNow : undefined}
          onPointerLeave={canHover ? closeSoon : undefined}
          onFocusCapture={canHover ? openNow : undefined}
          onBlurCapture={canHover ? closeSoon : undefined}
          className="relative flex items-center justify-center"
          style={{
            width: showOpen ? size.w : lineW,
            height: showOpen ? size.h : COLLAPSED_H,
            borderRadius: showOpen ? 16 : 999,
            background: showOpen ? 'var(--space-bg-base)' : 'var(--space-nav-fg-dim)',
            border: `1px solid ${showOpen ? 'var(--space-border)' : 'transparent'}`,
            boxShadow: showOpen
              ? '0 4px 24px rgba(0,0,0,0.30), 0 1px 4px rgba(0,0,0,0.20)'
              : '0 0 0 rgba(0,0,0,0)',
            opacity: ready ? 1 : 0,
            transition: shellTransition,
            pointerEvents: showOpen ? 'auto' : canHover ? 'none' : 'auto',
          }}
        >
          <div
            ref={innerRef}
            className="absolute flex items-center gap-1 p-1.5 max-w-[calc(100vw-1.5rem)]"
            style={{
              opacity: showOpen ? 1 : 0,
              transform: `translate(-50%, -50%) scale(${showOpen ? 1 : 0.94})`,
              left: '50%',
              top: '50%',
              transition: contentTransition,
              pointerEvents: showOpen ? 'auto' : 'none',
            }}
          >
            {/* Primary links — always visible */}
            {primaryLinks.map((item) => <NavLink key={item.tab} item={item} layout="bar" />)}

            {/* Secondary links — hidden on mobile, visible on md+ */}
            {secondaryLinks.map((item) => (
              <div key={item.tab} className="hidden md:contents">
                <NavLink item={item} layout="bar" />
              </div>
            ))}

            {/* More button — mobile only */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className={cn(
                'md:hidden flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer',
                menuOpen || anySecondaryActive ? 'bg-[var(--space-bg-card-hover)]' : 'hover:bg-[var(--space-bg-card-hover)]',
              )}
            >
              <MoreHorizontal className={cn('size-5 transition-all duration-200', menuOpen || anySecondaryActive ? 'text-[var(--space-nav-fg)]' : 'text-[var(--space-nav-fg-dim)]')} />
              <span className={cn(
                'text-[0.625rem] font-semibold uppercase tracking-widest leading-none',
                menuOpen || anySecondaryActive ? 'text-[var(--space-nav-fg)]' : 'text-[var(--space-nav-fg-dim)]',
              )}>
                More
              </span>
            </button>

            {/* Back button — detail sub-pages */}
            {onDetailPage && (
              <>
                <div className="w-px h-6 bg-[var(--space-border)] mx-1 self-center" />
                <button
                  onClick={() => {
                    if (onProjectPage) router.push(`/u/${username}/projects`)
                    else if (onClientPage) router.push(`/u/${username}/clients`)
                  }}
                  className="flex flex-col items-center justify-center size-9 rounded-full bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] hover:border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)] active:scale-95 transition-all duration-200"
                  aria-label="Go back"
                >
                  <ChevronLeft className="size-4 text-[var(--space-nav-fg-dim)]" />
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}
