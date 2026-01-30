import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/goals - List goals
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'goals.read')
  if (isAuthError(authResult)) return authResult

  const goals = await prisma.goal.findMany({
    where: { workspaceId },
    include: {
      customMetric: {
        select: { id: true, name: true, formula: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(goals)
}

/**
 * POST /api/v1/workspaces/:id/goals - Create a goal
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'goals.create')
  if (isAuthError(authResult)) return authResult

  const body = await request.json()
  const { metricName, metricKey, targetValue, targetType = 'MAX', customMetricId, funnelId } = body

  if (!metricName || typeof metricName !== 'string' || metricName.trim().length < 2) {
    return errorResponse('VALIDATION', 'Nome da métrica deve ter pelo menos 2 caracteres')
  }

  if (!metricKey || typeof metricKey !== 'string') {
    return errorResponse('VALIDATION', 'Chave da métrica é obrigatória')
  }

  if (!targetValue || typeof targetValue !== 'number' || targetValue <= 0) {
    return errorResponse('VALIDATION', 'Valor alvo deve ser um número positivo')
  }

  const validTargetTypes = ['MIN', 'MAX']
  if (!validTargetTypes.includes(targetType)) {
    return errorResponse('VALIDATION', `Tipo de meta inválido. Use: ${validTargetTypes.join(', ')}`)
  }

  const goal = await prisma.goal.create({
    data: {
      workspaceId,
      metricName: metricName.trim(),
      metricKey,
      targetValue,
      targetType,
      customMetricId,
      funnelId,
    },
    include: {
      customMetric: {
        select: { id: true, name: true, formula: true },
      },
    },
  })

  return successResponse(goal, undefined, 201)
}
