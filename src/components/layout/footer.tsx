"use client"

import Link from "next/link"
import { Linkedin, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative z-10 bg-zinc-950 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">ORCACLUB</h3>
            <p className="text-gray-400 text-sm">
              Software Agency for Modern Business
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                href="https://www.linkedin.com/in/chancenooners/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Linkedin size={20} />
              </Link>
              <Link
                href="https://www.instagram.com/dancebabuu/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Instagram size={20} />
              </Link>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  href="/insights"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Insights
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Services */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Services
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/services"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Web Development
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  AI Solutions
                </Link>
              </li>
              <li>
                <Link
                  href="/studio"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Studio
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:Chance@orcaclub.pro"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Chance@orcaclub.pro
                </a>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Orange, CA</span>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/merchandise"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Merchandise
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            &copy; 2025 OrcaClubPro. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">Built to Surface.</p>
        </div>
      </div>
    </footer>
  )
}
