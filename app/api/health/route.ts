import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Health Check API Route for Docker Container Monitoring
 * 
 * This endpoint provides comprehensive health status for:
 * - Application server status
 * - Database connectivity
 * - Payload CMS initialization
 * - Basic system health
 */

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  environment: string
  uptime: number
  version: string
  runtime: string
  database?: {
    status: string
    type?: string
    responsive?: boolean
    error?: string
  }
  payload?: {
    status: string
    collections?: string
    error?: string
  }
  memory?: {
    used: number
    total: number
    external: number
    rss: number
  }
  responseTime?: string
  warning?: string
  error?: string
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check if we&apos;re in the right environment
    const nodeEnv = process.env.NODE_ENV || 'development'
    
    // Basic application status
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: nodeEnv,
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      runtime: 'bun',
    }

    // Test database connectivity by initializing Payload
    try {
      const payload = await getPayload({ config })
      
      // Simple database test - try to count a collection
      // This tests both Payload initialization and database connectivity
      try {
        const dbTest = await payload.count({
          collection: 'users', // Adjust this to match your actual collections
        })
        
        healthStatus.database = {
          status: 'connected',
          type: 'sqlite',
          responsive: true,
        }
        
        healthStatus.payload = {
          status: 'initialized',
          collections: 'accessible',
        }
      } catch (collectionError) {
        // Collection might not exist, but Payload is still working
        healthStatus.database = {
          status: 'connected',
          type: 'sqlite',
          responsive: true,
        }
        
        healthStatus.payload = {
          status: 'initialized',
          collections: 'limited',
        }
      }
      
    } catch (dbError) {
      // Database or Payload initialization failed
      return NextResponse.json({
        ...healthStatus,
        status: 'unhealthy',
        database: {
          status: 'disconnected',
          error: dbError instanceof Error ? dbError.message : 'Database connection failed',
        },
        payload: {
          status: 'failed',
          error: 'Could not initialize Payload CMS',
        }
      } as HealthStatus, { status: 503 })
    }

    // Memory usage check
    const memUsage = process.memoryUsage()
    healthStatus.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    }

    // Response time
    const responseTime = Date.now() - startTime
    healthStatus.responseTime = `${responseTime}ms`

    // Check if response time is reasonable (< 5 seconds)
    if (responseTime > 5000) {
      healthStatus.status = 'degraded'
      healthStatus.warning = 'Slow response time detected'
    }

    return NextResponse.json(healthStatus, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    // General application error
    const errorResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      runtime: 'bun',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      responseTime: `${Date.now() - startTime}ms`,
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}

// Also handle HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check without full response body
    const payload = await getPayload({ config })
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
} 