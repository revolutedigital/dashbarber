import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'
import { syncAdAccountData } from '@/lib/jobs/sync-ad-data'

type Params = { params: Promise<{ workspaceId: string; accountId: string }> }

/**
 * POST /api/v1/workspaces/:id/ad-accounts/:accountId/sync - Trigger manual sync
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId, accountId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'ad_account.sync')
  if (isAuthError(authResult)) return authResult

  // Verify the account belongs to this workspace
  const account = await prisma.adAccountConnection.findFirst({
    where: { id: accountId, workspaceId },
  })

  if (!account) {
    return notFoundResponse('Conta de anúncios')
  }

  if (account.syncStatus === 'SYNCING') {
    return errorResponse('CONFLICT', 'Sincronização já em andamento', 409)
  }

  // Run sync
  const result = await syncAdAccountData(accountId)

  if (!result.success) {
    return errorResponse('SYNC_FAILED', result.error || 'Falha na sincronização', 500)
  }

  return successResponse({
    message: 'Sincronização concluída',
    recordsUpserted: result.recordsUpserted,
  })
}
