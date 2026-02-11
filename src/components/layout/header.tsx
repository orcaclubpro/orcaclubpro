"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, ArrowRight, Clock, Code2, Palette, Server, Search, BarChart3, Zap, Plug, Rocket, ShoppingBag, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Packages", href: "/packages" },
  { name: "Contact", href: "/contact" },
]

// Services organized by category
const services = [
  {
    name: "Web Design",
    description: "Modern, responsive websites",
    href: "/services/web-design",
    icon: Palette,
  },
  {
    name: "CMS Development",
    description: "Headless CMS & Payload",
    href: "/services/cms-development",
    icon: Code2,
  },
  {
    name: "Hosting & Infrastructure",
    description: "Managed hosting included",
    href: "/services/hosting-infrastructure",
    icon: Server,
  },
  {
    name: "Technical SEO",
    description: "Schema, speed & structure",
    href: "/services/technical-seo",
    icon: Search,
  },
  {
    name: "Custom Development",
    description: "Portals, dashboards, SaaS",
    href: "/services/custom-development",
    icon: Rocket,
  },
  {
    name: "E-commerce",
    description: "Online stores & Shopify",
    href: "/services/ecommerce",
    icon: ShoppingBag,
  },
]

// Integration services
const integrations = [
  {
    name: "API Integrations",
    description: "CRM, Shopify, custom APIs",
    href: "/services/api-integrations",
    icon: Plug,
  },
  {
    name: "Analytics & Tracking",
    description: "GA4, GTM, dashboards",
    href: "/services/analytics-tracking",
    icon: BarChart3,
  },
  {
    name: "Marketing Integration",
    description: "Google Ads, Meta, LinkedIn",
    href: "/services/marketing-integration",
    icon: Target,
  },
  {
    name: "Automation & Workflows",
    description: "Business process automation",
    href: "/services/automation-workflows",
    icon: Zap,
  },
]

