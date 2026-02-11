import type { Access, FieldAccess } from 'payload'

/**
 * Access Control Helper Functions for spac4es Project Management System
 *
 * These functions implement tenant-scoped access patterns where:
 * - Admins see everything
 * - Users see only items they're assigned to or created
 * - Clients see only their own data
 */

// ============================================================================
// BASIC ACCESS FUNCTIONS
// ============================================================================

/**
 * Anyone can access (public)
 */
export const anyone: Access = () => true

/**
 * Only authenticated users
 */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/**
 * Authenticated users OR published content
 */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

/**
 * Admin only access
 */
export const adminOnly: Access = ({ req: { user } }) => {
  return user?.role === 'admin'
}

/**
 * Admin or User role (excludes clients)
 */
export const adminOrUser: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin' || user.role === 'user'
}

// ============================================================================
// PROJECT MANAGEMENT ACCESS FUNCTIONS
// ============================================================================

/**
 * Admin or assigned to the project/task
 * Used for Projects, Tasks, Sprints where users are assigned
 */
export const adminOrAssigned: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admins see all
  if (user.role === 'admin') return true

  // Users see items they're assigned to
  // Note: assignedTo should support 'contains' for hasMany relationships
  return {
    assignedTo: { contains: user.id },
  }
}

/**
 * Admin or project member
 * Used for items that belong to a project (via relationship)
 */
export const adminOrProjectMember: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admins see all
  if (user.role === 'admin') return true

  // Users see items from projects they're assigned to
  // Note: This requires the item to have a 'project' relationship field
  return {
    'project.assignedTo': { equals: user.id },
  }
}

/**
 * Admin or own client account
 * Used for client-specific data
 */
export const adminOrOwnClient: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admins see all
  if (user.role === 'admin') return true

  // Clients see only their data
  if (user.role === 'client' && user.clientAccount) {
    return {
      client: { equals: user.clientAccount },
    }
  }

  // Regular users see all
  return true
}

/**
 * Admin or self (for user profiles)
 */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admins see all
  if (user.role === 'admin') return true

  // Users see only their own record
  return { id: { equals: user.id } }
}

// ============================================================================
// FIELD-LEVEL ACCESS FUNCTIONS
// ============================================================================
// Note: Field-level access should be defined inline in collection field definitions
// Example:
// {
//   name: 'fieldName',
//   access: {
//     read: ({ req: { user } }) => Boolean(user),
//     update: () => false,
//   }
// }
