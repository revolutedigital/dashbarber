import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { matchesAllRules } from '@/lib/funnel-filter'
import { FilterRule } from '@/types/funnel'

// ============================================
// TIPOS DE RESPOSTA
// ============================================

interface FunnelWithMetrics {
  id: string
  name: string
  color?: string
  description?: string
  data: DailyMetricData[]
}

interface DailyMetricData {
  day: string
  // Básicos
  amountSpent: number
  reach: number
  impressions: number
  clicksAll: number
  uniqueLinkClicks: number
  // Conversões
  purchases: number
  purchaseValue: number
  leads: number
  addToCart: number
  initiateCheckout: number
  // Landing Page
  landingPageViews: number
  costPerLandingPageView: number
  // Video
  videoViews3s: number
  videoThruPlays: number
  videoP25: number
  videoP50: number
  videoP75: number
  videoP100: number
  videoAvgWatchTime: number
  // Calculated by Meta
  frequency: number
  cpm: number
  cpc: number
  ctrLink: number
  // Derived (calculated here)
  connectRate: number
  cpa: number
  txConv: number
  roas: number
  hookRate: number
  holdRate: number
  cpl: number
}

// Tipo para métrica do banco com relações
type MetricWithRelations = {
  id: string
  date: Date
  spend: Prisma.Decimal
  reach: number
  impressions: number
  clicks: number
  linkClicks: number
  purchases: number
  purchaseValue: Prisma.Decimal
  leads: number
  addToCart: number
  initiateCheckout: number
  landingPageViews: number
  costPerLandingPageView: Prisma.Decimal
  videoViews3s: number
  videoThruPlays: number
  videoP25: number
  videoP50: number
  videoP75: number
  videoP100: number
  videoAvgWatchTime: Prisma.Decimal
  frequency: Prisma.Decimal
  cpm: Prisma.Decimal
  cpc: Prisma.Decimal
  ctr: Prisma.Decimal
  campaign: { id: string; name: string; metaCampaignId: string } | null
  adSet: { id: string; name: string; metaAdSetId: string } | null
  ad: { id: string; name: string; metaAdId: string } | null
}

// ============================================
// HELPERS
// ============================================

