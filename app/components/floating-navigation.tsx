"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

const navigation = [
  { name: "Services", href: "/services" },
  { name: "Work", href: "/work" },
  { name: "Insights", href: "/insights" },
  { name: "Connect", href: "/contact" },
]

export default function FloatingNavigation() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-black/80 backdrop-blur-xl border border-slate-800/50 rounded-full px-8 py-4"
            : "bg-transparent px-8 py-6"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-lg tracking-tight">
              <span className="font-light">ORCA</span>
              <span className="font-medium gradient-text">CLUB</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12 ml-16">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-light transition-all duration-300 relative group ${
                  pathname === item.href ? "text-cyan-400" : "text-gray-300 hover:text-white"
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-px bg-linear-to-r from-cyan-400 to-blue-500 transition-all duration-300 group-hover:w-full ${
                    pathname === item.href ? "w-full" : ""
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Workspace Button */}
          <Link
            href="/dashboard"
            className="hidden md:block ml-8 px-6 py-2 bg-linear-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-sm font-light text-cyan-400 hover:bg-linear-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-300 magnetic"
          >
            Workspace
          </Link>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-4 bg-black/90 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-cyan-400 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/dashboard"
                className="bg-linear-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-400 px-6 py-3 text-center mt-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                Workspace
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
