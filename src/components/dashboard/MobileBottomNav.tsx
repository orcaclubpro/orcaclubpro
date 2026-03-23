'use client'

import { useRef, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, Building2, CheckSquare,
  Receipt, Package, ChevronLeft, Search, KeyRound,
  CalendarRange, Files, MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTabContext } from '@/app/(spaces)/TabContext'
import { usePackageCount } from '@/app/(spaces)/PackageCountContext'

interface MobileBottomNavProps {
  role?: string | null
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { activeTab, navigate } = useTabContext()
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

  const isSubPage   = pathname !== `/u/${username}`
  const onProjectPage = pathname?.startsWith(`/u/${username}/projects/`) ?? false
  const onClientPage  = pathname?.startsWith(`/u/${username}/clients/`)  ?? false
  const onDetailPage  = onProjectPage || onClientPage
  const isClient = role === 'client'

  const isActive = (tab: string) => {
    if (pathname !== `/u/${username}`) {
      if (tab === 'projects') return pathname?.startsWith(`/u/${username}/projects/`) ?? false
      if (tab === 'clients')  return pathname?.startsWith(`/u/${username}/clients/`)  ?? false
      return false
    }
    return activeTab === tab
  }

  const handleNav = (href: string, tab: string) => {
    setMenuOpen(false)
    if (tab === 'search') {
      document.dispatchEvent(new CustomEvent('orcaclub:open-search'))
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (isSubPage) router.push(href)
    else navigate(tab)
  }

  // ── Link definitions ────────────────────────────────────────────────────────

  // Primary: always visible on mobile
  const primaryLinks = isClient
    ? [
        { href: `/u/${username}`,                   label: 'Home',    icon: LayoutDashboard, tab: 'home' },
        { href: `/u/${username}?tab=projects`,       label: 'Plan',    icon: FolderKanban,    tab: 'projects' },
        { href: `/u/${username}?tab=invoices`,       label: 'Invoices',icon: Receipt,         tab: 'invoices' },
      ]
    : [
        { href: `/u/${username}`,                   label: 'Home',    icon: LayoutDashboard, tab: 'home' },
        { href: `/u/${username}?tab=projects`,       label: 'Plan',    icon: FolderKanban,    tab: 'projects' },
        { href: `/u/${username}?tab=clients`,        label: 'Clients', icon: Building2,       tab: 'clients' },
        { href: '#search',                          label: 'Search',  icon: Search,          tab: 'search'  },
      ]

  // Secondary: hidden on mobile, shown in More menu / full on md+
  const secondaryLinks = isClient
    ? [
        { href: `/u/${username}?tab=packages`,  label: 'Packages', icon: Package,      tab: 'packages' },
        { href: `/u/${username}?tab=accounts`,  label: 'Accounts', icon: KeyRound,     tab: 'accounts' },
      ]
    : [
        { href: `/u/${username}?tab=tasks`,     label: 'Tasks',     icon: CheckSquare, tab: 'tasks' },
        { href: `/u/${username}?tab=timelines`, label: 'Timelines', icon: CalendarRange,tab: 'timelines' },
        { href: `/u/${username}?tab=files`,     label: 'Files',     icon: Files,       tab: 'files' },
      ]

  const anySecondaryActive = secondaryLinks.some(l => isActive(l.tab))

  // ── Shared link renderer ────────────────────────────────────────────────────

  const NavLink = ({ item }: { item: typeof primaryLinks[0] }) => {
    const active = isActive(item.tab)
    const Icon = item.icon
    return (
      <a
        key={item.tab}
        href={item.href}
        onClick={(e) => { e.preventDefault(); handleNav(item.href, item.tab) }}
        className={cn(
          'relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-200 active:scale-95 flex-1 cursor-pointer',
          active ? 'bg-[var(--space-bg-card-hover)]' : 'hover:bg-[var(--space-bg-card-hover)]',
        )}
      >
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
      </a>
    )
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
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
          {secondaryLinks.map((item) => {
            const active = isActive(item.tab)
            const Icon = item.icon
            return (
              <a
                key={item.tab}
                href={item.href}
                onClick={(e) => { e.preventDefault(); handleNav(item.href, item.tab) }}
                className={cn(
                  'flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer',
                  active ? 'bg-[var(--space-bg-card-hover)]' : 'hover:bg-[var(--space-bg-card-hover)]',
                )}
              >
                <Icon className={cn('size-5', active ? 'text-[var(--space-nav-fg)]' : 'text-[var(--space-nav-fg-dim)]')} />
                <span className={cn(
                  'text-[10px] font-semibold uppercase tracking-widest leading-none',
                  active ? 'text-[var(--space-nav-fg)]' : 'text-[var(--space-nav-fg-dim)]',
                )}>
                  {item.label}
                </span>
              </a>
            )
          })}
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
        {primaryLinks.map((item) => <NavLink key={item.tab} item={item} />)}

        {/* Secondary links — hidden on mobile, visible on md+ */}
        {secondaryLinks.map((item) => (
          <div key={item.tab} className="hidden md:contents">
            <NavLink item={item} />
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
                if (onProjectPage) router.push(`/u/${username}?tab=projects`)
                else if (onClientPage) router.push(`/u/${username}?tab=clients`)
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
