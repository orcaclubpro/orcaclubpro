/**
 * Direct MongoDB Connection
 *
 * Provides direct MongoDB access to bypass PayloadCMS when needed.
 * Used for scenarios where PayloadCMS safeFetch has compatibility issues (e.g., Bun runtime).
 */

import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

/**
 * Get direct MongoDB connection
 * Reuses existing connection if available
 */
export async function getMongoDb(): Promise<Db> {
  if (db) {
    return db
  }

  const uri = process.env.DATABASE_URI

  if (!uri) {
    throw new Error('DATABASE_URI environment variable is not set')
  }

  client = new MongoClient(uri)
  await client.connect()

  // Extract database name from connection string
  const dbName = uri.split('/').pop()?.split('?')[0]

  if (!dbName) {
    throw new Error('Could not extract database name from DATABASE_URI')
  }

  db = client.db(dbName)

  return db
}

/**
 * Close MongoDB connection
 * Call this on application shutdown
 */
export async function closeMongoDb(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}
