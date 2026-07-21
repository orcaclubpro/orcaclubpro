import { cache } from 'react'
import { getCurrentUser } from '@/actions/auth'

// Per-request memoized auth lookup. Layouts, pages, and generateMetadata in the
// same request all call this; the underlying Payload auth runs once.
export const getSessionUser = cache(getCurrentUser)
