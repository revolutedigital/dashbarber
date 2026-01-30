import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/ad-accounts - List connected ad accounts
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'ad_account.read')
  if (isAuthError(authResult)) return authResult

  const accounts = await prisma.adAccountConnection.findMany({
    where: { workspaceId },
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
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(accounts)
}
