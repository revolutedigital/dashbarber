import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/metrics - Get aggregated metrics
 * Query params:
 *   - startDate: YYYY-MM-DD (defaults to 30 days ago)
 *   - endDate: YYYY-MM-DD (defaults to today)
 *   - accountId: specific ad account (optional filter)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'metrics.read')
  if (isAuthError(authResult)) return authResult

  const { searchParams } = request.nextUrl

  // Parse date range
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : new Date()
  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Optional filters
  const accountId = searchParams.get('accountId')

  // Build where clause
  const where: Record<string, unknown> = {
    workspaceId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (accountId) where.adAccountId = accountId

  // Get daily metrics
  const dailyMetrics = await prisma.dailyMetric.findMany({
    where,
    orderBy: { date: 'asc' },
  })

  // Calculate aggregated totals (convert Decimal to number)
  const totals = dailyMetrics.reduce(
    (acc, m) => ({
      amountSpent: acc.amountSpent + Number(m.amountSpent ?? 0),
      impressions: acc.impressions + (m.impressions ?? 0),
      reach: acc.reach + (m.reach ?? 0),
      clicksAll: acc.clicksAll + (m.clicksAll ?? 0),
      uniqueLinkClicks: acc.uniqueLinkClicks + (m.uniqueLinkClicks ?? 0),
      purchases: acc.purchases + (m.purchases ?? 0),
      purchaseValue: acc.purchaseValue + Number(m.purchaseValue ?? 0),
      leads: acc.leads + (m.leads ?? 0),
      addToCart: acc.addToCart + (m.addToCart ?? 0),
      initiateCheckout: acc.initiateCheckout + (m.initiateCheckout ?? 0),
    }),
    {
      amountSpent: 0,
      impressions: 0,
      reach: 0,
      clicksAll: 0,
      uniqueLinkClicks: 0,
      purchases: 0,
      purchaseValue: 0,
      leads: 0,
      addToCart: 0,
      initiateCheckout: 0,
    }
  )

  // Calculate derived metrics
  const cpm = totals.impressions > 0 ? (totals.amountSpent / totals.impressions) * 1000 : 0
  const cpc = totals.clicksAll > 0 ? totals.amountSpent / totals.clicksAll : 0
  const ctr = totals.impressions > 0 ? (totals.clicksAll / totals.impressions) * 100 : 0
  const roas = totals.amountSpent > 0 ? totals.purchaseValue / totals.amountSpent : 0
  const costPerPurchase = totals.purchases > 0 ? totals.amountSpent / totals.purchases : 0
  const conversionRate = totals.clicksAll > 0 ? (totals.purchases / totals.clicksAll) * 100 : 0

  return successResponse({
    period: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days: dailyMetrics.length,
    },
    totals: {
      ...totals,
      cpm,
      cpc,
      ctr,
      roas,
      costPerPurchase,
      conversionRate,
    },
    daily: dailyMetrics.map((m) => ({
      date: m.date.toISOString().split('T')[0],
      adAccountId: m.adAccountId,
      amountSpent: Number(m.amountSpent),
      impressions: m.impressions,
      reach: m.reach,
      clicksAll: m.clicksAll,
      uniqueLinkClicks: m.uniqueLinkClicks,
      purchases: m.purchases,
      purchaseValue: m.purchaseValue ? Number(m.purchaseValue) : null,
      leads: m.leads,
    })),
  })
}
