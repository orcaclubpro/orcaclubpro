import { notFound } from 'next/navigation'

// Unmatched URLs. With no src/app/layout.tsx (see components/layout/site-document.tsx)
// Next has no root layout to render app-level not-found in, so any path no other
// route claims lands here and renders (frontend)/not-found.tsx inside the site shell.
// Static and dynamic routes in every group (and /admin, /api) still win over a catch-all.
export default function CatchAllNotFound() {
  notFound()
}
