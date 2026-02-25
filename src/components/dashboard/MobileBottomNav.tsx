'use client'

import { useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Building2, CheckSquare, Receipt, Package, ChevronLeft, Search, KeyRound } from 'lucide-react'

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

  useEffect(() => {
    const el = navRef.current
    if (!el) return
    el.style.animation = 'navSlideUp 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
  }, [])

  // Only show on /u/[username] dashboard routes
  const match = pathname?.match(/^\/u\/([^\/]+)/)
  const username = match?.[1]

  if (!username) return null

  // Are we on a sub-page (project/client detail) rather than the main dashboard?
  const isSubPage = pathname !== `/u/${username}`
  const onProjectPage = pathname?.startsWith(`/u/${username}/projects/`) ?? false
  const onClientPage  = pathname?.startsWith(`/u/${username}/clients/`)  ?? false
  const onDetailPage  = onProjectPage || onClientPage

  const isClient = role === 'client'

  const links = isClient
    ? [
        { href: `/u/${username}`, label: 'Home', icon: LayoutDashboard, tab: 'home' },
        { href: `/u/${username}?tab=projects`, label: 'Plan', icon: FolderKanban, tab: 'projects' },
        { href: `/u/${username}?tab=invoices`, label: 'Invoices', icon: Receipt, tab: 'invoices' },
        { href: `/u/${username}?tab=packages`, label: 'Packages', icon: Package, tab: 'packages' },
        { href: `/u/${username}?tab=accounts`, label: 'Accounts', icon: KeyRound, tab: 'accounts' },
      ]
    : [
        { href: `/u/${username}`, label: 'Home', icon: LayoutDashboard, tab: 'home' },
        { href: `/u/${username}?tab=projects`, label: 'Plan', icon: FolderKanban, tab: 'projects' },
        { href: `/u/${username}?tab=clients`, label: 'Clients', icon: Building2, tab: 'clients' },
        { href: `/u/${username}?tab=tasks`, label: 'Tasks', icon: CheckSquare, tab: 'tasks' },
      ]

  const isActive = (tab: string) => {
    // On a detail sub-page (e.g. /u/user/clients/123), match by pathname segment
    if (pathname !== `/u/${username}`) {
      if (tab === 'projects') return pathname?.startsWith(`/u/${username}/projects/`) ?? false
      if (tab === 'clients') return pathname?.startsWith(`/u/${username}/clients/`) ?? false
      return false
    }
    // On the main page, match by ?tab= param
    return activeTab === tab
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        ref={navRef}
        className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-2xl max-w-[calc(100vw-1.5rem)]"
        style={{ opacity: 0,
          background: 'rgba(6, 6, 10, 0.82)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow:
            '0 -1px 0 rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)',
        }}
      >
        {links.map((item) => {
          const active = isActive(item.tab)
          const Icon = item.icon
          return (
            <a
              key={item.tab}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'instant' })
                if (isSubPage) {
                  router.push(item.href)
                } else {
                  navigate(item.tab)
                }
              }}
              className={cn(
                'relative flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 flex-1 cursor-pointer',
                active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]',
              )}
              style={active ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 20px rgba(103,232,249,0.02)' } : undefined}
            >
              <div className="relative">
                <Icon
                  className={cn('size-5 transition-all duration-200', active ? 'text-cyan-400' : 'text-gray-500')}
                  style={active ? { filter: 'drop-shadow(0 0 6px rgba(103, 232, 249, 0.45))' } : undefined}
                />
                {item.tab === 'packages' && isClient && packageCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none shadow-sm">
                    {packageCount > 9 ? '9+' : packageCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-semibold uppercase tracking-widest transition-colors duration-200 leading-none', active ? 'text-gray-300' : 'text-gray-400')}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-px w-5 rounded-full"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(103,232,249,0.55), transparent)' }} />
              )}
            </a>
          )
        })}

        {/* Search button — admin/user only */}
        {!isClient && (
          <>
            <div className="w-px h-5 bg-white/[0.07] self-center mx-0.5" />
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('orcaclub:open-search'))}
              className="relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-200 active:scale-95 min-w-[52px] hover:bg-white/[0.03] cursor-pointer"
              aria-label="Open search"
            >
              <Search className="size-5 text-gray-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 leading-none">
                Search
              </span>
            </button>
          </>
        )}

        {/* Back circle — shows on project or client detail pages */}
        {onDetailPage && (
          <>
            <div className="w-px h-6 bg-white/[0.08] mx-1 self-center" />
            <button
              onClick={() => {
                if (onProjectPage) router.push(`/u/${username}?tab=projects`)
                else if (onClientPage) router.push(`/u/${username}?tab=clients`)
              }}
              className="flex flex-col items-center justify-center size-9 rounded-full bg-white/[0.05] border border-white/[0.10] hover:border-intelligence-cyan/30 hover:bg-intelligence-cyan/[0.08] active:scale-95 transition-all duration-200"
              aria-label="Go back"
            >
              <ChevronLeft className="size-4 text-gray-400" />
            </button>
          </>
        )}
      </nav>
    </div>
  )
}
