import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string; funnelId: string }> }

/**
 * GET /api/v1/workspaces/:id/funnels/:funnelId - Get funnel with calculated data
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId, funnelId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'funnels.read')
  if (isAuthError(authResult)) return authResult

  const funnel = await prisma.funnel.findUnique({
    where: { id: funnelId, workspaceId },
  })

  if (!funnel) {
    return notFoundResponse('Funil')
  }

  // Get date range from query params
  const { searchParams } = request.nextUrl
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : new Date()
  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Get aggregated metrics for the period
  const metrics = await prisma.dailyMetric.aggregate({
    where: {
      workspaceId,
      date: { gte: startDate, lte: endDate },
    },
    _sum: {
      impressions: true,
      reach: true,
      clicksAll: true,
      uniqueLinkClicks: true,
      landingPageViews: true,
      addToCart: true,
      initiateCheckout: true,
      purchases: true,
      leads: true,
    },
  })

  // Build funnel stages from metrics (standard funnel)
  const sums = metrics._sum
  const stages = [
    { name: 'Impressões', metric: 'impressions', value: sums.impressions || 0 },
    { name: 'Cliques', metric: 'clicksAll', value: sums.clicksAll || 0 },
    { name: 'Landing Page Views', metric: 'landingPageViews', value: sums.landingPageViews || 0 },
    { name: 'Add to Cart', metric: 'addToCart', value: sums.addToCart || 0 },
    { name: 'Checkout Iniciado', metric: 'initiateCheckout', value: sums.initiateCheckout || 0 },
    { name: 'Compras', metric: 'purchases', value: sums.purchases || 0 },
  ].filter((s) => s.value > 0 || s.metric === 'impressions' || s.metric === 'purchases')

  // Calculate conversion rates
  const stagesWithData = stages.map((stage, index) => {
    const previousValue = index > 0 ? stages[index - 1].value : stage.value
    const conversionRate = previousValue > 0 ? (stage.value / previousValue) * 100 : 0
    const overallRate = index > 0 && stages[0].value > 0
      ? (stage.value / stages[0].value) * 100
      : 100

    return {
      ...stage,
      order: index,
      conversionRate: Math.round(conversionRate * 10) / 10,
      overallRate: Math.round(overallRate * 10) / 10,
    }
  })

  return successResponse({
    ...funnel,
    period: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
    stages: stagesWithData,
  })
}

/**
 * PATCH /api/v1/workspaces/:id/funnels/:funnelId - Update funnel
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { workspaceId, funnelId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'funnels.update')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.funnel.findUnique({
    where: { id: funnelId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Funil')
  }

  const body = await request.json()
  const { name, description, filterCriteria } = body

  const updateData: Record<string, unknown> = {}

  if (name && typeof name === 'string') {
    updateData.name = name.trim()
  }

  if (description !== undefined) {
    updateData.description = description?.trim() || null
  }

  if (filterCriteria !== undefined) {
    updateData.filterCriteria = filterCriteria as Prisma.InputJsonValue
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse('VALIDATION', 'Nenhum campo para atualizar')
  }

  const funnel = await prisma.funnel.update({
    where: { id: funnelId },
    data: updateData,
  })

  return successResponse(funnel)
}

/**
 * DELETE /api/v1/workspaces/:id/funnels/:funnelId - Delete funnel
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { workspaceId, funnelId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'funnels.delete')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.funnel.findUnique({
    where: { id: funnelId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Funil')
  }

  await prisma.funnel.delete({ where: { id: funnelId } })

  return successResponse({ deleted: true })
}
