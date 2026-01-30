import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string; accountId: string }> }

/**
 * GET /api/v1/workspaces/:id/ad-accounts/:accountId - Get ad account details
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId, accountId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'ad_account.read')
  if (isAuthError(authResult)) return authResult

  const account = await prisma.adAccountConnection.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      platform: true,
      accountId: true,
      accountName: true,
      syncStatus: true,
      lastSyncAt: true,
      syncError: true,
      isActive: true,
      syncFrequency: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!account || account.id !== accountId) {
    return notFoundResponse('Conta de anúncios')
  }

  return successResponse(account)
}

/**
 * PATCH /api/v1/workspaces/:id/ad-accounts/:accountId - Update ad account
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { workspaceId, accountId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'ad_account.update')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.adAccountConnection.findFirst({
    where: { id: accountId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Conta de anúncios')
  }

  const body = await request.json()
  const { accountName, syncFrequency, isActive } = body

  const updateData: Record<string, unknown> = {}
  if (accountName && typeof accountName === 'string') updateData.accountName = accountName.trim()
  if (syncFrequency && typeof syncFrequency === 'number') {
    if (syncFrequency < 15 || syncFrequency > 1440) {
      return errorResponse('VALIDATION', 'Frequência de sync deve ser entre 15 e 1440 minutos')
    }
    updateData.syncFrequency = syncFrequency
  }
  if (typeof isActive === 'boolean') updateData.isActive = isActive

  if (Object.keys(updateData).length === 0) {
    return errorResponse('VALIDATION', 'Nenhum campo para atualizar')
  }

  const account = await prisma.adAccountConnection.update({
    where: { id: accountId },
    data: updateData,
    select: {
      id: true,
      platform: true,
      accountId: true,
      accountName: true,
      syncStatus: true,
      lastSyncAt: true,
      syncError: true,
      isActive: true,
      syncFrequency: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return successResponse(account)
}

/**
 * DELETE /api/v1/workspaces/:id/ad-accounts/:accountId - Disconnect ad account
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { workspaceId, accountId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'ad_account.disconnect')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.adAccountConnection.findFirst({
    where: { id: accountId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Conta de anúncios')
  }

  // Delete the connection (metrics will be kept for history)
  await prisma.adAccountConnection.delete({ where: { id: accountId } })

  return successResponse({ deleted: true })
}
