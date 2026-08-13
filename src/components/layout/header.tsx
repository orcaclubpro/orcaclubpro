"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  X, ArrowRight, Clock, Code2, Server, Search, Sparkles, MapPin,
  TrendingUp, Megaphone, Rocket, ShoppingBag, Target, User,
  LogOut, LayoutDashboard, ChevronDown,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { logoutAction } from "@/actions/auth"
import { Cinzel_Decorative } from "next/font/google"
import { NAV_ITEMS, type NavItem } from "@/data/nav"
import { OFFERS } from "@/data/pricing"

const gothic = Cinzel_Decorative({ weight: "700", subsets: ["latin"] })

/**
 * Nav structure lives in src/data/nav.ts — this file only maps routes to icons,
 * so labels, hrefs, and prices can never drift between header, footer, and page.
 */
const ICONS: Record<string, LucideIcon> = {
  '/websites/payload-cms': Code2,
  '/websites/shopify': ShoppingBag,
  '/websites/custom-commerce': Rocket,
  '/care': Server,
  '/get-found/audit': Search,
  '/get-found/growth': TrendingUp,
  '/get-found/seo': Search,
  '/get-found/local-visibility': MapPin,
  '/get-found/ai-search': Sparkles,
  '/get-found/google-ads': Target,
  '/get-found/meta-ads': Megaphone,
}

const HUBS = NAV_ITEMS.filter((item) => item.children?.length)
const TOP_LINKS = NAV_ITEMS.filter(
  (item) => !item.children?.length && !item.comingSoon && !item.external,
)

interface HeaderUser {
  username?: string | null
  role?: string | null
}

