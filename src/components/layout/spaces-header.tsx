"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogOut, Menu, X } from "lucide-react"
import { logoutAction } from "@/actions/auth"
import { cn } from "@/lib/utils"

interface SpacesHeaderProps {
  user?: {
    firstName?: string | null
    lastName?: string | null
    username?: string | null
  } | null
}

export function SpacesHeader({ user }: SpacesHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const handleLogout = async () => {
    await logoutAction()
  }

  const username = user?.username

  const navItems = [
    { name: "Dashboard", href: `/u/${username}`, matchPath: `/u/${username}` },
    { name: "Projects", href: `/u/${username}/projects`, matchPath: `/u/${username}/projects` },
    { name: "Clients", href: `/u/${username}/clients`, matchPath: `/u/${username}/clients` },
    { name: "Tasks", href: `/u/${username}/tasks`, matchPath: `/u/${username}/tasks` },
    { name: "Orders", href: `/u/${username}/orders`, matchPath: `/u/${username}/orders` },
  ]

  const isActive = (matchPath: string) => {
    // Exact match for dashboard, startsWith for others
    if (matchPath === `/u/${username}`) {
      return pathname === matchPath
    }
    return pathname?.startsWith(matchPath)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.06]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">
        {/* LEFT: Logo + SPACES Branding */}
        <div className="flex items-center gap-4">
          <Link href="/" className="-m-1.5 p-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-intelligence-cyan/50 rounded-lg transition-all duration-300">
            <span className="sr-only">ORCACLUB</span>
            <Image
              src="/orcaclubpro.png"
              alt="ORCACLUB"
              width={32}
              height={32}
              className="h-8 w-8 opacity-90"
            />
          </Link>
          <div className="hidden sm:block h-4 w-px bg-white/[0.08]" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold gradient-text tracking-wide">
              SPACES
            </h1>
          </div>
        </div>

        {/* CENTER: Navigation Tabs (Desktop) */}
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

        {/* RIGHT: User Info + Logout (Desktop) */}
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

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-white/[0.03] hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-intelligence-cyan/50 transition-all duration-300"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
          <div className="space-y-1 px-4 py-6">
            {/* Mobile SPACES Branding */}
            <div className="sm:hidden mb-6">
              <h1 className="text-lg font-semibold gradient-text tracking-wide">
                SPACES
              </h1>
            </div>

            {/* Mobile Navigation */}
            {user && username && (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300",
                      isActive(item.matchPath)
                        ? "text-white bg-white/[0.05] border-l border-intelligence-cyan"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Mobile User Info */}
                <div className="mt-6 pt-6 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2.5 px-4 py-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-intelligence-cyan shadow-[0_0_8px_rgba(103,232,249,0.6)]" />
                    <span className="text-gray-300 font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Mobile Logout */}
            <button
              onClick={() => {
                handleLogout()
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] transition-all duration-300 mt-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
