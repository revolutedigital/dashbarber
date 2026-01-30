import { prisma } from '@/lib/prisma'
import { GoogleAdsClient, transformGoogleAdsMetrics } from '@/lib/integrations/google-ads/client'
import { MetaAdsClient, transformMetaAdsInsights } from '@/lib/integrations/meta-ads/client'

interface SyncResult {
  connectionId: string
  platform: string
  success: boolean
  recordsUpserted: number
  error?: string
}

/**
 * Sync ad data for a specific connection
 */
export async function syncAdAccountData(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.adAccountConnection.findUnique({
    where: { id: connectionId },
  })

  if (!connection) {
    return {
      connectionId,
      platform: 'UNKNOWN',
      success: false,
      recordsUpserted: 0,
      error: 'Connection not found',
    }
  }

  if (!connection.isActive) {
    return {
      connectionId,
      platform: connection.platform,
      success: false,
      recordsUpserted: 0,
      error: 'Connection is inactive',
    }
  }

  // Update sync status to SYNCING
  await prisma.adAccountConnection.update({
    where: { id: connectionId },
    data: { syncStatus: 'SYNCING' },
  })

  try {
    // Calculate date range (last 7 days by default)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    let metricsToUpsert: Array<Record<string, unknown>> = []

    if (connection.platform === 'GOOGLE_ADS') {
      const client = await GoogleAdsClient.fromConnection(connectionId)
      const metrics = await client.getDailyMetrics(startDateStr, endDateStr)
      metricsToUpsert = transformGoogleAdsMetrics(
        metrics,
        connection.workspaceId,
        connection.id
      )
    } else if (connection.platform === 'META_ADS') {
      const client = await MetaAdsClient.fromConnection(connectionId)
      const insights = await client.getDailyInsights(startDateStr, endDateStr)
      metricsToUpsert = transformMetaAdsInsights(
        insights,
        connection.workspaceId,
        connection.id
      )
    } else {
      throw new Error(`Unsupported platform: ${connection.platform}`)
    }

    // Delete existing metrics for this account in the date range and re-insert
    const dates = metricsToUpsert.map((m) => m.date as Date)
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

      await prisma.dailyMetric.deleteMany({
        where: {
          adAccountId: connection.id,
          date: { gte: minDate, lte: maxDate },
          // Only delete aggregated records (no campaign breakdown)
          campaignId: null,
        },
      })
    }

    // Create new metrics
    let recordsUpserted = 0
    for (const metric of metricsToUpsert) {
      await prisma.dailyMetric.create({
        data: metric as Parameters<typeof prisma.dailyMetric.create>[0]['data'],
      })
      recordsUpserted++
    }

    // Update connection status
    await prisma.adAccountConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: 'SUCCESS',
        lastSyncAt: new Date(),
        syncError: null,
      },
    })

    return {
      connectionId,
      platform: connection.platform,
      success: true,
      recordsUpserted,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Update connection status with error
    await prisma.adAccountConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: 'ERROR',
        syncError: errorMessage,
      },
    })

    return {
      connectionId,
      platform: connection.platform,
      success: false,
      recordsUpserted: 0,
      error: errorMessage,
    }
  }
}

/**
 * Sync all active ad accounts for a workspace
 */
export async function syncWorkspaceAdAccounts(workspaceId: string): Promise<SyncResult[]> {
  const connections = await prisma.adAccountConnection.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
  })

  const results: SyncResult[] = []

  for (const connection of connections) {
    const result = await syncAdAccountData(connection.id)
    results.push(result)
  }

  return results
}

/**
 * Sync all pending/stale ad accounts
 * Called by cron job
 */
export async function syncAllStaleAccounts(): Promise<SyncResult[]> {
  const staleThreshold = new Date()
  staleThreshold.setMinutes(staleThreshold.getMinutes() - 60) // Sync accounts not synced in 1 hour

  const connections = await prisma.adAccountConnection.findMany({
    where: {
      isActive: true,
      OR: [
        { lastSyncAt: null },
        { lastSyncAt: { lt: staleThreshold } },
        { syncStatus: 'PENDING' },
        { syncStatus: 'ERROR' },
      ],
    },
    orderBy: { lastSyncAt: 'asc' },
    take: 10, // Limit to 10 accounts per run to avoid timeouts
  })

  const results: SyncResult[] = []

  for (const connection of connections) {
    const result = await syncAdAccountData(connection.id)
    results.push(result)
  }

  return results
}
