import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/metrics/custom - List custom metrics
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'custom_metrics.read')
  if (isAuthError(authResult)) return authResult

  const metrics = await prisma.customMetric.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(metrics)
}

/**
 * POST /api/v1/workspaces/:id/metrics/custom - Create custom metric
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'custom_metrics.create')
  if (isAuthError(authResult)) return authResult

  const body = await request.json()
  const { name, formula, format, description, color } = body

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return errorResponse('VALIDATION', 'Nome da métrica deve ter pelo menos 2 caracteres')
  }

  if (!formula || typeof formula !== 'string') {
    return errorResponse('VALIDATION', 'Fórmula é obrigatória')
  }

  const validFormats = ['CURRENCY', 'PERCENTAGE', 'NUMBER', 'DECIMAL']
  if (format && !validFormats.includes(format)) {
    return errorResponse('VALIDATION', `Formato inválido. Use: ${validFormats.join(', ')}`)
  }

  const metric = await prisma.customMetric.create({
    data: {
      workspaceId,
      name: name.trim(),
      formula,
      format: format || 'NUMBER',
      description: description?.trim(),
      color: color || '#3b82f6',
    },
  })

  return successResponse(metric, undefined, 201)
}
