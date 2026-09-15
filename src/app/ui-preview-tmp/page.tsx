// TEMPORARY — visual check harness for the spaces header + account sidebar.
// Delete after review.
import { SpacesHeader } from '@/components/layout/spaces-header'
import { ThemeProvider } from '@/app/(spaces)/ThemeContext'
import { HeaderTitleProvider } from '@/app/(spaces)/HeaderTitleContext'
import { THEMES, DEFAULT_THEME, type ThemeId } from '@/app/(spaces)/themes'

export default async function Preview({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>
}) {
  const { theme } = await searchParams
  const id = (theme && THEMES[theme] ? theme : DEFAULT_THEME) as ThemeId
  const vars = THEMES[id].vars
  const cssVarString = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')

  return (
    <ThemeProvider initialTheme={id}>
      <HeaderTitleProvider>
        <div id="spaces-root" className="min-h-screen" style={{ backgroundColor: 'var(--space-bg-base)', color: 'var(--space-text-primary)' }}>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var r=document.documentElement;var v="${cssVarString}".split(';');v.forEach(function(p){var i=p.indexOf(':');if(i>0)r.style.setProperty(p.slice(0,i),p.slice(i+1));});})();`,
            }}
          />
          <SpacesHeader
            user={{ name: 'Chance Noonan', email: 'cklnoonan@gmail.com', role: 'admin', username: 'chance', title: 'Lead Developer' }}
          />
          <main style={{ paddingTop: 'var(--space-header)', minHeight: '100svh' }} />
        </div>
      </HeaderTitleProvider>
    </ThemeProvider>
  )
}
