import { getPayload } from "payload"
import config from "@payload-config"
import { SpacesHeader } from "@/components/layout/spaces-header"
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav"
import { ClientPreviewBanner } from "@/components/dashboard/ClientPreviewBanner"
import { getSessionUser } from "./session"
import { effectiveExperience, getPreviewClientId } from "./preview"
import { HeaderTitleProvider } from "./HeaderTitleContext"
import { PackageCountProvider } from "./PackageCountContext"
import { ThemeProvider } from "./ThemeContext"
import { countClientProposalPackages, resolveActiveClientAccount } from "./u/[username]/dashboard-data"
import { THEMES, DEFAULT_THEME } from "./themes"
import type { ThemeId } from "./themes"

export default async function SpacesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  const experience = await effectiveExperience(user)
  const savedTheme = (user as any)?.dashboardTheme as ThemeId | undefined
  const initialTheme: ThemeId = (savedTheme && THEMES[savedTheme]) ? savedTheme : DEFAULT_THEME

  // Mobile-nav packages badge — resolved server-side so it's correct on first
  // paint. During a client preview this reflects the previewed account.
  let packageCount = 0
  let previewClientName: string | null = null
  if (user && experience === 'client') {
    const payload = await getPayload({ config })
    packageCount = await countClientProposalPackages(payload, user)
    if (await getPreviewClientId(user)) {
      const previewAccount = await resolveActiveClientAccount(payload, user)
      previewClientName = previewAccount?.name ?? 'this client'
    }
  }

  // Build inline CSS vars from the initial theme so the correct background
  // renders on the server — before ThemeContext's useEffect fires on the client.
  const themeVars = THEMES[initialTheme]?.vars ?? THEMES[DEFAULT_THEME].vars
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
        id="spaces-root"
        className="min-h-screen"
        style={{ backgroundColor: 'var(--space-bg-base)', color: 'var(--space-text-primary)' } as React.CSSProperties}
      >
        {/* Inline script sets CSS vars synchronously before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=document.documentElement;var v="${cssVarString}".split(';');v.forEach(function(p){var i=p.indexOf(':');if(i>0)r.style.setProperty(p.slice(0,i),p.slice(i+1));});})();`,
          }}
        />
        <SpacesHeader user={user} showTips={(user as any)?.showTips !== false && experience === 'client' && !previewClientName} />
        {/* The portal is scaled by the root font size (see `html:has(#spaces-root)`
            in globals.css), not by `zoom` — so 100svh means 100svh and panels can
            subtract --space-header honestly. pb-28 reserves the mobile bottom nav. */}
        <main
          className="pb-28 lg:pb-0 [overflow-x:clip]"
          style={{
            paddingTop: 'var(--space-header)',
            // border-box, so this spans exactly the viewport and the content box
            // below the fixed header is `100svh - var(--space-header)` — the same
            // figure `.space-panel-h` uses. `min-h-screen` alongside the padding
            // overflowed by exactly the header height, which is what put a
            // permanent scrollbar beside every full-height panel.
            minHeight: '100svh',
          }}
        >
          {previewClientName && <ClientPreviewBanner clientName={previewClientName} />}
          {children}
        </main>
      </div>
      <MobileBottomNav experience={experience} />
      {/* Search now lives inside the CommandConsole, mounted per-dashboard in
          u/[username]/layout (staff-only, preview-aware). */}
    </PackageCountProvider>
    </HeaderTitleProvider>
    </ThemeProvider>
  )
}
