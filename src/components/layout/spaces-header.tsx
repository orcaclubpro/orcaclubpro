"use client"

import Link from "next/link"
import { AccountSidebar } from "@/components/dashboard/AccountSidebar"
import { OrcaMark } from "@/components/dashboard/OrcaMark"
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
  const isDeveloper = user?.role === 'admin' || user?.role === 'user'
  const isClient = user?.role === 'client'
  const homeHref = '/'
  const { title, subtitle } = useHeaderTitle()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--space-border)]"
      style={{ height: 'var(--space-header, 88px)', background: 'var(--space-bg-base)' }}
    >
      <nav className="flex h-full w-full items-center justify-between px-8 lg:px-12" aria-label="Global">

        {/* Logo / breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={homeHref}
            className="flex items-center gap-2.5 shrink-0 focus:outline-none hover:opacity-70 transition-opacity"
          >
            {/* Masked, so the orca inherits nav colour instead of staying white on the light themes */}
            <OrcaMark size={38} style={{ color: 'var(--space-nav-fg)' }} />
            <span className="text-[19px] font-bold tracking-[0.2em] text-[var(--space-nav-fg)]">
              SPACES
            </span>
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

            {/* One control: the menu. Appearance, view as client, account, sign out. */}
            <AccountSidebar
              name={
                isClient
                  ? (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || '')
                  : (user.name ?? user.email ?? '')
              }
              email={user.email ?? ''}
              title={user.title}
              role={user.role}
              isStaff={isDeveloper}
            />
          </div>
        )}

      </nav>
    </header>
  )
}
