// Pass-through. Metadata (canonical, OG) moved to page.tsx via buildMetadata(),
// and the page now composes its own shell (PageShell/Section) — this layout
// exists only as a route boundary and adds nothing.
export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
