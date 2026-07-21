export type Experience = 'staff' | 'client'

/**
 * Collapse the three user roles (admin, user, client) into the two dashboard
 * experiences the UI actually renders.
 *
 * PRESENTATION ONLY. This decides which tabs, nav items, and view components
 * show — nothing else. Do NOT use it for data scoping: staff queries must still
 * distinguish 'admin' (all records) from 'user' (assigned records only).
 * See u/[username]/page.tsx.
 */
export function experienceFor(role: string | null | undefined): Experience {
  return role === 'client' ? 'client' : 'staff'
}