export function Header({ user }: { user?: HeaderUser | null } = {}) {
  const [mobileMenuOpen, setMobileMenuOpen]   = React.useState(false)
  /** href of the hub whose dropdown is open, or null. */
  const [openHub, setOpenHub]                 = React.useState<string | null>(null)
  const [profileOpen, setProfileOpen]         = React.useState(false)
  const [scrolled, setScrolled]               = React.useState(false)
  const [mounted, setMounted]                 = React.useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const dropdownCloseTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const profileCloseTimer  = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Scroll-aware header
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mount animation
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const openDropdown  = (href: string) => { clearTimeout(dropdownCloseTimer.current); setOpenHub(href) }
  const closeDropdown = () => { dropdownCloseTimer.current = setTimeout(() => setOpenHub(null), 160) }

  const openProfile  = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearTimeout(profileCloseTimer.current)
    clearTimeout(dropdownCloseTimer.current)
    setOpenHub(null)
    setProfileOpen(true)
  }
  const closeProfile = () => { profileCloseTimer.current = setTimeout(() => setProfileOpen(false), 160) }
  const keepProfile  = () => { clearTimeout(profileCloseTimer.current) }

  const dashboardHref = user?.username
    ? `/u/${user.username}`
    : user?.role === 'admin' || user?.role === 'user'
      ? '/admin'
      : null

  const authNavItem = dashboardHref
    ? { name: 'My Dashboard', href: dashboardHref }
    : { name: 'Login', href: '/login' }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  React.useEffect(() => { setMobileMenuOpen(false); setOpenHub(null) }, [pathname])

  React.useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 overflow-visible pointer-events-auto transition-all duration-500 ${
          scrolled
            ? 'bg-zinc-950 border-b border-zinc-800/80'
            : 'bg-transparent border-b border-transparent'
        } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
        style={{ transition: 'background-color 0.5s ease, border-color 0.5s ease, opacity 0.6s ease, transform 0.6s ease' }}
        onClick={(e) => {
          if (pathname !== '/') return
          if ((e.target as HTMLElement).closest('a, button')) return
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      >
        <nav className="mx-auto flex h-[83px] max-w-7xl items-center justify-between px-6 lg:px-8">

          {/* Logo */}
          <div className="flex flex-1 -ml-1">
            <Link
              href="/"
              className="group flex items-center gap-2 cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                if (pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  router.push('/')
                }
              }}
            >
              <span className={`${gothic.className} text-2xl text-white transition-opacity duration-300 group-hover:opacity-80`}>
                ORCACLUB
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-x-7 items-center">
            {/* One trigger per hub — each owns its own mega dropdown */}
            {HUBS.map((hub) => {
              const hubActive = isActive(hub.href)
              const isOpen = openHub === hub.href
              return (
                <div
                  key={hub.href}
                  className="relative"
                  onMouseEnter={() => openDropdown(hub.href)}
                  onMouseLeave={closeDropdown}
                >
                  <Link
                    href={hub.href}
                    className={`relative flex items-center gap-1 text-[15px] font-medium pb-0.5 transition-colors duration-200 ${
                      isOpen || hubActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {hub.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                    {hubActive && !isOpen && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-cyan-400/60 rounded-full" />
                    )}
                  </Link>
                </div>
              )
            })}

            {TOP_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} active={isActive(link.href)}>
                {link.label}
              </NavLink>
            ))}

            {/* Profile / Login */}
            {dashboardHref ? (
              <div
                className="relative"
                onMouseEnter={openProfile}
                onMouseLeave={closeProfile}
              >
                <button
                  onClick={openProfile}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${
                    profileOpen
                      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-full z-50 animate-slideDown"
                    onMouseEnter={keepProfile}
                    onMouseLeave={closeProfile}
                  >
                    <div className="mt-2.5 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-w-[188px] shadow-xl shadow-black/50">
                      <Link
                        href={authNavItem.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-cyan-400/70 flex-shrink-0" />
                        {authNavItem.name}
                      </Link>
                      <div className="border-t border-zinc-800" />
                      <button
                        onClick={() => { logoutAction(); setProfileOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-colors"
                      >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <NavLink href="/login" active={isActive('/login')}>Login</NavLink>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 text-zinc-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-5 h-4">
                <span className={`absolute left-0 h-px bg-current transition-all duration-300 ${mobileMenuOpen ? 'top-2 w-5 rotate-45' : 'top-0 w-5'}`} />
                <span className={`absolute left-0 top-2 h-px bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 w-0' : 'opacity-100 w-3.5'}`} />
                <span className={`absolute left-0 h-px bg-current transition-all duration-300 ${mobileMenuOpen ? 'top-2 w-5 -rotate-45' : 'top-4 w-5'}`} />
              </div>
            </button>
          </div>
        </nav>

        {/* Desktop Mega Dropdown — one per hub, driven by NAV_ITEMS */}
        {HUBS.map((hub) => {
          if (openHub !== hub.href) return null
          const children = hub.children ?? []
          const featured = children.filter((c) => c.featured)
          const supporting = children.filter((c) => !c.featured)

          return (
            <div
              key={hub.href}
              className="hidden md:block absolute left-0 right-0 top-full animate-slideDown"
              onMouseEnter={() => openDropdown(hub.href)}
              onMouseLeave={closeDropdown}
            >
              <div className="bg-zinc-900 shadow-2xl shadow-black/70 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto flex divide-x divide-zinc-800">

                  {/* ── MONEY PAGES ── the numbered grid */}
                  <div className="flex-1 px-8 py-8">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-[9px] tracking-[0.45em] uppercase font-semibold text-zinc-500">
                        {hub.label}
                      </span>
                      <div className="flex-1 h-px bg-zinc-800" />
                    </div>

                    <div className="grid grid-cols-2 gap-x-10 gap-y-0 mb-8">
                      {featured.map((item, i) => {
                        const Icon = ICONS[item.href]
                        const offer = item.priceKey ? OFFERS[item.priceKey] : null
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group relative flex items-start gap-4 py-3.5 border-b border-zinc-800/50 hover:border-zinc-700/60 transition-colors"
                          >
                            <span className="text-2xl font-extralight text-zinc-700 group-hover:text-cyan-400/50 transition-colors duration-200 tabular-nums leading-none mt-0.5 w-8 flex-shrink-0 select-none">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                {Icon && (
                                  <Icon className="h-3.5 w-3.5 text-zinc-600 group-hover:text-cyan-400 transition-colors duration-150 flex-shrink-0" />
                                )}
                                <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                                  {item.label}
                                </p>
                              </div>
                              <p className="text-xs text-zinc-600 font-light leading-relaxed mb-1">
                                {item.description}
                              </p>
                              {offer && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                    {offer.priceDisplay}
                                  </span>
                                  {offer.timeline && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-2.5 w-2.5 text-zinc-700 flex-shrink-0" />
                                      <span className="text-xs text-zinc-600 font-light">{offer.timeline}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-cyan-400/60 flex-shrink-0 mt-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                          </Link>
                        )
                      })}
                    </div>

                    <Link
                      href={hub.href}
                      className="group flex items-center gap-1 text-xs text-cyan-400/50 hover:text-cyan-400 transition-colors"
                    >
                      Everything in {hub.label}
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {/* ── SUPPORTING ── spokes and related offers */}
                  <div className="w-72 px-8 py-8 bg-zinc-800/20">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-[9px] tracking-[0.45em] uppercase font-semibold text-zinc-500">
                        {hub.href === '/get-found' ? 'Channels' : 'After Launch'}
                      </span>
                      <div className="flex-1 h-px bg-zinc-800" />
                    </div>

                    <div className="space-y-0.5 mb-6">
                      {supporting.map((item) => {
                        const Icon = ICONS[item.href]
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-center gap-3 px-3 py-2 rounded-lg border border-transparent hover:border-zinc-700/50 hover:bg-zinc-800/50 transition-all duration-150"
                          >
                            {Icon ? (
                              <Icon className="h-3 w-3 text-zinc-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-cyan-400 transition-colors flex-shrink-0" />
                            )}
                            <span className="flex-1 text-sm text-zinc-400 group-hover:text-white transition-colors">
                              {item.label}
                            </span>
                            {item.priceKey && (
                              <span className="text-xs font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0">
                                {OFFERS[item.priceKey].priceDisplay}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>

                    <div className="border-t border-zinc-800 pt-4 space-y-0.5">
                      <Link
                        href="/pricing"
                        className="group flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-zinc-800/50 transition-colors"
                      >
                        <span className="text-xs text-zinc-600 group-hover:text-zinc-300 transition-colors">All Pricing</span>
                        <ArrowRight className="h-3 w-3 text-zinc-700 group-hover:text-cyan-400/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>
                      <Link
                        href="/contact"
                        className="group flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-zinc-800/50 transition-colors"
                      >
                        <span className="text-xs text-zinc-600 group-hover:text-zinc-300 transition-colors">Start a project</span>
                        <ArrowRight className="h-3 w-3 text-zinc-700 group-hover:text-cyan-400/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )
        })}
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-zinc-950 border-l border-zinc-800/80 overflow-y-auto animate-slideInRight">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/80">
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  setMobileMenuOpen(false)
                  if (pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    router.push('/')
                  }
                }}
              >
                <span className={`${gothic.className} text-xl text-white`}>ORCACLUB</span>
              </Link>
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 text-zinc-500 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Links — same NAV_ITEMS source as desktop, hubs expanded inline */}
            <div className="px-4 py-6 space-y-1">
              {HUBS.map((hub) => (
                <div key={hub.href} className="pb-2">
                  <Link
                    href={hub.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(hub.href)
                        ? 'text-white bg-zinc-800/60'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {hub.label}
                    {isActive(hub.href) && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
                  </Link>
                  <div className="mt-1 ml-4 pl-3 border-l border-zinc-800 space-y-0.5">
                    {(hub.children ?? []).map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-colors ${
                          isActive(child.href)
                            ? 'text-white bg-zinc-800/60'
                            : 'text-zinc-500 hover:text-white hover:bg-zinc-800/40'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{child.label}</span>
                        {child.priceKey && (
                          <span className="text-xs font-mono text-zinc-600 flex-shrink-0">
                            {OFFERS[child.priceKey].priceDisplay}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {TOP_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-white bg-zinc-800/60'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                  {isActive(item.href) && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
                </Link>
              ))}
            </div>

            {/* Bottom CTAs */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-zinc-800/80 bg-zinc-950 space-y-3">
              <Link
                href="/contact"
                className="block w-full text-center px-6 py-3.5 bg-gradient-to-r from-cyan-500/80 to-cyan-400/80 text-black font-semibold rounded-lg hover:from-cyan-400 hover:to-cyan-300 transition-all text-sm shadow-lg shadow-cyan-900/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Your Project
              </Link>
              <Link
                href={authNavItem.href}
                className="block w-full text-center px-6 py-3.5 border border-zinc-700 text-zinc-400 font-medium rounded-lg hover:bg-zinc-800/50 hover:text-white transition-all text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                {authNavItem.name}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`relative text-[15px] font-medium pb-0.5 transition-colors duration-200 ${
        active ? 'text-white' : 'text-zinc-400 hover:text-white'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-px bg-cyan-400/60 rounded-full" />
      )}
    </Link>
  )
}
