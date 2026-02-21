'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Building2, CheckSquare, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  role?: string | null
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname()

  // Only show on /u/[username] dashboard routes
  const match = pathname?.match(/^\/u\/([^\/]+)/)
  const username = match?.[1]

  if (!username) return null

  const isClient = role === 'client'

  const links = isClient
    ? [
        { href: `/u/${username}`, label: 'Home', icon: LayoutDashboard, exact: true },
        { href: `/u/${username}/projects`, label: 'Projects', icon: FolderKanban, exact: false },
        { href: `/u/${username}/orders`, label: 'Invoices', icon: Receipt, exact: false },
      ]
    : [
        { href: `/u/${username}`, label: 'Home', icon: LayoutDashboard, exact: true },
        { href: `/u/${username}/projects`, label: 'Projects', icon: FolderKanban, exact: false },
        { href: `/u/${username}/clients`, label: 'Clients', icon: Building2, exact: false },
        { href: `/u/${username}/tasks`, label: 'Tasks', icon: CheckSquare, exact: false },
      ]

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname?.startsWith(href) ?? false
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
          const active = isActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 min-w-[62px]',
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

              {/* Active indicator — slim gradient line */}
              {active && (
                <div
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-px w-5 rounded-full"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, rgba(103,232,249,0.55), transparent)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
