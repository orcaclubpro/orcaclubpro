/**
 * Migration: Migrate data from old structure to new project management system
 *
 * This migration performs two main steps:
 * 1. Migrate projects array (in ClientAccount) → Projects collection (linked directly to ClientAccounts)
 * 2. Update Orders.projectRef to link to new Project records
 *
 * Safety features:
 * - Original data is not deleted (only new records created and linked)
 * - Maps old IDs to new IDs for reference
 * - Comprehensive logging for troubleshooting
 * - Error handling and rollback information
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import type { ClientAccount, Project, Order } from '@/types/payload-types'

interface MigrationStats {
  projectsMigrated: number
  ordersMigrated: number
  errors: Array<{
    step: string
    error: string
    details?: unknown
  }>
}

/**
 * Main migration function
 */
export async function migrateToProjectManagement(): Promise<MigrationStats> {
  const payload = await getPayload({ config })

  const stats: MigrationStats = {
    projectsMigrated: 0,
    ordersMigrated: 0,
    errors: [],
  }

  console.log('\n========================================')
  console.log('Starting migration to project management system')
  console.log('========================================\n')

  try {
    // Step 1: Migrate projects array → Projects collection (linked directly to ClientAccounts)
    console.log('Step 1: Migrating projects array → Projects collection...')
    const projectMapping = await migrateProjectsStep1(payload, stats)
    console.log(`✓ Migrated ${stats.projectsMigrated} projects\n`)

    // Step 2: Update Orders with projectRef
    console.log('Step 2: Updating Orders with projectRef...')
    await updateOrdersStep2(payload, projectMapping, stats)
    console.log(`✓ Updated ${stats.ordersMigrated} orders\n`)

    // Print summary
    printMigrationSummary(stats)

    return stats
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    stats.errors.push({
      step: 'migration',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    })
    printMigrationSummary(stats)
    throw error
  }
}

/**
 * Step 1: Migrate projects array → Projects collection (linked directly to ClientAccounts)
 */
