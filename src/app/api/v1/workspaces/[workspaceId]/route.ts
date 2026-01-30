import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id - Get workspace details
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'workspace.read')
  if (isAuthError(authResult)) return authResult

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      adAccounts: {
        select: {
          id: true,
          platform: true,
          accountId: true,
          accountName: true,
          syncStatus: true,
          lastSyncAt: true,
          isActive: true,
        },
      },
      webhookEndpoints: {
        select: {
          id: true,
          name: true,
          platform: true,
          isActive: true,
          lastReceivedAt: true,
          totalReceived: true,
        },
      },
      _count: {
        select: {
          dailyMetrics: true,
          salesData: true,
          customMetrics: true,
          goals: true,
          funnels: true,
        },
      },
    },
  })

  if (!workspace) return notFoundResponse('Workspace')

  return successResponse(workspace)
}

/**
 * PATCH /api/v1/workspaces/:id - Update workspace
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'workspace.update')
  if (isAuthError(authResult)) return authResult

  const body = await request.json()
  const { name, settings } = body

  const updateData: Record<string, unknown> = {}
  if (name && typeof name === 'string') updateData.name = name.trim()
  if (settings) updateData.settings = settings

  if (Object.keys(updateData).length === 0) {
    return errorResponse('VALIDATION', 'Nenhum campo para atualizar')
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: updateData,
  })

  return successResponse(workspace)
}

/**
 * DELETE /api/v1/workspaces/:id - Delete workspace
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'workspace.delete')
  if (isAuthError(authResult)) return authResult

  await prisma.workspace.delete({ where: { id: workspaceId } })

  return successResponse({ deleted: true })
}
