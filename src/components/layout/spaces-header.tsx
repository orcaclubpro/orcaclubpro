"use client"

import Link from "next/link"
import { LogOut } from "lucide-react"
import { logoutAction } from "@/actions/auth"
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
  const handleLogout = async () => {
    await logoutAction()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.06]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">

        {/* Logo + SPACES Branding */}
        <div className="flex items-baseline gap-1.5">
          <Link
            href="/"
            className="focus:outline-none focus-visible:ring-1 focus-visible:ring-intelligence-cyan/50 rounded-lg transition-all duration-300"
          >
            <span className={`${gothic.className} text-xl text-white`}>ORCACLUB</span>
          </Link>
          <span className="hidden sm:inline text-[11px] font-semibold gradient-text tracking-widest">SPACES</span>
        </div>

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="h-1.5 w-1.5 rounded-full bg-intelligence-cyan shadow-[0_0_8px_rgba(103,232,249,0.6)]" />
              <span className="text-sm font-medium text-gray-300">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-intelligence-cyan/50"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}

      </nav>
    </header>
  )
}
