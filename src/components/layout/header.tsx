"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  X, ArrowRight, Clock, Code2, Palette, Server, Search,
  BarChart3, Zap, Plug, Rocket, ShoppingBag, Target, User,
  LogOut, LayoutDashboard, ChevronDown,
} from "lucide-react"
import { logoutAction } from "@/actions/auth"
import { Cinzel_Decorative } from "next/font/google"

const gothic = Cinzel_Decorative({ weight: "700", subsets: ["latin"] })

const services = [
  { name: "Web Design",           description: "Modern, responsive websites",  href: "/services/web-design",         icon: Palette },
  { name: "CMS Development",      description: "Headless CMS & Payload",        href: "/services/cms-development",    icon: Code2 },
  { name: "Hosting & Infrastructure", description: "Managed hosting included",  href: "/services/hosting-infrastructure", icon: Server },
  { name: "Technical SEO",        description: "Schema, speed & structure",     href: "/services/technical-seo",      icon: Search },
  { name: "Custom Development",   description: "Portals, dashboards, SaaS",     href: "/services/custom-development", icon: Rocket },
  { name: "E-commerce",           description: "Online stores & Shopify",       href: "/services/ecommerce",          icon: ShoppingBag },
]

const integrations = [
  { name: "API Integrations",     description: "CRM, Shopify, custom APIs",     href: "/services/api-integrations",       icon: Plug },
  { name: "Analytics & Tracking", description: "GA4, GTM, dashboards",          href: "/services/analytics-tracking",     icon: BarChart3 },
  { name: "Marketing Integration",description: "Google Ads, Meta, LinkedIn",    href: "/services/marketing-integration",  icon: Target },
  { name: "Automation & Workflows",description: "Business process automation",  href: "/services/automation-workflows",   icon: Zap },
]

const packages = [
  { name: "Launch",     description: "Professional website in 3-5 days",       timeline: "3-5 days",   price: "$1K–3K",    href: "/packages/launch" },
  { name: "Scale",      description: "Website + integrations & analytics",      timeline: "7-10 days",  price: "$3K–5K",    href: "/packages/scale", popular: true },
  { name: "Enterprise", description: "Custom solutions & Shopify",              timeline: "14-21 days", price: "$6K–30K",   href: "/packages/enterprise" },
]

const quickLinks = [
  { name: "All Pricing",      href: "/packages" },
  { name: "Our Work",         href: "/portfolio" },
  { name: "About",            href: "/about" },
  { name: "Meet the Founder", href: "/founder" },
]

interface HeaderUser {
  username?: string | null
  role?: string | null
}

