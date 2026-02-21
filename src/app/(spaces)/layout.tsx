import { SpacesHeader } from "@/components/layout/spaces-header"
import { Footer } from "@/components/layout/footer"
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav"
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
      {/* pb-24 on mobile reserves space above the floating bottom nav */}
      <main className="pt-16 min-h-screen bg-black pb-24 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav role={user?.role} />
    </>
  )
}
