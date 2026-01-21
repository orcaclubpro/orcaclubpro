import { SpacesHeader } from "@/components/layout/spaces-header"
import { Footer } from "@/components/layout/footer"
import { getCurrentUser } from "@/actions/auth"

export default async function SpacesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <>
      <SpacesHeader user={user} />
      <main className="pt-16 min-h-screen bg-black">{children}</main>
      <Footer />
    </>
  )
}
