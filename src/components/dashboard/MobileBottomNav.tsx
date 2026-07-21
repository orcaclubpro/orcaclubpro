'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, Search, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePackageCount } from '@/app/(spaces)/PackageCountContext'
import { experienceFor } from '@/app/(spaces)/experience'
import { tabsFor, tabHref, type TabDef } from '@/app/(spaces)/u/[username]/tabs'

interface MobileBottomNavProps {
  role?: string | null
}

interface NavItem {
  href: string
  label: string
  icon: TabDef['icon']
  tab: string
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { packageCount } = usePackageCount()
  const navRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const el = navRef.current
    if (!el) return
    el.style.animation = 'navSlideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
  }, [])

  // Close More menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        navRef.current && !navRef.current.contains(e.target as Node)
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
  const experience = experienceFor(role)
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

  // Primary: always visible on mobile. Staff also get a Search shortcut (not a tab).
  const primaryLinks: NavItem[] = [
    ...tabs.filter(t => t.inNav && t.navGroup === 'primary').map(toLink),
    ...(isClient ? [] : [{ href: '#search', label: 'Search', icon: Search, tab: 'search' }]),
  ]

  // Secondary: hidden on mobile (More menu), inline on md+.
  const secondaryLinks = tabs.filter(t => t.inNav && t.navGroup === 'secondary').map(toLink)

  const anySecondaryActive = secondaryLinks.some(l => isActive(l.tab))

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
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none shadow-sm">
              {packageCount > 9 ? '9+' : packageCount}
            </span>
          )}
        </div>
        <span className={cn(
          'text-[10px] font-semibold uppercase tracking-widest transition-colors duration-200 leading-none',
          active ? 'text-[var(--space-nav-fg)]' : 'text-[var(--space-nav-fg-dim)]',
        )}>
          {item.label}
        </span>
      </>
    )

    // Search is a command-palette trigger, not a route
    if (item.tab === 'search') {
      return (
        <a
          href={item.href}
          onClick={(e) => {
            e.preventDefault()
            setMenuOpen(false)
            document.dispatchEvent(new CustomEvent('orcaclub:open-search'))
          }}
          className={className}
        >
          {inner}
        </a>
      )
    }

    return (
      <Link href={item.href} onClick={() => setMenuOpen(false)} className={className}>
        {inner}
      </Link>
    )
  }

  return (
    <div
      className="print:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
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

      {/* ── Nav bar ──────────────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-2xl max-w-[calc(100vw-1.5rem)]"
        style={{
          opacity: 0,
          background: 'var(--space-bg-base)',
          border: '1px solid var(--space-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.30), 0 1px 4px rgba(0,0,0,0.20)',
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
            'text-[10px] font-semibold uppercase tracking-widest leading-none',
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
      </nav>
    </div>
  )
}
