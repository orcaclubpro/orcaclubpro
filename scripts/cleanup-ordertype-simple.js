/**
 * Simple MongoDB cleanup script to remove orderType field
 * Run with: node scripts/cleanup-ordertype-simple.js
 */

import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const mongoUrl = process.env.DATABASE_URI

if (!mongoUrl) {
  console.error('❌ DATABASE_URI not found in environment variables')
  process.exit(1)
}

async function cleanup() {
  console.log('🧹 Starting cleanup: Removing orderType field from orders...')

  const client = new MongoClient(mongoUrl)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db()
    const ordersCollection = db.collection('orders')

    // Remove orderType field from all documents
    const result = await ordersCollection.updateMany(
      {}, // All documents
      { $unset: { orderType: '' } } // Remove orderType field
    )

    console.log(`✅ Successfully processed ${result.matchedCount} orders`)
    console.log(`✅ Modified ${result.modifiedCount} orders`)

    // Verify
    const orderWithType = await ordersCollection.findOne({ orderType: { $exists: true } })
    if (orderWithType) {
      console.warn('⚠️  Warning: Some orders still have orderType field')
    } else {
      console.log('✅ Verification passed: No orders have orderType field')
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('✅ Disconnected from MongoDB')
  }

  process.exit(0)
}

cleanup()