function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return numerator / denominator
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day}/${month}`
}

function transformMetric(metric: MetricWithRelations): DailyMetricData {
  const spend = Number(metric.spend)
  const purchaseValue = Number(metric.purchaseValue)
  const linkClicks = metric.linkClicks
  const impressions = metric.impressions
  const purchases = metric.purchases
  const leads = metric.leads
  const videoViews3s = metric.videoViews3s

  return {
    day: formatDate(metric.date),
    // Básicos
    amountSpent: spend,
    reach: metric.reach,
    impressions: metric.impressions,
    clicksAll: metric.clicks,
    uniqueLinkClicks: linkClicks,
    // Conversões
    purchases: metric.purchases,
    purchaseValue: purchaseValue,
    leads: metric.leads,
    addToCart: metric.addToCart,
    initiateCheckout: metric.initiateCheckout,
    // Landing Page
    landingPageViews: metric.landingPageViews,
    costPerLandingPageView: Number(metric.costPerLandingPageView),
    // Video
    videoViews3s: metric.videoViews3s,
    videoThruPlays: metric.videoThruPlays,
    videoP25: metric.videoP25,
    videoP50: metric.videoP50,
    videoP75: metric.videoP75,
    videoP100: metric.videoP100,
    videoAvgWatchTime: Number(metric.videoAvgWatchTime),
    // Meta-calculated
    frequency: Number(metric.frequency),
    cpm: Number(metric.cpm),
    cpc: Number(metric.cpc),
    ctrLink: Number(metric.ctr),
    // Derived metrics
    connectRate: safeDivide(linkClicks, impressions) * 100,
    cpa: safeDivide(spend, purchases),
    txConv: safeDivide(purchases, linkClicks) * 100,
    roas: safeDivide(purchaseValue, spend),
    hookRate: safeDivide(videoViews3s, impressions) * 100,
    holdRate: safeDivide(metric.videoThruPlays, videoViews3s) * 100,
    cpl: safeDivide(spend, leads),
  }
}

function aggregateMetricsByDate(metrics: MetricWithRelations[]): DailyMetricData[] {
  // Group by date
  const byDate = new Map<string, MetricWithRelations[]>()
  for (const m of metrics) {
    const key = m.date.toISOString()
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(m)
  }

  // Aggregate each day
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, dayMetrics]) => {
      const aggregated = dayMetrics.reduce(
        (acc, m) => ({
          ...acc,
          spend: acc.spend.add(m.spend),
          reach: acc.reach + m.reach,
          impressions: acc.impressions + m.impressions,
          clicks: acc.clicks + m.clicks,
          linkClicks: acc.linkClicks + m.linkClicks,
          purchases: acc.purchases + m.purchases,
          purchaseValue: acc.purchaseValue.add(m.purchaseValue),
          leads: acc.leads + m.leads,
          addToCart: acc.addToCart + m.addToCart,
          initiateCheckout: acc.initiateCheckout + m.initiateCheckout,
          landingPageViews: acc.landingPageViews + m.landingPageViews,
          videoViews3s: acc.videoViews3s + m.videoViews3s,
          videoThruPlays: acc.videoThruPlays + m.videoThruPlays,
          videoP25: acc.videoP25 + m.videoP25,
          videoP50: acc.videoP50 + m.videoP50,
          videoP75: acc.videoP75 + m.videoP75,
          videoP100: acc.videoP100 + m.videoP100,
        }),
        {
          id: '',
          date: dayMetrics[0].date,
          spend: new Prisma.Decimal(0),
          reach: 0,
          impressions: 0,
          clicks: 0,
          linkClicks: 0,
          purchases: 0,
          purchaseValue: new Prisma.Decimal(0),
          leads: 0,
          addToCart: 0,
          initiateCheckout: 0,
          landingPageViews: 0,
          costPerLandingPageView: new Prisma.Decimal(0),
          videoViews3s: 0,
          videoThruPlays: 0,
          videoP25: 0,
          videoP50: 0,
          videoP75: 0,
          videoP100: 0,
          videoAvgWatchTime: new Prisma.Decimal(0),
          frequency: new Prisma.Decimal(0),
          cpm: new Prisma.Decimal(0),
          cpc: new Prisma.Decimal(0),
          ctr: new Prisma.Decimal(0),
          campaign: null,
          adSet: null,
          ad: null,
        }
      )

      // Recalculate derived metrics
      const spend = Number(aggregated.spend)
      aggregated.frequency = new Prisma.Decimal(
        safeDivide(aggregated.impressions, aggregated.reach)
      )
      aggregated.cpm = new Prisma.Decimal(
        safeDivide(spend, aggregated.impressions) * 1000
      )
      aggregated.cpc = new Prisma.Decimal(safeDivide(spend, aggregated.clicks))
      aggregated.ctr = new Prisma.Decimal(
        safeDivide(aggregated.linkClicks, aggregated.impressions) * 100
      )
      aggregated.costPerLandingPageView = new Prisma.Decimal(
        safeDivide(spend, aggregated.landingPageViews)
      )

      return transformMetric(aggregated)
    })
}

// ============================================
// GET METRICS
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Query parameters
  const funnelId = searchParams.get('funnel')
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')

  try {
    // Build date filter
    const dateFilter: Prisma.DailyMetricWhereInput = {}
    if (startDate) {
      dateFilter.date = { ...dateFilter.date as object, gte: new Date(startDate) }
    }
    if (endDate) {
      dateFilter.date = { ...dateFilter.date as object, lte: new Date(endDate) }
    }

    // Get all custom funnels
    const funnelConfigs = await prisma.funnelConfig.findMany({
      where: {
        isActive: true,
        ...(funnelId ? { id: funnelId } : {}),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })

    // Get all metrics with campaign data for filtering
    const allMetrics = await prisma.dailyMetric.findMany({
      where: {
        ...dateFilter,
        campaignId: { not: null },
      },
      include: {
        campaign: {
          select: { id: true, name: true, metaCampaignId: true },
        },
        adSet: {
          select: { id: true, name: true, metaAdSetId: true },
        },
        ad: {
          select: { id: true, name: true, metaAdId: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    // Build funnels based on custom rules
    const funnels: FunnelWithMetrics[] = []

    for (const config of funnelConfigs) {
      const rules = config.rules as unknown as FilterRule[]

      // Filter metrics based on rules
      const matchingMetrics = allMetrics.filter((metric) => {
        return matchesAllRules(
          {
            campaignName: metric.campaign?.name,
            campaignId: metric.campaign?.metaCampaignId,
            adSetName: metric.adSet?.name,
            adSetId: metric.adSet?.metaAdSetId,
            adName: metric.ad?.name,
            adId: metric.ad?.metaAdId,
          },
          rules
        )
      })

      // Aggregate metrics by date
      const aggregatedData = aggregateMetricsByDate(matchingMetrics)

      funnels.push({
        id: config.id,
        name: config.name,
        color: config.color || undefined,
        description: config.description || undefined,
        data: aggregatedData,
      })
    }

    // If no custom funnels exist, create one funnel per campaign (legacy behavior)
    if (funnelConfigs.length === 0) {
      const campaignMap = new Map<string, MetricWithRelations[]>()

      for (const metric of allMetrics) {
        if (metric.campaign) {
          const key = metric.campaign.id
          if (!campaignMap.has(key)) {
            campaignMap.set(key, [])
          }
          campaignMap.get(key)!.push(metric)
        }
      }

      for (const [campaignId, metrics] of campaignMap) {
        const campaign = metrics[0].campaign!
        funnels.push({
          id: campaignId,
          name: campaign.name,
          data: aggregateMetricsByDate(metrics),
        })
      }
    }

    // Get aggregated data (all funnels combined)
    const aggregatedMetrics = aggregateMetricsByDate(allMetrics)

    // Get last update time
    const lastMetric = await prisma.dailyMetric.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    })

    return NextResponse.json({
      funnels,
      aggregated: aggregatedMetrics,
      lastUpdated: lastMetric?.updatedAt?.toISOString() || new Date().toISOString(),
      source: 'postgresql',
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
