import { HeaderServer } from "@/components/layout/header-server"
import { Footer } from "@/components/layout/footer"

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HeaderServer />
      <main className="pt-16">{children}</main>
      <Footer />
    </>
  )
}