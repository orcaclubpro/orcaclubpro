"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, ArrowRight, Clock, Code2, Palette, Server, Search, BarChart3, Zap, Plug, Rocket, ShoppingBag, Target } from "lucide-react"

const navigation = [
  { name: "Packages", href: "/packages" },
  { name: "Contact", href: "/contact" },
]

const desktopNavigation = [
  { name: "Packages", href: "/packages" },
  { name: "Contact", href: "/contact" },
  { name: "Login", href: "/login" },
]

const services = [
  { name: "Web Design", description: "Modern, responsive websites", href: "/services/web-design", icon: Palette },
  { name: "CMS Development", description: "Headless CMS & Payload", href: "/services/cms-development", icon: Code2 },
  { name: "Hosting & Infrastructure", description: "Managed hosting included", href: "/services/hosting-infrastructure", icon: Server },
  { name: "Technical SEO", description: "Schema, speed & structure", href: "/services/technical-seo", icon: Search },
  { name: "Custom Development", description: "Portals, dashboards, SaaS", href: "/services/custom-development", icon: Rocket },
  { name: "E-commerce", description: "Online stores & Shopify", href: "/services/ecommerce", icon: ShoppingBag },
]

const integrations = [
  { name: "API Integrations", description: "CRM, Shopify, custom APIs", href: "/services/api-integrations", icon: Plug },
  { name: "Analytics & Tracking", description: "GA4, GTM, dashboards", href: "/services/analytics-tracking", icon: BarChart3 },
  { name: "Marketing Integration", description: "Google Ads, Meta, LinkedIn", href: "/services/marketing-integration", icon: Target },
  { name: "Automation & Workflows", description: "Business process automation", href: "/services/automation-workflows", icon: Zap },
]

const packages = [
  { name: "Launch", description: "Professional website in 3-5 days", timeline: "3-5 days", price: "$1K-3K", href: "/packages/launch" },
  { name: "Scale", description: "Website + integrations & analytics", timeline: "7-10 days", price: "$3K-5K", href: "/packages/scale", popular: true },
  { name: "Enterprise", description: "Custom solutions & Shopify", timeline: "14-21 days", price: "$6K-30K", href: "/packages/enterprise" }
]

const quickLinks = [
  { name: "All Packages", href: "/packages" },
  { name: "Our Work", href: "/portfolio" },
  { name: "About", href: "/about" },
  { name: "Meet the Founder", href: "/founder" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const pathname = usePathname()

  // Close mobile menu and dropdown when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10"
        onMouseEnter={() => setDropdownOpen(true)}
        onMouseLeave={() => setDropdownOpen(false)}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <div className="flex flex-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/orcaclubpro.png"
                alt="ORCACLUB"
                width={40}
                height={40}
                className="h-10 w-10"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-x-6">
            {desktopNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2.5 text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Desktop Dropdown Menu */}
      {dropdownOpen && (
        <div
          className="hidden md:block fixed left-0 right-0 top-[73px] bg-black/95 backdrop-blur-xl border-b border-white/10 z-40"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-12 gap-8">
              {/* Services */}
              <div className="col-span-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Services</h3>
                <div className="space-y-1">
                  {services.map((service) => (
                    <Link
                      key={service.name}
                      href={service.href}
                      className="group flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <service.icon className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {service.name}
                        </h4>
                        <p className="text-xs text-gray-500">{service.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Integrations */}
              <div className="col-span-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Integrations</h3>
                <div className="space-y-1">
                  {integrations.map((integration) => (
                    <Link
                      key={integration.name}
                      href={integration.href}
                      className="group flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <integration.icon className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {integration.name}
                        </h4>
                        <p className="text-xs text-gray-500">{integration.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors mt-4"
                >
                  All Services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Packages */}
              <div className="col-span-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Packages</h3>
                <div className="space-y-2 mb-6">
                  {packages.map((pkg) => (
                    <Link
                      key={pkg.name}
                      href={pkg.href}
                      className="group block p-3 rounded-lg bg-slate-900/40 border border-white/5 hover:border-cyan-400/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {pkg.name}
                          {pkg.popular && <span className="ml-2 text-xs text-cyan-400">Popular</span>}
                        </h4>
                        <span className="text-xs text-gray-400">{pkg.price}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {pkg.timeline}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Quick Links */}
                <div className="border-t border-white/10 pt-4">
                  <div className="space-y-1">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                          {link.name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-black border-l border-white/10 overflow-y-auto">
            {/* Close button */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                <Image
                  src="/orcaclubpro.png"
                  alt="ORCACLUB"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="ml-2 text-lg font-bold text-white">ORCA</span>
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">CLUB</span>
              </Link>
              <button
                type="button"
                className="rounded-md p-2.5 text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="px-6 py-6 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Bottom CTAs */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 bg-black space-y-3">
              <Link
                href="/contact"
                className="block w-full text-center px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold rounded-lg hover:from-cyan-400 hover:to-cyan-300 transition-all shadow-lg shadow-cyan-500/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Your Project
              </Link>
              <Link
                href="/login"
                className="block w-full text-center px-6 py-4 border-2 border-cyan-400/40 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400/10 hover:border-cyan-400 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
