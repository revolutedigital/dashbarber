import { NextRequest, NextResponse } from 'next/server'
import { syncAllStaleAccounts } from '@/lib/jobs/sync-ad-data'

/**
 * GET /api/cron/sync - Cron job endpoint to sync stale ad accounts
 * Protected by CRON_SECRET env var
 * Configure in vercel.json:
 * { "crons": [{ "path": "/api/cron/sync", "schedule": "0 * * * *" }] }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await syncAllStaleAccounts()

    const summary = {
      total: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results.map((r) => ({
        connectionId: r.connectionId,
        platform: r.platform,
        success: r.success,
        recordsUpserted: r.recordsUpserted,
        error: r.error,
      })),
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
