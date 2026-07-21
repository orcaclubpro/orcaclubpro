import {
  LayoutDashboard, FolderKanban, Building2, CheckSquare,
  Receipt, Package, KeyRound, CalendarRange, Files,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Experience } from '@/app/(spaces)/experience'

// ── Single source of truth for dashboard tabs ─────────────────────────────────
// Each tab is a real route: /u/<username>/<id> (home is /u/<username>).
// MobileBottomNav builds its buttons from this registry; each tab's page lives
// at src/app/(spaces)/u/[username]/<id>/page.tsx. Legacy ?tab=<id> URLs are
// redirected to the route by the dashboard home page.
//
// Metadata only — no view components imported — so MobileBottomNav stays light.

export interface TabDef {
  /** Route segment (/u/<username>/<id>) — treated as a public contract, do not rename. */
  id: string
  /** Nav button label. */
  label: string
  icon: LucideIcon
  /** false = reachable by URL but has no nav button (staff Packages). */
  inNav: boolean
  /** primary = always-visible bar · secondary = "More" menu on mobile, inline on md+. */
  navGroup: 'primary' | 'secondary'
}

const STAFF_TABS: TabDef[] = [
  { id: 'home',      label: 'Home',      icon: LayoutDashboard, inNav: true,  navGroup: 'primary' },
  { id: 'projects',  label: 'Plan',      icon: FolderKanban,    inNav: true,  navGroup: 'primary' },
  { id: 'clients',   label: 'Clients',   icon: Building2,       inNav: true,  navGroup: 'primary' },
  { id: 'tasks',     label: 'Tasks',     icon: CheckSquare,     inNav: true,  navGroup: 'secondary' },
  { id: 'packages',  label: 'Packages',  icon: Package,         inNav: false, navGroup: 'secondary' },
  { id: 'timelines', label: 'Timelines', icon: CalendarRange,   inNav: true,  navGroup: 'secondary' },
  { id: 'files',     label: 'Files',     icon: Files,           inNav: true,  navGroup: 'secondary' },
]

const CLIENT_TABS: TabDef[] = [
  { id: 'home',     label: 'Home',     icon: LayoutDashboard, inNav: true, navGroup: 'primary' },
  { id: 'projects', label: 'Plan',     icon: FolderKanban,    inNav: true, navGroup: 'primary' },
  { id: 'invoices', label: 'Invoices', icon: Receipt,         inNav: true, navGroup: 'primary' },
  { id: 'packages', label: 'Packages', icon: Package,         inNav: true, navGroup: 'secondary' },
  { id: 'accounts', label: 'Accounts', icon: KeyRound,        inNav: true, navGroup: 'secondary' },
]

const TABS: Record<Experience, TabDef[]> = { staff: STAFF_TABS, client: CLIENT_TABS }

/** All tabs for an experience, in order. */
export const tabsFor = (e: Experience): TabDef[] => TABS[e]

/** Route for a tab — home is the dashboard root, everything else a segment. */
export const tabHref = (username: string, id: string): string =>
  id === 'home' ? `/u/${username}` : `/u/${username}/${id}`
