"use client"

import Link from "next/link"
import { LogOut } from "lucide-react"
import { logoutAction } from "@/actions/auth"
import { UserSettingsModal } from "@/components/dashboard/UserSettingsModal"
import { WelcomeInfoButton } from "@/components/dashboard/WelcomeInfoButton"
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher"
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
  showTips?: boolean
}

export function SpacesHeader({ user, showTips }: SpacesHeaderProps) {
  const handleLogout = async () => {
    await logoutAction()
  }

  const isDeveloper = user?.role === 'admin' || user?.role === 'user'
  const isClient = user?.role === 'client'
  const homeHref = user?.username ? `/u/${user.username}` : '/'
  const { title, subtitle } = useHeaderTitle()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/[0.06] bg-[#222222]">
      <nav className="flex h-full w-full items-center justify-between px-6 lg:px-10" aria-label="Global">

        {/* Logo / breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={homeHref}
            className="text-sm font-bold tracking-[0.2em] shrink-0 text-white focus:outline-none hover:opacity-70 transition-opacity"
          >
            SPACES
          </Link>

          {/* Vertical divider */}
          <div className="w-px h-4 bg-white/20 shrink-0" />

          {/* ThemeSwitcher sits right next to SPACES */}
          <ThemeSwitcher />

          {/* Breadcrumb — only when on a sub-page */}
          {title && (
            <>
              <div className="w-px h-4 bg-white/20 shrink-0" />
              <span className="text-white/40 select-none shrink-0 text-xs">/</span>
              <span className={`text-sm font-medium text-white/70 truncate animate-in fade-in duration-200 ${subtitle ? 'max-w-[120px] sm:max-w-[200px]' : 'max-w-[180px] sm:max-w-[320px]'}`}>
                {title}
              </span>
              {subtitle && (
                <>
                  <span className="text-white/40 select-none shrink-0 text-xs">/</span>
                  <span className="text-sm font-medium text-white/70 truncate max-w-[120px] sm:max-w-[200px] animate-in fade-in duration-200">
                    {subtitle}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Right side actions */}
        {user && (
          <div className="flex items-center gap-2">

            {isClient && (
              <WelcomeInfoButton firstName={user.firstName} showTips={showTips} />
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-200 focus:outline-none"
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
