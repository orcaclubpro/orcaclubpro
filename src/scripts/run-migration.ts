/**
 * Migration Runner Script
 *
 * Usage: bun src/scripts/run-migration.ts
 *
 * This script runs the project management data migration.
 * It migrates:
 * - ClientAccounts → Clients collection
 * - ClientAccount.projects array → Projects collection
 * - Orders.project field → Orders.projectRef relationship
 *
 * Safety:
 * - Original data is NOT deleted
 * - Script is idempotent (safe to run multiple times)
 * - Comprehensive logging for all operations
 * - Error reporting with details for troubleshooting
 */

import { migrateToProjectManagement } from '../lib/payload/migrations/migrate-to-project-management'

async function main() {
  try {
    const stats = await migrateToProjectManagement()

    // Exit with appropriate code
    if (stats.errors.length > 0) {
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
