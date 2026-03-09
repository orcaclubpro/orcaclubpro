"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu, X, ArrowRight, Clock, Code2, Palette, Server, Search,
  BarChart3, Zap, Plug, Rocket, ShoppingBag, Target, User,
  LogOut, LayoutDashboard,
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
  { name: "All Packages",     href: "/packages" },
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

  React.useEffect(() => { setMobileMenuOpen(false); setDropdownOpen(false) }, [pathname])

  React.useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 overflow-visible transition-all duration-500 ${
          scrolled
            ? 'bg-black/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20'
            : 'bg-transparent border-b border-transparent'
        } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
        style={{ transition: 'background-color 0.5s ease, border-color 0.5s ease, opacity 0.6s ease, transform 0.6s ease' }}
        onMouseEnter={openDropdown}
        onMouseLeave={closeDropdown}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">

          {/* Logo */}
          <div className="flex flex-1">
            <Link href="/" className="group flex items-center gap-2">
              <span className={`${gothic.className} text-xl text-white transition-opacity duration-300 group-hover:opacity-80`}>
                ORCACLUB
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-x-8 items-center">
            {/* Solutions */}
            <NavLink href="/solutions" active={isActive('/solutions')}>Solutions</NavLink>

            {/* Packages */}
            <NavLink href="/packages" active={isActive('/packages')}>Packages</NavLink>

            {/* Contact */}
            <NavLink href="/contact" active={isActive('/contact')}>Contact</NavLink>

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
                      ? 'border-cyan-400/50 text-cyan-400'
                      : 'border-white/15 text-gray-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-full z-50 animate-slideDown"
                    onMouseEnter={keepProfile}
                    onMouseLeave={closeProfile}
                  >
                    <div className="mt-3 bg-black/95 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden min-w-[180px] shadow-xl shadow-black/40">
                      <Link
                        href={authNavItem.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-cyan-400/70" />
                        {authNavItem.name}
                      </Link>
                      <button
                        onClick={() => { logoutAction(); setProfileOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:text-white hover:bg-white/[0.04] transition-colors border-t border-white/[0.05]"
                      >
                        <LogOut className="w-4 h-4" />
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
              className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-white transition-colors"
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

        {/* Desktop Dropdown */}
        {dropdownOpen && (
          <div
            className="hidden md:block absolute left-0 right-0 top-full bg-black/95 backdrop-blur-xl border-b border-white/[0.06] animate-slideDown"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid grid-cols-12 gap-8">

                {/* Services */}
                <div className="col-span-4">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-white/20 font-light mb-5">Services</p>
                  <div className="space-y-0.5">
                    {services.map((service, i) => (
                      <Link
                        key={service.name}
                        href={service.href}
                        className="group flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <service.icon className="h-4 w-4 text-cyan-400/50 flex-shrink-0 mt-0.5 group-hover:text-cyan-400 transition-colors" />
                        <div>
                          <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors leading-none mb-0.5">
                            {service.name}
                          </p>
                          <p className="text-xs text-gray-600 font-light">{service.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Integrations */}
                <div className="col-span-4">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-white/20 font-light mb-5">Integrations</p>
                  <div className="space-y-0.5 mb-5">
                    {integrations.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="group flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                      >
                        <item.icon className="h-4 w-4 text-cyan-400/50 flex-shrink-0 mt-0.5 group-hover:text-cyan-400 transition-colors" />
                        <div>
                          <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors leading-none mb-0.5">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-600 font-light">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 text-xs font-medium text-cyan-400/70 hover:text-cyan-400 transition-colors group"
                  >
                    All Services
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Packages */}
                <div className="col-span-4">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-white/20 font-light mb-5">Packages</p>
                  <div className="space-y-2 mb-6">
                    {packages.map((pkg) => (
                      <Link
                        key={pkg.name}
                        href={pkg.href}
                        className="group block p-3 rounded-lg border border-white/[0.05] hover:border-cyan-400/20 hover:bg-white/[0.03] transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                              {pkg.name}
                            </span>
                            {pkg.popular && (
                              <span className="text-[10px] text-cyan-400/70 border border-cyan-400/20 px-1.5 py-0.5 rounded-full tracking-wide">
                                Popular
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 font-light">{pkg.price}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          {pkg.timeline}
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-white/[0.05] pt-4 space-y-0.5">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="group flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                      >
                        <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors font-light">
                          {link.name}
                        </span>
                        <ArrowRight className="h-3 w-3 text-gray-600 group-hover:text-cyan-400/70 group-hover:translate-x-0.5 transition-all" />
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

          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-black border-l border-white/[0.06] overflow-y-auto animate-slideInRight">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <span className={`${gothic.className} text-xl text-white`}>ORCACLUB</span>
              </Link>
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Links */}
            <div className="px-4 py-6 space-y-1">
              {[
                { name: 'Solutions', href: '/solutions' },
                { name: 'Packages',  href: '/packages' },
                { name: 'Services',  href: '/services' },
                { name: 'Contact',   href: '/contact' },
                { name: 'About',     href: '/about' },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-white bg-white/[0.05]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                  {isActive(item.href) && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </Link>
              ))}
            </div>

            {/* Bottom CTAs */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/[0.06] bg-black space-y-3">
              <Link
                href="/contact"
                className="block w-full text-center px-6 py-3.5 bg-gradient-to-r from-cyan-500/80 to-cyan-400/80 text-black font-semibold rounded-md hover:from-cyan-400 hover:to-cyan-300 transition-all text-sm shadow-lg shadow-cyan-900/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Your Project
              </Link>
              <Link
                href={authNavItem.href}
                className="block w-full text-center px-6 py-3.5 border border-white/[0.1] text-gray-400 font-medium rounded-md hover:bg-white/[0.04] hover:text-white transition-all text-sm"
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

// Reusable nav link with animated underline
function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors duration-200 ${
        active ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}
