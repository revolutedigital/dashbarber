import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string; goalId: string }> }

/**
 * GET /api/v1/workspaces/:id/goals/:goalId - Get goal details with progress
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId, goalId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'goals.read')
  if (isAuthError(authResult)) return authResult

  const goal = await prisma.goal.findUnique({
    where: { id: goalId, workspaceId },
    include: {
      customMetric: {
        select: { id: true, name: true, formula: true },
      },
    },
  })

  if (!goal) {
    return notFoundResponse('Meta')
  }

  // Get date range (current month)
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get metrics for the period
  const metrics = await prisma.dailyMetric.aggregate({
    where: {
      workspaceId,
      date: { gte: startDate, lte: now },
    },
    _sum: {
      amountSpent: true,
      impressions: true,
      reach: true,
      clicksAll: true,
      purchases: true,
      purchaseValue: true,
      leads: true,
    },
  })

  // Calculate current value based on metric key
  let currentValue = 0
  const sums = metrics._sum

  switch (goal.metricKey) {
    case 'amountSpent':
      currentValue = Number(sums.amountSpent) || 0
      break
    case 'impressions':
      currentValue = sums.impressions || 0
      break
    case 'reach':
      currentValue = sums.reach || 0
      break
    case 'clicksAll':
      currentValue = sums.clicksAll || 0
      break
    case 'purchases':
      currentValue = sums.purchases || 0
      break
    case 'purchaseValue':
      currentValue = Number(sums.purchaseValue) || 0
      break
    case 'leads':
      currentValue = sums.leads || 0
      break
    case 'roas':
      currentValue =
        sums.amountSpent && Number(sums.amountSpent) > 0
          ? (Number(sums.purchaseValue) || 0) / Number(sums.amountSpent)
          : 0
      break
    case 'cpa':
      currentValue =
        sums.purchases && sums.purchases > 0
          ? (Number(sums.amountSpent) || 0) / sums.purchases
          : 0
      break
    default:
      currentValue = 0
  }

  const targetValue = Number(goal.targetValue)
  const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0

  return successResponse({
    ...goal,
    targetValue,
    progress: {
      currentValue,
      targetValue,
      percentage: Math.min(100, Math.round(progress * 10) / 10),
      period: {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      },
    },
  })
}

/**
 * PATCH /api/v1/workspaces/:id/goals/:goalId - Update goal
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { workspaceId, goalId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'goals.update')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.goal.findUnique({
    where: { id: goalId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Meta')
  }

  const body = await request.json()
  const { metricName, targetValue, targetType } = body

  const updateData: Record<string, unknown> = {}
  if (metricName && typeof metricName === 'string') updateData.metricName = metricName.trim()
  if (targetValue && typeof targetValue === 'number' && targetValue > 0) {
    updateData.targetValue = targetValue
  }
  if (targetType && ['MIN', 'MAX'].includes(targetType)) {
    updateData.targetType = targetType
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse('VALIDATION', 'Nenhum campo para atualizar')
  }

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: updateData,
    include: {
      customMetric: {
        select: { id: true, name: true, formula: true },
      },
    },
  })

  return successResponse(goal)
}

/**
 * DELETE /api/v1/workspaces/:id/goals/:goalId - Delete goal
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { workspaceId, goalId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'goals.delete')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.goal.findUnique({
    where: { id: goalId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Meta')
  }

  await prisma.goal.delete({ where: { id: goalId } })

  return successResponse({ deleted: true })
}
