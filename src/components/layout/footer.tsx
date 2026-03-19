"use client"

import Link from "next/link"
import { Linkedin, Instagram } from "lucide-react"
import { Cinzel_Decorative } from "next/font/google"

const gothic = Cinzel_Decorative({ weight: "700", subsets: ["latin"] })

export function Footer() {
  return (
    <footer className="relative z-10 bg-zinc-950 border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <h3 className={`${gothic.className} text-3xl text-white`}>ORCACLUB</h3>
            <p className="text-zinc-400 text-base">
              Software Agency for Modern Business
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                href="https://www.linkedin.com/in/chancenooners/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-zinc-400 hover:text-white transition-colors duration-200"
              >
                <Linkedin size={20} />
              </Link>
              <Link
                href="https://www.instagram.com/dancebabuu/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-zinc-400 hover:text-white transition-colors duration-200"
              >
                <Instagram size={20} />
              </Link>
            </div>
          </div>

          {/* Column 2: Services */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider">
              Services
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/services/web-development"
                  className="text-zinc-400 hover:text-white transition-colors duration-200 text-[15px]"
                >
                  Web Development
                </Link>
              </li>
              <li>
                <Link
                  href="/services/digital-marketing"
                  className="text-zinc-400 hover:text-white transition-colors duration-200 text-[15px]"
                >
                  Digital Marketing
                </Link>
              </li>
              <li>
                <Link
                  href="/services/seo-services"
                  className="text-zinc-400 hover:text-white transition-colors duration-200 text-[15px]"
                >
                  SEO Services
                </Link>
              </li>
              <li>
                <Link
                  href="/services/integration-automation"
                  className="text-zinc-400 hover:text-white transition-colors duration-200 text-[15px]"
                >
                  Integration & Automation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:Chance@orcaclub.pro"
                  className="text-zinc-400 hover:text-white transition-colors duration-200 text-[15px]"
                >
                  Chance@orcaclub.pro
                </a>
              </li>
              <li>
                <span className="text-zinc-400 text-[15px]">Orange, CA</span>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-zinc-400 hover:text-white transition-colors duration-200 text-[15px]"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/merchandise"
                  className="text-zinc-400 hover:text-white transition-colors duration-200 text-[15px]"
                >
                  Merchandise
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-zinc-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-400 text-[15px]">
            &copy; 2025 OrcaClubPro. All rights reserved.
          </p>
          <p className="text-zinc-400 text-[15px]">Built to Surface.</p>
        </div>
      </div>
    </footer>
  )
}
