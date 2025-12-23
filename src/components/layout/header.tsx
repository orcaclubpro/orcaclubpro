"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { BookingModal } from "@/components/booking-modal"

const navigation = [
  { name: "Services", href: "/services" },
  { name: "Pricing", href: "/pricing" },
  { name: "Studio", href: "/studio" },
  { name: "Products", href: "/products" },
  { name: "Merchandise", href: "/merchandise" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">
        {/* Image Logo on Left */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md">
            <span className="sr-only">OrcaClubPro</span>
            <Image
              src="/orcaclubpro.png"
              alt="OrcaClubPro"
              width={40}
              height={40}
              className="h-8 md:h-10 w-auto hover:opacity-80 transition-opacity duration-200"
              priority
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
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

        {/* Desktop navigation */}
        <div className="hidden md:flex md:gap-x-8">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md px-2 py-1",
                  isActive
                    ? "text-white border-b-2 border-white"
                    : "text-gray-300 hover:text-white hover:border-b-2 hover:border-white/40"
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Booking Button */}
        <div className="hidden md:flex md:flex-1 md:justify-end">
          <BookingModal />
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/80 backdrop-blur-lg border-t border-white/5">
          <div className="space-y-1 px-6 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block rounded-md px-3 py-3 text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20",
                    isActive
                      ? "text-white bg-white/10 border-l-4 border-white"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
            {/* Mobile Booking Button */}
            <div className="pt-4 pb-2">
              <BookingModal />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
