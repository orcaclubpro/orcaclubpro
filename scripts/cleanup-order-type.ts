/**
 * Cleanup Script: Remove orderType field from existing orders
 * Run this once after removing orderType from the Orders schema
 */

import { getPayload } from 'payload'
import config from '../src/lib/payload/payload.config'

async function cleanup() {
  console.log('🧹 Starting cleanup: Removing orderType field from orders...')

  const payload = await getPayload({ config })

  try {
    // Get the Mongoose model directly
    const OrderModel = payload.db.collections['orders']

    if (!OrderModel) {
      throw new Error('Orders collection model not found')
    }

    // Remove orderType field from all documents
    const result = await OrderModel.updateMany(
      {}, // All documents
      { $unset: { orderType: '' } }, // Remove orderType field
      { strict: false } // Allow field removal even if not in schema
    )

    console.log(`✅ Successfully removed orderType field from ${result.modifiedCount} orders`)

    // Verify
    const orderWithType = await OrderModel.findOne({ orderType: { $exists: true } })
    if (orderWithType) {
      console.warn('⚠️  Warning: Some orders still have orderType field')
    } else {
      console.log('✅ Verification passed: No orders have orderType field')
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }

  process.exit(0)
}

cleanup()
