import { Header } from "@/components/layout/header"

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="pt-16">{children}</main>
    </>
  )
}