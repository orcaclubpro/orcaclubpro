import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="pt-16">{children}</main>
      <Footer />
    </>
  )
}