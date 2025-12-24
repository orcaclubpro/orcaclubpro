"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Services", href: "/services" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
]

const orcaclubItems = [
  { name: "Studio", href: "/studio" },
  { name: "Products", href: "/products" },
  { name: "Merchandise", href: "/merchandise" },
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
                    <div className="grid grid-cols-3 gap-6">
                      {orcaclubItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="group block p-6 rounded-lg bg-slate-900/40 border border-white/5 hover:border-cyan-400/30 transition-all duration-300"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors duration-200">
                            {item.name}
                          </h3>
                          <p className="mt-2 text-sm text-gray-400">
                            Explore our {item.name.toLowerCase()}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Desktop navigation */}
        <div className="hidden md:flex md:gap-x-8 md:flex-1 md:justify-end">
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
              {orcaclubItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200 focus:outline-none"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
