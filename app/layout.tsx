import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ORCACLUB - Intelligent Digital Predator",
  description:
    "We don't just build software—we engineer competitive advantages. Premium solutions with mathematical precision.",
  keywords: "premium software agency, AI workflows, intelligent automation, digital transformation",
  authors: [{ name: "ORCACLUB" }],
  openGraph: {
    title: "ORCACLUB - Intelligent Digital Predator",
    description: "Premium solutions with mathematical precision",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-black text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
