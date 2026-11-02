import { SiteDocument, siteMetadata } from '@/components/layout/site-document'

// Root layout for the temporary preview harness (no src/app/layout.tsx; see site-document.tsx).
export const metadata = siteMetadata

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument>{children}</SiteDocument>
}
