'use client'

import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Building2, CheckSquare, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTabContext } from '@/app/(spaces)/TabContext'

interface MobileBottomNavProps {
  role?: string | null
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { activeTab, navigate } = useTabContext()

  // Only show on /u/[username] dashboard routes
  const match = pathname?.match(/^\/u\/([^\/]+)/)
  const username = match?.[1]

  if (!username) return null

  const isClient = role === 'client'

  const links = isClient
    ? [
        { href: `/u/${username}`, label: 'Home', icon: LayoutDashboard, tab: 'home' },
        { href: `/u/${username}?tab=projects`, label: 'Projects', icon: FolderKanban, tab: 'projects' },
        { href: `/u/${username}?tab=invoices`, label: 'Invoices', icon: Receipt, tab: 'invoices' },
      ]
    : [
        { href: `/u/${username}`, label: 'Home', icon: LayoutDashboard, tab: 'home' },
        { href: `/u/${username}?tab=projects`, label: 'Projects', icon: FolderKanban, tab: 'projects' },
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-2xl"
        style={{
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
              onClick={(e) => { e.preventDefault(); navigate(item.tab) }}
              className={cn(
                'relative flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 min-w-[62px] cursor-pointer',
                active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]',
              )}
              style={
                active
                  ? {
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 20px rgba(103,232,249,0.02)',
                    }
                  : undefined
              }
            >
              <Icon
                className={cn(
                  'size-5 transition-all duration-200',
                  active ? 'text-cyan-400' : 'text-gray-500',
                )}
                style={
                  active
                    ? { filter: 'drop-shadow(0 0 6px rgba(103, 232, 249, 0.45))' }
                    : undefined
                }
              />
              <span
                className={cn(
                  'text-[9px] font-semibold uppercase tracking-widest transition-colors duration-200 leading-none',
                  active ? 'text-gray-300' : 'text-gray-600',
                )}
              >
                {item.label}
              </span>

              {active && (
                <div
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-px w-5 rounded-full"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, rgba(103,232,249,0.55), transparent)',
                  }}
                />
              )}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
