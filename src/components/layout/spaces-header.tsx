"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { logoutAction } from "@/actions/auth"
import { cn } from "@/lib/utils"
import { Cinzel_Decorative } from "next/font/google"

const gothic = Cinzel_Decorative({ weight: "700", subsets: ["latin"] })

interface SpacesHeaderProps {
  user?: {
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    role?: string | null
  } | null
}

export function SpacesHeader({ user }: SpacesHeaderProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await logoutAction()
  }

  const username = user?.username
  const isClient = user?.role === 'client'

  const navItems = isClient
    ? [
        { name: "Portfolio", href: `/u/${username}`, matchPath: `/u/${username}` },
        { name: "Projects", href: `/u/${username}/projects`, matchPath: `/u/${username}/projects` },
      ]
    : [
        { name: "Portfolio", href: `/u/${username}`, matchPath: `/u/${username}` },
        { name: "Projects", href: `/u/${username}/projects`, matchPath: `/u/${username}/projects` },
        { name: "Clients", href: `/u/${username}/clients`, matchPath: `/u/${username}/clients` },
        { name: "Tasks", href: `/u/${username}/tasks`, matchPath: `/u/${username}/tasks` },
      ]

  const isActive = (matchPath: string) => {
    if (matchPath === `/u/${username}`) {
      return pathname === matchPath
    }
    return pathname?.startsWith(matchPath)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.06]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">

        {/* LEFT: Logo + SPACES Branding */}
        <div className="flex items-baseline gap-1.5">
          <Link
            href="/"
            className="focus:outline-none focus-visible:ring-1 focus-visible:ring-intelligence-cyan/50 rounded-lg transition-all duration-300"
          >
            <span className={`${gothic.className} text-xl text-white`}>ORCACLUB</span>
          </Link>
          <span className="hidden sm:inline text-[11px] font-semibold gradient-text tracking-widest">SPACES</span>
        </div>

        {/* CENTER: Navigation Tabs — desktop only (mobile handled by MobileBottomNav) */}
        {user && username && (
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative px-5 py-2 text-sm font-medium transition-all duration-300",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-intelligence-cyan/50 rounded-lg",
                  isActive(item.matchPath)
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                {item.name}
                {isActive(item.matchPath) && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-intelligence-cyan to-transparent" />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* RIGHT: Desktop user info + logout */}
        <div className="hidden md:flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="h-1.5 w-1.5 rounded-full bg-intelligence-cyan shadow-[0_0_8px_rgba(103,232,249,0.6)]" />
              <span className="text-sm font-medium text-gray-300">
                {user.firstName} {user.lastName}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-intelligence-cyan/50"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile: compact user pill + logout — navigation is handled by MobileBottomNav */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <div className="h-1.5 w-1.5 rounded-full bg-intelligence-cyan/80 shadow-[0_0_5px_rgba(103,232,249,0.5)]" />
                <span className="text-[11px] font-medium text-gray-400 max-w-[72px] truncate">
                  {user.firstName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-all duration-200"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

      </nav>
    </header>
  )
}
