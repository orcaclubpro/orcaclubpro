"use client"

import Link from "next/link"
import { LogOut } from "lucide-react"
import { logoutAction } from "@/actions/auth"
import { UserSettingsModal } from "@/components/dashboard/UserSettingsModal"
import { useHeaderTitle } from "@/app/(spaces)/HeaderTitleContext"

interface SpacesHeaderProps {
  user?: {
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    role?: string | null
    name?: string | null
    email?: string | null
    title?: string | null
  } | null
}

export function SpacesHeader({ user }: SpacesHeaderProps) {
  const handleLogout = async () => {
    await logoutAction()
  }

  const isDeveloper = user?.role === 'admin' || user?.role === 'user'
  const homeHref = user?.username ? `/u/${user.username}` : '/'
  const { title, subtitle } = useHeaderTitle()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.06]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">

        {/* Logo / breadcrumb */}
        {title ? (
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={homeHref}
              className="text-sm font-semibold gradient-text tracking-widest shrink-0 focus:outline-none hover:opacity-80 transition-opacity"
            >
              SPACES
            </Link>
            <span className="text-gray-700 select-none shrink-0">/</span>
            <span className={`text-sm font-semibold text-white truncate ${subtitle ? 'max-w-[120px] sm:max-w-[200px]' : 'max-w-[180px] sm:max-w-[320px]'}`}>
              {title}
            </span>
            {subtitle && (
              <>
                <span className="text-gray-700 select-none shrink-0">/</span>
                <span className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-[200px]">
                  {subtitle}
                </span>
              </>
            )}
          </div>
        ) : (
          <Link
            href={homeHref}
            className="focus:outline-none focus-visible:ring-1 focus-visible:ring-intelligence-cyan/50 rounded-lg transition-all duration-300"
          >
            <span className="text-xl font-bold gradient-text tracking-widest">SPACES</span>
          </Link>
        )}

        {/* User info + settings + logout */}
        {user && (
          <div className="flex items-center gap-2.5">

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-intelligence-cyan/50"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {isDeveloper && user.name != null && user.email != null && (
              <UserSettingsModal
                name={user.name}
                email={user.email}
                title={user.title}
              />
            )}
          </div>
        )}

      </nav>
    </header>
  )
}
