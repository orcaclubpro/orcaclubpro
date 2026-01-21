/**
 * Simple MongoDB cleanup script to remove orderType field
 * Run with: bun scripts/cleanup-ordertype-simple.mjs
 */

import { MongoClient } from 'mongodb'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read .env file
const envPath = join(__dirname, '..', '.env')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (error) {
  console.error('Warning: Could not read .env file')
}

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
