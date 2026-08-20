"use client"

import Link from "next/link"
import { Linkedin, Instagram } from "lucide-react"
import { Cinzel_Decorative } from "next/font/google"
import { FOOTER_LINKS, type NavItem } from "@/data/nav"

const gothic = Cinzel_Decorative({ weight: "700", subsets: ["latin"] })

// New-IA footer — link data lives in src/data/nav.ts (FOOTER_LINKS), shared
// with the header so labels and hrefs can never drift. The Legal column feeds
// the bottom bar; the rest render as columns.

const columns = FOOTER_LINKS.filter((c) => c.heading !== "Legal")
const legal = FOOTER_LINKS.find((c) => c.heading === "Legal")?.links ?? []

function FooterLink({ link, className }: { link: NavItem; className: string }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
      </a>
    )
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="relative z-10 bg-zinc-950 border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className={`${gothic.className} text-3xl text-white`}>ORCACLUB</h3>
            <p className="text-zinc-400 text-base">
              Websites that get found. Built in Orange County.
            </p>
            <ul className="space-y-2 pt-2">
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
            </ul>
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

          {/* Link columns from the shared nav registry */}
          {columns.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider">
                {col.heading}
              </h4>
              <ul className="space-y-3">
                {col.links
                  .filter((link) => !link.comingSoon)
                  .map((link) => (
                    <li key={link.href}>
                      <FooterLink
                        link={link}
                        className="text-zinc-400 hover:text-white transition-colors duration-200 text-[15px]"
                      />
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-zinc-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-400 text-[15px]">
            &copy; 2026 OrcaClubPro. All rights reserved.
          </p>
          <ul className="flex items-center gap-6">
            {legal.map((link) => (
              <li key={link.href}>
                <FooterLink
                  link={link}
                  className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm"
                />
              </li>
            ))}
          </ul>
          <p className="text-zinc-400 text-[15px]">Built to Surface.</p>
        </div>
      </div>
    </footer>
  )
}