async function migrateProjectsStep1(
  payload: Awaited<ReturnType<typeof getPayload>>,
  stats: MigrationStats
): Promise<Map<string, string>> {
  const projectMapping = new Map<string, string>() // "clientAccountId:projectName" → projectId

  try {
    // Fetch all client accounts with their projects array
    const { docs: clientAccounts } = await payload.find({
      collection: 'client-accounts',
      limit: 1000,
      depth: 0,
    })

    let totalProjectsToMigrate = 0
    for (const account of clientAccounts as ClientAccount[]) {
      if (account.projects && Array.isArray(account.projects)) {
        totalProjectsToMigrate += account.projects.length
      }
    }

    if (totalProjectsToMigrate === 0) {
      console.log('No projects found to migrate')
      return projectMapping
    }

    console.log(`Found ${totalProjectsToMigrate} projects to migrate`)

    for (const account of clientAccounts as ClientAccount[]) {
      if (!account.projects || !Array.isArray(account.projects) || account.projects.length === 0) {
        continue
      }

      for (const projectData of account.projects) {
        try {
          const projectKey = `${account.id}:${projectData.name}`

          // Check if project already migrated (idempotency)
          const existing = await payload.find({
            collection: 'projects',
            where: {
              and: [
                { name: { equals: projectData.name } },
                { client: { equals: account.id } },
              ],
            },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            console.log(`  ⊘ Project already migrated: ${projectData.name}`)
            projectMapping.set(projectKey, (existing.docs[0] as Project).id)
            continue
          }

          // Create new Project record
          const project = (await payload.create({
            collection: 'projects',
            data: {
              name: projectData.name || 'Untitled Project',
              description: projectData.description,
              status: normalizeStatus(projectData.status),
              client: account.id, // Link directly to ClientAccount
              startDate: projectData.startDate,
              projectedEndDate: projectData.endDate,
              budgetAmount: projectData.budget,
              currency: 'USD',
            },
          })) as Project

          projectMapping.set(projectKey, project.id)
          stats.projectsMigrated++

          console.log(`  ✓ Migrated project: ${projectData.name} for ${account.name} (${project.id})`)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          console.log(`  ✗ Error migrating project ${projectData.name}: ${errorMsg}`)
          stats.errors.push({
            step: 'Step 1: Migrate Projects',
            error: errorMsg,
            details: {
              clientAccountId: account.id,
              projectName: projectData.name,
            },
          })
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    stats.errors.push({
      step: 'Step 1: Migrate Projects',
      error: errorMsg,
      details: error,
    })
    throw error
  }

  return projectMapping
}


/**
 * Step 2: Update Orders with projectRef
 */
async function updateOrdersStep2(
  payload: Awaited<ReturnType<typeof getPayload>>,
  projectMapping: Map<string, string>,
  stats: MigrationStats
): Promise<void> {
  try {
    // Fetch all orders with a project field set
    const { docs: allOrders } = await payload.find({
      collection: 'orders',
      limit: 10000,
      depth: 0,
    })

    const ordersWithProject = allOrders.filter((order: Order) => order.project)

    if (ordersWithProject.length === 0) {
      console.log('No orders with project field found')
      return
    }

    console.log(`Found ${ordersWithProject.length} orders with project field`)

    for (const order of ordersWithProject as Order[]) {
      try {
        // Skip if projectRef already set (idempotency)
        if (order.projectRef) {
          console.log(`  ⊘ Order ${order.orderNumber} already has projectRef`)
          continue
        }

        const clientAccountId = typeof order.clientAccount === 'string'
          ? order.clientAccount
          : (order.clientAccount as any)?.id

        if (!clientAccountId) {
          console.log(`  ⊘ Order ${order.orderNumber} has no clientAccount`)
          continue
        }

        const projectKey = `${clientAccountId}:${order.project}`
        const projectId = projectMapping.get(projectKey)

        if (projectId) {
          await payload.update({
            collection: 'orders',
            id: order.id,
            data: {
              projectRef: projectId,
            },
          })
          stats.ordersMigrated++
          console.log(`  ✓ Updated order ${order.orderNumber} with projectRef`)
        } else {
          console.log(`  ⊘ Project not found for order ${order.orderNumber}: "${projectKey}"`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.log(`  ✗ Error updating order ${order.orderNumber}: ${errorMsg}`)
        stats.errors.push({
          step: 'Step 2: Update Orders',
          error: errorMsg,
          details: {
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
        })
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    stats.errors.push({
      step: 'Step 2: Update Orders',
      error: errorMsg,
      details: error,
    })
    throw error
  }
}

/**
 * Normalize project status from old ClientAccount.projects format to new Projects format
 */
function normalizeStatus(status: string | undefined): 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled' {
  if (!status) return 'pending'
  const statusMap: Record<string, 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled'> = {
    'active': 'in-progress',
    'on-hold': 'on-hold',
    'completed': 'completed',
    'cancelled': 'cancelled',
  }
  return statusMap[status] || 'pending'
}

/**
 * Print migration summary
 */
function printMigrationSummary(stats: MigrationStats): void {
  console.log('========================================')
  console.log('Migration Summary')
  console.log('========================================')
  console.log(`Projects migrated: ${stats.projectsMigrated}`)
  console.log(`Orders updated: ${stats.ordersMigrated}`)

  if (stats.errors.length > 0) {
    console.log(`\nErrors encountered: ${stats.errors.length}`)
    console.log('----------------------------------------')
    for (const error of stats.errors) {
      console.log(`\n[${error.step}]`)
      console.log(`  Error: ${error.error}`)
      if (error.details) {
        console.log(`  Details: ${JSON.stringify(error.details, null, 2)}`)
      }
    }
  } else {
    console.log('\nMigration completed successfully with no errors!')
  }

  console.log('\n========================================\n')
}
