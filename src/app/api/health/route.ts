import { NextResponse } from 'next/server'

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  version: string
  uptime: number
  checks: {
    name: string
    status: 'pass' | 'fail'
    message?: string
  }[]
}

// Track server start time
const serverStartTime = Date.now()

/**
 * Health check endpoint for monitoring and load balancers
 * GET /api/health
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const checks: HealthCheckResponse['checks'] = []

  // Check 1: Memory usage
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

    checks.push({
      name: 'memory',
      status: usagePercent < 90 ? 'pass' : 'fail',
      message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`,
    })
  }

  // Check 2: Environment variables
  const hasApiKey = !!process.env.NEXT_PUBLIC_API_KEY
  checks.push({
    name: 'config',
    status: hasApiKey ? 'pass' : 'fail',
    message: hasApiKey ? 'API key configured' : 'API key missing',
  })

  // Check 3: Runtime
  checks.push({
    name: 'runtime',
    status: 'pass',
    message: `Node ${process.version}`,
  })

  // Determine overall status
  const failedChecks = checks.filter(c => c.status === 'fail')
  let status: HealthCheckResponse['status'] = 'ok'
  if (failedChecks.length > 0) {
    status = failedChecks.length === checks.length ? 'error' : 'degraded'
  }

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: Math.round((Date.now() - serverStartTime) / 1000),
    checks,
  }

  // Return appropriate status code
  const statusCode = status === 'ok' ? 200 : status === 'degraded' ? 200 : 503

  return NextResponse.json(response, { status: statusCode })
}
