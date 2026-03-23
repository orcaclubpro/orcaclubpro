import { SpacesHeader } from "@/components/layout/spaces-header"
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav"
import { GlobalSearchPaletteLoader } from "@/components/dashboard/GlobalSearchPaletteLoader"
import { getCurrentUser } from "@/actions/auth"
import { TabProvider } from "./TabContext"
import { HeaderTitleProvider } from "./HeaderTitleContext"
import { PackageCountProvider } from "./PackageCountContext"
import { ThemeProvider } from "./ThemeContext"
import { THEMES, DEFAULT_THEME } from "./themes"
import type { ThemeId } from "./themes"

export default async function SpacesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const isDeveloper = user?.role === 'admin' || user?.role === 'user'
  const savedTheme = (user as any)?.dashboardTheme as ThemeId | undefined
  const initialTheme: ThemeId = (savedTheme && THEMES[savedTheme]) ? savedTheme : DEFAULT_THEME

  // Build inline CSS vars from the initial theme so the correct background
  // renders on the server — before ThemeContext's useEffect fires on the client.
  const themeVars = THEMES[initialTheme]?.vars ?? THEMES.paper.vars
  const cssVarString = Object.entries(themeVars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')

  return (
    <ThemeProvider initialTheme={initialTheme} username={user?.username ?? undefined}>
    <HeaderTitleProvider>
    <TabProvider>
    <PackageCountProvider>
      {/* Wrapper fills the full viewport — inline theme vars applied server-side
          so the background is correct before JS hydration (avoids black flash). */}
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--space-bg-base)', color: 'var(--space-text, #F0F0F0)' } as React.CSSProperties}
      >
        {/* Inline script sets CSS vars synchronously before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=document.documentElement;var v="${cssVarString}".split(';');v.forEach(function(p){var i=p.indexOf(':');if(i>0)r.style.setProperty(p.slice(0,i),p.slice(i+1));});})();`,
          }}
        />
        <SpacesHeader user={user} showTips={(user as any)?.showTips !== false && user?.role === 'client'} />
        {/* zoom: 1.3 scales up the entire spaces UI for better legibility.
            Note: `zoom` is non-standard CSS; Firefox ignores it. For cross-browser
            support, this should eventually migrate to transform:scale(1.3) with
            compensating width/height calculations.
            min-h-[calc(100vh/1.3)] — with zoom:1.3, visually fills exactly 100vh. pb-28 reserved for mobile bottom nav only. */}
        <main className="pt-[68px] min-h-[calc(100vh/1.3)] pb-28 lg:pb-0 [overflow-x:clip]" style={{ zoom: 1.3 }}>{children}</main>
      </div>
      <MobileBottomNav role={user?.role} />
      {isDeveloper && user?.username && (
        <GlobalSearchPaletteLoader username={user.username} />
      )}
    </PackageCountProvider>
    </TabProvider>
    </HeaderTitleProvider>
    </ThemeProvider>
  )
}
