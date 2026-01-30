import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string; metricId: string }> }

/**
 * GET /api/v1/workspaces/:id/metrics/custom/:metricId - Get custom metric
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId, metricId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'custom_metrics.read')
  if (isAuthError(authResult)) return authResult

  const metric = await prisma.customMetric.findUnique({
    where: { id: metricId, workspaceId },
  })

  if (!metric) {
    return notFoundResponse('Métrica customizada')
  }

  return successResponse(metric)
}

/**
 * PATCH /api/v1/workspaces/:id/metrics/custom/:metricId - Update custom metric
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { workspaceId, metricId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'custom_metrics.update')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.customMetric.findUnique({
    where: { id: metricId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Métrica customizada')
  }

  const body = await request.json()
  const { name, formula, format, description, color } = body

  const updateData: Record<string, unknown> = {}

  if (name && typeof name === 'string') {
    updateData.name = name.trim()
  }

  if (formula && typeof formula === 'string') {
    updateData.formula = formula
  }

  if (format) {
    const validFormats = ['CURRENCY', 'PERCENTAGE', 'NUMBER', 'DECIMAL']
    if (!validFormats.includes(format)) {
      return errorResponse('VALIDATION', `Formato inválido. Use: ${validFormats.join(', ')}`)
    }
    updateData.format = format
  }

  if (description !== undefined) {
    updateData.description = description?.trim() || null
  }

  if (color && typeof color === 'string') {
    updateData.color = color
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse('VALIDATION', 'Nenhum campo para atualizar')
  }

  const metric = await prisma.customMetric.update({
    where: { id: metricId },
    data: updateData,
  })

  return successResponse(metric)
}

/**
 * DELETE /api/v1/workspaces/:id/metrics/custom/:metricId - Delete custom metric
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { workspaceId, metricId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'custom_metrics.delete')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.customMetric.findUnique({
    where: { id: metricId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Métrica customizada')
  }

  await prisma.customMetric.delete({ where: { id: metricId } })

  return successResponse({ deleted: true })
}
