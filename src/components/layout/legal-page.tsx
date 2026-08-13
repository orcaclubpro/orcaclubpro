import type { ReactNode } from "react"

/**
 * Shared shell for legal pages (/privacy, /terms, /accessibility).
 * Server component — plain prose on the site's dark background.
 */

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-sm text-gray-400">Last updated: {updated}</p>
        <div className="mt-12 space-y-10">{children}</div>
      </div>
    </div>
  )
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">{heading}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-gray-300">
        {children}
      </div>
    </section>
  )
}