export function Header({ user }: { user?: HeaderUser | null } = {}) {
  const [mobileMenuOpen, setMobileMenuOpen]   = React.useState(false)
  const [dropdownOpen, setDropdownOpen]       = React.useState(false)
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

  const openDropdown  = () => { clearTimeout(dropdownCloseTimer.current); setDropdownOpen(true) }
  const closeDropdown = () => { dropdownCloseTimer.current = setTimeout(() => setDropdownOpen(false), 160) }

  const openProfile  = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearTimeout(profileCloseTimer.current)
    clearTimeout(dropdownCloseTimer.current)
    setDropdownOpen(false)
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
  const isServicesActive = isActive('/services')

  React.useEffect(() => { setMobileMenuOpen(false); setDropdownOpen(false) }, [pathname])

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
            <NavLink href="/solutions" active={isActive('/solutions')}>Solutions</NavLink>

            {/* Services — owns the mega dropdown */}
            <div
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              <button
                className={`relative flex items-center gap-1 text-[15px] font-medium pb-0.5 transition-colors duration-200 ${
                  dropdownOpen || isServicesActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Services
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
                {isServicesActive && !dropdownOpen && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-cyan-400/60 rounded-full" />
                )}
              </button>
            </div>

            <NavLink href="/project"  active={isActive('/project')}>Project</NavLink>
            <NavLink href="/packages" active={isActive('/packages')}>Pricing</NavLink>
            <NavLink href="/contact"  active={isActive('/contact')}>Contact</NavLink>

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

        {/* Desktop Mega Dropdown — triggered by Services nav item */}
        {dropdownOpen && (
          <div
            className="hidden md:block absolute left-0 right-0 top-full animate-slideDown"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <div className="bg-zinc-900 shadow-2xl shadow-black/70 border-b border-zinc-800">
              <div className="max-w-7xl mx-auto flex divide-x divide-zinc-800">

                {/* ── CAPABILITIES PANEL ── */}
                <div className="flex-1 px-8 py-8">

                  {/* Section label */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-[9px] tracking-[0.45em] uppercase font-semibold text-zinc-500">Capabilities</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>

                  {/* Numbered service grid — 2 columns */}
                  <div className="grid grid-cols-2 gap-x-10 gap-y-0 mb-8">
                    {services.map((service, i) => (
                      <Link
                        key={service.name}
                        href={service.href}
                        className="group relative flex items-start gap-4 py-3.5 border-b border-zinc-800/50 hover:border-zinc-700/60 transition-colors"
                      >
                        {/* Large extralight number — the distinctive element */}
                        <span className="text-2xl font-extralight text-zinc-700 group-hover:text-cyan-400/50 transition-colors duration-200 tabular-nums leading-none mt-0.5 w-8 flex-shrink-0 select-none">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <service.icon className="h-3.5 w-3.5 text-zinc-600 group-hover:text-cyan-400 transition-colors duration-150 flex-shrink-0" />
                            <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                              {service.name}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-600 font-light leading-relaxed">{service.description}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-cyan-400/60 flex-shrink-0 mt-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                      </Link>
                    ))}
                  </div>

                  {/* Integrations as compact badge pills */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[9px] tracking-[0.45em] uppercase font-semibold text-zinc-600 flex-shrink-0">Integrations</span>
                    <div className="h-px w-4 bg-zinc-800 flex-shrink-0" />
                    {integrations.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800 transition-all duration-150"
                      >
                        <item.icon className="h-3 w-3 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                        <span className="text-xs text-zinc-500 group-hover:text-zinc-200 transition-colors">{item.name}</span>
                      </Link>
                    ))}
                    <Link
                      href="/services"
                      className="group flex items-center gap-1 text-xs text-cyan-400/50 hover:text-cyan-400 transition-colors ml-1"
                    >
                      All Services
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* ── PRICING PANEL ── */}
                <div className="w-72 px-8 py-8 bg-zinc-800/20">

                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-[9px] tracking-[0.45em] uppercase font-semibold text-zinc-500">Pricing</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>

                  <div className="space-y-1 mb-6">
                    {packages.map((pkg) => (
                      <Link
                        key={pkg.name}
                        href={pkg.href}
                        className="group flex items-center gap-3 px-3 py-3 rounded-lg border border-transparent hover:border-zinc-700/50 hover:bg-zinc-800/50 transition-all duration-150"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-cyan-400 transition-colors flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                              {pkg.name}
                            </span>
                            {pkg.popular && (
                              <span className="text-[9px] font-medium text-cyan-400/80 border border-cyan-400/25 px-1.5 py-0.5 rounded-full tracking-wide">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-zinc-700 flex-shrink-0" />
                            <span className="text-xs text-zinc-600 font-light">{pkg.timeline}</span>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0">
                          {pkg.price}
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-zinc-800 pt-4 space-y-0.5">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="group flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-zinc-800/50 transition-colors"
                      >
                        <span className="text-xs text-zinc-600 group-hover:text-zinc-300 transition-colors">{link.name}</span>
                        <ArrowRight className="h-3 w-3 text-zinc-700 group-hover:text-cyan-400/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>
                    ))}
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}
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

            {/* Nav Links */}
            <div className="px-4 py-6 space-y-1">
              {[
                { name: 'Solutions', href: '/solutions' },
                { name: 'Services',  href: '/services' },
                { name: 'Project',   href: '/project' },
                { name: 'Pricing',   href: '/packages' },
                { name: 'Contact',   href: '/contact' },
                { name: 'About',     href: '/about' },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-white bg-zinc-800/60'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
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
