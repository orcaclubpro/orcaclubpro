"use client"

import Link from "next/link"
import { LogOut } from "lucide-react"
import { logoutAction } from "@/actions/auth"
import { UserMenu } from "@/components/dashboard/UserMenu"
import { WelcomeInfoButton } from "@/components/dashboard/WelcomeInfoButton"
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
    // lastName already present — no change needed
  } | null
  showTips?: boolean
}

export function SpacesHeader({ user, showTips }: SpacesHeaderProps) {
  const handleLogout = async () => {
    await logoutAction()
  }

  const isDeveloper = user?.role === 'admin' || user?.role === 'user'
  const isClient = user?.role === 'client'
  const homeHref = '/'
  const { title, subtitle } = useHeaderTitle()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[88px] border-b border-[var(--space-border)]" style={{ background: 'var(--space-bg-base)' }}>
      <nav className="flex h-full w-full items-center justify-between px-8 lg:px-12" aria-label="Global">

        {/* Logo / breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={homeHref}
            className="text-[19px] font-bold tracking-[0.2em] shrink-0 text-[var(--space-nav-fg)] focus:outline-none hover:opacity-70 transition-opacity"
          >
            SPACES
          </Link>

          {/* Breadcrumb — only when on a sub-page */}
          {title && (
            <>
              <div className="w-px h-5 bg-[var(--space-border-hard)] shrink-0" />
              <span className="text-[var(--space-nav-fg-dim)] select-none shrink-0 text-[13px]">/</span>
              <span className={`text-[17px] font-medium text-[var(--space-nav-fg)] truncate animate-in fade-in duration-200 ${subtitle ? 'max-w-[120px] sm:max-w-[200px]' : 'max-w-[180px] sm:max-w-[320px]'}`}>
                {title}
              </span>
              {subtitle && (
                <>
                  <span className="text-[var(--space-nav-fg-dim)] select-none shrink-0 text-[13px]">/</span>
                  <span className="text-[17px] font-medium text-[var(--space-nav-fg)] truncate max-w-[120px] sm:max-w-[200px] animate-in fade-in duration-200">
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

            {/* Orca menu — theme · view as client (staff) · account settings */}
            {user.email != null && (
              <UserMenu
                name={
                  isClient
                    ? (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email)
                    : (user.name ?? user.email)
                }
                email={user.email}
                title={user.title}
                role={user.role}
                isStaff={isDeveloper}
              />
            )}

            {/* Logout — always the far-right control */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[17px] font-medium text-[var(--space-nav-fg-dim)] hover:text-[var(--space-nav-fg)] hover:bg-[var(--space-bg-card-hover)] transition-all duration-200 focus:outline-none"
              aria-label="Logout"
            >
              <LogOut className="h-[22px] w-[22px]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}

      </nav>
    </header>
  )
}
