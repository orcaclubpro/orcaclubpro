import { getPayload } from "payload"
import config from "@payload-config"
import { SpacesHeader } from "@/components/layout/spaces-header"
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav"
import { GlobalSearchPaletteLoader } from "@/components/dashboard/GlobalSearchPaletteLoader"
import { getSessionUser } from "./session"
import { experienceFor } from "./experience"
import { HeaderTitleProvider } from "./HeaderTitleContext"
import { PackageCountProvider } from "./PackageCountContext"
import { ThemeProvider } from "./ThemeContext"
import { countClientProposalPackages } from "./u/[username]/dashboard-data"
import { THEMES, DEFAULT_THEME } from "./themes"
import type { ThemeId } from "./themes"

export default async function SpacesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  const isDeveloper = !!user && experienceFor(user.role) === 'staff'
  const savedTheme = (user as any)?.dashboardTheme as ThemeId | undefined
  const initialTheme: ThemeId = (savedTheme && THEMES[savedTheme]) ? savedTheme : DEFAULT_THEME

  // Mobile-nav packages badge — resolved server-side so it's correct on first paint.
  let packageCount = 0
  if (user && experienceFor(user.role) === 'client') {
    const payload = await getPayload({ config })
    packageCount = await countClientProposalPackages(payload, user)
  }

  // Build inline CSS vars from the initial theme so the correct background
  // renders on the server — before ThemeContext's useEffect fires on the client.
  const themeVars = THEMES[initialTheme]?.vars ?? THEMES.paper.vars
  const cssVarString = Object.entries(themeVars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')

  return (
    <ThemeProvider initialTheme={initialTheme} username={user?.username ?? undefined}>
    <HeaderTitleProvider>
    <PackageCountProvider initialCount={packageCount}>
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
        <SpacesHeader user={user} showTips={(user as any)?.showTips !== false && experienceFor(user?.role) === 'client'} />
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
    </HeaderTitleProvider>
    </ThemeProvider>
  )
}
