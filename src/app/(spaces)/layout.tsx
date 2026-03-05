import { SpacesHeader } from "@/components/layout/spaces-header"
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav"
import { GlobalSearchPalette } from "@/components/dashboard/GlobalSearchPalette"
import { getCurrentUser } from "@/actions/auth"
import { TabProvider } from "./TabContext"
import { HeaderTitleProvider } from "./HeaderTitleContext"
import { PackageCountProvider } from "./PackageCountContext"
import { ThemeProvider } from "./ThemeContext"
import type { ThemeId } from "./themes"

export default async function SpacesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const isDeveloper = user?.role === 'admin' || user?.role === 'user'
  const initialTheme = ((user as any)?.dashboardTheme as ThemeId) ?? 'void'

  return (
    <ThemeProvider initialTheme={initialTheme} username={user?.username ?? undefined}>
    <HeaderTitleProvider>
    <TabProvider>
    <PackageCountProvider>
      <SpacesHeader user={user} showTips={(user as any)?.showTips !== false && user?.role === 'client'} />
      {/* min-h-[calc(100vh/1.3)] — with zoom:1.3, visually fills exactly 100vh. pb-28 reserved for mobile bottom nav only. */}
      <main className="pt-[49px] min-h-[calc(100vh/1.3)] bg-black pb-28 lg:pb-0 text-gray-200 [overflow-x:clip]" style={{ zoom: 1.3 }}>{children}</main>
      <MobileBottomNav role={user?.role} />
      {isDeveloper && user?.username && (
        <GlobalSearchPalette username={user.username} />
      )}
    </PackageCountProvider>
    </TabProvider>
    </HeaderTitleProvider>
    </ThemeProvider>
  )
}
