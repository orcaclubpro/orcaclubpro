/**
 * The project detail tabs — id, label, and nothing else.
 *
 * A plain module on purpose. This list is read by the project page, which is a
 * Server Component, and by `ProjectTabNav`, which is a Client Component. A
 * Server Component importing a value out of a `'use client'` module receives a
 * client-reference proxy rather than the value itself, so keeping the list here
 * is what makes it real data on both sides.
 *
 * Tab key === the `?tab=` query value. Packages is staff-only, so the page
 * decides the final set rather than this module.
 */
export interface ProjectTab {
  key: string
  label: string
}

export const PROJECT_BASE_TABS: ProjectTab[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'sprints', label: 'Sprints' },
  { key: 'credentials', label: 'Accounts' },
]

export const PROJECT_PACKAGES_TAB: ProjectTab = { key: 'packages', label: 'Packages' }
