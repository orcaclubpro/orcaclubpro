"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, ArrowRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Pricing", href: "/project" },
  { name: "Contact", href: "/contact" },
]

const featuredSolutions = [
  {
    name: "Fast Website Launch",
    description: "Professional website in 3-5 days",
    timeline: "3-5 days",
    tier: "Launch Tier",
    price: "$1K-3K",
    href: "/solutions/fast-website-launch"
  },
  {
    name: "Shopify Headless Commerce",
    description: "Custom ecommerce with modern frontend",
    timeline: "14-21 days",
    tier: "Enterprise Tier",
    price: "$6K-30K",
    href: "/solutions/headless-shopify-commerce"
  },
  {
    name: "Business Automation",
    description: "Workflow integration & API connections",
    timeline: "7-10 days",
    tier: "Scale Tier",
    price: "$3K-5K",
    href: "/solutions/business-automation"
  }
]

const quickLinks = [
  { name: "View Packages", href: "/project" },
  { name: "Our Work", href: "/portfolio" },
  { name: "About", href: "/about" }
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
      <nav className="mx-auto flex max-w-7xl items-center px-6 py-4 lg:px-8" aria-label="Global">
        {/* LEFT: Image Logo */}
        <div className="flex flex-1">
          <Link href="/" className="-m-1.5 p-1.5 focus:outline-none">
            <span className="sr-only">ORCACLUB</span>
            <Image
              src="/orcaclubpro.png"
              alt="ORCACLUB"
              width={40}
              height={40}
              className="h-10 w-10"
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
                className="flex items-center focus:outline-none rounded-md px-2 py-1 group"
              >
                <span className="text-xl md:text-2xl font-bold text-white group-hover:opacity-80 transition-opacity">ORCA</span>
                <span className="text-xl md:text-2xl font-bold gradient-text group-hover:opacity-80 transition-opacity">CLUB</span>
                <span className="text-xs md:text-sm text-gray-400 font-light ml-2 group-hover:text-gray-300 transition-colors">est 2025</span>
              </Link>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center focus:outline-none rounded-md p-1"
              >
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200",
                  dropdownOpen && "rotate-180"
                )} />
              </button>
            </div>

            {/* Full-width Dropdown */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 top-[73px] bg-black/40 backdrop-blur-sm z-40"
                  onClick={() => setDropdownOpen(false)}
                  onMouseEnter={() => setDropdownOpen(false)}
                />
                {/* Dropdown Content */}
                <div
                  className="fixed left-0 right-0 top-[73px] bg-black/95 backdrop-blur-xl border-b border-white/10 z-50"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-12 gap-8">
                      {/* LEFT: Featured Solutions (60%) */}
                      <div className="col-span-7 space-y-4">
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
                            Featured Solutions
                          </h3>
                          <p className="text-xs text-gray-500">
                            Start with a specific problem
                          </p>
                        </div>

                        {/* Solution Cards */}
                        {featuredSolutions.map((solution) => (
                          <Link
                            key={solution.name}
                            href={solution.href}
                            className="group block p-4 rounded-lg bg-slate-900/40 border border-white/5 hover:border-cyan-400/30 hover:bg-slate-900/60 transition-all duration-300"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <h4 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors mb-1">
                              {solution.name}
                            </h4>
                            <p className="text-sm text-gray-400 mb-2">
                              {solution.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {solution.timeline}
                              </span>
                              <span>•</span>
                              <span>{solution.tier}</span>
                              <span>•</span>
                              <span className="text-cyan-400 font-medium">{solution.price}</span>
                            </div>
                          </Link>
                        ))}

                        {/* Browse All Solutions Link */}
                        <Link
                          href="/solutions"
                          className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors mt-2"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Browse All Solutions
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>

                      {/* RIGHT: Quick Links (40%) */}
                      <div className="col-span-5">
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
                            Quick Navigation
                          </h3>
                          <p className="text-xs text-gray-500">
                            Jump to key pages
                          </p>
                        </div>

                        <div className="space-y-2">
                          {quickLinks.map((link) => (
                            <Link
                              key={link.name}
                              href={link.href}
                              className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                              onClick={() => setDropdownOpen(false)}
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
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Desktop navigation */}
        <div className="hidden md:flex md:gap-x-6 md:flex-1 md:justify-end md:items-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none rounded-md px-2 py-1"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden flex-1 justify-end">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white/90 hover:text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/80 backdrop-blur-lg border-t border-white/5">
          <div className="space-y-1 px-6 py-4">
            {/* Regular navigation */}
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200 focus:outline-none"
              >
                {item.name}
              </Link>
            ))}

            {/* ORCACLUB dropdown items */}
            <div className="pt-4 mt-4 border-t border-white/10">
              <Link href="/" className="flex items-center px-3 mb-3 focus:outline-none group">
                <span className="text-sm font-bold text-white group-hover:opacity-80 transition-opacity">ORCA</span>
                <span className="text-sm font-bold gradient-text group-hover:opacity-80 transition-opacity">CLUB</span>
                <span className="text-xs text-gray-400 font-light ml-2 group-hover:text-gray-300 transition-colors">est 2025</span>
              </Link>

              {/* Mobile: Stack featured solutions first, then quick links */}
              <div className="space-y-6">
                {/* Featured Solutions */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 px-3">
                    Featured Solutions
                  </h3>
                  <div className="space-y-3">
                    {featuredSolutions.map((solution) => (
                      <Link
                        key={solution.name}
                        href={solution.href}
                        className="block p-4 rounded-lg bg-slate-900/40 border border-white/5 hover:border-cyan-400/30"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <h4 className="text-base font-semibold text-white mb-1">
                          {solution.name}
                        </h4>
                        <p className="text-sm text-gray-400 mb-2">
                          {solution.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{solution.timeline}</span>
                          <span>•</span>
                          <span>{solution.tier}</span>
                          <span>•</span>
                          <span className="text-cyan-400">{solution.price}</span>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href="/solutions"
                      className="block text-center py-2 text-sm font-medium text-cyan-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Browse All Solutions →
                    </Link>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 px-3">
                    Quick Links
                  </h3>
                  <div className="space-y-1">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="block px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
