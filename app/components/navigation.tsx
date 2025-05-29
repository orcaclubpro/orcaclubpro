"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const navigation = [
  { name: "Services", href: "/services" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Insights", href: "/insights" },
  { name: "Connect", href: "/contact" },
]

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-xl tracking-tight">
              <span className="font-light">ORCA</span>
              <span className="font-medium bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                CLUB
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-cyan-400 ${
                  pathname === item.href ? "text-blue-400 border-b-2 border-blue-400 pb-1" : "text-gray-300"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="bg-linear-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform"
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-cyan-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/dashboard"
                className="bg-linear-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg text-sm font-medium w-fit"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
