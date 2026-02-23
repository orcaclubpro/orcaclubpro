import { SpacesHeader } from "@/components/layout/spaces-header"
import { Footer } from "@/components/layout/footer"
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav"
import { GlobalSearchPalette } from "@/components/dashboard/GlobalSearchPalette"
import { getCurrentUser } from "@/actions/auth"
import { TabProvider } from "./TabContext"
import { HeaderTitleProvider } from "./HeaderTitleContext"
import { PackageCountProvider } from "./PackageCountContext"

export default async function SpacesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const isDeveloper = user?.role === 'admin' || user?.role === 'user'

  return (
    <HeaderTitleProvider>
    <TabProvider>
    <PackageCountProvider>
      <SpacesHeader user={user} showTips={(user as any)?.showTips !== false && user?.role === 'client'} />
      {/* pb-24 on mobile reserves space above the floating bottom nav */}
      <main className="pt-16 min-h-screen bg-black pb-28">{children}</main>
      <Footer />
      <MobileBottomNav role={user?.role} />
      {isDeveloper && user?.username && (
        <GlobalSearchPalette username={user.username} />
      )}
    </PackageCountProvider>
    </TabProvider>
    </HeaderTitleProvider>
  )
}
