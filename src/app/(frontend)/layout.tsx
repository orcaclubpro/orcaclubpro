import { HeaderServer } from "@/components/layout/header-server"
import { Footer } from "@/components/layout/footer"

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cyan-400 focus:text-black focus:font-semibold focus:rounded-md"
      >
        Skip to content
      </a>
      <HeaderServer />
      <main id="main-content" className="pt-16">{children}</main>
      <Footer />
    </>
  )
}