// Package tiers
const packages = [
  {
    name: "Launch",
    description: "Professional website in 3-5 days",
    timeline: "3-5 days",
    price: "$1K-3K",
    href: "/packages/launch"
  },
  {
    name: "Scale",
    description: "Website + integrations & analytics",
    timeline: "7-10 days",
    price: "$3K-5K",
    href: "/packages/scale",
    popular: true
  },
  {
    name: "Enterprise",
    description: "Custom solutions & Shopify",
    timeline: "14-21 days",
    price: "$6K-30K",
    href: "/packages/enterprise"
  }
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

  // Close mobile menu when route changes
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">
        {/* LEFT: Image Logo */}
        <div className="flex flex-1">
          <Link href="/" className="group -m-1.5 p-1.5 rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400/30">
            <span className="sr-only">ORCACLUB</span>
            <Image
              src="/orcaclubpro.png"
              alt="ORCACLUB"
              width={40}
              height={40}
              className="h-10 w-10 transition-transform duration-300 group-hover:rotate-3"
            />
          </Link>
        </div>

        {/* MIDDLE: ORCACLUB with Dropdown (Desktop only) */}
        <div className="hidden md:block">
          <div className="relative">
            <div
              className="flex items-center gap-1"
              onMouseEnter={() => setDropdownOpen(true)}
            >
              <Link
                href="/"
                className="flex items-center focus:outline-none rounded-lg px-3 py-2 group transition-all duration-300 hover:bg-white/5"
              >
                <span className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-white/90 transition-all duration-300">ORCA</span>
                <span className="text-xl md:text-2xl font-bold gradient-text tracking-tight group-hover:opacity-90 transition-all duration-300">CLUB</span>
                <span className="text-xs md:text-sm text-gray-400 font-light ml-3 tracking-wide group-hover:text-gray-300 transition-all duration-300">est 2025</span>
              </Link>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center focus:outline-none rounded-lg p-2 hover:bg-white/5 transition-all duration-300"
                aria-label="Toggle dropdown menu"
              >
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-400 transition-all duration-300 ease-out",
                  dropdownOpen && "rotate-180 text-cyan-400"
                )} />
              </button>
            </div>

            {/* Full-width Dropdown */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 top-[73px] bg-black/60 backdrop-blur-md z-40 animate-fadeIn"
                  onClick={() => setDropdownOpen(false)}
                  onMouseEnter={() => setDropdownOpen(false)}
                />
                {/* Dropdown Content */}
                <div
                  className="fixed left-0 right-0 top-[73px] bg-gradient-to-b from-black/98 to-black/95 backdrop-blur-2xl border-b border-white/10 z-50 shadow-2xl shadow-black/40 animate-slideDown"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-12 gap-10">
                      {/* LEFT: Services */}
                      <div className="col-span-4">
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1.5 letterspacing-wide">
                            Services
                          </h3>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            What we build
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {services.map((service, index) => (
                            <Link
                              key={service.name}
                              href={service.href}
                              className="group flex items-start gap-3.5 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 hover:translate-x-1"
                              onClick={() => setDropdownOpen(false)}
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <service.icon className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors duration-300 leading-snug">
                                  {service.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{service.description}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* MIDDLE: Integrations */}
                      <div className="col-span-4">
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                            Integrations
                          </h3>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Connect your tools
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {integrations.map((integration, index) => (
                            <Link
                              key={integration.name}
                              href={integration.href}
                              className="group flex items-start gap-3.5 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 hover:translate-x-1"
                              onClick={() => setDropdownOpen(false)}
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <integration.icon className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors duration-300 leading-snug">
                                  {integration.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{integration.description}</p>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {/* Browse All Services */}
                        <Link
                          href="/services"
                          className="group inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-all duration-300 mt-5 hover:gap-3"
                          onClick={() => setDropdownOpen(false)}
                        >
                          All Services
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      </div>

                      {/* RIGHT: Packages & Quick Links */}
                      <div className="col-span-4">
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                            Packages
                          </h3>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Transparent pricing
                          </p>
                        </div>
                        <div className="space-y-2.5 mb-8">
                          {packages.map((pkg, index) => (
                            <Link
                              key={pkg.name}
                              href={pkg.href}
                              className="group block p-4 rounded-xl bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-white/10 hover:border-cyan-400/40 hover:from-slate-900/80 hover:to-slate-900/60 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
                              onClick={() => setDropdownOpen(false)}
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors duration-300 leading-snug">
                                  {pkg.name}
                                  {pkg.popular && <span className="ml-2 text-xs text-cyan-400 font-medium">Popular</span>}
                                </h4>
                                <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors duration-300">{pkg.price}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="h-3.5 w-3.5" />
                                {pkg.timeline}
                              </div>
                            </Link>
                          ))}
                        </div>

                        {/* Quick Links */}
                        <div className="border-t border-white/10 pt-5">
                          <div className="space-y-1">
                            {quickLinks.map((link) => (
                              <Link
                                key={link.name}
                                href={link.href}
                                className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-all duration-300"
                                onClick={() => setDropdownOpen(false)}
                              >
                                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">
                                  {link.name}
                                </span>
                                <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-cyan-400 transition-all duration-300 group-hover:translate-x-1" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Desktop navigation */}
        <div className="hidden md:flex md:gap-x-2 md:flex-1 md:justify-end md:items-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 focus:outline-none rounded-lg px-4 py-2"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden flex-1 justify-end">
          <button
            type="button"
            className="group inline-flex items-center justify-center rounded-lg p-2.5 text-white/90 hover:text-white hover:bg-white/5 focus:outline-none transition-all duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gradient-to-b from-black/95 to-black/90 backdrop-blur-2xl border-t border-white/10 fixed inset-x-0 top-[73px] bottom-0 overflow-y-auto overscroll-contain animate-slideInRight shadow-2xl">
          <div className="space-y-1 px-6 py-6 pb-28 min-h-full">
            {/* Regular navigation */}
            <div className="space-y-1 mb-6">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-xl px-4 py-3.5 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 animate-fadeInStagger"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* ORCACLUB dropdown items */}
            <div className="pt-6 mt-6 border-t border-white/10">
              <Link href="/" className="flex items-center px-4 mb-6 focus:outline-none group" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-lg font-bold text-white group-hover:opacity-90 transition-opacity tracking-tight">ORCA</span>
                <span className="text-lg font-bold gradient-text group-hover:opacity-90 transition-opacity tracking-tight">CLUB</span>
                <span className="text-xs text-gray-400 font-light ml-3 group-hover:text-gray-300 transition-colors tracking-wide">est 2025</span>
              </Link>

              {/* Mobile: Services, Integrations, Packages, Quick Links */}
              <div className="space-y-8">
                {/* Services */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
                    Services
                  </h3>
                  <div className="space-y-1">
                    {services.map((service, index) => (
                      <Link
                        key={service.name}
                        href={service.href}
                        className="flex items-start gap-3.5 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-300 animate-fadeInStagger"
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ animationDelay: `${(index + 2) * 50}ms` }}
                      >
                        <service.icon className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-white block leading-snug">{service.name}</span>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{service.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Integrations */}
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
                    Integrations
                  </h3>
                  <div className="space-y-1">
                    {integrations.map((integration, index) => (
                      <Link
                        key={integration.name}
                        href={integration.href}
                        className="flex items-start gap-3.5 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <integration.icon className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-white block leading-snug">{integration.name}</span>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{integration.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/services"
                    className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-cyan-400 mt-4 hover:text-cyan-300 transition-colors duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    All Services
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Packages */}
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
                    Packages
                  </h3>
                  <div className="space-y-3">
                    {packages.map((pkg) => (
                      <Link
                        key={pkg.name}
                        href={pkg.href}
                        className="block p-4 rounded-xl bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-white/10 hover:border-cyan-400/40 transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-white leading-snug">
                            {pkg.name}
                            {pkg.popular && <span className="ml-2 text-xs text-cyan-400 font-medium">Popular</span>}
                          </h4>
                          <span className="text-sm font-semibold text-gray-400">{pkg.price}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          {pkg.timeline}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="border-t border-white/10 pt-6 pb-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
                    Quick Links
                  </h3>
                  <div className="space-y-1">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{link.name}</span>
                        <ArrowRight className="h-4 w-4 text-gray-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom CTAs */}
          <div className="fixed bottom-0 left-0 right-0 bg-black/98 backdrop-blur-2xl border-t border-white/10 px-6 py-5 md:hidden shadow-2xl shadow-black/40">
            <div className="flex gap-3">
              <Link
                href="/contact"
                className="flex-1 text-center px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold rounded-xl hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/login"
                className="flex-1 text-center px-6 py-4 border-2 border-cyan-400/40 text-cyan-400 font-semibold rounded-xl hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
