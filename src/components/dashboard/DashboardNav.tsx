'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Building2, LogOut } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { User } from '@/types/payload-types'

export function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await logoutAction()
  }

  const links = [
    {
      href: `/u/${user.username}`,
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: pathname === `/u/${user.username}`,
    },
    {
      href: `/u/${user.username}/projects`,
      label: 'Projects',
      icon: FolderKanban,
      active: pathname?.startsWith(`/u/${user.username}/projects`),
    },
    {
      href: `/u/${user.username}/clients`,
      label: 'Clients',
      icon: Building2,
      active: pathname?.startsWith(`/u/${user.username}/clients`),
    },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--space-bg-base)] border-b border-[var(--space-border-hard)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/u/${user.username}`} className="flex items-center gap-2">
            <span className="font-bold text-[var(--space-text-primary)] text-lg">ORCA</span>
            <span className="font-bold text-[var(--space-accent)] text-lg">CLUB</span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                      link.active
                        ? 'bg-[rgba(139,156,182,0.10)] text-[var(--space-accent)] border border-[rgba(139,156,182,0.15)]'
                        : 'text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[rgba(255,255,255,0.06)]'
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline text-sm font-medium">{link.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[var(--space-border-hard)]">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-[var(--space-text-primary)]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[var(--space-text-secondary)]">{user.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)] gap-2"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
