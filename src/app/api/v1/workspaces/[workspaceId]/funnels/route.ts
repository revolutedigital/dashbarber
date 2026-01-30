import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/funnels - List funnels
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'funnels.read')
  if (isAuthError(authResult)) return authResult

  const funnels = await prisma.funnel.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(funnels)
}

/**
 * POST /api/v1/workspaces/:id/funnels - Create a funnel
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'funnels.create')
  if (isAuthError(authResult)) return authResult

  const body = await request.json()
  const { name, description, filterCriteria } = body as {
    name: string
    description?: string
    filterCriteria?: Record<string, unknown>
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return errorResponse('VALIDATION', 'Nome do funil deve ter pelo menos 2 caracteres')
  }

  const funnel = await prisma.funnel.create({
    data: {
      workspaceId,
      name: name.trim(),
      description: description?.trim(),
      filterCriteria: filterCriteria as Prisma.InputJsonValue,
    },
  })

  return successResponse(funnel, undefined, 201)
}
